import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Grid,
  GridItem,
  useColorModeValue,
  Button,
  ButtonGroup,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
} from '@chakra-ui/react';
import { DraggableWindow } from '../window/DraggableWindow';
import { AgentMetrics } from './AgentMetrics';
import { MessageMetrics } from './MessageMetrics';
import { TimelineChart } from './TimelineChart';
import { MessageVolumeChart } from './MessageVolumeChart';
import { TextingMetrics } from './TextingMetrics';
import { AgentLeaderboard } from './AgentLeaderboard';

const TimeRangeSelector = ({ timeRange, setTimeRange }) => {
  const buttonBg = useColorModeValue('gray.100', 'gray.700');
  const activeButtonBg = useColorModeValue('white', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <ButtonGroup
      size="sm"
      isAttached
      variant="outline"
      spacing={0}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      p="2px"
      bg={buttonBg}
    >
      {[
        { label: '24h', value: '24h' },
        { label: '7d', value: '7d' },
        { label: '30d', value: '30d' },
        { label: '90d', value: '90d' },
      ].map(({ label, value }) => (
        <Button
          key={value}
          onClick={() => setTimeRange(value)}
          bg={timeRange === value ? activeButtonBg : 'transparent'}
          borderRadius="lg"
          border="none"
          _hover={{
            bg: activeButtonBg,
          }}
          px={4}
        >
          {label}
        </Button>
      ))}
    </ButtonGroup>
  );
};

const AnalyticsContent = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState(0);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
  const tabBg = useColorModeValue('gray.100', 'gray.700');
  const activeTabBg = useColorModeValue('white', 'gray.600');

  return (
    <Box h="100%" bg={bgColor} p={6} display="flex" flexDirection="column">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="medium">Analytics</Text>
        <TimeRangeSelector timeRange={timeRange} setTimeRange={setTimeRange} />
      </Flex>

      {/* Tabs */}
      <Tabs 
        variant="enclosed" 
        onChange={setActiveTab} 
        display="flex" 
        flexDirection="column"
        flex="1"
        h="0"
      >
        <TabList>
          <Tab
            _selected={{
              bg: activeTabBg,
              borderColor: borderColor,
              borderBottom: 'none',
            }}
          >
            Overview
          </Tab>
          <Tab
            _selected={{
              bg: activeTabBg,
              borderColor: borderColor,
              borderBottom: 'none',
            }}
          >
            Detailed Metrics
          </Tab>
        </TabList>

        <TabPanels flex="1" overflow="hidden" display="flex" flexDirection="column">
          <TabPanel p={0} flex="1" overflow="auto" display="flex" flexDirection="column">
            <Grid
              templateColumns="repeat(12, 1fr)"
              gap={6}
              flex="1"
              overflow="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: useColorModeValue('gray.300', 'gray.600'),
                  borderRadius: '24px',
                },
              }}
            >
              {/* Message Volume Chart */}
              <Box
                gridColumn="span 8"
                bg={sectionBg}
                p={6}
                borderRadius="2xl"
                border="1px"
                borderColor={borderColor}
              >
                <MessageVolumeChart
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
              </Box>

              {/* Agent Performance */}
              <Box
                gridColumn="span 4"
                bg={sectionBg}
                p={6}
                borderRadius="2xl"
                border="1px"
                borderColor={borderColor}
              >
                <AgentMetrics
                  timeRange={timeRange}
                />
              </Box>

              {/* Real-time Activity */}
              <Box
                gridColumn="span 6"
                bg={sectionBg}
                p={6}
                borderRadius="2xl"
                border="1px"
                borderColor={borderColor}
              >
                <TimelineChart
                  title="Real-time Activity"
                  timeRange={timeRange}
                />
              </Box>

              {/* Message Analytics */}
              <Box
                gridColumn="span 6"
                bg={sectionBg}
                p={6}
                borderRadius="2xl"
                border="1px"
                borderColor={borderColor}
              >
                <MessageMetrics
                  timeRange={timeRange}
                />
              </Box>
            </Grid>
          </TabPanel>

          <TabPanel p={0} flex="1" overflow="auto">
            <Grid
              templateColumns="repeat(2, 1fr)"
              gap={6}
              p={6}
            >
              <GridItem colSpan={2}>
                <MessageVolumeChart timeRange={timeRange} />
              </GridItem>
              <GridItem colSpan={2}>
                <TextingMetrics timeRange={timeRange} />
              </GridItem>
              <GridItem colSpan={2}>
                <AgentLeaderboard timeRange={timeRange} />
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

const AnalyticsWindow = ({ onClose }) => {
  return (
    <DraggableWindow
      title="Analytics"
      defaultSize={{ width: 1400, height: 900 }}
      minSize={{ width: 1000, height: 700 }}
      onClose={onClose}
    >
      <AnalyticsContent />
    </DraggableWindow>
  );
};

export default AnalyticsWindow;
