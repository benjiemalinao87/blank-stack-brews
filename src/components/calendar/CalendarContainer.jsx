import React, { useState } from 'react';
import { HStack, Box } from '@chakra-ui/react';
import { Calendar } from './Calendar';
import { CalendarSidebar } from './CalendarSidebar';

export const CalendarContainer = () => {
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Client Meeting - ABC Corp',
      start: new Date(),
      type: 'meeting',
      description: 'Discuss Q1 requirements',
      contact: 'John Smith',
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Production Deadline - XYZ Project',
      start: new Date(Date.now() + 86400000), // Tomorrow
      type: 'deadline',
      description: 'Final delivery of Phase 1',
      contact: 'Sarah Johnson',
      status: 'pending'
    },
    {
      id: '3',
      title: 'Follow-up Call - New Lead',
      start: new Date(Date.now() + 172800000), // Day after tomorrow
      type: 'followup',
      description: 'Discuss proposal details',
      contact: 'Mike Wilson',
      status: 'pending'
    }
  ]);

  const [activeFilters, setActiveFilters] = useState([
    'meeting',
    'deadline',
    'followup',
    'production',
    'delivery'
  ]);

  const handleFilterChange = (type, isChecked) => {
    if (isChecked) {
      setActiveFilters(prev => [...prev, type]);
    } else {
      setActiveFilters(prev => prev.filter(t => t !== type));
    }
  };

  const filteredEvents = events.filter(event => activeFilters.includes(event.type));

  return (
    <HStack spacing={0} h="100%" align="stretch">
      <Box flex={1}>
        <Calendar events={filteredEvents} setEvents={setEvents} />
      </Box>
      <CalendarSidebar
        events={events}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />
    </HStack>
  );
};
