import { supabase } from './supabase';
import { 
  StatusCategory, 
  StatusOption, 
  CreateStatusOptionParams,
  UpdateStatusOptionParams,
  ReorderStatusOptionsParams,
  UpdateContactStatusParams
} from '../types/status';

// Fetch all status categories
export const getStatusCategories = async (): Promise<StatusCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('status_categories')
      .select('*')
      .order('id');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching status categories:', error);
    throw error;
  }
};

// Fetch status options for a specific category
export const getStatusOptionsByCategory = async (categoryId: number): Promise<StatusOption[]> => {
  try {
    const { data, error } = await supabase
      .from('status_options')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching status options:', error);
    throw error;
  }
};

// Create a new status option
export const createStatusOption = async (params: CreateStatusOptionParams): Promise<StatusOption> => {
  try {
    const { data, error } = await supabase
      .from('status_options')
      .insert([params])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating status option:', error);
    throw error;
  }
};

// Update an existing status option
export const updateStatusOption = async (id: number, params: UpdateStatusOptionParams): Promise<StatusOption> => {
  try {
    const { data, error } = await supabase
      .from('status_options')
      .update(params)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating status option:', error);
    throw error;
  }
};

// Delete a status option
export const deleteStatusOption = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('status_options')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting status option:', error);
    throw error;
  }
};

// Reorder status options within a category
export const reorderStatusOptions = async (params: ReorderStatusOptionsParams): Promise<void> => {
  try {
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
    console.error('Error reordering status options:', error);
    throw error;
  }
};

// Set a status option as the default for its category
export const setDefaultStatus = async (categoryId: number, statusId: number): Promise<void> => {
  try {
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
      
    if (error) throw error;
  } catch (error) {
    console.error('Error setting default status:', error);
    throw error;
  }
};

// Update a contact's status
export const updateContactStatus = async (params: UpdateContactStatusParams): Promise<void> => {
  try {
    const { contact_id, field, status_id } = params;
    
    const { error } = await supabase
      .from('contacts')
      .update({ [field]: status_id })
      .eq('id', contact_id);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error updating contact status:', error);
    throw error;
  }
};

// Get status options with category information
export const getStatusOptionsWithCategory = async (): Promise<(StatusOption & { category_name: string })[]> => {
  try {
    const { data, error } = await supabase
      .from('status_options')
      .select(`
        *,
        status_categories(name)
      `)
      .order('category_id')
      .order('display_order');
      
    if (error) throw error;
    
    return data?.map(item => ({
      ...item,
      category_name: item.status_categories.name
    })) || [];
  } catch (error) {
    console.error('Error fetching status options with category:', error);
    throw error;
  }
};
