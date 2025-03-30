
import React from 'react';
import { Box, Heading, Text, VStack, HStack, Icon, Divider, Button, useColorModeValue } from '@chakra-ui/react';
import { Zap, Calendar, Users, MessageCircle, Clock, Settings } from 'lucide-react';

export const AutomationFeatures = () => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  
  const automationTypes = [
    {
      title: 'Message Sequences',
      description: 'Create automated message sequences that trigger based on time or user actions',
      icon: MessageCircle,
      comingSoon: false
    },
    {
      title: 'Appointment Reminders',
      description: 'Automatically send reminders before scheduled appointments',
      icon: Calendar,
      comingSoon: false
    },
    {
      title: 'Lead Qualification',
      description: 'Automatically qualify leads based on their responses and engagement',
      icon: Users,
      comingSoon: true
    },
    {
      title: 'Time-triggered Actions',
      description: 'Schedule actions to occur at specific times or intervals',
      icon: Clock,
      comingSoon: true
    }
  ];

  return (
    <VStack spacing={6} align="stretch" p={6}>
      <Box>
        <Heading size="lg" mb={2}>Automation Center</Heading>
        <Text>Create and manage automated workflows to save time and increase engagement</Text>
      </Box>
      
      <Divider />
      
      <Box>
        <Heading size="md" mb={4}>Available Automations</Heading>
        <VStack spacing={4} align="stretch">
          {automationTypes.map((type, index) => (
            <Box 
              key={index}
              p={4}
              borderWidth="1px"
              borderColor={cardBorder}
              borderRadius="md"
              bg={cardBg}
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
            >
              <HStack spacing={4}>
                <Icon as={type.icon} boxSize={6} color="blue.500" />
                <VStack align="start" spacing={1} flex="1">
                  <HStack w="100%" justify="space-between">
                    <Heading size="sm">{type.title}</Heading>
                    {type.comingSoon && (
                      <Text fontSize="xs" bg="gray.100" color="gray.600" px={2} py={1} borderRadius="full">
                        Coming Soon
                      </Text>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="gray.600">{type.description}</Text>
                </VStack>
                {!type.comingSoon && (
                  <Button colorScheme="blue" size="sm">Configure</Button>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
      
      <Box mt={4}>
        <Button leftIcon={<Settings size={16} />} variant="outline" size="sm">
          Automation Settings
        </Button>
      </Box>
    </VStack>
  );
};

export default AutomationFeatures;
