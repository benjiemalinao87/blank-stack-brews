import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  useToast,
  Spinner,
  Code,
  Collapse,
  Flex,
  Icon,
  Tooltip,
  useColorModeValue,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  IconButton
} from '@chakra-ui/react';
import { 
  Clock, 
  RotateCcw, 
  Eye, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  Calendar,
  Clock12,
  X
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { getFlowRevisions, restoreFlowVersion } from '../../services/flowRevisionService';

/**
 * FlowTimelineSidebar component displays the revision history for a flow in a sidebar
 * @param {Object} props - Component props
 * @param {Object} props.flow - The flow object
 * @param {Function} props.onRestore - Callback function when a version is restored
 * @param {boolean} props.isOpen - Whether the sidebar is open
 * @param {Function} props.onClose - Function to close the sidebar
 */
const FlowTimelineSidebar = ({ flow, onRestore, isOpen, onClose }) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({ today: true, yesterday: true, thisWeek: true, older: true });
  const [expandedRevisions, setExpandedRevisions] = useState({});
  const toast = useToast();
  const previewModal = useDisclosure();
  
  // Color mode values - define these at the top level, not conditionally
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const currentBgColor = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const errorBgColor = useColorModeValue("red.50", "red.900");
  const errorTextColor = useColorModeValue("red.500", "red.300");
  const emptyBgColor = useColorModeValue("gray.50", "gray.700");
  const groupBgColor = useColorModeValue("gray.50", "gray.700");
  
  useEffect(() => {
    if (isOpen && flow?.id) {
      loadRevisions();
    }
  }, [isOpen, flow?.id]);
  
  /**
   * Load all revisions for the current flow
   */
  const loadRevisions = async () => {
    if (!flow?.id) {
      console.error('Cannot load revisions: No flow ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    setRevisions([]); // Clear existing revisions while loading
    
    try {
      console.log('Loading revisions for flow:', {
        flowId: flow.id,
        workspaceId: flow.workspace_id || 'default'
      });

      const { data, error } = await getFlowRevisions(
        flow.id,
        flow.workspace_id || 'default'
      );
      
      if (error) {
        console.error('Error loading revisions:', error);
        const errorMessage = error.message || 'Failed to load revision history';
        setError(errorMessage);
        toast({
          title: "Error loading revisions",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid revision data received');
      }
      
      console.log('Loaded revisions:', {
        count: data.length,
        firstRevision: data[0]
      });
      
      setRevisions(data);
      
      // Auto-expand the first revision if we have any
      if (data.length > 0) {
        setExpandedRevisions(prev => ({ ...prev, [data[0].id]: true }));
      }
    } catch (err) {
      console.error('Exception loading revisions:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Error loading revisions",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Restore the flow to a specific revision
   * @param {Object} revision - The revision to restore
   */
  const handleRestore = async (revision) => {
    if (!flow?.id || !revision?.id) {
      console.error('Cannot restore: Missing flow ID or revision ID');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Restoring flow version:', {
        flowId: flow.id,
        revisionId: revision.id,
        version: revision.version,
        workspaceId: flow.workspace_id || 'default'
      });

      const { error } = await restoreFlowVersion(
        flow.id,
        revision.id,
        flow.workspace_id || 'default'
      );
      
      if (error) {
        throw error;
      }

      toast({
        title: "Version restored",
        description: `Successfully restored to version ${revision.version}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Close the sidebar and notify parent
      onClose();
      if (onRestore) {
        onRestore(revision);
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      toast({
        title: "Error restoring version",
        description: err.message || 'Failed to restore version',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Preview a specific revision
   * @param {Object} revision - The revision to preview
   */
  const handlePreview = (revision) => {
    setSelectedRevision(revision);
    previewModal.onOpen();
  };
  
  /**
   * Toggle the expanded state of a revision
   * @param {string} id - The revision ID
   */
  const toggleRevision = (id) => {
    setExpandedRevisions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  /**
   * Toggle the expanded state of a group
   * @param {string} group - The group name
   */
  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  /**
   * Get the visual diff between two revisions
   * @param {Object} current - The current revision
   * @param {Object} previous - The previous revision
   * @returns {Object} The visual diff
   */
  const getVisualDiff = (current, previous) => {
    if (!previous) return { nodesDiff: 0, edgesDiff: 0 };
    
    const nodesDiff = (current.nodes?.length || 0) - (previous.nodes?.length || 0);
    const edgesDiff = (current.edges?.length || 0) - (previous.edges?.length || 0);
    
    return { nodesDiff, edgesDiff };
  };
  
  // Group revisions by date
  const groupedRevisions = useMemo(() => {
    if (!revisions || revisions.length === 0) return {};
    
    return revisions.reduce((acc, revision) => {
      const date = revision.modified_at ? parseISO(revision.modified_at) : new Date();
      
      let group = 'older';
      if (isToday(date)) group = 'today';
      else if (isYesterday(date)) group = 'yesterday';
      else if (isThisWeek(date)) group = 'thisWeek';
      
      if (!acc[group]) acc[group] = [];
      acc[group].push(revision);
      
      return acc;
    }, {});
  }, [revisions]);
  
  // Get group title and icon
  const getGroupInfo = (group) => {
    switch (group) {
      case 'today':
        return { title: 'Today', icon: Clock };
      case 'yesterday':
        return { title: 'Yesterday', icon: Clock12 };
      case 'thisWeek':
        return { title: 'This Week', icon: Calendar };
      case 'older':
      default:
        return { title: 'Older', icon: Calendar };
    }
  };
  
  return (
    <>
      <Box
        position="absolute"
        right={0}
        top={0}
        height="100%"
        width="350px"
        bg={bgColor}
        borderLeft="1px solid"
        borderColor={borderColor}
        transform={isOpen ? "translateX(0)" : "translateX(100%)"}
        transition="transform 0.3s ease-in-out"
        zIndex={2}
        display="flex"
        flexDirection="column"
      >
        <Flex 
          p={3} 
          borderBottomWidth="1px" 
          borderColor={borderColor}
          align="center"
          justify="space-between"
        >
          <Text fontWeight="bold">Flow Revision History</Text>
          <IconButton
            icon={<X size={18} />}
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close sidebar"
          />
        </Flex>

        <Box flex="1" overflowY="auto" p={0}>
          {loading ? (
            <Flex direction="column" align="center" justify="center" h="100%" p={4}>
              <Spinner size="md" />
              <Text mt={2}>Loading revision history...</Text>
            </Flex>
          ) : error ? (
            <Box 
              m={4}
              p={4} 
              borderWidth="1px" 
              borderRadius="md" 
              textAlign="center"
              bg={errorBgColor}
            >
              <AlertCircle size={24} style={{ margin: '0 auto', color: errorTextColor }} />
              <Text mt={2} fontWeight="bold" color={errorTextColor}>Error loading revision history</Text>
              <Text mt={1}>{error}</Text>
              <Code mt={2} p={2} fontSize="sm" width="100%">
                Flow ID: {flow?.id || 'N/A'}<br />
                Workspace ID: {flow?.workspace_id || 'N/A'}
              </Code>
              <Button 
                mt={3} 
                colorScheme="blue" 
                size="sm" 
                onClick={loadRevisions}
                leftIcon={<RotateCcw size={16} />}
              >
                Retry
              </Button>
            </Box>
          ) : revisions.length === 0 ? (
            <Box 
              m={4}
              p={4} 
              borderWidth="1px" 
              borderRadius="md" 
              textAlign="center"
              bg={emptyBgColor}
            >
              <Clock size={24} style={{ margin: '0 auto', opacity: 0.5 }} />
              <Text mt={2}>No revision history available for this flow.</Text>
              <Text fontSize="sm" color={subTextColor} mt={1}>
                Revisions are created when you save changes to your flow.
              </Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch" divider={<Divider />}>
              {Object.keys(groupedRevisions).map(group => {
                if (groupedRevisions[group].length === 0) return null;
                
                const { title, icon } = getGroupInfo(group);
                
                return (
                  <Box key={group}>
                    <Flex 
                      p={3} 
                      bg={groupBgColor}
                      alignItems="center"
                      cursor="pointer"
                      onClick={() => toggleGroup(group)}
                    >
                      <Icon as={expandedGroups[group] ? ChevronDown : ChevronRight} mr={2} />
                      <Icon as={icon} mr={2} color={iconColor} />
                      <Text fontWeight="bold">{title}</Text>
                      <Badge ml={2} colorScheme="blue" borderRadius="full">
                        {groupedRevisions[group].length}
                      </Badge>
                    </Flex>
                    
                    <Collapse in={expandedGroups[group]} animateOpacity>
                      <VStack spacing={0} align="stretch">
                        {groupedRevisions[group].map((revision, index) => {
                          const isFirst = index === 0 && group === 'today';
                          const prevRevision = groupedRevisions[group][index + 1];
                          const { nodesDiff, edgesDiff } = getVisualDiff(revision, prevRevision);
                          
                          return (
                            <Box 
                              key={revision.id}
                              borderLeftWidth={isFirst ? "4px" : "1px"}
                              borderLeftColor={isFirst ? "green.400" : borderColor}
                              borderBottomWidth="1px"
                              borderBottomColor={borderColor}
                              bg={isFirst ? currentBgColor : bgColor}
                              _hover={{ bg: hoverBgColor }}
                              transition="all 0.2s"
                            >
                              <Box 
                                p={3} 
                                cursor="pointer"
                                onClick={() => toggleRevision(revision.id)}
                              >
                                <HStack justify="space-between">
                                  <HStack>
                                    <Icon 
                                      as={expandedRevisions[revision.id] ? ChevronDown : ChevronRight} 
                                      color={subTextColor}
                                    />
                                    <Text fontWeight={isFirst ? "bold" : "medium"}>
                                      Version {revision.version}
                                    </Text>
                                    {isFirst && (
                                      <Badge colorScheme="green">Current</Badge>
                                    )}
                                  </HStack>
                                  <Text fontSize="xs" color={subTextColor}>
                                    {revision.modified_at ? (
                                      formatDistanceToNow(new Date(revision.modified_at), { addSuffix: true })
                                    ) : 'Unknown date'}
                                  </Text>
                                </HStack>
                              </Box>
                              
                              <Collapse in={expandedRevisions[revision.id]} animateOpacity>
                                <Box px={3} pb={3} pt={0}>
                                  <Text fontSize="sm">{revision.change_description || 'No description available'}</Text>
                                  
                                  {(nodesDiff !== 0 || edgesDiff !== 0) && (
                                    <HStack mt={2} spacing={4} fontSize="xs">
                                      {nodesDiff !== 0 && (
                                        <Badge colorScheme={nodesDiff > 0 ? "green" : "red"}>
                                          {nodesDiff > 0 ? `+${nodesDiff}` : nodesDiff} nodes
                                        </Badge>
                                      )}
                                      {edgesDiff !== 0 && (
                                        <Badge colorScheme={edgesDiff > 0 ? "green" : "red"}>
                                          {edgesDiff > 0 ? `+${edgesDiff}` : edgesDiff} connections
                                        </Badge>
                                      )}
                                    </HStack>
                                  )}
                                  
                                  <HStack mt={3} spacing={2}>
                                    <Button
                                      size="xs"
                                      leftIcon={<Eye size={14} />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreview(revision);
                                      }}
                                    >
                                      Preview
                                    </Button>
                                    {!isFirst && (
                                      <Button
                                        size="xs"
                                        colorScheme="blue"
                                        leftIcon={<RotateCcw size={14} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRestore(revision);
                                        }}
                                      >
                                        Restore
                                      </Button>
                                    )}
                                  </HStack>
                                  
                                  <HStack mt={2} fontSize="xs" color={subTextColor}>
                                    {revision.modified_by && (
                                      <Text>by {revision.modified_by}</Text>
                                    )}
                                    {revision.modified_at && (
                                      <Tooltip label={format(new Date(revision.modified_at), 'PPpp')}>
                                        <Text cursor="help">
                                          {format(new Date(revision.modified_at), 'h:mm a')}
                                        </Text>
                                      </Tooltip>
                                    )}
                                  </HStack>
                                </Box>
                              </Collapse>
                            </Box>
                          );
                        })}
                      </VStack>
                    </Collapse>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>
      </Box>

      {/* Preview Modal */}
      {selectedRevision && (
        <Modal isOpen={previewModal.isOpen} onClose={previewModal.onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Preview Version {selectedRevision.version}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box p={4} borderWidth="1px" borderRadius="md">
                <Heading size="sm" mb={2}>Changes</Heading>
                {selectedRevision.change_description ? (
                  <Text mb={4}>{selectedRevision.change_description}</Text>
                ) : (
                  <Text mb={4} color={subTextColor}>No description available</Text>
                )}
                
                <Heading size="sm" mb={2}>Nodes ({selectedRevision.nodes?.length || 0})</Heading>
                <Code p={2} mb={4} fontSize="sm" width="100%" overflowX="auto">
                  {JSON.stringify(selectedRevision.nodes, null, 2)}
                </Code>
                
                <Heading size="sm" mb={2}>Edges ({selectedRevision.edges?.length || 0})</Heading>
                <Code p={2} mb={4} fontSize="sm" width="100%" overflowX="auto">
                  {JSON.stringify(selectedRevision.edges, null, 2)}
                </Code>
                
                <Heading size="sm" mb={2}>Modified</Heading>
                <Text fontSize="sm">
                  {selectedRevision.modified_at ? (
                    format(new Date(selectedRevision.modified_at), 'PPpp')
                  ) : 'Unknown date'}
                  {selectedRevision.modified_by && ` by ${selectedRevision.modified_by}`}
                </Text>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={() => {
                  previewModal.onClose();
                  handleRestore(selectedRevision);
                }}
                isDisabled={revisions[0]?.id === selectedRevision.id}
              >
                Restore This Version
              </Button>
              <Button onClick={previewModal.onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default FlowTimelineSidebar;
