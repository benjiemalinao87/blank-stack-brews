import React from 'react';
import {
  Box,
  HStack,
  Avatar,
  Text,
  Badge,
  VStack,
  Flex,
  useColorModeValue,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { 
  MdMarkEmailUnread, 
  MdReply, 
  MdAccessTime, 
  MdWarning 
} from 'react-icons/md';

// Status Dot Component
const StatusDot = ({ color, tooltip }) => {
  return (
    <Tooltip label={tooltip} placement="top" hasArrow>
      <Box
        w="10px"
        h="10px"
        borderRadius="full"
        bg={color}
        boxShadow="0 0 0 2px white"
        position="absolute"
        bottom="0"
        right="0"
        zIndex="1"
      />
    </Tooltip>
  );
};

const ContactListItem = ({ 
  contact, 
  isSelected, 
  lastMessage, 
  onClick,
  style 
}) => {
  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const badgeBg = useColorModeValue('gray.200', 'gray.600');
  
  // Get display name
  const getDisplayName = () => {
    if (contact.firstname || contact.lastname) {
      return `${contact.firstname || ''} ${contact.lastname || ''}`.trim();
    }
    return contact.name || contact.phone_number || 'Unknown Contact';
  };

  // Get message content
  const getMessageContent = () => {
    return lastMessage?.body || lastMessage?.content || '';
  };

  // Get time string in short form
  const getTimeString = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w`;
  };

  // Determine message status indicator
  const getStatusIndicator = () => {
    // If there are unread messages, show green dot
    if ((contact.metadata?.unread_count || 0) > 0) {
      return {
        color: "green.500",
        tooltip: "New unread message",
        icon: MdMarkEmailUnread,
        iconColor: "green.500"
      };
    }
    
    // If last message is from contact (inbound), show blue dot
    if (lastMessage?.direction === 'inbound') {
      return {
        color: "blue.500",
        tooltip: "Replied to your message",
        icon: MdReply,
        iconColor: "blue.500"
      };
    }
    
    // If last message is from agent (outbound), check time
    if (lastMessage?.direction === 'outbound') {
      const messageTime = new Date(lastMessage.created_at || lastMessage.timestamp);
      const now = new Date();
      const hoursSince = (now - messageTime) / (1000 * 60 * 60);
      
      if (hoursSince > 24) {
        return {
          color: "yellow.500",
          tooltip: "Awaiting response (24+ hours)",
          icon: MdWarning,
          iconColor: "yellow.500"
        };
      }
      
      return {
        color: "gray.400",
        tooltip: "Awaiting response",
        icon: MdAccessTime,
        iconColor: "gray.400"
      };
    }
    
    // Default: no indicator
    return null;
  };

  const displayName = getDisplayName();
  const messageContent = getMessageContent();
  const hasUnread = (contact.metadata?.unread_count || 0) > 0;
  const timeString = getTimeString(lastMessage?.created_at || lastMessage?.timestamp || contact.created_at);
  const statusIndicator = getStatusIndicator();

  return (
    <Box
      style={style}
      p={3}
      cursor="pointer"
      bg={isSelected ? selectedBg : 'transparent'}
      _hover={{ bg: isSelected ? selectedBg : hoverBg }}
      onClick={onClick}
      borderBottom="1px solid"
      borderColor={borderColor}
      transition="background-color 0.2s"
      w="100%"
      maxW="100%"
      data-has-unread={hasUnread ? "true" : "false"}
    >
      <HStack spacing={3} align="start" w="100%">
        <Box position="relative">
          <Avatar
            size="md"
            name={displayName}
            src={contact.metadata?.avatar_url}
          />
          {statusIndicator && (
            <StatusDot 
              color={statusIndicator.color} 
              tooltip={statusIndicator.tooltip} 
            />
          )}
        </Box>
        
        <VStack align="stretch" flex={1} spacing={1} minW={0}>
          <Flex justify="space-between" align="center" w="100%">
            <Box flex="1" minW={0} pr={2}>
              <HStack spacing={1}>
                {statusIndicator && statusIndicator.icon && (
                  <Tooltip label={statusIndicator.tooltip} placement="top" hasArrow>
                    <span>
                      <Icon 
                        as={statusIndicator.icon} 
                        color={statusIndicator.iconColor} 
                        boxSize={4} 
                      />
                    </span>
                  </Tooltip>
                )}
                <Text
                  fontWeight={hasUnread ? "700" : "600"}
                  color={textColor}
                  noOfLines={1}
                  fontSize="md"
                >
                  {displayName}
                </Text>
              </HStack>
            </Box>
            <Text
              fontSize="xs"
              color={mutedColor}
              whiteSpace="nowrap"
              flexShrink={0}
            >
              {timeString}
            </Text>
          </Flex>
          
          {messageContent && (
            <Text
              fontSize="sm"
              color={hasUnread ? textColor : mutedColor}
              fontWeight={hasUnread ? "medium" : "normal"}
              noOfLines={1}
              pl={statusIndicator && statusIndicator.icon ? "24px" : "0"}
            >
              {messageContent}
            </Text>
          )}

          {hasUnread && (
            <HStack spacing={2} mt={1} pl={statusIndicator && statusIndicator.icon ? "24px" : "0"}>
              <Badge colorScheme="red" fontSize="xs">
                {contact.metadata?.unread_count} new
              </Badge>
            </HStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

export default ContactListItem;
