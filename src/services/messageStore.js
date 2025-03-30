import { create } from 'zustand';
import { supabase } from './supabase';
import io from 'socket.io-client';
import socketService, { getSocketStatus, waitForConnection } from '../socket';
import { socket } from '../socket';

// Format phone number to E.164 format for Twilio
const formatPhoneForTwilio = (phone) => {
  if (!phone) {
    console.error('❌ Empty phone number provided to formatPhoneForTwilio');
    return '';
  }
  
  console.log('🔄 Formatting phone number:', phone);
  
  // If already has a plus, check if it's valid E.164 format
  if (phone.startsWith('+')) {
    // Check if it's a valid E.164 format (+ followed by digits only)
    if (/^\+\d+$/.test(phone)) {
      console.log('✅ Phone number already in E.164 format:', phone);
      return phone;
    } else {
      console.warn('⚠️ Phone number starts with + but contains non-digits');
    }
  }

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  console.log('🧹 Cleaned phone number:', cleaned);
  
  // Handle US numbers (10 digits)
  if (cleaned.length === 10) {
    const formatted = `+1${cleaned}`;
    console.log('✅ Formatted 10-digit US number:', formatted);
    return formatted;
  }
  
  // Handle US numbers with country code (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const formatted = `+${cleaned}`;
    console.log('✅ Formatted 11-digit US number with country code:', formatted);
    return formatted;
  }
  
  // Handle Australian numbers (10 digits starting with 0)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    const formatted = `+61${cleaned.substring(1)}`;
    console.log('✅ Formatted Australian number:', formatted);
    return formatted;
  }
  
  // Handle Australian numbers (9 digits not starting with 0)
  if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    const formatted = `+61${cleaned}`;
    console.log('✅ Formatted 9-digit Australian number:', formatted);
    return formatted;
  }
  
  // If no formatting rules match, add + prefix if it doesn't have one
  console.warn('⚠️ No specific formatting rule matched for phone number:', phone);
  const formatted = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  console.log('⚠️ Using generic formatting:', formatted);
  return formatted;
};

// Get API URL with fallback
const getApiUrl = () => {
  // Check for environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback to production URL
  return 'https://cc.automate8.com';
};

