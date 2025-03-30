/**
 * ⚠️ IMPORTANT WARNING ⚠️
 * DO NOT modify the existing code in this file without thorough testing.
 * This file contains critical functionality for handling both inbound and outbound text messages.
 * Any changes could break the real-time messaging system and contact management.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Text,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  Input,
  Textarea,
  Button,
  VStack,
  Collapse,
  useDisclosure,
  Flex,
  Divider,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { X, Minus, Square, Mail } from 'lucide-react';
import { SmallCloseIcon } from '@chakra-ui/icons';
import useContactV2Store from '../../services/contactV2State';
import { initializeSocket, addMessageHandler, sendMessage, getMessagesByContact } from '../../services/messageService';
import ChatArea from './ChatArea';
import { ContactList } from './ContactList';
import { UserDetails } from './UserDetails';
import { StatusMenu } from './StatusMenu';
import Draggable from 'react-draggable';
import useMessageStore from '../../services/messageStore';
import { debounce } from 'lodash';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTwilio } from '../../contexts/TwilioContext';

/**
 * LiveChat Component
 * 
 * Main chat interface that shows filtered contacts based on conversation status
 * and handles real-time messaging through Socket.IO
 */
const LiveChat = ({ isDark, onClose, selectedContact: initialSelectedContact }) => {
  // Get workspace context
  const { currentWorkspace } = useWorkspace();
  
  // Get Twilio context
  const { getTwilioConfig } = useTwilio();

  // Get contact store methods from V2
  const {
    contacts,
    loadContacts,
    setFilters,
    updateContact,
    clearUnreadCount,
    incrementUnreadCount,
    updateLastMessage,
    searchContacts
  } = useContactV2Store();

  // Local state
  const [selectedContact, setSelectedContact] = useState(initialSelectedContact);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [socketInitialized, setSocketInitialized] = useState(false);
  const toast = useToast();
  const chatAreaRef = useRef(null);

  // Email functionality
  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const {
    isOpen: isEmailOpen,
    onOpen: onEmailOpen,
    onClose: onEmailClose
  } = useDisclosure();
  
  // Handle email functions
  const handleEmailOpen = () => {
    setIsComposingEmail(true);
    onEmailOpen();
  };
  
  const handleEmailClose = () => {
    setIsComposingEmail(false);
    onEmailClose();
    setEmailSubject('');
    setEmailBody('');
  };
  
  const handleSendEmail = async () => {
    if (!selectedContact) return;
    
    setIsSendingEmail(true);
    try {
      // Get workspace ID from selected contact
      const workspaceId = selectedContact.workspace_id;
      
      // Call the email API endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-Id': workspaceId
        },
        body: JSON.stringify({
          contactId: selectedContact.id,
          subject: emailSubject,
          content: emailBody,
          scheduledFor: null // Can be updated to support scheduling
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      // Get the response data
      const result = await response.json();
      
      toast({
        title: 'Email sent',
        description: 'Email was sent successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      handleEmailClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: `Failed to send email: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Initialize Twilio config when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      getTwilioConfig(currentWorkspace.id, { showError: true });
    }
  }, [currentWorkspace?.id, getTwilioConfig]);

  // Debounced contact setter to prevent rapid re-renders
  const debouncedSetContact = useMemo(
    () => debounce((contact) => setSelectedContact(contact), 300),
    []
  );

  // Format phone number to E.164 format
  const formatPhoneNumber = (phone) => {
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

  const { initializeRealtime, loadMessages, sendMessage, clearMessages } = useMessageStore();
  const [isLoading, setIsLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  const containerRef = useRef(null);
  const cleanupRef = useRef(null);

  // Load messages when contact changes
  useEffect(() => {
    let isSubscribed = true;

    const initializeChat = async () => {
      if (!selectedContact?.id || !isSubscribed) return;

      setIsLoading(true);
      try {
        // Clean up previous subscription
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }

        // Clear existing messages
        clearMessages();
        
        // Load messages
        await loadMessages(selectedContact.id);
        
        // Initialize real-time updates
        const cleanup = await initializeRealtime(selectedContact.id);
        cleanupRef.current = cleanup;
        
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: 'Error initializing chat',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      isSubscribed = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [selectedContact?.id, loadMessages, initializeRealtime, clearMessages, toast]);

  // Load contacts with Open status by default
  useEffect(() => {
    const loadInitialContacts = async () => {
      if (!currentWorkspace?.id) {
        console.error('No workspace ID available');
        return;
      }

      try {
        // Set workspace ID in the store using the context
        useContactV2Store.setState({ workspaceId: currentWorkspace.id });
        
        // Initialize real-time subscription for contacts
        await loadContacts(null, 50);

        // Log loaded contacts for debugging
        console.log('LiveChat - Loaded contacts:', contacts);

        // Initialize socket connection for messaging
        if (!socketInitialized) {
          await initializeSocket();
          setSocketInitialized(true);
        }

      } catch (error) {
        console.error('Error loading initial contacts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load contacts. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    loadInitialContacts();

    // Cleanup function
    return () => {
      if (socketInitialized) {
        // Cleanup socket connection
        const socket = window._socket;
        if (socket) {
          socket.disconnect();
        }
      }
    };
  }, [currentWorkspace?.id, loadContacts, initializeSocket, socketInitialized, toast]);

  // Update selected contact when contacts change
  useEffect(() => {
    if (selectedContact) {
      const updatedContact = contacts.find(c => c.id === selectedContact.id);
      if (updatedContact && updatedContact.id === selectedContact.id) {
        debouncedSetContact(updatedContact);
        
        // Also refresh messages when contact is updated
        loadMessages(updatedContact.id).catch(error => {
          console.error('Error refreshing messages:', error);
        });
      }
    }
  }, [contacts, selectedContact?.id, debouncedSetContact, loadMessages]);

  // Only set selected contact if explicitly passed
  useEffect(() => {
    if (initialSelectedContact?.id) {
      const contact = contacts.find(c => c.id === initialSelectedContact.id);
      debouncedSetContact(contact || initialSelectedContact);
    }
    return () => debouncedSetContact.cancel();
  }, [initialSelectedContact?.id, contacts, debouncedSetContact]);

  // Keep selectedContact in sync with contacts store
  useEffect(() => {
    if (selectedContact) {
      const updatedContact = contacts.find(c => c.id === selectedContact.id);
      if (updatedContact && updatedContact.id === selectedContact.id) {
        debouncedSetContact(updatedContact);
        
        // Also refresh messages when contact is updated
        loadMessages(updatedContact.id).catch(error => {
          console.error('Error refreshing messages:', error);
        });
      }
    }
  }, [contacts, selectedContact?.id, debouncedSetContact, loadMessages]);

  // Load initial messages when contact is selected
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id).catch(error => {
        console.error('Error loading messages:', error);
      });
    }
  }, [selectedContact, loadMessages]);

  // Handle message updates and real-time events
  useEffect(() => {
    // Initialize message handler
    const processedMessageIds = new Set();
    
    const handleMessage = async (data) => {
      const { message, direction, contact } = data;
      
      // Skip if we've already processed this message
      if (processedMessageIds.has(message.id)) {
        return;
      }
      processedMessageIds.add(message.id);

      try {
        // Update contact's last message
        await updateLastMessage(contact.id, {
          text: message.content,
          timestamp: message.created_at,
          direction
        });

        // Handle inbound messages
        if (direction === 'inbound') {
          // Increment unread count if this isn't the selected contact
          if (!selectedContact || selectedContact.id !== contact.id) {
            await incrementUnreadCount(contact.id);
          }
          
          // If this is the currently selected contact, refresh messages
          if (selectedContact?.id === contact.id) {
            await loadMessages(contact.id);
          }
        }
      } catch (error) {
        console.error('Error handling message update:', error);
      }
    };

    // Add message handler
    const removeHandler = addMessageHandler(handleMessage);

    // Cleanup
    return () => {
      removeHandler();
      processedMessageIds.clear();
    };
  }, [contacts, selectedContact, updateLastMessage, loadMessages, incrementUnreadCount]);

  // Handle sending message
  const handleSendMessage = async (message) => {
    if (!selectedContact) return;

    try {
      // Format phone number for sending
      const formattedPhone = formatPhoneNumber(selectedContact.phone_number);
      if (!formattedPhone) {
        throw new Error('Invalid phone number');
      }

      // Send message with contactId
      await sendMessage({
        to: formattedPhone,
        content: message,
        workspaceId: selectedContact.workspace_id,
        contactId: selectedContact.id
      });

      // Clear unread count when sending a message
      await clearUnreadCount(selectedContact.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  // Clear unread count when selecting a contact
  useEffect(() => {
    if (selectedContact?.id) {
      clearUnreadCount(selectedContact.id).catch(error => {
        console.error('Error clearing unread count:', error);
      });
    }
  }, [selectedContact?.id, clearUnreadCount]);

  // Normalize phone number by removing non-digit characters and ensuring it starts with country code
  const normalizePhone = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // If it doesn't start with +1 or 1, add it
    if (!digits.startsWith('1')) {
      return '1' + digits;
    }
    return digits;
  };

  // Window resize handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const container = containerRef.current;
      if (!container) return;

      const newWidth = Math.max(
        900, // Increased min width
        e.clientX - container.getBoundingClientRect().left
      );
      const newHeight = Math.max(
        600, // Increased min height
        e.clientY - container.getBoundingClientRect().top
      );

      setWindowSize({
        width: Math.min(newWidth, window.innerWidth - 40),
        height: Math.min(newHeight, window.innerHeight - 40)
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const bg = useColorModeValue('whiteAlpha.800', 'blackAlpha.700');
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.100');
  const headerBg = useColorModeValue('whiteAlpha.500', 'blackAlpha.400');
  const textColor = useColorModeValue('gray.800', 'white');
  const inputBg = useColorModeValue('white', 'gray.700');
  
  // Add these new color mode values for the email popup
  const emailPopupBg = useColorModeValue('white', 'gray.800');
  const emailPopupBorderColor = useColorModeValue('gray.200', 'gray.700');

  // Available agents data
  const availableAgents = [
    { id: 1, name: 'Allison', initials: 'AL', color: 'purple.500' },
    { id: 2, name: 'Lyndel', initials: 'LY', color: 'blue.500' },
    { id: 3, name: 'Guktork', initials: 'GK', color: 'orange.500' }
  ];

  const handleAssignAgent = (contact, agent) => {
    if (contact) {
      const updatedContact = {
        ...contact,
        assignedAgent: agent
      };
      updateContact(contact.id, updatedContact);
    }
  };

  return (
    <Draggable 
      handle=".drag-handle" 
      defaultPosition={position}
      bounds="parent"
    >
      <Box
        ref={containerRef}
        position="fixed"
        width={`${windowSize.width}px`}
        height={`${windowSize.height}px`}
        bg={useColorModeValue('white', 'gray.800')}
        borderRadius="lg"
        boxShadow="xl"
        overflow="hidden"
      >
        {/* Window Controls */}
        <HStack 
          className="drag-handle" 
          spacing={2} 
          px={3} 
          py={2.5}
          bg={useColorModeValue('gray.100', 'gray.900')}
          borderBottom="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <HStack spacing={1.5}>
            <Box
              as="button"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="red.400"
              _hover={{ bg: 'red.500' }}
              onClick={onClose}
            />
            <Box
              as="button"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="yellow.400"
              _hover={{ bg: 'yellow.500' }}
              onClick={() => {
                // Minimize functionality
              }}
            />
            <Box
              as="button"
              w="12px"
              h="12px"
              borderRadius="full"
              bg="green.400"
              _hover={{ bg: 'green.500' }}
              onClick={() => {
                // Maximize functionality
              }}
            />
          </HStack>
          <Text flex="1" textAlign="center" fontSize="sm" fontWeight="medium">
            Live Chat
          </Text>
          <Box w={12} /> {/* Spacer for centering */}
        </HStack>

        {/* Main Content */}
        <Grid
          templateColumns="280px minmax(400px, 1fr) 320px"
          height="calc(100% - 45px)"
        >
          {/* Contact List */}
          <GridItem 
            borderRight="1px solid" 
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            overflow="auto"
          >
            {isLoading ? (
              <Center height="100%">
                <Spinner />
              </Center>
            ) : (
              <ContactList
                contacts={contacts}
                selectedContact={selectedContact}
                onSelectContact={setSelectedContact}
                messages={messages}
                isDark={isDark}
              />
            )}
          </GridItem>

          {/* Chat Area */}
          <GridItem overflow="hidden" position="relative">
            <ChatArea
              selectedContact={selectedContact}
              messages={messages}
              onSendMessage={handleSendMessage}
              isDark={isDark}
              availableAgents={availableAgents}
              onAssignAgent={handleAssignAgent}
              onContactUpdate={(updatedContact) => {
                setSelectedContact(updatedContact);
              }}
              onEmailClick={handleEmailOpen}
            />
            
            {/* Email Popup */}
            {isEmailOpen && (
              <Box
                position="absolute"
                bottom="70px"
                right="20px"
                width="350px"
                borderRadius="md"
                boxShadow="md"
                bg={emailPopupBg}
                borderColor={emailPopupBorderColor}
                borderWidth="1px"
                zIndex="10"
                overflow="hidden"
              >
                <VStack spacing={2} p={3} align="stretch">
                  <Box position="relative">
                    <Input 
                      placeholder="Subject" 
                      value={emailSubject} 
                      onChange={(e) => setEmailSubject(e.target.value)} 
                      size="sm"
                      bg={inputBg}
                    />
                    <IconButton
                      icon={<SmallCloseIcon />}
                      size="xs"
                      aria-label="Close email composer"
                      position="absolute"
                      right={1}
                      top={1}
                      onClick={handleEmailClose}
                    />
                  </Box>
                  <Textarea
                    placeholder="Email body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    size="sm"
                    rows={4}
                    bg={inputBg}
                  />
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    onClick={handleSendEmail}
                    isLoading={isSendingEmail}
                  >
                    Send Email
                  </Button>
                </VStack>
              </Box>
            )}
          </GridItem>

          {/* User Details */}
          <GridItem 
            borderLeft="1px solid" 
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            overflow="auto"
          >
            <UserDetails selectedContact={selectedContact} />
          </GridItem>
        </Grid>

        {/* Resize Handle */}
        <Box
          ref={resizeRef}
          position="absolute"
          bottom={0}
          right={0}
          width="20px"
          height="20px"
          cursor="nwse-resize"
          onMouseDown={handleMouseDown}
        >
          <Box
            position="absolute"
            bottom="6px"
            right="6px"
            width="8px"
            height="8px"
            borderRadius="full"
            bg="blue.500"
          />
        </Box>
      </Box>
    </Draggable>
  );
};

export default LiveChat;