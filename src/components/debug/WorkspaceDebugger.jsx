import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Code, 
  Button, 
  useDisclosure, 
  Collapse, 
  Spinner,
  Badge
} from '@chakra-ui/react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseUnified';

/**
 * Debug component to help troubleshoot workspace loading issues
 */
const WorkspaceDebugger = () => {
  const { currentWorkspace, loading, error } = useWorkspace();
  const { user } = useAuth();
  const { isOpen, onToggle } = useDisclosure();
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [dbWorkspaces, setDbWorkspaces] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);

  const fetchWorkspaceMembers = async () => {
    if (!currentWorkspace) return;
    
    setMembersLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', currentWorkspace.id);
        
      if (error) throw error;
      setWorkspaceMembers(data || []);
    } catch (err) {
      console.error('Error fetching workspace members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchAllWorkspaces = async () => {
    if (!user) return;
    
    setDbLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*');
        
      if (error) throw error;
      setDbWorkspaces(data || []);
    } catch (err) {
      console.error('Error fetching all workspaces:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const createDefaultWorkspace = async () => {
    if (!user) return;
    
    try {
      // Create a default workspace
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert([
          { name: 'My Workspace' }
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Add user as workspace member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert([
          {
            workspace_id: newWorkspace.id,
            user_id: user.id,
            role: 'admin'
          }
        ]);

      if (memberError) throw memberError;
      
      alert('Default workspace created successfully! Please refresh the page.');
    } catch (err) {
      console.error('Error creating default workspace:', err);
      alert('Error creating workspace: ' + err.message);
    }
  };

  return (
    <Box 
      p={4} 
      bg="blue.50" 
      borderRadius="md" 
      borderWidth="1px" 
      borderColor="blue.200"
      maxW="800px"
      mx="auto"
      my={4}
    >
      <VStack align="stretch" spacing={3}>
        <Heading size="md">Workspace Debugger</Heading>
        
        <Box>
          <Text fontWeight="bold">Current Status:</Text>
          <Text>
            Loading: {loading ? 'Yes' : 'No'} {loading && <Spinner size="sm" />}
          </Text>
          <Text>
            Current Workspace: {currentWorkspace ? 
              <Badge colorScheme="green">Loaded (ID: {currentWorkspace.id})</Badge> : 
              <Badge colorScheme="red">Not Loaded</Badge>}
          </Text>
          {error && (
            <Text color="red.500">
              Error: {error}
            </Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="bold">User Info:</Text>
          {user ? (
            <Text>Logged in as: {user.email} (ID: {user.id})</Text>
          ) : (
            <Text color="red.500">No user logged in</Text>
          )}
        </Box>
        
        <Button colorScheme="blue" size="sm" onClick={onToggle}>
          {isOpen ? 'Hide Details' : 'Show Details'}
        </Button>
        
        <Collapse in={isOpen} animateOpacity>
          <VStack align="stretch" spacing={4} mt={2}>
            <Box>
              <Button 
                size="sm" 
                colorScheme="teal" 
                onClick={fetchWorkspaceMembers} 
                isLoading={membersLoading}
                isDisabled={!currentWorkspace}
                mb={2}
              >
                Fetch Workspace Members
              </Button>
              
              {workspaceMembers.length > 0 ? (
                <Code p={2} borderRadius="md">
                  {JSON.stringify(workspaceMembers, null, 2)}
                </Code>
              ) : (
                <Text>No workspace members fetched yet</Text>
              )}
            </Box>
            
            <Box>
              <Button 
                size="sm" 
                colorScheme="teal" 
                onClick={fetchAllWorkspaces} 
                isLoading={dbLoading}
                mb={2}
              >
                Check All Workspaces in DB
              </Button>
              
              {dbWorkspaces.length > 0 ? (
                <Code p={2} borderRadius="md">
                  {JSON.stringify(dbWorkspaces, null, 2)}
                </Code>
              ) : (
                <Text>No workspaces fetched yet</Text>
              )}
            </Box>
            
            <Box>
              <Button 
                size="sm" 
                colorScheme="red" 
                onClick={createDefaultWorkspace}
                isDisabled={!user}
              >
                Create Default Workspace
              </Button>
              <Text fontSize="sm" mt={1}>
                Use this only if you have no workspaces in the database
              </Text>
            </Box>
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default WorkspaceDebugger;
