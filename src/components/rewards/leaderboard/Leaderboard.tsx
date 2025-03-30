import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Avatar,
  Grid,
  useColorModeValue,
  Select,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, TrendingUp, Medal } from 'lucide-react';
import { LEADERBOARD_CATEGORIES } from '../constants';
import { leaderboardEntryAnimation } from '../utils/animations';
import { LeaderboardEntry } from '../types';

const LeaderboardRow = ({ entry, rank, metrics }: { 
  entry: LeaderboardEntry; 
  rank: number;
  metrics: string[];
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const isTopThree = rank <= 3;

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return '#CD7F32'; // bronze
      default: return 'gray.500';
    }
  };

  return (
    <motion.div
      {...leaderboardEntryAnimation}
      custom={rank}
      layout
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
        <HStack spacing={4}>
          <Box position="relative">
            {isTopThree && (
              <Box
                position="absolute"
                top="-2"
                left="-2"
                w="6"
                h="6"
                bg={getRankColor(rank)}
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                shadow="md"
              >
                <Trophy size={12} color="white" />
              </Box>
            )}
            <Avatar 
              size="md" 
              name={entry.agentName} 
              src={entry.avatar}
              border="2px solid"
              borderColor={getRankColor(rank)}
            />
          </Box>
          
          <VStack align="start" flex={1}>
            <Text fontWeight="bold">{entry.agentName}</Text>
            <HStack spacing={4}>
              {metrics.map((metric, idx) => (
                <HStack key={idx} spacing={1}>
                  <Text fontSize="sm" color="gray.500">{metric}:</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {entry.details[metric.toLowerCase().replace(' ', '_')]}
                  </Text>
                </HStack>
              ))}
            </HStack>
          </VStack>

          <Badge
            colorScheme={entry.metrics.change >= 0 ? 'green' : 'red'}
            display="flex"
            alignItems="center"
            px={2}
            py={1}
          >
            <TrendingUp size={12} style={{ marginRight: '4px' }} />
            {entry.metrics.change >= 0 ? '+' : ''}{entry.metrics.change}%
          </Badge>
        </HStack>
      </Box>
    </motion.div>
  );
};

export const Leaderboard = () => {
  const [selectedCategory, setSelectedCategory] = useState(LEADERBOARD_CATEGORIES[0].id);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const currentCategory = LEADERBOARD_CATEGORIES.find(cat => cat.id === selectedCategory);

  // Mock data - replace with real data
  const mockEntries: LeaderboardEntry[] = [
    {
      agentId: '1',
      agentName: 'John Doe',
      avatar: '',
      metrics: { value: 95, change: 15, rank: 1 },
      details: {
        total_calls: 150,
        success_rate: '95%',
        avg_duration: '5m',
      }
    },
    {
      agentId: '2',
      agentName: 'Jane Smith',
      avatar: '',
      metrics: { value: 88, change: 5, rank: 2 },
      details: {
        total_calls: 130,
        success_rate: '88%',
        avg_duration: '6m',
      }
    },
    {
      agentId: '3',
      agentName: 'Mike Johnson',
      avatar: '',
      metrics: { value: 82, change: -2, rank: 3 },
      details: {
        total_calls: 120,
        success_rate: '82%',
        avg_duration: '7m',
      }
    }
  ];

  return (
    <VStack spacing={6} align="stretch" w="100%">
      <HStack justify="space-between">
        <Text fontSize="2xl" fontWeight="bold">Leaderboard</Text>
        <HStack spacing={4}>
          <Select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            w="150px"
            size="sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
          <Badge display="flex" alignItems="center" px={2} py={1}>
            <Clock size={12} style={{ marginRight: '4px' }} />
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Badge>
        </HStack>
      </HStack>

      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        {LEADERBOARD_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            variant={selectedCategory === category.id ? 'solid' : 'outline'}
            colorScheme="blue"
            size="sm"
            leftIcon={<Medal size={16} />}
          >
            {category.title}
          </Button>
        ))}
      </Grid>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <VStack spacing={4}>
            {mockEntries.map((entry, index) => (
              <LeaderboardRow
                key={entry.agentId}
                entry={entry}
                rank={index + 1}
                metrics={currentCategory?.metrics || []}
              />
            ))}
          </VStack>
        </motion.div>
      </AnimatePresence>
    </VStack>
  );
}; 