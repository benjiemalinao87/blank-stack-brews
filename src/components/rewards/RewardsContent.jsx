import React from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  VStack,
  HStack,
  Text,
  Progress,
  Grid,
  Badge,
  Button,
  Icon,
} from '@chakra-ui/react';
import { Crown, Trophy, Target, Star, Zap, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import { Overview } from './Overview';
import { Leaderboard } from './leaderboard/Leaderboard';
import { DailyChallenges } from './challenges/DailyChallenges';
import { SpinAndWin } from './spin/SpinAndWin';

const MetricCard = ({ icon, value, label, change }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
      transition="all 0.2s"
    >
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between">
          <Box color="gray.500">
            {icon}
          </Box>
          <Badge
            colorScheme={change >= 0 ? 'green' : 'red'}
            variant="subtle"
          >
            {change >= 0 ? '+' : ''}{change}%
          </Badge>
        </HStack>
        <Text fontSize="2xl" fontWeight="bold">
          {value}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
      </VStack>
    </Box>
  );
};

const AchievementCard = ({ title, description, points, progress, total }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
      transition="all 0.2s"
    >
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <Text fontWeight="bold">{title}</Text>
          <Badge colorScheme="blue">{points} PTS</Badge>
        </HStack>
        <Text fontSize="sm" color="gray.500">
          {description}
        </Text>
        <Progress
          value={(progress / total) * 100}
          size="sm"
          colorScheme="blue"
          borderRadius="full"
        />
      </VStack>
    </Box>
  );
};

export const RewardsContent = () => {
  const tabBg = useColorModeValue('blue.50', 'blue.900');
  const selectedTabBg = useColorModeValue('white', 'gray.800');

  return (
    <Tabs variant="soft-rounded" colorScheme="blue" h="100%">
      <TabList bg={tabBg} borderRadius="full" p={1} mx={4} mt={2} mb={4}>
        <Tab 
          _selected={{ bg: selectedTabBg }} 
          borderRadius="full"
          mx={1}
          fontSize="sm"
        >
          Overview
        </Tab>
        <Tab 
          _selected={{ bg: selectedTabBg }} 
          borderRadius="full"
          mx={1}
          fontSize="sm"
        >
          Leaderboard
        </Tab>
        <Tab 
          _selected={{ bg: selectedTabBg }} 
          borderRadius="full"
          mx={1}
          fontSize="sm"
        >
          Challenges
        </Tab>
        <Tab 
          _selected={{ bg: selectedTabBg }} 
          borderRadius="full"
          mx={1}
          fontSize="sm"
        >
          Spin
        </Tab>
      </TabList>

      <TabPanels h="calc(100% - 60px)" overflowY="auto">
        <TabPanel h="100%">
          <Overview />
        </TabPanel>
        <TabPanel h="100%">
          <Leaderboard />
        </TabPanel>
        <TabPanel h="100%">
          <DailyChallenges />
        </TabPanel>
        <TabPanel h="100%">
          <SpinAndWin />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};