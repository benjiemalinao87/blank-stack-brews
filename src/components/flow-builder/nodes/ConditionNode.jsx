import React from 'react';
import { Box, IconButton, Text, useColorModeValue } from '@chakra-ui/react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { GitBranch, X } from 'lucide-react';

const ConditionNode = ({ id, data, isConnectable }) => {
  const { deleteElements } = useReactFlow();
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('green.400', 'green.300');

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      position="relative"
      minW="200px"
    >
      <IconButton
        icon={<X size={14} />}
        size="xs"
        position="absolute"
        top={1}
        right={1}
        variant="ghost"
        colorScheme="gray"
        opacity={0.6}
        _hover={{ opacity: 1, bg: 'red.50', color: 'red.500' }}
        onClick={handleDelete}
        zIndex={10}
        aria-label="Delete node"
      />
      
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      
      <Box display="flex" alignItems="center" mb={2}>
        <Box color={accentColor}>
          <GitBranch size={20} />
        </Box>
        <Text ml={2} fontWeight="medium">Condition</Text>
      </Box>
      
      <Select size="sm" defaultValue={data.condition || "contact_property"}>
        <option value="contact_property">Contact Property</option>
        <option value="message_response">Message Response</option>
        <option value="time_based">Time Based</option>
      </Select>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '25%', background: '#555' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '75%', background: '#555' }}
        isConnectable={isConnectable}
      />
    </Box>
  );
};

export default ConditionNode;
