import React, { useState, useEffect, useRef } from 'react';
import {
  VStack,
  Button,
  Text,
  Heading,
  Box,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Play } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { updateOnboardingStatus, createOnboardingStatus } from '../../../services/onboarding';
import Confetti from 'react-confetti';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const WelcomeVideo = ({ onComplete, setIsSubmitting }) => {
  const { user } = useAuth();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const toast = useToast();
  const [hasWatched, setHasWatched] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionText, setTransitionText] = useState('Getting your workspace ready...');
  const confettiRef = useRef(null);
  
  // Define window size for confetti
  const [windowDimensions, setWindowDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 800, 
    height: typeof window !== 'undefined' ? window.innerHeight : 600 
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Cleanup confetti after 7 seconds
  useEffect(() => {
    let timer;
    if (showConfetti) {
      timer = setTimeout(() => {
        setShowConfetti(false);
      }, 7000);
    }
    return () => clearTimeout(timer);
  }, [showConfetti]);

  const handleVideoEnd = () => {
    setHasWatched(true);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setIsSubmitting(true);
    setShowConfetti(true);

    try {
      await onComplete({ watched_intro: true });
    } catch (error) {
      console.error('Error calling onComplete from WelcomeVideo:', error);
      toast({
        title: 'Error finishing onboarding',
        description: error.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      setIsSubmitting(false);
      setShowConfetti(false);
    }
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={800}
          colors={['#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C', '#E1BEE7', '#CE93D8']}
          gravity={0.15}
          ref={confettiRef}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, pointerEvents: 'none' }}
        />
      )}
      
      <VStack spacing={6} align="stretch" maxW="600px" mx="auto">
        <VStack spacing={3} align="start">
          <Heading size="lg" color="gray.800" fontWeight="semibold">Welcome, let's get started!</Heading>
          <Text color="gray.600" fontSize="md">
            Welcome to our community! Let's get down to business and help you close deals faster.
          </Text>
        </VStack>

        <Box
          position="relative"
          borderRadius="lg"
          overflow="hidden"
          cursor="pointer"
          onClick={handleVideoEnd}
          bg="gray.100"
          _hover={{ bg: "gray.200" }}
          transition="all 0.2s"
          shadow="sm"
          height="300px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon 
            as={Play} 
            boxSize={16} 
            color="gray.500"
            transition="transform 0.2s"
            _hover={{ transform: 'scale(1.1)' }}
          />
          {hasWatched && (
            <Text
              position="absolute"
              bottom={4}
              right={4}
              color="green.500"
              fontSize="sm"
              fontWeight="medium"
              bg="white"
              px={2}
              py={1}
              borderRadius="full"
              shadow="sm"
            >
              ✓ Ready to start
            </Text>
          )}
        </Box>

        <Button
          colorScheme="purple"
          size="lg"
          onClick={handleComplete}
          width="100%"
          mt={4}
          isLoading={isLoading}
          loadingText="Completing..."
          _hover={{ bg: "purple.600" }}
          _active={{ bg: "purple.700" }}
        >
          Continue to dashboard
        </Button>
      </VStack>
    </>
  );
};

export default WelcomeVideo;
