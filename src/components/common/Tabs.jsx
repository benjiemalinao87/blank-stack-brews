import React from 'react';
import { Box, Flex } from '@chakra-ui/react';

export const Tabs = ({ children }) => {
  return (
    <Flex 
      gap="1px" 
      bg="gray.100" 
      p="1px" 
      rounded="md"
    >
      {children}
    </Flex>
  );
};

export const Tab = ({ children, isActive, onClick }) => {
  return (
    <Box
      flex="1"
      py={2}
      px={4}
      textAlign="center"
      bg={isActive ? 'white' : 'transparent'}
      color={isActive ? 'black' : 'gray.600'}
      cursor="pointer"
      rounded="md"
      transition="all 0.2s"
      _hover={{
        bg: isActive ? 'white' : 'gray.50'
      }}
      onClick={onClick}
    >
      {children}
    </Box>
  );
};