const isSupabaseConnected = async () => {
  try {
    const { data, error } = await supabase.rpc('ping');
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};

// Track active contact ID globally
let activeContactId = null;

// Socket connection status check
const ensureSocketConnection = async () => {
  if (!socket.connected) {
    console.log('Socket disconnected, reconnecting...');
    await new Promise((resolve) => {
      socket.connect();
      socket.once('connect', () => {
        console.log('Socket reconnected');
        // Re-register active contact if any
        if (activeContactId) {
          console.log('Re-registering contact:', activeContactId);
          socket.emit('register', `contact:${activeContactId}`);
        }
        resolve();
      });
    });
  }
};

// Check message status in database
const checkMessageStatus = async (messageId) => {
  if (!messageId) {
    console.error('❌ Cannot check message status: No message ID provided');
    return null;
  }

  try {
    console.log(`🔍 Checking status for message ID: ${messageId}`);
    const { data, error } = await supabase
      .from('messages')
      .select('id, status, twilio_sid, error_code, error_message')
      .eq('id', messageId)
      .single();

    if (error) {
      console.error('❌ Error checking message status:', error);
      throw error;
    }

    if (!data) {
      console.warn(`⚠️ No message found with ID: ${messageId}`);
      return null;
    }

    console.log(`✅ Message status: ${data.status}`, data);
    return data;
  } catch (error) {
    console.error('❌ Error checking message status:', error);
    throw error;
  }
};

// Add UUID generation function at the top with other utility functions
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const useMessageStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  currentContactId: null,
  cleanupFunction: null,
  processedMessageIds: new Set(),
  loadingContactId: null,
  messageQueue: new Map(), // Queue for handling concurrent message processing
  
  // Generate a unique message ID that includes all relevant data
  generateMessageId: (message) => {
    const timestamp = new Date(message.created_at || message.timestamp).getTime();
    const content = message.content || message.body;
    const from = message.from;
    const to = message.to;
    return `${timestamp}-${content}-${from}-${to}`;
  },

  // Enhanced message deduplication
  isDuplicate: (message, existingMessages) => {
    console.log('🔍 Checking for duplicate message:', {
      id: message.id,
      tempId: message.tempId,
      body: message.body || message.content,
      timestamp: message.created_at || message.timestamp
    });

    // Check exact ID match
    if (existingMessages.some(m => m.id === message.id)) {
      console.log('✅ Found duplicate by ID match');
      return true;
    }

    // Check temporary ID for optimistic updates
    if (message.tempId && existingMessages.some(m => m.tempId === message.tempId)) {
      console.log('✅ Found duplicate by tempId match');
      return true;
    }

    // Check content + metadata within time window
    const isDup = existingMessages.some(m => {
      const existingContent = m.body || m.content;
      const newContent = message.body || message.content;
      const existingTimestamp = new Date(m.created_at || m.timestamp).getTime();
      const newTimestamp = new Date(message.created_at || message.timestamp).getTime();
      const timeDiff = Math.abs(existingTimestamp - newTimestamp);

      const isContentMatch = existingContent === newContent;
      const isDirectionMatch = m.direction === message.direction;
      const isTimeMatch = timeDiff < 5000; // Increased to 5 seconds

      console.log('Comparing with existing message:', {
        contentMatch: isContentMatch,
        directionMatch: isDirectionMatch,
        timeDiff: timeDiff,
        isTimeMatch: isTimeMatch
      });

      return isContentMatch && isDirectionMatch && isTimeMatch;
    });

    if (isDup) {
      console.log('✅ Found duplicate by content/time match');
    }

    return isDup;
  },

  // Add a new message to the store with enhanced deduplication
  addMessage: (messageData) => {
    console.log('Adding message to store:', messageData);
    
    set(state => {
      // Skip if already processed
      if (state.processedMessageIds.has(state.generateMessageId(messageData))) {
        console.log('Message already processed, skipping');
        return state;
      }

      // Check for duplicates
      if (state.isDuplicate(messageData, state.messages)) {
        console.log('Duplicate message detected, skipping');
        return state;
      }

      // Add to processed set with TTL
      const messageId = state.generateMessageId(messageData);
      state.processedMessageIds.add(messageId);
      setTimeout(() => {
        state.processedMessageIds.delete(messageId);
      }, 5000);

      // Add new message and sort by timestamp
      const newMessages = [...state.messages, messageData].sort((a, b) => 
        new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp)
      );

      return { messages: newMessages };
    });
  },

  // Update a message in the store
  updateMessage: (messageId, updates) => {
    const state = get();
    const messages = [...state.messages];
    const index = messages.findIndex(m => m.id === messageId);
    
    if (index !== -1) {
      messages[index] = { ...messages[index], ...updates };
      set({ messages });
    }
  },

  // Initialize real-time updates for a contact with improved handling
  initializeRealtime: async (contactId) => {
    try {
      // Get contact details first
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError || !contact) {
        throw new Error('Contact not found');
      }

      // Ensure socket connection
      await waitForConnection();

      // Clean up existing listeners before setting up new ones
      socket.removeAllListeners('new_message');
      socket.removeAllListeners('recent_messages');
      socket.removeAllListeners('join_success');
      socket.removeAllListeners('message_sent');

      // Join contact room with full context
      socket.emit('join', {
        phoneNumber: contact.phone_number,
        contactId: contact.id,
        workspaceId: contact.workspace_id
      });

      // Handle inbound messages
      socket.on('new_message', (message) => {
        if (message.direction === 'inbound') {
          get().addMessage(message);
        }
      });

      // Handle outbound message confirmations
      socket.on('message_sent', (data) => {
        if (data.success && data.message && data.message.direction === 'outbound') {
          // Update existing optimistic message or add new one
          set(state => {
            const messages = [...state.messages];
            const optimisticIndex = messages.findIndex(m => m.tempId === data.message.tempId);
            
            if (optimisticIndex !== -1) {
              // Update existing optimistic message
              messages[optimisticIndex] = {
                ...messages[optimisticIndex],
                ...data.message,
                status: 'delivered'
              };
              return { messages };
            } else {
              // Add as new message if no optimistic version exists
              get().addMessage(data.message);
              return state;
            }
          });
        }
      });

      // Handle recent messages with deduplication
      socket.on('recent_messages', (messages) => {
        set(state => {
          const uniqueMessages = messages.filter(msg => !state.isDuplicate(msg, state.messages));
          
          // Merge with existing messages and sort
          const allMessages = [...state.messages, ...uniqueMessages].sort((a, b) => 
            new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp)
          );

          return { messages: allMessages };
        });
      });

      // Handle join success with timeout
      const joinSuccess = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Join room timeout'));
        }, 5000);

        socket.once('join_success', (data) => {
          clearTimeout(timeout);
          resolve(data);
        });

        socket.once('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message));
        });
      });

      // Return cleanup function
      return () => {
        socket.removeAllListeners('new_message');
        socket.removeAllListeners('recent_messages');
        socket.removeAllListeners('join_success');
        socket.removeAllListeners('message_sent');
        socket.emit('leave', { contactId: contact.id });
      };
    } catch (error) {
      console.error('❌ Error initializing realtime:', error);
      throw error;
    }
  },

  // Load messages for a contact
  loadMessages: async (contactId) => {
    set({ isLoading: true, loadingContactId: contactId });

    try {
      // Get current workspace ID from contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('workspace_id')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;
      if (!contact?.workspace_id) throw new Error('No workspace ID found for contact');

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .eq('workspace_id', contact.workspace_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ 
        messages: messages || [], 
        isLoading: false,
        loadingContactId: null,
        error: null
      });

    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ 
        error: 'Failed to load messages', 
        isLoading: false, 
        loadingContactId: null 
      });
      throw error; // Re-throw to let UI handle it
    }
  },

  // Send a new message
  sendMessage: async (contactId, content, selectedNumber) => {
    console.log('📤 Starting message send process:', { 
      contactId, 
      content: content.substring(0, 20) + (content.length > 20 ? '...' : ''), 
      selectedNumber 
    });
    
    if (!contactId || !content) {
      console.error('❌ Missing required fields for sending message');
      throw new Error('Missing required fields: contactId and content are required');
    }

    if (!selectedNumber) {
      console.error('❌ No phone number selected for sending message');
      throw new Error('Please select a phone number to send from');
    }

    // Create temporary message with proper UUID
    const messageId = generateUUID();
    const tempMessage = {
      id: messageId,
      tempId: messageId,
      contact_id: contactId,
      body: content,
      direction: 'outbound',
      created_at: new Date().toISOString(),
      status: 'pending',
      message_type: 'text'
    };
    console.log('📝 Created temporary message:', tempMessage);

    // Add message to store for immediate UI feedback
    get().addMessage(tempMessage);

    try {
      // Get contact details
      console.log('🔍 Fetching contact details for ID:', contactId);
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('workspace_id, phone_number')
        .eq('id', contactId)
        .single();

      if (contactError || !contact) {
        throw new Error(contactError?.message || 'Contact not found');
      }

      // Format phone number
      const formattedPhoneNumber = formatPhoneForTwilio(contact.phone_number);

      // Save message to Supabase with the same ID
      const { data: savedMessage, error: saveError } = await supabase
        .from('messages')
        .insert({
          id: messageId, // Use same ID as temp message
          contact_id: contactId,
          workspace_id: contact.workspace_id,
          body: content,
          direction: 'outbound',
          message_type: 'text',
          status: 'pending',
          metadata: {
            twilio_phone_numbers: {
              from: selectedNumber.phone_number,
              to: formattedPhoneNumber
            }
          }
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save message: ${saveError.message}`);
      }

      // Only emit socket event, don't make direct API calls
      socket.emit('send_message', {
        messageId, // Include consistent message ID
        to: formattedPhoneNumber,
        message: content,
        contactId,
        workspaceId: contact.workspace_id
      });

      // Wait for message_sent event
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message send timeout'));
        }, 30000);

        socket.once('message_sent', (data) => {
          clearTimeout(timeout);
          if (data.success) {
            resolve(data);
          } else {
            reject(new Error(data.error || 'Failed to send message'));
          }
        });

        socket.once('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message));
        });
      });

      // Update message status
      if (result.messageSid) {
        await supabase
          .from('messages')
          .update({ 
            status: 'sent',
            twilio_sid: result.messageSid 
          })
          .eq('id', messageId);

        get().updateMessage(messageId, { 
          status: 'sent', 
          twilio_sid: result.messageSid 
        });
      }

      return savedMessage;
    } catch (error) {
      console.error('❌ Message send error:', error);
      get().updateMessage(messageId, { status: 'failed', error: error.message });
      throw error;
    }
  },

  // Check message status
  checkMessageStatus: async (messageId) => {
    try {
      return await checkMessageStatus(messageId);
    } catch (error) {
      console.error('❌ Error in checkMessageStatus:', error);
      throw error;
    }
  },

  // Clear messages
  clearMessages: () => {
    set({ messages: [], error: null });
  },
}));

export default useMessageStore;