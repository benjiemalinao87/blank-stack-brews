import React from 'react';
import {
  VStack,
  Box,
  Text,
  Checkbox,
  Badge,
  HStack,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';

const eventTypes = {
  meeting: { color: 'blue', label: 'Meetings' },
  deadline: { color: 'red', label: 'Deadlines' },
  followup: { color: 'green', label: 'Follow-ups' },
  production: { color: 'purple', label: 'Production' },
  delivery: { color: 'orange', label: 'Deliveries' }
};

export const CalendarSidebar = ({ events, activeFilters, onFilterChange }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  const upcomingEvents = events
    .filter(event => new Date(event.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  return (
    <VStack
      w="300px"
      h="100%"
      bg={bgColor}
      p={4}
      spacing={6}
      align="stretch"
      borderLeft="1px solid"
      borderColor={borderColor}
    >
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={3}>
          Event Types
        </Text>
        <VStack align="start" spacing={2}>
          {Object.entries(eventTypes).map(([type, { label, color }]) => (
            <Checkbox
              key={type}
              isChecked={activeFilters.includes(type)}
              onChange={(e) => onFilterChange(type, e.target.checked)}
              colorScheme={color}
            >
              <HStack spacing={2}>
                <Text>{label}</Text>
                <Badge colorScheme={color} variant="solid" fontSize="xs">
                  {events.filter(e => e.type === type).length}
                </Badge>
              </HStack>
            </Checkbox>
          ))}
        </VStack>
      </Box>

      <Divider />

      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={3}>
          Upcoming Events
        </Text>
        <VStack align="stretch" spacing={3}>
          {upcomingEvents.map(event => (
            <Box
              key={event.id}
              p={3}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
              _hover={{ bg: hoverBgColor }}
            >
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {event.title}
                </Text>
                <Badge colorScheme={eventTypes[event.type].color}>
                  {eventTypes[event.type].label}
                </Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                {new Date(event.start).toLocaleDateString()} - {event.contact}
              </Text>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
};
