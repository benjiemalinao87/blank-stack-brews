import React from 'react';
import {
  Box,
  Grid,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Progress,
  Flex,
} from '@chakra-ui/react';

export const MessageMetrics = ({ title, timeRange, detailed = false }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Mock data - Replace with real data from your backend
  const messageStats = {
    totalMessages: 2547,
    messageChange: 12, // percentage
    averageConversationTime: '8m 30s',
    conversationTimeChange: -5,
    peakHour: '2:00 PM',
    sentimentScore: 85,
    sentimentChange: 3,
  };

  const topicBreakdown = [
    { topic: 'Technical Support', percentage: 35 },
    { topic: 'Billing Questions', percentage: 25 },
    { topic: 'Product Information', percentage: 20 },
    { topic: 'General Inquiries', percentage: 15 },
    { topic: 'Other', percentage: 5 },
  ];

  const hourlyBreakdown = [
    { hour: '9 AM', messages: 156 },
    { hour: '10 AM', messages: 234 },
    { hour: '11 AM', messages: 287 },
    { hour: '12 PM', messages: 198 },
    { hour: '1 PM', messages: 245 },
    { hour: '2 PM', messages: 312 },
    // Add more hours as needed
  ];

  if (!detailed) {
    return (
      <Box>
        <Text fontSize="lg" fontWeight="medium" mb={4}>{title}</Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <Stat>
            <StatLabel>Total Messages</StatLabel>
            <StatNumber>{messageStats.totalMessages}</StatNumber>
            <StatHelpText>
              <StatArrow type={messageStats.messageChange > 0 ? 'increase' : 'decrease'} />
              {Math.abs(messageStats.messageChange)}%
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Avg Conversation Time</StatLabel>
            <StatNumber>{messageStats.averageConversationTime}</StatNumber>
            <StatHelpText>
              <StatArrow type={messageStats.conversationTimeChange > 0 ? 'increase' : 'decrease'} />
              {Math.abs(messageStats.conversationTimeChange)}%
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Peak Hour</StatLabel>
            <StatNumber>{messageStats.peakHour}</StatNumber>
            <StatHelpText>Highest Traffic Time</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Sentiment Score</StatLabel>
            <StatNumber>{messageStats.sentimentScore}%</StatNumber>
            <StatHelpText>
              <StatArrow type={messageStats.sentimentChange > 0 ? 'increase' : 'decrease'} />
              {Math.abs(messageStats.sentimentChange)}%
            </StatHelpText>
          </Stat>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="lg" fontWeight="medium" mb={6}>Message Analytics Details</Text>
      
      <Box mb={8}>
        <Text fontSize="md" fontWeight="medium" mb={4}>Conversation Topics</Text>
        {topicBreakdown.map((topic, index) => (
          <Box key={index} mb={4}>
            <Flex justify="space-between" mb={2}>
              <Text>{topic.topic}</Text>
              <Text>{topic.percentage}%</Text>
            </Flex>
            <Progress value={topic.percentage} size="sm" colorScheme="blue" />
          </Box>
        ))}
      </Box>

      <Box>
        <Text fontSize="md" fontWeight="medium" mb={4}>Hourly Message Volume</Text>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Hour</Th>
              <Th isNumeric>Messages</Th>
              <Th>Volume</Th>
            </Tr>
          </Thead>
          <Tbody>
            {hourlyBreakdown.map((hour, index) => (
              <Tr key={index}>
                <Td>{hour.hour}</Td>
                <Td isNumeric>{hour.messages}</Td>
                <Td>
                  <Progress 
                    value={(hour.messages / Math.max(...hourlyBreakdown.map(h => h.messages))) * 100}
                    size="sm"
                    colorScheme="blue"
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
