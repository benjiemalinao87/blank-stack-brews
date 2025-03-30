/**
 * ⚠️ CRITICAL SERVICE - DO NOT MODIFY WITHOUT CAUTION ⚠️
 * This service manages all real-time messaging functionality including:
 * - Socket.io connection management
 * - Message store and deduplication
 * - Inbound/Outbound message handling
 * 
 * Modifying this code can break the entire messaging system.
 * Any changes must be thoroughly tested in a staging environment first.
 */

import io from 'socket.io-client';

// Format phone number to E.164 format for Twilio
const formatPhoneForTwilio = (phone) => {
  if (!phone) return '';
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Add +1 prefix if not present and number is 10 digits
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  // If already has country code (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  // Return as is if already in E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return phone; // Return original if can't format
};

let socket = null;
let messageHandlers = [];
let messageStore = new Map(); // Store messages by contact phone number
let processedMessageIds = new Set(); // Track processed message IDs
let messageQueue = new Map(); // Queue for handling message processing
let twilioPhoneNumber = null; // Store Twilio phone number

// Add a message handler function
export const addMessageHandler = (handler) => {
  if (typeof handler === 'function') {
    messageHandlers.push(handler);
    return () => {
      messageHandlers = messageHandlers.filter(h => h !== handler);
    };
  }
  return () => {}; // Return empty function if handler is invalid
};

// Generate a consistent message ID across the application
const generateMessageId = (message) => {
  const timestamp = new Date(message.timestamp || message.created_at).getTime();
  const content = message.content || message.body;
  const from = message.from;
  const to = message.to;
  return `${timestamp}-${content}-${from}-${to}`;
};

// Check if a message is a duplicate using consistent logic
const isDuplicate = (message, existingMessages) => {
  const messageId = generateMessageId(message);
  
  // Check if message is already processed
  if (processedMessageIds.has(messageId)) {
    return true;
  }
  
  // Check against existing messages
  return existingMessages.some(m => (
    m.id === message.id ||
    (message.tempId && m.tempId === message.tempId) ||
    (m.content === message.content &&
     m.direction === message.direction &&
     m.from === message.from &&
     m.to === message.to &&
     Math.abs(new Date(m.timestamp || m.created_at) - new Date(message.timestamp || message.created_at)) < 2000)
  ));
};

// Process message with queue and deduplication
const processMessage = async (message) => {
  const messageId = generateMessageId(message);
  
  // If message is being processed, queue it
  if (messageQueue.has(messageId)) {
    return new Promise((resolve) => {
      const queue = messageQueue.get(messageId) || [];
      queue.push(resolve);
      messageQueue.set(messageId, queue);
    });
  }
  
  // Create new queue for this message
  messageQueue.set(messageId, []);
  
  try {
    // Get existing messages for this contact
    const contactPhone = message.direction === 'inbound' ? message.from : message.to;
    const existingMessages = messageStore.get(contactPhone) || [];
    
    // Check for duplicates
    if (isDuplicate(message, existingMessages)) {
      return false;
    }
    
    // Add to processed set with TTL
    processedMessageIds.add(messageId);
    setTimeout(() => {
      processedMessageIds.delete(messageId);
    }, 5000);
    
    // Add to message store
    if (!messageStore.has(contactPhone)) {
      messageStore.set(contactPhone, []);
    }
    
    const messages = messageStore.get(contactPhone);
    messages.push(message);
    
    // Sort messages by timestamp
    messages.sort((a, b) => 
      new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at)
    );
    
    messageStore.set(contactPhone, messages);
    
    // Process queue
    const queue = messageQueue.get(messageId);
    queue.forEach(resolve => resolve(true));
    messageQueue.delete(messageId);
    
    return true;
  } catch (error) {
    console.error('Error processing message:', error);
    const queue = messageQueue.get(messageId);
    queue.forEach(resolve => resolve(false));
    messageQueue.delete(messageId);
    return false;
  }
};

