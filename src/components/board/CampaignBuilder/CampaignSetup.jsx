import React, { useState, useEffect } from 'react';
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Select,
  useColorModeValue,
  Spinner,
  Text,
  Box,
  Badge,
  Flex,
  Tooltip,
  Icon,
  Button,
  VStack,
  HStack,
  Divider,
  ButtonGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { InfoIcon, SearchIcon, AddIcon, ChevronDownIcon, CheckIcon } from '@chakra-ui/icons';
import { FaFilter, FaTag, FaUserTag } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';

const CampaignSetup = ({ 
  campaign, 
  onCampaignChange, 
  selectedSegment, 
  onSegmentChange,
  workspaceId,
  boardId,
  onContactsSelected,
  selectedContacts = []
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const inputBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [segments, setSegments] = useState([]);
  const [segmentCounts, setSegmentCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedContacts, setLocalSelectedContacts] = useState(selectedContacts);
  const [statusFilters, setStatusFilters] = useState([]);
  const [tagFilters, setTagFilters] = useState([]);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectedContacts(selectedContacts);
  }, [selectedContacts]);

  // Fetch contact counts for segments
  const fetchContactCounts = async (segmentsData) => {
    setIsLoadingCounts(true);
    const counts = {};
    
    try {
      for (const segment of segmentsData) {
        console.log('Counting contacts for segment:', {
          segmentId: segment.id,
          segmentName: segment.name,
          filters: segment.filters
        });

        // Parse filters from JSON string
        const segmentFilters = JSON.parse(segment.filters);
        
        // Build query to fetch contacts based on filters
        let query = supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('workspace_id', workspaceId);

        // Apply each filter to the query
        segmentFilters.forEach((filter) => {
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
          else if (filter.field === 'lead_status' || filter.field === 'appointment_status' || filter.field === 'appointment_result') {
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

        // Execute the query
        const { count, error } = await query;
        
        if (error) {
          console.error('Error counting contacts:', error);
        } else {
          console.log('Contact count result:', {
            segmentId: segment.id,
            segmentName: segment.name,
            count: count
          });
          counts[segment.id] = count || 0;
        }
      }
      setSegmentCounts(counts);
    } catch (error) {
      console.error('Error fetching contact counts:', error);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  useEffect(() => {
    const fetchSegments = async () => {
      if (!workspaceId || !boardId) {
        console.log('Missing workspaceId or boardId:', { workspaceId, boardId });
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('Fetching segments for:', { workspaceId, boardId });
        const { data, error } = await supabase
          .from('audience_segments')
          .select('id, name, filters')
          .eq('workspace_id', workspaceId)
          .eq('board_id', boardId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('Fetched segments:', data);
        setSegments(data || []);
        
        // Fetch contact counts for the segments
        if (data && data.length > 0) {
          await fetchContactCounts(data);
        }
      } catch (error) {
        console.error('Error fetching segments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSegments();
  }, [workspaceId, boardId]);

  // Fetch available statuses and tags for filtering
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoadingFilters(true);
      try {
        // Fetch lead statuses
        const { data: leadStatuses, error: leadStatusError } = await supabase
          .from('lead_statuses')
          .select('id, name')
          .eq('workspace_id', workspaceId);
        
        if (leadStatusError) throw leadStatusError;
        
        // Fetch tags
        const { data: tags, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .eq('workspace_id', workspaceId);
        
        if (tagsError) throw tagsError;
        
        setAvailableStatuses(leadStatuses || []);
        setAvailableTags(tags || []);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    };
    
    if (workspaceId) {
      fetchFilterOptions();
    }
  }, [workspaceId]);

  // Load contacts with filters - Fix to properly load contacts
  const loadContacts = async () => {
    setIsLoading(true);
    try {
      // Start with base query - simplified to ensure it works
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      // Add search term filter if provided
      if (searchTerm) {
        query = query.or(`firstname.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`);
      }
      
      // Add status filters if any
      if (statusFilters.length > 0) {
        query = query.in('lead_status_id', statusFilters);
      }
      
      // Execute query with limit and order
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      console.log('Loaded contacts:', data);
      setContacts(data || []);
      
      // Reset select all when loading new contacts
      setSelectAll(false);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Toggle status filter
  const toggleStatusFilter = (statusId) => {
    setStatusFilters(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(id => id !== statusId);
      } else {
        return [...prev, statusId];
      }
    });
  };

  // Toggle tag filter
  const toggleTagFilter = (tagId) => {
    setTagFilters(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilters([]);
    setTagFilters([]);
    setSearchTerm('');
  };

  // Handle select all contacts
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all visible contacts
      setLocalSelectedContacts(prev => 
        prev.filter(contact => !contacts.some(c => c.id === contact.id))
      );
    } else {
      // Select all visible contacts
      const visibleContactIds = contacts.map(c => c.id);
      const currentSelectedIds = localSelectedContacts.map(c => c.id);
      
      // Add only contacts that aren't already selected
      const newContacts = contacts.filter(c => !currentSelectedIds.includes(c.id));
      
      setLocalSelectedContacts(prev => [...prev, ...newContacts]);
    }
    setSelectAll(!selectAll);
  };

  // Handle contact selection
  const handleContactSelect = (contact) => {
    setLocalSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  // Add selected contacts to campaign
  const handleAddContacts = () => {
    if (onContactsSelected) {
      onContactsSelected(localSelectedContacts);
    }
    onClose();
  };

  // Get status name by ID
  const getStatusName = (statusId) => {
    const status = availableStatuses.find(s => s.id === statusId);
    return status ? status.name : 'Unknown';
  };

  // Get tag name by ID
  const getTagName = (tagId) => {
    const tag = availableTags.find(t => t.id === tagId);
    return tag ? tag.name : 'Unknown';
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormControl isRequired>
        <FormLabel>Campaign Name</FormLabel>
        <Input
          placeholder="Enter campaign name"
          value={campaign.name}
          onChange={(e) => onCampaignChange({ ...campaign, name: e.target.value })}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Campaign Type</FormLabel>
        <Select
          maxW="md"
          value={campaign.campaign_type || 'sequence'}
          onChange={(e) => onCampaignChange({ ...campaign, campaign_type: e.target.value })}
          bg={inputBg}
          borderColor={borderColor}
          _hover={{ borderColor: 'purple.400' }}
          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
        >
          <option value="sequence">Status-based Sequence</option>
          <option value="drip">Time-based Drip</option>
          <option value="broadcast">One-time Broadcast</option>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Active Days</FormLabel>
        <Stack direction="row" spacing={4} maxW="md">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <Button
              key={day}
              size="sm"
              variant={campaign.settings?.active_days?.includes(day) ? 'solid' : 'outline'}
              colorScheme="purple"
              onClick={() => {
                const activeDays = campaign.settings?.active_days || [];
                const newDays = activeDays.includes(day)
                  ? activeDays.filter(d => d !== day)
                  : [...activeDays, day];
                onCampaignChange({
                  ...campaign,
                  settings: {
                    ...campaign.settings,
                    active_days: newDays
                  }
                });
              }}
            >
              {day}
            </Button>
          ))}
        </Stack>
      </FormControl>

      <FormControl>
        <FormLabel>Time Window</FormLabel>
        <Stack direction="row" spacing={4} maxW="md" align="center">
          <Input
            type="time"
            value={campaign.settings?.time_window?.start || '09:00'}
            onChange={(e) => onCampaignChange({
              ...campaign,
              settings: {
                ...campaign.settings,
                time_window: {
                  ...campaign.settings?.time_window,
                  start: e.target.value
                }
              }
            })}
            size="sm"
            width="100px"
          />
          <Text>to</Text>
          <Input
            type="time"
            value={campaign.settings?.time_window?.end || '17:00'}
            onChange={(e) => onCampaignChange({
              ...campaign,
              settings: {
                ...campaign.settings,
                time_window: {
                  ...campaign.settings?.time_window,
                  end: e.target.value
                }
              }
            })}
            size="sm"
            width="100px"
          />
        </Stack>
      </FormControl>

      <FormControl>
        <Flex align="center" mb={2}>
          <FormLabel mb={0}>Select Segment (Optional)</FormLabel>
          <Tooltip 
            label="Choose an audience segment or add contacts manually below" 
            hasArrow
            placement="top"
          >
            <Icon as={InfoIcon} boxSize={4} color="gray.500" ml={1} />
          </Tooltip>
        </Flex>
        
        {isLoading ? (
          <Flex align="center" gap={2} maxW="md">
            <Spinner size="sm" color="purple.500" />
            <Text fontSize="sm">Loading segments...</Text>
          </Flex>
        ) : segments.length > 0 ? (
          <Box maxW="md">
            <Select
              value={selectedSegment || ''}
              onChange={(e) => onSegmentChange(e.target.value)}
              placeholder="Choose a segment (optional)"
              bg={inputBg}
              borderColor={borderColor}
              _hover={{ borderColor: 'purple.400' }}
              _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
            >
              {segments.map(segment => (
                <option key={segment.id} value={segment.id}>
                  {segment.name} ({JSON.parse(segment.filters).length} filters, {isLoadingCounts ? '...' : segmentCounts[segment.id] || 0} contacts)
                </option>
              ))}
            </Select>
            {selectedSegment && (
              <Box mt={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  {segments.find(s => s.id === selectedSegment)?.name}
                  {!isLoadingCounts && segmentCounts[selectedSegment] !== undefined && (
                    <Text as="span" ml={2}>
                      ({segmentCounts[selectedSegment]} contacts)
                    </Text>
                  )}
                </Badge>
              </Box>
            )}
          </Box>
        ) : (
          <Box p={4} borderWidth="1px" borderRadius="md" borderStyle="dashed" maxW="md">
            <Text fontSize="sm" color="gray.500">
              No segments available. You can still add contacts manually below.
            </Text>
          </Box>
        )}
      </FormControl>

      <FormControl>
        <FormLabel>Description (Optional)</FormLabel>
        <Input
          placeholder="Brief description of your campaign"
          value={campaign.description}
          onChange={(e) => onCampaignChange({ ...campaign, description: e.target.value })}
        />
      </FormControl>

      <Box>
        <Flex align="center" mb={2}>
          <Text fontWeight="medium">Add Contacts</Text>
          <Tooltip 
            label="Browse and select contacts to include in this campaign" 
            hasArrow
            placement="top"
          >
            <Icon as={InfoIcon} boxSize={4} color="gray.500" ml={1} />
          </Tooltip>
        </Flex>
        
        <HStack spacing={4} align="center">
          <Button
            leftIcon={<SearchIcon />}
            colorScheme="purple"
            onClick={onOpen}
            size="md"
          >
            Browse Contacts
          </Button>
          
          {localSelectedContacts.length > 0 && (
            <Badge colorScheme="green" fontSize="md" p={2} borderRadius="md">
              {localSelectedContacts.length} contact{localSelectedContacts.length !== 1 ? 's' : ''} selected
            </Badge>
          )}
        </HStack>
        
        {!selectedSegment && localSelectedContacts.length === 0 && (
          <Text mt={2} fontSize="sm" color="orange.500">
            Please select a segment or add contacts manually to continue.
          </Text>
        )}
      </Box>

      {/* Contact Browser Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>Browse Contacts</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <InputGroup flex={1}>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name, email or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadContacts()}
                  />
                </InputGroup>
                
                <Menu closeOnSelect={false}>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />} leftIcon={<FaFilter />} variant="outline">
                    Filters {(statusFilters.length > 0 || tagFilters.length > 0) && 
                      <Badge ml={1} colorScheme="purple" borderRadius="full">{statusFilters.length + tagFilters.length}</Badge>
                    }
                  </MenuButton>
                  <MenuList minWidth="240px">
                    <Box px={3} py={2}>
                      <Text fontWeight="medium">Lead Status</Text>
                    </Box>
                    {availableStatuses.map(status => (
                      <MenuItem key={status.id} onClick={() => toggleStatusFilter(status.id)}>
                        <Checkbox isChecked={statusFilters.includes(status.id)} mr={2} />
                        {status.name}
                      </MenuItem>
                    ))}
                    <MenuDivider />
                    <MenuItem onClick={clearFilters} icon={<Icon as={FaFilter} />} color="red.500">
                      Clear All Filters
                    </MenuItem>
                  </MenuList>
                </Menu>
                
                <Button 
                  colorScheme="purple" 
                  onClick={loadContacts}
                  isLoading={isLoading}
                >
                  Search
                </Button>
              </HStack>
              
              {/* Active filters display */}
              {(statusFilters.length > 0 || tagFilters.length > 0) && (
                <Wrap spacing={2} width="100%">
                  {statusFilters.map(statusId => (
                    <WrapItem key={`status-${statusId}`}>
                      <Tag size="md" colorScheme="blue" borderRadius="full">
                        <TagLabel>Status: {getStatusName(statusId)}</TagLabel>
                        <TagCloseButton onClick={() => toggleStatusFilter(statusId)} />
                      </Tag>
                    </WrapItem>
                  ))}
                  {tagFilters.map(tagId => (
                    <WrapItem key={`tag-${tagId}`}>
                      <Tag size="md" colorScheme="green" borderRadius="full">
                        <TagLabel>Tag: {getTagName(tagId)}</TagLabel>
                        <TagCloseButton onClick={() => toggleTagFilter(tagId)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
              
              <Box width="100%" position="relative" overflowX="auto">
                <Table size="sm">
                  <Thead position="sticky" top={0} bg={useColorModeValue('white', 'gray.800')} zIndex={1}>
                    <Tr>
                      <Th width="40px">
                        <Checkbox 
                          isChecked={selectAll} 
                          onChange={handleSelectAll}
                          isIndeterminate={contacts.length > 0 && 
                            localSelectedContacts.some(sc => contacts.some(c => c.id === sc.id)) && 
                            !selectAll}
                        />
                      </Th>
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Phone</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {contacts.length > 0 ? (
                      contacts.map(contact => (
                        <Tr key={contact.id}>
                          <Td>
                            <Checkbox
                              isChecked={localSelectedContacts.some(c => c.id === contact.id)}
                              onChange={() => handleContactSelect(contact)}
                            />
                          </Td>
                          <Td>{`${contact.firstname || ''} ${contact.lastname || ''}`}</Td>
                          <Td>{contact.email || '-'}</Td>
                          <Td>{contact.phone_number || '-'}</Td>
                          <Td>
                            <Badge colorScheme="blue">
                              {availableStatuses.find(s => s.id === contact.lead_status_id)?.name || '-'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={5} textAlign="center" py={4}>
                          {isLoading ? (
                            <Spinner size="sm" />
                          ) : (
                            <Text color="gray.500">No contacts found. Try adjusting your search or filters.</Text>
                          )}
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
              
              {/* Selection summary */}
              {localSelectedContacts.length > 0 && (
                <HStack width="100%" justifyContent="space-between" p={2} bg="purple.50" borderRadius="md">
                  <Text fontSize="sm">
                    <strong>{localSelectedContacts.length}</strong> contact{localSelectedContacts.length !== 1 ? 's' : ''} selected
                  </Text>
                  <Button 
                    size="xs" 
                    variant="ghost" 
                    colorScheme="red"
                    onClick={() => setLocalSelectedContacts([])}
                  >
                    Clear Selection
                  </Button>
                </HStack>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                colorScheme="purple" 
                onClick={handleAddContacts}
                isDisabled={localSelectedContacts.length === 0}
                leftIcon={<AddIcon />}
              >
                Add {localSelectedContacts.length} Contact{localSelectedContacts.length !== 1 ? 's' : ''}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default CampaignSetup;
