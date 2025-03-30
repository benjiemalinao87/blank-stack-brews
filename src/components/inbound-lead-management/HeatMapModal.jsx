import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  IconButton,
  useColorModeValue,
  Button,
  HStack,
  Select,
  VStack,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  useDisclosure,
  Spacer,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Treemap,
  ResponsiveContainer,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
} from 'recharts';
import {
  X,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronDown,
  Clock,
  MessageSquarePlus,
} from 'lucide-react';

// Enhanced mock data with trends
const mockHeatMapData = {
  bySource: [
    { name: 'Online', value: 3, trend: '+15%', color: '#3182CE', lastPeriod: 2.6 },
    { name: 'Mobile', value: 1, trend: '-5%', color: '#805AD5', lastPeriod: 1.05 },
    { name: 'Email', value: 1, trend: '+10%', color: '#38A169', lastPeriod: 0.9 },
    { name: 'Partner', value: 1, trend: '0%', color: '#DD6B20', lastPeriod: 1 },
    { name: 'Support', value: 1, trend: '+20%', color: '#E53E3E', lastPeriod: 0.8 },
    { name: 'Retail', value: 1, trend: '-8%', color: '#D69E2E', lastPeriod: 1.08 },
    { name: 'Social', value: 1, trend: '+25%', color: '#319795', lastPeriod: 0.75 },
    { name: 'Other', value: 1, trend: '-3%', color: '#718096', lastPeriod: 1.03 },
  ],
  byProduct: [
    { name: 'MacBook Pro', value: 1, trend: '+12%', color: '#3182CE', lastPeriod: 0.88 },
    { name: 'iPhone 14 Pro', value: 1, trend: '+8%', color: '#805AD5', lastPeriod: 0.92 },
    { name: 'iPhone 14', value: 1, trend: '-5%', color: '#38A169', lastPeriod: 1.05 },
    { name: 'iPad Pro', value: 1, trend: '+15%', color: '#DD6B20', lastPeriod: 0.85 },
    { name: 'AirPods Pro', value: 1, trend: '+20%', color: '#E53E3E', lastPeriod: 0.8 },
    { name: 'Mac Studio', value: 1, trend: '-10%', color: '#D69E2E', lastPeriod: 1.1 },
    { name: 'iCloud+ Subscription', value: 1, trend: '+30%', color: '#319795', lastPeriod: 0.7 },
    { name: 'Apple TV 4K', value: 1, trend: '-15%', color: '#718096', lastPeriod: 1.15 },
    { name: 'HomePod Mini', value: 1, trend: '+5%', color: '#4A5568', lastPeriod: 0.95 },
    { name: 'Final Cut Pro', value: 1, trend: '+18%', color: '#2C7A7B', lastPeriod: 0.82 },
  ],
};

const timeRanges = [
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Custom Range', value: 'custom' },
];

const MotionBox = motion(Box);

