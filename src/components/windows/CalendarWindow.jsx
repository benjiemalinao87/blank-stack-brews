import React from 'react';
import { Box } from '@chakra-ui/react';
import { Calendar } from '../calendar/Calendar';

export function CalendarWindow({ onClose }) {
  return (
    <Box h="100%" overflowY="auto">
      <Calendar />
    </Box>
  );
} 