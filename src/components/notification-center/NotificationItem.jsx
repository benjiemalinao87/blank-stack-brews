import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  IconButton, 
  useColorModeValue,
  Avatar,
  Badge,
  Divider
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useNotification, NOTIFICATION_TYPES } from '../../contexts/NotificationContext.jsx';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const NotificationItem = ({ notification }) => {
  const { removeNotification, markAsRead } = useNotification();
  const { id, title, message, type, timestamp, source, icon, read } = notification;
  
  const bgColor = useColorModeValue(
    read ? 'transparent' : 'rgba(237, 242, 247, 0.8)',
    read ? 'transparent' : 'rgba(45, 55, 72, 0.3)'
  );
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Get color scheme based on notification type
  const getColorScheme = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'green';
      case NOTIFICATION_TYPES.WARNING:
        return 'yellow';
      case NOTIFICATION_TYPES.ERROR:
        return 'red';
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'blue';
    }
  };
  
  // Format the timestamp
  const formattedTime = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : '';
  
  const handleClick = () => {
    markAsRead(id);
    // If there's an onClick handler in the notification, call it
    if (notification.onClick) {
      notification.onClick();
    }
  };
  
  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      bg={bgColor}
      _hover={{ bg: hoverBgColor }}
      borderRadius="md"
      mb={2}
      overflow="hidden"
      position="relative"
      cursor="pointer"
    >
      <Flex p={3} alignItems="flex-start">
        {/* Icon or Avatar */}
        <Avatar 
          size="sm" 
          name={source || title} 
          src={icon} 
          bg={`${getColorScheme()}.500`}
          color="white"
          mr={3}
        />
        
        {/* Content */}
        <Box flex="1">
          {/* Source/Title */}
          <Flex justifyContent="space-between" alignItems="center" mb={1}>
            <Text fontWeight="bold" fontSize="sm">
              {source || title}
              {!read && (
                <Badge ml={2} colorScheme={getColorScheme()} borderRadius="full" fontSize="xs">
                  New
                </Badge>
              )}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {formattedTime}
            </Text>
          </Flex>
          
          {/* Title (if source is provided) */}
          {source && title && (
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {title}
            </Text>
          )}
          
          {/* Message */}
          {message && (
            <Text fontSize="sm" noOfLines={2}>
              {message}
            </Text>
          )}
        </Box>
        
        {/* Close button */}
        <IconButton
          aria-label="Remove notification"
          icon={<CloseIcon />}
          size="xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            removeNotification(id);
          }}
          opacity={0}
          _groupHover={{ opacity: 1 }}
          position="absolute"
          top={1}
          right={1}
        />
      </Flex>
    </MotionBox>
  );
};

export default NotificationItem; 