import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  useColorModeValue,
  useDisclosure,
  Input,
  Grid,
  Card,
  CardBody,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { Plus, Grid as GridIcon, List, Search, Folder, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { DraggableWindow } from '../window/DraggableWindow';
import FlowList from './FlowList';
import CreateFolderModal from './modals/CreateFolderModal';
import CreateFlowModal from './modals/CreateFlowModal';

const FolderCard = ({ folder, onSelect, onEdit, onDelete }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Card
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      _hover={{ bg: hoverBg, transform: 'translateY(-2px)' }}
      transition="all 0.2s"
      boxShadow="sm"
      maxW="220px"
      h="auto"
    >
      <CardBody p={3}>
        <HStack spacing={2}>
          <Box 
            color="blue.500" 
            cursor="pointer"
            onClick={() => onSelect(folder)}
            flex={1}
          >
            <HStack spacing={2}>
              <Folder size={16} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{folder.name}</Text>
                <Badge colorScheme="blue" variant="subtle" fontSize="2xs" py={0}>
                  {folder.flow_count || 0} flows
                </Badge>
              </VStack>
            </HStack>
          </Box>
          <HStack spacing={1}>
            <IconButton
              icon={<Edit2 size={14} />}
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(folder);
              }}
              aria-label="Edit folder"
            />
            <IconButton
              icon={<Trash2 size={14} />}
              variant="ghost"
              size="xs"
              colorScheme="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder);
              }}
              aria-label="Delete folder"
            />
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  );
};

