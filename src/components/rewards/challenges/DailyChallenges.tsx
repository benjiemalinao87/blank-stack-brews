import React, { useState } from 'react';
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
  Icon,
  useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, Star, Check } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  total: number;
  timeLeft: number; // in minutes
  icon: React.ReactNode;
}

const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const isCompleted = challenge.progress >= challenge.total;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        p={4}
        bg={bgColor}
        borderRadius="lg"
        border="2px solid"
        borderColor={isCompleted ? 'green.500' : borderColor}
        position="relative"
        overflow="hidden"
      >
        {isCompleted && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="green.500"
            opacity={0.1}
          />
        )}

        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <Box
                p={2}
                bg={isCompleted ? 'green.500' : 'gray.100'}
                borderRadius="lg"
                color={isCompleted ? 'white' : 'gray.600'}
              >
                {challenge.icon}
              </Box>
              <Text fontWeight="bold">{challenge.title}</Text>
            </HStack>
            <Badge colorScheme={isCompleted ? 'green' : 'blue'}>
              {challenge.reward} XP
            </Badge>
          </HStack>

          <Text fontSize="sm" color="gray.500">
            {challenge.description}
          </Text>

          <VStack spacing={1}>
            <Progress
              value={(challenge.progress / challenge.total) * 100}
              colorScheme={isCompleted ? 'green' : 'blue'}
              size="sm"
              borderRadius="full"
            />
            <HStack spacing={4} justify="space-between" w="full">
              <Text fontSize="xs" color="gray.500">
                {challenge.progress} / {challenge.total}
              </Text>
              <HStack spacing={1}>
                <Clock size={12} />
                <Text fontSize="xs">{challenge.timeLeft}m left</Text>
              </HStack>
            </HStack>
          </VStack>
        </VStack>
      </Box>
    </motion.div>
  );
};

export const DailyChallenges = () => {
  const [challenges] = useState<Challenge[]>([
    {
      id: '1',
      title: 'Quick Responder',
      description: 'Respond to customer inquiries within 1 minute',
      reward: 100,
      progress: 8,
      total: 10,
      timeLeft: 180,
      icon: <Target size={16} />,
    },
    {
      id: '2',
      title: 'Problem Solver',
      description: 'Resolve customer issues without escalation',
      reward: 150,
      progress: 5,
      total: 5,
      timeLeft: 120,
      icon: <Check size={16} />,
    },
    {
      id: '3',
      title: 'Customer Satisfaction',
      description: 'Maintain a 4.5+ star rating',
      reward: 200,
      progress: 4,
      total: 5,
      timeLeft: 240,
      icon: <Star size={16} />,
    },
  ]);

  const toast = useToast();
  const completedChallenges = challenges.filter(c => c.progress >= c.total);

  const handleClaimRewards = () => {
    const totalReward = completedChallenges.reduce((sum, c) => sum + c.reward, 0);
    
    toast({
      title: 'Rewards Claimed!',
      description: `You've earned ${totalReward} XP from completed challenges!`,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="2xl" fontWeight="bold">Daily Challenges</Text>
        <Button
          size="sm"
          colorScheme="green"
          leftIcon={<Star size={16} />}
          isDisabled={completedChallenges.length === 0}
          onClick={handleClaimRewards}
        >
          Claim Rewards ({completedChallenges.length})
        </Button>
      </HStack>

      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        <AnimatePresence>
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </AnimatePresence>
      </Grid>
    </VStack>
  );
}; 