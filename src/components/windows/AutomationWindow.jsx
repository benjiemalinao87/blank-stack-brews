
import React from 'react';
import { Box } from '@chakra-ui/react';
import AutomationFeatures from '../automation/AutomationFeatures';

export function AutomationWindow({ onClose }) {
  return (
    <Box p={4}>
      <AutomationFeatures />
    </Box>
  );
}

export default AutomationWindow;
