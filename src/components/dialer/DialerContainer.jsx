import React from 'react';
import {
  Box,
  HStack,
  IconButton,
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { X, Minus, Square } from 'lucide-react';
import Draggable from 'react-draggable';
import { Dialer } from './Dialer';

export const DialerContainer = ({ onClose }) => {
  const bg = useColorModeValue('whiteAlpha.800', 'blackAlpha.700');
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.100');
  const headerBg = useColorModeValue('whiteAlpha.500', 'blackAlpha.400');
  const textColor = useColorModeValue('gray.800', 'white');

  return (
    <Draggable
      handle=".window-handle"
      defaultPosition={{ x: 100, y: 50 }}
      bounds="parent"
    >
      <Box
        position="absolute"
        width="380px"
        height="600px"
        bg={bg}
        borderRadius="lg"
        overflow="hidden"
        boxShadow="xl"
        border="1px solid"
        borderColor={borderColor}
        backdropFilter="blur(10px)"
      >
        {/* Window Title Bar */}
        <HStack
          className="window-handle"
          px={3}
          py={2}
          bg={headerBg}
          cursor="grab"
          justify="space-between"
          userSelect="none"
          borderBottom="1px solid"
          borderColor={borderColor}
          _active={{ cursor: "grabbing" }}
        >
          <HStack spacing={2}>
            <IconButton
              size="xs"
              icon={<X size={12} />}
              isRound
              aria-label="Close"
              bg="red.400"
              _hover={{ bg: 'red.500' }}
              onClick={onClose}
            />
            <IconButton
              size="xs"
              icon={<Minus size={12} />}
              isRound
              aria-label="Minimize"
              bg="yellow.400"
              _hover={{ bg: 'yellow.500' }}
            />
            <IconButton
              size="xs"
              icon={<Square size={12} />}
              isRound
              aria-label="Maximize"
              bg="green.400"
              _hover={{ bg: 'green.500' }}
            />
          </HStack>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            Dialer
          </Text>
          <Box w={70} /> {/* Spacer to center the title */}
        </HStack>

        {/* Dialer Content */}
        <Box height="calc(100% - 40px)" bg={bg}>
          <Dialer />
        </Box>
      </Box>
    </Draggable>
  );
}; 