import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseUnified';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadWorkspace = async () => {
      if (!user) {
        setCurrentWorkspace(null);
        setLoading(false);
        return;
      }

      try {
        // First, check if user has any workspaces
        const { data: workspaceMembers, error: memberError } = await supabase
          .from('workspace_members')
          .select('workspace_id, role')
          .eq('user_id', user.id)
          .single();

        if (memberError) {
          if (memberError.code === 'PGRST116') {
            // No workspace found, create one
            const { data: newWorkspace, error: createError } = await supabase
              .from('workspaces')
              .insert([
                { 
                  name: 'My Workspace',
                  created_by: user.id
                }
              ])
              .select()
              .single();

            if (createError) throw createError;

            // Add user as member of the new workspace
            const { error: membershipError } = await supabase
              .from('workspace_members')
              .insert([
                {
                  workspace_id: newWorkspace.id,
                  user_id: user.id,
                  role: 'owner'
                }
              ]);

            if (membershipError) throw membershipError;

            if (isMounted) {
              setCurrentWorkspace(newWorkspace);
              setError(null);
            }
          } else {
            throw memberError;
          }
        } else {
          // Get the workspace details
          const { data: workspace, error: workspaceError } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', workspaceMembers.workspace_id)
            .single();

          if (workspaceError) throw workspaceError;

          if (isMounted) {
            setCurrentWorkspace(workspace);
            setError(null);
          }
        }
      } catch (error) {
        logger.error('Error in loadWorkspace:', error);
        if (isMounted) {
          setError(error);
          setCurrentWorkspace(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const value = {
    currentWorkspace,
    setCurrentWorkspace,
    loading,
    error
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};