import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, onAuthStateChange } from '../lib/supabaseUnified';
import logger from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure supabase client is initialized before using it
    if (!supabase) {
      console.error("Supabase client is not initialized. Check configuration.");
      setLoading(false);
      setError(new Error("Supabase configuration error"));
      return;
    }

    // Set up auth state change listener using the imported function
    const { data: { subscription } } = onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            let currentUser = session.user;
            logger.debug(`Auth state change: ${event} for user ${currentUser.id}`);
            
            // Check if user already has a workspace in their metadata
            const hasWorkspaceInMetadata = currentUser.user_metadata?.workspace_id;
            
            if (hasWorkspaceInMetadata) {
              logger.debug(`User has workspace ID in metadata: ${currentUser.user_metadata.workspace_id}`);
              
              // Verify this workspace exists and user has membership
              const { data: membership, error: membershipError } = await supabase
                .from('workspace_members')
                .select('workspace_id, role')
                .eq('user_id', currentUser.id)
                .eq('workspace_id', currentUser.user_metadata.workspace_id)
                .maybeSingle();
                
              if (membershipError) {
                logger.error('Error verifying workspace membership:', membershipError);
              }
              
              // If membership was not found, we need to ensure user has proper workspace setup
              if (!membership) {
                logger.debug('No membership found for workspace in metadata, checking for any workspace membership');
                await ensureUserHasWorkspace(currentUser);
              }
            } else {
              // User has no workspace in metadata
              logger.debug('User has no workspace ID in metadata');
              await ensureUserHasWorkspace(currentUser);
            }
            
            // Get the latest user data
            const { data: { user: updatedUser }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              logger.error('Error fetching updated user:', userError);
              setUser(currentUser);
            } else {
              setUser(updatedUser);
            }
          } catch (error) {
            logger.error('Error during auth state change handling:', error);
            setUser(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Helper function to ensure user has a workspace and all required entries
    const ensureUserHasWorkspace = async (user) => {
      logger.debug(`Ensuring workspace setup for user ${user.id}`);
      
      try {
        // 1. Check for any existing workspace membership
        const { data: memberships, error: membershipError } = await supabase
          .from('workspace_members')
          .select('workspace_id, role')
          .eq('user_id', user.id);
          
        if (membershipError) {
          logger.error('Error checking workspace memberships:', membershipError);
          throw membershipError;
        }
        
        // If user already has memberships
        if (memberships && memberships.length > 0) {
          const primaryMembership = memberships[0];
          logger.debug(`Found existing workspace membership: ${primaryMembership.workspace_id}`);
          
          // Update user metadata with workspace ID
          const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
            data: { workspace_id: primaryMembership.workspace_id }
          });
          
          if (updateError) {
            logger.error('Error updating user metadata:', updateError);
          } else {
            logger.debug(`Updated user metadata with workspace ID: ${primaryMembership.workspace_id}`);
          }
          
          // Check if onboarding status exists
          await ensureOnboardingStatus(user.id, primaryMembership.workspace_id);
          
          return updatedUser ? updatedUser.user : user;
        }
        
        // No memberships found, create new workspace
        logger.debug('No workspace memberships found, creating new workspace');
        const workspaceName = user.email ? `${user.email.split('@')[0]}'s Workspace` : 'My Workspace';
        
        // Create a new workspace
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({ name: workspaceName })
          .select()
          .single();
          
        if (workspaceError) {
          logger.error('Error creating workspace:', workspaceError);
          throw workspaceError;
        }
        
        logger.debug(`Created workspace: ${workspace.id}`);
        
        // Create workspace membership
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'admin'
          });
          
        if (memberError) {
          logger.error('Error creating workspace membership:', memberError);
          throw memberError;
        }
        
        logger.debug(`Created workspace membership for user ${user.id} in workspace ${workspace.id}`);
        
        // Ensure onboarding status exists
        await ensureOnboardingStatus(user.id, workspace.id);
        
        // Update user metadata with workspace ID
        const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
          data: { workspace_id: workspace.id }
        });
        
        if (updateError) {
          logger.error('Error updating user metadata:', updateError);
          return user;
        }
        
        logger.debug(`Updated user metadata with workspace ID: ${workspace.id}`);
        return updatedUser ? updatedUser.user : user;
      } catch (error) {
        logger.error('Error in ensureUserHasWorkspace:', error);
        return user;
      }
    };
    
    // Helper function to ensure onboarding status exists
    const ensureOnboardingStatus = async (userId, workspaceId) => {
      logger.debug(`Ensuring onboarding status for user ${userId} in workspace ${workspaceId}`);
      
      try {
        // Check if onboarding status exists
        const { data: existingStatus, error: statusCheckError } = await supabase
          .from('onboarding_status')
          .select('*')
          .eq('user_id', userId)
          .eq('workspace_id', workspaceId)
          .maybeSingle();
          
        if (statusCheckError) {
          logger.error('Error checking onboarding status:', statusCheckError);
          throw statusCheckError;
        }
        
        // If no status exists, create it
        if (!existingStatus) {
          logger.debug('No onboarding status found, creating new entry');
          
          const { error: createStatusError } = await supabase
            .from('onboarding_status')
            .insert({
              user_id: userId,
              workspace_id: workspaceId,
              is_completed: false
            });
            
          if (createStatusError) {
            logger.error('Error creating onboarding status:', createStatusError);
            throw createStatusError;
          }
          
          logger.debug('Created onboarding status successfully');
        } else {
          logger.debug('Onboarding status already exists');
        }
        
        return true;
      } catch (error) {
        logger.error('Error in ensureOnboardingStatus:', error);
        return false;
      }
    };

    // Check initial session on component mount
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Session check error:', error);
          throw error;
        }
        
        if (session?.user) {
          const currentUser = session.user;
          await ensureUserHasWorkspace(currentUser);
          
          // Get the latest user data after potential metadata updates
          const { data: { user: updatedUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            logger.error('Error fetching updated user:', userError);
            setUser(currentUser);
          } else {
            setUser(updatedUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error('Error during session check:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    error
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
