import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, useToast, Spinner, Alert, AlertIcon, IconButton, Tooltip } from '@chakra-ui/react';
import { Tab, Tabs } from '../common/Tabs';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { supabase } from '../../lib/supabaseUnified';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { PlusIcon, XMarkIcon, StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const StatusConfig = () => {
  const [activeTab, setActiveTab] = useState('lead');
  const [newStatus, setNewStatus] = useState('');
  const [newColor, setNewColor] = useState('#4285F4');
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const { currentWorkspace, loading: workspaceLoading, error: workspaceError } = useWorkspace();
  const toast = useToast();

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchCategories();
      fetchStatuses();
    }
  }, [currentWorkspace?.id]);

  const fetchCategories = async () => {
    if (!currentWorkspace?.id) {
      console.log('No workspace ID available');
      return;
    }
    
    console.log('Fetching categories for workspace:', currentWorkspace.id);
    const { data, error } = await supabase
      .from('status_categories')
      .select('*')
      .eq('workspace_id', currentWorkspace.id);
      
    if (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error fetching categories',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    console.log('Fetched categories:', data);
    setCategories(data || []);
  };

  const fetchStatuses = async () => {
    if (!currentWorkspace?.id) return;
    
    const { data, error } = await supabase
      .from('status_options')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .order('display_order', { ascending: true });
      
    if (error) {
      console.error('Error fetching statuses:', error);
      toast({
        title: 'Error fetching statuses',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setStatuses(data || []);
  };

  const addStatus = async () => {
    if (!newStatus.trim()) {
      toast({
        title: 'Please enter a status name',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!currentWorkspace?.id) {
      toast({
        title: 'No workspace selected',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const category = categories.find(c => 
      c.name.toLowerCase().includes(activeTab.toLowerCase())
    );

    if (!category) {
      toast({
        title: 'Category not found',
        description: `Could not find category for ${activeTab}`,
        status: 'error',
        duration: 3000,
      });
      console.error('Categories:', categories);
      console.error('Active tab:', activeTab);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('status_options')
        .insert([{
          workspace_id: currentWorkspace.id,
          category_id: category.id,
          name: newStatus,
          color: newColor,
          is_default: false,
          display_order: statuses.length + 1
        }])
        .select();

      if (error) throw error;

      toast({
        title: 'Status added successfully',
        status: 'success',
        duration: 2000,
      });
      
      setNewStatus('');
      fetchStatuses();
    } catch (error) {
      console.error('Error adding status:', error);
      toast({
        title: 'Error adding status',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const deleteStatus = async (statusId) => {
    if (!currentWorkspace?.id) return;

    const { error } = await supabase
      .from('status_options')
      .delete()
      .eq('id', statusId)
      .eq('workspace_id', currentWorkspace.id);

    if (error) {
      console.error('Error deleting status:', error);
      toast({
        title: 'Error deleting status',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    toast({
      title: 'Status deleted successfully',
      status: 'success',
      duration: 2000,
    });
    fetchStatuses();
  };

  const toggleDefault = async (status) => {
    try {
      // First, remove default from all statuses in this category
      if (!status.is_default) {
        const { error: resetError } = await supabase
          .from('status_options')
          .update({ is_default: false })
          .eq('category_id', status.category_id)
          .eq('workspace_id', currentWorkspace.id);

        if (resetError) throw resetError;
      }

      // Then toggle the selected status
      const { error } = await supabase
        .from('status_options')
        .update({ is_default: !status.is_default })
        .eq('id', status.id)
        .eq('workspace_id', currentWorkspace.id);

      if (error) throw error;

      toast({
        title: `Default status ${status.is_default ? 'removed' : 'set'}`,
        status: 'success',
        duration: 2000,
      });

      fetchStatuses();
    } catch (error) {
      console.error('Error toggling default status:', error);
      toast({
        title: 'Error updating default status',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusesByCategory = (categoryName) => {
    const category = categories.find(c => 
      c.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    return statuses.filter(s => s.category_id === category?.id);
  };

  if (workspaceLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="full">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  if (workspaceError) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading workspace: {workspaceError}
      </Alert>
    );
  }

  if (!currentWorkspace) {
    return (
      <Alert status="warning">
        <AlertIcon />
        Please select a workspace to manage status options
      </Alert>
    );
  }

  return (
    <Box 
      p={6} 
      bg="white" 
      rounded="xl" 
      shadow="sm"
      border="1px"
      borderColor="gray.100"
    >
      <Tabs>
        <Tab 
          isActive={activeTab === 'lead'} 
          onClick={() => setActiveTab('lead')}
        >
          Lead Status
        </Tab>
        <Tab 
          isActive={activeTab === 'appointment'} 
          onClick={() => setActiveTab('appointment')}
        >
          Appointment Status
        </Tab>
        <Tab 
          isActive={activeTab === 'result'} 
          onClick={() => setActiveTab('result')}
        >
          Appointment Result
        </Tab>
      </Tabs>

      <VStack mt={6} spacing={4} align="stretch">
        <VStack spacing={2} align="stretch">
          {getStatusesByCategory(activeTab).map((status) => (
            <HStack 
              key={status.id}
              p={2}
              bg="gray.50"
              rounded="md"
              justify="space-between"
              transition="all 0.2s"
              borderLeft="4px solid"
              borderLeftColor={status.color}
              _hover={{
                bg: 'gray.100'
              }}
            >
              <HStack spacing={3}>
                <Tooltip label={status.is_default ? 'Remove default status' : 'Set as default status'}>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon={status.is_default ? 
                      <StarIconSolid className="w-4 h-4 text-yellow-400" /> : 
                      <StarIconOutline className="w-4 h-4" />
                    }
                    onClick={() => toggleDefault(status)}
                    aria-label={status.is_default ? 'Remove default status' : 'Set as default status'}
                  />
                </Tooltip>
                <Text>{status.name}</Text>
              </HStack>
              <HStack spacing={2}>
                <input
                  type="color"
                  value={status.color}
                  onChange={async (e) => {
                    const { error } = await supabase
                      .from('status_options')
                      .update({ color: e.target.value })
                      .eq('id', status.id);
                    
                    if (error) {
                      toast({
                        title: 'Error updating color',
                        status: 'error',
                        duration: 3000,
                      });
                    } else {
                      fetchStatuses();
                    }
                  }}
                  style={{ width: '24px', height: '24px', padding: 0, border: 'none' }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => deleteStatus(status.id)}
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </HStack>
            </HStack>
          ))}
        </VStack>

        <HStack spacing={2}>
          <Input
            placeholder="Enter new status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addStatus()}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            style={{ width: '40px', height: '40px', padding: 0, border: 'none' }}
          />
          <Button 
            onClick={addStatus}
            colorScheme="blue"
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            Add Status
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default StatusConfig;
