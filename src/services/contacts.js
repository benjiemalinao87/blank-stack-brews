import { supabase } from './supabase';

/**
 * Create a new contact
 * @param {Object} contactData - Contact data including name, phone_number, etc.
 * @param {string} workspaceId - Current workspace ID
 * @returns {Promise} Created contact data
 */
export const createContact = async (contactData, workspaceId) => {
  const { data, error } = await supabase
    .from('contacts')
    .insert([{
      ...contactData,
      workspace_id: workspaceId
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get all contacts for the current workspace
 * @param {string} workspaceId - Current workspace ID
 * @returns {Promise} Array of contacts
 */
export const getContacts = async (workspaceId) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get a single contact by ID
 * @param {string} contactId - Contact ID
 * @param {string} workspaceId - Current workspace ID
 * @returns {Promise} Contact data
 */
export const getContactById = async (contactId, workspaceId) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a contact
 * @param {string} contactId - Contact ID to update
 * @param {Object} updateData - New contact data
 * @param {string} workspaceId - Current workspace ID
 * @returns {Promise} Updated contact data
 */
export const updateContact = async (contactId, updateData, workspaceId) => {
  const { data, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', contactId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a contact
 * @param {string} contactId - Contact ID to delete
 * @param {string} workspaceId - Current workspace ID
 * @returns {Promise} Deleted contact data
 */
export const deleteContact = async (contactId, workspaceId) => {
  const { data, error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Search contacts by phone number
 * @param {string} phoneNumber - Phone number to search for
 * @param {string} workspaceId - Current workspace ID
 * @returns {Promise} Array of matching contacts
 */
export const searchContactsByPhone = async (phoneNumber, workspaceId) => {
  const { data, error } = await supabase
    .rpc('find_users_by_phone', { search_phone: phoneNumber });

  if (error) throw error;
  return data;
};
