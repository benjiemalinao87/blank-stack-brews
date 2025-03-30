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
  VStack,
  HStack,
  Text,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Box,
  Divider,
  Badge,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { supabase } from '../../../services/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const UnmappedFieldMappingModal = ({ isOpen, onClose, unmappedFields, contactId, onFieldsMapped }) => {
  const [customFields, setCustomFields] = useState([]);
  const [standardFields, setStandardFields] = useState([]);
  const [mappings, setMappings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const toast = useToast();

  // Fetch custom fields and standard fields when the modal opens
  useEffect(() => {
    if (isOpen && currentWorkspace) {
      fetchFields();
    }
  }, [isOpen, currentWorkspace]);

  // Initialize mappings when unmapped fields change
  useEffect(() => {
    if (unmappedFields) {
      const initialMappings = {};
      Object.keys(unmappedFields).forEach(field => {
        initialMappings[field] = '';
      });
      setMappings(initialMappings);
    }
  }, [unmappedFields]);

  const fetchFields = async () => {
    setIsLoading(true);
    try {
      // Fetch custom fields
      const { data: customFieldsData, error: customFieldsError } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);

      if (customFieldsError) throw customFieldsError;
      setCustomFields(customFieldsData || []);

      // Define standard fields
      setStandardFields([
        { name: 'firstname', label: 'First Name', type: 'text' },
        { name: 'lastname', label: 'Last Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone_number', label: 'Phone Number', type: 'phone' },
        { name: 'lead_source', label: 'Lead Source', type: 'text' },
        { name: 'lead_status', label: 'Lead Status', type: 'text' },
        { name: 'st_address', label: 'Street Address', type: 'text' },
        { name: 'city', label: 'City', type: 'text' },
        { name: 'state', label: 'State', type: 'text' },
        { name: 'zip', label: 'ZIP Code', type: 'text' },
        { name: 'product', label: 'Product', type: 'text' },
        { name: 'market', label: 'Market', type: 'text' }
      ]);
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fields. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (unmappedField, targetField) => {
    setMappings(prev => ({
      ...prev,
      [unmappedField]: targetField
    }));
  };

  const handleSaveMappings = async () => {
    setIsSaving(true);
    try {
      // Get the current contact data
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;

      // Prepare updates for the contact
      const updates = {
        metadata: {
          ...contact.metadata,
          unmapped_fields: { ...contact.metadata.unmapped_fields }
        }
      };

      // Initialize custom_fields if it doesn't exist
      if (!updates.metadata.custom_fields) {
        updates.metadata.custom_fields = {};
      }

      // Process each mapping
      Object.entries(mappings).forEach(([unmappedField, targetField]) => {
        if (targetField) {
          const value = unmappedFields[unmappedField];
          
          // Check if it's a standard field or custom field
          const isCustomField = customFields.some(field => field.name === targetField);
          
          if (isCustomField) {
            // Add to custom fields
            updates.metadata.custom_fields[targetField] = value;
          } else {
            // Add to standard fields
            updates[targetField] = value;
          }
          
          // Remove from unmapped fields
          delete updates.metadata.unmapped_fields[unmappedField];
        }
      });

      // Update the contact
      const { error: updateError } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Fields mapped successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Notify parent component
      if (onFieldsMapped) {
        onFieldsMapped(updates);
      }

      onClose();
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save mappings. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get all available fields (standard + custom)
  const allFields = [
    ...standardFields,
    ...customFields.map(field => ({
      name: field.name,
      label: field.label || field.name,
      type: field.field_type,
      isCustom: true
    }))
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Map Unmapped Fields</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Flex justify="center" align="center" py={8}>
              <Spinner size="xl" />
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              <Text>
                Map unmapped fields to standard or custom fields. Fields that are mapped will be removed from the unmapped fields section.
              </Text>
              
              <Divider />
              
              {unmappedFields && Object.entries(unmappedFields).map(([field, value]) => (
                <Box key={field} p={3} borderWidth="1px" borderRadius="md">
                  <FormControl>
                    <FormLabel>
                      <HStack>
                        <Text fontWeight="bold">{field}</Text>
                        <Text color="gray.500">
                          ({typeof value === 'object' ? 'Object' : typeof value})
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        Value: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </Text>
                    </FormLabel>
                    <Select 
                      placeholder="Select field to map to"
                      value={mappings[field] || ''}
                      onChange={(e) => handleMappingChange(field, e.target.value)}
                    >
                      <option value="">-- Do not map --</option>
                      <optgroup label="Standard Fields">
                        {standardFields.map(option => (
                          <option key={option.name} value={option.name}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                      {customFields.length > 0 && (
                        <optgroup label="Custom Fields">
                          {customFields.map(option => (
                            <option key={option.name} value={option.name}>
                              {option.label || option.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </Select>
                    {mappings[field] && (
                      <HStack mt={2}>
                        <Text fontSize="sm">Will be mapped to:</Text>
                        <Badge colorScheme="green">
                          {allFields.find(f => f.name === mappings[field])?.label || mappings[field]}
                        </Badge>
                        {customFields.some(f => f.name === mappings[field]) && (
                          <Badge colorScheme="purple">Custom Field</Badge>
                        )}
                      </HStack>
                    )}
                  </FormControl>
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSaveMappings}
            isLoading={isSaving}
            isDisabled={isLoading || Object.values(mappings).every(value => !value)}
          >
            Save Mappings
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UnmappedFieldMappingModal; 