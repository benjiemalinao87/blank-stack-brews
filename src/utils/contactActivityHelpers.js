import { supabase } from '../lib/supabaseClient.js';
import logger from './logger.js';

/**
 * Utility functions for logging contact activities
 */
const contactActivityHelpers = {
  /**
   * Log a generic contact activity
   * @param {Object} activityData - Data for the activity log
   * @returns {Promise<Object>} Created activity record
   */
  async logActivity(activityData) {
    try {
      const { data, error } = await supabase
        .from('contact_activities')
        .insert([{
          ...activityData,
          timestamp: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      logger.info('Contact activity logged:', data);
      return data;
    } catch (err) {
      logger.error('Error logging contact activity:', err);
      throw err;
    }
  },

  /**
   * Log when a contact is added to a board
   * @param {string} contactId - ID of the contact
   * @param {string} boardId - ID of the board
   * @param {string} columnId - ID of the column
   * @param {string} userId - ID of the user performing the action
   * @returns {Promise<Object>} Created activity record
   */
  async logContactAddedToBoard(contactId, boardId, columnId, userId) {
    return this.logActivity({
      contact_id: contactId,
      board_id: boardId,
      column_id: columnId,
      user_id: userId,
      type: 'added_to_board',
      details: `Contact added to board ${boardId}, column ${columnId}`,
    });
  },

  /**
   * Log when a contact is moved between columns
   * @param {string} contactId - ID of the contact
   * @param {string} boardId - ID of the board
   * @param {string} fromColumnId - ID of the source column
   * @param {string} toColumnId - ID of the destination column
   * @param {string} userId - ID of the user performing the action
   * @returns {Promise<Object>} Created activity record
   */
  async logContactMovedInBoard(contactId, boardId, fromColumnId, toColumnId, userId) {
    return this.logActivity({
      contact_id: contactId,
      board_id: boardId,
      from_column_id: fromColumnId,
      to_column_id: toColumnId,
      user_id: userId,
      type: 'moved_in_board',
      details: `Contact moved from column ${fromColumnId} to ${toColumnId} in board ${boardId}`,
    });
  },
  
  /**
   * Log when a contact property is updated
   * @param {string} contactId - ID of the contact
   * @param {string} propertyName - Name of the property updated
   * @param {any} oldValue - Previous value of the property
   * @param {any} newValue - New value of the property
   * @param {string} userId - ID of the user performing the action
   * @returns {Promise<Object>} Created activity record
   */
  async logContactUpdated(contactId, propertyName, oldValue, newValue, userId) {
    return this.logActivity({
      contact_id: contactId,
      user_id: userId,
      type: 'contact_updated',
      details: `Property '${propertyName}' updated from '${oldValue}' to '${newValue}'`,
    });
  },

  /**
   * Log when a contact is deleted
   * @param {string} contactId - ID of the contact
   * @param {string} userId - ID of the user performing the action
   * @returns {Promise<Object>} Created activity record
   */
  async logContactDeleted(contactId, userId) {
    return this.logActivity({
      contact_id: contactId,
      user_id: userId,
      type: 'contact_deleted',
      details: 'Contact deleted',
    });
  },
  
  /**
   * Get activities for a specific contact
   * @param {string} contactId - ID of the contact
   * @param {Object} options - Query options (limit, offset, etc.)
   * @returns {Promise<Array>} List of activities
   */
  async getContactActivities(contactId, options = {}) {
    try {
      let query = supabase
        .from('contact_activities')
        .select('*')
        .eq('contact_id', contactId)
        .order('timestamp', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('Error fetching contact activities:', err);
      throw err;
    }
  },
};

export default contactActivityHelpers;
