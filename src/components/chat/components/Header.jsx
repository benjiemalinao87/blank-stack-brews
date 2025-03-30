import React from 'react';
import { Box, Flex, Text, Avatar, IconButton, useColorModeValue } from '@chakra-ui/react';
import { MinusIcon, CloseIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';

const Header = ({ contact, onClose }) => {
  const lastContactedDate = contact?.last_contacted_at 
    ? new Date(contact.last_contacted_at) 
    : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 1 day ago if not available
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
  const badgeBgColor = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Box 
      bg={bgColor}
      p={3} 
      borderBottom="1px solid" 
      borderColor={borderColor}
      borderTopRadius="xl" 
      cursor="move"
    >
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={3}>
          <Avatar size="xs" name={contact?.name || 'Contact'} />
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {contact?.name || 'Contact'}
            <Text 
              as="span" 
              fontSize="2xs" 
              color={secondaryTextColor}
              ml={2} 
              bg={badgeBgColor}
              px={1.5} 
              py={0.5} 
              borderRadius="sm"
            >
              {format(lastContactedDate, 'MMM d')}
            </Text>
          </Text>
        </Flex>
        <Flex gap={1}>
          <IconButton 
            aria-label="Minimize chat" 
            icon={<MinusIcon size={16} />} 
            size="sm" 
            variant="ghost" 
          />
          <IconButton 
            aria-label="Close chat" 
            icon={<CloseIcon size={16} />} 
            size="sm" 
            variant="ghost" 
            onClick={onClose}
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
