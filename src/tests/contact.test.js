import { supabase } from '../services/supabase';

describe('Contact Management', () => {
  let workspace_id;
  let user_id;

  beforeAll(async () => {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');
    user_id = session.user.id;

    // Get workspace
    const { data: workspace } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user_id)
      .single();
    if (!workspace) throw new Error('No workspace found');
    workspace_id = workspace.workspace_id;
  });

  it('should create a contact with workspace and account info', async () => {
    const testContact = {
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '+1234567890',
      email: 'john@example.com',
      lead_source: 'Website',
      market: 'California',
      product: 'Premium',
      tags: ['VIP', 'Enterprise'],
      status: 'active',
      custom_fields: {},
      is_active: true
    };

    // Create contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([{
        ...testContact,
        workspace_id,
        created_by: user_id
      }])
      .select()
      .single();

    expect(error).toBeNull();
    expect(contact).toBeTruthy();
    expect(contact.workspace_id).toBe(workspace_id);
    expect(contact.created_by).toBe(user_id);
    expect(contact.first_name).toBe(testContact.first_name);
    expect(contact.last_name).toBe(testContact.last_name);

    // Clean up - delete test contact
    await supabase
      .from('contacts')
      .delete()
      .eq('id', contact.id);
  });
});
