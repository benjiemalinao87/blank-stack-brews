import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import { format } from 'date-fns';

const ChatBubble = ({ message, timestamp, isUser }) => {
  // Color mode values
  const userBubbleBg = useColorModeValue('blue.500', 'blue.600');
  const otherBubbleBg = useColorModeValue('gray.100', 'gray.700');
  const otherTextColor = useColorModeValue('black', 'white');
  const userTimeColor = useColorModeValue('whiteAlpha.700', 'whiteAlpha.800');
  const otherTimeColor = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <Box 
      display="flex" 
      justifyContent={isUser ? "flex-end" : "flex-start"} 
      mb={2}
    >
      <Box 
        maxW="80%" 
        bg={isUser ? userBubbleBg : otherBubbleBg} 
        color={isUser ? "white" : otherTextColor} 
        px={3} 
        py={2} 
        borderRadius="xl" 
        fontSize="sm"
      >
        <Text fontSize="sm">{message}</Text>
        <Text 
          fontSize="xs" 
          color={isUser ? userTimeColor : otherTimeColor} 
          mt={0.5}
        >
          {format(timestamp, 'h:mm a')}
        </Text>
      </Box>
    </Box>
  );
};

export default ChatBubble;
