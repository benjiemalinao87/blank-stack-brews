import React, { useState, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  Text,
  Heading,
  HStack,
  Box,
  SimpleGrid,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  Stack,
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { supabase } from '../../../services/supabase';

const CompanyStep = ({ initialData, onComplete, setCurrentWorkspace, setIsSubmitting, toast, onNext }) => {
  const { user } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const [formData, setFormData] = useState({
    company_name: initialData.company_name || '',
    company_size: initialData.company_size || '',
    company_industry: initialData.company_industry || '',
    expected_users: initialData.expected_users || ''
  });
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [creationAttempted, setCreationAttempted] = useState(false);

  // Attempt to create workspace if none exists after loading
  useEffect(() => {
    const checkAndCreateWorkspace = async () => {
      // Only proceed if we've confirmed workspace is missing but user is logged in
      if (!workspaceLoading && !currentWorkspace?.id && user?.id && !creationAttempted) {
        console.log('CompanyStep: Attempting to create missing workspace for user:', user.id);
        setIsCreatingWorkspace(true);
        setCreationAttempted(true); // Mark as attempted so we don't retry infinitely
        
        try {
          // Try multiple approaches in sequence:
          
          // Approach 1: Try using an existing RPC function (fix_user_workspace) if it exists
          try {
            console.log("Trying to fix user workspace using RPC function...");
            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              'fix_user_workspace',
              { p_user_id: user.id }
            );
            
            if (!rpcError) {
              console.log("RPC fix_user_workspace succeeded:", rpcResult);
              
              // Wait a moment for changes to propagate
              await new Promise(r => setTimeout(r, 2000));
              
              // Try to fetch the user's workspace
              const { data: workspaceData, error: fetchError } = await supabase
                .from('workspace_members')
                .select('workspace_id, workspaces:workspace_id(id, name)')
                .eq('user_id', user.id)
                .single();
                
              if (!fetchError && workspaceData?.workspaces) {
                console.log("Found workspace after RPC call:", workspaceData.workspaces);
                setCurrentWorkspace(workspaceData.workspaces);
                toast({
                  title: 'Workspace Created',
                  description: 'Your workspace was created successfully.',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
                return; // Success!
              }
            }
          } catch (rpcError) {
            console.warn("RPC fix_user_workspace failed:", rpcError);
            // Continue to next approach
          }
          
          // Approach 2: Try using the create_workspace_safe RPC function if it exists
          try {
            console.log("Trying create_workspace_safe RPC function...");
            const workspaceName = formData.company_name || user.email;
            const { data: safeResult, error: safeError } = await supabase.rpc(
              'create_workspace_safe',
              { 
                p_name: `${workspaceName}'s Workspace`,
                p_user_id: user.id
              }
            );
            
            if (!safeError && safeResult) {
              console.log("create_workspace_safe succeeded with workspace ID:", safeResult);
              
              // Fetch the workspace details
              const { data: workspace, error: fetchError } = await supabase
                .from('workspaces')
                .select('*')
                .eq('id', safeResult)
                .single();
                
              if (!fetchError && workspace) {
                setCurrentWorkspace(workspace);
                toast({
                  title: 'Workspace Created',
                  description: 'Your workspace was created successfully.',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
                return; // Success!
              }
            }
          } catch (safeError) {
            console.warn("create_workspace_safe RPC function failed:", safeError);
            // Continue to next approach
          }
          
          // Approach 3: Direct SQL - last resort
          // First create just the workspace without any triggers
          console.log("Trying direct workspace creation via REST API...");
          const workspaceName = formData.company_name || user.email;
          
          // Try using a special query parameter to bypass triggers
          const { data: workspaceData, error: workspaceError } = await supabase
            .from('workspaces')
            .insert({
              name: `${workspaceName}'s Workspace`
            })
            .select()
            .single();
            
          if (workspaceError) {
            // If that fails, last resort: Try a very basic approach
            throw new Error(`Basic workspace creation failed: ${workspaceError.message}`);
          }
          
          if (!workspaceData) {
            throw new Error("No workspace data returned from creation");
          }
          
          console.log('Created workspace:', workspaceData);
          
          // Manually call setup_workspace_lead_status function to create categories with proper created_by field
          try {
            const { error: setupError } = await supabase.rpc(
              'setup_workspace_lead_status',
              { 
                workspace_id: workspaceData.id,
                creator_id: user.id 
              }
            );
            
            if (setupError) {
              console.error("Failed to set up lead status categories:", setupError);
              // Try to proceed anyway
            } else {
              console.log("Successfully set up lead status categories");
            }
          } catch (setupError) {
            console.error("Error calling setup_workspace_lead_status:", setupError);
            // Continue anyway
          }
          
          // Create workspace member record
          const { error: memberError } = await supabase
            .from('workspace_members')
            .insert({
              workspace_id: workspaceData.id,
              user_id: user.id,
              role: 'admin'
            });
            
          if (memberError) {
            console.error("Failed to create workspace member:", memberError);
            // Try to proceed anyway
          }
          
          // Create onboarding status
          const { error: statusError } = await supabase
            .from('onboarding_status')
            .insert({
              user_id: user.id,
              workspace_id: workspaceData.id,
              is_completed: false
            });
            
          if (statusError) {
            console.error("Failed to create onboarding status:", statusError);
            // Try to proceed anyway
          }
          
          // Update context
          setCurrentWorkspace(workspaceData);
          toast({
            title: 'Workspace Created',
            description: 'Your workspace was created successfully.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error creating workspace:', error);
          toast({
            title: 'Workspace Creation Failed',
            description: error.message || 'Could not create workspace',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setIsCreatingWorkspace(false);
        }
      }
    };
    
    // Run the check/create function
    checkAndCreateWorkspace();
    
  }, [workspaceLoading, currentWorkspace, user, creationAttempted, formData.company_name, toast, setCurrentWorkspace]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsStepLoading(true);
    setIsSubmitting(true);

    if (!currentWorkspace?.id) {
      console.error('Cannot complete CompanyStep: Workspace is still missing.');
      toast({
        title: 'Error',
        description: 'Workspace information is missing. Cannot save progress.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsStepLoading(false);
      setIsSubmitting(false);
      return;
    }

    try {
      await onComplete(formData);
    } catch (error) {
      console.error("Error calling onComplete from CompanyStep:", error);
      toast({
        title: 'Error Saving Step',
        description: 'Could not save company information.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsStepLoading(false);
      setIsSubmitting(false);
    }
  };

  const userOptions = ['1', '2-5', '6-10', '11-50', '50+'];

  if (workspaceLoading) {
    return (
      <Center h="300px">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }
  
  if (isCreatingWorkspace) {
    return (
      <Center h="300px" flexDirection="column">
        <Spinner size="xl" color="purple.500" mb={4} />
        <Text>Creating your workspace...</Text>
      </Center>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} align="start">
          <Heading size="md" color="green.600">About your company</Heading>
          <Text color="gray.600">
            We'll use this information to tailor the app to your needs.
          </Text>
        </VStack>
        
        {!currentWorkspace?.id && creationAttempted && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Stack>
              <AlertTitle>Workspace Not Found</AlertTitle>
              <Text fontSize="sm">We couldn't create a workspace automatically. Please try logging out and back in.</Text>
            </Stack>
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1 }} spacing={6}>
          <FormControl isRequired>
            <FormLabel>Company name</FormLabel>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Enter company name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>How big is your company?</FormLabel>
            <Select
              value={formData.company_size}
              onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
              placeholder="Select company size"
            >
              <option value="1">Just me</option>
              <option value="2-5">2-5 people</option>
              <option value="6-10">6-10 people</option>
              <option value="11-50">11-50 people</option>
              <option value="51+">51+ people</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Company industry</FormLabel>
            <Select
              value={formData.company_industry}
              onChange={(e) => setFormData({ ...formData, company_industry: e.target.value })}
              placeholder="Select industry"
            >
              <option value="technology">Technology</option>
              <option value="retail">Retail</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="services">Professional Services</option>
              <option value="other">Other</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>How many people in your company will use the app?</FormLabel>
            <Text fontSize="sm" color="gray.500" mb={3}>
              This is just for info and doesn't affect your actual user limits
            </Text>
            <HStack spacing={3} wrap="wrap">
              {userOptions.map((option) => (
                <Box
                  key={option}
                  as="button"
                  type="button"
                  px={4}
                  py={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={formData.expected_users === option ? 'green.500' : 'gray.200'}
                  bg={formData.expected_users === option ? 'green.50' : 'white'}
                  color={formData.expected_users === option ? 'green.700' : 'gray.700'}
                  onClick={() => setFormData({ ...formData, expected_users: option })}
                  _hover={{
                    borderColor: 'green.500',
                    bg: 'green.50'
                  }}
                >
                  {option}
                </Box>
              ))}
            </HStack>
          </FormControl>
        </SimpleGrid>

        <Button
          type="submit"
          colorScheme="purple"
          size="lg"
          isLoading={isStepLoading}
          isDisabled={!currentWorkspace?.id || !formData.company_name || !formData.company_size || !formData.company_industry || !formData.expected_users}
          alignSelf="flex-end"
        >
          Next
        </Button>
      </VStack>
    </form>
  );
};

export default CompanyStep;
