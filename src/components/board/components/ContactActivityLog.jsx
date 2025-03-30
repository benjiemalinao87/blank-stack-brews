import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Stack,
  Tag,
  Button,
  Select,
  Badge,
  Icon,
  Divider,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import contactActivityService from '../../../services/contactActivityService';
import { ChevronLeft, ChevronRight, RefreshCw, MessageCircle, Mail, PhoneCall, Edit, Clock, FileText, AlertCircle } from 'lucide-react';

// Map activity types to icons and colors
const activityConfig = {
  call: { icon: PhoneCall, color: 'green', label: 'Call' },
  email: { icon: Mail, color: 'blue', label: 'Email' },
  sms: { icon: MessageCircle, color: 'purple', label: 'SMS' },
  note: { icon: FileText, color: 'orange', label: 'Note' },
  status_change: { icon: Clock, color: 'yellow', label: 'Status Change' },
  contact_updated: { icon: Edit, color: 'teal', label: 'Contact Updated' },
  system: { icon: AlertCircle, color: 'gray', label: 'System' }
};

// Format activity type for display
const formatActivityType = (type) => {
  const config = activityConfig[type];
  return config?.label || type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const ContactActivityLog = ({ contactId, workspaceId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const codeBgColor = useColorModeValue('gray.50', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  
  const fetchActivities = useCallback(async () => {
    if (!contactId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const options = {
        limit: 10,
        page,
        activityType: activityTypeFilter || undefined
      };
      
      const result = await contactActivityService.getActivities(contactId, options);
      
      setActivities(result.activities);
      setHasMore(result.pagination.hasMore);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [contactId, page, activityTypeFilter]);
  
  // Fetch activities when component mounts or when filters/page changes
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities, refreshTrigger]);
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleNextPage = () => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1);
    }
  };
  
  const getActivityIcon = (type) => {
    const config = activityConfig[type] || { icon: AlertCircle, color: 'gray' };
    return config.icon;
  };
  
  const getActivityColor = (type) => {
    const config = activityConfig[type] || { icon: AlertCircle, color: 'gray' };
    return config.color;
  };
  
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }
  
  // Render activities
  const renderActivities = () => {
    if (activities.length === 0) {
      return (
        <Box textAlign="center" py={6}>
          <Text color={textColor}>No activities found</Text>
        </Box>
      );
    }
    
    return (
      <VStack spacing={0} align="stretch" divider={<Divider />}>
        {activities.map((activity) => {
          const ActivityIcon = getActivityIcon(activity.activity_type);
          const activityColor = getActivityColor(activity.activity_type);
          
          return (
            <Box key={activity.id} p={4} _hover={{ bg: hoverBgColor }}>
              <Flex>
                <Box mr={4}>
                  <Icon as={ActivityIcon} boxSize={5} color={`${activityColor}.500`} />
                </Box>
                <Box flex="1">
                  <Flex justify="space-between" align="flex-start" mb={1}>
                    <Text fontWeight="medium">{activity.description}</Text>
                    <Text fontSize="sm" color={textColor} ml={2}>
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </Text>
                  </Flex>
                  
                  {activity.metadata && (
                    <Box mt={2} p={2} bg={codeBgColor} borderRadius="md" fontSize="sm">
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    </Box>
                  )}
                </Box>
              </Flex>
            </Box>
          );
        })}
      </VStack>
    );
  };
  
  return (
    <Box bg={bgColor} borderRadius="md" borderWidth="1px" borderColor={borderColor} overflow="hidden">
      <Flex justifyContent="space-between" alignItems="center" p={4} borderBottomWidth="1px" borderColor={borderColor}>
        <Heading size="md">Activity Log</Heading>
        <HStack>
          <Select 
            size="sm" 
            value={activityTypeFilter} 
            onChange={(e) => setActivityTypeFilter(e.target.value)}
            placeholder="All Activities"
            maxW="200px"
          >
            {Object.entries(activityConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </Select>
          <IconButton
            icon={<RefreshCw size={18} />}
            size="sm"
            aria-label="Refresh"
            onClick={handleRefresh}
            isLoading={loading}
          />
        </HStack>
      </Flex>
      
      {loading && activities.length === 0 ? (
        <Flex justify="center" align="center" p={8}>
          <Spinner size="lg" />
        </Flex>
      ) : (
        renderActivities()
      )}
      
      {/* Pagination */}
      {activities.length > 0 && (
        <Flex justify="space-between" align="center" p={4} borderTopWidth="1px" borderColor={borderColor}>
          <Button 
            leftIcon={<ChevronLeft size={16} />} 
            size="sm" 
            onClick={handlePrevPage} 
            isDisabled={page === 0}
          >
            Previous
          </Button>
          <Button 
            rightIcon={<ChevronRight size={16} />} 
            size="sm" 
            onClick={handleNextPage} 
            isDisabled={!hasMore}
          >
            Next
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default ContactActivityLog;
