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
  Flex,
  useColorModeValue
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
  const bgColor = useColorModeValue('#f7fafc', 'gray.800');
  const borderColor = useColorModeValue('#e2e8f0', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.3)');
  
  return (
    <HStack 
      spacing={4} 
      align="flex-start" 
      width="100%" 
      p={3} 
      bg={bgColor} 
      borderRadius="8px" 
      boxShadow={`0 1px 2px ${shadowColor}`}
      borderWidth="1px"
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ boxShadow: `0 3px 6px ${shadowColor}` }}
    >
      <Select 
        value={filter.field || ''} 
        onChange={(e) => onUpdate({ ...filter, field: e.target.value, value: '' })}
        placeholder="Select Field"
        width="200px"
        borderRadius="6px"
        fontSize="15px"
        fontWeight="medium"
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
          borderRadius="6px"
          fontSize="15px"
          fontWeight="medium"
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
          borderRadius="6px"
          fontSize="15px"
          fontWeight="medium"
        />
      )}

      <Tooltip label="Remove this filter" placement="top">
        <IconButton
          icon={<DeleteIcon />}
          onClick={() => onRemove(filter)}
          aria-label="Remove filter"
          colorScheme="red"
          variant="ghost"
          size="sm"
          borderRadius="full"
        />
      </Tooltip>

      <Tooltip label={field?.tooltip || `Filter by ${field?.label || 'value'}`}>
        <InfoIcon color="gray.500" />
      </Tooltip>
    </HStack>
  );
};

const AudienceSelector = ({ onAudienceChange = () => {} }) => {
  const { currentWorkspace } = useWorkspace();
  const [filters, setFilters] = useState([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filterFields, setFilterFields] = useState(BASE_FILTER_FIELDS);
  const [matchingContacts, setMatchingContacts] = useState([]);
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 5;
  
  // UI Theme Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const tableHeaderBg = useColorModeValue('#f7fafc', 'gray.700');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableRowHoverBg = useColorModeValue('#f0f4f8', 'gray.700');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.3)');

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
      // Skip if no filters defined
      if (!filters.length || !filters.some(f => f.field && f.value)) {
        console.log('No filters defined, skipping audience estimate');
        setRecipientCount(0);
        setMatchingContacts([]);
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

      // Log the exact filter object being used
      console.log('Filter object for audience estimate:', filterObj);

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

      // Log discrepancy if there is one
      if (countData !== recipients.length) {
        console.warn(`Warning: Count (${countData}) does not match actual recipient count (${recipients.length})`);
      }

      setRecipientCount(countData || 0);
      setMatchingContacts(recipients || []);

      // Notify parent component if callback exists
      if (typeof onAudienceChange === 'function') {
        onAudienceChange({
          filters, // Pass the raw filter array
          filterObj, // Pass the processed filter object
          estimatedRecipients: countData || 0,
          actualRecipients: recipients ? recipients.length : 0,
          recipients: recipients || []
        });
      }

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
    <Box 
      p={6} 
      borderRadius="16px" 
      bg={cardBg} 
      boxShadow={`0 1px 3px ${shadowColor}`}
      borderWidth="1px"
      borderColor={borderColor}
    >
      <VStack spacing={6} align="stretch">
        <Text 
          fontSize="16px" 
          fontWeight="medium" 
          color={headingColor}
          lineHeight="1.5"
        >
          Define your target audience by adding filters. Your broadcast will be sent to contacts matching ALL conditions.
        </Text>

        <VStack 
          spacing={4} 
          align="stretch" 
          p={4} 
          borderRadius="12px" 
          bg={useColorModeValue('#f8fafc', 'gray.750')}
          borderWidth="1px"
          borderColor={borderColor}
        >
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
            color={useColorModeValue('blue.600', 'blue.300')}
            bg={useColorModeValue('blue.50', 'blue.900')}
            _hover={{ bg: useColorModeValue('blue.100', 'blue.800') }}
            borderRadius="8px"
            fontWeight="medium"
            py={2}
            height="auto"
            alignSelf="flex-start"
            boxShadow="0 1px 2px rgba(0, 0, 0, 0.05)"
            transition="all 0.2s"
          >
            Add Filter
          </Button>
        </VStack>

        <Flex 
          justify="space-between" 
          pt={4} 
          p={4} 
          borderRadius="12px" 
          bg={useColorModeValue('#f8fafc', 'gray.750')}
          borderWidth="1px"
          borderColor={borderColor}
          align="center"
        >
          <VStack align="start" spacing={1}>
            <Text fontSize="md" color={useColorModeValue('gray.600', 'gray.400')}>
              Estimated Audience Size:
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
              {isLoading ? <Spinner size="sm" /> : `${recipientCount.toLocaleString()} contacts`}
            </Text>
          </VStack>

          <Button
            colorScheme="blue"
            onClick={updateAudienceEstimate}
            isLoading={isLoading}
            borderRadius="8px"
            fontWeight="medium"
            px={5}
            py={2}
            height="auto"
            boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
            _hover={{ boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)" }}
            transition="all 0.2s"
          >
            Update Estimate
          </Button>
        </Flex>

        {recipientCount > 0 && (
          <>
            <Alert 
              status="info" 
              mt={4} 
              borderRadius="8px"
              boxShadow="0 1px 2px rgba(0, 0, 0, 0.05)"
            >
              <AlertIcon />
              <Box>
                <AlertTitle fontWeight="medium">Ready to Broadcast</AlertTitle>
                <AlertDescription>
                  Your message will be sent to {recipientCount.toLocaleString()} contacts matching your criteria.
                </AlertDescription>
              </Box>
            </Alert>

            <Box 
              mt={4} 
              borderRadius="12px" 
              overflow="hidden"
              boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <TableContainer maxH="300px">
                <Table variant="simple" size="md">
                  <Thead bg={tableHeaderBg} position="sticky" top={0}>
                    <Tr>
                      <Th borderBottomWidth="2px" fontWeight="semibold" fontSize="14px">Name</Th>
                      <Th borderBottomWidth="2px" fontWeight="semibold" fontSize="14px">Phone</Th>
                      <Th borderBottomWidth="2px" fontWeight="semibold" fontSize="14px">Email</Th>
                      <Th borderBottomWidth="2px" fontWeight="semibold" fontSize="14px">Lead Source</Th>
                      <Th borderBottomWidth="2px" fontWeight="semibold" fontSize="14px">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedContacts.map((contact, index) => (
                      <Tr 
                        key={index}
                        _hover={{ bg: tableRowHoverBg }}
                        transition="background-color 0.2s"
                      >
                        <Td fontWeight="medium">{`${contact.firstname || ''} ${contact.lastname || ''}`.trim() || contact.phone_number}</Td>
                        <Td>{contact.phone_number}</Td>
                        <Td>{contact.email}</Td>
                        <Td>{contact.lead_source || '-'}</Td>
                        <Td>{contact.lead_status}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            {totalPages > 1 && (
              <Flex justify="center" mt={4}>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  isDisabled={currentPage === 1}
                  mr={2}
                  borderRadius="full"
                >
                  Previous
                </Button>
                <Text mx={4} alignSelf="center" fontWeight="medium">
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  isDisabled={currentPage === totalPages}
                  ml={2}
                  borderRadius="full"
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

export default AudienceSelector; 