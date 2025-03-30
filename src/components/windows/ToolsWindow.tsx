import React from 'react';
import { DockWindow } from '../dock/DockWindow';
import { Box } from '@chakra-ui/react';
import { Tools } from '../Tools';

export function ToolsWindow() {
  return (
    <DockWindow title="Tools">
      <Box p={4}>
        <Tools />
      </Box>
    </DockWindow>
  );
}
