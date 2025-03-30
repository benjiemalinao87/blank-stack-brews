import React from 'react';
import { Button as ChakraButton } from '@chakra-ui/react';

export const Button = ({ 
  children, 
  variant = 'solid',
  colorScheme = 'blue',
  size = 'md',
  ...props 
}) => {
  return (
    <ChakraButton
      variant={variant}
      colorScheme={colorScheme}
      size={size}
      display="flex"
      alignItems="center"
      {...props}
    >
      {children}
    </ChakraButton>
  );
};
