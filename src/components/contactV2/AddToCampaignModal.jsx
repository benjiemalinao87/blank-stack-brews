import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Select,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  useToast,
  Box,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseUnified';

const AddToCampaignModal = ({ isOpen, onClose, contacts = [], workspaceId, onSuccess }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const toast = useToast();

  // Fetch active campaigns when modal opens
  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchCampaigns();
    }
  }, [isOpen, workspaceId]);

  // Fetch active campaigns from the database
  const fetchCampaigns = async () => {
    try {
      setIsFetching(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status')
        .eq('workspace_id', workspaceId)
        .in('status', ['draft', 'active'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error fetching campaigns',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Add contacts to the selected campaign
  const handleAddToCampaign = async () => {
    if (!selectedCampaign) {
      toast({
        title: 'No campaign selected',
        description: 'Please select a campaign to add contacts to',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create contact status records for each contact
      const contactStatuses = contacts.map(contactId => ({
        campaign_id: selectedCampaign,
        contact_id: contactId,
        workspace_id: workspaceId,
        current_day: 1,
        status: 'enrolled',
        enrolled_at: new Date().toISOString()
      }));

      // Insert contact statuses
      const { error: enrollmentError } = await supabase
        .from('campaign_contact_status')
        .insert(contactStatuses);

      if (enrollmentError) {
        // Check if it's a duplicate key error
        if (enrollmentError.code === '23505') {
          toast({
            title: 'Some contacts already in campaign',
            description: 'Duplicate contacts were skipped',
            status: 'info',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
          });
        } else {
          throw enrollmentError;
        }
      }

      // Get the first node for day 1 to schedule executions
      const { data: firstNode, error: nodeError } = await supabase
        .from('campaign_nodes')
        .select('id, send_time')
        .eq('campaign_id', selectedCampaign)
        .eq('day', 1)
        .order('sequence_order', { ascending: true })
        .limit(1)
        .single();

      if (nodeError && nodeError.code !== 'PGRST116') {
        // PGRST116 is "Results contain 0 rows" - this is fine, just means no nodes yet
        throw nodeError;
      }

      // If we have a first node, schedule executions
      if (firstNode) {
        // Get scheduled time based on send_time
        const getScheduledTime = (sendTime) => {
          const now = new Date();
          const [hours, minutes] = sendTime.split(':').map(Number);
          const scheduledDate = new Date(now);
          scheduledDate.setHours(hours, minutes, 0, 0);
          
          // If the time has already passed today, schedule for tomorrow
          if (scheduledDate < now) {
            scheduledDate.setDate(scheduledDate.getDate() + 1);
          }
          
          return scheduledDate.toISOString();
        };

        // Create executions for each contact
        const executions = contacts.map(contactId => ({
          campaign_id: selectedCampaign,
          node_id: firstNode.id,
          workspace_id: workspaceId,
          contact_id: contactId,
          status: 'scheduled',
          scheduled_time: getScheduledTime(firstNode.send_time),
        }));

        // Insert executions
        const { error: executionError } = await supabase
          .from('campaign_executions')
          .insert(executions);

        if (executionError) {
          console.error('Error inserting executions:', executionError);
          // Continue anyway, as the contacts are already enrolled
        }
      }

      // Get the campaign name for the success message
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      
      toast({
        title: 'Contacts added to campaign',
        description: `${contacts.length} contacts added to "${campaign?.name || 'campaign'}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });

      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error adding contacts to campaign:', error);
      toast({
        title: 'Error adding contacts to campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add to Campaign</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Text>Selected contacts:</Text>
              <Badge colorScheme="purple" fontSize="sm" px={2} py={1} borderRadius="md">
                {contacts.length}
              </Badge>
            </HStack>

            {isFetching ? (
              <Box textAlign="center" py={4}>
                <Spinner size="md" color="purple.500" />
                <Text mt={2} fontSize="sm" color="gray.500">
                  Loading campaigns...
                </Text>
              </Box>
            ) : campaigns.length > 0 ? (
              <FormControl>
                <FormLabel>Select Campaign</FormLabel>
                <Select
                  placeholder="Select a campaign"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                >
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} {campaign.status === 'draft' ? '(Draft)' : ''}
                    </option>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box p={4} borderWidth="1px" borderRadius="md" borderStyle="dashed">
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  No active campaigns found. Please create a campaign first.
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleAddToCampaign}
            isLoading={isLoading}
            isDisabled={!selectedCampaign || campaigns.length === 0}
          >
            Add to Campaign
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddToCampaignModal; 