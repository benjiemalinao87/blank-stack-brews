import React from 'react';
import { DraggableWindow } from '../window/DraggableWindow';
import { Box } from '@chakra-ui/react';
import { RewardsContent } from '../rewards/RewardsContent';

export function RewardsWindow({ onClose }) {
  return (
    <Box h="100%" overflowY="auto">
      <RewardsContent />
    </Box>
  );
}
