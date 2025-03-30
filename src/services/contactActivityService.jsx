import { supabase } from './supabase';

/**
 * Service to handle contact activity logging
 */
const contactActivityService = {
  /**
   * Log a contact activity
   * @param {Object} params - Activity parameters
   * @param {string} params.contactId - ID of the contact (UUID type)
   * @param {string} params.workspaceId - ID of the workspace (text type)
   * @param {string} params.activityType - Type of activity (call, email, note, status_change, etc.)
   * @param {string} params.description - Human-readable description of the activity
   * @param {Object} [params.metadata] - Additional metadata for the activity
   * @returns {Promise<Object>} The created activity
   */
  logActivity: async ({
    contactId,
    workspaceId,
    activityType,
    description,
    metadata = {}
  }) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('activities')
        .insert({
          contact_id: contactId,
          workspace_id: workspaceId,
          created_by: user?.id,
          activity_type: activityType,
          description,
          metadata
        })
        .select();

      if (error) {
        console.error('Error logging contact activity:', error);
        // Don't block the main operation if logging fails
        return null;
      }

      return data[0];
    } catch (err) {
      console.error('Unexpected error in logActivity:', err);
      return null;
    }
  },

  /**
   * Get activities for a contact
   * @param {string} contactId - Contact ID (UUID type)
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=20] - Number of activities to fetch
   * @param {number} [options.page=0] - Page number for pagination
   * @param {string} [options.activityType] - Filter by activity type
   * @param {Date} [options.startDate] - Filter activities after this date
   * @param {Date} [options.endDate] - Filter activities before this date
   * @returns {Promise<Object>} Activities and pagination info
   */
  getActivities: async (contactId, options = {}) => {
    try {
      const {
        limit = 20,
        page = 0,
        activityType,
        startDate,
        endDate
      } = options;

      let query = supabase
        .from('activities')
        .select('*, created_by:created_by(id, email)')
        .eq('contact_id', contactId)
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
        throw error;
      }

      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('contact_id', contactId);

      if (countError) {
        throw countError;
      }

      return {
        activities: data || [],
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore: (page + 1) * limit < totalCount
        }
      };
    } catch (err) {
      console.error('Error fetching contact activities:', err);
      throw err;
    }
  },

  /**
   * Get activities for a workspace
   * @param {string} workspaceId - Workspace ID (text type)
   * @param {Object} [options] - Query options (same as getActivities)
   * @returns {Promise<Object>} Activities and pagination info
   */
  getWorkspaceActivities: async (workspaceId, options = {}) => {
    try {
      const {
        limit = 20,
        page = 0,
        activityType,
        startDate,
        endDate,
        contactId
      } = options;

      let query = supabase
        .from('activities')
        .select('*, created_by:created_by(id, email), contact:contact_id(id, first_name, last_name, phone_number)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      // Apply filters if provided
      if (activityType) {
        query = query.eq('activity_type', activityType);
      }

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (countError) {
        throw countError;
      }

      return {
        activities: data || [],
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore: (page + 1) * limit < totalCount
        }
      };
    } catch (err) {
      console.error('Error fetching workspace activities:', err);
      throw err;
    }
  }
};

export default contactActivityService;
