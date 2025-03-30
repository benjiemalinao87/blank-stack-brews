import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Progress, Badge, Button, useColorModeValue, Grid } from '@chakra-ui/react';
import { Clock, Trophy, Target, Zap, MessageCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const ChallengeCard = ({ title, description, reward, progress, total, timeLeft, icon: Icon }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const progressPercent = (progress / total) * 100;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        p={4}
        bg={bgColor}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
        transition="all 0.2s"
      >
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <HStack>
              <Icon size={20} />
              <Text fontWeight="bold">{title}</Text>
            </HStack>
            <Badge colorScheme="purple">
              {reward}
            </Badge>
          </HStack>
          
          <Text fontSize="sm" color="gray.500">{description}</Text>
          
          <Progress 
            value={progressPercent} 
            colorScheme={progressPercent === 100 ? 'green' : 'blue'} 
            borderRadius="full"
          />
          
          <HStack justify="space-between" fontSize="xs" color="gray.500">
            <Text>{progress}/{total}</Text>
            <HStack>
              <Clock size={12} />
              <Text>{timeLeft}</Text>
            </HStack>
          </HStack>
        </VStack>
      </Box>
    </motion.div>
  );
};

const DailyChallenges = () => {
  const [challenges] = useState([
    {
      title: 'Quick Responder',
      description: 'Respond to 20 messages within 2 minutes',
      reward: '300 XP',
      progress: 12,
      total: 20,
      timeLeft: '4h 30m',
      icon: MessageCircle
    },
    {
      title: 'Lead Generator',
      description: 'Qualify 5 new leads',
      reward: '500 XP',
      progress: 3,
      total: 5,
      timeLeft: '6h 15m',
      icon: Target
    },
    {
      title: 'Perfect Streak',
      description: 'Maintain 100% response rate for 4 hours',
      reward: '400 XP',
      progress: 2,
      total: 4,
      timeLeft: '2h 45m',
      icon: Zap
    },
    {
      title: 'Contact Master',
      description: 'Add detailed info to 10 contacts',
      reward: '250 XP',
      progress: 7,
      total: 10,
      timeLeft: '5h 20m',
      icon: Users
    }
  ]);

  const completedChallenges = challenges.filter(c => c.progress === c.total).length;

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="xl" fontWeight="bold">Daily Challenges</Text>
        <HStack>
          <Trophy size={16} />
          <Text fontSize="sm" color="gray.500">
            {completedChallenges}/{challenges.length} Completed
          </Text>
        </HStack>
      </HStack>

      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        {challenges.map((challenge, index) => (
          <ChallengeCard
            key={index}
            {...challenge}
          />
        ))}
      </Grid>

      {completedChallenges === challenges.length && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button
            colorScheme="green"
            size="lg"
            w="100%"
            leftIcon={<Trophy />}
          >
            Claim All Rewards
          </Button>
        </motion.div>
      )}
    </VStack>
  );
}; 

export { DailyChallenges };