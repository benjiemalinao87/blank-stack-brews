import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Code
} from '@chakra-ui/react';
import { Clock, RotateCcw, Eye, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getFlowRevisions, restoreFlowVersion } from '../../services/flowRevisionService';

/**
 * FlowTimeline component displays the revision history for a flow
 * @param {Object} props - Component props
 * @param {Object} props.flow - The flow object
 * @param {Function} props.onRestore - Callback function when a version is restored
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 */
const FlowTimeline = ({ flow, onRestore, isOpen, onClose }) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const toast = useToast();
  const previewModal = useDisclosure();
  
  useEffect(() => {
    if (isOpen && flow && flow.id) {
      loadRevisions();
    }
  }, [isOpen, flow]);
  
  /**
   * Load all revisions for the current flow
   */
  const loadRevisions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading revisions for flow:', flow.id, 'workspace:', flow.workspace_id);
      const { data, error } = await getFlowRevisions(flow.id, flow.workspace_id);
      
      if (error) {
        console.error('Error loading revisions:', error);
        setError(error.message || 'Failed to load revision history');
        toast({
          title: "Error loading revisions",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.log('Loaded revisions:', data);
        setRevisions(data || []);
      }
    } catch (err) {
      console.error('Exception loading revisions:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Restore the flow to a specific revision
   * @param {Object} revision - The revision to restore
   */
  const handleRestore = async (revision) => {
    try {
      setLoading(true);
      const { error } = await restoreFlowVersion(flow.id, revision.id, flow.workspace_id);
      
      if (error) {
        toast({
          title: "Error restoring version",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Version restored",
          description: `Restored to version ${revision.version}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Close the modal and call the onRestore callback
        onClose();
        if (onRestore) {
          onRestore(revision);
        }
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      toast({
        title: "Error restoring version",
        description: err.message || 'An unexpected error occurred',
        status: "error",
        duration: 3000,
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
  
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay 
          bg="blackAlpha.300"
          backdropFilter="blur(10px)"
        />
        <ModalContent borderRadius="md" shadow="xl">
          <ModalHeader>Flow Timeline History</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {loading ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" />
                  <Text mt={2}>Loading revision history...</Text>
                </Box>
              ) : error ? (
                <Box 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  textAlign="center"
                  bg="red.50"
                >
                  <AlertCircle size={24} style={{ margin: '0 auto', color: 'red' }} />
                  <Text mt={2} fontWeight="bold" color="red.500">Error loading revision history</Text>
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
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  textAlign="center"
                  bg="gray.50"
                >
                  <Clock size={24} style={{ margin: '0 auto', opacity: 0.5 }} />
                  <Text mt={2}>No revision history available for this flow.</Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Revisions are created when you save changes to your flow.
                  </Text>
                </Box>
              ) : (
                revisions.map((revision, index) => (
                  <Box 
                    key={revision.id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md"
                    bg={index === 0 ? "blue.50" : "white"}
                    _hover={{ shadow: "sm" }}
                    transition="all 0.2s"
                  >
                    <HStack justify="space-between">
                      <HStack>
                        <Clock size={16} />
                        <Text fontWeight="bold">Version {revision.version}</Text>
                        {index === 0 && (
                          <Badge colorScheme="green">Current</Badge>
                        )}
                      </HStack>
                      <HStack>
                        <Button
                          size="xs"
                          leftIcon={<Eye size={14} />}
                          onClick={() => handlePreview(revision)}
                        >
                          Preview
                        </Button>
                        {index > 0 && (
                          <Button
                            size="xs"
                            colorScheme="blue"
                            leftIcon={<RotateCcw size={14} />}
                            onClick={() => handleRestore(revision)}
                          >
                            Restore
                          </Button>
                        )}
                      </HStack>
                    </HStack>
                    <Divider my={2} />
                    <Text fontSize="sm">{revision.change_description}</Text>
                    <HStack mt={2} fontSize="xs" color="gray.500">
                      <Text>
                        {revision.modified_at ? (
                          `${formatDistanceToNow(new Date(revision.modified_at))} ago`
                        ) : 'Unknown date'}
                      </Text>
                      {revision.modified_by && (
                        <Text>by {revision.modified_by}</Text>
                      )}
                    </HStack>
                  </Box>
                ))
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Preview Modal */}
      {selectedRevision && (
        <Modal isOpen={previewModal.isOpen} onClose={previewModal.onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Preview Version {selectedRevision.version}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box p={4} borderWidth="1px" borderRadius="md">
                <Text fontWeight="bold">Nodes:</Text>
                <Code p={2} mt={1} fontSize="sm" width="100%" overflowX="auto">
                  {JSON.stringify(selectedRevision.nodes, null, 2)}
                </Code>
                
                <Text fontWeight="bold" mt={4}>Edges:</Text>
                <Code p={2} mt={1} fontSize="sm" width="100%" overflowX="auto">
                  {JSON.stringify(selectedRevision.edges, null, 2)}
                </Code>
                
                <Text fontWeight="bold" mt={4}>Modified:</Text>
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

export default FlowTimeline;
