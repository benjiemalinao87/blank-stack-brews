import { supabase } from './supabase';

/**
 * Get all boards for a workspace
 * @param {string} workspaceId - The workspace ID
 * @returns {Promise<Array>} - Array of boards
 */
export const getWorkspaceBoards = async (workspaceId) => {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching workspace boards:', error);
    throw error;
  }
};

/**
 * Get all columns for a board
 * @param {string} boardId - The board ID
 * @returns {Promise<Array>} - Array of columns
 */
export const getBoardColumns = async (boardId) => {
  try {
    const { data, error } = await supabase
      .from('board_columns')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching board columns:', error);
    throw error;
  }
};

/**
 * Add a contact to a board column
 * @param {string} contactId - The contact ID
 * @param {string} boardId - The board ID
 * @param {string} columnId - The column ID
 * @returns {Promise<Object>} - The created board contact
 */
export const addContactToBoard = async (contactId, boardId, columnId) => {
  try {
    console.log('Adding contact to board:', { contactId, boardId, columnId });
    
    // Delete any existing entries for this contact (cleanup duplicates)
    const { error: deleteError } = await supabase
      .from('board_contacts')
      .delete()
      .eq('contact_id', contactId);
    
    if (deleteError) {
      console.error('Error deleting existing contact entries:', deleteError);
      throw deleteError;
    }
    
    // Add contact to new board
    const { error: insertError } = await supabase
      .from('board_contacts')
      .insert({
        board_id: boardId,
        contact_id: contactId,
        metadata: {
          column_id: columnId,
          added_at: new Date().toISOString()
        },
        status: 'active',
        source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error adding contact to board:', insertError);
      throw insertError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error adding contact to board:', error);
    throw error;
  }
};

/**
 * Move a contact to a different board
 * @param {string} contactId - The contact ID
 * @param {string} fromBoardId - The source board ID
 * @param {string} toBoardId - The target board ID
 * @param {string} toColumnId - The target column ID
 * @returns {Promise<Object>} - The created board contact
 */
export const moveContactToBoard = async (contactId, fromBoardId, toBoardId, toColumnId) => {
  try {
    console.log('Moving contact between boards:', { contactId, fromBoardId, toBoardId, toColumnId });
    
    // Delete any existing entries for this contact (cleanup duplicates)
    const { error: deleteError } = await supabase
      .from('board_contacts')
      .delete()
      .eq('contact_id', contactId);
    
    if (deleteError) {
      console.error('Error deleting existing contact entries:', deleteError);
      throw deleteError;
    }
    
    // Add contact to new board with metadata
    const { error: insertError } = await supabase
      .from('board_contacts')
      .insert({
        board_id: toBoardId,
        contact_id: contactId,
        metadata: {
          column_id: toColumnId,
          last_updated: new Date().toISOString(),
          previous_board_id: fromBoardId
        },
        status: 'active',
        source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error inserting contact to new board:', insertError);
      // If insert fails, try to restore the contact to original board
      await supabase
        .from('board_contacts')
        .insert({
          board_id: fromBoardId,
          contact_id: contactId,
          metadata: {
            column_id: toColumnId,
            last_updated: new Date().toISOString()
          },
          status: 'active',
          source: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      throw insertError;
    }
    
    return true;
  } catch (error) {
    console.error('Error moving contact between boards:', error);
    throw error;
  }
};
