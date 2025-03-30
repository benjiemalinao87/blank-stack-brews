import React from 'react';
import { Handle } from 'reactflow';
import { Box, Input, Select, HStack, Text } from '@chakra-ui/react';

const DelayNode = ({ data, isConnectable }) => {
  return (
    <Box p={3} bg="white" borderRadius="md" boxShadow="sm" border="1px solid" borderColor="gray.200">
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
      />
      <Text fontSize="sm" fontWeight="bold" mb={2}>Delay</Text>
      <HStack spacing={2}>
        <Input
          type="number"
          placeholder="Delay"
          size="sm"
          width="80px"
          defaultValue={data.delay || 1}
        />
        <Select size="sm" defaultValue={data.unit || "minutes"}>
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </Select>
      </HStack>
      <Handle
        type="source"
        position="bottom"
        isConnectable={isConnectable}
      />
    </Box>
  );
};

export default DelayNode;
