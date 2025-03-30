import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import useMessageStore from '../../services/messageStore';
import useContactV2Store from '../../services/contactV2State';
import { debounce } from 'lodash';
import {
  Box,
  VStack,
  HStack,
  Input,
  IconButton,
  Text,
  useColorModeValue,
  Flex,
  Button,
  Center,
  Spinner,
  useToast,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { IoSend } from 'react-icons/io5';
import { MessageBubble } from './MessageBubble';
import ErrorBoundary from '../common/ErrorBoundary';
import { PhoneNumberSelector } from './PhoneNumberSelector';
import { useTwilio } from '../../contexts/TwilioContext';
import { BellIcon, EmailIcon } from '@chakra-ui/icons';

// Move color mode values outside of component to avoid conditional hook calls
const useMessageGroupColors = () => {
  const textColor = useColorModeValue('black', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const outboundBg = useColorModeValue('blue.500', 'blue.600');
  const inboundBg = useColorModeValue('gray.100', 'gray.700');
  const outboundColor = 'white';
  const inboundColor = textColor;

  return {
    textColor,
    mutedTextColor,
    outboundBg,
    inboundBg,
    outboundColor,
    inboundColor
  };
};

const MessageGroup = ({ messages }) => {
  const colors = useMessageGroupColors();
  const isOutbound = messages[0]?.direction === 'outbound';

  return (
    <VStack 
      align={isOutbound ? 'flex-end' : 'flex-start'} 
      spacing={1}
      w="100%"
      mb={2}
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          isFirst={index === 0}
          isLast={index === messages.length - 1}
        />
      ))}
    </VStack>
  );
};

