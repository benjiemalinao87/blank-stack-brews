import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Input,
  Textarea,
  Button,
  VStack,
  HStack,
  Select,
  FormControl,
  FormLabel,
  useColorModeValue,
  useToast,
  Collapse,
  Flex,
  Icon,
  Badge,
  Spacer,
  Divider,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Tag,
  TagLabel,
  TagLeftIcon,
  Avatar,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronDown, ChevronUp, Rocket, Send, X, Clock, CheckCircle, AlertCircle, ThumbsUp, Users, History } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '../../lib/supabaseUnified';
import { getFeatureRequests, submitFeatureRequest, voteForFeatureRequest, getAllFeatureRequestsWithVotes } from '../../services/featureRequestService';

const FeatureRequestSidebar = ({ onClose, onRequestSubmitted }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [changelog, setChangelog] = useState([]);
  const [isLoadingChangelog, setIsLoadingChangelog] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const toast = useToast();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        // Get workspace ID from user metadata or session
        const { data: { session } } = await supabase.auth.getSession();
        const userWorkspaceId = session?.user?.app_metadata?.workspace_id || 'default';
        setWorkspaceId(userWorkspaceId);
      }
    };
    
    fetchUserData();
  }, []);

  // Fetch user's feature requests when tab changes to "My Requests"
  useEffect(() => {
    if (activeTab === 1 && userEmail) {
      fetchMyRequests();
    } else if (activeTab === 2 && workspaceId) {
      fetchAllRequests();
    } else if (activeTab === 3) {
      fetchChangelog();
    }
  }, [activeTab, userEmail, workspaceId]);

  const fetchMyRequests = async () => {
    if (!userEmail || !workspaceId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .eq('requested_by', userEmail)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error('Error fetching user feature requests:', error);
      toast({
        title: 'Error fetching requests',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    if (!workspaceId || !userEmail) return;
    
    setIsLoadingAll(true);
    try {
      const { data, error } = await getAllFeatureRequestsWithVotes(workspaceId, userEmail);
      
      if (error) throw error;
      setAllRequests(data || []);
    } catch (error) {
      console.error('Error fetching all feature requests:', error);
      toast({
        title: 'Error fetching requests',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingAll(false);
    }
  };

  const fetchChangelog = async (pageNumber = 0) => {
    if (!workspaceId) return;
    
    setIsLoadingChangelog(true);
    try {
      const from = pageNumber * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('changelog')
        .select('id, title, content, category, release_date, released_by, dev, lessons_learned', { count: 'exact' })
        .order('release_date', { ascending: false })
        .range(from, to);
      
      if (error) throw error;

      if (pageNumber === 0) {
        setChangelog(data || []);
      } else {
        setChangelog(prev => [...prev, ...(data || [])]);
      }
      
      // Check if there are more items to load
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      
    } catch (error) {
      console.error('Error fetching changelog:', error);
      toast({
        title: 'Error fetching changelog',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingChangelog(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchChangelog(nextPage);
  };

  useEffect(() => {
    if (activeTab === 3) {
      setPage(0);
      setHasMore(true);
      fetchChangelog(0);
    }
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Title is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Insert the feature request into the database
      const { data, error } = await submitFeatureRequest({
        title,
        description,
        category,
        requested_by: userEmail,
        workspace_id: workspaceId,
      });
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: 'Feature request submitted!',
        description: 'Thank you for your feedback.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      
      // Switch to "My Requests" tab to show the newly added request
      setActiveTab(1);
      
      // Notify parent component about the new request
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
      
    } catch (error) {
      console.error('Error submitting feature request:', error);
      toast({
        title: 'Error submitting request',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} />;
      case 'in_progress':
        return <AlertCircle size={14} />;
      case 'completed':
        return <CheckCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  const handleVote = async (featureRequestId) => {
    try {
      const { data, error, alreadyVoted } = await voteForFeatureRequest(
        featureRequestId,
        userEmail,
        workspaceId
      );
      
      if (error) throw error;
      
      if (alreadyVoted) {
        toast({
          title: 'Already voted',
          description: 'You have already voted for this feature request.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      toast({
        title: 'Vote recorded',
        description: 'Thank you for your vote!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh the lists
      if (activeTab === 1) {
        fetchMyRequests();
      } else if (activeTab === 2) {
        fetchAllRequests();
      }
      
      // Notify parent component about the vote
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
      
    } catch (error) {
      console.error('Error voting for feature request:', error);
      toast({
        title: 'Error recording vote',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Render a single feature request item
  const renderFeatureRequestItem = (request, isUserRequest = false) => {
    return (
      <Box
        key={request.id}
        p={3}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        _hover={{ bg: hoverBg }}
      >
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="medium" fontSize="sm">{request.title}</Text>
          <Tag 
            size="sm" 
            colorScheme={getStatusColor(request.status || 'pending')}
            borderRadius="full"
          >
            <TagLeftIcon as={() => getStatusIcon(request.status || 'pending')} />
            <TagLabel>
              {request.status ? request.status.replace('_', ' ') : 'pending'}
            </TagLabel>
          </Tag>
        </Flex>
        
        {request.description && (
          <Text fontSize="xs" color="gray.500" noOfLines={2} mb={2}>
            {request.description}
          </Text>
        )}
        
        <Flex justify="space-between" align="center">
          <HStack spacing={2}>
            <Tag size="sm" colorScheme="gray" borderRadius="full">
              {request.category || 'other'}
            </Tag>
            
            {!isUserRequest && (
              <Tooltip label={request.requested_by} placement="top">
                <Avatar 
                  size="2xs" 
                  name={request.requested_by} 
                  bg="blue.500"
                  color="white"
                  fontSize="xs"
                />
              </Tooltip>
            )}
          </HStack>
          
          <HStack spacing={2}>
            <Text fontSize="xs" color="gray.500">
              {new Date(request.created_at).toLocaleDateString()}
            </Text>
            
            <Button
              size="xs"
              leftIcon={<ThumbsUp size={12} />}
              variant={request.userVoted ? "solid" : "ghost"}
              colorScheme={request.userVoted ? "blue" : "gray"}
              isDisabled={request.userVoted}
              onClick={() => handleVote(request.id)}
            >
              {request.votes || 0}
            </Button>
          </HStack>
        </Flex>
      </Box>
    );
  };

  const renderChangelogItem = (item) => {
    return (
      <Box
        key={item.id}
        p={4}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        _hover={{ bg: hoverBg }}
      >
        <VStack align="stretch" spacing={3}>
          {/* Header */}
          <Flex justify="space-between" align="center">
            <HStack spacing={2}>
              <Text fontWeight="semibold" fontSize="sm">{item.title}</Text>
              {item.category && (
                <Tag size="sm" colorScheme="purple" borderRadius="full">
                  {item.category}
                </Tag>
              )}
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {new Date(item.release_date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </Flex>

          {/* Content */}
          {item.content && (
            <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">
              {item.content}
            </Text>
          )}

          {/* Lessons Learned */}
          {item.lessons_learned && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                Lessons Learned:
              </Text>
              <Text fontSize="sm" color="gray.600">
                {item.lessons_learned}
              </Text>
            </Box>
          )}

          {/* Footer */}
          <Flex justify="space-between" align="center" mt={2}>
            <HStack spacing={2}>
              {item.released_by && (
                <HStack spacing={1}>
                  <Avatar 
                    size="2xs" 
                    name={item.released_by}
                    bg="purple.500"
                    color="white"
                  />
                  <Text fontSize="xs" color="gray.500">
                    {item.released_by}
                  </Text>
                </HStack>
              )}
              {item.dev && (
                <Tag size="sm" variant="subtle" colorScheme="blue">
                  {item.dev}
                </Tag>
              )}
            </HStack>
          </Flex>
        </VStack>
      </Box>
    );
  };

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      mb={4}
      boxShadow="md"
    >
      {/* Header - always visible */}
      <Flex
        p={3}
        bg={headerBg}
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex 
          alignItems="center" 
          cursor="pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          flex="1"
        >
          <Icon as={Rocket} mr={2} />
          <Text fontWeight="medium">24h Feature Delivery</Text>
          <Spacer />
          <Icon as={isExpanded ? ChevronUp : ChevronDown} />
        </Flex>
        <IconButton
          icon={<X size={16} />}
          size="sm"
          variant="ghost"
          aria-label="Close"
          onClick={onClose}
          ml={2}
        />
      </Flex>
      
      {/* Expandable content */}
      <Collapse in={isExpanded} animateOpacity>
        <Box p={4}>
          <Tabs 
            isFitted={false}
            variant="unstyled" 
            colorScheme="blue" 
            size="sm"
            index={activeTab}
            onChange={(index) => setActiveTab(index)}
            mb={2}
            display="flex"
            flexDirection="column"
            height="calc(100vh - 200px)"
          >
            <TabList 
              spacing={0.5} 
              bg={useColorModeValue('gray.50', 'gray.700')} 
              p="1px" 
              borderRadius="md"
              border="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
              display="inline-flex"
              width="auto"
              flexShrink={0}
            >
              <Tab 
                fontSize="xs" 
                px={2} 
                py={1}
                minW={0}
                borderRadius="sm"
                transition="all 0.2s"
                _selected={{
                  bg: useColorModeValue('white', 'gray.600'),
                  color: useColorModeValue('blue.500', 'blue.200'),
                  shadow: 'sm',
                  transform: 'scale(1.02)',
                  borderColor: useColorModeValue('gray.200', 'gray.500')
                }}
                _hover={{
                  color: useColorModeValue('blue.600', 'blue.200'),
                  bg: useColorModeValue('gray.100', 'gray.650')
                }}
              >
                New
              </Tab>
              <Tab 
                fontSize="xs" 
                px={2} 
                py={1}
                minW={0}
                borderRadius="sm"
                transition="all 0.2s"
                _selected={{
                  bg: useColorModeValue('white', 'gray.600'),
                  color: useColorModeValue('blue.500', 'blue.200'),
                  shadow: 'sm',
                  transform: 'scale(1.02)',
                  borderColor: useColorModeValue('gray.200', 'gray.500')
                }}
                _hover={{
                  color: useColorModeValue('blue.600', 'blue.200'),
                  bg: useColorModeValue('gray.100', 'gray.650')
                }}
              >
                My
              </Tab>
              <Tab 
                fontSize="xs" 
                px={2} 
                py={1}
                minW={0}
                borderRadius="sm"
                transition="all 0.2s"
                _selected={{
                  bg: useColorModeValue('white', 'gray.600'),
                  color: useColorModeValue('blue.500', 'blue.200'),
                  shadow: 'sm',
                  transform: 'scale(1.02)',
                  borderColor: useColorModeValue('gray.200', 'gray.500')
                }}
                _hover={{
                  color: useColorModeValue('blue.600', 'blue.200'),
                  bg: useColorModeValue('gray.100', 'gray.650')
                }}
              >
                <Icon as={Users} size={10} />
              </Tab>
              <Tab 
                fontSize="xs" 
                px={2} 
                py={1}
                minW={0}
                borderRadius="sm"
                transition="all 0.2s"
                _selected={{
                  bg: useColorModeValue('white', 'gray.600'),
                  color: useColorModeValue('blue.500', 'blue.200'),
                  shadow: 'sm',
                  transform: 'scale(1.02)',
                  borderColor: useColorModeValue('gray.200', 'gray.500')
                }}
                _hover={{
                  color: useColorModeValue('blue.600', 'blue.200'),
                  bg: useColorModeValue('gray.100', 'gray.650')
                }}
              >
                <Icon as={History} size={10} />
              </Tab>
            </TabList>
            
            <TabPanels mt={3} flex={1} overflow="hidden">
              {/* New Request Tab */}
              <TabPanel p={0} height="100%" overflow="auto">
                <form onSubmit={handleSubmit}>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Feature Title</FormLabel>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief description of the feature"
                        size="sm"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Category</FormLabel>
                      <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Select category"
                        size="sm"
                      >
                        <option value="ui_ux">UI/UX Improvement</option>
                        <option value="new_feature">New Feature</option>
                        <option value="performance">Performance</option>
                        <option value="bug_fix">Bug Fix</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="sm">Description</FormLabel>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your feature request in detail..."
                        size="sm"
                        rows={4}
                      />
                    </FormControl>
                    
                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="sm"
                      width="full"
                      isLoading={isSubmitting}
                      loadingText="Submitting"
                      leftIcon={<Send size={16} />}
                    >
                      Submit Request
                    </Button>
                  </VStack>
                </form>
              </TabPanel>
              
              {/* My Requests Tab */}
              <TabPanel p={0} height="100%" overflow="auto">
                {isLoading ? (
                  <Flex justify="center" align="center" py={4}>
                    <Spinner size="sm" mr={2} />
                    <Text fontSize="sm">Loading your requests...</Text>
                  </Flex>
                ) : myRequests.length === 0 ? (
                  <Box 
                    py={4} 
                    textAlign="center" 
                    color="gray.500"
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor={borderColor}
                    borderRadius="md"
                    p={4}
                  >
                    <Text fontSize="sm">You haven't submitted any feature requests yet.</Text>
                  </Box>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {myRequests.map((request) => renderFeatureRequestItem(request, true))}
                  </VStack>
                )}
              </TabPanel>
              
              {/* All Requests Tab */}
              <TabPanel p={0} height="100%" overflow="auto">
                {isLoadingAll ? (
                  <Flex justify="center" align="center" py={4}>
                    <Spinner size="sm" mr={2} />
                    <Text fontSize="sm">Loading all requests...</Text>
                  </Flex>
                ) : allRequests.length === 0 ? (
                  <Box 
                    py={4} 
                    textAlign="center" 
                    color="gray.500"
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor={borderColor}
                    borderRadius="md"
                    p={4}
                  >
                    <Text fontSize="sm">No feature requests have been submitted yet.</Text>
                  </Box>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {allRequests.map((request) => renderFeatureRequestItem(request))}
                  </VStack>
                )}
              </TabPanel>
              
              {/* Changelog Tab */}
              <TabPanel p={0} height="100%" overflow="auto">
                {isLoadingChangelog && page === 0 ? (
                  <Flex justify="center" align="center" py={4}>
                    <Spinner size="sm" mr={2} />
                    <Text fontSize="sm">Loading changelog...</Text>
                  </Flex>
                ) : changelog.length === 0 ? (
                  <Box 
                    py={4} 
                    textAlign="center" 
                    color="gray.500"
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor={borderColor}
                    borderRadius="md"
                    p={4}
                  >
                    <Text fontSize="sm">No changelog entries available.</Text>
                  </Box>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {changelog.map((item) => renderChangelogItem(item))}
                    
                    {/* Load More Button */}
                    {hasMore && (
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        onClick={loadMore}
                        isLoading={isLoadingChangelog}
                        loadingText="Loading more..."
                        width="full"
                        mt={2}
                      >
                        Load More
                      </Button>
                    )}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FeatureRequestSidebar;
