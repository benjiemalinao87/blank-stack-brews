import React from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChatIcon } from '@chakra-ui/icons';
import { formatDistanceToNow } from 'date-fns';

const BoardCard = ({
  contactName,
  timestamp,
  agentName,
  messagePreview,
  avatar,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const formattedTime = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <Box
      bg={bgColor}
      p={3}
      borderRadius="md"
      border="1px"
      borderColor={borderColor}
      _hover={{
        bg: hoverBg,
        transform: 'translateY(-1px)',
        boxShadow: 'sm',
      }}
      transition="all 0.2s"
      cursor="pointer"
      role="group"
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Flex align="center" gap={2}>
          <Avatar size="sm" src={avatar} name={contactName} />
          <Box>
            <Text fontWeight="medium" fontSize="sm">
              {contactName}
            </Text>
            <Text fontSize="xs" color={textColor}>
              {formattedTime}
            </Text>
          </Box>
        </Flex>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<ChevronDownIcon />}
            variant="ghost"
            size="sm"
            opacity="0"
            _groupHover={{ opacity: 1 }}
          />
          <MenuList>
            <MenuItem icon={<ChatIcon />}>
              Quick Reply
            </MenuItem>
            <MenuItem>Assign To...</MenuItem>
            <MenuItem>Move To...</MenuItem>
            <MenuItem>Mark as Done</MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <Text fontSize="sm" color={textColor} noOfLines={2} mb={2}>
        {messagePreview}
      </Text>

      <Flex justify="space-between" align="center">
        <Badge
          size="sm"
          colorScheme="blue"
          variant="subtle"
          borderRadius="full"
          px={2}
        >
          {agentName}
        </Badge>
      </Flex>
    </Box>
  );
};

export default BoardCard;
