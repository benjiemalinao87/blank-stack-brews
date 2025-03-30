import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Spinner
} from '@chakra-ui/react';
import { 
  Search2Icon, 
  AddIcon, 
  ChevronDownIcon,
  EditIcon,
  CopyIcon,
  DeleteIcon,
  ViewIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { supabase } from '../../lib/supabaseUnified';
import { useToast } from '@chakra-ui/react';
import CampaignModal from './CampaignModal';
import { useNavigate } from 'react-router-dom';

/**
 * Campaign Dashboard Component
 * 
 * Displays a list of all campaigns with filtering, sorting, and action buttons.
 * Also handles creation of new campaigns and management of existing ones.
 */
const CampaignDashboard = ({ workspaceId, onNewCampaign, onEditCampaign, onViewCampaign }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Colors for different status badges
  const statusColors = {
    draft: 'gray',
    active: 'green',
    scheduled: 'purple',
    paused: 'yellow',
    completed: 'blue',
    cancelled: 'red'
  };
  
  // Near the beginning of the component, add this constant
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Fetch campaigns on component mount or workspace change
  useEffect(() => {
    if (workspaceId) {
      fetchCampaigns();
    }
  }, [workspaceId, sortField, sortDirection]);
  
  // Fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real campaigns from Supabase
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          description,
          status,
          type,
          audience_criteria,
          sent_at,
          scheduled_at,
          created_at,
          updated_at
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (error) throw error;
      
      // Process campaigns to add recipient counts and open rates
      const processedCampaigns = await Promise.all(data.map(async (campaign) => {
        // Check for scheduled campaigns that still show as draft
        if (campaign.status === 'draft' && campaign.scheduled_at) {
          campaign.status = 'scheduled';
        }
        
        // Check for scheduled campaigns that should be marked as completed
        const now = new Date();
        if (campaign.status === 'scheduled' && campaign.scheduled_at) {
          const scheduledDate = new Date(campaign.scheduled_at);
          
          // If the scheduled time is in the past, mark as completed
          // Adding a 5-minute buffer for processing time
          if (scheduledDate.getTime() < now.getTime() - (5 * 60 * 1000)) {
            campaign.status = 'completed';
            console.log(`Campaign ${campaign.id} (${campaign.name}) marked as completed - scheduled at ${scheduledDate.toLocaleString()}, now is ${now.toLocaleString()}`);
            
            // Update the campaign status in the database
            try {
              const { error: updateError } = await supabase
                .from('campaigns')
                .update({
                  status: 'completed',
                  updated_at: now.toISOString()
                })
                .eq('id', campaign.id);
              
              if (updateError) {
                console.error(`Error updating campaign ${campaign.id} status to 'completed':`, updateError);
              }
            } catch (updateErr) {
              console.error(`Error updating campaign ${campaign.id} status:`, updateErr);
            }
          }
        }
        
        // Get recipient count based on audience criteria
        let recipientCount = 0;
        let deliveredCount = 0;
        let openRate = 0;
        
        try {
          if (campaign.audience_criteria) {
            const { data: countData } = await supabase.rpc(
              'get_broadcast_recipients_count_v1',
              {
                p_workspace_id: workspaceId,
                p_filters: campaign.audience_criteria
              }
            );
            recipientCount = countData || 0;
          }
          
          // TODO: In the future, fetch actual delivery and open stats from activities table
          // For now, use a random open rate for active/completed campaigns
          if (campaign.status === 'active' || campaign.status === 'completed') {
            deliveredCount = Math.floor(recipientCount * 0.95); // Assume 95% delivery rate
            openRate = Math.floor(Math.random() * 40) + 30; // Random between 30-70%
          }
        } catch (countError) {
          console.error('Error fetching recipient count:', countError);
        }
        
        return {
          ...campaign,
          recipients_count: recipientCount,
          delivered_count: deliveredCount,
          open_rate: openRate
        };
      }));
      
      setCampaigns(processedCampaigns);
      console.log("Fetched real campaigns:", processedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error fetching campaigns',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // Handle creating a new campaign
  const handleCreateCampaign = () => {
    // Use the prop if available, otherwise fallback to navigation
    if (onNewCampaign) {
      onNewCampaign();
    } else {
      // Fallback to direct navigation for backward compatibility
      navigate('/broadcast2/sequence/new');
    }
  };
  
  // Handle editing a campaign
  const handleEditCampaign = (campaign) => {
    // Use the prop if available, otherwise fallback to navigation
    if (onEditCampaign) {
      onEditCampaign(campaign.id);
    } else {
      // Fallback to direct navigation for backward compatibility
      navigate(`/broadcast2/sequence/${campaign.id}`);
    }
  };
  
  // Handle viewing a campaign
  const handleViewCampaign = (campaign) => {
    // Use the prop if available, otherwise fallback to navigation
    if (onViewCampaign) {
      onViewCampaign(campaign.id);
    } else {
      // Fallback to direct navigation for backward compatibility
      navigate(`/broadcast2/analytics/${campaign.id}`);
    }
  };
  
  // Handle duplicating a campaign
  const handleDuplicateCampaign = async (campaign) => {
    try {
      // Create a duplicate campaign with 'draft' status
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...campaign,
          id: undefined, // Remove ID so Supabase generates a new one
          name: `${campaign.name} (Copy)`,
          status: 'draft',
          sent_at: null,
          scheduled_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh campaigns list
      fetchCampaigns();
      
      toast({
        title: 'Campaign duplicated',
        description: 'Campaign has been duplicated as a draft.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Use the prop if available, otherwise fallback to navigation
      if (onEditCampaign && data) {
        onEditCampaign(data.id);
      } else if (data) {
        // Fallback to direct navigation for backward compatibility
        navigate(`/broadcast2/sequence/${data.id}`);
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast({
        title: 'Error duplicating campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle deleting a campaign
  const handleDeleteCampaign = async (campaign) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id);
      
      if (error) throw error;
      
      // Remove campaign from local state
      setCampaigns(campaigns.filter(c => c.id !== campaign.id));
      
      toast({
        title: 'Campaign deleted',
        description: 'Campaign has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error deleting campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Filter campaigns based on search query and status filter
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      (campaign.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       campaign.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Format campaign type for display
  const formatCampaignType = (type) => {
    if (type === 'sequence') return 'Sequence';
    if (type === 'broadcast') return 'Single Broadcast';
    return type || 'Unknown';
  };
  
  // Background colors
  const bg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Force update campaign statuses (for manual refresh)
  const updateCampaignStatuses = async () => {
    try {
      console.log('Triggering server-side campaign status update...');
      
      // Call the RPC function to update statuses on the server
      const { data, error } = await supabase.rpc('trigger_update_campaign_statuses');
      
      if (error) {
        throw error;
      }
      
      console.log('Server-side status update result:', data);
      
      if (data.success) {
        toast({
          title: 'Campaign statuses updated',
          description: `Updated ${data.updated_count || 0} campaign(s) to their current status`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh the campaign list to show updated statuses
        fetchCampaigns();
      } else {
        console.error('Error from server:', data.message);
        toast({
          title: 'Error updating campaign statuses',
          description: data.message || 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error triggering status update:', error);
      
      // Fallback to client-side status checks if server function fails
      console.log('Falling back to client-side status checks...');
      updateCampaignStatusesClientSide();
    }
  };
  
  // Client-side fallback for updating campaign statuses
  const updateCampaignStatusesClientSide = async () => {
    try {
      // Get all campaigns with scheduled_at in the past
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
      
      console.log('Checking for campaigns that need status updates client-side...');
      
      // Find campaigns that need updating
      const updatedCampaigns = [];
      
      for (const campaign of campaigns) {
        let needsUpdate = false;
        let newStatus = campaign.status;
        
        // Check for scheduled campaigns that should be marked as completed
        if (campaign.status === 'scheduled' && campaign.scheduled_at) {
          const scheduledDate = new Date(campaign.scheduled_at);
          
          if (scheduledDate < fiveMinutesAgo) {
            needsUpdate = true;
            newStatus = 'completed';
            console.log(`Campaign ${campaign.id} (${campaign.name}) needs update to completed - scheduled at ${scheduledDate.toLocaleString()}`);
          }
        }
        
        // Check for active campaigns with sent_at in the past
        if (campaign.status === 'active' && campaign.sent_at) {
          const sentDate = new Date(campaign.sent_at);
          
          // If sent more than 24 hours ago, mark as completed 
          if (sentDate < new Date(now.getTime() - (24 * 60 * 60 * 1000))) {
            needsUpdate = true;
            newStatus = 'completed';
            console.log(`Campaign ${campaign.id} (${campaign.name}) needs update to completed - sent at ${sentDate.toLocaleString()}`);
          }
        }
        
        // Update campaign status in database if needed
        if (needsUpdate) {
          updatedCampaigns.push(campaign.id);
          
          try {
            const { error: updateError } = await supabase
              .from('campaigns')
              .update({
                status: newStatus,
                updated_at: now.toISOString()
              })
              .eq('id', campaign.id);
            
            if (updateError) {
              console.error(`Error updating campaign ${campaign.id} status:`, updateError);
            } else {
              console.log(`Successfully updated campaign ${campaign.id} status to ${newStatus}`);
            }
          } catch (updateErr) {
            console.error(`Error updating campaign ${campaign.id} status:`, updateErr);
          }
        }
      }
      
      // Refresh campaigns if any were updated
      if (updatedCampaigns.length > 0) {
        console.log(`Updated ${updatedCampaigns.length} campaigns, refreshing list...`);
        toast({
          title: 'Campaign statuses updated',
          description: `Updated ${updatedCampaigns.length} campaigns to their current status`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchCampaigns();
      } else {
        console.log('No campaigns needed status updates');
        toast({
          title: 'Campaign statuses up to date',
          description: 'All campaigns have the correct status',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating campaign statuses:', error);
      toast({
        title: 'Error updating campaign statuses',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box height="100%" display="flex" flexDirection="column">
      {/* Toolbar */}
      <Flex
        p={4}
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        bg={headerBg}
      >
        <HStack spacing={4} flex={1}>
          <InputGroup maxW="320px">
            <InputLeftElement pointerEvents="none">
              <Search2Icon color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Search campaigns..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          
          <Select 
            maxW="180px" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          
          <Select
            maxW="180px"
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortField(field);
              setSortDirection(direction);
            }}
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </Select>
          
          <Button
            variant="outline"
            colorScheme="blue"
            leftIcon={<RepeatIcon />}
            onClick={updateCampaignStatuses}
            size="md"
            title="Update campaign statuses"
          >
            Refresh Statuses
          </Button>
        </HStack>
        
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            leftIcon={<AddIcon />}
            colorScheme="purple"
          >
            New Campaign
          </MenuButton>
          <MenuList>
            <MenuItem onClick={handleCreateCampaign}>
              Standard Campaign
            </MenuItem>
            <MenuItem 
              onClick={handleCreateCampaign}
            >
              Sequence Campaign
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
      
      {/* Campaign List */}
      <Box flex="1" overflow="auto" p={0}>
        {isLoading ? (
          <Flex justify="center" align="center" height="100%">
            <Spinner size="xl" color="purple.500" />
          </Flex>
        ) : filteredCampaigns.length === 0 ? (
          <Flex 
            direction="column" 
            justify="center" 
            align="center" 
            height="100%" 
            p={10}
            textAlign="center"
          >
            <Heading size="md" mb={4} color="gray.500">No campaigns found</Heading>
            <Text mb={6}>
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your filters to see more results' 
                : 'Create your first campaign to get started'}
            </Text>
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="purple" 
              onClick={handleCreateCampaign}
            >
              Create Campaign
            </Button>
          </Flex>
        ) : (
          <Table variant="simple" size="md">
            <Thead position="sticky" top={0} bg={headerBg} zIndex={1}>
              <Tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Type</Th>
                <Th isNumeric>Recipients</Th>
                <Th isNumeric>Open Rate</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredCampaigns.map(campaign => (
                <Tr key={campaign.id} _hover={{ bg: rowHoverBg }}>
                  <Td>
                    <Box>
                      <Text fontWeight="semibold">{campaign.name}</Text>
                      <Text fontSize="sm" color="gray.500">{campaign.description}</Text>
                    </Box>
                  </Td>
                  <Td>
                    <Badge colorScheme={statusColors[campaign.status] || 'gray'}>
                      {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1) || 'Unknown'}
                    </Badge>
                  </Td>
                  <Td>
                    {formatCampaignType(campaign.type)}
                  </Td>
                  <Td isNumeric>{campaign.recipients_count.toLocaleString()}</Td>
                  <Td isNumeric>{campaign.open_rate}%</Td>
                  <Td>{formatDate(campaign.created_at)}</Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        aria-label="Edit campaign"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() => handleEditCampaign(campaign)}
                        isDisabled={['active', 'completed'].includes(campaign.status)}
                      />
                      <IconButton
                        aria-label="View campaign"
                        icon={<ViewIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => handleViewCampaign(campaign)}
                      />
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="More options"
                          icon={<ChevronDownIcon />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem 
                            icon={<CopyIcon />}
                            onClick={() => handleDuplicateCampaign(campaign)}
                          >
                            Duplicate
                          </MenuItem>
                          <MenuItem 
                            icon={<DeleteIcon />}
                            color="red.500"
                            onClick={() => handleDeleteCampaign(campaign)}
                            isDisabled={['active', 'scheduled'].includes(campaign.status)}
                          >
                            Delete
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
      
      {/* Campaign Create/Edit Modal */}
      <CampaignModal
        isOpen={isOpen}
        onClose={onClose}
        mode={modalMode}
        campaign={selectedCampaign}
        workspaceId={workspaceId}
        onSuccess={fetchCampaigns}
      />
    </Box>
  );
};

export default CampaignDashboard; 