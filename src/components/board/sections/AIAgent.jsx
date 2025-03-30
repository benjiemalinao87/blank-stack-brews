import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

const AIAgent = () => {
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="xl" fontWeight="semibold">
          AI Agent
        </Text>
        <Text color="gray.600">
          AI Agent features coming soon...
        </Text>
      </VStack>
    </Box>
  );
};

export default AIAgent;
