import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Button,
  HStack,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import TimeMetrics from './TimeMetrics';
import SequencePerformance from './SequencePerformance';
import BoardComparison from './BoardComparison';
import useCampaignAnalytics from '../../../hooks/useCampaignAnalytics';

const CampaignAnalytics = ({ workspaceId, boardId }) => {
  const {
    timeMetrics,
    sequenceData,
    boardComparison,
    isLoading,
    refreshAnalytics
  } = useCampaignAnalytics(workspaceId, boardId);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!workspaceId || !boardId) {
    return null;
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="lg">Campaign Analytics</Heading>
            <Button
              leftIcon={<RepeatIcon />}
              onClick={refreshAnalytics}
              isLoading={isLoading}
              loadingText="Refreshing"
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </HStack>

          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
            </Box>
          ) : (
            <VStack spacing={6} align="stretch">
              <TimeMetrics 
                data={timeMetrics} 
                isLoading={isLoading} 
              />
              
              <SequencePerformance 
                data={sequenceData} 
                isLoading={isLoading} 
              />
              
              <BoardComparison 
                data={boardComparison} 
                isLoading={isLoading} 
              />
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default CampaignAnalytics;
