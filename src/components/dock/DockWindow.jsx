import React, { useState } from 'react';
import { Box, IconButton, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { X, Minus, Square } from 'lucide-react';
import Draggable from 'react-draggable';

export const DockWindow = ({ title, onClose, children }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.100', 'gray.700');
  const scrollbarThumbColor = useColorModeValue('gray.400', 'gray.600');

  if (isMinimized) return null;

  return (
    <Draggable
      handle=".window-handle"
      defaultPosition={{x: window.innerWidth/4, y: 50}}
      bounds={{
        left: 0,
        top: 0,
        right: window.innerWidth - 820, // 800px window width + 20px margin
        bottom: window.innerHeight - 620 // 600px window height + 20px margin
      }}
    >
      <Box
        position="absolute"
        width="800px"
        height="600px"
        bg={bgColor}
        borderRadius="lg"
        boxShadow="xl"
        overflow="hidden"
        border="1px solid"
        borderColor={borderColor}
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: scrollbarThumbColor,
            borderRadius: '24px',
          },
        }}
        style={{ cursor: 'auto' }}
      >
        {/* Window Title Bar */}
        <Box
          className="window-handle"
          p={2}
          bg={headerBg}
          borderBottom="1px solid"
          borderColor={borderColor}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          style={{ cursor: 'move' }}
          userSelect="none"
        >
          <HStack spacing={2}>
            <IconButton
              size="sm"
              icon={<X size={12} />}
              colorScheme="red"
              variant="ghost"
              isRound
              onClick={onClose}
            />
            <IconButton
              size="sm"
              icon={<Minus size={12} />}
              colorScheme="yellow"
              variant="ghost"
              isRound
              onClick={() => setIsMinimized(true)}
            />
            <IconButton
              size="sm"
              icon={<Square size={12} />}
              colorScheme="green"
              variant="ghost"
              isRound
            />
          </HStack>
          <Text fontSize="sm" fontWeight="medium">{title}</Text>
          <Box w={70} /> {/* Spacer to center the title */}
        </Box>

        {/* Window Content */}
        <Box h="calc(100% - 45px)" overflow="hidden">
          {children}
        </Box>
      </Box>
    </Draggable>
  );
};

export default DockWindow;