const HeatMapModal = ({ isOpen, onClose }) => {
  const [visualizationType, setVisualizationType] = useState('treemap');
  const [dataType, setDataType] = useState('source');
  const [timeRange, setTimeRange] = useState('24h');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState(null);
  const { isOpen: isTooltipOpen, onOpen: onTooltipOpen, onClose: onTooltipClose } = useDisclosure();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const tooltipBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const treemapTextColor = useColorModeValue('gray.800', 'white');
  
  // Auto-refresh effect
  useEffect(() => {
    let interval;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        // Simulate data refresh
        setLastUpdated(new Date());
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  if (!isOpen) return null;
  
  const data = dataType === 'source' ? mockHeatMapData.bySource : mockHeatMapData.byProduct;
  
  // Custom treemap content
  const CustomTreemapContent = ({ root, depth, x, y, width, height, index, name, value, trend }) => {
    const isSmall = width < 100 || height < 100;
    const data = root.children[index];
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={data.color}
          stroke={borderColor}
          strokeWidth={1}
          style={{
            cursor: 'pointer',
            transition: 'fill 0.3s',
          }}
        />
        {!isSmall && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 20}
              textAnchor="middle"
              fill={treemapTextColor}
              fontSize={14}
              fontWeight="bold"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              fill={treemapTextColor}
              fontSize={18}
              fontWeight="bold"
            >
              {value}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 20}
              textAnchor="middle"
              fill={treemapTextColor}
              fontSize={12}
            >
              {trend}
            </text>
          </>
        )}
      </g>
    );
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <Box
          bg={tooltipBg}
          p={3}
          borderRadius="md"
          boxShadow="lg"
          border="1px solid"
          borderColor={borderColor}
        >
          <Text fontWeight="bold">{item.name}</Text>
          <Text>Value: {item.value} leads</Text>
          <Text color={item.trend.startsWith('+') ? 'green.500' : 'red.500'}>
            Trend: {item.trend}
          </Text>
          <Text fontSize="sm" color="gray.500">
            vs Last Period: {item.lastPeriod} leads
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={99998}
        onClick={onClose}
      />
      
      {/* Modal */}
      <MotionBox
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%) !important"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        zIndex={99999}
        width="90%"
        maxWidth="1200px"
        height="80vh"
        maxHeight="90vh"
        bg={bgColor}
        borderRadius="lg"
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <Flex 
          p={4} 
          borderBottom="1px solid" 
          borderColor={borderColor}
          bg={headerBg}
          justifyContent="space-between"
          alignItems="center"
        >
          <HStack spacing={4}>
            <Heading size="md">Lead Distribution Heat Map</Heading>
            <Badge colorScheme="green" variant="subtle">
              Live
            </Badge>
          </HStack>
          <HStack spacing={4}>
            <Text fontSize="sm" color="gray.500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
            <IconButton
              icon={<X size={18} />}
              aria-label="Close"
              variant="ghost"
              onClick={onClose}
            />
          </HStack>
        </Flex>
        
        {/* Controls */}
        <Flex p={4} borderBottom="1px solid" borderColor={borderColor} justifyContent="space-between">
          <HStack spacing={4}>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDown />} size="sm">
                {timeRanges.find(r => r.value === timeRange)?.label}
              </MenuButton>
              <MenuList>
                {timeRanges.map((range) => (
                  <MenuItem
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                  >
                    {range.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            <Select 
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              width="200px"
              size="sm"
            >
              <option value="source">By Source</option>
              <option value="product">By Product</option>
            </Select>
            
            <HStack>
              <Button
                leftIcon={<BarChart2 size={16} />}
                variant={visualizationType === 'treemap' ? 'solid' : 'outline'}
                colorScheme="purple"
                onClick={() => setVisualizationType('treemap')}
                size="sm"
              >
                Treemap
              </Button>
              <Button
                leftIcon={<PieChartIcon size={16} />}
                variant={visualizationType === 'piechart' ? 'solid' : 'outline'}
                colorScheme="purple"
                onClick={() => setVisualizationType('piechart')}
                size="sm"
              >
                Pie Chart
              </Button>
            </HStack>
          </HStack>

          <HStack spacing={4}>
            <Button
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              variant="ghost"
              onClick={() => setLastUpdated(new Date())}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              leftIcon={<Clock size={16} />}
              variant={isAutoRefresh ? 'solid' : 'outline'}
              colorScheme={isAutoRefresh ? 'green' : 'gray'}
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            >
              Auto Refresh
            </Button>
          </HStack>
        </Flex>
        
        {/* Visualization */}
        <Box p={6} height="calc(100% - 140px)" overflowY="auto" bg={bgColor}>
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="sm">
              {dataType === 'source' ? 'Lead Distribution by Source' : 'Lead Distribution by Product'}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {timeRanges.find(r => r.value === timeRange)?.label} • {isAutoRefresh ? 'Auto-refreshing' : 'Manual refresh'}
            </Text>
          </Flex>
          
          <Box height="calc(100% - 40px)" bg={bgColor}>
            <ResponsiveContainer width="100%" height="100%">
              {visualizationType === 'treemap' ? (
                <Treemap
                  data={data}
                  dataKey="value"
                  aspectRatio={4/3}
                  stroke={borderColor}
                  content={<CustomTreemapContent />}
                >
                  <RechartsTooltip content={<CustomTooltip />} />
                </Treemap>
              ) : (
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    innerRadius={80}
                    paddingAngle={2}
                    onMouseEnter={(data, index) => {
                      setSelectedItem(data);
                      onTooltipOpen();
                    }}
                    onMouseLeave={() => {
                      setSelectedItem(null);
                      onTooltipClose();
                    }}
                  >
                    {data.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                    <RechartsTooltip content={<CustomTooltip />} />
                  </Pie>
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Box>
      </MotionBox>
    </>
  );
};

export default HeatMapModal; 