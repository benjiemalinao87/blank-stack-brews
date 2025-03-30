import React, { useState, useEffect } from 'react';
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
  Input,
  Textarea,
  VStack,
  HStack,
  Select,
  FormErrorMessage,
  useToast,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import { supabase } from '../../../services/supabase';
import { PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { useAuth } from '../../../contexts/AuthContext';
import contactActivityHelpers from '../../../utils/contactActivityHelpers';

const ContactForm = ({ isOpen, onClose, columnId, boardId, onContactAdded, initialData = null }) => {
  const isEditing = !!initialData;
  const toast = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    notes: '',
    tags: '',
    firstname: '',
    lastname: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load initial data if editing an existing contact
  useEffect(() => {
    if (initialData) {
      // Parse tags from JSON string if needed
      let parsedTags = initialData.tags || [];
      
      if (typeof parsedTags === 'string') {
        try {
          parsedTags = JSON.parse(parsedTags);
        } catch (e) {
          console.error('Error parsing tags:', e);
          parsedTags = [];
        }
      }
      
      setFormData({
        name: initialData.name || '',
        phone_number: initialData.phone_number || '',
        email: initialData.email || '',
        notes: initialData.notes || '',
        tags: Array.isArray(parsedTags) ? parsedTags.join(', ') : '',
        firstname: initialData.firstname || '',
        lastname: initialData.lastname || '',
      });
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Process tags from comma-separated string to array
      const tags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      // Get the correct workspace_id from user metadata
      const workspace_id = user?.user_metadata?.workspace_id;
      
      if (!workspace_id) {
        throw new Error('Workspace ID not found. Please refresh the page or contact support.');
      }
      
      if (isEditing) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            name: formData.name,
            phone_number: formData.phone_number,
            email: formData.email || null,
            notes: formData.notes || null,
            tags: JSON.stringify(tags), // Convert tags array to JSON string
            updated_at: new Date().toISOString(),
            workspace_id: workspace_id, // Use the correct workspace_id
            firstname: formData.firstname,
            lastname: formData.lastname || null,
          })
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        toast({
          title: 'Contact updated',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new contact
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            name: formData.name,
            phone_number: formData.phone_number,
            email: formData.email || null,
            notes: formData.notes || null,
            tags: JSON.stringify(tags), // Convert tags array to JSON string
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            workspace_id: workspace_id, // Use the correct workspace_id
            firstname: formData.firstname,
            lastname: formData.lastname || null,
          })
          .select()
          .single();
        
        if (contactError) throw contactError;
        
        // Add contact to the board in the specified column
        const { error: boardError } = await supabase
          .from('board_contacts')
          .insert({
            board_id: boardId,
            contact_id: contact.id,
            metadata: {
              column_id: columnId,
              added_at: new Date().toISOString()
            }
          });
        
        if (boardError) throw boardError;
        
        // Log contact creation activity
        await contactActivityHelpers.logContactCreated(contact);
        
        toast({
          title: 'Contact created',
          status: 'success',
          duration: 3000,
        });
        
        // Notify parent component that a contact was added
        if (onContactAdded) {
          onContactAdded({
            ...contact,
            columnId,
          });
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: 'Error saving contact',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEditing ? 'Edit Contact' : 'Add New Contact'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={errors.name}>
              <FormLabel>Name</FormLabel>
              <Input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Contact name"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>
            
            <HStack width="100%">
              <FormControl flex="1">
                <FormLabel>First Name</FormLabel>
                <Input 
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </FormControl>
              
              <FormControl flex="1">
                <FormLabel>Last Name</FormLabel>
                <Input 
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </FormControl>
            </HStack>
            
            <FormControl isRequired isInvalid={errors.phone_number}>
              <FormLabel>Phone Number</FormLabel>
              <InputGroup>
                <InputLeftAddon children={<PhoneIcon />} />
                <Input 
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  type="tel"
                />
              </InputGroup>
              <FormErrorMessage>{errors.phone_number}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={errors.email}>
              <FormLabel>Email</FormLabel>
              <InputGroup>
                <InputLeftAddon children={<EmailIcon />} />
                <Input 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  type="email"
                />
              </InputGroup>
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes here..."
                rows={3}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Tags</FormLabel>
              <Input
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Separate tags with commas"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ContactForm;
