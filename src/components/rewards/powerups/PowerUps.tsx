import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Grid,
  useColorModeValue,
  Badge,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Star } from 'lucide-react';
import { POWER_UPS } from '../constants';
import { powerUpActivateAnimation } from '../utils/animations';
import { PowerUp as IPowerUp } from '../types';

const PowerUpCard = ({ 
  powerUp,
  onActivate,
  availablePoints,
}: { 
  powerUp: IPowerUp;
  onActivate: (id: string) => void;
  availablePoints: number;
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (powerUp.isActive && powerUp.endTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now >= powerUp.endTime!) {
          setTimeLeft(null);
          clearInterval(interval);
        } else {
          setTimeLeft(Math.ceil((powerUp.endTime! - now) / 1000));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [powerUp.isActive, powerUp.endTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      {...(powerUp.isActive ? powerUpActivateAnimation : {})}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        p={4}
        bg={bgColor}
        borderRadius="lg"
        border="2px solid"
        borderColor={powerUp.isActive ? 'blue.500' : borderColor}
        position="relative"
        overflow="hidden"
      >
        {powerUp.isActive && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blue.500"
            opacity={0.1}
          />
        )}

        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <Box
                p={2}
                bg={powerUp.isActive ? 'blue.500' : 'gray.100'}
                borderRadius="lg"
                color={powerUp.isActive ? 'white' : 'gray.600'}
              >
                {powerUp.icon}
              </Box>
              <Text fontWeight="bold">{powerUp.name}</Text>
            </HStack>
            <Badge colorScheme={powerUp.isActive ? 'green' : 'blue'}>
              {powerUp.cost} pts
            </Badge>
          </HStack>

          <Text fontSize="sm" color="gray.500">
            {powerUp.description}
          </Text>

          {powerUp.isActive && timeLeft !== null && (
            <VStack spacing={1}>
              <Progress
                value={(timeLeft / powerUp.duration) * 100}
                colorScheme="blue"
                size="sm"
                borderRadius="full"
              />
              <HStack spacing={1} justify="center">
                <Clock size={12} />
                <Text fontSize="xs">{formatTime(timeLeft)}</Text>
              </HStack>
            </VStack>
          )}

          <Button
            size="sm"
            colorScheme={powerUp.isActive ? 'green' : 'blue'}
            isDisabled={powerUp.isActive || powerUp.cost > availablePoints}
            onClick={() => onActivate(powerUp.id)}
            leftIcon={<Zap size={16} />}
          >
            {powerUp.isActive ? 'Active' : 'Activate'}
          </Button>
        </VStack>
      </Box>
    </motion.div>
  );
};

export const PowerUps = () => {
  const [availablePoints, setAvailablePoints] = useState(1000); // Mock value
  const [powerUps, setPowerUps] = useState(POWER_UPS);
  const toast = useToast();

  const handleActivate = (id: string) => {
    const powerUp = powerUps.find(p => p.id === id);
    if (!powerUp || powerUp.isActive || powerUp.cost > availablePoints) return;

    setAvailablePoints(prev => prev - powerUp.cost);
    setPowerUps(prev => prev.map(p => 
      p.id === id ? { 
        ...p, 
        isActive: true,
        endTime: Date.now() + p.duration * 1000
      } : p
    ));

    toast({
      title: 'Power-up Activated!',
      description: `${powerUp.name} is now active for ${powerUp.duration / 60} minutes!`,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });

    // Automatically deactivate after duration
    setTimeout(() => {
      setPowerUps(prev => prev.map(p => 
        p.id === id ? { ...p, isActive: false, endTime: undefined } : p
      ));

      toast({
        title: 'Power-up Expired',
        description: `${powerUp.name} has worn off`,
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    }, powerUp.duration * 1000);
  };

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="2xl" fontWeight="bold">Power-ups</Text>
        <HStack>
          <Star size={16} />
          <Text>{availablePoints} Points Available</Text>
        </HStack>
      </HStack>

      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        <AnimatePresence>
          {powerUps.map((powerUp) => (
            <PowerUpCard
              key={powerUp.id}
              powerUp={powerUp}
              onActivate={handleActivate}
              availablePoints={availablePoints}
            />
          ))}
        </AnimatePresence>
      </Grid>
    </VStack>
  );
}; 