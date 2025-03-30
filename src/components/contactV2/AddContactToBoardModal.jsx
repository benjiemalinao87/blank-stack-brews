import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Text,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { getWorkspaceBoards, getBoardColumns, addContactToBoard } from '../../services/boardService';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const AddContactToBoardModal = ({
  isOpen,
  onClose,
  contact,
  contacts = [], // Support both single and bulk operations
  workspaceId,
}) => {
  const [formData, setFormData] = useState({
    boardId: '',
    columnId: '',
  });
  
  const [boards, setBoards] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const { currentWorkspace } = useWorkspace();

  // Handle both single contact and bulk operations
  const contactsToAdd = contacts.length > 0 ? contacts : [contact];
  
  useEffect(() => {
    if (isOpen && (workspaceId || currentWorkspace?.id)) {
      console.log('Modal opened with contacts:', contactsToAdd);
      fetchBoards();
    }
  }, [isOpen, workspaceId, currentWorkspace]);
  
  useEffect(() => {
    if (formData.boardId) {
      fetchColumns(formData.boardId);
    } else {
      setColumns([]);
    }
  }, [formData.boardId]);
  
  const fetchBoards = async () => {
    const targetWorkspaceId = workspaceId || currentWorkspace?.id;
    if (!targetWorkspaceId) {
      toast({
        title: "No Workspace Selected",
        description: "Please select a workspace to view boards",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsLoadingBoards(true);
      const boardsData = await getWorkspaceBoards(targetWorkspaceId);
      setBoards(boardsData);
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast({
        title: 'Error fetching boards',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoadingBoards(false);
    }
  };
  
  const fetchColumns = async (boardId) => {
    if (!boardId) return;
    
    try {
      setIsLoadingColumns(true);
      const columnsData = await getBoardColumns(boardId);
      console.log('Fetched columns:', columnsData);
      
      // Find the Inbox column
      const inboxColumn = columnsData.find(col => 
        col.title.toLowerCase() === 'inbox' || 
        col.name?.toLowerCase() === 'inbox'
      );
      
      console.log('Inbox column:', inboxColumn);
      
      setColumns(columnsData);
      
      // Automatically select the Inbox column if available
      if (inboxColumn) {
        setFormData(prev => ({
          ...prev,
          columnId: inboxColumn.id
        }));
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
      toast({
        title: 'Error fetching columns',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.boardId || !formData.columnId) {
      toast({
        title: 'Missing fields',
        description: 'Please select both a board and a column',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Starting bulk operation:', {
        boardId: formData.boardId,
        columnId: formData.columnId,
        contactCount: contactsToAdd.length
      });
      
      // Handle bulk operations with Promise.all for better performance
      const results = await Promise.all(contactsToAdd.map(async (c) => {
        try {
          await addContactToBoard(c.id, formData.boardId, formData.columnId);
          return { status: 'fulfilled', contactId: c.id };
        } catch (error) {
          console.error('Failed to add contact:', c.id, error);
          return { status: 'rejected', contactId: c.id, error };
        }
      }));

      // Process results
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      console.log('Bulk operation completed:', {
        total: contactsToAdd.length,
        successes: successes.length,
        failures: failures.length
      });

      if (failures.length > 0) {
        console.error('Failed contacts:', failures);
        toast({
          title: 'Partial success',
          description: `Added ${successes.length} contacts, but ${failures.length} failed`,
          status: 'warning',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Success',
          description: `${contactsToAdd.length} contact${contactsToAdd.length > 1 ? 's' : ''} added to board successfully`,
          status: 'success',
          duration: 3000,
        });
      }
      
      // Only trigger one refresh event after all operations are complete
      window.dispatchEvent(new CustomEvent('board:refresh', { 
        detail: { boardId: formData.boardId }
      }));
      
      onClose();
    } catch (error) {
      console.error('Error in bulk operation:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="md"
      motionPreset="scale"
      isCentered
    >
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="xl">
        <ModalHeader>Add to Board</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Adding <strong>{contactsToAdd.length} contact{contactsToAdd.length > 1 ? 's' : ''}</strong> to a board
            </Text>
            
            <FormControl isDisabled={isLoadingBoards}>
              <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                Select Board
              </FormLabel>
              <Select
                placeholder={isLoadingBoards ? "Loading boards..." : "Select board"}
                value={formData.boardId}
                onChange={(e) => handleChange('boardId', e.target.value)}
                size="sm"
                isDisabled={isLoadingBoards || boards.length === 0}
              >
                {boards.map(board => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isDisabled={!formData.boardId || isLoadingColumns}>
              <FormLabel fontSize="sm" fontWeight="medium" color={labelColor}>
                Select Column
              </FormLabel>
              <Select
                placeholder={isLoadingColumns ? "Loading columns..." : "Select column"}
                value={formData.columnId}
                onChange={(e) => handleChange('columnId', e.target.value)}
                size="sm"
                isDisabled={!formData.boardId || isLoadingColumns || columns.length === 0}
              >
                {columns.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.title || column.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!formData.boardId || !formData.columnId}
          >
            Add to Board
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddContactToBoardModal; 