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
  Text,
  Progress,
  Tooltip,
} from '@chakra-ui/react';

const SequencePerformance = ({ data, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  if (isLoading) {
    return <Box>Loading sequence data...</Box>;
  }

  const {
    sequence_data = [],
    total_contacts = 0
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
        <Heading size="md">Sequence Performance</Heading>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Day</Th>
                <Th>Active Contacts</Th>
                <Th>Drop-off</Th>
                <Th>Response Rate</Th>
                <Th>Progress</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sequence_data.map((day) => {
                const dropRate = ((day.previous_contacts - day.current_contacts) / day.previous_contacts * 100) || 0;
                const responseRate = (day.responses / day.current_contacts * 100) || 0;
                const progress = (day.current_contacts / total_contacts * 100) || 0;

                return (
                  <Tr key={day.day}>
                    <Td>Day {day.day}</Td>
                    <Td>{day.current_contacts}</Td>
                    <Td>
                      <Tooltip 
                        label={`${day.previous_contacts - day.current_contacts} contacts dropped off`}
                        placement="top"
                      >
                        <Text color={dropRate > 20 ? 'red.500' : textColor}>
                          {dropRate.toFixed(1)}%
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td>
                      <Text color={responseRate > 30 ? 'green.500' : textColor}>
                        {responseRate.toFixed(1)}%
                      </Text>
                    </Td>
                    <Td width="200px">
                      <Progress 
                        value={progress} 
                        size="sm" 
                        colorScheme={progress > 70 ? 'green' : 'blue'}
                        borderRadius="full"
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>

        {sequence_data.length === 0 && (
          <Text color={textColor} textAlign="center" py={4}>
            No sequence data available yet
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default SequencePerformance;
