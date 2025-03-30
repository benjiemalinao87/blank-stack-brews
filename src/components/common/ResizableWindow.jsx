import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, IconButton, Text, useColorModeValue } from '@chakra-ui/react';
import { MinusIcon, CloseIcon } from '@chakra-ui/icons';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';

export const ResizableWindow = ({
  children,
  title,
  defaultSize = { width: 600, height: 400 },
  minSize = { width: 300, height: 200 },
  onClose,
}) => {
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Center the window on initial render
    if (windowRef.current && typeof window !== 'undefined') {
      const { width, height } = size;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      windowRef.current.style.transform = `translate(${left}px, ${top}px)`;
    }
  }, []);

  const handleDragStart = () => setIsDragging(true);
  const handleDragStop = () => setIsDragging(false);

  return (
    <Draggable
      handle=".window-header"
      bounds="parent"
      onStart={handleDragStart}
      onStop={handleDragStop}
    >
      <Box
        ref={windowRef}
        position="absolute"
        zIndex={1000}
        boxShadow="xl"
        borderRadius="lg"
        overflow="hidden"
        border="1px"
        borderColor={borderColor}
      >
        <Resizable
          size={size}
          minWidth={minSize.width}
          minHeight={minSize.height}
          onResizeStop={(e, direction, ref, d) => {
            setSize({
              width: size.width + d.width,
              height: size.height + d.height,
            });
          }}
          enable={{
            top: false,
            right: true,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: true,
            bottomLeft: false,
            topLeft: false,
          }}
        >
          <Box
            h="100%"
            bg={bgColor}
            display="flex"
            flexDirection="column"
          >
            {/* Window Header */}
            <Flex
              className="window-header"
              h="32px"
              bg={headerBgColor}
              align="center"
              px={2}
              cursor="move"
              userSelect="none"
              borderBottom="1px"
              borderColor={borderColor}
            >
              {/* Window Controls */}
              <Flex gap={1} mr={4}>
                <IconButton
                  size="xs"
                  icon={<CloseIcon />}
                  isRound
                  colorScheme="red"
                  variant="solid"
                  onClick={onClose}
                  aria-label="Close window"
                />
                <IconButton
                  size="xs"
                  icon={<MinusIcon />}
                  isRound
                  colorScheme="yellow"
                  variant="solid"
                  aria-label="Minimize window"
                />
              </Flex>
              
              {/* Window Title */}
              <Text
                fontSize="sm"
                fontWeight="medium"
                flex="1"
                textAlign="center"
                mr={16} // Balance the window controls
              >
                {title}
              </Text>
            </Flex>

            {/* Window Content */}
            <Box
              flex="1"
              overflow="hidden"
              opacity={isDragging ? 0.6 : 1}
              transition="opacity 0.2s"
            >
              {children}
            </Box>
          </Box>
        </Resizable>
      </Box>
    </Draggable>
  );
};
