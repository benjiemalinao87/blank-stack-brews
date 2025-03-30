import React, { useState } from 'react';
import {
  SimpleGrid,
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  Avatar,
  useColorModeValue,
  VStack,
  HStack,
  Divider,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton
} from '@chakra-ui/react';
import { Phone, Mail, MoreVertical, MapPin, Calendar, CheckCircle, Clock } from 'lucide-react';
import CountBadge from '../common/CountBadge';

const LeadGridView = ({ 
  leads, 
  selectedLeads, 
  onSelectLead, 
  onViewDetails, 
  formatDate 
}) => {
  const [groupBy, setGroupBy] = useState('status');
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  
  // Group leads by the selected property
  const groupedLeads = leads.reduce((groups, lead) => {
    const key = groupBy === 'status' ? lead.status : 
               groupBy === 'source' ? lead.source : 
               groupBy === 'product' ? lead.product : 'other';
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    groups[key].push(lead);
    return groups;
  }, {});
  
  // Format group names for display
  const formatGroupName = (key) => {
    if (groupBy === 'status') {
      return key === 'new' ? 'New' : 
             key === 'pending' ? 'Pending' : 
             key === 'checked_out' ? 'Checked Out' : key;
    }
    return key;
  };
  
  // Get icon for group
  const getGroupIcon = (key) => {
    if (groupBy === 'status') {
      return key === 'new' ? Clock : 
             key === 'pending' ? Calendar : 
             key === 'checked_out' ? CheckCircle : null;
    }
    return null;
  };
  
  // Get color scheme for group
  const getGroupColorScheme = (key) => {
    if (groupBy === 'status') {
      return key === 'new' ? 'yellow' : 
             key === 'pending' ? 'orange' : 
             key === 'checked_out' ? 'green' : 'gray';
    } else if (groupBy === 'source') {
      return key === 'Online' ? 'blue' :
             key === 'Mobile' ? 'purple' :
             key === 'Email' ? 'green' :
             key === 'Partner' ? 'orange' :
             key === 'Support' ? 'red' :
             key === 'Retail' ? 'yellow' : 'gray';
    }
    return 'blue';
  };

  return (
    <Box>
      <Flex justifyContent="space-between" mb={4}>
        <HStack>
          <Text fontWeight="medium">Group by:</Text>
          <Button 
            size="sm" 
            variant={groupBy === 'status' ? 'solid' : 'outline'} 
            onClick={() => setGroupBy('status')}
            mr={2}
          >
            Status
          </Button>
          <Button 
            size="sm" 
            variant={groupBy === 'source' ? 'solid' : 'outline'} 
            onClick={() => setGroupBy('source')}
            mr={2}
          >
            Source
          </Button>
          <Button 
            size="sm" 
            variant={groupBy === 'product' ? 'solid' : 'outline'} 
            onClick={() => setGroupBy('product')}
          >
            Product
          </Button>
        </HStack>
      </Flex>
      
      {Object.keys(groupedLeads).map(group => {
        const GroupIcon = getGroupIcon(group);
        const colorScheme = getGroupColorScheme(group);
        
        return (
          <Box key={group} mb={6}>
            <Flex alignItems="center" mb={3}>
              <CountBadge
                label={formatGroupName(group)}
                count={groupedLeads[group].length}
                icon={GroupIcon}
                colorScheme={colorScheme}
                mb={2}
              />
            </Flex>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
              {groupedLeads[group].map(lead => (
                <Box
                  key={lead.id}
                  bg={cardBg}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                  p={4}
                  boxShadow="sm"
                  cursor="pointer"
                  onClick={() => onViewDetails(lead.id)}
                  position="relative"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                >
                  <Flex position="absolute" top={2} right={2}>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<MoreVertical size={16} />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList>
                        <MenuItem onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(lead.id);
                        }}>View Details</MenuItem>
                        <MenuItem onClick={(e) => {
                          e.stopPropagation();
                          // Add checkout action
                        }}>Check Out</MenuItem>
                        <MenuItem onClick={(e) => {
                          e.stopPropagation();
                          // Add assign action
                        }}>Assign</MenuItem>
                      </MenuList>
                    </Menu>
                  </Flex>
                  
                  <Flex mb={3}>
                    <Avatar size="md" name={`${lead.firstName} ${lead.lastName}`} mr={3} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" color={textColor}>{`${lead.firstName} ${lead.lastName}`}</Text>
                      <Text fontSize="sm" color={secondaryTextColor}>{lead.product}</Text>
                    </VStack>
                  </Flex>
                  
                  <Divider my={2} />
                  
                  <VStack align="start" spacing={2} mt={2}>
                    <Flex align="center">
                      <MapPin size={14} color={secondaryTextColor} />
                      <Text ml={2} fontSize="sm" color={secondaryTextColor}>{`${lead.city}, ${lead.state}`}</Text>
                    </Flex>
                    <Flex align="center">
                      <Phone size={14} color={secondaryTextColor} />
                      <Text ml={2} fontSize="sm" color={secondaryTextColor}>{lead.phone}</Text>
                    </Flex>
                    <Flex align="center">
                      <Mail size={14} color={secondaryTextColor} />
                      <Text ml={2} fontSize="sm" color={secondaryTextColor}>{lead.email}</Text>
                    </Flex>
                    <Flex align="center">
                      <Calendar size={14} color={secondaryTextColor} />
                      <Text ml={2} fontSize="sm" color={secondaryTextColor}>{formatDate(lead.received)}</Text>
                    </Flex>
                  </VStack>
                  
                  <Flex mt={3} justifyContent="space-between" alignItems="center">
                    <Badge colorScheme={
                      lead.source === 'Online' ? 'blue' :
                      lead.source === 'Mobile' ? 'purple' :
                      lead.source === 'Email' ? 'green' :
                      lead.source === 'Partner' ? 'orange' :
                      lead.source === 'Support' ? 'red' :
                      lead.source === 'Retail' ? 'yellow' :
                      'gray'
                    }>
                      {lead.source}
                    </Badge>
                    <Badge colorScheme={
                      lead.priority === 'low' ? 'gray' :
                      lead.priority === 'medium' ? 'blue' :
                      lead.priority === 'high' ? 'orange' :
                      lead.priority === 'urgent' ? 'red' :
                      'gray'
                    }>
                      {lead.priority}
                    </Badge>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        );
      })}
    </Box>
  );
};

export default LeadGridView; 