const FlowManagerWindow = ({ onClose, onFlowSelect }) => {
  const { currentWorkspace } = useWorkspace();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    isOpen: isFolderModalOpen, 
    onOpen: onFolderModalOpen, 
    onClose: onFolderModalClose 
  } = useDisclosure();
  const { 
    isOpen: isFlowModalOpen, 
    onOpen: onFlowModalOpen, 
    onClose: onFlowModalClose 
  } = useDisclosure();
  const bg = useColorModeValue('gray.50', 'gray.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toast = useToast();

  const loadFolders = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      // First, get all folders
      const { data: folderData, error: folderError } = await supabase
        .from('flow_folders')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: true });

      if (folderError) {
        console.error('Error loading folders:', folderError);
        return;
      }

      // Then, get all flows to calculate counts
      const { data: flowData, error: flowError } = await supabase
        .from('flows')
        .select('id, folder_id')
        .eq('workspace_id', currentWorkspace.id);

      if (flowError) {
        console.error('Error loading flows:', flowError);
        setFolders(folderData || []);
        return;
      }

      // Calculate flow counts for each folder
      const countMap = {};
      flowData?.forEach(flow => {
        if (flow.folder_id) {
          countMap[flow.folder_id] = (countMap[flow.folder_id] || 0) + 1;
        }
      });

      // Merge folder data with counts
      const foldersWithCount = folderData?.map(folder => ({
        ...folder,
        flow_count: countMap[folder.id] || 0
      })) || [];
      
      setFolders(foldersWithCount);
    } catch (error) {
      console.error('Error in loadFolders:', error);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      loadFolders();
    }
  }, [currentWorkspace, loadFolders]);

  const handleCreateFlow = (name, folderId) => {
    const newFlow = {
      id: null,
      name: name,
      nodes: [],
      edges: [],
      folder_id: folderId || selectedFolder?.id || null,
      workspace_id: currentWorkspace?.id,
      created_at: new Date().toISOString()
    };
    console.log('Creating new flow with folder:', folderId || selectedFolder?.id);
    onFlowSelect(newFlow);
  };

  const handleCreateFolder = async (name) => {
    if (!currentWorkspace) {
      console.error('No workspace selected');
      return;
    }

    const { data, error } = await supabase
      .from('flow_folders')
      .insert([
        {
          name,
          workspace_id: currentWorkspace.id,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setFolders([...folders, data]);
      toast({
        title: "Folder created",
        description: `${name} folder has been created successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditFolder = async (name) => {
    if (!editingFolder || !currentWorkspace) return;

    const { error } = await supabase
      .from('flow_folders')
      .update({ name })
      .eq('id', editingFolder.id)
      .eq('workspace_id', currentWorkspace.id);

    if (!error) {
      setFolders(folders.map(f => 
        f.id === editingFolder.id ? { ...f, name } : f
      ));
      setEditingFolder(null);
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!currentWorkspace) return;

    const { error } = await supabase
      .from('flow_folders')
      .delete()
      .eq('id', folder.id)
      .eq('workspace_id', currentWorkspace.id);

    if (!error) {
      setFolders(folders.filter(f => f.id !== folder.id));
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
      }
    }
  };

  return (
    <DraggableWindow
      title="Flow Manager"
      onClose={onClose}
      initialSize={{ width: 800, height: 600 }}
      initialPosition={{ x: 100, y: 100 }}
    >
      <Box p={4} height="100%" overflow="auto">
        <HStack mb={4} justify="space-between">
          {selectedFolder ? (
            <Text fontWeight="medium" fontSize="lg">
              {selectedFolder.name}
            </Text>
          ) : (
            <Text fontWeight="medium" fontSize="lg">
              All Folders
            </Text>
          )}
          
          <HStack>
            <Button
              leftIcon={<Plus size={16} />}
              colorScheme="blue"
              size="sm"
              onClick={onFlowModalOpen}
            >
              New Flow
            </Button>
            <HStack
              bg={bg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              p={1}
            >
              <IconButton
                icon={<GridIcon size={16} />}
                size="sm"
                variant={view === 'grid' ? 'solid' : 'ghost'}
                colorScheme={view === 'grid' ? 'blue' : 'gray'}
                onClick={() => setView('grid')}
                aria-label="Grid view"
              />
              <IconButton
                icon={<List size={16} />}
                size="sm"
                variant={view === 'list' ? 'solid' : 'ghost'}
                colorScheme={view === 'list' ? 'blue' : 'gray'}
                onClick={() => setView('list')}
                aria-label="List view"
              />
            </HStack>
          </HStack>
        </HStack>
        
        <Box
          bg={bg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          mb={4}
          p={2}
        >
          <HStack>
            <Search size={16} color="gray.500" />
            <Input
              placeholder="Search flows and folders..."
              variant="unstyled"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </HStack>
        </Box>
        
        {selectedFolder ? (
          <FlowList
            folder={selectedFolder}
            onBack={() => setSelectedFolder(null)}
            onFlowSelect={onFlowSelect}
            view={view}
            searchQuery={searchQuery}
          />
        ) : (
          <>
            <Text fontWeight="medium" mb={2}>Folders</Text>
            <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4} mb={6}>
              {folders
                .filter(folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onSelect={setSelectedFolder}
                    onEdit={(folder) => {
                      setEditingFolder(folder);
                      onFolderModalOpen();
                    }}
                    onDelete={handleDeleteFolder}
                  />
                ))}
              <Card
                bg={bg}
                borderWidth="1px"
                borderStyle="dashed"
                borderColor={borderColor}
                _hover={{ bg: hoverBg }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => {
                  setEditingFolder(null);
                  onFolderModalOpen();
                }}
                maxW="220px"
                h="auto"
              >
                <CardBody p={3} textAlign="center">
                  <VStack spacing={1}>
                    <Plus size={16} />
                    <Text fontSize="sm">Add Folder</Text>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
            
            <Text fontWeight="medium" mb={2}>Flows</Text>
            <FlowList
              onFlowSelect={onFlowSelect}
              view={view}
              searchQuery={searchQuery}
            />
          </>
        )}
      </Box>
      
      {/* Create/Edit Folder Modal */}
      <CreateFolderModal 
        isOpen={isFolderModalOpen} 
        onClose={() => {
          onFolderModalClose();
          setEditingFolder(null);
        }}
        onSubmit={editingFolder ? handleEditFolder : handleCreateFolder}
        initialName={editingFolder?.name || ''}
        isEditing={!!editingFolder}
      />
      
      {/* Create Flow Modal */}
      <CreateFlowModal
        isOpen={isFlowModalOpen}
        onClose={onFlowModalClose}
        onCreateFlow={handleCreateFlow}
        folders={folders}
        selectedFolder={selectedFolder}
      />
    </DraggableWindow>
  );
};

export default FlowManagerWindow;
