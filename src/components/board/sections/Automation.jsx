import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

const Automation = () => {
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="xl" fontWeight="semibold">
          Automation
        </Text>
        <Text color="gray.600">
          Automation features coming soon...
        </Text>
      </VStack>
    </Box>
  );
};

export default Automation;
