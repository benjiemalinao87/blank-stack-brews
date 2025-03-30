import React from 'react';
import { Box, HStack, VStack, Text, Button } from '@chakra-ui/react';

// Error types for consistent error handling
export const ErrorTypes = {
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  DATABASE: 'DATABASE',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN'
};

// Error messages for different error types
export const ErrorMessages = {
  [ErrorTypes.VALIDATION]: 'Invalid input data',
  [ErrorTypes.NETWORK]: 'Network connection error',
  [ErrorTypes.DATABASE]: 'Database operation failed',
  [ErrorTypes.AUTHENTICATION]: 'Authentication failed',
  [ErrorTypes.AUTHORIZATION]: 'Not authorized',
  [ErrorTypes.NOT_FOUND]: 'Resource not found',
  [ErrorTypes.RATE_LIMIT]: 'Rate limit exceeded',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred'
};

// Error toast component
export const ErrorToast = ({ title, description, onClose }) => {
  return (
    <Box
      bg="red.50"
      border="1px"
      borderColor="red.200"
      rounded="md"
      p={4}
      mb={4}
      role="alert"
    >
      <HStack justify="space-between">
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold">{title}</Text>
          <Text fontSize="sm">{description}</Text>
        </VStack>
        {onClose && (
          <Button
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </HStack>
    </Box>
  );
};

// Error handler function
export const handleError = (error, errorType = ErrorTypes.UNKNOWN) => {
  console.error('Error:', error);
  
  // Get error message based on type
  const message = ErrorMessages[errorType] || ErrorMessages[ErrorTypes.UNKNOWN];
  
  // Return error details
  return {
    type: errorType,
    message,
    details: error.message || 'No additional details available'
  };
};

// Function to determine error type from error object
export const getErrorType = (error) => {
  if (!error) return ErrorTypes.UNKNOWN;

  // Check for specific error conditions
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return ErrorTypes.NETWORK;
  }

  if (error.code === '23505') { // PostgreSQL unique violation
    return ErrorTypes.VALIDATION;
  }

  if (error.status === 401) {
    return ErrorTypes.AUTHENTICATION;
  }

  if (error.status === 403) {
    return ErrorTypes.AUTHORIZATION;
  }

  if (error.status === 404) {
    return ErrorTypes.NOT_FOUND;
  }

  if (error.status === 429) {
    return ErrorTypes.RATE_LIMIT;
  }

  return ErrorTypes.UNKNOWN;
};
