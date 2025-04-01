
import React, { useState, useEffect } from 'react';
import { Box, Progress, useToast, Center, Spinner, Button, VStack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { 
  saveOnboardingResponses, 
  updateOnboardingStatus, 
  getOnboardingResponses, 
  ensureOnboardingStatusExists,
  ensureUserHasWorkspace
} from '../../services/onboarding';
import { createWorkspace } from '../../services/workspace';
import { supabase } from '../../lib/supabaseUnified';
import AboutYouStep from './steps/AboutYouStep';
import CompanyStep from './steps/CompanyStep';
import GoalsStep from './steps/GoalsStep';
import WelcomeVideo from './steps/WelcomeVideo';

export const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const { setIsOnboardingComplete } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    job_title: '',
    crm_experience: '',
    phone_number: '',
    company_name: '',
    company_size: '',
    company_industry: '',
    expected_users: '',
    goals: [],
    watched_intro: false
  });
  const toast = useToast();

  useEffect(() => {
    const loadExistingResponses = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // CRITICAL FIX: Ensure user has a workspace before proceeding
        console.log('Ensuring user has a workspace...');
        const workspaceResult = await ensureUserHasWorkspace(user.id);
        console.log('Workspace check result:', workspaceResult);
        
        // If workspace was just created, refresh the workspace context
        if (workspaceResult.workspace_id && !currentWorkspace?.id) {
          console.log('New workspace created, refreshing workspace context...');
          // Fetch the workspace details and update the context
          const { data: workspaceData, error: workspaceError } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', workspaceResult.workspace_id)
            .single();
            
          if (!workspaceError && workspaceData) {
            console.log('Setting current workspace:', workspaceData);
            setCurrentWorkspace(workspaceData);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in onboarding setup:', error);
        setError(error.message);
        toast({
          title: 'Error during setup',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadExistingResponses();
  }, [user?.id]);

  // Show loading state while checking user and workspace
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }

  // Show error state with retry button
  if (error) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text color="red.500">Error: {error}</Text>
          <Button 
            colorScheme="blue" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
          <Button 
            variant="ghost" 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/auth');
            }}
          >
            Sign Out
          </Button>
        </VStack>
      </Center>
    );
  }

  // Don't proceed if user is not available
  if (!user?.id) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text>Please sign in to continue</Text>
          <Button 
            colorScheme="blue" 
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        </VStack>
      </Center>
    );
  }

  const handleStepComplete = async (stepData, isLastStep = false) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);
    
    // Common logic for saving step data (if workspace exists)
    if (currentWorkspace?.id && !isLastStep) { // Only save intermediate steps if workspace exists
      try {
        console.log(`Saving step ${currentStep} data for workspace: ${currentWorkspace.id}`);
        await saveOnboardingResponses(user.id, currentWorkspace.id, updatedData);
      } catch (error) {
        console.error('Error saving step progress:', error);
        // Optional: toast warning about saving failure
      }
    }

    if (isLastStep) {
      console.log("Final onboarding step triggered.");
      setLoading(true); // Set loading for the final operation
      
      try {
        // 0. Double-check that the user has a workspace (extra safety)
        console.log('Final check to ensure user has a workspace...');
        const workspaceResult = await ensureUserHasWorkspace(user.id);
        console.log('Final workspace check result:', workspaceResult);
        
        // 1. Ensure Workspace exists (rely on context, maybe refresh if needed)
        if (!currentWorkspace?.id) {
          // Try to refresh workspace context if we just created one
          if (workspaceResult.workspace_id) {
            console.log('Using newly created workspace:', workspaceResult.workspace_id);
            const { data: workspaceData, error: workspaceError } = await supabase
              .from('workspaces')
              .select('*')
              .eq('id', workspaceResult.workspace_id)
              .single();
              
            if (!workspaceError && workspaceData) {
              console.log('Setting current workspace for final step:', workspaceData);
              setCurrentWorkspace(workspaceData);
            } else {
              throw new Error('Could not retrieve workspace information. Please try again.');
            }
          } else {
            // This ideally shouldn't happen if the trigger worked and context is updated.
            console.error('CRITICAL: No currentWorkspace found at final onboarding step!');
            // Attempt recovery or show error
            // For now, log error and fallback to localStorage redirect
            throw new Error('Workspace information is missing. Cannot complete onboarding.');
          }
        }
        
        const workspaceId = currentWorkspace?.id || workspaceResult.workspace_id;
        console.log(`Finalizing onboarding for user ${user.id} in workspace ${workspaceId}`);

        // 2. Save final responses
        console.log('Saving final onboarding responses...');
        await saveOnboardingResponses(user.id, workspaceId, updatedData);

        // 3. Ensure onboarding status exists and mark as complete
        console.log('Ensuring onboarding status exists and marking as complete...');
        await ensureOnboardingStatusExists(user.id, workspaceId); // Ensure record exists
        await updateOnboardingStatus(user.id, workspaceId, true); // Mark as complete

        // 4. Update Onboarding Context State
        console.log('Setting onboarding context to complete.');
        setIsOnboardingComplete(true);
        
        // 5. Clear any potentially conflicting localStorage flags (optional)
        localStorage.removeItem('onboardingComplete');
        sessionStorage.removeItem('justCompletedOnboarding');

        // 6. Show success feedback
        toast({
          title: '🎉 Welcome aboard!',
          description: 'Your account is now ready to use.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // 7. Navigate using react-router-dom
        console.log('Navigating to dashboard (/)');
        navigate('/', { replace: true }); // Use navigate for smooth transition

      } catch (error) {
        console.error('Error completing onboarding final step:', error);
        toast({
          title: 'Onboarding Error',
          description: error.message || 'Failed to finalize onboarding. Please try logging out and back in.',
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
        // Fallback: Still try setting context state and navigate, but warn user.
        setIsOnboardingComplete(true); 
        navigate('/', { replace: true });
      } finally {
        setLoading(false); // Ensure loading state is turned off
      }
    } else {
      // Move to the next step if not the last one
      setCurrentStep(currentStep + 1);
    }
  };

  const steps = [
    {
      component: AboutYouStep,
      props: { initialData: formData, onComplete: handleStepComplete }
    },
    {
      component: CompanyStep,
      props: { 
        initialData: formData, 
        onComplete: handleStepComplete,
        createWorkspace,
        setCurrentWorkspace,
        setIsSubmitting: setLoading,
        toast,
        onNext: () => setCurrentStep(currentStep + 1)
      }
    },
    {
      component: GoalsStep,
      props: { 
        initialData: formData, 
        onComplete: handleStepComplete,
        setIsSubmitting: setLoading,
        toast
      }
    },
    {
      component: WelcomeVideo,
      props: { 
        onComplete: (data) => handleStepComplete(data, true),
        setIsSubmitting: setLoading
      }
    }
  ];

  const CurrentStepComponent = steps[currentStep]?.component;
  const currentStepProps = {
    ...steps[currentStep]?.props,
    currentWorkspace,
    user
  };

  if (!CurrentStepComponent) {
    return null;
  }

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      flexDirection="column"
      alignItems="center"
      position="relative"
      overflow="hidden"
    >
      {/* Progress bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="4px"
        bg="gray.100"
      >
        <Box
          height="100%"
          width={`${((currentStep + 1) / steps.length) * 100}%`}
          bg="green.500"
          transition="width 0.3s ease-in-out"
        />
      </Box>

      {/* Content area */}
      <Box
        flex={1}
        width="100%"
        maxW="800px"
        py={8}
        px={4}
        display="flex"
        flexDirection="column"
        alignItems="center"
        overflowY="auto"
      >
        {CurrentStepComponent && (
          <CurrentStepComponent {...currentStepProps} />
        )}
      </Box>
    </Box>
  );
};

export default OnboardingFlow;
