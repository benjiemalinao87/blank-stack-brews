import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
  FormErrorMessage,
  Text,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'boolean', label: 'Boolean' }
];

const CustomFieldDialog = ({ isOpen, onClose, onFieldCreated }) => {
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { currentWorkspace } = useWorkspace();
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    
    if (!name) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      newErrors.name = 'Name must start with a letter and contain only lowercase letters, numbers, and underscores';
    }

    if (!label) {
      newErrors.label = 'Label is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!currentWorkspace) {
      toast({
        title: 'Error',
        description: 'No workspace selected',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .insert({
          name,
          label,
          field_type: fieldType,
          workspace_id: currentWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Custom field created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onFieldCreated(data);
      onClose();
      setName('');
      setLabel('');
      setFieldType('text');
      setErrors({});
    } catch (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        toast({
          title: 'Error',
          description: 'A field with this name already exists in your workspace',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Custom Field</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="e.g., account_id"
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Use lowercase letters, numbers, and underscores
              </Text>
              {errors.name && (
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.label}>
              <FormLabel>Display Label</FormLabel>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Account ID"
              />
              {errors.label && (
                <FormErrorMessage>{errors.label}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Field Type</FormLabel>
              <Select 
                value={fieldType} 
                onChange={(e) => setFieldType(e.target.value)}
              >
                {FIELD_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
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
            Create Field
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CustomFieldDialog;
