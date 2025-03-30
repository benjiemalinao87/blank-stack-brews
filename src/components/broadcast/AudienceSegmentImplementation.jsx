import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Input,
  Button,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, InfoIcon } from '@chakra-ui/icons';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';

// Base field definitions
const BASE_FILTER_FIELDS = [
  { value: 'firstname', label: 'First Name', type: 'text' },
  { value: 'lastname', label: 'Last Name', type: 'text' },
  { value: 'email', label: 'Email', type: 'text' },
  { value: 'phone_number', label: 'Phone', type: 'text' },
  { value: 'lead_source', label: 'Lead Source', type: 'select', options: [] },
  { value: 'market', label: 'Market', type: 'select', options: [] },
  { value: 'product', label: 'Product', type: 'select', options: [] },
  { value: 'lead_status', label: 'Lead Status', type: 'select', options: [] },
  { value: 'conversation_status', label: 'Conversation Status', type: 'select', options: [] },
  { value: 'tags', label: 'Tags', type: 'select', options: [] }
];

const FilterRow = ({ filter, onUpdate, onRemove, filterFields }) => {
  const field = filterFields.find(f => f.value === filter.field);
  
  return (
    <HStack spacing={4} align="flex-start" width="100%">
      <Select 
        value={filter.field || ''} 
        onChange={(e) => onUpdate({ ...filter, field: e.target.value, value: '' })}
        placeholder="Select Field"
        width="200px"
      >
        {filterFields.map(field => (
          <option key={field.value} value={field.value}>{field.label}</option>
        ))}
      </Select>

      {field?.type === 'select' ? (
        <Select
          value={filter.value || ''}
          onChange={(e) => onUpdate({ ...filter, value: e.target.value })}
          placeholder={`Select ${field.label}`}
          width="200px"
        >
          {field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
      ) : (
        <Input
          value={filter.value || ''}
          onChange={(e) => onUpdate({ ...filter, value: e.target.value })}
          placeholder={`Enter ${field?.label || 'value'}`}
          width="200px"
        />
      )}

      <IconButton
        icon={<DeleteIcon />}
        onClick={() => onRemove(filter)}
        aria-label="Remove filter"
        colorScheme="red"
        variant="ghost"
      />

      <Tooltip label={field?.tooltip || `Filter by ${field?.label || 'value'}`}>
        <InfoIcon color="gray.500" />
      </Tooltip>
    </HStack>
  );
};

const AudienceSegmentImplementation = ({ onAudienceChange }) => {
  const { currentWorkspace } = useWorkspace();
  const [filters, setFilters] = useState([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filterFields, setFilterFields] = useState(BASE_FILTER_FIELDS);
  const [matchingContacts, setMatchingContacts] = useState([]);
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 5;

  // Fetch distinct field values when component mounts or workspace changes
  useEffect(() => {
    const fetchFieldValues = async () => {
      if (!currentWorkspace?.id) {
        console.log('No workspace ID available');
        return;
      }

      try {
        const { data, error } = await supabase.rpc(
          'get_distinct_field_values',
          { p_workspace_id: currentWorkspace.id }
        );

        if (error) throw error;

        // Update filterFields with fetched options
        const updatedFields = BASE_FILTER_FIELDS.map(field => {
          const fieldData = data?.find(d => d.field_name === field.value);
          
          if (fieldData && Array.isArray(fieldData.field_values)) {
            return {
              ...field,
              options: fieldData.field_values.filter(Boolean).sort() // Sort alphabetically
            };
          }
          return field;
        });

        setFilterFields(updatedFields);
      } catch (error) {
        console.error('Error fetching field values:', error);
        toast({
          title: 'Error loading filter options',
          description: 'Failed to load filter options. Please try refreshing the page.',
          status: 'error',
          duration: 5000,
        });
      }
    };

    fetchFieldValues();
  }, [currentWorkspace?.id]);

  const updateAudienceEstimate = async () => {
    try {
      if (!currentWorkspace?.id) {
        toast({
          title: 'Workspace Error',
          description: 'No workspace selected. Please select a workspace first.',
          status: 'error',
          duration: 5000,
        });
        return;
      }

      setIsLoading(true);

      // Convert filters to the format expected by our SQL function
      const filterObj = filters.reduce((acc, filter) => {
        if (filter.field && filter.value) {
          acc[filter.field] = filter.value;
        }
        return acc;
      }, {});

      // Get count first
      const { data: countData, error: countError } = await supabase.rpc(
        'get_broadcast_recipients_count_v1',
        {
          p_workspace_id: currentWorkspace.id,
          p_filters: filterObj
        }
      );

      if (countError) throw countError;
      
      // Get full recipient data
      const { data: recipients, error: recipientsError } = await supabase.rpc(
        'get_broadcast_recipients_v1',
        {
          p_workspace_id: currentWorkspace.id,
          p_filters: filterObj
        }
      );

      if (recipientsError) throw recipientsError;

      setRecipientCount(countData || 0);
      setMatchingContacts(recipients || []);

      // Notify parent component
      onAudienceChange({
        filters,
        estimatedRecipients: countData || 0,
        recipients: recipients || []
      });

      toast({
        title: 'Audience Updated',
        description: `Found ${countData || 0} matching contacts`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error estimating audience:', error);
      toast({
        title: 'Error updating audience',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { field: '', value: '' }]);
  };

  const updateFilter = (updatedFilter, index) => {
    const newFilters = [...filters];
    newFilters[index] = updatedFilter;
    setFilters(newFilters);
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (filters.some(f => f.field && f.value)) {
      updateAudienceEstimate();
    }
  }, [filters]);

  const paginatedContacts = matchingContacts.slice(
    (currentPage - 1) * contactsPerPage,
    currentPage * contactsPerPage
  );

  const totalPages = Math.ceil(matchingContacts.length / contactsPerPage);

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="lg" fontWeight="semibold">
          Define your target audience by adding filters. Your broadcast will be sent to contacts matching ALL conditions.
        </Text>

        <VStack spacing={4} align="stretch">
          {filters.map((filter, index) => (
            <FilterRow
              key={index}
              filter={filter}
              filterFields={filterFields}
              onUpdate={(updated) => updateFilter(updated, index)}
              onRemove={() => removeFilter(index)}
            />
          ))}

          <Button
            leftIcon={<AddIcon />}
            onClick={addFilter}
            variant="ghost"
            colorScheme="blue"
            alignSelf="flex-start"
          >
            Add Filter
          </Button>
        </VStack>

        <HStack justify="space-between" pt={4}>
          <VStack align="start" spacing={1}>
            <Text fontSize="md" color="gray.600">
              Estimated Audience Size:
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {isLoading ? <Spinner size="sm" /> : `${recipientCount.toLocaleString()} contacts`}
            </Text>
          </VStack>

          <Button
            colorScheme="blue"
            onClick={updateAudienceEstimate}
            isLoading={isLoading}
          >
            Update Estimate
          </Button>
        </HStack>

        {recipientCount > 0 && (
          <>
            <Alert status="info" mt={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Ready to Broadcast</AlertTitle>
                <AlertDescription>
                  Your message will be sent to {recipientCount.toLocaleString()} contacts matching your criteria.
                </AlertDescription>
              </Box>
            </Alert>

            <TableContainer mt={4} maxH="300px">
              <Table variant="simple" size="sm">
                <Thead position="sticky" top={0} bg="white">
                  <Tr>
                    <Th>Name</Th>
                    <Th>Phone</Th>
                    <Th>Email</Th>
                    <Th>Lead Source</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedContacts.map((contact, index) => (
                    <Tr key={index}>
                      <Td>{`${contact.firstname || ''} ${contact.lastname || ''}`.trim() || contact.phone_number}</Td>
                      <Td>{contact.phone_number}</Td>
                      <Td>{contact.email}</Td>
                      <Td>{contact.lead_source || '-'}</Td>
                      <Td>{contact.lead_status}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Flex justify="center" mt={4}>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  isDisabled={currentPage === 1}
                  mr={2}
                >
                  Previous
                </Button>
                <Text mx={4} alignSelf="center">
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  isDisabled={currentPage === totalPages}
                  ml={2}
                >
                  Next
                </Button>
              </Flex>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
};

export default AudienceSegmentImplementation;
