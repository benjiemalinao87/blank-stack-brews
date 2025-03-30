import React from 'react';
import { Box } from '@chakra-ui/react';
import { Pipeline } from '../pipeline/Pipeline';

export function PipelineWindow({ onClose }) {
  return (
    <Box h="100%" overflowY="auto">
      <Pipeline />
    </Box>
  );
} 