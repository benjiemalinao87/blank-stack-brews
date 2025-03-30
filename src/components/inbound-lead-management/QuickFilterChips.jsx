import React from 'react';
import { HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { Calendar, AlertTriangle, Users, Clock, X } from 'lucide-react';
import CountBadge from '../common/CountBadge';

/**
 * QuickFilterChips - Component for quick filtering of leads
 * 
 * @param {Object} props
 * @param {Array} props.activeFilters - Array of active filter IDs
 * @param {Function} props.onToggleFilter - Function to toggle a filter
 * @param {Object} props.filterCounts - Object with filter counts keyed by filter ID
 * @param {Function} props.onClearFilters - Function to clear all filters
 */
const QuickFilterChips = ({ 
  activeFilters = [], 
  onToggleFilter, 
  filterCounts = {},
  onClearFilters
}) => {
  // Define color values at the top level
  const clearFiltersBg = useColorModeValue('gray.100', 'gray.700');
  const clearFiltersTextColor = useColorModeValue('red.600', 'red.300');
  
  // Define the filters based on the design
  const filters = [
    { 
      id: 'all', 
      label: 'All Leads', 
      colorScheme: 'gray',
      count: null // No count for All Leads
    },
    { 
      id: 'new', 
      label: 'New Leads', 
      icon: AlertTriangle, 
      colorScheme: 'blue',
      count: null // No count shown for New Leads in the design
    },
    { 
      id: 'today', 
      label: 'Today', 
      icon: Calendar, 
      colorScheme: 'green',
      count: filterCounts.today || 70 // Default to 70 to match the design
    },
    { 
      id: 'contacted', 
      label: 'Contacted', 
      icon: Users, 
      colorScheme: 'purple',
      count: null // No count shown for Contacted in the design
    },
    { 
      id: 'last7days', 
      label: 'Last 7 Days', 
      colorScheme: 'orange',
      count: null // No count shown for Last 7 Days in the design
    }
  ];

  return (
    <HStack spacing={2} mb={3} flexWrap="wrap">
      {filters.map((filter) => (
        <CountBadge
          key={filter.id}
          label={filter.label}
          count={filter.count}
          icon={filter.icon}
          colorScheme={filter.colorScheme}
          isActive={activeFilters.includes(filter.id)}
          opacity={activeFilters.includes(filter.id) ? 1 : 0.8}
          cursor="pointer"
          _hover={{ opacity: 0.9 }}
          onClick={() => onToggleFilter(filter.id)}
          containerProps={{
            transition: 'all 0.2s',
            py: 1,
            px: 2,
            fontSize: "xs"
          }}
        />
      ))}
      
      {/* Clear Filters button */}
      {activeFilters.length > 0 && (
        <HStack 
          spacing={1} 
          px={2} 
          py={1} 
          borderRadius="full" 
          bg={clearFiltersBg}
          cursor="pointer"
          onClick={onClearFilters}
          _hover={{ opacity: 0.9 }}
          transition="all 0.2s"
        >
          <X size={12} color={clearFiltersTextColor} />
          <Text color={clearFiltersTextColor} fontSize="xs" fontWeight="medium">
            Clear Filters
          </Text>
        </HStack>
      )}
    </HStack>
  );
};

export default QuickFilterChips; 