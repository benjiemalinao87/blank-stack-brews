import React from 'react';
import {
  Box,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const TimelineChart = ({ title, timeRange }) => {
  // Mock data - Replace with real data from your backend
  const data = [
    { time: '00:00', messages: 45, activeAgents: 3 },
    { time: '03:00', messages: 30, activeAgents: 2 },
    { time: '06:00', messages: 25, activeAgents: 2 },
    { time: '09:00', messages: 100, activeAgents: 5 },
    { time: '12:00', messages: 165, activeAgents: 8 },
    { time: '15:00', messages: 190, activeAgents: 8 },
    { time: '18:00', messages: 140, activeAgents: 6 },
    { time: '21:00', messages: 85, activeAgents: 4 },
  ];

  const lineColor = useColorModeValue('blue.500', 'blue.300');
  const agentLineColor = useColorModeValue('green.500', 'green.300');

  return (
    <Box>
      <Text fontSize="lg" fontWeight="medium" mb={4}>{title}</Text>
      <Box h="300px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="messages"
              stroke={lineColor}
              activeDot={{ r: 8 }}
              name="Messages"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="activeAgents"
              stroke={agentLineColor}
              name="Active Agents"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};
