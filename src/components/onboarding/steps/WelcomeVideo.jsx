
import React, { useState } from 'react';
import { Box, Button, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { createWorkspace } from '../../../services/workspace';

const WelcomeVideo = ({ onComplete, setIsSubmitting, initialData }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    try {
      setIsLoading(true);
      if (setIsSubmitting) {
        setIsSubmitting(true);
      }

      // Mark video as watched in form data
      const data = { watched_intro: true };
      
      // Trigger onComplete callback which will handle redirection
      if (onComplete) {
        await onComplete(data);
      } else {
        // Fallback direct navigation if no callback provided
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not complete onboarding',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      if (setIsSubmitting) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="center">
        <Heading>Welcome to LiveChat!</Heading>
        <Text>Your workspace is ready to use. Click below to complete the setup.</Text>
        <Button
          colorScheme="purple"
          size="lg"
          onClick={handleFinish}
          isLoading={isLoading}
        >
          Complete Setup
        </Button>
      </VStack>
    </Box>
  );
};

export default WelcomeVideo;
