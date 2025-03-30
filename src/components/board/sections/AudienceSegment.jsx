import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Text,
  useColorModeValue,
  IconButton,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  MenuOptionGroup,
  MenuItemOption,
  Tooltip,
  Tag,
  TagLabel,
  HStack,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronDownIcon, InfoIcon, ChevronLeftIcon, ChevronRightIcon, RepeatIcon } from '@chakra-ui/icons';
import { supabase } from '../../../services/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { useBoardContext } from '../context/BoardContext';
import { useStatus } from '../../../contexts/StatusContext';

// Enhanced operators with proper mapping to SQL
const FILTER_OPERATORS = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
];

// Base fields for filtering
const BASE_FILTER_FIELDS = [
  { 
    value: 'firstname', 
    label: 'First Name', 
    type: 'text',
    tooltip: 'Filter contacts by their first name'
  },
  { 
    value: 'lastname', 
    label: 'Last Name', 
    type: 'text',
    tooltip: 'Filter contacts by their last name'
  },
  { 
    value: 'email', 
    label: 'Email', 
    type: 'text',
    tooltip: 'Filter contacts by their email address'
  },
  { 
    value: 'phone_number', 
    label: 'Phone', 
    type: 'text',
    tooltip: 'Filter contacts by their phone number'
  },
  { 
    value: 'created_at', 
    label: 'Created Date', 
    type: 'date',
    tooltip: 'Filter contacts by when they were created'
  },
  { 
    value: 'last_activity', 
    label: 'Last Activity', 
    type: 'date',
    tooltip: 'Filter contacts by their most recent activity'
  },
  { 
    value: 'tags', 
    label: 'Tags', 
    type: 'text',
    tooltip: 'Filter contacts by their assigned tags'
  },
  { 
    value: 'city', 
    label: 'City', 
    type: 'text',
    tooltip: 'Filter contacts by their city'
  },
  { 
    value: 'state', 
    label: 'State', 
    type: 'text',
    tooltip: 'Filter contacts by their state'
  },
  { 
    value: 'zip', 
    label: 'Zip Code', 
    type: 'text',
    tooltip: 'Filter contacts by their zip code'
  },
  { 
    value: 'source', 
    label: 'Lead Source', 
    type: 'select',
    options: ['sms', 'web', 'email', 'phone', 'other'],
    tooltip: 'Filter contacts by how they were acquired'
  },
  { 
    value: "metadata->>'market'", 
    label: 'Market', 
    type: 'text',
    tooltip: 'Filter contacts by their assigned market'
  },
];

// Default empty filter
const DEFAULT_FILTER = {
  field: 'first_name',
  operator: 'equals',
  value: '',
};

