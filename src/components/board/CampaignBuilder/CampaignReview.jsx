import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Stack,
  Text,
  Badge,
  useColorModeValue,
  Spinner,
  Divider,
  HStack,
  Icon,
  List,
  ListItem,
  ListIcon,
  Tooltip,
  Heading,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  VStack,
  ButtonGroup,
} from '@chakra-ui/react';
import { 
  InfoIcon, 
  CheckCircleIcon, 
  TimeIcon,
  ChevronRightIcon,
  SearchIcon,
  DownloadIcon,
  EmailIcon,
  PhoneIcon,
} from '@chakra-ui/icons';
import { FaUsers } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';

const CampaignReview = ({ 
  campaign, 
  nodes, 
  selectedSegment,
  manuallySelectedContacts = [] 
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const messageBgColor = useColorModeValue('gray.50', 'gray.700');

  const [segmentDetails, setSegmentDetails] = useState(null);
  const [contactCount, setContactCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contacts, setContacts] = useState([]);

  // Fetch segment details and contact count
  useEffect(() => {
    const fetchSegmentDetails = async () => {
      if (!selectedSegment) {
        console.log('No segment selected, using manually selected contacts only');
        setSegmentDetails(null);
        setContactCount(manuallySelectedContacts.length);
        setContacts(manuallySelectedContacts);
        setIsLoading(false);
        setIsLoadingContacts(false);
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('Fetching segment details for:', selectedSegment);
        const { data, error } = await supabase
          .from('audience_segments')
          .select('*')
          .eq('id', selectedSegment)
          .single();

        if (error) throw error;
        console.log('Fetched segment details:', data);
        setSegmentDetails(data);

        // After getting segment details, fetch contact count
        setIsLoadingContacts(true);
        const filters = JSON.parse(data.filters);
        let query = supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('workspace_id', data.workspace_id);
        
        // Apply each filter to the query
        filters.forEach((filter) => {
          // Handle status fields differently
          if (filter.field === 'lead_status') {
            query = query.eq('lead_status_id', filter.value);
          }
          else if (filter.field === 'appointment_status') {
            query = query.eq('appointment_status_id', filter.value);
          }
          else if (filter.field === 'appointment_result') {
            query = query.eq('appointment_result_id', filter.value);
          }
          // Handle JSONB fields
          else if (filter.field.includes('metadata')) {
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

        const { count, error: countError } = await query;
        if (countError) throw countError;
        console.log('Fetched contact count:', count);
        setContactCount(count || 0);

        // Fetch contacts
        const { data: segmentContacts, error: segmentContactsError } = await supabase
          .from('segment_contacts')
          .select(`
            contact_id,
            contacts (
              id,
              firstname,
              lastname,
              email,
              phone_number,
              lead_status,
              conversation_status
            )
          `)
          .eq('segment_id', selectedSegment);

        if (segmentContactsError) throw segmentContactsError;

        const validContacts = segmentContacts
          .map(sc => sc.contacts)
          .filter(Boolean);

        setContacts(validContacts);
      } catch (error) {
        console.error('Error fetching segment details:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingContacts(false);
      }
    };

    fetchSegmentDetails();
  }, [selectedSegment]);

  // Helper function to format filter operator
  const formatOperator = (operator) => {
    const operatorMap = {
      equals: 'is',
      not_equals: 'is not',
      contains: 'contains',
      not_contains: 'does not contain',
      greater_than: 'is greater than',
      less_than: 'is less than',
      starts_with: 'starts with',
      ends_with: 'ends with'
    };
    return operatorMap[operator] || operator;
  };

  // Combine segment and manually selected contacts
  const allContacts = [...contacts, ...manuallySelectedContacts];
  const uniqueContacts = Array.from(new Map(allContacts.map(c => [c.id, c])).values());
  
  const ContactsPopover = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredContacts, setFilteredContacts] = useState(uniqueContacts);

    useEffect(() => {
      const filtered = uniqueContacts.filter(contact => 
        contact.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone_number?.includes(searchTerm)
      );
      setFilteredContacts(filtered);
    }, [searchTerm, uniqueContacts]);

    const handleExport = () => {
      const csvContent = [
        // CSV Headers
        ['First Name', 'Last Name', 'Email', 'Phone', 'Lead Status', 'Conversation Status'],
        // CSV Data
        ...filteredContacts.map(contact => [
          contact.firstname,
          contact.lastname,
          contact.email,
          contact.phone_number,
          contact.lead_status,
          contact.conversation_status
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-contacts-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };

    return (
      <Popover placement="auto" strategy="fixed">
        <PopoverTrigger>
          <HStack 
            cursor="pointer" 
            p={2} 
            borderRadius="md"
            _hover={{ bg: useColorModeValue('purple.50', 'purple.900') }}
          >
            <Text>{contactCount} contact{contactCount !== 1 ? 's' : ''}</Text>
            <Icon as={InfoIcon} color="purple.500" />
          </HStack>
        </PopoverTrigger>
        <PopoverContent width={{ base: "300px", md: "500px", lg: "600px" }} maxW="90vw">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>
            <VStack spacing={3} align="stretch" w="100%">
              <Flex justify="space-between" align="center">
                <Heading size="sm">Campaign Contacts</Heading>
                <ButtonGroup size="sm">
                  <Button
                    leftIcon={<DownloadIcon />}
                    colorScheme="purple"
                    variant="outline"
                    onClick={handleExport}
                    size="xs"
                  >
                    Export
                  </Button>
                </ButtonGroup>
              </Flex>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </VStack>
          </PopoverHeader>
          <PopoverBody maxH="400px" overflowY="auto" p={0}>
            <Table size="sm">
              <Thead position="sticky" top={0} bg={useColorModeValue('white', 'gray.800')} zIndex={1}>
                <Tr>
                  <Th>Name</Th>
                  <Th display={{ base: 'none', md: 'table-cell' }}>Contact</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredContacts.map(contact => (
                  <Tr key={contact.id}>
                    <Td>
                      <Text fontWeight="medium" fontSize="sm">
                        {`${contact.firstname} ${contact.lastname}`}
                      </Text>
                    </Td>
                    <Td display={{ base: 'none', md: 'table-cell' }}>
                      <VStack align="start" spacing={0}>
                        <Tooltip label={contact.email} placement="top">
                          <HStack fontSize="xs">
                            <EmailIcon color="blue.500" boxSize={3} />
                            <Text noOfLines={1}>{contact.email || '-'}</Text>
                          </HStack>
                        </Tooltip>
                        <Tooltip label={contact.phone_number} placement="bottom">
                          <HStack fontSize="xs">
                            <PhoneIcon color="green.500" boxSize={3} />
                            <Text noOfLines={1}>{contact.phone_number || '-'}</Text>
                          </HStack>
                        </Tooltip>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Badge size="sm" colorScheme={contact.conversation_status === 'Open' ? 'green' : 'purple'}>
                          {contact.conversation_status}
                        </Badge>
                        <Badge size="sm" colorScheme="blue" fontSize="xs">
                          {contact.lead_status}
                        </Badge>
                      </VStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {filteredContacts.length === 0 && (
              <Box textAlign="center" py={4}>
                <Text color="gray.500">No contacts found matching your search</Text>
              </Box>
            )}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Stack spacing={6}>
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
      >
        <Heading size="sm" mb={4}>Campaign Details</Heading>
        <Stack spacing={3}>
          <Flex>
            <Text fontWeight="medium" width="150px">Name:</Text>
            <Box>
              <Text display="inline">{campaign.name.split(' (')[0]}</Text>
              {campaign.name.includes('(') && (
                <Text
                  display="inline"
                  fontSize="xs"
                  color={mutedTextColor}
                  ml={2}
                >
                  #{campaign.name.split('(')[1].replace(')', '')}
                </Text>
              )}
            </Box>
          </Flex>
          <Flex>
            <Text fontWeight="medium" width="150px">Type:</Text>
            <Text>{campaign.campaign_type === 'sequence' ? 'Status-based Sequence' : 
                   campaign.campaign_type === 'drip' ? 'Time-based Drip' : 'One-time Broadcast'}</Text>
          </Flex>
          <Flex>
            <Text fontWeight="medium" width="150px">Active Days:</Text>
            <Text>{campaign.settings?.active_days?.join(', ') || 'All days'}</Text>
          </Flex>
          <Flex>
            <Text fontWeight="medium" width="150px">Time Window:</Text>
            <Text>
              {campaign.settings?.time_window?.start || '09:00'} - {campaign.settings?.time_window?.end || '17:00'}
            </Text>
          </Flex>
        </Stack>
      </Box>

      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
      >
        <Heading size="sm" mb={4}>Audience</Heading>
        <Stack spacing={3}>
          <Flex>
            <Text fontWeight="medium" width="150px">Segment:</Text>
            <Text>{selectedSegment?.name || 'No segment selected'}</Text>
          </Flex>
          <Flex>
            <Text fontWeight="medium" width="150px">Contacts:</Text>
            <VStack align="start" spacing={1}>
              <ContactsPopover />
              <Text fontSize="sm" color={mutedTextColor}>
                {manuallySelectedContacts.length > 0 && (
                  <>
                    Including {manuallySelectedContacts.length} manually selected contact{manuallySelectedContacts.length !== 1 ? 's' : ''}
                  </>
                )}
              </Text>
            </VStack>
          </Flex>
        </Stack>
      </Box>

      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
      >
        <Heading size="sm" mb={4}>Message Sequence</Heading>
        <Stack spacing={4}>
          {nodes.map((node, index) => (
            <Box
              key={node.id}
              p={3}
              borderWidth="1px"
              borderRadius="md"
              borderColor={borderColor}
            >
              <Flex justify="space-between" mb={2}>
                <Text fontWeight="medium">
                  {index === 0 ? 'Initial Message' : `Message ${index + 1}`}
                </Text>
                <Badge colorScheme="purple">
                  {node.trigger_status ? `On ${node.trigger_status}` : `Day ${node.day}`}
                </Badge>
              </Flex>
              <Stack spacing={2}>
                <Flex>
                  <Text fontSize="sm" color={mutedTextColor} width="100px">Type:</Text>
                  <Text fontSize="sm">{node.type === 'sms' ? 'SMS' : 
                                     node.type === 'email' ? 'Email' : 'WhatsApp'}</Text>
                </Flex>
                <Flex>
                  <Text fontSize="sm" color={mutedTextColor} width="100px">Send Time:</Text>
                  <Text fontSize="sm">{node.send_time}</Text>
                </Flex>
                {node.type === 'email' && node.subject && (
                  <Flex>
                    <Text fontSize="sm" color={mutedTextColor} width="100px">Subject:</Text>
                    <Text fontSize="sm">{node.subject}</Text>
                  </Flex>
                )}
                <Box mt={2}>
                  <Text fontSize="sm" color={mutedTextColor} mb={1}>Message:</Text>
                  <Box
                    fontSize="sm"
                    p={2}
                    bg={messageBgColor}
                    borderRadius="md"
                  >
                    {node.message}
                  </Box>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
};

export default CampaignReview;
