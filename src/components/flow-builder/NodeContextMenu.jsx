import React from 'react';
import {
  VStack,
  Box,
  Text,
  useColorModeValue,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { Copy, Trash2 } from 'lucide-react';

const NodeContextMenu = ({ position, onClose, onDuplicateNode, onDeleteNode }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const dangerColor = useColorModeValue('red.500', 'red.300');

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
      width="180px"
      opacity={0.97} // Slight transparency for Mac OS style
    >
      <VStack spacing={0} align="stretch">
        <Box
          p={2.5}
          cursor="pointer"
          _hover={{ bg: hoverBg }}
          onClick={() => {
            onDuplicateNode();
            onClose();
          }}
          role="menuitem"
          transition="background 0.2s"
        >
          <HStack spacing={3}>
            <Copy size={14} />
            <Text fontSize="sm" color={textColor}>Duplicate</Text>
          </HStack>
        </Box>
        <Divider borderColor={borderColor} opacity={0.6} />
        <Box
          p={2.5}
          cursor="pointer"
          _hover={{ bg: hoverBg }}
          color={dangerColor}
          onClick={() => {
            onDeleteNode();
            onClose();
          }}
          role="menuitem"
          transition="background 0.2s"
        >
          <HStack spacing={3}>
            <Trash2 size={14} />
            <Text fontSize="sm">Delete</Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default NodeContextMenu;
