import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  Progress,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronDownIcon, StarIcon } from '@chakra-ui/icons';

const metrics = [
  { label: 'Response Time', key: 'responseTime' },
  { label: 'Resolution Rate', key: 'resolutionRate' },
  { label: 'Customer Satisfaction', key: 'satisfaction' },
  { label: 'Messages Handled', key: 'messagesHandled' },
];

export const AgentLeaderboard = ({ timeRange }) => {
  const [selectedMetric, setSelectedMetric] = useState(metrics[0]);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const progressTrackColor = useColorModeValue('gray.100', 'gray.700');

  // Mock data - Replace with real data from your backend
  const agents = [
    {
      id: 1,
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=1',
      status: 'online',
      responseTime: { value: 45, unit: 'seconds', change: -15 },
      resolutionRate: { value: 95, unit: '%', change: 5 },
      satisfaction: { value: 4.8, unit: '/5', change: 0.3 },
      messagesHandled: { value: 342, unit: '', change: 28 },
      badges: ['Top Performer', '5-Star Rating'],
    },
    {
      id: 2,
      name: 'Michael Chen',
      avatar: 'https://i.pravatar.cc/150?img=2',
      status: 'online',
      responseTime: { value: 52, unit: 'seconds', change: -8 },
      resolutionRate: { value: 92, unit: '%', change: 3 },
      satisfaction: { value: 4.6, unit: '/5', change: 0.2 },
      messagesHandled: { value: 287, unit: '', change: 15 },
      badges: ['Quick Responder'],
    },
    {
      id: 3,
      name: 'Emma Davis',
      avatar: 'https://i.pravatar.cc/150?img=3',
      status: 'offline',
      responseTime: { value: 61, unit: 'seconds', change: -5 },
      resolutionRate: { value: 88, unit: '%', change: 4 },
      satisfaction: { value: 4.5, unit: '/5', change: 0.1 },
      messagesHandled: { value: 245, unit: '', change: 12 },
      badges: ['Problem Solver'],
    },
    {
      id: 4,
      name: 'Alex Turner',
      avatar: 'https://i.pravatar.cc/150?img=4',
      status: 'online',
      responseTime: { value: 58, unit: 'seconds', change: -10 },
      resolutionRate: { value: 90, unit: '%', change: 2 },
      satisfaction: { value: 4.4, unit: '/5', change: 0.2 },
      messagesHandled: { value: 198, unit: '', change: 8 },
      badges: ['Rising Star'],
    },
    {
      id: 5,
      name: 'Lisa Wang',
      avatar: 'https://i.pravatar.cc/150?img=5',
      status: 'online',
      responseTime: { value: 49, unit: 'seconds', change: -12 },
      resolutionRate: { value: 93, unit: '%', change: 4 },
      satisfaction: { value: 4.7, unit: '/5', change: 0.2 },
      messagesHandled: { value: 312, unit: '', change: 22 },
      badges: ['Customer Favorite'],
    },
  ];

  const getMetricValue = (agent, metric) => {
    return agent[metric.key];
  };

  const getMaxMetricValue = (metric) => {
    return Math.max(...agents.map(agent => getMetricValue(agent, metric).value));
  };

  const sortedAgents = [...agents].sort((a, b) => {
    const aValue = getMetricValue(a, selectedMetric).value;
    const bValue = getMetricValue(b, selectedMetric).value;
    return selectedMetric.key === 'responseTime' ? aValue - bValue : bValue - aValue;
  });

  return (
    <Box
      bg={bgColor}
      borderRadius="2xl"
      border="1px"
      borderColor={borderColor}
      overflow="hidden"
    >
      <Flex p={6} justify="space-between" align="center" borderBottom="1px" borderColor={borderColor}>
        <Text fontSize="lg" fontWeight="medium">Agent Leaderboard</Text>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            size="sm"
            variant="outline"
            _hover={{ bg: hoverBg }}
          >
            {selectedMetric.label}
          </MenuButton>
          <MenuList>
            {metrics.map((metric) => (
              <MenuItem
                key={metric.key}
                onClick={() => setSelectedMetric(metric)}
              >
                {metric.label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Flex>

      <Box>
        {sortedAgents.map((agent, index) => {
          const metric = getMetricValue(agent, selectedMetric);
          const maxValue = getMaxMetricValue(selectedMetric);
          const progressValue = (metric.value / maxValue) * 100;

          return (
            <Flex
              key={agent.id}
              p={4}
              align="center"
              borderBottom="1px"
              borderColor={borderColor}
              _hover={{ bg: hoverBg }}
              transition="background-color 0.2s"
            >
              <Text fontSize="lg" fontWeight="medium" w="8" color={textColor}>
                #{index + 1}
              </Text>
              <Avatar src={agent.avatar} size="md" mr={4} />
              <Box flex="1">
                <Flex align="center" mb={1}>
                  <Text fontWeight="medium">{agent.name}</Text>
                  <Badge
                    ml={2}
                    colorScheme={agent.status === 'online' ? 'green' : 'gray'}
                    variant="subtle"
                    fontSize="xs"
                  >
                    {agent.status}
                  </Badge>
                </Flex>
                <Flex gap={2}>
                  {agent.badges.map((badge, i) => (
                    <Badge
                      key={i}
                      colorScheme="blue"
                      variant="subtle"
                      fontSize="xs"
                    >
                      {badge}
                    </Badge>
                  ))}
                </Flex>
              </Box>
              <Box w="200px" mr={4}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color={textColor}>
                    {metric.value}{metric.unit}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={metric.change > 0 ? 'green.500' : 'red.500'}
                  >
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </Text>
                </Flex>
                <Progress
                  value={progressValue}
                  size="sm"
                  colorScheme="blue"
                  bg={progressTrackColor}
                  borderRadius="full"
                />
              </Box>
              {index === 0 && (
                <Tooltip label="Top Performer">
                  <Icon as={StarIcon} w={5} h={5} color="yellow.400" />
                </Tooltip>
              )}
            </Flex>
          );
        })}
      </Box>
    </Box>
  );
};
