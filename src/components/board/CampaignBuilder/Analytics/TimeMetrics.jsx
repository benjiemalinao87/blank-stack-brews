import React from 'react';
import {
  Box,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';

const TimeMetrics = ({ data, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (isLoading) {
    return <Box>Loading metrics...</Box>;
  }

  const {
    avg_completion_time,
    avg_response_time,
    best_performing_hours,
    response_rate
  } = data || {};

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      p={6}
    >
      <Stack spacing={6}>
        <Heading size="md">Time-based Performance</Heading>
        
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <Stat>
            <StatLabel>Average Completion Time</StatLabel>
            <StatNumber>
              {avg_completion_time 
                ? formatDistanceToNow(new Date(avg_completion_time))
                : 'N/A'}
            </StatNumber>
            <StatHelpText>Campaign duration</StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Average Response Time</StatLabel>
            <StatNumber>
              {avg_response_time
                ? formatDistanceToNow(new Date(avg_response_time))
                : 'N/A'}
            </StatNumber>
            <StatHelpText>Time to respond</StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Best Performing Hours</StatLabel>
            <StatNumber>
              {best_performing_hours?.join(', ') || 'N/A'}
            </StatNumber>
            <StatHelpText>Highest engagement</StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Response Rate</StatLabel>
            <StatNumber>
              {response_rate ? `${response_rate.toFixed(1)}%` : 'N/A'}
            </StatNumber>
            <StatHelpText>Overall engagement</StatHelpText>
          </Stat>
        </Grid>
      </Stack>
    </Box>
  );
};

export default TimeMetrics;
