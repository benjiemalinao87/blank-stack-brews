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
  useColorModeValue,
  Progress,
  Flex,
  Divider,
} from '@chakra-ui/react';

export const TextingMetrics = ({ timeRange }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const progressTrackColor = useColorModeValue('gray.100', 'gray.700');

  // Mock data - Replace with real data from your backend
  const metrics = {
    responseTime: {
      average: '1m 45s',
      change: -15,
      breakdown: {
        under1min: 35,
        under5min: 45,
        under15min: 15,
        over15min: 5,
      }
    },
    deliveryRate: {
      rate: 98.5,
      change: 2.3,
      failed: 15,
      pending: 8,
    },
    engagement: {
      readRate: 92,
      change: 5.2,
      clickThrough: 45,
      linksSent: 156,
    },
    conversations: {
      active: 127,
      change: 12,
      avgDuration: '8m 30s',
      resolved: 85,
    },
    automation: {
      autoResponses: 234,
      change: 18,
      templatesUsed: 156,
      efficiency: 78,
    },
    customerSatisfaction: {
      score: 4.2,
      change: 0.3,
      responses: 156,
      breakdown: {
        excellent: 45,
        good: 35,
        neutral: 15,
        poor: 5,
      }
    }
  };

  const MetricCard = ({ title, children }) => (
    <Box p={6} borderRadius="xl" border="1px" borderColor={borderColor} bg={useColorModeValue('white', 'gray.800')}>
      <Text fontSize="md" fontWeight="medium" mb={4}>{title}</Text>
      {children}
    </Box>
  );

  return (
    <Box>
      <Text fontSize="xl" fontWeight="medium" mb={6}>Detailed Metrics</Text>
      
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        {/* Response Time */}
        <MetricCard title="Response Time">
          <Stat mb={4}>
            <StatLabel>Average Response Time</StatLabel>
            <StatNumber>{metrics.responseTime.average}</StatNumber>
            <StatHelpText>
              <StatArrow type={metrics.responseTime.change <= 0 ? 'decrease' : 'increase'} />
              {Math.abs(metrics.responseTime.change)}%
            </StatHelpText>
          </Stat>
          <Text fontSize="sm" color={textColor} mb={2}>Response Time Breakdown</Text>
          <Grid gap={2}>
            {Object.entries(metrics.responseTime.breakdown).map(([key, value]) => (
              <Box key={key}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</Text>
                  <Text fontSize="xs">{value}%</Text>
                </Flex>
                <Progress 
                  value={value} 
                  size="sm" 
                  colorScheme="blue" 
                  bg={progressTrackColor}
                  borderRadius="full"
                />
              </Box>
            ))}
          </Grid>
        </MetricCard>

        {/* Delivery Metrics */}
        <MetricCard title="Message Delivery">
          <Stat mb={4}>
            <StatLabel>Message Delivery Rate</StatLabel>
            <StatNumber>{metrics.deliveryRate.rate}%</StatNumber>
            <StatHelpText>
              <StatArrow type={metrics.deliveryRate.change >= 0 ? 'increase' : 'decrease'} />
              {Math.abs(metrics.deliveryRate.change)}%
            </StatHelpText>
          </Stat>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Stat size="sm">
              <StatLabel>Failed</StatLabel>
              <StatNumber color="red.400">{metrics.deliveryRate.failed}</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Pending</StatLabel>
              <StatNumber color="orange.400">{metrics.deliveryRate.pending}</StatNumber>
            </Stat>
          </Grid>
        </MetricCard>

        {/* Engagement Metrics */}
        <MetricCard title="Message Engagement">
          <Stat mb={4}>
            <StatLabel>Message Read Rate</StatLabel>
            <StatNumber>{metrics.engagement.readRate}%</StatNumber>
            <StatHelpText>
              <StatArrow type={metrics.engagement.change >= 0 ? 'increase' : 'decrease'} />
              {Math.abs(metrics.engagement.change)}%
            </StatHelpText>
          </Stat>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Stat size="sm">
              <StatLabel>Link Click Rate</StatLabel>
              <StatNumber>{metrics.engagement.clickThrough}%</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Links Sent</StatLabel>
              <StatNumber>{metrics.engagement.linksSent}</StatNumber>
            </Stat>
          </Grid>
        </MetricCard>

        {/* Conversation Metrics */}
        <MetricCard title="Active Conversations">
          <Stat mb={4}>
            <StatLabel>Active Conversations</StatLabel>
            <StatNumber>{metrics.conversations.active}</StatNumber>
            <StatHelpText>
              <StatArrow type={metrics.conversations.change >= 0 ? 'increase' : 'decrease'} />
              {Math.abs(metrics.conversations.change)}%
            </StatHelpText>
          </Stat>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Stat size="sm">
              <StatLabel>Avg Duration</StatLabel>
              <StatNumber>{metrics.conversations.avgDuration}</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Resolved</StatLabel>
              <StatNumber>{metrics.conversations.resolved}%</StatNumber>
            </Stat>
          </Grid>
        </MetricCard>

        {/* Automation Metrics */}
        <MetricCard title="Automation Performance">
          <Stat mb={4}>
            <StatLabel>Auto-Responses</StatLabel>
            <StatNumber>{metrics.automation.autoResponses}</StatNumber>
            <StatHelpText>
              <StatArrow type={metrics.automation.change >= 0 ? 'increase' : 'decrease'} />
              {Math.abs(metrics.automation.change)}%
            </StatHelpText>
          </Stat>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Stat size="sm">
              <StatLabel>Templates Used</StatLabel>
              <StatNumber>{metrics.automation.templatesUsed}</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Efficiency</StatLabel>
              <StatNumber>{metrics.automation.efficiency}%</StatNumber>
            </Stat>
          </Grid>
        </MetricCard>

        {/* Customer Satisfaction */}
        <MetricCard title="Customer Satisfaction">
          <Stat mb={4}>
            <StatLabel>CSAT Score</StatLabel>
            <StatNumber>{metrics.customerSatisfaction.score}/5</StatNumber>
            <StatHelpText>
              <StatArrow type={metrics.customerSatisfaction.change >= 0 ? 'increase' : 'decrease'} />
              {Math.abs(metrics.customerSatisfaction.change)} points
            </StatHelpText>
          </Stat>
          <Text fontSize="sm" color={textColor} mb={2}>Rating Breakdown</Text>
          <Grid gap={2}>
            {Object.entries(metrics.customerSatisfaction.breakdown).map(([key, value]) => (
              <Box key={key}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs">{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text fontSize="xs">{value}%</Text>
                </Flex>
                <Progress 
                  value={value} 
                  size="sm" 
                  colorScheme={
                    key === 'excellent' ? 'green' :
                    key === 'good' ? 'blue' :
                    key === 'neutral' ? 'yellow' :
                    'red'
                  }
                  bg={progressTrackColor}
                  borderRadius="full"
                />
              </Box>
            ))}
          </Grid>
        </MetricCard>
      </Grid>
    </Box>
  );
};
