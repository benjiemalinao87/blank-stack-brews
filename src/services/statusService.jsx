import { supabase } from './supabase';
import logger from '../utils/logger';

/**
 * Fetch all status categories for the current workspace
 * @param {string} workspaceId - The workspace ID to filter by
 * @returns {Promise<Array>} Array of status categories
 */
export const getStatusCategories = async (workspaceId) => {
  try {
    if (!workspaceId) {
      logger.error('No workspace ID provided to getStatusCategories');
      return [];
    }
    
    logger.info(`Fetching status categories for workspace ${workspaceId}`);
    const { data, error } = await supabase
      .from('status_categories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('id');
      
    if (error) {
      logger.error('Error fetching status categories:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    logger.error('Unexpected error in getStatusCategories:', error);
    return [];
  }
};

/**
 * Fetch status options for a specific category
 * @param {number} categoryId - Category ID
 * @param {string} workspaceId - The workspace ID to filter by
 * @returns {Promise<Array>} Array of status options
 */
export const getStatusOptionsByCategory = async (categoryId, workspaceId) => {
  try {
    if (!workspaceId) {
      logger.error('No workspace ID provided to getStatusOptionsByCategory');
      return [];
    }
    
    logger.info(`Fetching status options for category ${categoryId} in workspace ${workspaceId}`);
    const { data, error } = await supabase
      .from('status_options')
      .select('*')
      .eq('category_id', categoryId)
      .eq('workspace_id', workspaceId)
      .order('display_order');
      
    if (error) {
      logger.error('Error fetching status options:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    logger.error('Unexpected error in getStatusOptionsByCategory:', error);
    return [];
  }
};

/**
 * Create a new status option
 * @param {Object} params - Parameters for creating a status option
 * @param {number} params.category_id - Category ID
 * @param {string} params.name - Status name
 * @param {string} [params.description] - Status description
 * @param {string} [params.color] - Status color (hex)
 * @param {boolean} [params.is_default] - Whether this is the default option
 * @param {number} [params.display_order] - Display order
 * @returns {Promise<Object>} The created status option
 */
export const createStatusOption = async (params) => {
  try {
    logger.info('Creating new status option');
    // Get current workspace_id
    const { data: workspaceData } = await supabase.auth.getSession();
    const workspace_id = workspaceData?.session?.user?.app_metadata?.workspace_id;
    
    if (!workspace_id) {
      logger.error('No workspace found for current user');
      throw new Error('No workspace found for current user');
    }
    
    const createParams = {
      ...params,
      workspace_id
    };
    
    const { data, error } = await supabase
      .from('status_options')
      .insert([createParams])
      .select()
      .single();
      
    if (error) {
      logger.error('Error creating status option:', error);
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Unexpected error in createStatusOption:', error);
    throw error;
  }
};

/**
 * Update an existing status option
 * @param {number} id - Status option ID
 * @param {Object} params - Parameters to update
 * @returns {Promise<Object>} The updated status option
 */
export const updateStatusOption = async (id, params) => {
  try {
    logger.info(`Updating status option ${id}`);
    const { data, error } = await supabase
      .from('status_options')
      .update(params)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      logger.error('Error updating status option:', error);
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Unexpected error in updateStatusOption:', error);
    throw error;
  }
};

/**
 * Delete a status option
 * @param {number} id - Status option ID
 * @returns {Promise<void>}
 */
export const deleteStatusOption = async (id) => {
  try {
    logger.info(`Deleting status option ${id}`);
    const { error } = await supabase
      .from('status_options')
      .delete()
      .eq('id', id);
      
    if (error) {
      logger.error('Error deleting status option:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Unexpected error in deleteStatusOption:', error);
    throw error;
  }
};

/**
 * Reorder status options within a category
 * @param {Object} params - Parameters for reordering
 * @param {number} params.category_id - Category ID
 * @param {Array<number>} params.ordered_ids - Ordered array of status option IDs
 * @returns {Promise<void>}
 */
export const reorderStatusOptions = async (params) => {
  try {
    logger.info(`Reordering status options in category ${params.category_id}`);
    // Update each status option with its new display_order
    const updatePromises = params.ordered_ids.map((id, index) => {
      return supabase
        .from('status_options')
        .update({ display_order: index + 1 })
        .eq('id', id)
        .eq('category_id', params.category_id);
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    logger.error('Unexpected error in reorderStatusOptions:', error);
    throw error;
  }
};

/**
 * Set a status option as the default for its category
 * @param {number} categoryId - Category ID
 * @param {number} statusId - Status option ID to set as default
 * @returns {Promise<void>}
 */
export const setDefaultStatus = async (categoryId, statusId) => {
  try {
    logger.info(`Setting default status for category ${categoryId}`);
    // First, unset any existing default
    await supabase
      .from('status_options')
      .update({ is_default: false })
      .eq('category_id', categoryId);
      
    // Then set the new default
    const { error } = await supabase
      .from('status_options')
      .update({ is_default: true })
      .eq('id', statusId)
      .eq('category_id', categoryId);
      
    if (error) {
      logger.error('Error setting default status:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Unexpected error in setDefaultStatus:', error);
    throw error;
  }
};

/**
 * Update a contact's status
 * @param {Object} params - Parameters for updating contact status
 * @param {string} params.contact_id - Contact ID
 * @param {string} params.field - Field to update (lead_status_id, appointment_status_id, appointment_result_id)
 * @param {number|null} params.status_id - Status option ID
 * @returns {Promise<void>}
 */
export const updateContactStatus = async (params) => {
  try {
    logger.info(`Updating contact ${params.contact_id} status`);
    const { contact_id, field, status_id } = params;
    
    const { error } = await supabase
      .from('contacts')
      .update({ [field]: status_id })
      .eq('id', contact_id);
      
    if (error) {
      logger.error('Error updating contact status:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Unexpected error in updateContactStatus:', error);
    throw error;
  }
};

/**
 * Get status options with category information
 * @returns {Promise<Array>} Array of status options with category name
 */
export const getStatusOptionsWithCategory = async () => {
  try {
    logger.info('Fetching status options with category');
    const { data, error } = await supabase
      .from('status_options')
      .select(`
        *,
        status_categories(name)
      `)
      .order('category_id')
      .order('display_order');
      
    if (error) {
      logger.error('Error fetching status options with category:', error);
      throw error;
    }
    
    return data?.map(item => ({
      ...item,
      category_name: item.status_categories.name
    })) || [];
  } catch (error) {
    logger.error('Unexpected error in getStatusOptionsWithCategory:', error);
    return [];
  }
};

/**
 * Get all lead statuses with their corresponding colors
 * @returns {Promise<Object>} Object mapping status names to their colors
 */
export const getLeadStatusWithColors = async () => {
  try {
    logger.info('Fetching lead status categories');
    const { data: categories, error: categoryError } = await supabase
      .from('status_categories')
      .select('*')
      .eq('name', 'Lead Status')
      .single();

    if (categoryError) {
      logger.error('Error fetching status categories:', categoryError);
      return {};
    }

    if (!categories) {
      logger.warn('No lead status category found');
      return {};
    }

    const { data: options, error: optionsError } = await supabase
      .from('status_options')
      .select('*')
      .eq('category_id', categories.id)
      .order('display_order', { ascending: true });

    if (optionsError) {
      logger.error('Error fetching status options:', optionsError);
      return {};
    }

    if (!options || options.length === 0) {
      logger.warn('No status options found for lead status category');
      return {};
    }

    logger.info(`Retrieved ${options.length} status options`);
    const statusMap = {};
    options.forEach(option => {
      statusMap[option.name.toLowerCase()] = {
        label: option.name,
        color: option.color || 'gray'
      };
    });

    return statusMap;
  } catch (error) {
    logger.error('Unexpected error in getLeadStatusWithColors:', error);
    return {};
  }
};
