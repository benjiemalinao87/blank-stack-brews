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
} from '@chakra-ui/react';

export const AgentMetrics = ({ title, timeRange, detailed = false }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Mock data - Replace with real data from your backend
  const agentStats = {
    totalAgents: 12,
    activeAgents: 8,
    averageResponseTime: '1m 45s',
    responseTimeChange: 15, // percentage
    satisfactionRate: 4.8,
    satisfactionChange: 5, // percentage
    resolutionRate: 92,
    resolutionChange: -2, // percentage
  };

  const agentDetails = [
    {
      name: 'John Doe',
      activeChats: 3,
      avgResponseTime: '1m 30s',
      satisfaction: 4.9,
      resolution: 95,
    },
    {
      name: 'Jane Smith',
      activeChats: 2,
      avgResponseTime: '2m 15s',
      satisfaction: 4.7,
      resolution: 88,
    },
    // Add more agents as needed
  ];

  if (!detailed) {
    return (
      <Box>
        <Text fontSize="lg" fontWeight="medium" mb={4}>{title}</Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <Stat>
            <StatLabel>Average Response Time</StatLabel>
            <StatNumber>{agentStats.averageResponseTime}</StatNumber>
            <StatHelpText>
              <StatArrow type={agentStats.responseTimeChange > 0 ? 'increase' : 'decrease'} />
              {Math.abs(agentStats.responseTimeChange)}%
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Customer Satisfaction</StatLabel>
            <StatNumber>{agentStats.satisfactionRate}/5.0</StatNumber>
            <StatHelpText>
              <StatArrow type={agentStats.satisfactionChange > 0 ? 'increase' : 'decrease'} />
              {Math.abs(agentStats.satisfactionChange)}%
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Resolution Rate</StatLabel>
            <StatNumber>{agentStats.resolutionRate}%</StatNumber>
            <StatHelpText>
              <StatArrow type={agentStats.resolutionChange > 0 ? 'increase' : 'decrease'} />
              {Math.abs(agentStats.resolutionChange)}%
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Active Agents</StatLabel>
            <StatNumber>{agentStats.activeAgents}/{agentStats.totalAgents}</StatNumber>
            <StatHelpText>Currently Online</StatHelpText>
          </Stat>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="lg" fontWeight="medium" mb={4}>Agent Performance Details</Text>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Agent</Th>
            <Th isNumeric>Active Chats</Th>
            <Th>Avg Response</Th>
            <Th isNumeric>Satisfaction</Th>
            <Th isNumeric>Resolution %</Th>
          </Tr>
        </Thead>
        <Tbody>
          {agentDetails.map((agent, index) => (
            <Tr key={index}>
              <Td>{agent.name}</Td>
              <Td isNumeric>{agent.activeChats}</Td>
              <Td>{agent.avgResponseTime}</Td>
              <Td isNumeric>{agent.satisfaction}</Td>
              <Td isNumeric>{agent.resolution}%</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
