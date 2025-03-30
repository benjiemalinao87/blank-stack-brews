import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputLeftElement,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Select,
  HStack,
  useColorModeValue,
  Flex
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, EditIcon, ViewIcon, ChevronDownIcon } from '@chakra-ui/icons';

/**
 * Campaign Manager 2.0 Component
 * 
 * Provides an interface for creating, managing, and tracking multi-day messaging campaigns
 */
const CampaignManager = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Color mode values
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const badgeBg = {
    ACTIVE: 'green.100',
    DRAFT: 'gray.100',
    COMPLETED: 'blue.100'
  };
  const badgeColor = {
    ACTIVE: 'green.800',
    DRAFT: 'gray.800',
    COMPLETED: 'blue.800'
  };

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || campaign.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <Box p={6} h="100%" overflowY="auto">
      <Box mb={6}>
        <Heading size="lg" mb={1}>Campaign Manager 2.0</Heading>
        <Text color="gray.500">Create, manage, and track sophisticated multi-day messaging campaigns</Text>
      </Box>

      <Tabs colorScheme="purple" index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>Campaigns</Tab>
          <Tab>Templates</Tab>
          <Tab>Analytics</Tab>
          <Tab>Settings</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <Flex justify="space-between" my={4}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search campaigns..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>

              <HStack spacing={4}>
                <Select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  width="180px"
                >
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Draft</option>
                  <option>Completed</option>
                </Select>

                <Button 
                  leftIcon={<AddIcon />} 
                  colorScheme="purple" 
                  variant="solid"
                  onClick={() => {/* Handle new campaign */}}
                >
                  New Campaign
                </Button>
              </HStack>
            </Flex>

            <Box 
              borderWidth="1px" 
              borderRadius="md" 
              borderColor={borderColor}
              overflow="hidden"
              mt={4}
            >
              <Table variant="simple">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th>NAME</Th>
                    <Th>STATUS</Th>
                    <Th>TYPE</Th>
                    <Th>RECIPIENTS</Th>
                    <Th>OPEN RATE</Th>
                    <Th>CREATED</Th>
                    <Th>ACTIONS</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredCampaigns.map(campaign => (
                    <Tr key={campaign.id}>
                      <Td>
                        <Box>
                          <Text fontWeight="medium">{campaign.name}</Text>
                          <Text fontSize="sm" color="gray.500">{campaign.description}</Text>
                        </Box>
                      </Td>
                      <Td>
                        <Badge 
                          bg={badgeBg[campaign.status]} 
                          color={badgeColor[campaign.status]}
                          textTransform="capitalize"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {campaign.status.toLowerCase()}
                        </Badge>
                      </Td>
                      <Td>{campaign.type}</Td>
                      <Td isNumeric>{campaign.recipients}</Td>
                      <Td isNumeric>{campaign.openRate}%</Td>
                      <Td>{campaign.created}</Td>
                      <Td>
                        <HStack spacing={1}>
                          <IconButton
                            icon={<EditIcon />}
                            aria-label="Edit campaign"
                            variant="ghost"
                            size="sm"
                          />
                          <IconButton
                            icon={<ViewIcon />}
                            aria-label="View campaign"
                            variant="ghost"
                            size="sm"
                          />
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<ChevronDownIcon />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem>Duplicate</MenuItem>
                              <MenuItem>Export Data</MenuItem>
                              <MenuItem color="red.500">Delete</MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>

          <TabPanel>
            <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
              <Text fontSize="lg" fontWeight="medium">Message Templates</Text>
              <Text color="gray.500">Create and manage reusable message templates for your campaigns.</Text>
            </Box>
          </TabPanel>

          <TabPanel>
            <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
              <Text fontSize="lg" fontWeight="medium">Campaign Analytics</Text>
              <Text color="gray.500">View performance metrics for your messaging campaigns.</Text>
            </Box>
          </TabPanel>

          <TabPanel>
            <Box p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
              <Text fontSize="lg" fontWeight="medium">Campaign Settings</Text>
              <Text color="gray.500">Configure global settings for your messaging campaigns.</Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

// Mock data for development
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'Welcome Series',
    description: 'A 3-day welcome series for new customers',
    status: 'ACTIVE',
    type: 'Sequence',
    recipients: 152,
    openRate: 78,
    created: '24/03/2025'
  },
  {
    id: '2',
    name: 'Product Announcement',
    description: 'New product feature announcement to all users',
    status: 'DRAFT',
    type: 'Single Broadcast',
    recipients: 0,
    openRate: 0,
    created: '23/03/2025'
  },
  {
    id: '3',
    name: 'Special Offer - March',
    description: 'Limited time offer for premium customers',
    status: 'COMPLETED',
    type: 'Single Broadcast',
    recipients: 250,
    openRate: 62,
    created: '15/03/2025'
  }
];

export default CampaignManager; 