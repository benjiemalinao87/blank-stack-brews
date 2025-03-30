import { useState, useEffect } from 'react';
import { Spinner } from '@chakra-ui/react';
import { supabase } from '../services/supabase';
import { useErrorHandler, ErrorTypes } from '../services/errorHandling.jsx';

// Cache workspace permissions to reduce database queries
const permissionCache = new Map();

/**
 * Base validation function without hooks
 * @param {string} workspaceId - The workspace to validate access for
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cached permissions
 * @param {function} options.onError - Error handling function
 * @returns {Promise<{ hasAccess: boolean, role: string | null }>}
 */
export const validateWorkspaceAccess = async (workspaceId, options = {}) => {
  const {
    useCache = true,
    onError = console.error
  } = options;

  // Check cache first if enabled
  if (useCache && permissionCache.has(workspaceId)) {
    return permissionCache.get(workspaceId);
  }

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      onError(userError || new Error('No user found'), ErrorTypes.WORKSPACE_ACCESS, {
        context: 'Workspace Access - Auth Check'
      });
      return { hasAccess: false, role: null };
    }

    // Query workspace membership
    const { data, error } = await supabase
      .from('workspace_members')
      .select('role')
      .match({
        user_id: user.id,
        workspace_id: workspaceId
      })
      .single();

    if (error) {
      onError(error, ErrorTypes.WORKSPACE_PERMISSION, {
        context: 'Workspace Access - Permission Check'
      });
      return { hasAccess: false, role: null };
    }

    if (!data) {
      onError(new Error('No workspace membership found'), ErrorTypes.WORKSPACE_NOT_FOUND, {
        context: 'Workspace Access - Membership Check'
      });
      return { hasAccess: false, role: null };
    }

    const result = { hasAccess: true, role: data.role };
    
    // Cache the result
    if (useCache) {
      permissionCache.set(workspaceId, result);
    }

    return result;
  } catch (error) {
    onError(error, ErrorTypes.UNKNOWN_ERROR, {
      context: 'Workspace Access - Unexpected Error'
    });
    return { hasAccess: false, role: null };
  }
};

/**
 * Clear workspace permission cache
 * @param {string} [workspaceId] - Optional specific workspace to clear from cache
 */
export const clearWorkspaceCache = (workspaceId) => {
  if (workspaceId) {
    permissionCache.delete(workspaceId);
  } else {
    permissionCache.clear();
  }
};

/**
 * Hook to handle workspace validation with UI feedback
 * @param {Object} options - Hook options
 * @param {function} options.onAccessDenied - Custom access denied handler
 * @returns {Object} Validation methods and state
 */
export const useWorkspaceValidation = (options = {}) => {
  const { handleError } = useErrorHandler();

  const validateAccess = async (workspaceId, operation = 'access') => {
    try {
      const result = await validateWorkspaceAccess(workspaceId, {
        useCache: true,
        onError: (error, errorType, errorOptions) => {
          handleError(error, errorType, {
            ...errorOptions,
            showToast: true,
            onAction: () => {
              if (errorType === ErrorTypes.WORKSPACE_ACCESS) {
                window.location.href = '/login';
              } else {
                window.location.href = '/dashboard';
              }
            }
          });
        }
      });

      if (!result.hasAccess && options.onAccessDenied) {
        options.onAccessDenied(workspaceId);
      }

      return result.hasAccess;
    } catch (error) {
      handleError(error, ErrorTypes.UNKNOWN_ERROR, {
        context: `Workspace ${operation} - Validation Error`,
        onAction: () => window.location.href = '/dashboard'
      });
      return false;
    }
  };

  return {
    validateAccess,
    clearCache: clearWorkspaceCache
  };
};

/**
 * Higher-order component to protect workspace-specific components
 */
export const withWorkspaceValidation = (WrappedComponent) => {
  return function WorkspaceValidationWrapper(props) {
    const { handleError } = useErrorHandler();
    const [hasAccess, setHasAccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAccess = async () => {
        if (props.workspaceId) {
          try {
            const result = await validateWorkspaceAccess(props.workspaceId, {
              onError: (error, errorType, errorOptions) => {
                handleError(error, errorType, {
                  ...errorOptions,
                  showToast: true,
                  onAction: () => window.location.href = '/dashboard'
                });
              }
            });
            setHasAccess(result.hasAccess);
          } catch (error) {
            handleError(error, ErrorTypes.WORKSPACE_ACCESS, {
              context: 'Component Access Check',
              onAction: () => window.location.href = '/dashboard'
            });
            setHasAccess(false);
          }
        }
        setIsLoading(false);
      };

      checkAccess();
    }, [props.workspaceId]);

    if (isLoading) {
      return <Spinner />;
    }

    if (!hasAccess) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};
