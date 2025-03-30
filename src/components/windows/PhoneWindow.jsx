import React from 'react';
import {
  Box,
  Text,
  VStack,
  useColorModeValue,
  Circle,
  HStack
} from '@chakra-ui/react';
import {
  Phone,
  Construction
} from 'lucide-react';
import PropTypes from 'prop-types';

const PhoneWindow = ({ onClose }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box 
      h="100%" 
      bg={bgColor} 
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={6}>
        <Circle
          size="80px"
          bg={useColorModeValue('blue.50', 'blue.900')}
          color={accentColor}
          mb={4}
        >
          <Phone size={40} />
        </Circle>
        <Text
          fontSize="3xl"
          fontWeight="bold"
          color={textColor}
        >
          Phone View
        </Text>
        <HStack 
          spacing={2} 
          color={textColor}
          bg={useColorModeValue('gray.50', 'gray.700')}
          px={4}
          py={2}
          rounded="full"
        >
          <Construction size={20} />
          <Text>Coming Soon</Text>
        </HStack>
        <Text
          color={textColor}
          fontSize="sm"
          textAlign="center"
          maxW="md"
          mt={2}
        >
          We're working on bringing you a powerful phone system integration.
          Stay tuned for updates!
        </Text>
      </VStack>
    </Box>
  );
};

PhoneWindow.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default PhoneWindow; 