const AudienceSegment = ({ board }) => {
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();
  const { currentBoard } = useBoardContext();
  const { categories, optionsByCategory, refreshData } = useStatus();
  
  // Move all useColorModeValue calls to the top
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.800');
  
  // Extract workspaceId and boardId from props or context
  const workspaceId = board?.workspace_id || currentWorkspace?.id || '';
  const boardId = board?.id || currentBoard?.id || '';
  
  const [segmentName, setSegmentName] = useState('');
  const [filters, setFilters] = useState([{ ...DEFAULT_FILTER }]);
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [segmentContactCounts, setSegmentContactCounts] = useState({});
  const [filterFields, setFilterFields] = useState(BASE_FILTER_FIELDS);
  const [isRefreshingStatuses, setIsRefreshingStatuses] = useState(false);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 10;
  
  // Calculate pagination values
  const totalPages = Math.ceil(contacts.length / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const endIndex = startIndex + contactsPerPage;
  const currentContacts = contacts.slice(startIndex, endIndex);
  
  // Function to refresh status options
  const handleRefreshStatuses = async () => {
    try {
      setIsRefreshingStatuses(true);
      console.log('Refreshing status options...');
      await refreshData();
      console.log('Status options refreshed:', { categories, optionsByCategory });
    } catch (error) {
      console.error('Error refreshing status options:', error);
      toast({
        title: 'Error refreshing status options',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsRefreshingStatuses(false);
    }
  };
  
  // Update filter fields when status options change
  useEffect(() => {
    if (categories && optionsByCategory) {
      console.log('Updating filter fields with status options:', { categories, optionsByCategory });
      const statusFields = categories.map(category => {
        const options = optionsByCategory[category.id] || [];
        const fieldName = category.name.toLowerCase().replace(/\s+/g, '_');
        console.log(`Processing category ${category.name}:`, options);
        return {
          value: fieldName,
          label: category.name,
          type: 'select',
          options: options.map(opt => ({ 
            value: opt.id, 
            label: opt.name,
            color: opt.color 
          })),
          tooltip: `Filter contacts by their ${category.name.toLowerCase()}`
        };
      });
      
      setFilterFields([...BASE_FILTER_FIELDS, ...statusFields]);
    }
  }, [categories, optionsByCategory]);

  // Refresh status options when component mounts
  useEffect(() => {
    if (workspaceId) {
      handleRefreshStatuses();
    }
  }, [workspaceId]);
  
  // Function to fetch contact counts for all segments
  const fetchAllSegmentCounts = async (segmentsData) => {
    const counts = {};
    setIsLoadingContacts(true);
    
    try {
      for (const segment of segmentsData) {
        const filters = JSON.parse(segment.filters);
        let query = supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId);
        
        // Apply each filter to the query
        for (const filter of filters) {
          // Skip empty filters
          if (!filter.field || !filter.operator || !filter.value) {
            continue;
          }
          
          const field = filterFields.find(f => f.value === filter.field);
          
          // Handle JSONB fields differently
          if (filter.field.includes('metadata')) {
            switch (filter.operator) {
              case 'equals':
                query = query.eq(filter.field, filter.value);
                break;
              case 'not_equals':
                query = query.neq(filter.field, filter.value);
                break;
              case 'contains':
                query = query.ilike(filter.field, `%${filter.value}%`);
                break;
              case 'not_contains':
                query = query.not('ilike', filter.field, `%${filter.value}%`);
                break;
              default:
                break;
            }
          } 
          // Handle status fields
          else if (field?.type === 'select' && categories.some(cat => cat.name.toLowerCase().replace(/\s+/g, '_') === filter.field)) {
            const statusField = filter.field === 'lead_status' ? 'lead_status_id' :
                              filter.field === 'appointment_status' ? 'appointment_status_id' :
                              filter.field === 'appointment_result' ? 'appointment_result_id' : null;
            
            if (statusField) {
              switch (filter.operator) {
                case 'equals':
                  query = query.eq(statusField, filter.value);
                  break;
                case 'not_equals':
                  query = query.neq(statusField, filter.value);
                  break;
                default:
                  break;
              }
            }
          } else {
            switch (filter.operator) {
              case 'equals':
                query = query.eq(filter.field, filter.value);
                break;
              case 'not_equals':
                query = query.neq(filter.field, filter.value);
                break;
              case 'contains':
                query = query.ilike(filter.field, `%${filter.value}%`);
                break;
              case 'not_contains':
                query = query.not('ilike', filter.field, `%${filter.value}%`);
                break;
              case 'greater_than':
                query = query.gt(filter.field, filter.value);
                break;
              case 'less_than':
                query = query.lt(filter.field, filter.value);
                break;
              case 'starts_with':
                query = query.ilike(filter.field, `${filter.value}%`);
                break;
              case 'ends_with':
                query = query.ilike(filter.field, `%${filter.value}`);
                break;
              default:
                break;
            }
          }
        }
        
        const { data, error, count } = await query;
        
        if (error) {
          console.error('Error counting contacts for segment:', segment.id, error);
        } else {
          console.log(`Segment ${segment.name} count:`, count);
          counts[segment.id] = count || 0;
        }
      }
      
      console.log('All segment counts:', counts);
      setSegmentContactCounts(counts);
    } catch (error) {
      console.error('Error fetching contact counts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };
  
  // Fetch segments on component mount
  useEffect(() => {
    if (workspaceId && boardId) {
      fetchSegments();
    }
  }, [workspaceId, boardId]);
  
  // Fetch segments from Supabase
  const fetchSegments = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('audience_segments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setSegments(data || []);
      
      // Fetch contact counts for all segments
      if (data && data.length > 0) {
        console.log('Fetching counts for segments:', data.map(s => s.name));
        await fetchAllSegmentCounts(data);
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
      toast({
        title: 'Error fetching segments',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a new filter
  const addFilter = () => {
    setFilters([...filters, { ...DEFAULT_FILTER }]);
  };
  
  // Remove a filter
  const removeFilter = (index) => {
    if (filters.length > 1) {
      const newFilters = [...filters];
      newFilters.splice(index, 1);
      setFilters(newFilters);
    } else {
      toast({
        title: 'Cannot remove filter',
        description: 'At least one filter is required',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Update a filter
  const updateFilter = (index, field, value) => {
    const newFilters = [...filters];
    newFilters[index] = {
      ...newFilters[index],
      [field]: value,
    };
    setFilters(newFilters);
  };
  
  // Save segment
  const handleSaveSegment = async () => {
    try {
      setIsSaving(true);

      // Validate segment name
      if (!segmentName.trim()) {
        toast({
          title: 'Missing segment name',
          description: 'Please enter a name for your segment.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Save segment with initial status
      const { data: savedSegment, error: saveError } = await supabase
        .from('audience_segments')
        .insert({
        name: segmentName,
          filters: JSON.stringify(filters),
          workspace_id: workspaceId,
          board_id: boardId,
          processing_status: 'pending',
          total_contacts: 0
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Create processing job
      const { error: jobError } = await supabase
        .from('segment_processing_jobs')
        .insert({
          segment_id: savedSegment.id,
          status: 'pending'
        });

      if (jobError) throw jobError;

      // Show success message
      toast({
        title: 'Segment created',
        description: 'Your segment is being processed. This may take a few moments.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    
    // Reset form
    setSegmentName('');
      setFilters([{ ...DEFAULT_FILTER }]);
      
      // Refresh segments list
      fetchSegments();

    } catch (error) {
      console.error('Error saving segment:', error);
      toast({
        title: 'Error saving segment',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete segment
  const deleteSegment = async (id) => {
    try {
      const { error } = await supabase
        .from('audience_segments')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Segment deleted',
        description: 'The audience segment has been deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh segments
      fetchSegments();
      
      // Clear selection if the deleted segment was selected
      if (selectedSegment && selectedSegment.id === id) {
        setSelectedSegment(null);
        setContacts([]);
      }
    } catch (error) {
      console.error('Error deleting segment:', error);
      toast({
        title: 'Error deleting segment',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Select segment and fetch contacts
  const selectSegment = async (segment) => {
    setSelectedSegment(segment);
    
    try {
      setIsLoadingContacts(true);
      
      // Parse filters from JSON string
      const segmentFilters = JSON.parse(segment.filters);
      
      // Build query to fetch contacts based on filters
      let query = supabase
        .from('contacts')
        .select('*, appointments(*)')
        .eq('workspace_id', workspaceId);
      
      // Apply each filter to the query
      segmentFilters.forEach((filter) => {
        const field = filterFields.find(f => f.value === filter.field);
        
        // Handle JSONB fields differently
        if (filter.field.includes('metadata')) {
          switch (filter.operator) {
            case 'equals':
              query = query.eq(filter.field, filter.value);
              break;
            case 'not_equals':
              query = query.neq(filter.field, filter.value);
              break;
            case 'contains':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case 'not_contains':
              query = query.not('ilike', filter.field, `%${filter.value}%`);
              break;
            default:
              break;
          }
        }
        // Handle status fields
        else if (field?.type === 'select' && categories.some(cat => cat.name.toLowerCase().replace(/\s+/g, '_') === filter.field)) {
          const statusField = filter.field === 'lead_status' ? 'lead_status_id' :
                            filter.field === 'appointment_status' ? 'appointment_status_id' :
                            filter.field === 'appointment_result' ? 'appointment_result_id' : null;
          
          if (statusField) {
            switch (filter.operator) {
              case 'equals':
                query = query.eq(statusField, filter.value);
                break;
              case 'not_equals':
                query = query.neq(statusField, filter.value);
                break;
              default:
                break;
            }
          }
        }
        // Handle regular fields
        else {
          switch (filter.operator) {
            case 'equals':
              query = query.eq(filter.field, filter.value);
              break;
            case 'not_equals':
              query = query.neq(filter.field, filter.value);
              break;
            case 'contains':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case 'not_contains':
              query = query.not('ilike', filter.field, `%${filter.value}%`);
              break;
            case 'greater_than':
              query = query.gt(filter.field, filter.value);
              break;
            case 'less_than':
              query = query.lt(filter.field, filter.value);
              break;
            case 'starts_with':
              query = query.ilike(filter.field, `${filter.value}%`);
              break;
            case 'ends_with':
              query = query.ilike(filter.field, `%${filter.value}`);
              break;
            default:
              break;
          }
        }
      });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error fetching contacts',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };
  
  // Add this before the return statement
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Add function to check segment processing status
  const checkSegmentStatus = async (segmentId) => {
    const { data: segment, error } = await supabase
      .from('audience_segments')
      .select('processing_status, total_contacts, error_message')
      .eq('id', segmentId)
      .single();

    if (error) {
      console.error('Error checking segment status:', error);
      return;
    }

    return segment;
  };

  // Add polling for segment status
  useEffect(() => {
    const processingSegments = segments.filter(s => 
      s.processing_status === 'pending' || s.processing_status === 'processing'
    );

    if (processingSegments.length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const segment of processingSegments) {
        const status = await checkSegmentStatus(segment.id);
        if (status && status.processing_status === 'completed') {
          // Update local state
          setSegments(prev => prev.map(s => 
            s.id === segment.id 
              ? { ...s, processing_status: 'completed', total_contacts: status.total_contacts }
              : s
          ));
        } else if (status && status.processing_status === 'failed') {
          toast({
            title: 'Segment processing failed',
            description: status.error_message || 'An error occurred while processing the segment.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [segments]);

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} gap={6} h="calc(100vh - 200px)">
        {/* Left side - Segment Builder */}
        <Box
          flex="1"
          p={6} 
          borderWidth="1px" 
          borderRadius="lg" 
          bg={bgColor}
          boxShadow="md"
          overflowY="auto"
        >
          <HStack justify="space-between" mb={4}>
            <Text fontSize="xl" fontWeight="bold">
              Create Audience Segment
            </Text>
            <Button
              leftIcon={<RepeatIcon />}
              size="sm"
              colorScheme="purple"
              variant="ghost"
              onClick={handleRefreshStatuses}
              isLoading={isRefreshingStatuses}
              loadingText="Refreshing"
            >
              Refresh Status Options
            </Button>
          </HStack>
          
          <FormControl mb={4}>
            <FormLabel>Segment Name</FormLabel>
            <Input
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Enter segment name"
            />
          </FormControl>

            <Text fontWeight="medium" mb={2}>
            Filters
            </Text>
          
          <VStack spacing={4} align="stretch" mb={6}>
            {filters.map((filter, index) => (
              <HStack key={index} spacing={2} align="flex-end">
                <FormControl>
                  <FormLabel fontSize="sm">
                    <HStack spacing={1}>
                      <Text>Field</Text>
                      <Tooltip 
                        label={filterFields.find(f => f.value === filter.field)?.tooltip || ''}
                        hasArrow
                        placement="top"
                      >
                        <InfoIcon boxSize={3} color="gray.500" />
                      </Tooltip>
                    </HStack>
                  </FormLabel>
                  <Select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, 'field', e.target.value)}
                  >
                    {filterFields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Operator</FormLabel>
                  <Select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                  >
                    {FILTER_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Value</FormLabel>
                  {filterFields.find(f => f.value === filter.field)?.type === 'select' ? (
                    <Select
                      value={filter.value}
                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    >
                      <option value="">Select value</option>
                      {filterFields.find(f => f.value === filter.field)?.options.map(option => {
                        const isStatusOption = typeof option === 'object' && 'color' in option;
                        return (
                          <option 
                            key={isStatusOption ? option.value : option} 
                            value={isStatusOption ? option.value : option}
                          >
                            {isStatusOption ? (
                              `● ${option.label}`
                            ) : option}
                          </option>
                        );
                      })}
                    </Select>
                  ) : (
                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                      placeholder="Enter value"
                    />
                  )}
                </FormControl>
                
                <IconButton
                  aria-label="Remove filter"
                  icon={<DeleteIcon />}
                  onClick={() => removeFilter(index)}
                  colorScheme="red"
                  variant="ghost"
                  size="sm"
                />
              </HStack>
            ))}
          </VStack>
          
            <Button
              leftIcon={<AddIcon />}
            colorScheme="purple"
            variant="outline"
              size="sm"
            onClick={addFilter}
            mb={6}
            >
            Add Filter
            </Button>
          
          <Button
            colorScheme="purple"
            onClick={handleSaveSegment}
            isLoading={isSaving}
            loadingText="Saving"
            w="100%"
          >
            Save Segment
          </Button>
      </Box>

        {/* Right side - Saved Segments */}
      <Box
          flex="1" 
          p={6} 
          borderWidth="1px" 
          borderRadius="lg" 
        bg={bgColor}
          boxShadow="md"
          display="flex"
          flexDirection="column"
        >
          <Text fontSize="xl" fontWeight="bold" mb={4}>
          Saved Segments
        </Text>
          
          {/* Segments list */}
          <Box flex="1" overflowY="auto" mb={4}>
            {isLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="lg" color="purple.500" />
              </Flex>
            ) : segments.length === 0 ? (
              <Box 
                p={6} 
                borderWidth="1px" 
                borderRadius="md" 
                borderStyle="dashed"
                textAlign="center"
              >
                <Text color="gray.500">
                  No segments created yet. Create your first segment to get started.
                </Text>
              </Box>
            ) : (
              <>
                <Flex justify="flex-end" mb={2}>
                  <Button
                    leftIcon={<RepeatIcon />}
                    size="sm"
                    colorScheme="purple"
                    variant="ghost"
                    onClick={() => fetchAllSegmentCounts(segments)}
                    isLoading={isLoadingContacts}
                  >
                    Refresh Counts
                  </Button>
                </Flex>
                <VStack spacing={3} align="stretch">
                  {segments.map((segment) => (
                    <Box
                      key={segment.id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={selectedSegment?.id === segment.id ? 'purple.500' : borderColor}
                      bg={selectedSegment?.id === segment.id ? 'purple.50' : 'transparent'}
                      _hover={{ bg: hoverBg }}
                      cursor="pointer"
                      onClick={() => selectSegment(segment)}
                    >
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="medium">{segment.name}</Text>
                        <IconButton
                          aria-label="Delete segment"
                          icon={<DeleteIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSegment(segment.id);
                          }}
                          colorScheme="red"
                          variant="ghost"
                          size="sm"
                        />
                      </Flex>
                      <Flex justify="space-between" align="center" mt={1}>
                        <Text fontSize="sm" color="gray.500">
                          {JSON.parse(segment.filters).length} filter(s)
                        </Text>
                        {isLoadingContacts ? (
                          <Spinner size="xs" color="purple.500" />
                        ) : (
                          <Badge colorScheme="purple" fontSize="sm" px={2} py={1} borderRadius="md">
                            {segmentContactCounts[segment.id] !== undefined ? segmentContactCounts[segment.id] : 0} contacts
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </>
            )}
          </Box>
          
          {/* Matching Contacts Section */}
          {selectedSegment && (
            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <HStack>
                  <IconButton
                    icon={<ChevronLeftIcon />}
                    size="sm"
                    aria-label="Back to segments"
                    onClick={() => setSelectedSegment(null)}
                    colorScheme="purple"
                    variant="ghost"
                  />
                  <Text fontSize="lg" fontWeight="medium">
                    Matching Contacts
                  </Text>
                </HStack>
                <Badge colorScheme="purple" fontSize="sm">
                  {contacts.length} contacts
                </Badge>
              </Flex>
              
              {isLoadingContacts ? (
                <Flex justify="center" align="center" h="100px">
                  <Spinner size="md" color="purple.500" />
                </Flex>
              ) : contacts.length === 0 ? (
                <Box 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  borderStyle="dashed"
                  textAlign="center"
                >
                  <Text color="gray.500">
                    No contacts match this segment's criteria.
                  </Text>
                </Box>
              ) : (
                <Box>
                  <Box overflowX="auto" borderWidth="1px" borderRadius="md">
                    <Table size="sm" variant="simple">
                      <Thead bg={tableHeaderBg}>
            <Tr>
              <Th>Name</Th>
                          <Th>Email</Th>
                          <Th>Phone</Th>
            </Tr>
          </Thead>
          <Tbody>
                        {currentContacts.map((contact) => (
                          <Tr key={contact.id}>
                            <Td>{`${contact.firstname || ''} ${contact.lastname || ''}`}</Td>
                            <Td>{contact.email || '-'}</Td>
                            <Td>{contact.phone_number || '-'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
                  </Box>
                  
                  {/* Pagination Controls */}
                  <Flex justify="space-between" align="center" mt={4}>
                    <Text fontSize="sm" color="gray.500">
                      Showing {startIndex + 1} to {Math.min(endIndex, contacts.length)} of {contacts.length} contacts
                    </Text>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<ChevronLeftIcon />}
                        onClick={handlePrevPage}
                        isDisabled={currentPage === 1}
                        size="sm"
                        aria-label="Previous page"
                      />
                      <Text fontSize="sm">
                        Page {currentPage} of {totalPages}
                      </Text>
                      <IconButton
                        icon={<ChevronRightIcon />}
                        onClick={handleNextPage}
                        isDisabled={currentPage === totalPages}
                        size="sm"
                        aria-label="Next page"
                      />
                    </HStack>
                  </Flex>
                </Box>
              )}
            </Box>
          )}
      </Box>
    </Flex>
    </Box>
  );
};

export default AudienceSegment;
