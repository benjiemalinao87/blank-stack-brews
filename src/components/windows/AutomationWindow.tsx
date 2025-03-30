import React from 'react';
import { DockWindow } from '../dock/DockWindow';
import { Box, Text } from '@chakra-ui/react';

export function AutomationWindow() {
  return (
    <DockWindow title="Automation">
      <Box p={4}>
        <Text>Automation Features Coming Soon</Text>
      </Box>
    </DockWindow>
  );
}
