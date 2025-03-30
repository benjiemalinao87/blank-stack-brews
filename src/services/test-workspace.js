const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWorkspaceSetup() {
  try {
    console.log('Testing workspace setup...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Has Anon Key:', !!supabaseAnonKey);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    console.log('Current user:', user);

    // Get user's workspaces
    const { data: workspaces, error: workspacesError } = await supabase
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
      .order('created_at', { foreignTable: 'workspaces' });

    if (workspacesError) throw workspacesError;
    console.log('User workspaces:', workspaces);

    // Test successful
    console.log('Workspace setup test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testWorkspaceSetup(); 