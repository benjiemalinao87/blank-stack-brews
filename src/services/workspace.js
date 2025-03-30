import { supabase } from './supabase';

// Get user's workspaces
export const getUserWorkspaces = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      id,
      name,
      created_at,
      updated_at,
      workspace_members!inner (
        role
      )
    `)
    .eq('workspace_members.user_id', user.id);

  if (error) {
    console.error('Error fetching workspaces:', error);
    throw error;
  }
  return data;
};

// Get workspace members
export const getWorkspaceMembers = async (workspaceId) => {
  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id,
      role,
      created_at,
      updated_at,
      user:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('Error fetching workspace members:', error);
    throw error;
  }
  return data;
};

// Create a new workspace
export const createWorkspace = async (name) => {
  if (!name) {
    throw new Error('Workspace name is required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Start a transaction
  try {
    console.log(`Creating workspace with name: ${name} for user: ${user.id}`);
    
    // 1. Create the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([{ name }])
      .select()
      .single();

    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError);
      throw workspaceError;
    }

    console.log(`Workspace created: ${workspace.id}`);

    // 2. Add the creator as an admin
    console.log(`Adding user ${user.id} as admin to workspace ${workspace.id}`);
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert([{
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'admin'
      }]);

    if (memberError) {
      console.error('Error adding workspace member:', memberError);
      // Try to rollback workspace creation
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      throw memberError;
    }

    console.log(`Successfully added user as workspace member`);

    // 3. Create default status categories - INCLUDE created_by field
    const defaultCategories = [
      { 
        name: 'Lead Status', 
        workspace_id: workspace.id,
        created_by: user.id  // Add created_by field
      }
    ];

    const { data: categories, error: categoriesError } = await supabase
      .from('status_categories')
      .insert(defaultCategories)
      .select();

    if (categoriesError) {
      console.error('Error creating status categories:', categoriesError);
      // Try to rollback workspace and member creation
      await supabase.from('workspace_members').delete().eq('workspace_id', workspace.id);
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      throw categoriesError;
    }

    console.log(`Created default status categories`);

    // 4. Create default status options for each category - INCLUDE created_by field
    const leadStatusCategory = categories.find(c => c.name === 'Lead Status');

    const defaultStatuses = [
      // Lead Statuses
      { 
        workspace_id: workspace.id,
        category_id: leadStatusCategory.id,
        name: 'Lead',
        color: '#4285F4',
        is_default: true,
        display_order: 1,
        created_by: user.id  // Add created_by field
      },
      { 
        workspace_id: workspace.id,
        category_id: leadStatusCategory.id,
        name: 'Contacted',
        color: '#34A853',
        is_default: false,
        display_order: 2,
        created_by: user.id  // Add created_by field
      },
      { 
        workspace_id: workspace.id,
        category_id: leadStatusCategory.id,
        name: 'Duplicate',
        color: '#EA4335',
        is_default: false,
        display_order: 3,
        created_by: user.id  // Add created_by field
      }
    ];

    const { error: statusesError } = await supabase
      .from('status_options')
      .insert(defaultStatuses);

    if (statusesError) {
      console.error('Error creating default statuses:', statusesError);
      // Try to rollback everything
      await supabase.from('status_categories').delete().eq('workspace_id', workspace.id);
      await supabase.from('workspace_members').delete().eq('workspace_id', workspace.id);
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      throw statusesError;
    }

    console.log(`Created default statuses`);

    // 5. Create onboarding status record
    const { error: onboardingStatusError } = await supabase
      .from('onboarding_status')
      .insert({
        user_id: user.id,
        workspace_id: workspace.id,
        is_completed: false
      });

    if (onboardingStatusError) {
      console.error('Error creating onboarding status:', onboardingStatusError);
      // Continue anyway, this is not critical
    } else {
      console.log(`Created onboarding status record`);
    }

    // 6. Fetch the complete workspace data
    const { data: completeWorkspace, error: fetchError } = await supabase
      .from('workspaces')
      .select(`
        id,
        name,
        created_at,
        updated_at
      `)
      .eq('id', workspace.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete workspace:', fetchError);
      throw fetchError;
    }

    console.log(`Successfully created and configured workspace: ${completeWorkspace.id}`);
    return completeWorkspace;
  } catch (error) {
    console.error('Error in createWorkspace transaction:', error);
    throw error;
  }
};

// Update workspace
export const updateWorkspace = async (id, updates) => {
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating workspace:', error);
    throw error;
  }
  return data;
};

// Add member to workspace
export const addWorkspaceMember = async (workspaceId, email, role) => {
  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  if (!email) {
    throw new Error('Email is required');
  }

  if (!role) {
    throw new Error('Role is required');
  }

  // First get the user ID from the email
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    console.error('Error fetching user:', userError);
    throw userError;
  }

  // If user doesn't exist, create an invite
  if (!users) {
    return workspaceService.inviteToWorkspace(workspaceId, email, role);
  }

  try {
    // If user exists, add them directly
    const { data, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: users.id,
        role
      })
      .select()
      .single();

    if (error) {
      // Check if this is the single workspace membership error
      if (error.message && error.message.includes('User is already a member of a workspace')) {
        throw new Error('This user is already a member of another workspace. Users can only belong to one workspace.');
      }
      console.error('Error adding workspace member:', error);
      throw error;
    }
    return data;
  } catch (error) {
    // Handle the specific error from our trigger
    if (error.message && error.message.includes('User is already a member of a workspace')) {
      throw new Error('This user is already a member of another workspace. Users can only belong to one workspace.');
    }
    throw error;
  }
};

// Remove member from workspace
export const removeWorkspaceMember = async (workspaceId, userId) => {
  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  if (!userId) {
    throw new Error('User ID is required');
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing workspace member:', error);
    throw error;
  }
};

// Ensure user has a workspace
export const ensureDefaultWorkspace = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const defaultName = 'My Workspace';
  
  try {
    return await createWorkspace(defaultName);
  } catch (error) {
    console.error('Error creating default workspace:', error);
    throw error;
  }
};

// Get current workspace
export const getCurrentWorkspace = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No active session');

    // Get user's workspace
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*, workspace_members!inner(*)')
      .eq('workspace_members.user_id', session.user.id)
      .limit(1)
      .single();

    if (workspaceError) {
      console.error('Error fetching workspace:', workspaceError);
      throw workspaceError;
    }

    if (!workspaces) {
      // Create a default workspace if none exists
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
            user_id: session.user.id,
            role: 'admin'
          }
        ]);

      if (memberError) throw memberError;

      return newWorkspace;
    }

    return workspaces;
  } catch (error) {
    console.error('Error in getCurrentWorkspace:', error);
    throw error;
  }
};

export const workspaceService = {
  // Get all workspaces for the current user
  async getUserWorkspaces() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces:workspace_id (
          id,
          name,
          is_default,
          settings,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
    return data;
  },

  // Get workspace members
  async getWorkspaceMembers(workspaceId) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        role,
        user:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error fetching workspace members:', error);
      throw error;
    }
    return data;
  },

  // Invite user to workspace
  async inviteToWorkspace(workspaceId, email, role) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    if (!email) {
      throw new Error('Email is required');
    }

    if (!role) {
      throw new Error('Role is required');
    }

    const { data, error } = await supabase
      .from('workspace_invites')
      .insert([
        {
          workspace_id: workspaceId,
          email,
          role
        }
      ])
      .select();

    if (error) {
      console.error('Error inviting user to workspace:', error);
      throw error;
    }
    return data[0];
  },

  // Update workspace settings
  async updateWorkspaceSettings(workspaceId, settings) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    if (!settings) {
      throw new Error('Settings are required');
    }

    const { data, error } = await supabase
      .from('workspaces')
      .update({ settings })
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating workspace settings:', error);
      throw error;
    }
    return data;
  },

  // Update member role
  async updateMemberRole(workspaceId, userId, role) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!role) {
      throw new Error('Role is required');
    }

    const { data, error } = await supabase
      .from('workspace_members')
      .update({ role })
      .match({ workspace_id: workspaceId, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
    return data;
  },

  // Remove member from workspace
  async removeMember(workspaceId, userId) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .match({ workspace_id: workspaceId, user_id: userId });

    if (error) {
      console.error('Error removing member from workspace:', error);
      throw error;
    }
  },

  // Get pending invites for a workspace
  async getWorkspaceInvites(workspaceId) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    const { data, error } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error fetching workspace invites:', error);
      throw error;
    }
    return data;
  },

  // Cancel an invite
  async cancelInvite(inviteId) {
    if (!inviteId) {
      throw new Error('Invite ID is required');
    }

    const { error } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      console.error('Error canceling invite:', error);
      throw error;
    }
  }
};