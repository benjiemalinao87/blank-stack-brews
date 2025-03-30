import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  useColorModeValue,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
} from '@chakra-ui/react';
import { MoreVertical, MessageCircle } from 'lucide-react';

export const PipelineCard = ({ card, onOpenChat }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const priorityColors = {
    high: 'red',
    medium: 'yellow',
    low: 'green'
  };

  const handleChatClick = (e) => {
    e.stopPropagation(); // Prevent drag from starting
    onOpenChat(card);
  };

  return (
    <Box
      bg={cardBg}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      border="1px solid"
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ boxShadow: 'md' }}
      cursor="grab"
      _active={{ cursor: 'grabbing' }}
      userSelect="none"
    >
      <HStack spacing={3}>
        <Avatar size="sm" name={card.name} />
        
        <VStack align="start" spacing={0} flex={1}>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {card.name}
          </Text>
          <Text fontSize="xs" color={mutedColor}>
            {card.phone}
          </Text>
        </VStack>

        <Menu>
          <MenuButton
            as={IconButton}
            icon={<MoreVertical size={16} />}
            variant="ghost"
            size="sm"
          />
          <MenuList>
            <MenuItem>View Details</MenuItem>
            <MenuItem onClick={handleChatClick}>Start Chat</MenuItem>
            <MenuItem>Edit</MenuItem>
            <MenuItem color="red.500">Remove</MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      <Text fontSize="sm" color={mutedColor} noOfLines={2} my={2} pl={8}>
        {card.lastMessage}
      </Text>

      <HStack justify="space-between" pl={8}>
        <Badge colorScheme={priorityColors[card.priority]} size="sm">
          {card.priority}
        </Badge>
        <HStack spacing={2}>
          <Text fontSize="xs" color={mutedColor}>
            {card.time}
          </Text>
          <Tooltip label="Open Chat">
            <IconButton
              icon={<MessageCircle size={14} />}
              size="xs"
              variant="ghost"
              onClick={handleChatClick}
            />
          </Tooltip>
        </HStack>
      </HStack>
    </Box>
  );
};
