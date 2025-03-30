import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  MenuGroup,
  MenuItem,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { supabase } from '../../lib/supabaseUnified';
import useContactV2Store from "../../services/contactV2State";
import { useWorkspace } from '../../contexts/WorkspaceContext';

const LeadStatusUpdate = ({ currentWorkspace, selectedContacts, onStatusUpdate }) => {
  const [leadStatusOptions, setLeadStatusOptions] = useState([]);
  const [isLoadingLeadStatuses, setIsLoadingLeadStatuses] = useState(false);
  const toast = useToast();

  // Fetch lead status options from status_options table
  const fetchLeadStatusOptions = async () => {
    if (!currentWorkspace?.id) return;
    
    setIsLoadingLeadStatuses(true);
    try {
      // Find the lead status category first
      const { data: categories, error: categoriesError } = await supabase
        .from('status_categories')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .ilike('name', '%lead%');
        
      if (categoriesError) {
        throw categoriesError;
      }
      
      if (categories && categories.length > 0) {
        const leadCategory = categories[0];
        
        // Now fetch the status options for this category
        const { data: statuses, error: statusesError } = await supabase
          .from('status_options')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .eq('category_id', leadCategory.id)
          .order('display_order', { ascending: true });
          
        if (statusesError) {
          throw statusesError;
        }
        
        setLeadStatusOptions(statuses || []);
      } else {
        setLeadStatusOptions([]);
      }
    } catch (error) {
      console.error('Error fetching lead status options:', error);
      toast({
        title: 'Error fetching lead status options',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsLoadingLeadStatuses(false);
    }
  };

  // Handle updating lead status
  const handleBulkUpdateLeadStatus = async (leadStatusId, leadStatusName) => {
    try {
      const updatePromises = selectedContacts.map(contactId => 
        useContactV2Store.getState().updateContact(contactId, { lead_status: leadStatusId })
      );
      
      await Promise.all(updatePromises);

      toast({
        title: `${selectedContacts.length} contacts updated`,
        description: `Lead status updated to "${leadStatusName}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });

      // Notify parent component that status has been updated
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating lead statuses:', error);
      toast({
        title: 'Error updating lead status',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  // Load lead status options when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchLeadStatusOptions();
    }
  }, [currentWorkspace?.id]);

  return (
    <MenuGroup title="Update Lead Status">
      {isLoadingLeadStatuses ? (
        <MenuItem isDisabled>
          <HStack>
            <Spinner size="xs" />
            <Text>Loading statuses...</Text>
          </HStack>
        </MenuItem>
      ) : leadStatusOptions.length > 0 ? (
        leadStatusOptions.map(status => (
          <MenuItem
            key={status.id}
            onClick={() => handleBulkUpdateLeadStatus(status.id, status.name)}
            pl={4}
          >
            <HStack>
              <Box w={2} h={2} borderRadius="full" bg={status.color || '#718096'} />
              <Text>{status.name}</Text>
            </HStack>
          </MenuItem>
        ))
      ) : (
        <MenuItem isDisabled pl={4}>
          No lead statuses found
        </MenuItem>
      )}
    </MenuGroup>
  );
};

export default LeadStatusUpdate;
