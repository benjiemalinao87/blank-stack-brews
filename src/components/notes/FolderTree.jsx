import React, { useState, useEffect } from 'react';
import {
  VStack,
  Box,
  Text,
  IconButton,
  useColorModeValue,
  Input,
  Button,
  useToast,
} from '@chakra-ui/react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  AddIcon,
  DeleteIcon,
  CheckIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useNotes } from '../../context/NotesContext';
import { supabase } from '../../lib/supabaseUnified';

const FolderItem = ({ folder, level = 0, onDelete }) => {
  const { selectedFolder, setSelectedFolder } = useNotes();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const iconColor = useColorModeValue('gray.600', 'gray.400');
  const toast = useToast();

  const handleAddSubfolder = async () => {
    if (newFolderName.trim()) {
      try {
        const { data: newFolder, error } = await supabase
          .from('flow_folders')
          .insert([{
            name: newFolderName,
            parent_id: folder.id,
          }])
          .select()
          .single();

        if (error) throw error;

        setNewFolderName('');
        setIsAdding(false);
        setIsOpen(true);
      } catch (error) {
        toast({
          title: 'Error creating folder',
          description: error.message,
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  return (
    <Box>
      <Box
        p={2}
        pl={level * 4 + 2}
        cursor="pointer"
        display="flex"
        alignItems="center"
        bg={selectedFolder === folder.id ? selectedBg : 'transparent'}
        _hover={{ bg: selectedFolder === folder.id ? selectedBg : hoverBg }}
        onClick={() => {
          setIsOpen(!isOpen);
          setSelectedFolder(folder.id);
        }}
      >
        {folder.children?.length > 0 ? (
          isOpen ? (
            <ChevronDownIcon color={iconColor} />
          ) : (
            <ChevronRightIcon color={iconColor} />
          )
        ) : (
          <Box w="4" />
        )}
        <Text fontSize="sm" ml={2} flex="1">
          {folder.name}
        </Text>
        <Box>
          <IconButton
            size="xs"
            icon={<AddIcon />}
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            aria-label="Add subfolder"
            mr={1}
          />
          <IconButton
            size="xs"
            icon={<DeleteIcon />}
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder.id);
            }}
            aria-label="Delete folder"
          />
        </Box>
      </Box>

      {isAdding && (
        <Box pl={(level + 1) * 4 + 2} pr={2} py={2}>
          <Input
            size="sm"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSubfolder();
              }
            }}
          />
          <Box mt={2}>
            <Button
              size="xs"
              leftIcon={<CheckIcon />}
              colorScheme="blue"
              mr={2}
              onClick={handleAddSubfolder}
            >
              Add
            </Button>
            <Button
              size="xs"
              leftIcon={<CloseIcon />}
              onClick={() => {
                setIsAdding(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {isOpen && folder.children?.map((child) => (
        <FolderItem
          key={child.id}
          folder={child}
          level={level + 1}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
};

export const FolderTree = () => {
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (currentWorkspace) {
      loadFolders();
    }
  }, [currentWorkspace]);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('flow_folders')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at');

      if (error) throw error;

      // Build folder tree
      const folderMap = {};
      data.forEach(folder => {
        folderMap[folder.id] = { ...folder, children: [] };
      });

      const rootFolders = [];
      data.forEach(folder => {
        if (folder.parent_id) {
          folderMap[folder.parent_id].children.push(folderMap[folder.id]);
        } else {
          rootFolders.push(folderMap[folder.id]);
        }
      });

      setFolders(rootFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: 'Error loading folders',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      const { error } = await supabase
        .from('flow_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      await loadFolders(); // Reload folders after deletion
    } catch (error) {
      toast({
        title: 'Error deleting folder',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (isLoading && !folders.length) {
    return <Box p={4}>Loading folders...</Box>;
  }

  return (
    <VStack align="stretch" spacing={0}>
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          onDelete={handleDeleteFolder}
        />
      ))}
      {!folders.length && (
        <Box p={4}>
          <Text fontSize="sm" color="gray.500">No folders yet</Text>
        </Box>
      )}
    </VStack>
  );
};
