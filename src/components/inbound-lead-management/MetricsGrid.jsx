import React from 'react';
import { SimpleGrid, Box, Flex, Text, useColorModeValue, Icon } from '@chakra-ui/react';
import { Users, Zap, Clock, CheckCircle, Calendar, BarChart2, Globe, TrendingUp, ChevronDown } from 'lucide-react';
import MetricsCard from '../common/MetricsCard';

/**
 * MetricsGrid - A component that displays metrics cards in a compact grid layout
 * 
 * @param {Object} props
 * @param {Object} props.metrics - Object containing metrics data
 * @param {string} props.title - Section title
 * @param {boolean} props.isCollapsible - Whether the section is collapsible
 * @param {boolean} props.isCollapsed - Whether the section is collapsed
 * @param {Function} props.onToggleCollapse - Function to toggle collapse state
 */
const MetricsGrid = ({
  metrics = {},
  title = "Metrics",
  isCollapsible = true,
  isCollapsed = false,
  onToggleCollapse = () => {},
}) => {
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const chevronColor = useColorModeValue('gray.500', 'gray.400');

  // Define metrics cards configuration
  const mainMetricsConfig = [
    {
      id: 'totalLeads',
      title: 'Total Leads',
      value: metrics.totalLeads || 0,
      subtitle: 'Total leads in queue',
      icon: Users,
      colorScheme: 'blue'
    },
    {
      id: 'newLeads',
      title: 'New Leads',
      value: metrics.newLeads || 0,
      subtitle: 'Unprocessed new leads',
      icon: Zap,
      colorScheme: 'yellow'
    },
    {
      id: 'pending',
      title: 'Pending',
      value: metrics.pending || 0,
      subtitle: 'Awaiting checkout',
      icon: Clock,
      colorScheme: 'purple'
    },
    {
      id: 'checkedOut',
      title: 'Checked Out',
      value: metrics.checkedOut || 0,
      subtitle: 'Assigned to agents',
      icon: CheckCircle,
      colorScheme: 'green'
    }
  ];

  const insightsConfig = [
    {
      id: 'todayActivity',
      title: 'Today\'s Activity',
      value: `${metrics.todayLeads || 0} leads`,
      subtitle: 'New leads received today',
      icon: Calendar,
      colorScheme: 'pink'
    },
    {
      id: 'topProduct',
      title: 'Top Product',
      value: metrics.topProduct || 'None',
      subtitle: 'Most requested product',
      icon: BarChart2,
      colorScheme: 'teal'
    },
    {
      id: 'topSource',
      title: 'Top Source',
      value: metrics.topSource || 'None',
      subtitle: 'Highest lead source',
      icon: Globe,
      colorScheme: 'cyan'
    },
    {
      id: 'conversionRate',
      title: 'Conversion Rate',
      value: metrics.conversionRate || '0%',
      subtitle: 'Lead to customer rate',
      icon: TrendingUp,
      colorScheme: 'red'
    }
  ];

  return (
    <Box mb={3}>
      {/* Section Header */}
      {title && (
        <Flex
          py={2}
          px={3}
          mb={2}
          bg={headerBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={headerBorderColor}
          justifyContent="space-between"
          alignItems="center"
          cursor={isCollapsible ? 'pointer' : 'default'}
          onClick={isCollapsible ? onToggleCollapse : undefined}
          fontSize="sm"
        >
          <Text fontWeight="medium" fontSize="sm">{title}</Text>
          {isCollapsible && (
            <Box 
              as="span" 
              transform={isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'}
              transition="transform 0.2s"
              color={chevronColor}
            >
              <Icon as={ChevronDown} boxSize={4} />
            </Box>
          )}
        </Flex>
      )}

      {/* Metrics Grid */}
      {!isCollapsed && (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
          {title === "Main Metrics" && 
            mainMetricsConfig.map(metric => (
              <MetricsCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
                icon={metric.icon}
                colorScheme={metric.colorScheme}
              />
            ))
          }
          
          {title === "Insights" && 
            insightsConfig.map(metric => (
              <MetricsCard
                key={metric.id}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
                icon={metric.icon}
                colorScheme={metric.colorScheme}
              />
            ))
          }
        </SimpleGrid>
      )}
    </Box>
  );
};

export default MetricsGrid; 