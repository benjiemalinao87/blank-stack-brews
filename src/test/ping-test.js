import { supabase } from '../services/supabase';

export const pingSupabase = async () => {
  try {
    const { data, error } = await supabase.from('contacts').select('count');
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return { success: true, session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
