import React from 'react';
import { HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { MESSAGE_STATUS } from '../../types/messages';
import ErrorBoundary from '../common/ErrorBoundary';

/**
 * Component for displaying message status and time
 * @param {Object} props
 * @param {string} props.status - Message status
 * @param {string} props.timestamp - Message timestamp
 * @param {boolean} props.isOutbound - Whether the message is outbound
 */
export const MessageStatus = ({ status, timestamp, isOutbound }) => {
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const statusColor = useColorModeValue('blue.400', 'blue.300');

  const getStatusIcon = () => {
    switch (status) {
      case MESSAGE_STATUS.PENDING:
        return '⋯';
      case MESSAGE_STATUS.DELIVERED:
        return '✓';
      case MESSAGE_STATUS.READ:
        return '✓✓';
      case MESSAGE_STATUS.FAILED:
        return '!';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case MESSAGE_STATUS.READ:
        return statusColor;
      case MESSAGE_STATUS.FAILED:
        return 'red.400';
      default:
        return mutedTextColor;
    }
  };

  return (
    <ErrorBoundary errorMessage="Error displaying status">
      <HStack 
        spacing={1} 
        justify={isOutbound ? 'flex-end' : 'flex-start'} 
        mt={1}
        flexDirection="row" 
        flexWrap="nowrap" 
        alignItems="center"
      >
        <Text 
          fontSize="xs" 
          color={mutedTextColor}
          whiteSpace="nowrap" 
          display="inline-block"
        >
          {new Date(timestamp).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </Text>
        {isOutbound && (
          <Text 
            fontSize="xs" 
            color={getStatusColor()}
            ml={1}
          >
            {getStatusIcon()}
          </Text>
        )}
      </HStack>
    </ErrorBoundary>
  );
};

export default MessageStatus; 