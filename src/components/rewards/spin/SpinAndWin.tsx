import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Button,
  Text,
  useColorModeValue,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { motion, useAnimation } from 'framer-motion';
import { Star } from 'lucide-react';

interface Reward {
  id: string;
  value: number;
  type: 'xp' | 'points';
  color: string;
  probability: number;
}

const rewards: Reward[] = [
  { id: '1', value: 50, type: 'xp', color: '#4299E1', probability: 0.3 }, // blue
  { id: '2', value: 100, type: 'xp', color: '#48BB78', probability: 0.2 }, // green
  { id: '3', value: 200, type: 'xp', color: '#9F7AEA', probability: 0.1 }, // purple
  { id: '4', value: 25, type: 'points', color: '#ED8936', probability: 0.2 }, // orange
  { id: '5', value: 50, type: 'points', color: '#ECC94B', probability: 0.15 }, // yellow
  { id: '6', value: 100, type: 'points', color: '#F56565', probability: 0.05 }, // red
];

const WHEEL_SIZE = 300;
const SPIN_DURATION = 4;

export const SpinAndWin = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const controls = useAnimation();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    // Check if spin is available from localStorage
    const lastSpinTime = localStorage.getItem('lastSpinTime');
    if (lastSpinTime) {
      const timeElapsed = Date.now() - parseInt(lastSpinTime);
      const hoursElapsed = timeElapsed / (1000 * 60 * 60);
      setCanSpin(hoursElapsed >= 24);
    }
  }, []);

  const spinWheel = async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    
    // Weighted random selection based on probability
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedReward: Reward | undefined;
    
    for (const reward of rewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        selectedReward = reward;
        break;
      }
    }

    if (!selectedReward) {
      selectedReward = rewards[0];
    }

    // Calculate rotation to land on the selected reward
    const rewardIndex = rewards.findIndex(r => r.id === selectedReward.id);
    const segmentAngle = 360 / rewards.length;
    const targetAngle = 360 - (segmentAngle * rewardIndex + segmentAngle / 2);
    const spins = 5; // Number of full rotations
    const finalRotation = spins * 360 + targetAngle + Math.random() * 30 - 15; // Add some randomness

    await controls.start({
      rotate: finalRotation,
      transition: {
        duration: SPIN_DURATION,
        ease: [0.2, 0, 0.2, 1],
      },
    });

    toast({
      title: 'Congratulations! 🎉',
      description: `You won ${selectedReward.value} ${selectedReward.type.toUpperCase()}!`,
      status: 'success',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });

    setIsSpinning(false);
    setCanSpin(false);
    localStorage.setItem('lastSpinTime', Date.now().toString());

    // Reset spin availability after 24 hours
    setTimeout(() => {
      setCanSpin(true);
    }, 24 * 60 * 60 * 1000);
  };

  return (
    <VStack spacing={8} align="center">
      <Text fontSize="2xl" fontWeight="bold">Spin & Win</Text>
      
      <Box position="relative" w={WHEEL_SIZE} h={WHEEL_SIZE}>
        {/* Wheel */}
        <motion.svg
          viewBox="0 0 100 100"
          animate={controls}
          style={{
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)', // Start with first segment at top
          }}
        >
          {rewards.map((reward, index) => {
            const angle = (360 / rewards.length) * index;
            const startAngle = angle * (Math.PI / 180);
            const endAngle = (angle + 360 / rewards.length) * (Math.PI / 180);
            const x1 = 50 + 50 * Math.cos(startAngle);
            const y1 = 50 + 50 * Math.sin(startAngle);
            const x2 = 50 + 50 * Math.cos(endAngle);
            const y2 = 50 + 50 * Math.sin(endAngle);

            return (
              <path
                key={reward.id}
                d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                fill={reward.color}
                stroke="white"
                strokeWidth="0.5"
              />
            );
          })}
        </motion.svg>

        {/* Center pointer */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="20px"
          h="20px"
          bg={bgColor}
          borderRadius="full"
          border="4px solid"
          borderColor="gray.300"
          zIndex={1}
        />
      </Box>

      <Button
        colorScheme="blue"
        size="lg"
        isLoading={isSpinning}
        isDisabled={!canSpin}
        onClick={spinWheel}
        leftIcon={<Star size={20} />}
      >
        {canSpin ? 'Spin Now!' : 'Next spin in 24h'}
      </Button>

      {!canSpin && !isSpinning && (
        <Badge colorScheme="orange">
          Come back tomorrow for another spin!
        </Badge>
      )}
    </VStack>
  );
}; 