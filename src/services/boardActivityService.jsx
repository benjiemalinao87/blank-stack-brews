import { supabase } from './supabase';

/**
 * Service to handle board activity logging
 */
const boardActivityService = {
  /**
   * Log a board activity
   * @param {Object} params - Activity parameters
   * @param {string} params.boardId - ID of the board (text type)
   * @param {string} params.workspaceId - ID of the workspace (text type)
   * @param {string} params.activityType - Type of activity
   * @param {string} params.description - Human-readable description of the activity
   * @param {Object} [params.beforeState] - State before the change
   * @param {Object} [params.afterState] - State after the change
   * @param {Object} [params.metadata] - Additional metadata for the activity
   * @returns {Promise<Object>} The created activity
   */
  logActivity: async ({
    boardId,
    workspaceId,
    activityType,
    description,
    beforeState = null,
    afterState = null,
    metadata = {}
  }) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('board_activities')
        .insert({
          board_id: boardId, // Text type
          workspace_id: workspaceId, // Text type
          user_id: user?.id,
          activity_type: activityType,
          description,
          before_state: beforeState,
          after_state: afterState,
          metadata
        })
        .select();

      if (error) {
        console.error('Error logging board activity:', error);
        // Don't block the main operation if logging fails
        return null;
      }

      return data[0];
    } catch (err) {
      console.error('Exception logging board activity:', err);
      // Don't block the main operation if logging fails
      return null;
    }
  },

  /**
   * Get activities for a board
   * @param {string} boardId - Board ID (text type)
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=20] - Number of activities to fetch
   * @param {number} [options.page=0] - Page number for pagination
   * @param {string} [options.activityType] - Filter by activity type
   * @param {Date} [options.startDate] - Filter activities after this date
   * @param {Date} [options.endDate] - Filter activities before this date
   * @returns {Promise<Object>} Activities and pagination info
   */
  getActivities: async (boardId, options = {}) => {
    const {
      limit = 20,
      page = 0,
      activityType,
      startDate,
      endDate
    } = options;

    let query = supabase
      .from('board_activities')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    // Apply filters if provided
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching board activities:', error);
      throw error;
    }

    return {
      activities: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: data && data.length === limit
      }
    };
  },

  /**
   * Get activities for a workspace
   * @param {string} workspaceId - Workspace ID (text type)
   * @param {Object} [options] - Query options (same as getActivities)
   * @returns {Promise<Object>} Activities and pagination info
   */
  getWorkspaceActivities: async (workspaceId, options = {}) => {
    const {
      limit = 20,
      page = 0,
      activityType,
      startDate,
      endDate
    } = options;

    let query = supabase
      .from('board_activities')
      .select('*, boards(name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    // Apply filters if provided
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching workspace activities:', error);
      throw error;
    }

    return {
      activities: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: data && data.length === limit
      }
    };
  }
};

export default boardActivityService;
