import React, { useState, useEffect, useRef } from 'react';
import { Box, Center, Spinner, useColorModeValue } from '@chakra-ui/react';
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import InputArea from './components/InputArea';
import { supabase } from '../../lib/supabaseUnified';
import { sendMessage } from '../../services/messageService';
import { formatPhoneNumber } from '../../utils/formatters';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { socket, waitForConnection } from '../../socket';

const ChatPopUp = ({ isOpen, onClose, contactId }) => {
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { workspace } = useWorkspace();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch contact data
  useEffect(() => {
    if (!isOpen || !contactId) return;

    const fetchContact = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .single();

        if (error) throw error;
        setContact(data);
        fetchMessages(data);
      } catch (error) {
        console.error('Error fetching contact:', error);
        setLoading(false);
      }
    };

    fetchContact();
  }, [contactId, isOpen]);

  const fetchMessages = async (contactData) => {
    if (!contactData || !contactData.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching messages for contact ID:', contactData.id);
      
      // First, get the workspace_id for the contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('workspace_id')
        .eq('id', contactData.id)
        .single();

      if (contactError) {
        console.error('Error fetching contact workspace:', contactError);
        throw contactError;
      }

      if (!contact?.workspace_id) {
        console.error('No workspace ID found for contact');
        throw new Error('No workspace ID found for contact');
      }
      
      // Fetch messages with both contact_id and workspace_id filters
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactData.id)
        .eq('workspace_id', contact.workspace_id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Messages from Supabase:', messages);
      
      if (messages && messages.length > 0) {
        setMessages(messages.map(msg => ({
          message: msg.body,
          timestamp: new Date(msg.created_at),
          isUser: msg.direction === 'outbound'
        })));
      } else {
        // If no messages, set an empty array
        setMessages([]);
        console.log('No messages found for contact ID:', contactData.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Set empty messages array on error
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!isOpen || !contactId) return;

    console.log('Setting up real-time subscription for contact ID:', contactId);
    
    // Create a unique channel name to avoid conflicts
    const channelName = `messages-popup-${contactId}-${Date.now()}`;
    
    // Subscribe to new messages for this contact
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public', 
        table: 'messages',
        filter: `contact_id=eq.${contactId}` 
      }, (payload) => {
        // Add the new message to the messages state
        console.log('Real-time event received:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          console.log('New message received via real-time:', newMessage);
          
          // Ensure we're updating state correctly by using the function form
          setMessages(prevMessages => {
            // Check if this message is already in our list (avoid duplicates)
            const messageExists = prevMessages.some(msg => 
              msg.message === newMessage.body && 
              new Date(msg.timestamp).getTime() === new Date(newMessage.created_at).getTime()
            );
            
            if (messageExists) {
              console.log('Message already exists in state, not adding duplicate');
              return prevMessages;
            }
            
            console.log('Adding new message to state');
            return [
              ...prevMessages,
              {
                message: newMessage.body,
                timestamp: new Date(newMessage.created_at),
                isUser: newMessage.direction === 'outbound'
              }
            ];
          });
        }
      })
      .subscribe((status, err) => {
        if (err) {
          console.error('Error subscribing to channel:', err);
        } else {
          console.log(`Subscription status for ${channelName}:`, status);
        }
      });

    // Also connect to socket for real-time updates
    const initializeSocket = async () => {
      try {
        await waitForConnection();
        
        // Get contact details first
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .single();

        if (contactError || !contact) {
          throw new Error('Contact not found');
        }

        // Join contact room with full context
        socket.emit('join', {
          phoneNumber: contact.phone_number,
          contactId: contact.id,
          workspaceId: contact.workspace_id
        });

        // Set up message handlers
        socket.on('new_message', (message) => {
          console.log('New message received via socket:', message);
          if (message.contact_id === contactId) {
            setMessages(prevMessages => {
              // Check for duplicates
              const messageExists = prevMessages.some(msg => 
                msg.message === message.body && 
                new Date(msg.timestamp).getTime() === new Date(message.created_at).getTime()
              );
              
              if (messageExists) {
                return prevMessages;
              }
              
              return [
                ...prevMessages,
                {
                  message: message.body,
                  timestamp: new Date(message.created_at),
                  isUser: message.direction === 'outbound'
                }
              ];
            });
          }
        });
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initializeSocket();

    // Clean up subscription and socket listeners when component unmounts
    return () => {
      console.log('Cleaning up subscriptions and socket listeners');
      supabase.removeChannel(subscription);
      socket.off('new_message');
    };
  }, [isOpen, contactId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (newMessage) => {
    if (!contact) return;

    try {
      // Add message to UI immediately for better UX
      setMessages(prevMessages => [
        ...prevMessages,
        {
          message: newMessage.message,
          timestamp: new Date(),
          isUser: true
        }
      ]);

      // No need to manually add to Supabase as InputArea handles that
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      bottom="20px"
      right="20px"
      width="350px"
      height="500px"
      borderRadius="md"
      boxShadow="xl"
      bg={bgColor}
      borderColor={borderColor}
      borderWidth="1px"
      zIndex="modal"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <Header contact={contact} onClose={onClose} />
      
      <Box flex="1" overflowY="auto" p={3}>
        {loading ? (
          <Center h="100%">
            <Spinner size="lg" color="blue.500" />
          </Center>
        ) : (
          messages.map((message, index) => (
            <ChatBubble
              key={index}
              message={message.message}
              timestamp={message.timestamp}
              isUser={message.isUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      <InputArea 
        contact={contact}
        onMessageSent={handleSendMessage}
        disabled={loading}
      />
    </Box>
  );
};

export default ChatPopUp;
