import React, { useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { initialPipelineData } from './PipelineData';
import { PipelineCard } from './PipelineCard';

export const Pipeline = ({ onOpenChat }) => {
  const [pipelineData, setPipelineData] = useState(initialPipelineData);
  const stageBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleDragStart = (e, cardId, sourceStageId) => {
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStageId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const sourceStageId = e.dataTransfer.getData('sourceStageId');

    if (sourceStageId === targetStageId) return;

    // Find the card in the source stage
    const sourceStage = pipelineData.stages[sourceStageId];
    const cardIndex = sourceStage.cards.findIndex(card => card.id === cardId);
    const [movedCard] = sourceStage.cards.splice(cardIndex, 1);

    // Add the card to the target stage
    const targetStage = pipelineData.stages[targetStageId];
    targetStage.cards.push(movedCard);

    // Update state
    setPipelineData({
      ...pipelineData,
      stages: {
        ...pipelineData.stages,
        [sourceStageId]: sourceStage,
        [targetStageId]: targetStage,
      },
    });
  };

  const handleOpenChat = (card) => {
    onOpenChat({
      id: card.phone, // Using phone as the unique identifier
      name: card.name,
      phone: card.phone,
      lastMessage: card.lastMessage,
      time: card.time
    });
  };

  return (
    <Box h="100%" position="relative">
      <Box 
        p={4} 
        overflowX="auto" 
        overflowY="hidden"
        h="100%"
        css={{
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(0,0,0,0.2)',
          },
        }}
      >
        <HStack align="start" spacing={4} h="100%">
          {pipelineData.stageOrder.map((stageId) => {
            const stage = pipelineData.stages[stageId];
            return (
              <Box 
                key={stageId} 
                minW="300px" 
                h="100%"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stageId)}
              >
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  {stage.title} ({stage.cards.length})
                </Text>
                <Box
                  bg={stageBg}
                  borderRadius="lg"
                  minH="200px"
                  h="calc(100vh - 200px)"
                  p={3}
                  border="1px solid"
                  borderColor={borderColor}
                  transition="all 0.2s"
                  position="relative"
                  overflowY="auto"
                >
                  <VStack spacing={2} align="stretch">
                    {stage.cards.map((card, index) => (
                      <Box
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id, stageId)}
                      >
                        <PipelineCard 
                          card={card} 
                          index={index} 
                          onOpenChat={handleOpenChat}
                        />
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </Box>
            );
          })}
        </HStack>
      </Box>
    </Box>
  );
};
