import React from 'react';
import {
  VStack,
  Box,
  Text,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { nodeTypes } from './nodes';

const FlowContextMenu = ({ position, onClose, onAddNode }) => {
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  const handleAddNode = (type) => {
    onAddNode(type);
    onClose();
  };

  return (
    <Box
      position="absolute"
      left={position.x}
      top={position.y}
      zIndex={1000}
      bg={bg}
      borderRadius="md"
      boxShadow="lg"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
      width="200px"
    >
      <VStack spacing={0} align="stretch">
        {Object.entries(nodeTypes).map(([type, config]) => (
          <Box
            key={type}
            p={2}
            cursor="pointer"
            _hover={{ bg: hoverBg }}
            onClick={() => handleAddNode(type)}
          >
            <HStack spacing={2}>
              <Box 
                p={1.5} 
                borderRadius="md" 
                bg={config.color}
              >
                <config.icon size={14} color="white" />
              </Box>
              <Text fontSize="sm">{config.label}</Text>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default FlowContextMenu;
