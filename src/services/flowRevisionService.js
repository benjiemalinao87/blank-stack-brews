import { supabase } from './supabase';

/**
 * Check the current user's JWT token to debug RLS issues
 * @returns {Promise} - User and JWT information
 */
export const checkJwtToken = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('Current user:', user);
    console.log('Current session:', session);
    
    if (session?.access_token) {
      // Extract the payload from the JWT token (middle part)
      const payload = session.access_token.split('.')[1];
      if (payload) {
        // Decode the base64 payload
        const decodedPayload = JSON.parse(atob(payload));
        console.log('JWT payload:', decodedPayload);
        return { user, session, jwt: decodedPayload };
      }
    }
    
    return { user, session, jwt: null };
  } catch (error) {
    console.error('Error checking JWT token:', error);
    return { error };
  }
};

/**
 * Save a new revision of a flow
 * @param {Object} flow - The flow object to save a revision for
 * @param {string} changeDescription - Description of what changed
 * @param {string} userId - ID of the user who made the change
 * @returns {Promise} - Supabase response
 */
export const saveFlowRevision = async (flow, changeDescription, userId) => {
  try {
    if (!flow || !flow.id) {
      console.error('Invalid flow object provided to saveFlowRevision:', flow);
      return { data: null, error: new Error('Invalid flow object provided') };
    }

    console.log('Saving flow revision for flow:', {
      flowId: flow.id,
      workspaceId: flow.workspace_id,
      changeDescription,
      userId,
      hasNodes: Array.isArray(flow.nodes),
      hasEdges: Array.isArray(flow.edges),
      nodeCount: Array.isArray(flow.nodes) ? flow.nodes.length : 'not an array',
      edgeCount: Array.isArray(flow.edges) ? flow.edges.length : 'not an array'
    });
    
    // Get the current version number
    const { data: versions, error: versionError } = await supabase
      .from('flow_revisions')
      .select('version')
      .eq('flow_id', flow.id)
      .order('version', { ascending: false })
      .limit(1);
    
    if (versionError) {
      console.error('Error fetching current version:', versionError);
      throw versionError;
    }
    
    const currentVersion = versions && versions.length > 0 ? versions[0].version : 0;
    const newVersion = currentVersion + 1;
    
    console.log(`Creating new revision (version ${newVersion}) for flow:`, flow.id);
    
    // Ensure nodes and edges are arrays
    const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
    const edges = Array.isArray(flow.edges) ? flow.edges : [];
    
    // Get the current user's session to extract the workspace_id
    const { data: { session } } = await supabase.auth.getSession();
    const userWorkspaceId = session?.user?.app_metadata?.workspace_id || 'default';
    
    console.log('Revision data to insert:', {
      flow_id: flow.id,
      version: newVersion,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      modified_by: userId || 'unknown',
      workspace_id: userWorkspaceId
    });
    
    // Save the new revision using the workspace_id from the user's session
    const { data, error } = await supabase
      .from('flow_revisions')
      .insert({
        flow_id: flow.id,
        version: newVersion,
        nodes: nodes,
        edges: edges,
        modified_by: userId || 'unknown',
        change_description: changeDescription || `Version ${newVersion}`,
        workspace_id: userWorkspaceId
      })
      .select();
      
    if (error) {
      console.error('Error inserting flow revision:', error);
      throw error;
    }
    
    console.log('Flow revision saved successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error saving flow revision:', error);
    return { data: null, error };
  }
};

/**
 * Get all revisions for a flow
 * @param {string} flowId - ID of the flow
 * @param {string} workspaceId - ID of the workspace (optional, will use from session if not provided)
 * @returns {Promise} - Supabase response with revisions data
 */
export const getFlowRevisions = async (flowId, workspaceId) => {
  try {
    if (!flowId) {
      console.error('No flowId provided to getFlowRevisions');
      return { data: null, error: new Error('Flow ID is required') };
    }
    
    // Get the current user's session to extract the workspace_id if not provided
    if (!workspaceId) {
      console.log('No workspaceId provided, getting from session');
      const { data: { session } } = await supabase.auth.getSession();
      workspaceId = session?.user?.app_metadata?.workspace_id || 'default';
      console.log('Using workspace_id from session:', workspaceId);
    }
    
    console.log('Getting revisions for flow:', flowId, 'workspace:', workspaceId);
    
    const { data, error } = await supabase
      .from('flow_revisions')
      .select('*')
      .eq('flow_id', flowId)
      .order('version', { ascending: false });
      
    if (error) {
      console.error('Error fetching flow revisions:', error);
      throw error;
    }
    
    console.log('Retrieved revisions:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('Error getting flow revisions:', error);
    return { data: null, error };
  }
};

/**
 * Restore a flow to a specific version
 * @param {string} flowId - ID of the flow to restore
 * @param {string} revisionId - ID of the revision to restore
 * @param {string} workspaceId - ID of the workspace (optional, will use from session if not provided)
 * @returns {Promise} - Supabase response
 */
export const restoreFlowVersion = async (flowId, revisionId, workspaceId) => {
  try {
    if (!flowId || !revisionId) {
      console.error('Missing required parameters in restoreFlowVersion:', { flowId, revisionId });
      return { 
        data: null, 
        error: new Error('Flow ID and revision ID are required') 
      };
    }
    
    // Get the current user's session to extract the workspace_id if not provided
    if (!workspaceId) {
      console.log('No workspaceId provided for restore, getting from session');
      const { data: { session } } = await supabase.auth.getSession();
      workspaceId = session?.user?.app_metadata?.workspace_id || 'default';
      console.log('Using workspace_id from session for restore:', workspaceId);
    }
    
    console.log('Restoring flow:', flowId, 'to revision:', revisionId);
    
    // Get the revision to restore
    const { data: revision, error: revisionError } = await supabase
      .from('flow_revisions')
      .select('nodes, edges, version')
      .eq('id', revisionId)
      .eq('flow_id', flowId)
      .single();
      
    if (revisionError) {
      console.error('Error fetching revision to restore:', revisionError);
      throw revisionError;
    }
    
    if (!revision) {
      const notFoundError = new Error('Revision not found');
      console.error('Revision not found:', notFoundError);
      throw notFoundError;
    }
    
    console.log('Found revision to restore:', revision.version);
    
    // Update the flow with the revision data
    const { data, error } = await supabase
      .from('flows')
      .update({
        nodes: revision.nodes,
        edges: revision.edges,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId);
      
    if (error) {
      console.error('Error updating flow with revision data:', error);
      throw error;
    }
    
    console.log('Flow restored successfully to version:', revision.version);
    
    // Save a new revision to record the restore action
    await saveFlowRevision(
      { 
        id: flowId, 
        nodes: revision.nodes, 
        edges: revision.edges,
        workspace_id: workspaceId
      },
      `Restored to version ${revision.version}`,
      'user'
    );
    
    return { data, error: null };
  } catch (error) {
    console.error('Error restoring flow version:', error);
    return { data: null, error };
  }
};
