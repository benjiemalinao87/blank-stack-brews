const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWorkspaceSetup() {
  try {
    console.log('Starting workspace functionality test...');

    // 1. Sign in with Google (this will open a browser window)
    console.log('Please sign in with Google in your browser...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    });
    if (signInError) throw signInError;
    console.log('Sign in initiated:', signInData);

    // Wait for authentication
    console.log('Waiting for authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      throw new Error('No session after sign in');
    }
    console.log('Successfully authenticated as:', session.user.email);

    // 2. List existing workspaces
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*');
    if (workspacesError) throw workspacesError;
    console.log('Existing workspaces:', workspaces);

    // 3. List workspace members
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select(`
        id,
        role,
        workspace_id,
        user:user_id (
          email
        )
      `);
    if (membersError) throw membersError;
    console.log('Workspace members:', members);

    // 4. Create a new test workspace
    const { data: newWorkspace, error: createError } = await supabase
      .from('workspaces')
      .insert([
        { name: 'Test Workspace ' + new Date().toISOString() }
      ])
      .select()
      .single();
    if (createError) throw createError;
    console.log('Created new workspace:', newWorkspace);

    // 5. Add current user as admin
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
    console.log('Added current user as admin');

    // 6. Create an invitation
    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .insert([
        {
          workspace_id: newWorkspace.id,
          email: 'test@example.com',
          role: 'agent'
        }
      ])
      .select();
    if (inviteError) throw inviteError;
    console.log('Created invitation:', invite);

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testWorkspaceSetup(); 