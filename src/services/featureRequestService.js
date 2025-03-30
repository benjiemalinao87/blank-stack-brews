import { supabase } from './supabase';

/**
 * Submit a new feature request
 * @param {Object} featureRequest - The feature request data
 * @param {string} featureRequest.title - Title of the feature request
 * @param {string} featureRequest.description - Detailed description
 * @param {string} featureRequest.category - Category of the request
 * @param {string} featureRequest.requested_by - Email of the requester
 * @param {string} featureRequest.workspace_id - Workspace ID
 * @returns {Promise} - Supabase response
 */
export const submitFeatureRequest = async (featureRequest) => {
  try {
    const { data, error } = await supabase
      .from('feature_requests')
      .insert(featureRequest)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error submitting feature request:', error);
    return { data: null, error };
  }
};

/**
 * Vote for a feature request
 * @param {string} featureRequestId - ID of the feature request
 * @param {string} userEmail - Email of the voter
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise} - Supabase response
 */
export const voteForFeatureRequest = async (featureRequestId, userEmail, workspaceId) => {
  try {
    // First check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('feature_request_votes')
      .select()
      .eq('feature_request_id', featureRequestId)
      .eq('user_email', userEmail)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    // If user already voted, return early
    if (existingVote) {
      return { data: existingVote, error: null, alreadyVoted: true };
    }
    
    // Add vote record
    const { data: voteData, error: voteError } = await supabase
      .from('feature_request_votes')
      .insert({
        feature_request_id: featureRequestId,
        user_email: userEmail,
        workspace_id: workspaceId
      });
    
    if (voteError) throw voteError;
    
    // Increment vote count in feature_requests table
    const { data: updateData, error: updateError } = await supabase.rpc(
      'increment_feature_request_votes',
      { request_id: featureRequestId }
    );
    
    if (updateError) throw updateError;
    
    return { data: voteData, error: null };
  } catch (error) {
    console.error('Error voting for feature request:', error);
    return { data: null, error };
  }
};

/**
 * Get feature requests for a workspace
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise} - Supabase response
 */
export const getFeatureRequests = async (workspaceId) => {
  try {
    const { data, error } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return { data: null, error };
  }
};

/**
 * Get all feature requests with user vote information
 * @param {string} workspaceId - Workspace ID
 * @param {string} userEmail - Email of the current user
 * @returns {Promise} - Supabase response with feature requests and user's votes
 */
export const getAllFeatureRequestsWithVotes = async (workspaceId, userEmail) => {
  try {
    // Get all feature requests for the workspace
    const { data: requests, error: requestsError } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('votes', { ascending: false });
    
    if (requestsError) throw requestsError;
    
    // Get user's votes for these requests
    if (requests.length > 0 && userEmail) {
      const requestIds = requests.map(req => req.id);
      
      const { data: userVotes, error: votesError } = await supabase
        .from('feature_request_votes')
        .select('*')
        .eq('user_email', userEmail)
        .in('feature_request_id', requestIds);
      
      if (votesError) throw votesError;
      
      // Merge vote information with requests
      const requestsWithVotes = requests.map(request => {
        const userVote = userVotes?.find(vote => vote.feature_request_id === request.id);
        return {
          ...request,
          userVoted: !!userVote
        };
      });
      
      return { data: requestsWithVotes, error: null };
    }
    
    return { data: requests, error: null };
  } catch (error) {
    console.error('Error fetching feature requests with votes:', error);
    return { data: null, error };
  }
};
