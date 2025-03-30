import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  useToast,
  useColorModeValue,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { sendTwilioMessage } from '../../services/twilio';
import { formatPhoneForDisplay } from '../../utils/phoneUtils';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const QuickMessage = ({
  isOpen,
  onClose,
  contact = null,
  contacts = [], // Support both single and bulk operations
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  
  // Handle both single contact and bulk operations with proper null checks
  const validContacts = contacts.filter(c => c && typeof c === 'object');
  const validContact = contact && typeof contact === 'object' ? contact : null;
  const contactsToMessage = validContacts.length > 0 ? validContacts : (validContact ? [validContact] : []);
  
  const noValidContacts = contactsToMessage.length === 0;
  
  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message to send',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!currentWorkspace?.id) {
      toast({
        title: 'No Workspace Selected',
        description: 'Please select a workspace to send messages',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    if (noValidContacts) {
      toast({
        title: 'No Valid Contacts',
        description: 'There are no valid contacts to send messages to',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Starting bulk message operation:', {
        contactCount: contactsToMessage.length,
        messageLength: message.length
      });
      
      // Handle bulk operations with Promise.all for better performance
      const results = await Promise.all(contactsToMessage.map(async (c) => {
        if (!c || !c.phone) {
          return { 
            status: 'rejected', 
            contactId: c?.id || 'unknown', 
            error: new Error('No phone number available') 
          };
        }
        
        try {
          await sendTwilioMessage({ 
            to: c.phone, 
            message: message 
          });
          return { status: 'fulfilled', contactId: c.id };
        } catch (error) {
          console.error('Failed to send message to contact:', c.id, error);
          return { status: 'rejected', contactId: c.id, error };
        }
      }));

      // Process results
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      console.log('Bulk message operation completed:', {
        total: contactsToMessage.length,
        successes: successes.length,
        failures: failures.length
      });

      if (failures.length > 0) {
        console.error('Failed messages:', failures);
        toast({
          title: 'Partial success',
          description: `Sent ${successes.length} messages, but ${failures.length} failed`,
          status: 'warning',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Success',
          description: `Message sent to ${contactsToMessage.length} contact${contactsToMessage.length > 1 ? 's' : ''} successfully`,
          status: 'success',
          duration: 3000,
        });
      }
      
      onClose();
      setMessage('');
    } catch (error) {
      console.error('Error in bulk message operation:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      motionPreset="scale"
      isCentered
    >
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="xl">
        <ModalHeader>Quick Message</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {noValidContacts ? (
              <Alert status="warning">
                <AlertIcon />
                No valid contacts available to message.
              </Alert>
            ) : (
              <>
                <Text>
                  Sending message to <strong>{contactsToMessage.length} contact{contactsToMessage.length > 1 ? 's' : ''}</strong>
                </Text>
                
                {contactsToMessage.length === 1 && contactsToMessage[0]?.phone && (
                  <Text fontSize="sm" color="gray.500">
                    Phone: {formatPhoneForDisplay(contactsToMessage[0].phone)}
                  </Text>
                )}
              </>
            )}
            
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                Message
              </FormLabel>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                size="sm"
                rows={4}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!message.trim() || noValidContacts}
          >
            Send Message
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QuickMessage; 