import { supabase } from './supabase';
import logger from '../utils/logger';

export const getOnboardingStatus = async (userId, workspaceId) => {
  try {
    const { data, error } = await supabase
      .from('onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return null;
  }
};

export const createOnboardingStatus = async (userId, workspaceId) => {
  try {
    logger.debug(`Creating onboarding status for user ${userId} in workspace ${workspaceId}`);
    
    // First check if an entry already exists to avoid duplicates
    const { data: existingData, error: checkError } = await supabase
      .from('onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId);
      
    if (checkError) {
      logger.error('Error checking existing onboarding status:', checkError);
      // Continue with creation attempt even if check fails
    } else if (existingData && existingData.length > 0) {
      logger.debug('Onboarding status already exists, returning existing record');
      return existingData[0];
    }
    
    // Try to use RPC function first for better reliability
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'create_onboarding_status',
      { 
        p_user_id: userId,
        p_workspace_id: workspaceId
      }
    );
    
    if (!rpcError && rpcData) {
      logger.debug('Successfully created onboarding status via RPC');
      return rpcData;
    }
    
    if (rpcError) {
      logger.debug('RPC failed, falling back to direct insert:', rpcError);
    }
    
    // Fallback to direct insert
    const { data, error } = await supabase
      .from('onboarding_status')
      .insert([{ 
        user_id: userId, 
        workspace_id: workspaceId, 
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      // If it's a unique violation, the record might already exist
      if (error.code === '23505') {
        logger.debug('Duplicate entry detected, fetching existing record');
        const { data: existingRecord, error: fetchError } = await supabase
          .from('onboarding_status')
          .select('*')
          .eq('user_id', userId)
          .eq('workspace_id', workspaceId)
          .single();
          
        if (fetchError) {
          logger.error('Error fetching existing record after duplicate error:', fetchError);
          throw fetchError;
        }
        
        return existingRecord;
      }
      
      logger.error('Error creating onboarding status:', error);
      throw error;
    }
    
    logger.debug('Successfully created onboarding status via direct insert');
    return data;
  } catch (error) {
    logger.error('Error in createOnboardingStatus:', error);
    // Throw the error to be handled by the caller
    throw error;
  }
};

export const updateOnboardingStatus = async (userId, workspaceId, isCompleted) => {
  try {
    // First try to use the RPC function for better reliability
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'complete_onboarding',
      { 
        p_user_id: userId,
        p_workspace_id: workspaceId
      }
    );
    
    if (!rpcError) {
      return { is_completed: true };
    }
    
    logger.debug('RPC failed, falling back to regular update:', rpcError);
    
    // Fallback to regular update
    const { data, error } = await supabase
      .from('onboarding_status')
      .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      // If no record exists, try to create one
      if (error.code === 'PGRST116') { // No rows returned
        return createOnboardingStatus(userId, workspaceId)
          .then(newData => {
            return updateOnboardingStatus(userId, workspaceId, isCompleted);
          });
      }
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Error in updateOnboardingStatus:', error);
    throw error;
  }
};

export const saveOnboardingResponses = async (userId, workspaceId, responses) => {
  try {
    // First try to use the RPC function for better reliability
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'save_onboarding_response',
      { 
        p_user_id: userId,
        p_workspace_id: workspaceId,
        p_step_id: 'about_you',
        p_response: responses
      }
    );
    
    if (!rpcError) {
      return { success: true };
    }
    
    logger.debug('RPC failed, falling back to regular insert:', rpcError);
    
    // Format the data for the onboarding_responses table
    const formattedData = {
      user_id: userId,
      workspace_id: workspaceId,
      step_id: 'about_you',
      response: responses,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try to insert the data
    const { data, error } = await supabase
      .from('onboarding_responses')
      .insert([formattedData])
      .select()
      .single();

    if (error) {
      // If the record already exists, try to update it
      if (error.code === '23505') { // Unique violation
        const { data: updateData, error: updateError } = await supabase
          .from('onboarding_responses')
          .update({ response: responses, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('workspace_id', workspaceId)
          .eq('step_id', 'about_you')
          .select()
          .single();
          
        if (updateError) throw updateError;
        return updateData;
      }
      
      throw error;
    }
    
    return data;
  } catch (error) {
    logger.error('Error saving onboarding responses:', error);
    throw error;
  }
};

// Helper function to determine training needs based on user responses
const determineTrainingNeeds = (responses) => {
  const needs = [];
  
  if (responses.crm_experience === 'never' || responses.crm_experience === 'basic') {
    needs.push('crm_basics', 'getting_started');
  }
  
  if (responses.job_title === 'sales') {
    needs.push('sales_workflows', 'pipeline_management');
  } else if (responses.job_title === 'customer_success') {
    needs.push('customer_support', 'ticket_management');
  }
  
  if (responses.goals?.includes('automation')) {
    needs.push('automation_training');
  }
  
  if (responses.goals?.includes('reporting')) {
    needs.push('analytics_reporting');
  }
  
  return needs;
};

export const getOnboardingResponses = async (userId, workspaceId) => {
  try {
    const { data, error } = await supabase
      .from('onboarding_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('step_id', 'about_you')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting onboarding responses:', error);
    return null;
  }
};

export const updateWatchedIntro = async (userId, workspaceId, watched) => {
  try {
    // Check if record exists
    const { data: existingData, error: checkError } = await supabase
      .from('onboarding_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('step_id', 'about_you')
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    
    if (!existingData) {
      // Create a new record if it doesn't exist
      const { data, error } = await supabase
        .from('onboarding_responses')
        .insert([{
          user_id: userId,
          workspace_id: workspaceId,
          step_id: 'about_you',
          response: { watched_intro: watched },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } else {
      // Update existing record
      const updatedResponse = {
        ...existingData.response,
        watched_intro: watched
      };
      
      const { data, error } = await supabase
        .from('onboarding_responses')
        .update({ 
          response: updatedResponse,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .eq('step_id', 'about_you')
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error updating watched intro:', error);
    throw error;
  }
};

export const hasCompletedAnyOnboarding = async (userId) => {
  try {
    // Use count to avoid 406 errors
    const { count, error } = await supabase
      .from('onboarding_status')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);

    if (error) {
      console.error('Error checking if completed any onboarding:', error);
      return false;
    }

    return count > 0;
  } catch (error) {
    console.error('Error in hasCompletedAnyOnboarding:', error);
    return false;
  }
};

// Function to ensure a user has a workspace assigned
export const ensureUserHasWorkspace = async (userId) => {
  if (!userId) {
    logger.error('Cannot ensure workspace: Missing userId');
    throw new Error('User ID is required to ensure workspace');
  }
  
  try {
    logger.debug(`Checking if user ${userId} has a workspace`);
    
    // First check if user already has a workspace
    const { data: hasWorkspace, error: checkError } = await supabase
      .rpc('user_has_workspace', { p_user_id: userId });
    
    if (checkError) {
      logger.error('Error checking if user has workspace:', checkError);
      throw checkError;
    }
    
    logger.debug(`User ${userId} has workspace: ${hasWorkspace}`);
    
    // If user doesn't have a workspace, create one
    if (!hasWorkspace) {
      logger.debug(`Creating workspace for user: ${userId}`);
      
      // Call the manually_process_user_registration function with correct parameter name
      const { data: result, error: processError } = await supabase
        .rpc('manually_process_user_registration', { p_user_id: userId });
      
      if (processError) {
        logger.error('Error processing user registration:', processError);
        throw processError;
      }
      
      logger.debug('User registration processed:', result);
      return result;
    }
    
    return { success: true, message: 'User already has a workspace' };
  } catch (error) {
    logger.error('Unexpected error in ensureUserHasWorkspace:', error);
    throw error;
  }
};

// Function to ensure an onboarding status record exists for a user/workspace
export const ensureOnboardingStatusExists = async (userId, workspaceId) => {
  if (!userId || !workspaceId) {
    console.error('Cannot ensure onboarding status: Missing userId or workspaceId');
    // Optionally throw an error or return a specific value
    throw new Error('User ID or Workspace ID is required to ensure onboarding status.');
  }
  
  try {
    // Check if a record already exists
    const { data, error: checkError } = await supabase
      .from('onboarding_status')
      .select('id') // Select only id for efficiency
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 result without error

    if (checkError) {
      console.error('Error checking for existing onboarding status:', checkError);
      throw checkError; // Re-throw the error to be handled by the caller
    }

    // If no record exists (data is null or undefined)
    if (!data) {
      console.log(`No onboarding status found for user ${userId} in workspace ${workspaceId}. Creating...`);
      const { error: insertError } = await supabase
        .from('onboarding_status')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          is_completed: false, // Initialize as not completed
          // Add other necessary default fields if your table requires them
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating onboarding status record:', insertError);
        throw insertError; // Re-throw the error
      }
      console.log('Successfully created onboarding status record.');
    } else {
      console.log('Onboarding status record already exists.');
      // Record exists, no action needed here
    }
  } catch (err) {
    console.error('Failed in ensureOnboardingStatusExists function:', err);
    // Re-throw the error so the calling function knows something went wrong
    throw err;
  }
};
