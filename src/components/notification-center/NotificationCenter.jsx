import React, { useRef, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  IconButton, 
  useColorModeValue,
  VStack,
  Heading,
  Divider,
  Badge,
  Portal
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import NotificationItem from './NotificationItem';
import NotificationCenterHeader from './NotificationCenterHeader';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const NotificationCenter = () => {
  const { 
    notifications, 
    isOpen, 
    unreadCount,
    toggleNotificationCenter, 
    markAllAsRead,
    clearAll
  } = useNotification();
  
  const containerRef = useRef(null);
  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.85)', 'rgba(30, 30, 30, 0.85)');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const scrollThumbColor = useColorModeValue('gray.300', 'gray.600');
  
  // Close notification center when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target) && isOpen) {
        toggleNotificationCenter();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleNotificationCenter]);

  return (
    <Portal>
      <Box 
        position="fixed"
        bottom="20px"
        right="20px"
        zIndex={1000}
      >
        {/* Collapsed button with badge */}
        {!isOpen && (
          <Flex 
            alignItems="center" 
            justifyContent="space-between"
            bg={bgColor}
            backdropFilter="blur(10px)"
            borderRadius="md"
            boxShadow="md"
            border="1px solid"
            borderColor={borderColor}
            p={2}
            cursor="pointer"
            onClick={toggleNotificationCenter}
            _hover={{ bg: hoverBgColor }}
            transition="all 0.2s"
          >
            <Flex alignItems="center">
              <Text fontWeight="medium" mr={2}>Activity</Text>
              {unreadCount > 0 && (
                <Badge colorScheme="purple" borderRadius="full">
                  {unreadCount}
                </Badge>
              )}
            </Flex>
            <ChevronUpIcon />
          </Flex>
        )}

        {/* Expanded notification center */}
        <AnimatePresence>
          {isOpen && (
            <MotionBox
              ref={containerRef}
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              transition={{ duration: 0.2 }}
              bg={bgColor}
              backdropFilter="blur(10px)"
              borderRadius="md"
              boxShadow="lg"
              border="1px solid"
              borderColor={borderColor}
              width="350px"
              maxHeight="500px"
              display="flex"
              flexDirection="column"
              mb={2}
              overflow="hidden"
            >
              {/* Header */}
              <NotificationCenterHeader 
                onClose={toggleNotificationCenter}
                onClearAll={clearAll}
                onMarkAllAsRead={markAllAsRead}
              />
              
              {/* Notification list */}
              <Box 
                overflowY="auto" 
                maxHeight="400px"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: scrollThumbColor,
                    borderRadius: '24px',
                  },
                }}
              >
                {notifications.length === 0 ? (
                  <Flex 
                    justifyContent="center" 
                    alignItems="center" 
                    height="100px"
                    p={4}
                  >
                    <Text color="gray.500">No notifications</Text>
                  </Flex>
                ) : (
                  <VStack spacing={0} align="stretch" p={2}>
                    {notifications.map((notification) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                      />
                    ))}
                  </VStack>
                )}
              </Box>
              
              {/* Footer */}
              <Flex 
                p={2} 
                borderTop="1px solid" 
                borderColor={borderColor}
                justifyContent="center"
              >
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Close notification center"
                  icon={<ChevronDownIcon />}
                  onClick={toggleNotificationCenter}
                />
              </Flex>
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>
    </Portal>
  );
};

export default NotificationCenter;