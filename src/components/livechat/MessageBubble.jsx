import React from 'react';
import { Box, Text, Flex, useColorModeValue } from '@chakra-ui/react';
import { MessageStatus } from './MessageStatus';
import ErrorBoundary from '../common/ErrorBoundary';

/**
 * Component for displaying a message bubble
 * @param {Object} props
 * @param {Object} props.message - Message object
 * @param {boolean} props.isFirst - Whether this is the first message in a group
 * @param {boolean} props.isLast - Whether this is the last message in a group
 */
export const MessageBubble = ({ message, isFirst, isLast }) => {
  const textColor = useColorModeValue('black', 'white');
  
  // iMessage-style colors
  const outboundBg = useColorModeValue('blue.500', 'blue.600');
  const inboundBg = useColorModeValue('gray.100', 'gray.700');
  const outboundColor = 'white';
  const inboundColor = textColor;

  const isOutbound = message.direction === 'outbound';

  return (
    <ErrorBoundary errorMessage="Error displaying message">
      <Box 
        display="flex"
        flexDirection="column"
        width="fit-content"
        alignSelf={isOutbound ? 'flex-end' : 'flex-start'}
        mb={2}
      >
        <Box
          bg={isOutbound ? outboundBg : inboundBg}
          color={isOutbound ? outboundColor : inboundColor}
          px={4}
          py={2}
          borderRadius="lg"
          borderTopRightRadius={isOutbound ? (isFirst ? 'lg' : 'lg') : 'lg'}
          borderTopLeftRadius={isOutbound ? 'lg' : (isFirst ? 'lg' : 'lg')}
          borderBottomRightRadius={isOutbound ? (isLast ? 'sm' : 'lg') : 'lg'}
          borderBottomLeftRadius={isOutbound ? 'lg' : (isLast ? 'sm' : 'lg')}
          boxShadow="sm"
          _hover={{
            boxShadow: 'md',
          }}
        >
          <Text 
            fontSize="md" 
            wordBreak="break-word"
            whiteSpace="pre-wrap"
          >
            {message.body}
          </Text>
        </Box>
        {isLast && (
          <Box
            mt={1}
            display="flex"
            justifyContent={isOutbound ? 'flex-end' : 'flex-start'}
            width="100%"
          >
            <MessageStatus
              status={message.status}
              timestamp={message.created_at}
              isOutbound={isOutbound}
            />
          </Box>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default MessageBubble; 