import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  Flex,
  IconButton,
  useColorModeValue,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, Search2Icon } from '@chakra-ui/icons';
import { Filter } from 'lucide-react';
import BoardColumn from '../components/BoardColumn';
import ContactCard from '../components/ContactCard';
import FilterSidebar from '../components/FilterSidebar';
import { supabase } from '../../../services/supabase';
import boardActivityService from '../../../services/boardActivityService.js';
import { moveContactToBoard } from '../../../services/boardService';
import { DragDropProvider } from '../context/DragDropContext';

const SpeedToLeadBoard = ({ board }) => {
  const DEFAULT_COLUMNS = [
    { id: 'inbox', title: 'Inbox', icon: '📥' },
    { id: 'responded', title: 'Responded', icon: '✅' },
    { id: 'followups', title: 'My Follow-ups', icon: '🔄' },
  ];

  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [workspacePhoneNumbers, setWorkspacePhoneNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const scrollbarThumbColor = useColorModeValue('gray.400', 'gray.600');
  const scrollbarTrackColor = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    if (board?.id) {
      fetchWorkspacePhoneNumbers();
      fetchBoardColumns();
      
      // Add listener for board refresh events
      const handleBoardRefresh = (event) => {
        // Always refresh when event is received, regardless of boardId
        // This ensures we catch any changes that might affect this board
        console.log('Board refresh event received:', event?.detail?.boardId);
        console.log('Current board:', board.id);
        
        // Fetch latest contacts
        fetchBoardContacts();
      };
      
      window.addEventListener('board:refresh', handleBoardRefresh);
      
      return () => {
        window.removeEventListener('board:refresh', handleBoardRefresh);
      };
    } else {
      setIsLoading(false);
    }
  }, [board]);

  useEffect(() => {
    if (board?.id && columns.length > 0) {
      fetchBoardContacts();
    }
  }, [board, columns]);

  const fetchBoardContacts = async () => {
    try {
      setIsLoading(true);
      
      // Fetch contacts for this board via the junction table
      const { data: boardContacts, error: boardError } = await supabase
        .from('board_contacts')
        .select('contact_id, metadata')
        .eq('board_id', board.id);
      
      if (boardError) throw boardError;
      
      console.log('Board contacts retrieved:', boardContacts);
      
      if (!boardContacts || boardContacts.length === 0) {
        console.log('No contacts found for this board');
        setContacts([]);
        setIsLoading(false);
        return;
      }
      
      // Create a map of contact_id to metadata for quick lookup
      const contactMetadataMap = {};
      boardContacts.forEach(bc => {
        contactMetadataMap[bc.contact_id] = bc.metadata || {};
      });
      
      // Get the actual contact data
      const contactIds = boardContacts.map(bc => bc.contact_id);
      
      console.log('Fetching contacts with IDs:', contactIds);
      
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .in('id', contactIds);
      
      if (contactsError) throw contactsError;
      
      console.log('Contact data retrieved:', contactsData);
      
      // Transform contact data to match the expected format
      const formattedContacts = contactsData.map(contact => {
        // Get the metadata for this contact
        const metadata = contactMetadataMap[contact.id] || {};
        
        // Determine which column to place the contact in
        let columnId = columns[0]?.id || 'inbox'; // Default to first column or 'inbox'
        
        // Check metadata for column_id
        if (metadata && metadata.column_id) {
          // The column_id in metadata should match one of our columns
          const matchingColumn = columns.find(col => col.id === metadata.column_id);
          if (matchingColumn) {
            columnId = matchingColumn.id;
          }
        } 
        // Fallback to logic based on contact properties
        else if (contact.last_replied_at) {
          const respondedColumn = columns.find(col => col.title.toLowerCase() === 'responded');
          columnId = respondedColumn?.id || columnId;
        } else if (contact.follow_up_at) {
          const followupsColumn = columns.find(col => col.title.toLowerCase().includes('follow'));
          columnId = followupsColumn?.id || columnId;
        }
        
        // Calculate relative time
        const timestamp = contact.updated_at || contact.created_at;
        const relativeTime = getRelativeTime(timestamp);
        
        return {
          id: contact.id,
          name: contact.name || contact.phone_number,
          timestamp: relativeTime,
          message: contact.last_message || 'No message',
          assignedTo: contact.assigned_to || 'UNASSIGNED',
          avatar: contact.avatar || '',
          columnId: columnId,
          boardId: board.id,
          phone_number: contact.phone_number,
          created_at: contact.created_at,
          updated_at: contact.updated_at,
          last_activity_at: contact.last_activity_at || contact.last_replied_at,
          lead_status: contact.lead_status,
          lead_status_id: contact.lead_status_id,
          metadata: metadata
        };
      });
      
      setContacts(formattedContacts);
    } catch (error) {
      console.error('Error fetching board contacts:', error);
      toast({
        title: 'Error fetching contacts',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkspacePhoneNumbers = async () => {
    try {
      // Fetch available Twilio numbers
      const { data: numbers, error: numbersError } = await supabase
        .from('twilio_numbers')
        .select('*')
        .eq('is_active', true);
      
      if (numbersError) throw numbersError;
      
      // Store these for potential use with messages
      setWorkspacePhoneNumbers(numbers || []);
    } catch (error) {
      console.error('Error fetching workspace phone numbers:', error);
    }
  };

  const fetchBoardColumns = async () => {
    try {
      setIsLoading(true);
      
      // Fetch columns for this board
      const { data: boardColumns, error: columnsError } = await supabase
        .from('board_columns')
        .select('*')
        .eq('board_id', board.id)
        .order('position', { ascending: true });
      
      if (columnsError) throw columnsError;
      
      if (boardColumns && boardColumns.length > 0) {
        // Map the database columns to our format
        const formattedColumns = boardColumns.map(column => ({
          id: column.id,
          title: column.title,
          icon: column.icon || '📋'
        }));
        setColumns(formattedColumns);
      } else {
        // If no columns exist yet, create default columns
        await createDefaultColumns();
      }
    } catch (error) {
      console.error('Error fetching board columns:', error);
      toast({
        title: 'Error fetching columns',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultColumns = async () => {
    try {
      // Create default columns in the database
      const columnsToCreate = DEFAULT_COLUMNS.map((column, index) => ({
        board_id: board.id,
        title: column.title,
        icon: column.icon,
        position: index,
      }));
      
      const { data: createdColumns, error: createError } = await supabase
        .from('board_columns')
        .insert(columnsToCreate)
        .select();
      
      if (createError) throw createError;
      
      if (createdColumns) {
        // Map the created columns to our format
        const formattedColumns = createdColumns.map(column => ({
          id: column.id,
          title: column.title,
          icon: column.icon
        }));
        setColumns(formattedColumns);
      }
    } catch (error) {
      console.error('Error creating default columns:', error);
      // Fallback to using the default columns in memory only
      setColumns(DEFAULT_COLUMNS);
    }
  };

  // Helper function to calculate relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'unknown time';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `about ${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `about ${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `about ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  };

  // Helper function to match contacts to columns
  const getColumnContacts = (columnId) => {
    if (!columnId) return [];
    
    console.log(`Getting contacts for column: ${columnId}`);
    console.log('All contacts:', contacts);
    
    // Filter contacts that belong to this column
    const columnContacts = filterContacts(contacts).filter(
      contact => contact.columnId === columnId
    );
    
    console.log(`Found ${columnContacts.length} contacts for column ${columnId}`);
    return columnContacts;
  };

  const handleAddColumn = () => {
    onOpen();
  };

  const handleCreateColumn = async () => {
    if (newColumnTitle.trim()) {
      try {
        // Create a new column object
        const newColumn = {
          board_id: board.id,
          title: newColumnTitle.trim(),
          icon: '📋',
          position: columns.length // Add at the end
        };
        
        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const tempColumn = {
          id: tempId,
          title: newColumnTitle.trim(),
          icon: '📋'
        };
        
        setColumns([...columns, tempColumn]);
        setNewColumnTitle('');
        onClose();
        
        // Save to database
        const { data: createdColumn, error } = await supabase
          .from('board_columns')
          .insert(newColumn)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update the columns list with the real ID
        setColumns(prev => 
          prev.map(col => 
            col.id === tempId 
              ? { id: createdColumn.id, title: createdColumn.title, icon: createdColumn.icon } 
              : col
          )
        );
        
        // Log activity
        await boardActivityService.logActivity({
          boardId: board.id,
          workspaceId: board.workspace_id,
          activityType: 'column_added',
          description: `Column "${newColumnTitle.trim()}" added to board`,
          afterState: { column: createdColumn }
        });
        
        toast({
          title: 'Column created',
          status: 'success',
          duration: 2000,
        });
      } catch (error) {
        console.error('Error creating column:', error);
        
        // Revert optimistic update
        setColumns(prev => prev.filter(col => !col.id.startsWith('temp-')));
        
        toast({
          title: 'Error creating column',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // TODO: Implement actual filtering logic
  };

  const handleChat = (contact) => {
    // Find the phone number assigned to this board
    const boardPhoneNumber = board?.phone_number;
    let phoneToUse = boardPhoneNumber;
    
    // If no phone number is assigned to the board, use a workspace phone number
    if (!phoneToUse && workspacePhoneNumbers.length > 0) {
      // Simple round-robin selection (can be replaced with more complex logic)
      const randomIndex = Math.floor(Math.random() * workspacePhoneNumbers.length);
      phoneToUse = workspacePhoneNumbers[randomIndex].phone_number;
    }

    toast({
      title: "Opening chat",
      description: `Starting chat with ${contact.name} using ${phoneToUse || 'default number'}`,
      status: "info",
      duration: 2000,
    });
    
    // You would typically navigate to chat with this contact using the selected phone number
    // navigation.navigate('/chat', { contactId: contact.id, fromNumber: phoneToUse });
    // TODO: Implement chat functionality with proper number assignment
  };

  const handleCall = (contact) => {
    // Find the phone number assigned to this board
    const boardPhoneNumber = board?.phone_number;
    let phoneToUse = boardPhoneNumber;
    
    // If no phone number is assigned to the board, use a workspace phone number
    if (!phoneToUse && workspacePhoneNumbers.length > 0) {
      // Simple round-robin selection (can be replaced with more complex logic)
      const randomIndex = Math.floor(Math.random() * workspacePhoneNumbers.length);
      phoneToUse = workspacePhoneNumbers[randomIndex].phone_number;
    }

    toast({
      title: "Starting call",
      description: `Calling ${contact.name} from ${phoneToUse || 'default number'}`,
      status: "info",
      duration: 2000,
    });
    // TODO: Implement call functionality with proper number assignment
  };

  const handleDeleteColumn = async (columnId) => {
    if (!columnId) return;
    
    // Optimistic UI update - remove the column immediately
    setColumns(prev => prev.filter(col => col.id !== columnId));
    
    try {
      // Send request to server
      const { error } = await supabase
        .from('board_columns')
        .delete()
        .eq('id', columnId);
      
      if (error) {
        throw error;
      }
      
      // Log activity
      if (board?.id && board?.workspace_id) {
        await boardActivityService.logActivity({
          boardId: board.id,
          workspaceId: board.workspace_id,
          activityType: 'column_deleted',
          description: `Column deleted from board`,
          beforeState: { columnId }
        });
      }
      
      toast({
        title: 'Column deleted',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting column:', error);
      
      // Revert optimistic update by refetching columns
      await fetchBoardColumns();
      
      toast({
        title: 'Error deleting column',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleMoveContact = async (contactId, fromColumnId, toColumnId, toBoardId = null) => {
    try {
      if (toBoardId && toBoardId !== board.id) {
        // Moving to a different board
        console.log('Moving contact between boards:', { contactId, fromBoardId: board.id, toBoardId, toColumnId });
        
        // Remove contact from current board's state immediately to prevent duplicates
        setContacts(prevContacts => 
          prevContacts.filter(contact => contact.id !== contactId)
        );
        
        // Perform the move operation
        await moveContactToBoard(contactId, board.id, toBoardId, toColumnId);
        
        // Log activity
        if (board?.id && board?.workspace_id) {
          await boardActivityService.logActivity({
            boardId: board.id,
            workspaceId: board.workspace_id,
            activityType: 'contact_moved_to_board',
            description: `Contact moved to board ${toBoardId}`,
            beforeState: { contactId, fromBoardId: board.id, fromColumnId },
            afterState: { contactId, toBoardId, toColumnId }
          });
        }
        
        // Dispatch refresh events for both source and target boards
        // This ensures both boards update their state
        window.dispatchEvent(new CustomEvent('board:refresh', { 
          detail: { boardId: toBoardId }
        }));
        window.dispatchEvent(new CustomEvent('board:refresh', { 
          detail: { boardId: board.id }
        }));
        
        // Fetch contacts again for the current board to ensure state is in sync
        await fetchBoardContacts();
        
        toast({
          title: 'Contact moved to board',
          status: 'success',
          duration: 2000,
        });
        return;
      }
      
      // Moving within the same board
      console.log('Moving contact within board:', { contactId, fromColumnId, toColumnId });
      
      // Update local state immediately
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === contactId 
            ? { ...contact, columnId: toColumnId } 
            : contact
        )
      );
      
      // Get current metadata
      const { data: currentContact, error: fetchError } = await supabase
        .from('board_contacts')
        .select('metadata')
        .eq('contact_id', contactId)
        .eq('board_id', board.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update metadata
      const updatedMetadata = {
        ...(currentContact?.metadata || {}),
        column_id: toColumnId,
        last_updated: new Date().toISOString()
      };
      
      // Update database
      const { error } = await supabase
        .from('board_contacts')
        .update({ 
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('contact_id', contactId)
        .eq('board_id', board.id);
      
      if (error) throw error;
      
      // Log activity
      if (board?.id && board?.workspace_id) {
        await boardActivityService.logActivity({
          boardId: board.id,
          workspaceId: board.workspace_id,
          activityType: 'contact_moved',
          description: `Contact moved from ${fromColumnId} to ${toColumnId}`,
          beforeState: { contactId, fromColumnId },
          afterState: { contactId, toColumnId }
        });
      }
      
      // No need to refresh the board since we've already updated the state
      
      toast({
        title: 'Contact moved',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error moving contact:', error);
      // Revert optimistic updates on error
      if (toBoardId && toBoardId !== board.id) {
        await fetchBoardContacts(); // Refresh source board state
      }
      toast({
        title: 'Error moving contact',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleContactAdded = (newContact) => {
    // Add the new contact to the state
    setContacts(prevContacts => [...prevContacts, {
      id: newContact.id,
      name: newContact.name || newContact.phone_number,
      timestamp: getRelativeTime(newContact.created_at),
      message: newContact.notes || 'No message',
      assignedTo: newContact.assigned_to || 'UNASSIGNED',
      avatar: newContact.avatar || '',
      columnId: newContact.columnId,
      boardId: board.id,
      phone_number: newContact.phone_number,
      created_at: newContact.created_at,
      updated_at: newContact.updated_at,
      last_activity_at: newContact.last_activity_at || newContact.created_at,
      lead_status: newContact.lead_status || 'New', // Set default lead_status if not provided
      lead_status_id: newContact.lead_status_id, // Include lead_status_id if available
      metadata: newContact.metadata || {}
    }]);

    // Log activity
    if (board?.id && board?.workspace_id) {
      boardActivityService.logActivity({
        boardId: board.id,
        workspaceId: board.workspace_id,
        activityType: 'contact_added',
        description: `New contact ${newContact.name} added to ${newContact.columnId}`,
        afterState: { contactId: newContact.id, columnId: newContact.columnId }
      });
    }

    toast({
      title: 'Contact added',
      status: 'success',
      duration: 2000,
    });
  };

  const handleContactUpdated = () => {
    // Refresh the contacts to get the updated data
    fetchBoardContacts();
    
    toast({
      title: 'Contact updated',
      status: 'success',
      duration: 2000,
    });
  };

  const handleContactDeleted = (contactId) => {
    // Remove the contact from the state
    setContacts(prevContacts => prevContacts.filter(contact => contact.id !== contactId));
    
    // Log activity
    if (board?.id && board?.workspace_id) {
      boardActivityService.logActivity({
        boardId: board.id,
        workspaceId: board.workspace_id,
        activityType: 'contact_deleted',
        description: `Contact deleted from board`,
        beforeState: { contactId }
      });
    }
    
    toast({
      title: 'Contact deleted',
      status: 'success',
      duration: 2000,
    });
  };

  const handleContactChat = (contact) => {
    // Navigate to the chat page for this contact
    window.location.href = `/livechat/${contact.id}`;
  };

  const handleContactCall = (contact) => {
    // Implement call functionality or show a modal
    toast({
      title: 'Call feature',
      description: `Calling ${contact.name} at ${contact.phone_number}`,
      status: 'info',
      duration: 3000,
    });
  };

  const filterContacts = (contacts) => {
    if (!searchQuery) return contacts;
    
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (isLoading) {
    return (
      <Center h="100%">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }

  return (
    <DragDropProvider onMoveContact={handleMoveContact}>
      <Box h="100%" display="flex" flexDirection="column">
        {/* Board content */}
        <Flex flex="1" overflow="hidden">
          {/* Main content */}
          <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
            {/* Header */}
            <Box bg={bgColor} borderBottom="1px" borderColor={borderColor}>
              <Flex direction="column">
                {/* Filter row */}
                <Flex justify="space-between" align="center" p={4} pb={2}>
                  <HStack spacing={6}>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant={activeFilter === 'all' ? 'solid' : 'ghost'}
                        colorScheme="purple"
                        onClick={() => handleFilterChange('all')}
                      >
                        All Inbox
                      </Button>
                      <Button
                        size="sm"
                        variant={activeFilter === 'unread' ? 'solid' : 'ghost'}
                        colorScheme="orange"
                        onClick={() => handleFilterChange('unread')}
                      >
                        Unread (1)
                      </Button>
                    </HStack>
                  </HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    onClick={handleAddColumn}
                    rightIcon={<AddIcon />}
                  >
                    Add Column
                  </Button>
                </Flex>

                {/* Search row */}
                <Flex px={4} pb={4}>
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                      <Search2Icon color="gray.400" />
                    </InputLeftElement>
                    <Input 
                      placeholder="Search messages, contacts..." 
                      borderRadius="md"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                </Flex>
              </Flex>
            </Box>

            {/* Scrollable columns container */}
            <Box
              flex="1"
              overflowX="auto"
              overflowY="hidden"
              px={4}
              py={2}
              css={{
                '&::-webkit-scrollbar': {
                  width: '10px',
                  height: '10px',
                },
                '&::-webkit-scrollbar-track': {
                  background: scrollbarTrackColor,
                },
                '&::-webkit-scrollbar-thumb': {
                  background: scrollbarThumbColor,
                  borderRadius: '5px',
                },
              }}
            >
              <Flex h="100%" gap={4}>
                {columns.map((column) => (
                  <BoardColumn 
                    key={column.id} 
                    title={column.title} 
                    icon={column.icon} 
                    columnId={column.id}
                    boardId={board.id}
                    onDelete={handleDeleteColumn}
                    onContactAdded={handleContactAdded}
                  >
                    {contacts
                      .filter(contact => contact.columnId === column.id)
                      .map(contact => (
                        <ContactCard 
                          key={contact.id} 
                          contact={contact} 
                          onChat={handleContactChat}
                          onCall={handleContactCall}
                          onContactUpdated={handleContactUpdated}
                          onContactDeleted={handleContactDeleted}
                        />
                      ))
                    }
                  </BoardColumn>
                ))}
              </Flex>
            </Box>

            {/* Filter sidebar */}
            <FilterSidebar 
              isOpen={isSidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
            />
          </Box>
        </Flex>

        {/* Add Column Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add New Column</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>Column Title</FormLabel>
                <Input 
                  placeholder="Enter column title" 
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="purple" onClick={handleCreateColumn}>
                Create Column
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </DragDropProvider>
  );
};

export default SpeedToLeadBoard;
