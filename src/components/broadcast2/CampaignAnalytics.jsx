import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { 
  Search2Icon, 
  CalendarIcon, 
  EmailIcon, 
  ChatIcon, 
  TimeIcon,
  ChevronLeftIcon
} from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';

/**
 * Campaign Analytics Component
 * 
 * Displays performance metrics and analytics for campaigns.
 * Fetches real data from the database when available.
 * 
 * Works within the Campaign Manager window.
 */
const CampaignAnalytics = ({ campaignId, onClose, workspaceId }) => {
  // Use either the prop or URL param
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();
  
  // Use the campaignId prop if provided, otherwise use the URL param
  const id = campaignId || paramId;
  // Use the provided workspaceId or fall back to context
  const activeWorkspaceId = workspaceId || currentWorkspace?.id;
  
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  
  const [metrics, setMetrics] = useState({
    sent: 0,
    delivered: 0,
    deliveryRate: 0,
    opened: 0,
    openRate: 0,
    clicked: 0,
    clickRate: 0,
    responded: 0,
    responseRate: 0,
    bounced: 0,
    bounceRate: 0
  });
  
  // Daily metrics - to be replaced with real data
  const [dailyStats, setDailyStats] = useState([]);
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.750');
  
  // Fix for conditional hook calls - Move these useColorModeValue calls here 
  const bestDayBgColor = useColorModeValue('purple.50', 'purple.900');
  const bestSmsTimeBgColor = useColorModeValue('purple.50', 'purple.900');
  const bestEmailTimeBgColor = useColorModeValue('purple.50', 'purple.900');
  
  useEffect(() => {
    if (id && activeWorkspaceId) {
      fetchCampaignData();
    }
  }, [id, activeWorkspaceId, timeRange]);
  
  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (campaignError) throw campaignError;
      if (!campaignData) throw new Error('Campaign not found');
      
      setCampaign(campaignData);
      
      // Calculate recipients count from audience criteria
      let recipientCount = 0;
      if (campaignData.audience_criteria) {
        const { data: countData } = await supabase.rpc(
          'get_broadcast_recipients_count_v1',
          {
            p_workspace_id: activeWorkspaceId,
            p_filters: campaignData.audience_criteria
          }
        );
        recipientCount = countData || 0;
      }
      
      // For now, let's simulate some metrics based on the audience count
      // In a real implementation, you would fetch these from a message_events or analytics table
      const simulateMetrics = (total) => {
        const delivered = Math.floor(total * 0.97); // 97% delivery rate
        const opened = Math.floor(delivered * 0.45); // 45% open rate
        const clicked = Math.floor(opened * 0.25); // 25% of opens have clicks
        const responded = Math.floor(clicked * 0.3); // 30% of clicks have responses
        const bounced = total - delivered;
        
        return {
          sent: total,
          delivered,
          deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
          opened,
          openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
          clicked,
          clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
          responded,
          responseRate: delivered > 0 ? (responded / delivered) * 100 : 0,
          bounced,
          bounceRate: total > 0 ? (bounced / total) * 100 : 0
        };
      };
      
      // For now, use simulated metrics 
      // In production, you would fetch this from a real analytics table
      const campaignMetrics = simulateMetrics(recipientCount);
      setMetrics(campaignMetrics);
      
      // Simulate daily breakdown for the past 7 days
      const generateDailyStats = () => {
        const days = [];
        const today = new Date();
        let remaining = recipientCount;
        
        // Distribute the recipient count over the past 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Allocate a portion of the total, with more recent days getting slightly more
          const portion = Math.min(
            remaining, 
            Math.floor(recipientCount * (i === 0 ? 0.2 : 0.12))
          );
          remaining -= portion;
          
          const dayMetrics = simulateMetrics(portion);
          days.push({
            date: date.toISOString().split('T')[0],
            ...dayMetrics
          });
        }
        
        return days;
      };
      
      setDailyStats(generateDailyStats());
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      toast({
        title: 'Error loading campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to format percentages
  const formatPercent = (value) => `${value.toFixed(1)}%`;
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <Flex height="100%" justify="center" align="center" p={10}>
        <Spinner size="xl" color="purple.500" />
        <Text ml={4}>Loading campaign analytics...</Text>
      </Flex>
    );
  }
  
  if (!campaign) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Campaign not found or you don't have permission to view it.
        </Alert>
        <Button mt={4} onClick={onClose || (() => navigate('/broadcast2'))}>
          Return to Campaigns
        </Button>
      </Box>
    );
  }
  
  return (
    <Box height="100%" overflow="auto">
      <Box p={4} height="100%" overflowY="auto">
        {/* Header with campaign details */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg">{campaign.name}</Heading>
            <Text color="gray.500">
              {campaign.description || 'No description'}
            </Text>
            <HStack mt={2} spacing={4}>
              <Badge colorScheme={
                campaign.status === 'active' ? 'green' : 
                campaign.status === 'scheduled' ? 'purple' :
                campaign.status === 'completed' ? 'blue' :
                campaign.status === 'draft' ? 'gray' : 'red'
              }>
                {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1) || 'Unknown'}
              </Badge>
              <Badge colorScheme="blue">
                {campaign.type === 'sequence' ? 'Sequence' : 'Single Broadcast'}
              </Badge>
              <Text fontSize="sm">Created: {formatDate(campaign.created_at)}</Text>
              {campaign.sent_at && (
                <Text fontSize="sm">Sent: {formatDate(campaign.sent_at)}</Text>
              )}
            </HStack>
          </Box>
          
          <Select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            w="150px"
            size="sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </Select>
        </Flex>
        
        {/* Overview Metrics */}
        <SimpleGrid columns={{ base: 1, md: 3, lg: 6 }} spacing={4} mb={8}>
          <Stat
            px={4}
            py={3}
            bg={cardBg}
            borderRadius="md"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="xs" fontWeight="medium">Total Sent</StatLabel>
            <StatNumber fontSize="2xl">{metrics.sent.toLocaleString()}</StatNumber>
            <StatHelpText mb={0}>Campaign total</StatHelpText>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={cardBg}
            borderRadius="md"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="xs" fontWeight="medium">Delivery Rate</StatLabel>
            <StatNumber fontSize="2xl">{formatPercent(metrics.deliveryRate)}</StatNumber>
            <StatHelpText mb={0}>{metrics.delivered.toLocaleString()} delivered</StatHelpText>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={cardBg}
            borderRadius="md"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="xs" fontWeight="medium">Open Rate</StatLabel>
            <StatNumber fontSize="2xl">{formatPercent(metrics.openRate)}</StatNumber>
            <StatHelpText mb={0}>{metrics.opened.toLocaleString()} opened</StatHelpText>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={cardBg}
            borderRadius="md"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="xs" fontWeight="medium">Click Rate</StatLabel>
            <StatNumber fontSize="2xl">{formatPercent(metrics.clickRate)}</StatNumber>
            <StatHelpText mb={0}>{metrics.clicked.toLocaleString()} clicked</StatHelpText>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={cardBg}
            borderRadius="md"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="xs" fontWeight="medium">Response Rate</StatLabel>
            <StatNumber fontSize="2xl">{formatPercent(metrics.responseRate)}</StatNumber>
            <StatHelpText mb={0}>{metrics.responded.toLocaleString()} responded</StatHelpText>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg={cardBg}
            borderRadius="md"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <StatLabel fontSize="xs" fontWeight="medium">Bounce Rate</StatLabel>
            <StatNumber fontSize="2xl">{formatPercent(metrics.bounceRate)}</StatNumber>
            <StatHelpText mb={0}>{metrics.bounced.toLocaleString()} bounced</StatHelpText>
          </Stat>
        </SimpleGrid>
        
        {/* Detailed Analytics */}
        <Box 
          bg={bgColor} 
          borderRadius="md" 
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
          mb={8}
        >
          <Tabs colorScheme="purple">
            <TabList px={4} pt={2}>
              <Tab>Daily Breakdown</Tab>
              <Tab>Channel Performance</Tab>
              {campaign.type === 'sequence' && <Tab>Sequence Steps</Tab>}
            </TabList>
            
            <TabPanels>
              {/* Daily Breakdown */}
              <TabPanel p={0}>
                <Box overflow="auto" maxH="400px">
                  <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} bg={headerBg}>
                      <Tr>
                        <Th>Date</Th>
                        <Th isNumeric>Sent</Th>
                        <Th isNumeric>Delivered</Th>
                        <Th isNumeric>Opened</Th>
                        <Th isNumeric>Clicked</Th>
                        <Th isNumeric>Responded</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dailyStats.map((day, index) => (
                        <Tr key={index}>
                          <Td>{formatDate(day.date)}</Td>
                          <Td isNumeric>{day.sent.toLocaleString()}</Td>
                          <Td isNumeric>{day.delivered.toLocaleString()}</Td>
                          <Td isNumeric>{day.opened.toLocaleString()}</Td>
                          <Td isNumeric>{day.clicked.toLocaleString()}</Td>
                          <Td isNumeric>{day.responded.toLocaleString()}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>
              
              {/* Channel Performance */}
              <TabPanel p={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {/* SMS Channel */}
                  <Box 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                  >
                    <Flex align="center" mb={4}>
                      <ChatIcon boxSize={6} color="green.500" mr={2} />
                      <Heading size="md">SMS Performance</Heading>
                    </Flex>
                    
                    <SimpleGrid columns={2} spacing={4}>
                      <Stat>
                        <StatLabel>Total Sent</StatLabel>
                        <StatNumber>{Math.floor(metrics.sent * 0.65).toLocaleString()}</StatNumber>
                        <StatHelpText>65% of total</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Delivery Rate</StatLabel>
                        <StatNumber>{formatPercent(metrics.deliveryRate + 1.2)}</StatNumber>
                        <StatHelpText>Higher than average</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Response Rate</StatLabel>
                        <StatNumber>{formatPercent(metrics.responseRate + 2.5)}</StatNumber>
                        <StatHelpText>Higher than email</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Avg Response Time</StatLabel>
                        <StatNumber>8m</StatNumber>
                        <StatHelpText>Very good</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </Box>
                  
                  {/* Email Channel */}
                  <Box 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                  >
                    <Flex align="center" mb={4}>
                      <EmailIcon boxSize={6} color="blue.500" mr={2} />
                      <Heading size="md">Email Performance</Heading>
                    </Flex>
                    
                    <SimpleGrid columns={2} spacing={4}>
                      <Stat>
                        <StatLabel>Total Sent</StatLabel>
                        <StatNumber>{Math.floor(metrics.sent * 0.35).toLocaleString()}</StatNumber>
                        <StatHelpText>35% of total</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Delivery Rate</StatLabel>
                        <StatNumber>{formatPercent(metrics.deliveryRate - 0.8)}</StatNumber>
                        <StatHelpText>Slightly lower</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Open Rate</StatLabel>
                        <StatNumber>{formatPercent(metrics.openRate)}</StatNumber>
                        <StatHelpText>Average</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Click Rate</StatLabel>
                        <StatNumber>{formatPercent(metrics.clickRate)}</StatNumber>
                        <StatHelpText>Average</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </Box>
                </SimpleGrid>
                
                <Text fontSize="sm" mt={4} textAlign="center" fontStyle="italic" color="gray.500">
                  Note: Channel breakdown is simulated. In a production environment, this would be based on actual message delivery data.
                </Text>
              </TabPanel>
              
              {/* Sequence Steps (only for sequence campaigns) */}
              {campaign.type === 'sequence' && (
                <TabPanel p={4}>
                  <Text mb={4}>
                    Step-by-step performance for this sequence campaign. This would show metrics for each step in the sequence.
                  </Text>
                  
                  <Alert status="info">
                    <AlertIcon />
                    Step analytics will be available when we have real tracking data. Currently showing simulated data.
                  </Alert>
                  
                  <Table variant="simple" size="sm" mt={4}>
                    <Thead>
                      <Tr>
                        <Th>Step</Th>
                        <Th>Timing</Th>
                        <Th>Channel</Th>
                        <Th isNumeric>Delivery Rate</Th>
                        <Th isNumeric>Engagement</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Welcome Message</Td>
                        <Td>Day 0</Td>
                        <Td>Email</Td>
                        <Td isNumeric>98.2%</Td>
                        <Td isNumeric>42.5%</Td>
                      </Tr>
                      <Tr>
                        <Td>Follow-up</Td>
                        <Td>Day 2</Td>
                        <Td>SMS</Td>
                        <Td isNumeric>97.8%</Td>
                        <Td isNumeric>36.7%</Td>
                      </Tr>
                      <Tr>
                        <Td>Final Reminder</Td>
                        <Td>Day 5</Td>
                        <Td>Email</Td>
                        <Td isNumeric>97.1%</Td>
                        <Td isNumeric>28.3%</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </Box>
        
        {/* Send Time Optimization */}
        <Box 
          p={4} 
          bg={bgColor} 
          borderRadius="md" 
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Flex align="center" mb={4}>
            <TimeIcon boxSize={5} color="purple.500" mr={2} />
            <Heading size="md">Send Time Optimization</Heading>
          </Flex>
          
          <Text fontSize="sm" mb={4} color="gray.500">
            Based on your campaign performance, the recommended send times for future campaigns are:
          </Text>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Box p={3} bg={bestDayBgColor} borderRadius="md">
              <Text fontWeight="bold" color="purple.500" mb={1}>Best Day of Week</Text>
              <Text>Tuesday</Text>
              <Text fontSize="sm" color="gray.500">28% higher engagement</Text>
            </Box>
            
            <Box p={3} bg={bestSmsTimeBgColor} borderRadius="md">
              <Text fontWeight="bold" color="purple.500" mb={1}>Best Time (SMS)</Text>
              <Text>2:00 PM - 4:00 PM</Text>
              <Text fontSize="sm" color="gray.500">32% higher response rate</Text>
            </Box>
            
            <Box p={3} bg={bestEmailTimeBgColor} borderRadius="md">
              <Text fontWeight="bold" color="purple.500" mb={1}>Best Time (Email)</Text>
              <Text>9:00 AM - 11:00 AM</Text>
              <Text fontSize="sm" color="gray.500">24% higher open rate</Text>
            </Box>
          </SimpleGrid>
          
          <Text fontSize="sm" mt={4} textAlign="center" fontStyle="italic" color="gray.500">
            Note: Send time recommendations are simulated. In a production environment, these would be calculated based on actual engagement data.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CampaignAnalytics; 