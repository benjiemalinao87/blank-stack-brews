import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Card,
  CardBody,
  Badge,
  Flex,
  Skeleton,
  Grid,
  Checkbox,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Share2, MoreVertical, Edit2, Trash2, ArrowLeft, Clock, FileText, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { formatDistanceToNow } from 'date-fns';
import FlowTimelineSidebar from './FlowTimelineSidebar';

const FlowItem = ({ flow, onSelect, onDelete, view = 'grid', isSelected, onToggleSelect, onViewHistory }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Ensure nodes is always an array and calculate step count
  const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
  const stepCount = nodes.length;
  
  const updatedAt = flow.updated_at ? formatDistanceToNow(new Date(flow.updated_at), { addSuffix: true }) : 'Never';

  if (view === 'grid') {
    return (
      <Card
        onClick={() => onSelect(flow)}
        cursor="pointer"
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        _hover={{ bg: hoverBg, transform: 'translateY(-2px)' }}
        transition="all 0.2s"
        boxShadow="sm"
        maxW="220px"
        h="auto"
        position="relative"
      >
        <Box 
          position="absolute" 
          top="8px" 
          left="8px" 
          zIndex="1" 
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Checkbox 
            isChecked={isSelected} 
            colorScheme="blue"
            size="sm"
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(flow);
            }}
          />
        </Box>
        <CardBody p={3}>
          <VStack align="start" spacing={1} pl="24px">
            <HStack width="100%" justify="space-between">
              <HStack spacing={2}>
                <Box color="purple.500">
                  <FileText size={16} />
                </Box>
                <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                  {flow.name}
                </Text>
              </HStack>
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<MoreVertical size={14} />}
                  variant="ghost"
                  size="xs"
                  onClick={(e) => e.stopPropagation()}
                />
                <MenuList>
                  <MenuItem icon={<Share2 size={16} />}>Share</MenuItem>
                  <MenuItem icon={<Edit2 size={16} />}>Rename</MenuItem>
                  <MenuItem 
                    icon={<Clock size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(flow);
                    }}
                  >
                    View History
                  </MenuItem>
                  <MenuItem 
                    icon={<Trash2 size={16} />} 
                    color="red.500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(flow);
                    }}
                  >
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
            <HStack spacing={3} fontSize="xs" color="gray.500">
              <HStack spacing={1}>
                <Clock size={12} />
                <Text>{updatedAt}</Text>
              </HStack>
              <Badge colorScheme="purple" variant="subtle" fontSize="2xs" py={0}>
                {stepCount} steps
              </Badge>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      onClick={() => onSelect(flow)}
      cursor="pointer"
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      _hover={{ bg: hoverBg, shadow: 'md' }}
      transition="all 0.2s"
      boxShadow="sm"
      position="relative"
    >
      <Box 
        position="absolute" 
        top="50%" 
        left="16px" 
        transform="translateY(-50%)" 
        zIndex="1" 
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Checkbox 
          isChecked={isSelected} 
          colorScheme="blue"
          size="md"
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(flow);
          }}
        />
      </Box>
      <CardBody>
        <Flex justify="space-between" align="center" pl="32px">
          <HStack spacing={4}>
            <Box color="purple.500">
              <FileText size={20} />
            </Box>
            <Text fontWeight="medium">{flow.name}</Text>
            <Badge colorScheme="purple" variant="subtle">
              {stepCount} steps
            </Badge>
            <HStack spacing={1} color="gray.500">
              <Clock size={14} />
              <Text fontSize="sm">{updatedAt}</Text>
            </HStack>
          </HStack>
          <HStack>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(flow);
              }}
            >
              View
            </Button>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<MoreVertical size={16} />}
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList>
                <MenuItem icon={<Share2 size={16} />}>Share</MenuItem>
                <MenuItem icon={<Edit2 size={16} />}>Rename</MenuItem>
                <MenuItem 
                  icon={<Clock size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory(flow);
                  }}
                >
                  View History
                </MenuItem>
                <MenuItem 
                  icon={<Trash2 size={16} />} 
                  color="red.500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(flow);
                  }}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </CardBody>
    </Card>
  );
};

