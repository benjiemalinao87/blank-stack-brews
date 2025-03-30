import React, { useState, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  Collapse,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { ChevronDownIcon, Search2Icon, DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { useDrop } from 'react-dnd';
import { useDragDrop } from '../context/DragDropContext';
import ContactForm from './ContactForm';

const BoardColumn = ({ title, icon, columnId, boardId, children, onDelete, onContactAdded }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isContactFormOpen, 
    onOpen: onContactFormOpen, 
    onClose: onContactFormClose 
  } = useDisclosure();
  const cancelRef = React.useRef();
  const { moveContact, isDragging } = useDragDrop();
  const columnRef = useRef(null);

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const scrollbarThumbColor = useColorModeValue('gray.400', 'gray.600');
  const scrollbarTrackColor = useColorModeValue('gray.100', 'gray.700');
  const badgeBg = useColorModeValue('gray.100', 'gray.600');
  const dropTargetBg = useColorModeValue('blue.50', 'blue.900');

  // Set up drop target
  const [{ isOver }, drop] = useDrop({
    accept: 'CONTACT',
    drop: (item) => {
      console.log('Drop event:', { item, columnId, boardId });
      
      // Check if this is a cross-board move
      if (item.boardId && item.boardId !== boardId) {
        console.log('Cross-board move detected');
        // Move the contact to this board and column
        moveContact(item.id, item.columnId, columnId, boardId);
        
        // Return the target information to prevent duplicate handling
        return { handled: true, columnId, boardId };
      } else if (!item.handled) {
        console.log('Same board move detected');
        // Only move within the same board if not already handled
        moveContact(item.id, item.columnId, columnId);
        return { handled: true, columnId };
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Connect the drop ref to our component
  drop(columnRef);

  // Count the number of children
  const childCount = React.Children.count(children);

  const handleDeleteClick = () => {
    onOpen();
  };

  const confirmDelete = () => {
    onClose();
    if (onDelete) {
      onDelete(columnId);
    }
  };

  const handleContactAdded = (newContact) => {
    if (onContactAdded) {
      onContactAdded(newContact);
    }
    onContactFormClose();
  };

  return (
    <Box
      w="320px"
      h="100%"
      bg={isOver ? dropTargetBg : bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={isOver ? 'blue.400' : borderColor}
      flexShrink={0}
      transition="all 0.2s"
      ref={columnRef}
    >
      {/* Column header */}
      <Box borderBottom="1px" borderColor={borderColor}>
        <Flex p={4} align="center">
          <Flex flex="1" align="center" gap={2}>
            <Text>{icon}</Text>
            <Text fontWeight="medium">{title}</Text>
            <Badge bg={badgeBg} borderRadius="full" px={2}>
              {childCount}
            </Badge>
          </Flex>
          <Flex gap={2}>
            <Tooltip label="Add new contact">
              <IconButton
                aria-label="Add contact"
                icon={<AddIcon />}
                size="xs"
                variant="ghost"
                onClick={onContactFormOpen}
              />
            </Tooltip>
            <IconButton
              aria-label="Search"
              icon={<Search2Icon />}
              size="xs"
              variant="ghost"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            />
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<ChevronDownIcon />}
                size="xs"
                variant="ghost"
              />
              <MenuList>
                <MenuItem icon={<EditIcon />}>Edit column</MenuItem>
                <MenuItem icon={<DeleteIcon />} color="red.500" onClick={handleDeleteClick}>
                  Delete column
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
        <Collapse in={isSearchOpen}>
          <Box px={4} pb={4}>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <Search2Icon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="md"
              />
            </InputGroup>
          </Box>
        </Collapse>
      </Box>

      {/* Column content */}
      <Box
        p={2}
        h={isSearchOpen ? "calc(100% - 116px)" : "calc(100% - 72px)"}
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: scrollbarTrackColor,
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: scrollbarThumbColor,
            borderRadius: '4px',
          },
        }}
      >
        {/* Show a placeholder when the column is empty and being dragged over */}
        {isOver && childCount === 0 && (
          <Box 
            p={4} 
            borderRadius="md" 
            borderWidth="2px" 
            borderStyle="dashed" 
            borderColor="blue.400"
            bg="blue.50"
            textAlign="center"
            color="blue.600"
          >
            Drop contact here
          </Box>
        )}
        
        {/* Show "Add contact" button when column is empty */}
        {!isOver && childCount === 0 && (
          <Box 
            p={4} 
            borderRadius="md" 
            borderWidth="2px" 
            borderStyle="dashed" 
            borderColor="gray.300"
            textAlign="center"
            cursor="pointer"
            _hover={{ bg: "gray.50" }}
            onClick={onContactFormOpen}
          >
            <AddIcon mb={2} />
            <Text>Add a contact</Text>
          </Box>
        )}
        
        {React.Children.map(children, child => {
          if (!searchQuery) return child;
          
          // Clone the child and pass the searchQuery
          return React.cloneElement(child, {
            style: {
              display: child.props.contact?.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      child.props.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
                      ? 'block' : 'none'
            }
          });
        })}
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Column
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete the "{title}" column? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* Contact Form Modal */}
      <ContactForm
        isOpen={isContactFormOpen}
        onClose={onContactFormClose}
        columnId={columnId}
        boardId={boardId}
        onContactAdded={handleContactAdded}
      />
    </Box>
  );
};

export default BoardColumn;
