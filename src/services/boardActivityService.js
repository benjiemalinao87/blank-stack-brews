import { supabase } from '../lib/supabaseClient.js';
import logger from '../utils/logger.js';

/**
 * Service for managing board activity tracking
 */
const boardActivityService = {
  /**
   * Log a board activity
   * @param {Object} activity - Activity details
   * @returns {Promise<Object>} Created activity record
   */
  async logActivity(activity) {
    try {
      const { data, error } = await supabase
        .from('board_activities')
        .insert([{
          ...activity,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('Error logging board activity:', err);
      throw err;
    }
  },

  /**
   * Get activities for a specific board
   * @param {string} boardId - ID of the board
   * @param {Object} options - Query options (limit, offset, etc.)
   * @returns {Promise<Array>} List of activities
   */
  async getBoardActivities(boardId, options = {}) {
    try {
      let query = supabase
        .from('board_activities')
        .select('*')
        .eq('board_id', boardId)
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
      logger.error('Error fetching board activities:', err);
      throw err;
    }
  },

  /**
   * Get recent activities across all boards
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Array>} List of recent activities
   */
  async getRecentActivities(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('board_activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (err) {
      logger.error('Error fetching recent activities:', err);
      throw err;
    }
  },

  /**
   * Delete activities for a specific board
   * @param {string} boardId - ID of the board
   * @returns {Promise<void>}
   */
  async clearBoardActivities(boardId) {
    try {
      const { error } = await supabase
        .from('board_activities')
        .delete()
        .eq('board_id', boardId);

      if (error) throw error;
    } catch (err) {
      logger.error('Error clearing board activities:', err);
      throw err;
    }
  }
};

export default boardActivityService;