const FlowList = ({ folder, onBack, onFlowSelect, view = 'grid', searchQuery = '' }) => {
  const { currentWorkspace } = useWorkspace();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlows, setSelectedFlows] = useState([]);
  const [selectedHistoryFlow, setSelectedHistoryFlow] = useState(null);
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const { isOpen: isTimelineOpen, onOpen: onTimelineOpen, onClose: onTimelineClose } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const selectionBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (currentWorkspace) {
      loadFlows();
    }
    // Clear selections when folder or search changes
    setSelectedFlows([]);
  }, [currentWorkspace, folder, searchQuery]);

  const loadFlows = async () => {
    if (!currentWorkspace) return;
    setLoading(true);

    try {
      let query = supabase
        .from('flows')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);

      if (folder) {
        query = query.eq('folder_id', folder.id);
      } else {
        query = query.is('folder_id', null);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (!error) {
        setFlows(data || []);
      } else {
        console.error('Error loading flows:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlow = async (flow) => {
    if (!currentWorkspace) return;

    const { error } = await supabase
      .from('flows')
      .delete()
      .eq('id', flow.id)
      .eq('workspace_id', currentWorkspace.id);

    if (!error) {
      setFlows(flows.filter(f => f.id !== flow.id));
      // Remove from selected flows if it was selected
      setSelectedFlows(selectedFlows.filter(id => id !== flow.id));
      toast({
        title: "Flow deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error deleting flow",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleToggleSelect = (flow) => {
    setSelectedFlows(prev => {
      if (prev.includes(flow.id)) {
        return prev.filter(id => id !== flow.id);
      } else {
        return [...prev, flow.id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedFlows.length === flows.length) {
      // Deselect all
      setSelectedFlows([]);
    } else {
      // Select all
      setSelectedFlows(flows.map(flow => flow.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!currentWorkspace || selectedFlows.length === 0) return;

    try {
      const { error } = await supabase
        .from('flows')
        .delete()
        .in('id', selectedFlows)
        .eq('workspace_id', currentWorkspace.id);

      if (!error) {
        setFlows(flows.filter(f => !selectedFlows.includes(f.id)));
        setSelectedFlows([]);
        toast({
          title: `${selectedFlows.length} flow${selectedFlows.length > 1 ? 's' : ''} deleted`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting flows:', error);
      toast({
        title: "Error deleting flows",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    onDeleteAlertClose();
  };

  // Handle viewing history for a flow
  const handleViewHistory = (flow) => {
    setSelectedHistoryFlow(flow);
    onTimelineOpen();
  };

  if (loading) {
    return (
      <Grid
        templateColumns={view === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr'}
        gap={4}
      >
        {[1, 2, 3].map(i => (
          <Skeleton key={i} height="100px" borderRadius="lg" />
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {folder && (
        <HStack justify="space-between" mb={6}>
          <HStack>
            <IconButton
              icon={<ArrowLeft size={20} />}
              onClick={onBack}
              variant="ghost"
              aria-label="Back"
            />
            <Text fontSize="lg" fontWeight="medium">
              {folder.name}
            </Text>
          </HStack>
        </HStack>
      )}

      {flows.length > 0 && (
        <HStack justify="space-between" mb={4} bg={selectionBg} p={2} borderRadius="md">
          <HStack>
            <Checkbox 
              isChecked={selectedFlows.length > 0 && selectedFlows.length === flows.length}
              isIndeterminate={selectedFlows.length > 0 && selectedFlows.length < flows.length}
              onChange={handleSelectAll}
              colorScheme="blue"
            >
              {selectedFlows.length === 0 
                ? "Select All" 
                : `Selected ${selectedFlows.length} of ${flows.length}`}
            </Checkbox>
          </HStack>
          {selectedFlows.length > 0 && (
            <Button
              leftIcon={<Trash2 size={16} />}
              colorScheme="red"
              size="sm"
              onClick={onDeleteAlertOpen}
              _hover={{ bg: 'red.600' }}
              transition="all 0.2s"
            >
              Delete Selected ({selectedFlows.length})
            </Button>
          )}
        </HStack>
      )}

      <Grid
        templateColumns={view === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr'}
        gap={4}
      >
        {flows.map((flow) => (
          <FlowItem
            key={flow.id}
            flow={flow}
            onSelect={onFlowSelect}
            onDelete={handleDeleteFlow}
            view={view}
            isSelected={selectedFlows.includes(flow.id)}
            onToggleSelect={handleToggleSelect}
            onViewHistory={handleViewHistory}
          />
        ))}
      </Grid>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {selectedFlows.length} Flow{selectedFlows.length > 1 ? 's' : ''}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone. 
              {selectedFlows.length > 1 
                ? ` ${selectedFlows.length} flows will be permanently deleted.` 
                : ' This flow will be permanently deleted.'}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleBulkDelete} 
                ml={3}
                leftIcon={<Trash2 size={16} />}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <FlowTimelineSidebar 
        isOpen={isTimelineOpen} 
        onClose={onTimelineClose} 
        flow={selectedHistoryFlow}
        onRestore={() => {
          // Refresh the flow list after a restore
          loadFlows();
          toast({
            title: "Flow restored",
            description: "The flow has been restored to a previous version",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }}
      />
    </Box>
  );
};

export default FlowList;
