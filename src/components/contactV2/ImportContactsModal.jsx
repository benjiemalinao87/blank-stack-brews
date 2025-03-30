import React, { useCallback, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  useToast,
  Progress,
  Box,
  Tooltip,
  IconButton,
  Code,
  List,
  ListItem,
  Collapse,
  useDisclosure,
  Checkbox,
  Flex,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { ChevronDown, ChevronUp } from 'lucide-react';
import useContactV2Store from '../../services/contactV2State';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabaseUnified';

export const ImportContactsModal = ({ isOpen, onClose }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const toast = useToast();
  const { addContact } = useContactV2Store();
  const { isOpen: isHelpOpen, onToggle: onHelpToggle } = useDisclosure();
  const { currentWorkspace } = useWorkspace();

  const csvHeaders = [
    { required: true, headers: ['firstname', 'firstname'], description: 'Contact\'s first name' },
    { required: true, headers: ['lastname', 'lastname'], description: 'Contact\'s last name' },
    { required: true, headers: ['Phone Number', 'phone_number'], description: 'Phone number (e.g., +1234567890)' },
    { required: false, headers: ['Email', 'email'], description: 'Email address' },
    { required: false, headers: ['Lead Source', 'lead_source'], description: 'Source of the lead' },
    { required: false, headers: ['Market', 'market'], description: 'Target market' },
    { required: false, headers: ['Product', 'product'], description: 'Product interest' },
    { required: false, headers: ['Lead Status', 'lead_status'], description: 'Lead status' },
    { required: false, headers: ['Address', 'st_address'], description: 'Street address' },
    { required: false, headers: ['City', 'city'], description: 'City' },
    { required: false, headers: ['State', 'state'], description: 'State' },
    { required: false, headers: ['ZIP', 'zip'], description: 'ZIP code' },
    { required: false, headers: ['Conversation Status', 'conversation_status'], description: 'Conversation status (New, Open, Closed, Spam, Invalid). Defaults to Closed.' }
  ];

  // Custom function to add contact that bypasses the duplicate check in contactV2State
  const addContactDirect = async (contactData) => {
    try {
      const { phone_number, workspace_id } = contactData;
      
      // Check for duplicates if skipDuplicates is true
      if (skipDuplicates) {
        const { data: existingContacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('phone_number', phone_number)
          .eq('workspace_id', workspace_id);
          
        if (existingContacts && existingContacts.length > 0) {
          setDuplicateCount(prevCount => prevCount + 1);
          return null; // Skip this contact
        }
      }
      
      // If no duplicate or if we're allowing duplicates, add the contact via standard addContact
      return await addContact(contactData);
    } catch (error) {
      if (error.message.includes('phone number already exists')) {
        setDuplicateCount(prevCount => prevCount + 1);
        return null; // We're tracking duplicates but not throwing an error
      }
      throw error; // Re-throw other errors
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!currentWorkspace?.id) {
      toast({
        title: 'Error',
        description: 'No workspace selected. Please select a workspace first.',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'text/csv') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setDuplicateCount(0);

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const { data } = results;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          try {
            // Map CSV columns to contact fields
            const contactData = {
              workspace_id: currentWorkspace.id,
              firstname: row['firstname'] || '',
              lastname: row['lastname'] || '',
              phone_number: row['Phone Number'] || row['phone_number'] || '',
              email: row['Email'] || row['email'] || '',
              lead_source: row['Lead Source'] || row['lead_source'] || '',
              market: row['Market'] || row['market'] || '',
              product: row['Product'] || row['product'] || '',
              lead_status: row['Lead Status'] || row['lead_status'] || '',
              st_address: row['Address'] || row['st_address'] || '',
              city: row['City'] || row['city'] || '',
              state: row['State'] || row['state'] || '',
              zip: row['ZIP'] || row['zip'] || '',
              conversation_status: row['Conversation Status'] || row['conversation_status'] || 'Closed'
            };

            // Skip empty rows
            if (!contactData.firstname && !contactData.lastname && !contactData.phone_number) {
              continue;
            }

            const result = await addContactDirect(contactData);
            if (result) successCount++;
          } catch (error) {
            console.error('Error importing contact:', error);
            errorCount++;
          }

          setProgress(Math.round(((i + 1) / data.length) * 100));
        }

        const duplicateMsg = duplicateCount > 0 
          ? ` ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} were skipped.` 
          : '';

        toast({
          title: 'Import Complete',
          description: `Successfully imported ${successCount} contacts. ${errorCount} failed.${duplicateMsg}`,
          status: successCount > 0 ? 'success' : 'warning',
          duration: 5000,
        });

        setIsUploading(false);
        onClose();
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast({
          title: 'Error parsing CSV',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
        setIsUploading(false);
      }
    });
  }, [addContact, onClose, toast, currentWorkspace, skipDuplicates]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Import Contacts
          <Tooltip 
            label="Click for CSV format help" 
            placement="right"
          >
            <IconButton
              icon={isHelpOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              variant="ghost"
              size="sm"
              ml={2}
              onClick={onHelpToggle}
              aria-label="CSV format help"
            />
          </Tooltip>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Collapse in={isHelpOpen}>
              <Box
                p={4}
                bg="gray.50"
                _dark={{ bg: 'gray.700' }}
                borderRadius="md"
                mb={4}
              >
                <Text fontWeight="bold" mb={2}>CSV Format Guide:</Text>
                <List spacing={2}>
                  {csvHeaders.map(({ required, headers, description }) => (
                    <ListItem key={headers[0]}>
                      <Code>{headers.join(' or ')}</Code>
                      {required && <Text as="span" color="red.500" ml={1}>*</Text>}
                      <Text as="span" color="gray.600" _dark={{ color: 'gray.300' }} ml={2}>
                        - {description}
                      </Text>
                    </ListItem>
                  ))}
                </List>
                <Text mt={4} fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                  * Required fields
                </Text>
              </Box>
            </Collapse>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Flex width="100%" justify="space-between" align="center">
                <Text>Contacts with duplicate phone numbers</Text>
                <Checkbox 
                  isChecked={skipDuplicates} 
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  ml={2}
                >
                  Skip duplicates
                </Checkbox>
              </Flex>
            </Alert>

            <Box
              {...getRootProps()}
              w="100%"
              h="150px"
              border="2px dashed"
              borderColor={isDragActive ? 'blue.500' : 'gray.300'}
              borderRadius="md"
              p={4}
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              _hover={{ borderColor: 'blue.500' }}
            >
              <input {...getInputProps()} />
              <VStack spacing={2}>
                <Text textAlign="center">
                  {isDragActive
                    ? 'Drop the CSV file here'
                    : 'Drag and drop a CSV file here, or click to select'}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Click the help icon above to see the required CSV format
                </Text>
              </VStack>
            </Box>
            {isUploading && (
              <Box w="100%">
                <Text mb={2}>Importing contacts... {progress}%</Text>
                <Progress value={progress} size="sm" colorScheme="blue" />
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isUploading}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 