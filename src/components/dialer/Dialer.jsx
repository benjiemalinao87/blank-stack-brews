import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  useColorModeValue,
  IconButton,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { Phone, X, Mic, Volume2, Plus } from 'lucide-react';

export const Dialer = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recentCalls, setRecentCalls] = useState([
    { number: '+1234567890', time: '2m ago', type: 'outgoing' },
    { number: '+1987654321', time: '1h ago', type: 'missed' },
    { number: '+1122334455', time: '3h ago', type: 'incoming' },
  ]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const buttonBg = useColorModeValue('gray.100', 'gray.700');
  const buttonHoverBg = useColorModeValue('gray.200', 'gray.600');

  const handleNumberClick = (num) => {
    setPhoneNumber(prev => prev + num);
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber) {
      setRecentCalls(prev => [{
        number: phoneNumber,
        time: 'Just now',
        type: 'outgoing'
      }, ...prev]);
      // Implement call functionality here
      setPhoneNumber('');
    }
  };

  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  return (
    <VStack 
      h="calc(100% - 40px)" 
      p={4} 
      spacing={4}
      align="stretch"
      overflow="hidden"
    >
      {/* Phone Number Input */}
      <HStack>
        <Input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          size="lg"
          textAlign="center"
          fontSize="2xl"
        />
        <IconButton
          icon={<X />}
          onClick={handleDelete}
          variant="ghost"
          isDisabled={!phoneNumber}
        />
      </HStack>

      {/* Dial Pad */}
      <VStack spacing={3}>
        {dialPad.map((row, i) => (
          <HStack key={i} spacing={4} justify="center">
            {row.map(num => (
              <Button
                key={num}
                size="lg"
                h="55px"
                w="55px"
                fontSize="xl"
                onClick={() => handleNumberClick(num)}
                bg={buttonBg}
                _hover={{ bg: buttonHoverBg }}
              >
                {num}
              </Button>
            ))}
          </HStack>
        ))}
      </VStack>

      {/* Call Controls */}
      <HStack justify="center" spacing={4}>
        <IconButton
          icon={<Mic />}
          colorScheme="blue"
          variant="outline"
          rounded="full"
          size="lg"
        />
        <IconButton
          icon={<Phone />}
          colorScheme="green"
          size="lg"
          rounded="full"
          onClick={handleCall}
          isDisabled={!phoneNumber}
        />
        <IconButton
          icon={<Volume2 />}
          colorScheme="blue"
          variant="outline"
          rounded="full"
          size="lg"
        />
      </HStack>

      <Divider />

      {/* Recent Calls */}
      <Box flex={1} overflowY="auto">
        <Text fontSize="lg" fontWeight="bold" mb={3}>
          Recent Calls
        </Text>
        <VStack align="stretch" spacing={2}>
          {recentCalls.map((call, index) => (
            <HStack
              key={index}
              p={2}
              borderRadius="md"
              _hover={{ bg: buttonBg }}
              cursor="pointer"
            >
              <Box flex={1}>
                <Text fontWeight="medium">{call.number}</Text>
                <Text fontSize="sm" color="gray.500">
                  {call.time}
                </Text>
              </Box>
              <Badge
                colorScheme={
                  call.type === 'missed' ? 'red' :
                  call.type === 'incoming' ? 'green' : 'blue'
                }
              >
                {call.type}
              </Badge>
              <IconButton
                icon={<Plus />}
                variant="ghost"
                size="sm"
                aria-label="Add to contacts"
              />
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}; 