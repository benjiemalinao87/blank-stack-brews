import React from 'react';
import { Handle } from 'reactflow';
import { Box, Select, Text, VStack } from '@chakra-ui/react';

const ActionNode = ({ data, isConnectable }) => {
  return (
    <Box p={3} bg="white" borderRadius="md" boxShadow="sm" border="1px solid" borderColor="gray.200">
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
      />
      <VStack spacing={2} align="stretch">
        <Text fontSize="sm" fontWeight="bold">Action</Text>
        <Select size="sm" defaultValue={data.action || "webhook"}>
          <option value="webhook">Webhook</option>
          <option value="email">Send Email</option>
          <option value="tag">Add/Remove Tag</option>
          <option value="custom">Custom Action</option>
        </Select>
      </VStack>
      <Handle
        type="source"
        position="bottom"
        isConnectable={isConnectable}
      />
    </Box>
  );
};

export default ActionNode;
