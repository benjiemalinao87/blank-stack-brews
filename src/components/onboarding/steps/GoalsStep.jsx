import React, { useState } from 'react';
import {
  VStack,
  Button,
  Text,
  Heading,
  Checkbox,
  Box,
} from '@chakra-ui/react';

const GoalsStep = ({ initialData, onComplete }) => {
  const [selectedGoals, setSelectedGoals] = useState(initialData.goals || []);

  const goals = [
    {
      id: 'crm_basics',
      label: 'Get started with CRM basics',
      description: 'Learn the fundamentals of managing contacts and conversations'
    },
    {
      id: 'sales_process',
      label: 'Set up my sales process',
      description: 'Create a customized pipeline for your business'
    },
    {
      id: 'communication',
      label: 'Gather all my customer communication',
      description: 'Centralize emails, messages, and customer interactions'
    },
    {
      id: 'own_data',
      label: 'Experience the app using my own data',
      description: 'Import your contacts and start managing real conversations'
    },
    {
      id: 'get_leads',
      label: 'Get more leads',
      description: 'Learn strategies to grow your customer base'
    }
  ];

  const handleGoalToggle = (goalId) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      }
      return [...prev, goalId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onComplete({ goals: selectedGoals }, false); // Pass false to indicate not last step
    } catch (error) {
      console.error('Error saving goals:', error);
      // Continue anyway since the data is in state
    }
  };

  return (
    <VStack as="form" onSubmit={handleSubmit} spacing={6} align="stretch" width="100%" maxW="480px" mx="auto">
      <VStack spacing={2} align="start" w="100%">
        <Heading size="lg" color="gray.800" fontWeight="semibold">Your goals</Heading>
        <Text color="gray.600" fontSize="md">
          We'll use this information to tailor the app to your needs.
        </Text>
      </VStack>

      <VStack spacing={4} align="stretch">
        {goals.map((goal) => (
          <Box
            key={goal.id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            borderColor={selectedGoals.includes(goal.id) ? 'purple.500' : 'gray.200'}
            bg={selectedGoals.includes(goal.id) ? 'purple.50' : 'white'}
            cursor="pointer"
            onClick={() => handleGoalToggle(goal.id)}
            _hover={{
              borderColor: 'purple.500',
              bg: 'purple.50'
            }}
            transition="all 0.2s"
          >
            <Checkbox
              isChecked={selectedGoals.includes(goal.id)}
              onChange={() => handleGoalToggle(goal.id)}
              colorScheme="purple"
              size="lg"
            >
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium" color="gray.800">{goal.label}</Text>
                <Text fontSize="sm" color="gray.600">{goal.description}</Text>
              </VStack>
            </Checkbox>
          </Box>
        ))}
      </VStack>

      <Button
        type="submit"
        colorScheme="purple"
        size="lg"
        width="100%"
        mt={4}
        borderRadius="md"
        _hover={{ bg: "purple.600" }}
        _active={{ bg: "purple.700" }}
        isDisabled={selectedGoals.length === 0}
      >
        Next
      </Button>
    </VStack>
  );
};

export default GoalsStep;
