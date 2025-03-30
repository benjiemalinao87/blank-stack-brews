import React from 'react';
import { Handle } from 'reactflow';
import { Box, Textarea, Text } from '@chakra-ui/react';

const CommentNode = ({ data, isConnectable }) => {
  return (
    <Box p={3} bg="yellow.50" borderRadius="md" boxShadow="sm" border="1px solid" borderColor="yellow.200">
      <Handle
        type="target"
        position="top"
        isConnectable={isConnectable}
      />
      <Text fontSize="sm" fontWeight="bold" mb={2}>Comment</Text>
      <Textarea
        placeholder="Add a note..."
        size="sm"
        rows={3}
        defaultValue={data.comment}
        bg="white"
      />
      <Handle
        type="source"
        position="bottom"
        isConnectable={isConnectable}
      />
    </Box>
  );
};

export default CommentNode;
