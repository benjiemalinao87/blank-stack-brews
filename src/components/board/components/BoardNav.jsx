import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  IconButton,
  Collapse,
  useColorModeValue,
  HStack,
  Divider,
  Input,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Editable,
  EditableInput,
  EditablePreview,
  Tooltip,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
  Flex,
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  SearchIcon, 
  AddIcon,
  EditIcon,
  DeleteIcon,
  DragHandleIcon,
} from '@chakra-ui/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import boardNotificationService from '../../../services/boardNotificationService';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const DeleteBoardDialog = ({ isOpen, onClose, onConfirm }) => {
  const cancelRef = React.useRef();

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader>Delete Board</AlertDialogHeader>
          <AlertDialogBody>
            Are you sure? This action cannot be undone.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={onConfirm} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

const BoardNavItem = ({ board, isActive, onSelect, isExpanded, onToggleExpand, provided, isDragging, unreadCount = 0 }) => {
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.200', 'gray.600');
  const activeColor = 'purple.500';
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');
  const notificationColor = 'blue.500';

  return (
    <Box
      ref={provided.innerRef}
      {...provided.draggableProps}
      bg={isDragging ? bgColor : 'transparent'}
      borderRadius="md"
      mb={2}
      transition="background 0.2s"
    >
      <HStack
        py={2}
        px={3}
        cursor="pointer"
        bg={isActive ? bgColor : 'transparent'}
        color={isActive ? activeColor : 'inherit'}
        borderLeftWidth={isActive ? "2px" : "0"}
        borderLeftColor={activeColor}
        position="relative"
        role="group"
        onClick={() => onSelect(board.id)}
      >
        <Box 
          {...provided.dragHandleProps} 
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          color="gray.500"
        >
          <DragHandleIcon />
        </Box>
        <IconButton
          icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(board.id);
          }}
        />
        <VStack align="flex-start" spacing={0} flex={1}>
          <Flex align="center" width="100%">
            <Text fontSize="sm" fontWeight="medium">
              {board.name}
            </Text>
            {unreadCount > 0 && (
              <Badge 
                ml={2} 
                borderRadius="full" 
                px={2} 
                colorScheme="blue"
                fontSize="xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Flex>
          <Text fontSize="xs" color="gray.500">
            {board.phone_number ? board.phone_number : 'No phone number'}
          </Text>
        </VStack>
      </HStack>

      {isExpanded && (
        <VStack align="stretch" mt={2} ml={6} spacing={1}>
          <HStack
            as="button"
            w="full"
            px={3}
            py={2}
            borderRadius="md"
            _hover={{ bg: buttonHoverBg }}
            onClick={() => onSelect(board.id, 'audience-segment')}
          >
            <Box w={1} h={1} borderRadius="full" bg="green.400" />
            <Text fontSize="sm">Audience Segment</Text>
          </HStack>
          <HStack
            as="button"
            w="full"
            px={3}
            py={2}
            borderRadius="md"
            _hover={{ bg: buttonHoverBg }}
            onClick={() => onSelect(board.id, 'campaign-builder')}
          >
            <Box w={1} h={1} borderRadius="full" bg="blue.400" />
            <Text fontSize="sm">Campaign Builder</Text>
          </HStack>
          <HStack
            as="button"
            w="full"
            px={3}
            py={2}
            borderRadius="md"
            _hover={{ bg: buttonHoverBg }}
            onClick={() => onSelect(board.id, 'automation')}
          >
            <Box w={1} h={1} borderRadius="full" bg="orange.400" />
            <Text fontSize="sm">Automation</Text>
          </HStack>
          <HStack
            as="button"
            w="full"
            px={3}
            py={2}
            borderRadius="md"
            _hover={{ bg: buttonHoverBg }}
            onClick={() => onSelect(board.id, 'ai-agent')}
          >
            <Box w={1} h={1} borderRadius="full" bg="purple.400" />
            <Text fontSize="sm">AI Agent</Text>
          </HStack>
          <HStack
            as="button"
            w="full"
            px={3}
            py={2}
            borderRadius="md"
            _hover={{ bg: buttonHoverBg }}
            onClick={() => onSelect(board.id, 'configure-board')}
          >
            <Box w={1} h={1} borderRadius="full" bg="gray.400" />
            <Text fontSize="sm">Configure Board</Text>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

const NewBoardModal = ({ isOpen, onClose, onCreateBoard }) => {
  const [boardName, setBoardName] = useState('');

  const handleSubmit = () => {
    if (boardName.trim()) {
      onCreateBoard(boardName.trim());
      setBoardName('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Board</ModalHeader>
        <ModalBody>
          <FormControl>
            <FormLabel>Board Name</FormLabel>
            <Input
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Enter board name"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="purple" onClick={handleSubmit}>
            Create Board
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const BoardNav = ({ boards, activeBoard, onBoardSelect, onBoardCreate, onBoardReorder }) => {
  const [expandedBoards, setExpandedBoards] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { currentWorkspace } = useWorkspace();

  // Color mode values
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const activeBg = useColorModeValue('purple.50', 'purple.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.600');
  const searchBg = useColorModeValue('white', 'gray.800');

  // Fetch unread counts when boards change
  useEffect(() => {
    if (boards.length > 0 && currentWorkspace) {
      const fetchUnreadCounts = async () => {
        const counts = await boardNotificationService.getAllBoardUnreadCounts(currentWorkspace.id);
        setUnreadCounts(counts);
      };
      
      fetchUnreadCounts();
      
      // Subscribe to real-time updates
      const unsubscribe = boardNotificationService.subscribeToUnreadCounts(
        (newCounts) => setUnreadCounts(newCounts),
        currentWorkspace.id
      );
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [boards, currentWorkspace]);

  const toggleExpand = (boardId) => {
    setExpandedBoards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boardId)) {
        newSet.delete(boardId);
      } else {
        newSet.add(boardId);
      }
      return newSet;
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    onBoardReorder(sourceIndex, destinationIndex);
  };

  const filteredBoards = boards.filter(board => 
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      w="250px"
      h="100%"
      borderRightWidth="1px"
      borderColor={borderColor}
      bg={bgColor}
      position="relative"
    >
      <VStack h="100%" spacing={0} align="stretch">
        <Box p={4}>
          <Box position="relative">
            <Input
              placeholder="Quick search..."
              size="sm"
              pl={8}
              bg={searchBg}
              borderRadius="md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" pointerEvents="none" color="gray.500">
              <SearchIcon boxSize={3} />
            </Box>
          </Box>
        </Box>
        <Divider />
        <Box flex="1" w="100%" overflowY="auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="boards">
              {(provided) => (
                <VStack
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  spacing={0}
                  align="stretch"
                  divider={<Divider />}
                >
                  {filteredBoards.map((board, index) => {
                    const isExpanded = expandedBoards.has(board.id);
                    const isActive = board.id === activeBoard;
                    
                    return (
                      <Draggable key={board.id} draggableId={board.id} index={index}>
                        {(provided, snapshot) => (
                          <BoardNavItem
                            board={board}
                            isActive={board.id === activeBoard}
                            onSelect={onBoardSelect}
                            isExpanded={expandedBoards.has(board.id)}
                            onToggleExpand={toggleExpand}
                            provided={provided}
                            isDragging={snapshot.isDragging}
                            unreadCount={unreadCounts[board.id] || 0}
                          />
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </VStack>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
        <Divider />
        <Box p={3} w="100%">
          <Button
            leftIcon={<AddIcon />}
            variant="ghost"
            size="sm"
            width="100%"
            onClick={onOpen}
          >
            Add New Board
          </Button>
        </Box>
      </VStack>

      <NewBoardModal
        isOpen={isOpen}
        onClose={onClose}
        onCreateBoard={onBoardCreate}
      />
    </Box>
  );
};

export default BoardNav;
