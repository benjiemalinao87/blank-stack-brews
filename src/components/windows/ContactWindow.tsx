import React, { useCallback, useState, useEffect } from 'react';
import { DraggableWindow } from '../window/DraggableWindow';
import { 
  Box, 
  Button, 
  VStack, 
  useDisclosure, 
  useToast, 
  Text, 
  Input,
  Grid,
  GridItem,
  useColorModeValue
} from '@chakra-ui/react';
import { ContactForm } from '../chat/ContactForm';

export function ContactWindow({ onClose }) {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [testPhone, setTestPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen: openForm, onClose: closeForm } = useDisclosure();

  // Colors
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load contacts from localStorage on mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('contacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    } else {
      // Add hardcoded contact
      const hardcodedContact = {
        id: Date.now(),
        firstName: 'Benjie',
        lastName: 'Malinao',
        phoneNumber: '16267888830',
        email: 'benjie@gmail.com',
        leadSource: 'homebuddy'
      };
      setContacts([hardcodedContact]);
      localStorage.setItem('contacts', JSON.stringify([hardcodedContact]));
    }
  }, []);

  const handleAddContact = useCallback(async (formData) => {
    try {
      const newContact = {
        id: Date.now(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
      };

      // Add to state and localStorage
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      localStorage.setItem('contacts', JSON.stringify(updatedContacts));

      toast({
        title: "Contact added successfully",
        description: `${formData.firstName} ${formData.lastName} has been added to your contacts`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      closeForm();
    } catch (error) {
      toast({
        title: "Error adding contact",
        description: "Failed to save contact",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [contacts, closeForm, toast]);

  const handleTestSMS = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://cc1.automate8.com/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testPhone,
          message: 'Test SMS from LiveChat App'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      toast({
        title: "SMS sent",
        description: `Test message sent to ${testPhone}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error sending SMS",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DraggableWindow
      title="Contacts"
      onClose={onClose}
      defaultSize={{ width: 1000, height: 600 }}
      minSize={{ width: 600, height: 400 }}
    >
      <Grid
        templateColumns="250px 1fr"
        h="100%"
        bg={bg}
      >
        {/* Left Sidebar */}
        <GridItem borderRight="1px" borderColor={borderColor} p={4}>
          <VStack spacing={4} align="stretch">
            <Button colorScheme="purple" onClick={openForm}>
              Add New Contact
            </Button>
            <Input
              placeholder="Test Phone Number"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Button
              colorScheme="green"
              onClick={handleTestSMS}
              isLoading={isLoading}
              width="100%"
            >
              Send Test SMS
            </Button>
          </VStack>
        </GridItem>

        {/* Main Content */}
        <GridItem p={4} overflowY="auto">
          {contacts.length === 0 ? (
            <VStack spacing={4} justify="center" h="100%">
              <Text color="gray.500">No contacts yet</Text>
              <Button colorScheme="purple" variant="outline" onClick={openForm}>
                Add Your First Contact
              </Button>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              {contacts.map((contact) => (
                <Box
                  key={contact.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                >
                  <Text fontWeight="bold">
                    {contact.firstName} {contact.lastName}
                  </Text>
                  <Text color="gray.500">{contact.phoneNumber}</Text>
                  {contact.email && <Text color="gray.500">{contact.email}</Text>}
                  {contact.leadSource && (
                    <Text color="gray.500">Source: {contact.leadSource}</Text>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </GridItem>
      </Grid>

      {/* Contact Form Modal */}
      {isOpen && (
        <ContactForm
          isOpen={isOpen}
          onClose={closeForm}
          onSubmit={handleAddContact}
        />
      )}
    </DraggableWindow>
  );
}
