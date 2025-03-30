import React, { useState } from 'react';
import {
  Box,
  Text,
  HStack,
  Flex,
  IconButton,
  useColorModeValue,
  Tooltip,
  Input,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Avatar,
} from '@chakra-ui/react';
import { 
  AddIcon, 
  SearchIcon, 
  ChevronDownIcon, 
  SettingsIcon 
} from '@chakra-ui/icons';
import BoardColumn from '../components/BoardColumn';
import FilterSidebar from '../components/FilterSidebar';

const SpeedToLeadBoard = ({ board }) => {
  const DEFAULT_COLUMNS = [
    { id: 'inbox', title: 'All Inbox', icon: '📥', unreadCount: 0 },
    { id: 'unread', title: 'Unread', icon: '📨', unreadCount: 1 },
  ];

  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const scrollbarThumbColor = useColorModeValue('gray.400', 'gray.600');
  const scrollbarTrackColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box h="100%" bg="gray.50">
      <Flex h="100%" overflow="hidden" direction="column">
        {/* Header */}
        <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} py={2} px={4}>
          <Flex justify="space-between" align="center" mb={2}>
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.600">Phone Number: (603) 913-6903</Text>
            </HStack>
            <HStack spacing={4}>
              <Avatar size="sm" />
              <IconButton
                icon={<SettingsIcon />}
                variant="ghost"
                size="sm"
                aria-label="Settings"
              />
            </HStack>
          </Flex>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Menu>
                <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />} variant="ghost">
                  All Inbox
                </MenuButton>
                <MenuList>
                  <MenuItem>All Inbox</MenuItem>
                  <MenuItem>Unread (0)</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
            <HStack spacing={4}>
              <InputGroup size="sm" maxW="200px">
                <Input placeholder="Search" />
                <InputRightElement>
                  <SearchIcon color="gray.400" />
                </InputRightElement>
              </InputGroup>
              <Button size="sm" variant="ghost">Filter</Button>
            </HStack>
          </Flex>
        </Box>

        {/* Board Content */}
        <Box flex="1" overflow="hidden">
          <Box
            overflowX="auto"
            overflowY="hidden"
            h="100%"
            css={{
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: scrollbarTrackColor,
              },
              '&::-webkit-scrollbar-thumb': {
                background: scrollbarThumbColor,
                borderRadius: '4px',
              },
            }}
          >
            <Flex p={4} h="100%" gap={4}>
              {columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  title={column.title}
                  icon={column.icon}
                  columnId={column.id}
                  boardId={board?.id}
                  unreadCount={column.unreadCount}
                />
              ))}
            </Flex>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default SpeedToLeadBoard;
