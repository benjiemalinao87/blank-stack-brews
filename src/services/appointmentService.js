import { supabase } from '../lib/supabaseUnified';

const appointmentService = {
  // Get all appointments for a contact
  getAppointmentsForContact: async (contactId, workspaceId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          contact_id,
          workspace_id,
          title,
          description,
          appointment_date,
          duration_minutes,
          location,
          meeting_link,
          status_id,
          result_id,
          created_at,
          updated_at,
          deleted_at
        `)
        .eq('contact_id', contactId)
        .eq('workspace_id', workspaceId)
        .order('appointment_date', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return { data: null, error };
    }
  },

  // Get all appointment follow-ups for an appointment
  getAppointmentFollowUps: async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from('appointment_follow_ups')
        .select(`
          id,
          appointment_id,
          action_type,
          description,
          due_date,
          is_completed,
          completed_at,
          created_at,
          updated_at
        `)
        .eq('appointment_id', appointmentId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching appointment follow-ups:', error);
      return { data: null, error };
    }
  },
  
  // Get all follow-ups for a contact (via their appointments)
  getFollowUpsForContact: async (contactId, workspaceId) => {
    try {
      // First get all appointments for this contact
      const { data: appointments, error: appointmentsError } = await appointmentService.getAppointmentsForContact(contactId, workspaceId);
      
      if (appointmentsError) throw appointmentsError;
      if (!appointments || appointments.length === 0) return { data: [], error: null };
      
      // Get appointment IDs
      const appointmentIds = appointments.map(app => app.id);
      
      // Get all follow-ups for these appointments
      const { data, error } = await supabase
        .from('appointment_follow_ups')
        .select(`
          id,
          appointment_id,
          action_type,
          description,
          due_date,
          is_completed,
          completed_at,
          created_at,
          updated_at,
          appointments!appointment_id(title, contact_id)
        `)
        .in('appointment_id', appointmentIds)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching follow-ups for contact:', error);
      return { data: null, error };
    }
  },

  // Create a new appointment
  createAppointment: async (appointmentData) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating appointment:', error);
      return { data: null, error };
    }
  },

  // Create a new appointment follow-up
  createAppointmentFollowUp: async (followUpData) => {
    try {
      const { data, error } = await supabase
        .from('appointment_follow_ups')
        .insert(followUpData)
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating appointment follow-up:', error);
      return { data: null, error };
    }
  },

  // Update an appointment follow-up
  updateAppointmentFollowUp: async (id, updateData) => {
    try {
      const { data, error } = await supabase
        .from('appointment_follow_ups')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating appointment follow-up:', error);
      return { data: null, error };
    }
  },

  // Get all status options for appointments
  getAppointmentStatusOptions: async () => {
    try {
      // Get all status options for the Appointment Status category
      const { data, error } = await supabase
        .from('status_options')
        .select(`
          id,
          name,
          color,
          display_order,
          status_categories!inner(id, name)
        `)
        .eq('status_categories.name', 'Appointment Status')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching appointment status options:', error);
      return { data: null, error };
    }
  },

  // Get all result options for appointments
  getAppointmentResultOptions: async () => {
    try {
      // Get all status options for the Appointment Result category
      const { data, error } = await supabase
        .from('status_options')
        .select(`
          id,
          name,
          color,
          display_order,
          status_categories!inner(id, name)
        `)
        .eq('status_categories.name', 'Appointment Result')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching appointment result options:', error);
      return { data: null, error };
    }
  }
};

export default appointmentService;
