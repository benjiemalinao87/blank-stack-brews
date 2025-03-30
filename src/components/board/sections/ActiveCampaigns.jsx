import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Input,
  Button,
  Text,
  Badge,
  IconButton,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  useColorMode,
  Stack,
  useToast,
  Spinner,
  Grid,
  SimpleGrid,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Progress,
  Tooltip,
  VStack,
  HStack,
  Heading,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  ButtonGroup,
  Icon,
} from '@chakra-ui/react';
import { SearchIcon, EditIcon, CopyIcon, DeleteIcon, ViewIcon, HamburgerIcon, RepeatIcon, InfoIcon, EmailIcon, PhoneIcon, DownloadIcon, AddIcon, CalendarIcon, CloseIcon, CheckIcon } from '@chakra-ui/icons';
import { supabase } from '../../../lib/supabaseUnified';
import JSZip from 'jszip';

// Contacts Popover component
const ContactsPopover = ({ campaignId, contactCount, workspaceId, statusFilter, startDate, endDate }) => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  // Move the useColorModeValue hook to the top level
  const hoverBgColor = useColorModeValue('purple.50', 'purple.900');
  const headerBgColor = useColorModeValue('white', 'gray.800');

  // Fetch contacts when popover is opened
  const handleOpen = async () => {
    if (contacts.length === 0) {
      await fetchCampaignContacts();
    }
  };

  // Fetch contacts for the campaign
  const fetchCampaignContacts = async () => {
    try {
      setIsLoading(true);
      
      // Format dates for query if provided
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : null;
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : null;
      
      // Start building the query
      let query = supabase
        .from('campaign_contact_status')
        .select(`
          contact_id,
          status,
          enrolled_at,
          completed_at,
          opt_out_at,
          opt_out_reason,
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
        .eq('campaign_id', campaignId)
        .eq('workspace_id', workspaceId);
      
      // Add status filter if provided
      if (statusFilter) {
        if (statusFilter === 'in_progress') {
          query = query.eq('status', 'enrolled').is('completed_at', null).is('opt_out_at', null);
        } else if (statusFilter === 'completed') {
          query = query.eq('status', 'completed').not('completed_at', 'is', null);
        } else if (statusFilter === 'opted_out') {
          query = query.not('opt_out_at', 'is', null);
        } else if (statusFilter === 'enrolled') {
          // No additional filter needed for enrolled (all contacts)
        }
      }
      
      // Add date filters if provided
      if (formattedStartDate) {
        if (statusFilter === 'completed') {
          query = query.gte('completed_at', formattedStartDate);
        } else if (statusFilter === 'opted_out') {
          query = query.gte('opt_out_at', formattedStartDate);
        } else {
          query = query.gte('enrolled_at', formattedStartDate);
        }
      }
      
      if (formattedEndDate) {
        if (statusFilter === 'completed') {
          query = query.lte('completed_at', formattedEndDate);
        } else if (statusFilter === 'opted_out') {
          query = query.lte('opt_out_at', formattedEndDate);
        } else {
          query = query.lte('enrolled_at', formattedEndDate);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Extract valid contacts and remove any null values
      const validContacts = data
        ?.filter(cs => cs.contacts && cs.contact_id)
        ?.map(cs => ({
          ...cs.contacts,
          campaign_status: cs.status,
          enrolled_at: cs.enrolled_at,
          completed_at: cs.completed_at,
          opt_out_at: cs.opt_out_at,
          opt_out_reason: cs.opt_out_reason
        }))
        ?.filter(Boolean) || [];
      
      setContacts(validContacts);
      setFilteredContacts(validContacts);
    } catch (error) {
      console.error('Error fetching campaign contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get title based on status filter
  const getTitle = () => {
    let title = 'Campaign Contacts';
    if (statusFilter === 'in_progress') title = 'In Progress Contacts';
    if (statusFilter === 'completed') title = 'Completed Contacts';
    if (statusFilter === 'opted_out') title = 'Opted Out Contacts';
    
    // Add date range to title if provided
    if (startDate || endDate) {
      title += ' (';
      if (startDate) title += `From ${startDate}`;
      if (startDate && endDate) title += ' ';
      if (endDate) title += `To ${endDate}`;
      title += ')';
    }
    
    return title;
  };

  // Filter contacts based on search term
  useEffect(() => {
    if (contacts.length > 0) {
      const filtered = contacts.filter(contact => 
        contact.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone_number?.includes(searchTerm)
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  // Export contacts to CSV
  const handleExport = () => {
    const csvContent = [
      // CSV Headers
      ['First Name', 'Last Name', 'Email', 'Phone', 'Lead Status', 'Conversation Status', 'Campaign Status', 'Enrolled At', 'Completed At', 'Opted Out At', 'Opt Out Reason'],
      // CSV Data
      ...filteredContacts.map(contact => [
        contact.firstname || '',
        contact.lastname || '',
        contact.email || '',
        contact.phone_number || '',
        contact.lead_status || '',
        contact.conversation_status || '',
        contact.campaign_status || '',
        contact.enrolled_at ? new Date(contact.enrolled_at).toLocaleString() : '',
        contact.completed_at ? new Date(contact.completed_at).toLocaleString() : '',
        contact.opt_out_at ? new Date(contact.opt_out_at).toLocaleString() : '',
        contact.opt_out_reason || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-contacts-${campaignId}-${statusFilter}-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Get status color based on status
  const getStatusColor = (contact) => {
    if (contact.opt_out_at) return 'red';
    if (contact.completed_at) return 'green';
    return 'blue';
  };

  // Get status text based on status
  const getStatusText = (contact) => {
    if (contact.opt_out_at) return 'Opted Out';
    if (contact.completed_at) return 'Completed';
    return 'In Progress';
  };

  // Effect to refetch contacts when date range changes
  useEffect(() => {
    if (contacts.length > 0 && (startDate || endDate)) {
      fetchCampaignContacts();
    }
  }, [startDate, endDate]);

  return (
    <Popover placement="auto" strategy="fixed" onOpen={handleOpen}>
      <PopoverTrigger>
        <HStack 
          cursor="pointer" 
          p={1} 
          borderRadius="md"
          _hover={{ bg: hoverBgColor }}
        >
          <StatNumber>{contactCount || 0}</StatNumber>
          <Icon as={InfoIcon} color="purple.500" boxSize={3} />
        </HStack>
      </PopoverTrigger>
      <PopoverContent width={{ base: "300px", md: "500px", lg: "600px" }} maxW="90vw">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>
          <VStack spacing={3} align="stretch" w="100%">
            <Flex justify="space-between" align="center">
              <Heading size="sm">{getTitle()}</Heading>
              <ButtonGroup size="sm">
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="purple"
                  variant="outline"
                  onClick={handleExport}
                  size="xs"
                  isDisabled={filteredContacts.length === 0}
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
          {isLoading ? (
            <Flex justify="center" align="center" py={4}>
              <Spinner size="sm" color="purple.500" />
            </Flex>
          ) : (
            <>
              <Table size="sm">
                <Thead position="sticky" top={0} bg={headerBgColor} zIndex={1}>
                  <Tr>
                    <Th>Name</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Contact</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <Tr key={contact.id}>
                        <Td>
                          <Text fontWeight="medium" fontSize="sm">
                            {`${contact.firstname || ''} ${contact.lastname || ''}`}
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
                            <Badge size="sm" colorScheme={getStatusColor(contact)}>
                              {getStatusText(contact)}
                            </Badge>
                            <Badge size="sm" colorScheme={contact.conversation_status === 'Open' ? 'green' : 'purple'} fontSize="xs">
                              {contact.conversation_status}
                            </Badge>
                            {contact.opt_out_reason && (
                              <Tooltip label={contact.opt_out_reason}>
                                <Text fontSize="xs" color="red.500" noOfLines={1}>
                                  Reason: {contact.opt_out_reason}
                                </Text>
                              </Tooltip>
                            )}
                          </VStack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={3} textAlign="center" py={4}>
                        <Text color="gray.500">No contacts found matching your search</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

// Card view for campaigns
const CampaignCard = ({ name, status, metrics, onEdit, onDuplicate, onDelete, campaignId, workspaceId }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const statBgColor = useColorModeValue('purple.50', 'purple.900');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredMetrics, setFilteredMetrics] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();
  
  // Format message types for display
  const formatMessageTypes = () => {
    if (!metrics.messageTypes) return '';
    
    const types = [];
    Object.entries(metrics.messageTypes).forEach(([type, count]) => {
      types.push(`${count} ${type}`);
    });
    
    return types.join(', ');
  };

  // Apply date filter to metrics
  const applyDateFilter = async () => {
    if (!startDate && !endDate) {
      setFilteredMetrics(null);
      return;
    }

    try {
      // Format dates for query
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : null;
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : null;
      
      // Build query for contacts based on date range
      let query = supabase
        .from('campaign_contact_status')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId);
      
      if (formattedStartDate) {
        query = query.gte('enrolled_at', formattedStartDate);
      }
      
      if (formattedEndDate) {
        query = query.lte('enrolled_at', formattedEndDate);
      }
      
      const { count: enrolledCount, error: enrolledError } = await query;
      if (enrolledError) throw enrolledError;
      
      // Get in-progress contacts count
      let inProgressQuery = supabase
        .from('campaign_contact_status')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId)
        .eq('status', 'enrolled')
        .is('completed_at', null);
      
      if (formattedStartDate) {
        inProgressQuery = inProgressQuery.gte('enrolled_at', formattedStartDate);
      }
      
      if (formattedEndDate) {
        inProgressQuery = inProgressQuery.lte('enrolled_at', formattedEndDate);
      }
      
      const { count: inProgressCount, error: inProgressError } = await inProgressQuery;
      if (inProgressError) throw inProgressError;
      
      // Get completed contacts count
      let completedQuery = supabase
        .from('campaign_contact_status')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null);
      
      if (formattedStartDate) {
        completedQuery = completedQuery.gte('completed_at', formattedStartDate);
      }
      
      if (formattedEndDate) {
        completedQuery = completedQuery.lte('completed_at', formattedEndDate);
      }
      
      const { count: completedCount, error: completedError } = await completedQuery;
      if (completedError) throw completedError;
      
      // Get opted-out contacts count
      let optedOutQuery = supabase
        .from('campaign_contact_status')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId)
        .not('opt_out_at', 'is', null);
      
      if (formattedStartDate) {
        optedOutQuery = optedOutQuery.gte('opt_out_at', formattedStartDate);
      }
      
      if (formattedEndDate) {
        optedOutQuery = optedOutQuery.lte('opt_out_at', formattedEndDate);
      }
      
      const { count: optedOutCount, error: optedOutError } = await optedOutQuery;
      if (optedOutError) throw optedOutError;
      
      // Get sent executions count
      let sentQuery = supabase
        .from('campaign_executions')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId)
        .eq('status', 'sent');
      
      if (formattedStartDate) {
        sentQuery = sentQuery.gte('sent_time', formattedStartDate);
      }
      
      if (formattedEndDate) {
        sentQuery = sentQuery.lte('sent_time', formattedEndDate);
      }
      
      const { count: sentCount, error: sentError } = await sentQuery;
      if (sentError) throw sentError;
      
      // Update filtered metrics
      setFilteredMetrics({
        enrolled: enrolledCount || 0,
        inProgress: inProgressCount || 0,
        completed: completedCount || 0,
        optedOut: optedOutCount || 0,
        scheduled: metrics.scheduled, // Keep original scheduled count
        sent: sentCount || 0,
        steps: metrics.steps,
        messageTypes: metrics.messageTypes
      });
    } catch (error) {
      console.error('Error applying date filter:', error);
      toast({
        title: 'Error filtering data',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Reset date filter
  const resetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredMetrics(null);
  };

  // Export campaign data
  const exportCampaignData = async () => {
    try {
      setIsExporting(true);
      
      // Get all campaign contacts with their status
      const { data: contactData, error: contactError } = await supabase
        .from('campaign_contact_status')
        .select(`
          contact_id,
          status,
          enrolled_at,
          completed_at,
          opt_out_at,
          opt_out_reason,
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
        .eq('campaign_id', campaignId)
        .eq('workspace_id', workspaceId);
      
      if (contactError) throw contactError;
      
      // Get campaign executions
      const { data: executionData, error: executionError } = await supabase
        .from('campaign_executions')
        .select('*')
        .eq('campaign_id', campaignId);
      
      if (executionError) throw executionError;
      
      // Get campaign nodes
      const { data: nodeData, error: nodeError } = await supabase
        .from('campaign_nodes')
        .select('*')
        .eq('campaign_id', campaignId);
      
      if (nodeError) throw nodeError;
      
      // Format contact data for CSV
      const contactsForCSV = contactData.map(cs => ({
        'Contact ID': cs.contact_id,
        'First Name': cs.contacts?.firstname || '',
        'Last Name': cs.contacts?.lastname || '',
        'Email': cs.contacts?.email || '',
        'Phone': cs.contacts?.phone_number || '',
        'Lead Status': cs.contacts?.lead_status || '',
        'Conversation Status': cs.contacts?.conversation_status || '',
        'Campaign Status': cs.status || '',
        'Enrolled At': cs.enrolled_at ? new Date(cs.enrolled_at).toLocaleString() : '',
        'Completed At': cs.completed_at ? new Date(cs.completed_at).toLocaleString() : '',
        'Opted Out At': cs.opt_out_at ? new Date(cs.opt_out_at).toLocaleString() : '',
        'Opt Out Reason': cs.opt_out_reason || ''
      }));
      
      // Format execution data for CSV
      const executionsForCSV = executionData.map(ex => ({
        'Execution ID': ex.id,
        'Node ID': ex.node_id,
        'Contact ID': ex.contact_id,
        'Status': ex.status,
        'Scheduled Time': ex.scheduled_time ? new Date(ex.scheduled_time).toLocaleString() : '',
        'Sent Time': ex.sent_time ? new Date(ex.sent_time).toLocaleString() : '',
        'Message ID': ex.twilio_message_id || ''
      }));
      
      // Format node data for CSV
      const nodesForCSV = nodeData.map(node => ({
        'Node ID': node.id,
        'Type': node.type,
        'Day': node.day,
        'Sequence Order': node.sequence_order,
        'Send Time': node.send_time,
        'Message': node.message
      }));
      
      // Create campaign summary
      const campaignSummary = [{
        'Campaign Name': name,
        'Status': status,
        'Enrolled Contacts': filteredMetrics?.enrolled || metrics.enrolled,
        'In Progress Contacts': filteredMetrics?.inProgress || metrics.inProgress,
        'Completed Contacts': filteredMetrics?.completed || metrics.completed,
        'Opted Out Contacts': filteredMetrics?.optedOut || metrics.optedOut,
        'Scheduled Messages': metrics.scheduled,
        'Sent Messages': filteredMetrics?.sent || metrics.sent,
        'Steps': metrics.steps,
        'Message Types': formatMessageTypes()
      }];
      
      // Create a ZIP file with multiple CSV files
      const zip = new JSZip();
      
      // Add campaign summary
      const summaryCSV = convertToCSV(campaignSummary);
      zip.file("campaign_summary.csv", summaryCSV);
      
      // Add contacts
      const contactsCSV = convertToCSV(contactsForCSV);
      zip.file("campaign_contacts.csv", contactsCSV);
      
      // Add executions
      const executionsCSV = convertToCSV(executionsForCSV);
      zip.file("campaign_executions.csv", executionsCSV);
      
      // Add nodes
      const nodesCSV = convertToCSV(nodesForCSV);
      zip.file("campaign_nodes.csv", nodesCSV);
      
      // Generate ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      
      // Download the ZIP file
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${campaignId}-export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Campaign data has been exported successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting campaign data:', error);
      toast({
        title: 'Export Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Helper function to convert array of objects to CSV
  const convertToCSV = (objArray) => {
    if (objArray.length === 0) return '';
    
    const header = Object.keys(objArray[0]).join(',');
    const rows = objArray.map(obj => 
      Object.values(obj).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [header, ...rows].join('\n');
  };
  
  // Use filtered metrics if available, otherwise use original metrics
  const displayMetrics = filteredMetrics || metrics;
  
  return (
    <Box
      bg={bgColor}
      p={5}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      boxShadow="sm"
      _hover={{ borderColor: 'purple.400', boxShadow: 'md' }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Flex align="center" gap={3}>
          <Text fontWeight="semibold" fontSize="lg">{name}</Text>
          <Badge colorScheme={status === 'active' ? 'green' : 'purple'} variant="subtle">
            {status || 'Draft'}
          </Badge>
        </Flex>
        <Flex align="center" gap={2}>
          <Tooltip label="Filter by date">
            <IconButton
              icon={<CalendarIcon />}
              size="sm"
              variant="ghost"
              onClick={() => setShowDateFilter(!showDateFilter)}
              aria-label="Filter by date"
              colorScheme={showDateFilter ? "purple" : "gray"}
            />
          </Tooltip>
          <Tooltip label="Export campaign data">
            <IconButton
              icon={<DownloadIcon />}
              size="sm"
              variant="ghost"
              onClick={exportCampaignData}
              aria-label="Export campaign data"
              isLoading={isExporting}
            />
          </Tooltip>
          <Tooltip label="Edit campaign">
            <IconButton
              icon={<EditIcon />}
              size="sm"
              variant="ghost"
              onClick={onEdit}
              aria-label="Edit campaign"
            />
          </Tooltip>
          <Tooltip label="Duplicate campaign">
            <IconButton
              icon={<CopyIcon />}
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              aria-label="Duplicate campaign"
            />
          </Tooltip>
          <Tooltip label="Delete campaign">
            <IconButton
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              onClick={onDelete}
              aria-label="Delete campaign"
            />
          </Tooltip>
        </Flex>
      </Flex>
      
      {showDateFilter && (
        <Box mb={4} p={3} borderWidth="1px" borderRadius="md" borderColor="purple.200" bg="purple.50">
          <VStack spacing={3}>
            <Flex w="100%" justify="space-between" align="center">
              <Heading size="sm">Date Range Filter</Heading>
              <IconButton
                icon={<CloseIcon />}
                size="xs"
                variant="ghost"
                onClick={() => setShowDateFilter(false)}
                aria-label="Close date filter"
              />
            </Flex>
            <SimpleGrid columns={2} spacing={4} w="100%">
              <FormControl>
                <FormLabel fontSize="xs">Start Date</FormLabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="sm"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">End Date</FormLabel>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size="sm"
                />
              </FormControl>
            </SimpleGrid>
            <Flex w="100%" justify="flex-end" gap={2}>
              <Button size="sm" variant="outline" onClick={resetDateFilter}>Reset</Button>
              <Button size="sm" colorScheme="purple" onClick={applyDateFilter}>Apply</Button>
            </Flex>
            {filteredMetrics && (
              <Text fontSize="xs" fontStyle="italic" alignSelf="flex-start">
                Showing filtered data from {startDate || 'beginning'} to {endDate || 'now'}
              </Text>
            )}
          </VStack>
        </Box>
      )}
      
      <Divider mb={4} />
      
      <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">Contact Metrics</Text>
      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={4}>
        <Stat bg={statBgColor} p={3} borderRadius="md">
          <StatLabel fontSize="xs">Enrolled</StatLabel>
          <ContactsPopover 
            campaignId={campaignId} 
            contactCount={displayMetrics.enrolled || 0} 
            workspaceId={workspaceId}
            statusFilter="enrolled"
            startDate={startDate}
            endDate={endDate}
          />
          <StatHelpText>Contacts</StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={3} borderRadius="md">
          <StatLabel fontSize="xs">In Progress</StatLabel>
          <ContactsPopover 
            campaignId={campaignId} 
            contactCount={displayMetrics.inProgress || 0} 
            workspaceId={workspaceId}
            statusFilter="in_progress"
            startDate={startDate}
            endDate={endDate}
          />
          <StatHelpText>Contacts</StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={3} borderRadius="md">
          <StatLabel fontSize="xs">Completed</StatLabel>
          <ContactsPopover 
            campaignId={campaignId} 
            contactCount={displayMetrics.completed || 0} 
            workspaceId={workspaceId}
            statusFilter="completed"
            startDate={startDate}
            endDate={endDate}
          />
          <StatHelpText>Contacts</StatHelpText>
        </Stat>
      </Grid>
      
      <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.600">Message Metrics</Text>
      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={4}>
        <Stat bg={statBgColor} p={3} borderRadius="md">
          <StatLabel fontSize="xs">Scheduled</StatLabel>
          <StatNumber>{displayMetrics.scheduled || 0}</StatNumber>
          <StatHelpText>
            {formatMessageTypes() || 'Messages'}
          </StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={3} borderRadius="md">
          <StatLabel fontSize="xs">Sent</StatLabel>
          <StatNumber>{displayMetrics.sent || 0}</StatNumber>
          <StatHelpText>Messages</StatHelpText>
        </Stat>
        <Stat bg={statBgColor} p={3} borderRadius="md">
          <StatLabel fontSize="xs">Opted Out</StatLabel>
          <ContactsPopover 
            campaignId={campaignId} 
            contactCount={displayMetrics.optedOut || 0} 
            workspaceId={workspaceId}
            statusFilter="opted_out"
            startDate={startDate}
            endDate={endDate}
          />
          <StatHelpText>Contacts</StatHelpText>
        </Stat>
      </Grid>
      
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={1}>Campaign Progress</Text>
        <Progress 
          value={(displayMetrics.completed / (displayMetrics.enrolled || 1)) * 100} 
          colorScheme="purple" 
          size="sm" 
          borderRadius="full"
        />
        <Flex justify="space-between" mt={1}>
          <Text fontSize="xs" color="gray.500">{displayMetrics.steps} Steps</Text>
          <Text fontSize="xs" color="gray.500">
            {Math.round((displayMetrics.completed / (displayMetrics.enrolled || 1)) * 100)}% Complete
          </Text>
        </Flex>
      </Box>
    </Box>
  );
};

// List view row for campaigns
const CampaignListItem = ({ name, status, metrics, onEdit, onDuplicate, onDelete, campaignId, workspaceId }) => {
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredMetrics, setFilteredMetrics] = useState(null);
  const toast = useToast();
  
  // Format message types for display
  const formatMessageTypes = () => {
    if (!metrics.messageTypes) return '';
    
    const types = [];
    Object.entries(metrics.messageTypes).forEach(([type, count]) => {
      types.push(`${count} ${type}`);
    });
    
    return types.join(', ');
  };
  
  // Apply date filter to metrics
  const applyDateFilter = async () => {
    if (!startDate && !endDate) {
      setFilteredMetrics(null);
      return;
    }

    try {
      // Format dates for query
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : null;
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : null;
      
      // Build query for contacts based on date range
      let query = supabase
        .from('campaign_contact_status')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId);
      
      if (formattedStartDate) {
        query = query.gte('enrolled_at', formattedStartDate);
      }
      
      if (formattedEndDate) {
        query = query.lte('enrolled_at', formattedEndDate);
      }
      
      const { count: enrolledCount, error: enrolledError } = await query;
      if (enrolledError) throw enrolledError;
      
      // Get in-progress contacts count
      let inProgressQuery = supabase
        .from('campaign_contact_status')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId)
        .eq('status', 'enrolled')
        .is('completed_at', null);
      
      if (formattedStartDate) {
        inProgressQuery = inProgressQuery.gte('enrolled_at', formattedStartDate);
      }
      
      if (formattedEndDate) {
        inProgressQuery = inProgressQuery.lte('enrolled_at', formattedEndDate);
      }
      
      const { count: inProgressCount, error: inProgressError } = await inProgressQuery;
      if (inProgressError) throw inProgressError;
      
      // Get completed contacts count
      let completedQuery = supabase
        .from('campaign_contact_status')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null);
      
      if (formattedStartDate) {
        completedQuery = completedQuery.gte('completed_at', formattedStartDate);
      }
      
      if (formattedEndDate) {
        completedQuery = completedQuery.lte('completed_at', formattedEndDate);
      }
      
      const { count: completedCount, error: completedError } = await completedQuery;
      if (completedError) throw completedError;
      
      // Get opted-out contacts count
      let optedOutQuery = supabase
        .from('campaign_contact_status')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId)
        .not('opt_out_at', 'is', null);
      
      if (formattedStartDate) {
        optedOutQuery = optedOutQuery.gte('opt_out_at', formattedStartDate);
      }
      
      if (formattedEndDate) {
        optedOutQuery = optedOutQuery.lte('opt_out_at', formattedEndDate);
      }
      
      const { count: optedOutCount, error: optedOutError } = await optedOutQuery;
      if (optedOutError) throw optedOutError;
      
      // Get sent executions count
      let sentQuery = supabase
        .from('campaign_executions')
        .select('*', { count: 'exact', head: false })
        .eq('campaign_id', campaignId)
        .eq('status', 'sent');
      
      if (formattedStartDate) {
        sentQuery = sentQuery.gte('sent_time', formattedStartDate);
      }
      
      if (formattedEndDate) {
        sentQuery = sentQuery.lte('sent_time', formattedEndDate);
      }
      
      const { count: sentCount, error: sentError } = await sentQuery;
      if (sentError) throw sentError;
      
      // Update filtered metrics
      setFilteredMetrics({
        enrolled: enrolledCount || 0,
        inProgress: inProgressCount || 0,
        completed: completedCount || 0,
        optedOut: optedOutCount || 0,
        scheduled: metrics.scheduled, // Keep original scheduled count
        sent: sentCount || 0,
        steps: metrics.steps,
        messageTypes: metrics.messageTypes
      });
    } catch (error) {
      console.error('Error applying date filter:', error);
      toast({
        title: 'Error filtering data',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Reset date filter
  const resetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilteredMetrics(null);
  };
  
  // Use filtered metrics if available, otherwise use original metrics
  const displayMetrics = filteredMetrics || metrics;
  
  return (
    <Tr 
      _hover={{ bg: hoverBg }} 
      transition="background-color 0.2s"
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
    >
      <Td py={2.5}>
        <Flex align="center" justify="space-between">
          <Flex align="center">
            <Text fontWeight="medium" fontSize="sm">{name}</Text>
            <Badge ml={2} colorScheme={status === 'active' ? 'green' : 'purple'} variant="subtle" fontSize="xs">
              {status || 'Draft'}
            </Badge>
          </Flex>
          {showDateFilter ? (
            <HStack spacing={2}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="xs"
                width="110px"
              />
              <Text fontSize="xs">to</Text>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="xs"
                width="110px"
              />
              <ButtonGroup size="xs" isAttached>
                <IconButton
                  icon={<CheckIcon />}
                  size="xs"
                  onClick={applyDateFilter}
                  aria-label="Apply filter"
                  colorScheme="purple"
                />
                <IconButton
                  icon={<CloseIcon />}
                  size="xs"
                  onClick={resetDateFilter}
                  aria-label="Reset filter"
                />
              </ButtonGroup>
            </HStack>
          ) : (
            <Tooltip label="Filter by date">
              <IconButton
                icon={<CalendarIcon />}
                size="xs"
                variant="ghost"
                onClick={() => setShowDateFilter(true)}
                aria-label="Filter by date"
              />
            </Tooltip>
          )}
        </Flex>
      </Td>
      <Td isNumeric py={2.5}>
        <Stat size="sm" textAlign="right">
          <StatNumber fontSize="sm">
            <ContactsPopover 
              campaignId={campaignId} 
              contactCount={displayMetrics.enrolled || 0} 
              workspaceId={workspaceId}
              statusFilter="enrolled"
              startDate={startDate}
              endDate={endDate}
            />
          </StatNumber>
        </Stat>
      </Td>
      <Td isNumeric py={2.5}>
        <Stat size="sm" textAlign="right">
          <StatNumber fontSize="sm">
            <ContactsPopover 
              campaignId={campaignId} 
              contactCount={displayMetrics.inProgress || 0} 
              workspaceId={workspaceId}
              statusFilter="in_progress"
              startDate={startDate}
              endDate={endDate}
            />
          </StatNumber>
        </Stat>
      </Td>
      <Td isNumeric py={2.5} borderRightWidth="2px" borderRightColor="purple.100">
        <Stat size="sm" textAlign="right">
          <StatNumber fontSize="sm">
            <ContactsPopover 
              campaignId={campaignId} 
              contactCount={displayMetrics.completed || 0} 
              workspaceId={workspaceId}
              statusFilter="completed"
              startDate={startDate}
              endDate={endDate}
            />
          </StatNumber>
        </Stat>
      </Td>
      <Td isNumeric py={2.5}>
        <Stat size="sm" textAlign="right">
          <StatNumber fontSize="sm">{displayMetrics.scheduled || 0}</StatNumber>
          <StatHelpText fontSize="xs">{formatMessageTypes()}</StatHelpText>
        </Stat>
      </Td>
      <Td isNumeric py={2.5}>
        <Stat size="sm" textAlign="right">
          <StatNumber fontSize="sm">{displayMetrics.sent || 0}</StatNumber>
        </Stat>
      </Td>
      <Td isNumeric py={2.5} borderRightWidth="2px" borderRightColor="purple.100">
        <Stat size="sm" textAlign="right">
          <StatNumber fontSize="sm">
            <ContactsPopover 
              campaignId={campaignId} 
              contactCount={displayMetrics.optedOut || 0} 
              workspaceId={workspaceId}
              statusFilter="opted_out"
              startDate={startDate}
              endDate={endDate}
            />
          </StatNumber>
        </Stat>
      </Td>
      <Td isNumeric py={2.5}>
        <Stat size="sm" textAlign="right">
          <StatNumber fontSize="sm">{displayMetrics.steps || 0}</StatNumber>
        </Stat>
      </Td>
      <Td py={2.5}>
        <Flex justify="flex-end" gap={1}>
          <IconButton
            icon={<EditIcon boxSize="3.5" />}
            size="sm"
            variant="ghost"
            onClick={onEdit}
            aria-label="Edit campaign"
          />
          <IconButton
            icon={<CopyIcon boxSize="3.5" />}
            size="sm"
            variant="ghost"
            onClick={onDuplicate}
            aria-label="Duplicate campaign"
          />
          <IconButton
            icon={<DeleteIcon boxSize="3.5" />}
            size="sm"
            variant="ghost"
            onClick={onDelete}
            aria-label="Delete campaign"
          />
        </Flex>
      </Td>
    </Tr>
  );
};

const ActiveCampaigns = ({ workspaceId, boardId, boardTitle = '', onCreateNew }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [boardName, setBoardName] = useState('');
  const [isCardView, setIsCardView] = useState(true);
  const [campaignMetrics, setCampaignMetrics] = useState({});
  const toast = useToast();
  const { colorMode } = useColorMode();
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const inputBorder = useColorModeValue('gray.200', 'gray.600');
  const buttonBg = useColorModeValue('white', 'gray.700');
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.600');
  const refreshIconColor = useColorModeValue('gray.500', 'gray.400');
  const createBtnBg = useColorModeValue('purple.500', 'purple.200');
  const createBtnColor = useColorModeValue('white', 'gray.800');
  const emptyStateBgColor = useColorModeValue('gray.50', 'gray.700');
  const searchIconColor = useColorModeValue('gray.400', 'gray.500');

  useEffect(() => {
    fetchCampaigns();
    fetchPhoneNumber();
    fetchBoardName();
  }, [workspaceId, boardId]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      // Check if workspaceId and boardId are defined
      if (!workspaceId || !boardId) {
        console.error('workspaceId or boardId is undefined');
        toast({
          title: 'Error fetching campaigns',
          description: 'Missing workspace or board information',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }
      
      // Fetch campaigns from Supabase
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          id, 
          name, 
          status,
          segment_id,
          campaign_nodes(id, day, sequence_order, type)
        `)
        .eq('workspace_id', workspaceId)
        .eq('board_id', boardId);
      
      if (error) {
        throw error;
      }
      
      // Transform the data to include steps count and message type counts
      const transformedData = data.map(campaign => {
        // Get unique days from campaign nodes
        const uniqueDays = campaign.campaign_nodes 
          ? [...new Set(campaign.campaign_nodes.map(node => node.day))]
          : [];
        
        // Count messages by type
        const messageTypes = {};
        if (campaign.campaign_nodes && campaign.campaign_nodes.length > 0) {
          campaign.campaign_nodes.forEach(node => {
            messageTypes[node.type] = (messageTypes[node.type] || 0) + 1;
          });
        }
        
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status || 'draft',
          segment_id: campaign.segment_id,
          steps: uniqueDays.length || 0,  // Count unique days instead of nodes
          messageTypes: messageTypes,
          totalNodes: campaign.campaign_nodes ? campaign.campaign_nodes.length : 0
        };
      });
      
      setCampaigns(transformedData);
      
      // Fetch metrics for each campaign
      await fetchCampaignMetrics(transformedData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error fetching campaigns',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignMetrics = async (campaignsList) => {
    try {
      const metrics = {};
      
      // For each campaign, fetch metrics
      for (const campaign of campaignsList) {
        // Get enrolled contacts count
        const { count: enrolledCount, error: enrolledError } = await supabase
          .from('campaign_contact_status')
          .select('*', { count: 'exact', head: false })
          .eq('campaign_id', campaign.id);
          
        if (enrolledError) throw enrolledError;
        
        // Get in-progress contacts count
        const { count: inProgressCount, error: inProgressError } = await supabase
          .from('campaign_contact_status')
          .select('*', { count: 'exact', head: false })
          .eq('campaign_id', campaign.id)
          .eq('status', 'enrolled')
          .is('completed_at', null);
          
        if (inProgressError) throw inProgressError;
        
        // Get completed contacts count
        const { count: completedCount, error: completedError } = await supabase
          .from('campaign_contact_status')
          .select('*', { count: 'exact', head: false })
          .eq('campaign_id', campaign.id)
          .eq('status', 'completed')
          .not('completed_at', 'is', null);
          
        if (completedError) throw completedError;
        
        // Get opted-out contacts count
        const { count: optedOutCount, error: optedOutError } = await supabase
          .from('campaign_contact_status')
          .select('*', { count: 'exact', head: false })
          .eq('campaign_id', campaign.id)
          .not('opt_out_at', 'is', null);
          
        if (optedOutError) throw optedOutError;
        
        // Get scheduled executions count
        const { count: scheduledCount, error: scheduledError } = await supabase
          .from('campaign_executions')
          .select('*', { count: 'exact', head: false })
          .eq('campaign_id', campaign.id)
          .eq('status', 'scheduled');
          
        if (scheduledError) throw scheduledError;
        
        // Get sent executions count
        const { count: sentCount, error: sentError } = await supabase
          .from('campaign_executions')
          .select('*', { count: 'exact', head: false })
          .eq('campaign_id', campaign.id)
          .eq('status', 'sent');
          
        if (sentError) throw sentError;
        
        // Store metrics for this campaign
        metrics[campaign.id] = {
          enrolled: enrolledCount || 0,
          inProgress: inProgressCount || 0,
          completed: completedCount || 0,
          optedOut: optedOutCount || 0,
          scheduled: campaign.totalNodes || 0, // Use total nodes count instead of scheduled executions
          sent: sentCount || 0,
          steps: campaign.steps,
          messageTypes: campaign.messageTypes
        };
      }
      
      setCampaignMetrics(metrics);
    } catch (error) {
      console.error('Error fetching campaign metrics:', error);
      // Don't show toast for metrics errors to avoid overwhelming the user
    }
  };

  const fetchPhoneNumber = async () => {
    try {
      // Fetch phone number from Supabase
      const { data, error } = await supabase
        .from('board_settings')
        .select('phone_number')
        .eq('workspace_id', workspaceId)
        .eq('board_id', boardId)
        .single();
      
      if (error) {
        throw error;
      }
      
      setPhoneNumber(data?.phone_number || '');
    } catch (error) {
      console.error('Error fetching phone number:', error);
      // Don't show toast for this error as it's not critical
    }
  };

  const fetchBoardName = async () => {
    try {
      // Fetch board name from Supabase
      const { data, error } = await supabase
        .from('boards')
        .select('name')
        .eq('id', boardId)
        .eq('workspace_id', workspaceId)
        .single();
      
      if (error) {
        throw error;
      }
      
      setBoardName(data?.name || boardTitle || '');
    } catch (error) {
      console.error('Error fetching board name:', error);
      // Fallback to provided boardTitle if available
      setBoardName(boardTitle || '');
    }
  };

  const handleEdit = (campaignId) => {
    // Navigate to edit campaign page or open edit modal
    console.log('Edit', campaignId);
    
    // Find the campaign to edit
    const campaignToEdit = campaigns.find(c => c.id === campaignId);
    if (!campaignToEdit) return;
    
    // Fetch the campaign details including nodes
    fetchCampaignDetails(campaignId);
  };
  
  const fetchCampaignDetails = async (campaignId) => {
    try {
      setLoading(true);
      
      // Fetch campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
        
      if (campaignError) throw campaignError;
      
      // Fetch campaign nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('campaign_nodes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sequence_order', { ascending: true });
        
      if (nodesError) throw nodesError;
      
      // Call the onEdit function with the campaign data
      if (onCreateNew && typeof onCreateNew === 'function') {
        // Pass the campaign and nodes to the parent component
        onCreateNew(campaignData, nodesData);
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: 'Error editing campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (campaignId) => {
    try {
      setLoading(true);
      
      // Find the campaign to duplicate
      const campaignToDuplicate = campaigns.find(c => c.id === campaignId);
      
      if (!campaignToDuplicate) return;
      
      // Create a new campaign with the same data
      const { data: newCampaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: `${campaignToDuplicate.name} (Copy)`,
          workspace_id: workspaceId,
          board_id: boardId,
          status: 'draft', // Always set as draft for safety
          segment_id: campaignToDuplicate.segment_id
        })
        .select()
        .single();
      
      if (campaignError) throw campaignError;
      
      // Fetch the original campaign's nodes
      const { data: originalNodes, error: nodesError } = await supabase
        .from('campaign_nodes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sequence_order', { ascending: true });
        
      if (nodesError) throw nodesError;
      
      if (originalNodes && originalNodes.length > 0) {
        // Create new nodes for the duplicated campaign
        const newNodes = originalNodes.map(node => ({
          campaign_id: newCampaign.id,
          workspace_id: workspaceId,
          type: node.type,
          message: node.message,
          send_time: node.send_time,
          sequence_order: node.sequence_order,
          day: node.day,
          subject: node.subject || ''
        }));
        
        // Insert the new nodes
        const { error: insertNodesError } = await supabase
          .from('campaign_nodes')
          .insert(newNodes);
          
        if (insertNodesError) throw insertNodesError;
      }
      
      toast({
        title: 'Campaign duplicated',
        description: 'The campaign has been duplicated successfully. Contacts will need to be added separately.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh campaigns
      fetchCampaigns();
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast({
        title: 'Error duplicating campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (campaignId) => {
    try {
      // Delete campaign from Supabase
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('workspace_id', workspaceId); // Security check
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Campaign deleted',
        description: 'The campaign has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Update local state
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error deleting campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRefresh = async () => {
    await fetchCampaigns();
    toast({
      title: 'Campaigns refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render card view
  const renderCardView = () => (
    <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
      {filteredCampaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          name={campaign.name}
          status={campaign.status}
          metrics={campaignMetrics[campaign.id] || {
            enrolled: 0,
            inProgress: 0,
            completed: 0,
            steps: campaign.steps
          }}
          onEdit={() => handleEdit(campaign.id)}
          onDuplicate={() => handleDuplicate(campaign.id)}
          onDelete={() => handleDelete(campaign.id)}
          campaignId={campaign.id}
          workspaceId={workspaceId}
        />
      ))}
    </Grid>
  );

  // Render list view
  const renderListView = () => (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th borderBottomWidth="1px" borderBottomColor="gray.200" py={3}>Campaign Name</Th>
            <Th isNumeric borderBottomWidth="1px" borderBottomColor="gray.200" py={3} 
              borderRightWidth="0px">Enrolled</Th>
            <Th isNumeric borderBottomWidth="1px" borderBottomColor="gray.200" py={3}
              borderRightWidth="0px">In Progress</Th>
            <Th isNumeric borderBottomWidth="1px" borderBottomColor="gray.200" py={3}
              borderRightWidth="2px" borderRightColor="purple.100">Completed</Th>
            <Th isNumeric borderBottomWidth="1px" borderBottomColor="gray.200" py={3}
              borderLeftWidth="0px">Scheduled</Th>
            <Th isNumeric borderBottomWidth="1px" borderBottomColor="gray.200" py={3}>Sent</Th>
            <Th isNumeric borderBottomWidth="1px" borderBottomColor="gray.200" py={3}
              borderRightWidth="2px" borderRightColor="purple.100">Opted Out</Th>
            <Th isNumeric borderBottomWidth="1px" borderBottomColor="gray.200" py={3}>Steps</Th>
            <Th isNumeric borderBottomWidth="1px" borderBottomColor="gray.200" py={3}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredCampaigns.map((campaign) => (
            <CampaignListItem
              key={campaign.id}
              name={campaign.name}
              status={campaign.status}
              metrics={campaignMetrics[campaign.id] || {
                enrolled: 0,
                inProgress: 0,
                completed: 0,
                optedOut: 0,
                scheduled: 0,
                sent: 0,
                steps: campaign.steps
              }}
              onEdit={() => handleEdit(campaign.id)}
              onDuplicate={() => handleDuplicate(campaign.id)}
              onDelete={() => handleDelete(campaign.id)}
              campaignId={campaign.id}
              workspaceId={workspaceId}
            />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );

  return (
    <Box p={4}>
      <Flex 
        justify="space-between" 
        align="center" 
        mb={6}
        gap={4}
      >
        <Flex flex={1} gap={4} align="center">
          <ButtonGroup 
            size="sm" 
            isAttached 
            variant="outline" 
            borderRadius="lg" 
            borderColor={inputBorder}
            bg={buttonBg}
            overflow="hidden"
            h="32px"
            spacing={0}
          >
            <IconButton
              icon={<ViewIcon boxSize="3.5" />}
              aria-label="Table view"
              isActive={!isCardView}
              onClick={() => setIsCardView(false)}
              _hover={{ bg: buttonHoverBg }}
              _active={{ 
                bg: buttonHoverBg,
                transform: 'scale(0.98)'
              }}
              borderRight="1px"
              borderColor={inputBorder}
              h="32px"
              transition="all 0.2s"
            />
            <IconButton
              icon={<HamburgerIcon boxSize="3.5" />}
              aria-label="Card view"
              isActive={isCardView}
              onClick={() => setIsCardView(true)}
              _hover={{ bg: buttonHoverBg }}
              _active={{ 
                bg: buttonHoverBg,
                transform: 'scale(0.98)'
              }}
              h="32px"
              transition="all 0.2s"
            />
          </ButtonGroup>

          <InputGroup size="sm" maxW="320px">
            <InputLeftElement 
              pointerEvents="none" 
              h="32px"
              pl={3}
              children={<SearchIcon boxSize="3.5" color={searchIconColor} />}
            />
            <Input
              placeholder="Search Campaigns"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg={inputBg}
              borderColor={inputBorder}
              borderRadius="lg"
              _placeholder={{ color: 'gray.400' }}
              _hover={{ borderColor: 'gray.300' }}
              _focus={{ 
                borderColor: 'purple.500',
                boxShadow: 'none',
                bg: buttonBg,
                _hover: { borderColor: 'purple.500' }
              }}
              h="32px"
              fontSize="sm"
              pl="36px"
            />
          </InputGroup>

          <IconButton
            icon={<RepeatIcon boxSize="3.5" />}
            aria-label="Refresh campaigns"
            size="sm"
            variant="ghost"
            color={refreshIconColor}
            onClick={handleRefresh}
            _hover={{ bg: buttonHoverBg }}
            _active={{ 
              bg: buttonHoverBg,
              transform: 'scale(0.98)'
            }}
            borderRadius="lg"
            h="32px"
            transition="all 0.2s"
          />
        </Flex>

        <Button
          leftIcon={<AddIcon boxSize="3.5" />}
          bg={createBtnBg}
          color={createBtnColor}
          size="sm"
          onClick={onCreateNew}
          borderRadius="lg"
          fontWeight="medium"
          px={4}
          h="32px"
          _hover={{
            transform: 'translateY(-1px)',
            shadow: 'sm',
            opacity: 0.9
          }}
          _active={{
            transform: 'translateY(0)',
            shadow: 'none',
            opacity: 0.8
          }}
          transition="all 0.2s"
        >
          Create Campaign
        </Button>
      </Flex>

      {phoneNumber && (
        <Text color="gray.600" mb={4}>
          Phone Number: {phoneNumber}
        </Text>
      )}

      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" color="purple.500" />
        </Flex>
      ) : filteredCampaigns.length > 0 ? (
        isCardView ? renderCardView() : renderListView()
      ) : (
        <Box textAlign="center" py={10} bg={emptyStateBgColor} borderRadius="md">
          <Text color="gray.500" fontSize="lg">No campaigns found. Create your first campaign!</Text>
        </Box>
      )}
    </Box>
  );
};

export default ActiveCampaigns;
