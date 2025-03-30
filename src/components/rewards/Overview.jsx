import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Grid,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { Crown, Star, Target, Zap } from 'lucide-react';

const StatCard = ({ icon, title, value, subtitle, progress }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="sm"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
      transition="all 0.2s"
    >
      <VStack spacing={4} align="start">
        <HStack spacing={3}>
          <Icon as={icon} boxSize={6} color="blue.500" />
          <Text fontSize="lg" fontWeight="medium">
            {title}
          </Text>
        </HStack>
        <Text fontSize="3xl" fontWeight="bold">
          {value}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {subtitle}
        </Text>
        {progress && (
          <Box w="full">
            <Progress
              value={progress}
              size="sm"
              colorScheme="blue"
              borderRadius="full"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {progress}% to next level
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export const Overview = () => {
  const stats = [
    {
      icon: Crown,
      title: 'Current Level',
      value: '5',
      subtitle: 'Master Agent',
      progress: 65,
    },
    {
      icon: Star,
      title: 'Total Points',
      value: '2,500',
      subtitle: '+350 this week',
    },
    {
      icon: Target,
      title: 'Achievements',
      value: '12/30',
      subtitle: '3 new available',
    },
    {
      icon: Zap,
      title: 'Daily Streak',
      value: '7',
      subtitle: 'days in a row',
    },
  ];

  return (
    <Box>
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={6}
      >
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </Grid>
    </Box>
  );
};
