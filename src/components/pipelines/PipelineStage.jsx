import React from 'react';
import {
  Box,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Droppable } from 'react-beautiful-dnd';
import { PipelineCard } from './PipelineCard';

export const PipelineStage = ({ stageId, stage, cards }) => {
  const stageBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Droppable droppableId={stageId} type="PIPELINE_CARD">
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.droppableProps}
          bg={stageBg}
          borderRadius="lg"
          minH="200px"
          h="calc(100vh - 200px)"
          p={3}
          border="1px solid"
          borderColor={snapshot.isDraggingOver ? 'blue.400' : borderColor}
          transition="all 0.2s"
          position="relative"
          overflowY="auto"
        >
          <VStack spacing={2} align="stretch">
            {cards.map((card, index) => (
              <PipelineCard key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </VStack>
        </Box>
      )}
    </Droppable>
  );
};
