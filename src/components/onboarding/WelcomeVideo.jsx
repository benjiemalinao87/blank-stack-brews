import React, { useState } from 'react';
import { Box, Button, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import { createWorkspace } from '../../services/workspace';

export const WelcomeVideo = ({ initialData, setCurrentWorkspace }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    try {
      setIsLoading(true);

      // Create the workspace using company info
      const workspace = await createWorkspace(initialData?.company_name || 'My Workspace');

      // Set as current workspace
      setCurrentWorkspace(workspace);

      // Force redirect to main app
      window.location.href = '/';
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="center">
        <Heading>Welcome to LiveChat!</Heading>
        <Text>Your workspace is ready to use.</Text>
        <Button
          colorScheme="purple"
          size="lg"
          onClick={handleFinish}
          isLoading={isLoading}
        >
          Back to Dashboard
        </Button>
      </VStack>
    </Box>
  );
};

export default WelcomeVideo;
