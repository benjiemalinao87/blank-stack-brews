import React from 'react';
import {
  Box,
  Heading,
  Stack,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tooltip,
  Text,
  HStack,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

const BoardComparison = ({ data, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  if (isLoading) {
    return <Box>Loading board comparisons...</Box>;
  }

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'green';
      case 2: return 'blue';
      case 3: return 'purple';
      default: return 'gray';
    }
  };

  const getPerformanceIndicator = (rate) => {
    if (rate >= 80) return { color: 'green', text: 'Excellent' };
    if (rate >= 60) return { color: 'blue', text: 'Good' };
    if (rate >= 40) return { color: 'yellow', text: 'Average' };
    return { color: 'red', text: 'Needs Attention' };
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      p={6}
    >
      <Stack spacing={6}>
        <HStack justify="space-between" align="center">
          <Heading size="md">Board Performance Comparison</Heading>
          <Tooltip 
            label="Rankings are based on completion rates and response rates"
            placement="top"
          >
            <InfoIcon color={textColor} />
          </Tooltip>
        </HStack>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Board</Th>
                <Th isNumeric>Campaigns</Th>
                <Th isNumeric>Completion Rate</Th>
                <Th isNumeric>Response Rate</Th>
                <Th>Performance</Th>
                <Th>Rank</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data?.map((board) => {
                const performance = getPerformanceIndicator(board.completion_rate);
                
                return (
                  <Tr key={board.board_id}>
                    <Td fontWeight="medium">{board.board_name}</Td>
                    <Td isNumeric>{board.total_campaigns}</Td>
                    <Td isNumeric>
                      {board.completion_rate 
                        ? `${board.completion_rate.toFixed(1)}%`
                        : 'N/A'}
                    </Td>
                    <Td isNumeric>
                      {board.response_rate
                        ? `${board.response_rate.toFixed(1)}%`
                        : 'N/A'}
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={performance.color}
                        borderRadius="full"
                        px={2}
                      >
                        {performance.text}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={getRankColor(board.completion_rank)}
                        borderRadius="full"
                        px={2}
                      >
                        #{board.completion_rank}
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>

        {(!data || data.length === 0) && (
          <Text color={textColor} textAlign="center" py={4}>
            No board comparison data available
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default BoardComparison;
