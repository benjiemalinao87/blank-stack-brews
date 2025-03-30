import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Avatar,
  useColorModeValue,
  Select,
  Flex,
  Heading,
  Divider,
  IconButton,
  Tooltip,
  Progress,
  Tag,
  TagLabel,
  TagLeftIcon,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, Crown, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { LEADERBOARD_CATEGORIES } from '../constants';

const CategoryCard = ({ category, isSelected, onClick }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Box
      as={motion.div}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      cursor="pointer"
      onClick={onClick}
      bg={isSelected ? 'blue.500' : bgColor}
      color={isSelected ? 'white' : 'inherit'}
      p={4}
      borderRadius="xl"
      border="1px solid"
      borderColor={isSelected ? 'blue.600' : borderColor}
      boxShadow={isSelected ? 'lg' : 'sm'}
      transition="all 0.2s"
      w="full"
      maxW="300px"
    >
      <VStack align="start" spacing={2}>
        <HStack spacing={3}>
          {category.id === 'text_champions' ? <MessageSquare size={24} /> : <Phone size={24} />}
          <Heading size="md">{category.title}</Heading>
        </HStack>
        <Text fontSize="sm" color={isSelected ? 'whiteAlpha.800' : 'gray.500'}>
          {category.description}
        </Text>
      </VStack>
    </Box>
  );
};

const LeaderboardRow = ({ entry, rank, category }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'yellow.400';
      case 2: return 'gray.400';
      case 3: return 'orange.400';
      default: return 'gray.500';
    }
  };

  const formatValue = (value, format) => {
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'duration':
        return value.includes('m') ? value : `${value}m`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <Box
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      bg={bgColor}
      p={4}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="sm"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
      position="relative"
      overflow="hidden"
    >
      {/* Rank indicator */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w="full"
        h="1"
        bg={getRankColor(rank)}
        opacity={0.8}
      />
      
      <Flex align="center" justify="space-between">
        <HStack spacing={4}>
          <Box position="relative">
            <Avatar
              size="md"
              name={entry.name}
              src={entry.avatar}
              border="2px solid"
              borderColor={getRankColor(rank)}
            />
            {rank <= 3 && (
              <Box
                position="absolute"
                top="-2"
                right="-2"
                p={1}
                borderRadius="full"
                bg={getRankColor(rank)}
              >
                <Crown size={12} color="white" />
              </Box>
            )}
          </Box>
          
          <VStack align="start" spacing={0}>
            <HStack>
              <Text fontWeight="bold" fontSize="lg">
                {entry.name}
              </Text>
              <Tag size="sm" colorScheme={rank <= 3 ? 'yellow' : 'gray'} variant="subtle">
                #{rank}
              </Tag>
            </HStack>
            <Text fontSize="sm" color={textColor}>
              {entry.title}
            </Text>
          </VStack>
        </HStack>

        <HStack spacing={6} ml={8}>
          {LEADERBOARD_CATEGORIES[category].metrics.map((metric) => (
            <VStack key={metric.key} align="start" spacing={0}>
              <Text fontSize="xs" color={textColor} mb={1}>
                {metric.label}
              </Text>
              <HStack spacing={2}>
                <Text fontWeight="bold">
                  {formatValue(entry.metrics[metric.key], metric.format)}
                </Text>
                {entry.metrics[`${metric.key}_trend`] && (
                  <Tag
                    size="sm"
                    colorScheme={entry.metrics[`${metric.key}_trend`] > 0 ? 'green' : 'red'}
                    variant="subtle"
                  >
                    <TagLeftIcon as={entry.metrics[`${metric.key}_trend`] > 0 ? TrendingUp : TrendingDown} />
                    <TagLabel>{Math.abs(entry.metrics[`${metric.key}_trend`])}%</TagLabel>
                  </Tag>
                )}
              </HStack>
            </VStack>
          ))}
        </HStack>
      </Flex>
    </Box>
  );
};

export const Leaderboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('TEXT_CHAMPIONS');
  const [timeframe, setTimeframe] = useState('daily');
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Mock data - replace with actual data from your backend
  const mockData = [
    {
      name: 'John Doe',
      title: 'Senior Agent',
      metrics: {
        responses: 250,
        contacts_handled: 150,
        conversations_closed: 120,
        response_rate: 98,
        avg_response_time: '2m',
        responses_trend: 15,
        total_calls: 130,
        inbound_calls: 80,
        outbound_calls: 50,
        call_success_rate: 95,
        avg_duration: '5m'
      }
    },
    {
      name: 'Jane Smith',
      title: 'Customer Success',
      metrics: {
        responses: 220,
        contacts_handled: 140,
        conversations_closed: 110,
        response_rate: 96,
        avg_response_time: '3m',
        responses_trend: 8,
        total_calls: 120,
        inbound_calls: 70,
        outbound_calls: 50,
        call_success_rate: 92,
        avg_duration: '6m'
      }
    },
    {
      name: 'Mike Johnson',
      title: 'Support Specialist',
      metrics: {
        responses: 200,
        contacts_handled: 130,
        conversations_closed: 100,
        response_rate: 94,
        avg_response_time: '4m',
        responses_trend: -2,
        total_calls: 110,
        inbound_calls: 60,
        outbound_calls: 50,
        call_success_rate: 90,
        avg_duration: '7m'
      }
    }
  ];

  return (
    <Box p={6} bg={bgColor} borderRadius="2xl">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={2}>
            <Heading size="lg">Leaderboard</Heading>
            <Tag size="md" variant="subtle" colorScheme="blue">
              <TagLeftIcon as={Clock} />
              <TagLabel>{timeframe}</TagLabel>
            </Tag>
          </HStack>
          <Select
            w="150px"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            size="sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </Flex>

        {/* Category Selection */}
        <HStack spacing={4} pb={4}>
          {Object.entries(LEADERBOARD_CATEGORIES).map(([key, category]) => (
            <CategoryCard
              key={key}
              category={category}
              isSelected={selectedCategory === key}
              onClick={() => setSelectedCategory(key)}
            />
          ))}
        </HStack>

        <Divider />

        {/* Leaderboard Entries */}
        <VStack spacing={4}>
          <AnimatePresence>
            {mockData.map((entry, index) => (
              <LeaderboardRow
                key={entry.name}
                entry={entry}
                rank={index + 1}
                category={selectedCategory}
              />
            ))}
          </AnimatePresence>
        </VStack>
      </VStack>
    </Box>
  );
};