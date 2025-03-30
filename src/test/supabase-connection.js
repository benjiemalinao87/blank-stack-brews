import { supabase } from '../services/supabase';

export const testSupabaseConnection = async () => {
  try {
    // Test session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    // Test query
    const { error: queryError } = await supabase
      .from('contacts')
      .select('count')
      .limit(1)
      .single();
    if (queryError) throw queryError;

    return {
      success: true,
      session: session,
      userId: session?.user?.id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
