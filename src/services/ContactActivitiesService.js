import { supabase } from '../lib/supabaseUnified';

class ContactActivitiesService {
  static async getActivities(contactId, workspaceId) {
    try {
      console.log('Fetching activities for:', { contactId, workspaceId });
      
      if (!contactId || !workspaceId) {
        console.error('Missing required params:', { contactId, workspaceId });
        throw new Error('Contact ID and Workspace ID are required');
      }

      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          contact_id,
          type,
          metadata,
          created_at,
          created_by_user_id,
          lead_status_id,
          workspace_id,
          status_options(id, name, color, category_id)
        `)
        .eq('contact_id', contactId)
        .eq('workspace_id', workspaceId)
        .eq('type', 'status_change')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching activities:', error);
        throw error;
      }
      
      // If we have activities, fetch the user details
      let userDetails = {};
      if (data?.length > 0) {
        const userIds = [...new Set(data.map(a => a.created_by_user_id).filter(Boolean))];
        if (userIds.length > 0) {
          // First try to get user details from workspace_members
          const { data: members, error: membersError } = await supabase
            .from('workspace_members')
            .select(`
              user_id,
              user:user_id (
                email,
                full_name
              ),
              workspace_id
            `)
            .eq('workspace_id', workspaceId)
            .in('user_id', userIds);

          if (!membersError && members) {
            userDetails = members.reduce((acc, member) => ({
              ...acc,
              [member.user_id]: { 
                full_name: member.user?.full_name || 'Unknown User',
                email: member.user?.email || 'unknown@email.com'
              }
            }), {});
          } else {
            console.warn('Could not fetch workspace members:', membersError);
          }
        }
      }

      // Process the data
      const processedData = data?.map(activity => ({
        ...activity,
        status_options: activity.status_options || { name: 'Unknown', color: 'gray.400' },
        metadata: activity.metadata || {},
        created_by: activity.created_by_user_id 
          ? userDetails[activity.created_by_user_id] || { 
              email: 'System User',
              full_name: 'System'
            }
          : { email: 'System', full_name: 'System' }
      })) || [];

      return { data: processedData, error: null };
    } catch (error) {
      console.error('Error fetching contact activities:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to load activities',
        details: {
          contactId,
          workspaceId,
          errorType: error.constructor.name,
          errorCode: error.code,
          message: error.message
        }
      };
    }
  }

  static async getStatusHistory(contactId, workspaceId) {
    return this.getActivities(contactId, workspaceId);
  }

  static async logStatusChange({ contactId, workspaceId, oldStatusId, newStatusId, oldStatusName, newStatusName }) {
    try {
      console.log('Logging status change:', {
        contactId,
        workspaceId,
        oldStatusId,
        newStatusId,
        oldStatusName,
        newStatusName
      });

      if (!contactId || !workspaceId) {
        console.error('Missing required params:', { contactId, workspaceId });
        throw new Error('Contact ID and Workspace ID are required');
      }

      const metadata = {
        old_status_id: oldStatusId,
        new_status_id: newStatusId,
        old_status_name: oldStatusName,
        new_status_name: newStatusName,
        updated_at: new Date().toISOString()
      };

      const { data: insertedActivity, error: insertError } = await supabase
        .from('activities')
        .insert({
          contact_id: contactId,
          workspace_id: workspaceId,
          type: 'status_change',
          lead_status_id: newStatusId,
          metadata
        })
        .select(`
          id,
          contact_id,
          type,
          metadata,
          created_at,
          created_by_user_id,
          lead_status_id,
          workspace_id,
          status_options:lead_status_id(id, name, color)
        `)
        .single();

      if (insertError) {
        console.error('Error inserting activity:', insertError);
        throw insertError;
      }

      // Get user details if available
      let userDetails = null;
      if (insertedActivity.created_by_user_id) {
        const { data: member, error: memberError } = await supabase
          .from('workspace_members')
          .select(`
            user_id,
            user:user_id (
              email,
              full_name
            )
          `)
          .eq('workspace_id', workspaceId)
          .eq('user_id', insertedActivity.created_by_user_id)
          .single();

        if (!memberError && member?.user) {
          userDetails = {
            full_name: member.user.full_name || 'Unknown User',
            email: member.user.email || 'unknown@email.com'
          };
        } else {
          console.warn('Could not fetch member details:', memberError);
        }
      }

      const processedActivity = {
        ...insertedActivity,
        status_options: insertedActivity.status_options || { name: 'Unknown', color: 'gray.400' },
        created_by: userDetails || { email: 'System', full_name: 'System' }
      };

      console.log('Status change logged successfully:', processedActivity);
      return { data: processedActivity, error: null };
    } catch (error) {
      console.error('Error logging status change:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to log status change',
        details: {
          contactId,
          workspaceId,
          errorType: error.constructor.name,
          errorCode: error.code,
          message: error.message
        }
      };
    }
  }
}

export default ContactActivitiesService;
