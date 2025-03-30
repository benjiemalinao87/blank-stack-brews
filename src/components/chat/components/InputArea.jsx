import React, { useState } from 'react';
import {
  Box,
  Input,
  IconButton,
  Flex,
  Tooltip,
  Text,
  Button,
  Progress,
  VStack, 
  Collapse, 
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  AttachmentIcon, 
  EmailIcon, 
  SmallCloseIcon 
} from '@chakra-ui/icons';
import { IoSend, IoMail } from 'react-icons/io5';
import TextareaAutosize from 'react-textarea-autosize';
import { chakra } from '@chakra-ui/react';
import { supabase } from '../../../services/supabase';
import { formatPhoneNumber } from '../../../utils/formatters';
import { getBackendUrl } from '../../../socket';
import useMessageStore from '../../../services/messageStore';

// Style the textarea to match the design with dark mode support
const StyledTextarea = chakra(TextareaAutosize, {
  baseStyle: props => ({
    px: 4,
    py: 2,
    width: '100%',
    borderRadius: 'full',
    border: '1px solid',
    borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
    bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
    color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
    resize: 'none',
    _focus: {
      outline: 'none',
      borderColor: 'blue.500',
      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
    },
    _disabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    fontSize: 'sm',
    minHeight: '40px',
    maxHeight: '120px'
  })
});

const InputArea = ({ contact, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.700');
  
  const {
    isOpen: isEmailOpen,
    onOpen: onEmailOpen,
    onClose: onEmailClose
  } = useDisclosure();
  
  const handleSendMessage = async () => {
    if (!message.trim() || !contact) return;
    
    setIsSending(true);
    const messageText = message.trim();
    const timestamp = new Date();
    
    // Clear input early for better UX
    setMessage('');
    
    // Notify parent component immediately for responsiveness
    // This adds the message to UI before API calls complete
    if (onMessageSent) {
      onMessageSent({
        message: messageText,
        timestamp: timestamp,
        isUser: true
      });
    }
    
    try {
      // Send message using messageStore
      await useMessageStore.getState().sendMessage(
        contact.id,
        messageText,
        { phone_number: contact.assigned_to || 'system' }
      );
      
      console.log('Message sent successfully');
      
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error toast here
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendClick = () => {
    if (message.trim()) {
      handleSendMessage();
    }
  };
  
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
  
  const handleSendEmail = () => {
    // This would integrate with an email service
    console.log('Sending email:', { subject: emailSubject, body: emailBody });
    handleEmailClose();
  };
  
  return (
    <Box p={3} borderTop="1px solid" borderColor={borderColor} bg={bgColor}>
      <Collapse in={isEmailOpen} animateOpacity>
        <VStack spacing={2} mb={3} align="stretch">
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
          <Button size="sm" colorScheme="blue" onClick={handleSendEmail}>
            Send Email
          </Button>
        </VStack>
      </Collapse>
      
      <Flex>
        <StyledTextarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={1}
          maxRows={4}
        />
        <Flex ml={2} align="center">
          <Tooltip label="Attach file" placement="top">
            <IconButton
              icon={<AttachmentIcon />}
              variant="ghost"
              colorScheme="gray"
              size="sm"
              aria-label="Attach file"
              isRound
            />
          </Tooltip>
          <Tooltip label="Send email" placement="top">
            <IconButton
              icon={<EmailIcon />}
              variant="ghost"
              colorScheme="gray"
              size="sm"
              aria-label="Send email"
              isRound
              onClick={handleEmailOpen}
            />
          </Tooltip>
          <IconButton
            icon={<Box as="span" fontWeight="bold">→</Box>}
            colorScheme="blue"
            size="sm"
            aria-label="Send message"
            isRound
            ml={1}
            onClick={handleSendClick}
            isLoading={isSending}
            isDisabled={!message.trim() || !contact}
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default InputArea;
