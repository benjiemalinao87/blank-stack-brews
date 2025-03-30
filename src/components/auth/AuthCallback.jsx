import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseUnified';
import logger from '../../utils/logger';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Error in auth callback:', error);
          throw error;
        }

        if (session) {
          logger.info('Successfully authenticated user');
          // Navigate to the home page or the page they were trying to access
          navigate('/', { replace: true });
        } else {
          logger.warn('No session found in auth callback');
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        logger.error('Unexpected error in auth callback:', error);
        navigate('/auth', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text fontSize="lg">Completing authentication...</Text>
      </VStack>
    </Box>
  );
};
