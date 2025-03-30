
import React, { useState } from 'react';
import { Box, Heading, Flex, Text, Input, Button, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { DraggableWindow } from '../window/DraggableWindow';

const PhoneWindow = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('idle');
  const [callLog, setCallLog] = useState([]);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleCall = () => {
    if (!phoneNumber) return;
    
    setCallStatus('calling');
    
    // Simulate a call
    setTimeout(() => {
      setCallStatus('connected');
      
      // Add to call log
      setCallLog([
        { 
          number: phoneNumber, 
          time: new Date().toLocaleTimeString(), 
          date: new Date().toLocaleDateString(),
          direction: 'outgoing',
          duration: '00:00'
        },
        ...callLog
      ]);
      
      // Simulate call ended after 3 seconds
      setTimeout(() => {
        setCallStatus('idle');
      }, 3000);
    }, 2000);
  };
  
  const handleEndCall = () => {
    setCallStatus('idle');
  };
  
  const handleInputChange = (e) => {
    // Only allow numbers and basic phone formatting characters
    const value = e.target.value.replace(/[^\d\s+()-]/g, '');
    setPhoneNumber(value);
  };
  
  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];
  
  const handleDialPadClick = (digit) => {
    setPhoneNumber(prev => prev + digit);
  };
  
  return (
    <Box h="100%" display="flex" flexDirection="column" bg={bgColor} p={4}>
      <Heading size="md" mb={4}>Phone</Heading>
      
      <Flex flex="1" direction="row">
        {/* Dialer Section */}
        <Box flex="1" borderRight="1px" borderColor={borderColor} pr={4}>
          <VStack spacing={4} align="stretch">
            <Input
              value={phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              size="lg"
              mb={2}
            />
            
            <Box>
              {dialPad.map((row, rowIndex) => (
                <HStack key={rowIndex} justify="center" spacing={4} mb={4}>
                  {row.map(digit => (
                    <Button
                      key={digit}
                      size="lg"
                      height="60px"
                      width="60px"
                      borderRadius="full"
                      onClick={() => handleDialPadClick(digit)}
                    >
                      {digit}
                    </Button>
                  ))}
                </HStack>
              ))}
            </Box>
            
            <HStack justify="center" spacing={4}>
              {callStatus === 'idle' ? (
                <Button 
                  colorScheme="green" 
                  size="lg"
                  borderRadius="full"
                  height="60px"
                  width="60px"
                  onClick={handleCall}
                >
                  Call
                </Button>
              ) : (
                <Button 
                  colorScheme="red" 
                  size="lg"
                  borderRadius="full"
                  height="60px"
                  width="60px"
                  onClick={handleEndCall}
                >
                  End
                </Button>
              )}
            </HStack>
            
            {callStatus !== 'idle' && (
              <Box textAlign="center" mt={2}>
                <Text>{callStatus === 'calling' ? 'Calling...' : 'Connected'}</Text>
              </Box>
            )}
          </VStack>
        </Box>
        
        {/* Call Log Section */}
        <Box flex="1" pl={4}>
          <Heading size="sm" mb={4}>Recent Calls</Heading>
          
          {callLog.length === 0 ? (
            <Text color="gray.500">No recent calls</Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              {callLog.map((call, index) => (
                <Box 
                  key={index} 
                  p={3} 
                  borderWidth="1px" 
                  borderRadius="md"
                  borderColor={borderColor}
                >
                  <Flex justify="space-between">
                    <Text fontWeight="bold">{call.number}</Text>
                    <Text fontSize="sm" color="gray.500">{call.direction}</Text>
                  </Flex>
                  <Flex justify="space-between" mt={1}>
                    <Text fontSize="sm">{call.time}</Text>
                    <Text fontSize="sm">{call.duration}</Text>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default PhoneWindow;