export const ChatArea = ({ selectedContact, onSendMessage, onEmailClick }) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const socketCleanupRef = useRef(null);

  // Move all color mode hooks to the top
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const mainBg = useColorModeValue('white', 'gray.800');
  const headerTextColor = useColorModeValue('gray.600', 'gray.400');

  // Message store
  const {
    messages,
    isLoading,
    error,
    loadMessages,
    sendMessage,
    clearMessages,
    initializeRealtime,
    checkMessageStatus
  } = useMessageStore();

  // Contact store
  const { updateConversationStatus, clearUnreadCount } = useContactV2Store();

  // Twilio context
  const { twilioConfig } = useTwilio();

  const toast = useToast();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages when contact changes
  useEffect(() => {
    let isSubscribed = true;

    const initializeChat = async () => {
      if (!selectedContact?.id || !isSubscribed) return;

      try {
        clearMessages();
        await loadMessages(selectedContact.id);
        
        // Add retry logic for socket connection
        let retries = 3;
        let socketInitialized = false;
        
        while (retries > 0 && !socketInitialized) {
          try {
            // Initialize socket connection and join room
            const cleanup = await initializeRealtime(selectedContact.id);
            socketCleanupRef.current = cleanup;
            socketInitialized = true;
            break; // Success, exit retry loop
          } catch (error) {
            retries--;
            console.error(`Socket initialization attempt failed (${retries} retries left):`, error);
            if (retries === 0) {
              console.error('Failed to initialize socket after retries:', error);
              // Continue without socket - messages will still work through HTTP
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
          }
        }

        // Clear unread count
        if (selectedContact.unread_count > 0) {
          clearUnreadCount(selectedContact.id);
        }

        // Update conversation status
        updateConversationStatus(selectedContact.id, 'active');
      } catch (error) {
        console.error('Chat initialization error:', error);
      }
    };

    initializeChat();

    return () => {
      isSubscribed = false;
      if (socketCleanupRef.current) {
        socketCleanupRef.current();
        socketCleanupRef.current = null;
      }
    };
  }, [selectedContact?.id]);

  // Group messages by direction and time
  const groupMessages = useCallback((messages) => {
    if (!messages?.length) return [];

    let currentGroup = null;
    const groups = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at);
      const messageDay = messageDate.toDateString();

      // Start a new group if:
      // 1. No current group
      // 2. Different day
      // 3. Different direction
      // 4. Time gap > 5 minutes
      if (!currentGroup ||
          currentGroup.direction !== message.direction ||
          Math.abs(new Date(currentGroup.messages[0].created_at) - messageDate) > 5 * 60 * 1000) {
        
        currentGroup = {
          id: message.id,
          direction: message.direction,
          messages: []
        };
        groups.push(currentGroup);
      }

      currentGroup.messages.push(message);
    });

    return groups;
  }, []);

  // Memoize grouped messages to prevent unnecessary re-renders
  const messageGroups = useMemo(() => {
    return groupMessages(messages);
  }, [messages, groupMessages]);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messageGroups]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle phone number selection
  const handlePhoneNumberSelect = (number) => {
    console.log('Phone number selected:', number);
    setSelectedNumber(number);
    setPhoneNumberError(false);
  };

  // Handle sending messages
  const handleSend = async () => {
    if (!messageInput.trim()) return;
    
    if (!selectedNumber) {
      setPhoneNumberError(true);
      toast({
        title: "Select a phone number",
        description: "Please select a phone number to send messages",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (!twilioConfig?.isConfigured) {
      toast({
        title: "Twilio not configured",
        description: "Please configure Twilio in Integration Settings",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    try {
      await sendMessage(selectedContact.id, messageInput.trim(), selectedNumber);
      setMessageInput('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Debug function to test both endpoints
  const testEndpoints = async () => {
    if (!selectedContact || !selectedNumber) {
      toast({
        title: "Cannot test endpoints",
        description: "Please select a contact and phone number first",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const testMessage = "Test message from debug button";
    const apiUrl = process.env.REACT_APP_API_URL || 'https://cc.automate8.com';
    
    toast({
      title: "Testing endpoints",
      description: "Attempting to send test messages via both endpoints...",
      status: "info",
      duration: 3000,
      isClosable: true,
    });

    try {
      // Test primary endpoint
      console.log("🧪 Testing primary endpoint (/api/messages)");
      let primaryResponse;
      let primaryResult;
      
      try {
        primaryResponse = await fetch(`${apiUrl}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedContact.phone_number,
            content: `${testMessage} (primary endpoint)`,
            contactId: selectedContact.id,
            workspaceId: selectedContact.workspace_id
          })
        });
        
        const primaryText = await primaryResponse.text();
        console.log("📄 Primary endpoint raw response:", primaryText);
        
        try {
          primaryResult = JSON.parse(primaryText);
          console.log("📊 Primary endpoint parsed result:", primaryResult);
        } catch (e) {
          console.error("❌ Error parsing primary endpoint response:", e);
          primaryResult = { success: false, error: "Invalid JSON response" };
        }
      } catch (primaryError) {
        console.error("❌ Error with primary endpoint:", primaryError);
        primaryResult = { success: false, error: primaryError.message };
      }
      
      // Test fallback endpoint
      console.log("🧪 Testing fallback endpoint (/send-sms)");
      let fallbackResponse;
      let fallbackResult;
      
      try {
        fallbackResponse = await fetch(`${apiUrl}/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedContact.phone_number,
            message: `${testMessage} (fallback endpoint)`,
            workspaceId: selectedContact.workspace_id
          })
        });
        
        const fallbackText = await fallbackResponse.text();
        console.log("📄 Fallback endpoint raw response:", fallbackText);
        
        try {
          fallbackResult = JSON.parse(fallbackText);
          console.log("📊 Fallback endpoint parsed result:", fallbackResult);
        } catch (e) {
          console.error("❌ Error parsing fallback endpoint response:", e);
          fallbackResult = { success: false, error: "Invalid JSON response" };
        }
      } catch (fallbackError) {
        console.error("❌ Error with fallback endpoint:", fallbackError);
        fallbackResult = { success: false, error: fallbackError.message };
      }

      // Show results
      toast({
        title: "Endpoint test results",
        description: `
          Primary: ${primaryResult?.success ? "✅ Success" : `❌ Failed: ${primaryResult?.error || 'Unknown error'}`}
          Fallback: ${fallbackResult?.success ? "✅ Success" : `❌ Failed: ${fallbackResult?.error || 'Unknown error'}`}
        `,
        status: (primaryResult?.success || fallbackResult?.success) ? "success" : "error",
        duration: 7000,
        isClosable: true,
      });
    } catch (error) {
      console.error("❌ Error testing endpoints:", error);
      toast({
        title: "Error testing endpoints",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Check Twilio configuration
  const checkTwilioConfig = async () => {
    if (!selectedContact) {
      toast({
        title: "Cannot check Twilio config",
        description: "Please select a contact first",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || 'https://cc.automate8.com';
    
    toast({
      title: "Checking Twilio configuration",
      description: "Verifying Twilio setup for this workspace...",
      status: "info",
      duration: 3000,
      isClosable: true,
    });

    try {
      // Check Twilio config
      console.log("🔍 Checking Twilio configuration");
      let configResult = null;
      let numbersResult = null;
      
      try {
        const configResponse = await fetch(`${apiUrl}/config/twilio`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!configResponse.ok) {
          console.error(`Failed to fetch Twilio config: ${configResponse.status} ${configResponse.statusText}`);
        } else {
          const configText = await configResponse.text();
          try {
            configResult = JSON.parse(configText);
            console.log("📊 Twilio config result:", configResult);
          } catch (e) {
            console.error("❌ Error parsing config response:", e);
          }
        }
      } catch (configError) {
        console.error("❌ Error fetching Twilio config:", configError);
      }
      
      // Check phone numbers
      console.log("🔍 Checking Twilio phone numbers");
      try {
        const numbersResponse = await fetch(`${apiUrl}/api/twilio/phone-numbers`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'x-workspace-id': selectedContact.workspace_id
          }
        });

        if (!numbersResponse.ok) {
          console.error(`Failed to fetch Twilio numbers: ${numbersResponse.status} ${numbersResponse.statusText}`);
        } else {
          const numbersText = await numbersResponse.text();
          try {
            numbersResult = JSON.parse(numbersText);
            console.log("📊 Twilio numbers result:", numbersResult);
          } catch (e) {
            console.error("❌ Error parsing numbers response:", e);
          }
        }
      } catch (numbersError) {
        console.error("❌ Error fetching Twilio numbers:", numbersError);
      }

      // Show results
      const hasConfig = configResult && configResult.success;
      const hasNumbers = numbersResult && numbersResult.phoneNumbers && numbersResult.phoneNumbers.length > 0;
      
      toast({
        title: "Twilio Configuration Status",
        description: `
          Twilio Config: ${hasConfig ? "✅ Found" : "❌ Missing"}
          Phone Numbers: ${hasNumbers ? `✅ Found (${numbersResult.phoneNumbers.length})` : "❌ Missing"}
          
          ${!hasConfig && !hasNumbers ? "⚠️ API endpoints may have changed. Please check server configuration." : ""}
        `,
        status: hasConfig && hasNumbers ? "success" : "warning",
        duration: 7000,
        isClosable: true,
      });
    } catch (error) {
      console.error("❌ Error checking Twilio config:", error);
      toast({
        title: "Error checking Twilio config",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Test Twilio API directly
  const testTwilioApi = async () => {
    if (!selectedContact || !selectedNumber) {
      toast({
        title: "Cannot test Twilio API",
        description: "Please select a contact and phone number first",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || 'https://cc.automate8.com';
    
    toast({
      title: "Testing Twilio API",
      description: "Sending a direct test message via Twilio API...",
      status: "info",
      duration: 3000,
      isClosable: true,
    });

    try {
      // Test Twilio API directly
      console.log("🧪 Testing Twilio API directly");
      const response = await fetch(`${apiUrl}/api/twilio/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: selectedContact.workspace_id,
          to: selectedContact.phone_number,
          from: selectedNumber.phone_number,
          message: "Test message sent directly via Twilio API"
        })
      });

      const responseText = await response.text();
      console.log("📄 Raw API response:", responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log("📊 Parsed API response:", result);
      } catch (e) {
        console.error("❌ Error parsing response:", e);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText} - ${result?.error || responseText}`);
      }

      // Show results
      toast({
        title: "Twilio API Test Result",
        description: result?.success 
          ? `✅ Message sent successfully! SID: ${result.messageSid || 'N/A'}` 
          : `❌ Failed to send message: ${result?.error || 'Unknown error'}`,
        status: result?.success ? "success" : "error",
        duration: 7000,
        isClosable: true,
      });
    } catch (error) {
      console.error("❌ Error testing Twilio API:", error);
      toast({
        title: "Error testing Twilio API",
        description: error.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    }
  };

  // Check message status
  const checkLastMessageStatus = async () => {
    if (!selectedContact || messages.length === 0) {
      toast({
        title: "Cannot check message status",
        description: "No messages available to check",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Find the last outbound message
    const lastOutboundMessage = [...messages]
      .reverse()
      .find(msg => msg.direction === 'outbound');

    if (!lastOutboundMessage) {
      toast({
        title: "No outbound messages",
        description: "No outbound messages found to check status",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    toast({
      title: "Checking message status",
      description: `Checking status for message ID: ${lastOutboundMessage.id}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });

    try {
      console.log("🔍 Checking status for message:", lastOutboundMessage);
      const status = await checkMessageStatus(lastOutboundMessage.id);
      
      if (!status) {
        throw new Error("Could not retrieve message status");
      }
      
      console.log("📊 Message status result:", status);

      // Show results
      toast({
        title: "Message Status",
        description: `
          ID: ${status.id}
          Status: ${status.status || 'Unknown'}
          Twilio SID: ${status.twilio_sid || 'Not available'}
          ${status.error_code ? `Error Code: ${status.error_code}` : ''}
          ${status.error_message ? `Error: ${status.error_message}` : ''}
        `,
        status: status.status === 'delivered' || status.status === 'sent' ? "success" : "warning",
        duration: 7000,
        isClosable: true,
      });
    } catch (error) {
      console.error("❌ Error checking message status:", error);
      toast({
        title: "Error checking message status",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!selectedContact) {
    return (
      <Center h="100%" bg={bgColor}>
        <Text color="gray.500">Select a contact to start chatting</Text>
      </Center>
    );
  }

  return (
    <Box h="100%" display="flex" flexDirection="column" bg={bgColor}>
      {/* Chat header */}
      <Box p={4} borderBottom="1px solid" borderColor={headerBorderColor}>
        <HStack justify="space-between">
          <Text color={headerTextColor} fontSize="lg">
            {selectedContact?.name || selectedContact?.phone_number}
          </Text>
          <HStack>
            <Button
              size="xs"
              colorScheme="purple"
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Follow-up functionality will be available soon!",
                  status: "info",
                  duration: 3000,
                  isClosable: true,
                });
              }}
              leftIcon={<Icon as={BellIcon} />}
            >
              Mark as Follow-up
            </Button>
            <PhoneNumberSelector 
              onSelect={handlePhoneNumberSelect} 
              selectedNumber={selectedNumber}
            />
          </HStack>
        </HStack>
        {phoneNumberError && (
          <Text color="red.500" fontSize="sm" mt={1}>
            Please select a phone number to send messages
          </Text>
        )}
      </Box>

      {/* Message List - If this fails, message input still works */}
      <ErrorBoundary errorMessage="Unable to display messages. Try refreshing.">
        <Box flex="1" overflowY="auto" p={4}>
          {isLoading && messages.length === 0 ? (
            <Center h="100%">
              <Spinner />
            </Center>
          ) : messages.length === 0 ? (
            <Center h="100%">
              <Text color="gray.500">No messages yet</Text>
            </Center>
          ) : (
            <VStack spacing={4} w="100%" alignItems="stretch">
              {messageGroups.map((group, groupIndex) => (
                <MessageGroup key={`group-${group.id}-${groupIndex}`} messages={group.messages} />
              ))}
              <div ref={messagesEndRef} />
            </VStack>
          )}
        </Box>
      </ErrorBoundary>

      {/* Message Input - If this fails, message list still works */}
      <ErrorBoundary errorMessage="Unable to send messages. Try refreshing.">
        <Box p={4} borderTop="1px" borderColor={headerBorderColor}>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}>
            <Flex gap={2}>
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                size="md"
              />
              <Tooltip label="Send email" placement="top">
                <IconButton
                  icon={<EmailIcon />}
                  colorScheme="gray"
                  onClick={() => onEmailClick && onEmailClick()}
                  aria-label="Send email"
                />
              </Tooltip>
              <IconButton
                type="submit"
                icon={<IoSend />}
                colorScheme="blue"
                isDisabled={!messageInput.trim()}
              />
            </Flex>
          </form>
        </Box>
      </ErrorBoundary>
    </Box>
  );
};

export default ChatArea;