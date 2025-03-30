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
import boardActivityService from '../../services/boardActivityService';
import { ChevronLeft, ChevronRight, RefreshCw, ClockIcon, Users, Edit, Trash, PhoneOutgoing, PhoneIncoming, MoveHorizontal } from 'lucide-react';

// Map activity types to icons and colors
const activityConfig = {
  board_created: { icon: ClockIcon, color: 'green' },
  board_renamed: { icon: Edit, color: 'blue' },
  board_deleted: { icon: Trash, color: 'red' },
  phone_assigned: { icon: PhoneOutgoing, color: 'purple' },
  phone_unassigned: { icon: PhoneIncoming, color: 'orange' },
  contact_added: { icon: Users, color: 'teal' },
  contact_moved: { icon: MoveHorizontal, color: 'yellow' },
  contact_removed: { icon: Trash, color: 'red' },
  column_added: { icon: ClockIcon, color: 'green' },
  column_renamed: { icon: Edit, color: 'blue' },
  column_deleted: { icon: Trash, color: 'red' }
};

// Format activity type for display
const formatActivityType = (type) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const ActivityLog = ({ boardId, workspaceId, viewMode = 'board' }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const codeBgColor = useColorModeValue('gray.50', 'gray.700');
  
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const options = {
        limit: 10,
        page,
        activityType: activityTypeFilter || undefined
      };
      
      let result;
      if (viewMode === 'board' && boardId) {
        result = await boardActivityService.getActivities(boardId, options);
      } else if (viewMode === 'workspace' && workspaceId) {
        result = await boardActivityService.getWorkspaceActivities(workspaceId, options);
      } else {
        throw new Error('Either boardId or workspaceId must be provided');
      }
      
      setActivities(result.activities);
      setHasMore(result.pagination.hasMore);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [boardId, workspaceId, page, activityTypeFilter, viewMode]);
  
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

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      bg={bgColor}
      borderColor={borderColor}
      width="100%"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Activity Log</Heading>
        <HStack>
          <Select 
            size="sm" 
            value={activityTypeFilter} 
            onChange={(e) => setActivityTypeFilter(e.target.value)}
            placeholder="All activity types"
            maxW="200px"
          >
            <option value="board_created">Board Created</option>
            <option value="board_renamed">Board Renamed</option>
            <option value="board_deleted">Board Deleted</option>
            <option value="phone_assigned">Phone Assigned</option>
            <option value="phone_unassigned">Phone Unassigned</option>
            <option value="contact_added">Contact Added</option>
            <option value="contact_moved">Contact Moved</option>
            <option value="contact_removed">Contact Removed</option>
            <option value="column_added">Column Added</option>
            <option value="column_renamed">Column Renamed</option>
            <option value="column_deleted">Column Deleted</option>
          </Select>
          <IconButton
            icon={<RefreshCw size={16} />}
            size="sm"
            aria-label="Refresh"
            onClick={handleRefresh}
          />
        </HStack>
      </Flex>
      
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Flex justify="center" align="center" py={8}>
          <Spinner />
        </Flex>
      ) : activities.length === 0 ? (
        <Box textAlign="center" py={8} color={textColor}>
          <Text>No activities found.</Text>
          <Text fontSize="sm" mt={2}>
            Activities will appear here when changes are made to the board.
          </Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {activities.map(activity => {
            const config = activityConfig[activity.activity_type] || { icon: ClockIcon, color: 'gray' };
            const formattedDate = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
            
            return (
              <Box
                key={activity.id}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                borderColor={borderColor}
              >
                <Flex align="flex-start" gap={3}>
                  <Box
                    p={2}
                    borderRadius="full"
                    bg={`${config.color}.100`}
                    color={`${config.color}.500`}
                  >
                    <Icon as={config.icon} boxSize={5} />
                  </Box>
                  
                  <Box flex="1">
                    <Flex justify="space-between" align="flex-start" mb={1}>
                      <HStack>
                        <Text fontWeight="bold">{formatActivityType(activity.activity_type)}</Text>
                        <Tag size="sm" colorScheme={config.color}>
                          {activity.board_id === boardId ? 'This Board' : activity.boards?.name || 'Unknown Board'}
                        </Tag>
                      </HStack>
                      <Text fontSize="sm" color={textColor}>
                        {formattedDate}
                      </Text>
                    </Flex>
                    
                    <Text fontSize="sm" mb={2}>{activity.description}</Text>
                    
                    {(activity.before_state || activity.after_state) && (
                      <Box fontSize="xs" p={2} bg={codeBgColor} borderRadius="md">
                        {activity.before_state && activity.after_state && (
                          <Flex>
                            <Box flex="1">
                              <Text fontWeight="bold" mb={1}>Before</Text>
                              <pre style={{ fontSize: '10px', overflowX: 'auto' }}>
                                {JSON.stringify(activity.before_state, null, 2)}
                              </pre>
                            </Box>
                            <Divider orientation="vertical" mx={2} />
                            <Box flex="1">
                              <Text fontWeight="bold" mb={1}>After</Text>
                              <pre style={{ fontSize: '10px', overflowX: 'auto' }}>
                                {JSON.stringify(activity.after_state, null, 2)}
                              </pre>
                            </Box>
                          </Flex>
                        )}
                      </Box>
                    )}
                  </Box>
                </Flex>
              </Box>
            );
          })}
        </VStack>
      )}
      
      <Flex justify="space-between" align="center" mt={4}>
        <Button
          leftIcon={<ChevronLeft size={16} />}
          size="sm"
          onClick={handlePrevPage}
          isDisabled={page === 0}
        >
          Previous
        </Button>
        <Text fontSize="sm" color={textColor}>
          Page {page + 1}
        </Text>
        <Button
          rightIcon={<ChevronRight size={16} />}
          size="sm"
          onClick={handleNextPage}
          isDisabled={!hasMore}
        >
          Next
        </Button>
      </Flex>
    </Box>
  );
};

export default ActivityLog;
