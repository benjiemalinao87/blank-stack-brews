import React, { useState } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

export function PhoneTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);

    try {
      console.log('Sending phone number:', phoneNumber);
      const apiUrl = 'https://cc1.automate8.com';
      
      const response = await axios.post(`${apiUrl}/api/phone-test`, 
        { phoneNumber },
        { headers: { 'Content-Type': 'application/json' }}
      );

      console.log('API Response:', response.data);
      setResponse(response.data);
      
      toast({
        title: "Success",
        description: "Phone number sent successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error:', error.response || error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to send phone number";
      
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setResponse({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4} maxW="400px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <Input
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            pattern="^\+?[1-9]\d{1,14}$"
            title="Please enter a valid phone number in E.164 format (e.g., +1234567890)"
          />
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Sending..."
            width="100%"
          >
            Test Phone Number
          </Button>
          {response && (
            <Box mt={4} p={4} bg="gray.100" borderRadius="md">
              <Text fontWeight="bold">Response:</Text>
              <Text>{JSON.stringify(response, null, 2)}</Text>
            </Box>
          )}
        </VStack>
      </form>
    </Box>
  );
}