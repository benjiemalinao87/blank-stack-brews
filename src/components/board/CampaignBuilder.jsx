import React, { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { launchCampaign } from '../../lib/campaigns';

const CampaignBuilder = () => {
  const toast = useToast();

  const handleLaunch = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Add debug logging for campaign and segment info
      console.log('Launch Debug - Initial state:', {
        workspaceId,
        boardId,
        selectedSegment,
        campaignDetails: campaign
      });
      
      // Generate a 4-digit random number for unique campaign ID
      const uniqueId = Math.floor(Math.random() * 9000) + 1000;
      
      // Create a clean copy of the campaign object
      const cleanCampaign = {
        name: `${campaign.name} (${uniqueId})`,
        workspace_id: campaign.workspace_id,
        board_id: campaign.board_id,
        status: campaign.status,
        description: campaign.description,
        segment_id: campaign.segment_id
      };
      
      console.log('Launch Debug - Clean campaign:', cleanCampaign);
      
      // Create a clean copy of nodes
      const cleanNodes = nodes.map(node => ({
        type: node.type,
        message: node.message,
        send_time: node.send_time,
        sequence_order: node.sequence_order,
        day: node.day
      }));
      
      // Validate segment selection
      if (!selectedSegment) {
        console.log('Launch Debug - No segment selected');
        toast({
          title: 'No segment selected',
          description: 'Please select an audience segment for this campaign.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Get the segment's contacts directly from the segment_contacts view/table
      console.log('Launch Debug - Fetching contacts for segment:', selectedSegment);
      
      const { data: segmentContacts, error: contactsError } = await supabase
        .from('segment_contacts')
        .select(`
          contact_id,
          contacts (
            id,
            first_name,
            last_name,
            email,
            phone,
            workspace_id
          )
        `)
        .eq('segment_id', selectedSegment)
        .eq('contacts.workspace_id', workspaceId);  // Join with contacts table to filter by workspace

      console.log('Launch Debug - Segment contacts query result:', {
        hasData: !!segmentContacts,
        contactCount: segmentContacts?.length,
        firstContact: segmentContacts?.[0],
        error: contactsError,
        rawResult: segmentContacts
      });

      if (contactsError) {
        console.error('Launch Debug - Error fetching contacts:', contactsError);
        throw contactsError;
      }

      if (!segmentContacts || segmentContacts.length === 0) {
        console.log('Launch Debug - No contacts found in segment');
        toast({
          title: 'No contacts found',
          description: 'There are no contacts in the selected segment.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Extract the full contact objects
      const filteredContacts = segmentContacts.map(sc => sc.contacts);
      
      console.log('Launch Debug - Processed contacts:', {
        totalContacts: filteredContacts.length,
        sampleContacts: filteredContacts.slice(0, 2)
      });
      
      // Launch the campaign with filtered contacts
      console.log('Launch Debug - Launching campaign');
      const { error } = await launchCampaign(cleanCampaign, cleanNodes, filteredContacts);
      if (error) {
        console.error('Launch Debug - Launch error:', error);
        throw error;
      }
      
      console.log('Launch Debug - Campaign launched successfully');
    } catch (error) {
      console.error('Launch Debug - Error:', error);
      toast({
        title: 'Error launching campaign',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    // Rest of the component code
  );
};

export default CampaignBuilder; 