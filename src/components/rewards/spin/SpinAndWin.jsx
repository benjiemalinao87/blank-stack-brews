import React, { useState } from 'react';
import { Box, Button, Text, VStack, HStack, useColorModeValue, Badge, useToast } from '@chakra-ui/react';
import { motion, useAnimation } from 'framer-motion';
import { Gift, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SpinAndWin = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const controls = useAnimation();
  const toast = useToast();
  
  const rewards = [
    { label: '500 XP', color: '#FF6B6B' },
    { label: '100 Points', color: '#4ECDC4' },
    { label: '200 XP', color: '#45B7D1' },
    { label: '50 Points', color: '#96CEB4' },
    { label: '1000 XP', color: '#FFEEAD' },
    { label: '150 Points', color: '#D4A5A5' },
    { label: '300 XP', color: '#9DE0AD' },
    { label: '75 Points', color: '#FF9999' }
  ];

  const spinWheel = async () => {
    if (!canSpin || isSpinning) return;
    setIsSpinning(true);

    // Random number of full rotations (3-5) plus random segment
    const rotations = 3 + Math.random() * 2;
    const randomSegment = Math.floor(Math.random() * rewards.length);
    const finalRotation = rotations * 360 + (randomSegment * (360 / rewards.length));

    await controls.start({
      rotate: [0, finalRotation],
      transition: {
        duration: 4,
        ease: "easeOut"
      }
    });

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Show toast
    toast({
      title: "🎉 You won!",
      description: rewards[randomSegment].label,
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    setIsSpinning(false);
    setCanSpin(false);
  };

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={8}>
        <Text fontSize="xl" fontWeight="bold">Spin & Win</Text>
        <Badge colorScheme="green">READY TO SPIN!</Badge>
      </HStack>

      <VStack spacing={8} align="center">
        <Box position="relative" w="400px" h="400px">
          <motion.div
            animate={controls}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              position: 'relative',
              overflow: 'hidden',
              background: 'conic-gradient(from 0deg, #FF6B6B 0deg 45deg, #4ECDC4 45deg 90deg, #45B7D1 90deg 135deg, #96CEB4 135deg 180deg, #FFEEAD 180deg 225deg, #D4A5A5 225deg 270deg, #9DE0AD 270deg 315deg, #FF9999 315deg 360deg)'
            }}
          >
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="20px"
              h="20px"
              bg="white"
              borderRadius="50%"
              zIndex={2}
            />
          </motion.div>
        </Box>

        <Button
          leftIcon={<Gift />}
          colorScheme="blue"
          size="lg"
          isLoading={isSpinning}
          onClick={spinWheel}
          isDisabled={!canSpin}
        >
          {isSpinning ? "Spinning..." : "Spin Now!"}
        </Button>
      </VStack>
    </Box>
  );
};