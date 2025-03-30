import { supabase } from '../lib/supabaseUnified';
import logger from '../utils/logger';

/**
 * Middleware to validate workspace access
 * @param {string} workspaceId - The ID of the workspace to validate
 * @param {Object} options - Options for validation
 * @param {Function} options.onError - Error callback function
 * @returns {Promise<{hasAccess: boolean, workspace?: Object}>} - Returns access status and workspace data
 */
export const validateWorkspaceAccess = async (workspaceId, options = {}) => {
  try {
    if (!workspaceId) {
      const error = new Error('Workspace ID is required');
      if (options.onError) {
        options.onError(error, 'VALIDATION_ERROR', { context: 'workspace_validation' });
      }
      return { hasAccess: false };
    }

    // Get current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      const error = sessionError || new Error('No active session');
      if (options.onError) {
        options.onError(error, 'AUTH_ERROR', { context: 'workspace_validation' });
      }
      return { hasAccess: false };
    }

    // Check if user is a member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      const error = membershipError || new Error('User is not a member of this workspace');
      if (options.onError) {
        options.onError(error, 'ACCESS_ERROR', { context: 'workspace_validation' });
      }
      return { hasAccess: false };
    }

    // Get workspace details
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      const error = workspaceError || new Error('Workspace not found');
      if (options.onError) {
        options.onError(error, 'NOT_FOUND_ERROR', { context: 'workspace_validation' });
      }
      return { hasAccess: false };
    }

    return { 
      hasAccess: true,
      workspace,
      role: membership.role
    };
  } catch (error) {
    logger.error('Workspace validation failed:', error);
    if (options.onError) {
      options.onError(error, 'UNKNOWN_ERROR', { context: 'workspace_validation' });
    }
    return { hasAccess: false };
  }
};