// Clear old processed messages periodically
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  processedMessageIds.forEach(messageId => {
    const [timestamp] = messageId.split('-');
    if (new Date(timestamp) < oneHourAgo) {
      processedMessageIds.delete(messageId);
    }
  });
}, 60 * 60 * 1000); // Run every hour

// Initialize Twilio phone number
const initializeTwilioConfig = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/config/twilio`);
    const data = await response.json();
    if (response.ok && data.phoneNumber) {
      twilioPhoneNumber = data.phoneNumber;
    } else {
      console.error('Failed to get Twilio configuration');
    }
  } catch (error) {
    console.error('Error getting Twilio configuration:', error);
  }
};

export const addMessageToStore = async (message) => {
  return processMessage(message);
};

export const initializeSocket = () => {
  if (socket) {
    console.log('Socket already initialized, skipping...');
    return socket;
  }

  socket = io(process.env.REACT_APP_API_URL, {
    transports: ['websocket'],
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  let messageHandlerAdded = false;

  socket.on('connect', () => {
    console.log('Socket connected with ID:', socket.id);
    
    // Only add message handler once
    if (!messageHandlerAdded) {
      socket.on('new_message', async (message) => {
        console.log('Received new message:', message);
        const isNew = await processMessage(message);
        if (isNew) {
          messageHandlers.forEach(handler => handler(message));
        } else {
          console.log('Duplicate message detected, skipping:', message);
        }
      });
      messageHandlerAdded = true;
    }
  });

  return socket;
};

export const getMessagesByContact = (contactPhone) => {
  return messageStore.get(contactPhone) || [];
};

export const sendMessage = async (message) => {
  console.log('📤 Starting message send process with full details:', {
    to: message.to,
    content: message.content,
    workspaceId: message.workspaceId,
    contactId: message.contactId,
    timestamp: new Date().toISOString()
  });
  
  // Create optimistic message before try-catch
  const optimisticMessage = {
    ...message,
    tempId: `temp-${Date.now()}-${Math.random()}`,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  
  console.log('📝 Created optimistic message:', optimisticMessage);
  
  // Add optimistic message to store
  await processMessage(optimisticMessage);
  
  try {
    // Send actual message
    const apiUrl = `${process.env.REACT_APP_API_URL || 'https://cc.automate8.com'}/api/send-message`;
    console.log('🚀 Sending message to API:', apiUrl);
    
    const requestBody = {
      to: message.to,
      content: message.content,
      workspaceId: message.workspaceId,
      contactId: message.contactId
    };
    console.log('📦 Request body:', requestBody);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📡 API Response status:', response.status);
    
    // Log the full response for debugging
    const responseText = await response.text();
    console.log('📥 Raw API Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    console.log('✅ Message sent successfully:', data);
    
    // Update optimistic message with real data
    const updatedMessage = {
      ...data.message,
      tempId: optimisticMessage.tempId,
      status: 'delivered'
    };
    
    // Replace optimistic message with real one
    const contactPhone = message.to;
    const messages = messageStore.get(contactPhone) || [];
    const optimisticIndex = messages.findIndex(m => m.tempId === optimisticMessage.tempId);
    
    if (optimisticIndex !== -1) {
      messages[optimisticIndex] = updatedMessage;
      messageStore.set(contactPhone, messages);
    }
    
    return updatedMessage;
  } catch (error) {
    console.error('❌ Error in sendMessage:', error);
    // Remove optimistic message on error
    const contactPhone = message.to;
    const messages = messageStore.get(contactPhone) || [];
    const optimisticIndex = messages.findIndex(m => m.tempId === optimisticMessage.tempId);
    
    if (optimisticIndex !== -1) {
      messages.splice(optimisticIndex, 1);
      messageStore.set(contactPhone, messages);
    }
    
    throw error;
  }
};

export {
  processMessage,
  isDuplicate,
  generateMessageId
}; 