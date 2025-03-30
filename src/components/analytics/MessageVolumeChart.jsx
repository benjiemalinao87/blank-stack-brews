import React, { useMemo } from 'react';
import {
  Box,
  Text,
  useColorModeValue,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (active && payload && payload.length) {
    return (
      <Box
        bg={bg}
        p={3}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <Text fontWeight="medium" mb={2}>{label}</Text>
        {payload.map((entry, index) => (
          <Text key={index} color={entry.color}>
            {entry.name}: {entry.value}
          </Text>
        ))}
      </Box>
    );
  }
  return null;
};

export const MessageVolumeChart = ({ timeRange }) => {
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const gridColor = useColorModeValue('gray.200', 'gray.600');
  const receivedColor = useColorModeValue('blue.400', 'blue.300');
  const sentColor = useColorModeValue('green.400', 'green.300');

  // Mock data - Replace with real data from your backend
  const data = useMemo(() => {
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 2160;
    const interval = timeRange === '24h' ? 1 : timeRange === '7d' ? 6 : timeRange === '30d' ? 24 : 72;
    
    return Array.from({ length: hours / interval }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - (hours - i * interval));
      
      return {
        time: date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
        }),
        received: Math.floor(Math.random() * 100) + 20,
        sent: Math.floor(Math.random() * 80) + 10,
      };
    });
  }, [timeRange]);

  const totalReceived = useMemo(() => 
    data.reduce((sum, item) => sum + item.received, 0),
    [data]
  );

  const totalSent = useMemo(() => 
    data.reduce((sum, item) => sum + item.sent, 0),
    [data]
  );

  const previousPeriodChange = useMemo(() => ({
    received: Math.floor(Math.random() * 40) - 20,
    sent: Math.floor(Math.random() * 40) - 20,
  }), []);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="lg" fontWeight="medium">Message Volume</Text>
        <Flex gap={6}>
          <Stat size="sm">
            <StatLabel color={textColor}>Received</StatLabel>
            <StatNumber color={receivedColor}>{totalReceived}</StatNumber>
            <StatHelpText>
              <StatArrow type={previousPeriodChange.received > 0 ? 'increase' : 'decrease'} />
              {Math.abs(previousPeriodChange.received)}%
            </StatHelpText>
          </Stat>
          <Stat size="sm">
            <StatLabel color={textColor}>Sent</StatLabel>
            <StatNumber color={sentColor}>{totalSent}</StatNumber>
            <StatHelpText>
              <StatArrow type={previousPeriodChange.sent > 0 ? 'increase' : 'decrease'} />
              {Math.abs(previousPeriodChange.sent)}%
            </StatHelpText>
          </Stat>
        </Flex>
      </Flex>

      <Box h="300px">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={receivedColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={receivedColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sentColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={sentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={gridColor}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: textColor, fontSize: 12 }}
              tickLine={{ stroke: gridColor }}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              tick={{ fill: textColor, fontSize: 12 }}
              tickLine={{ stroke: gridColor }}
              axisLine={{ stroke: gridColor }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="received"
              stroke={receivedColor}
              fillOpacity={1}
              fill="url(#receivedGradient)"
              name="Received"
            />
            <Area
              type="monotone"
              dataKey="sent"
              stroke={sentColor}
              fillOpacity={1}
              fill="url(#sentGradient)"
              name="Sent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};
