import React, { useState, useRef, useEffect } from 'react';
import { Box, HStack, IconButton, Text, useColorModeValue } from '@chakra-ui/react';
import { X, Minus, Square } from 'lucide-react';
import Draggable from 'react-draggable';

export const DraggableWindow = ({ 
  title, 
  onClose, 
  children, 
  defaultPosition = { x: 50, y: 50 },
  defaultSize = { width: 800, height: 600 },
  minSize = { width: 400, height: 300 }
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [windowSize, setWindowSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  const containerRef = useRef(null);
  
  // Color mode hooks
  const bgColor = useColorModeValue('whiteAlpha.800', 'blackAlpha.700');
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.100');
  const headerBg = useColorModeValue('whiteAlpha.500', 'blackAlpha.400');
  const scrollbarThumbColor = useColorModeValue('gray.400', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const container = containerRef.current;
      if (!container) return;

      const newWidth = Math.max(
        minSize.width,
        e.clientX - container.getBoundingClientRect().left
      );
      const newHeight = Math.max(
        minSize.height,
        e.clientY - container.getBoundingClientRect().top
      );

      setWindowSize({
        width: newWidth,
        height: newHeight
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minSize.width, minSize.height]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <Draggable 
      handle=".window-handle" 
      bounds={{
        left: 0,
        top: 0,
        right: "parent",
        bottom: "parent"
      }} 
      defaultPosition={defaultPosition}
    >
      <Box
        ref={containerRef}
        position="absolute"
        width={`${windowSize.width}px`}
        height={`${windowSize.height}px`}
        bg={bgColor}
        backdropFilter="blur(10px)"
        borderRadius="lg"
        boxShadow="lg"
        border="1px"
        borderColor={borderColor}
        overflow="hidden"
        transition="height 0.2s"
        style={{
          height: isMinimized ? '45px' : windowSize.height
        }}
      >
        {/* Window Header */}
        <HStack
          className="window-handle"
          px={4}
          h="45px"
          justify="space-between"
          bg={headerBg}
          borderBottom="1px"
          borderColor={borderColor}
          cursor="grab"
          userSelect="none"
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
              onClick={() => setIsMinimized(!isMinimized)}
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
            {title}
          </Text>
          <Box w={70} /> {/* Spacer to center the title */}
        </HStack>

        {/* Window Content */}
        <Box 
          height="calc(100% - 45px)" 
          display={isMinimized ? 'none' : 'block'}
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: scrollbarThumbColor,
              borderRadius: '2px',
            },
          }}
        >
          {children}
        </Box>

        {/* Resize Handle */}
        {!isMinimized && (
          <Box
            position="absolute"
            bottom={2}
            right={2}
            w="20px"
            h="20px"
            cursor="nwse-resize"
            onMouseDown={handleMouseDown}
            borderRadius="full"
            bg="blue.500"
            opacity="0.8"
            _hover={{ opacity: 1 }}
            transition="opacity 0.2s"
            zIndex={1000}
            _before={{
              content: '""',
              position: 'absolute',
              bottom: '6px',
              right: '6px',
              width: '8px',
              height: '2px',
              bg: 'white',
              transform: 'rotate(-45deg)'
            }}
            _after={{
              content: '""',
              position: 'absolute',
              bottom: '9px',
              right: '9px',
              width: '8px',
              height: '2px',
              bg: 'white',
              transform: 'rotate(-45deg)'
            }}
          />
        )}
      </Box>
    </Draggable>
  );
};
