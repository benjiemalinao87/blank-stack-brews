import React from 'react';
import { Input as ChakraInput } from '@chakra-ui/react';

export const Input = React.forwardRef((props, ref) => {
  return (
    <ChakraInput
      ref={ref}
      variant="filled"
      bg="gray.50"
      borderWidth="1px"
      borderColor="gray.200"
      _hover={{
        bg: 'gray.100'
      }}
      _focus={{
        bg: 'white',
        borderColor: 'blue.500'
      }}
      {...props}
    />
  );
});
