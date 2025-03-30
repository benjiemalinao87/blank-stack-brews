import { supabase } from './supabase';
import { broadcastMessageService } from './BroadcastMessageService';

/**
 * Broadcast Service for managing broadcast campaigns
 * This service handles all interactions with the Supabase database for broadcast-related functionality
 */
class BroadcastService {
  constructor() {
    this.broadcastMessageService = broadcastMessageService;
  }

  /**
   * Create a new broadcast
   * @param {Object} broadcastData - The broadcast data
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The created broadcast
   */
  async createBroadcast(broadcastData, workspaceId) {
    try {
      // First create a campaign for this broadcast
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: broadcastData.name || `${broadcastData.type === 'sms' ? 'SMS' : 'Email'} Broadcast`,
          description: broadcastData.description || '',
          type: 'broadcast',
          status: 'draft',
          workspace_id: workspaceId,
          created_by: (await supabase.auth.getUser()).data?.user?.id
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Then create the broadcast record
      const { data, error } = await supabase
        .from('broadcasts')
        .insert({
          campaign_id: campaign.id,
          workspace_id: workspaceId,
          type: broadcastData.type,
          audience: broadcastData.audience || {},
          content: broadcastData.content || {},
          estimated_recipients: broadcastData.audience?.estimatedRecipients || 0,
          status: 'draft',
          created_by: (await supabase.auth.getUser()).data?.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Create an empty analytics record
      const { error: analyticsError } = await supabase
        .from('broadcast_analytics')
        .insert({
          broadcast_id: data.id
        });
        
      if (analyticsError) {
        console.error('Error creating analytics record:', analyticsError);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating broadcast:', error);
      throw error;
    }
  }

  /**
   * Update an existing broadcast
   * @param {string} id - The broadcast ID
   * @param {Object} broadcastData - The updated broadcast data
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The updated broadcast
   */
  async updateBroadcast(id, broadcastData, workspaceId) {
    try {
      const { data, error } = await supabase
        .from('broadcasts')
        .update({
          type: broadcastData.type,
          audience: broadcastData.audience || {},
          content: broadcastData.content || {},
          estimated_recipients: broadcastData.audience?.estimatedRecipients || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating broadcast:', error);
      throw error;
    }
  }

  /**
   * Get a broadcast by ID
   * @param {string} id - The broadcast ID
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The broadcast
   */
  async getBroadcast(id, workspaceId) {
    try {
      const { data, error } = await supabase
        .from('broadcasts')
        .select(`
          *,
          campaign:campaign_id (name, description, status),
          analytics:broadcast_analytics (*)
        `)
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting broadcast:', error);
      throw error;
    }
  }

  /**
   * Get all broadcasts for a workspace
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Array>} Array of broadcasts
   */
  async getBroadcasts(workspaceId) {
    try {
      const { data, error } = await supabase
        .from('broadcasts')
        .select(`
          *,
          campaign:campaign_id (name, description, status),
          analytics:broadcast_analytics (*)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting broadcasts:', error);
      throw error;
    }
  }

  /**
   * Delete a broadcast
   * @param {string} id - The broadcast ID
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<void>}
   */
  async deleteBroadcast(id, workspaceId) {
    try {
      // Get the campaign ID first
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcasts')
        .select('campaign_id')
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .single();
        
      if (broadcastError) throw broadcastError;
      
      // Delete the broadcast (this will cascade to analytics and recipients)
      const { error } = await supabase
        .from('broadcasts')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      
      // Delete the campaign
      if (broadcast?.campaign_id) {
        const { error: campaignError } = await supabase
          .from('campaigns')
          .delete()
          .eq('id', broadcast.campaign_id)
          .eq('workspace_id', workspaceId);
          
        if (campaignError) {
          console.error('Error deleting campaign:', campaignError);
        }
      }
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      throw error;
    }
  }

  /**
   * Schedule a broadcast
   * @param {string} id - The broadcast ID
   * @param {Date} scheduledDate - The scheduled date
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The updated broadcast
   */
  async scheduleBroadcast(id, scheduledDate, workspaceId) {
    try {
      // First get the broadcast to prepare for sending
      const broadcast = await this.getBroadcast(id, workspaceId);
      if (!broadcast) throw new Error('Broadcast not found');
      
      // Get contacts based on audience filters
      const contacts = await this.getContactsForBroadcast(broadcast, workspaceId);
      if (!contacts || contacts.length === 0) {
        throw new Error('No eligible contacts found for this broadcast');
      }
      
      // Update the broadcast with scheduled date (the queue service will set status)
      const { error } = await supabase
        .from('broadcasts')
        .update({
          scheduled_date: scheduledDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (error) throw error;
      
      // Send to appropriate queue based on broadcast type
      if (broadcast.type === 'sms') {
        return await this.broadcastMessageService.sendSmsBroadcast(
          { ...broadcast, id, content: { ...broadcast.content, scheduledDate } },
          contacts,
          workspaceId
        );
      } else if (broadcast.type === 'email') {
        return await this.broadcastMessageService.sendEmailBroadcast(
          { ...broadcast, id, content: { ...broadcast.content, scheduledDate } },
          contacts,
          workspaceId
        );
      } else {
        throw new Error(`Unsupported broadcast type: ${broadcast.type}`);
      }
    } catch (error) {
      console.error('Error scheduling broadcast:', error);
      throw error;
    }
  }

  /**
   * Send a broadcast immediately
   * @param {string} id - The broadcast ID
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The updated broadcast
   */
  async sendBroadcastNow(id, workspaceId) {
    try {
      // First get the broadcast to prepare for sending
      const broadcast = await this.getBroadcast(id, workspaceId);
      if (!broadcast) throw new Error('Broadcast not found');
      
      // Get contacts based on audience filters
      const contacts = await this.getContactsForBroadcast(broadcast, workspaceId);
      if (!contacts || contacts.length === 0) {
        throw new Error('No eligible contacts found for this broadcast');
      }
      
      // Send to appropriate queue based on broadcast type
      if (broadcast.type === 'sms') {
        return await this.broadcastMessageService.sendSmsBroadcast(
          { ...broadcast, id, content: { ...broadcast.content, scheduledDate: null } },
          contacts,
          workspaceId
        );
      } else if (broadcast.type === 'email') {
        return await this.broadcastMessageService.sendEmailBroadcast(
          { ...broadcast, id, content: { ...broadcast.content, scheduledDate: null } },
          contacts,
          workspaceId
        );
      } else {
        throw new Error(`Unsupported broadcast type: ${broadcast.type}`);
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      throw error;
    }
  }

  /**
   * Send a test message
   * @param {string} id - The broadcast ID
   * @param {string} recipient - The recipient (email or phone)
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The test message record
   */
  async sendTestMessage(id, recipient, workspaceId) {
    try {
      // Get the broadcast data
      const broadcast = await this.getBroadcast(id, workspaceId);
      if (!broadcast) throw new Error('Broadcast not found');
      
      // Send test message based on broadcast type
      if (broadcast.type === 'sms') {
        return await this.broadcastMessageService.sendTestSms(
          id,
          recipient,
          broadcast.content.body,
          workspaceId
        );
      } else if (broadcast.type === 'email') {
        return await this.broadcastMessageService.sendTestEmail(
          id,
          recipient,
          broadcast.content.subject,
          broadcast.content.body,
          workspaceId
        );
      } else {
        throw new Error(`Unsupported broadcast type: ${broadcast.type}`);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      throw error;
    }
  }

  /**
   * Get audience estimates
   * @param {Object} filters - The audience filters
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<number>} The estimated number of recipients
   */
  async getAudienceEstimate(filters, workspaceId) {
    try {
      console.log('Getting audience estimate with filters:', JSON.stringify(filters, null, 2));
      console.log('Workspace ID:', workspaceId);
      
      if (!workspaceId) {
        console.error('No workspace ID provided');
        return 0;
      }

      // Extract special filters if they exist
      const emailFilter = filters?.find(f => f.field === 'email' && f.operator === 'equals');
      const leadStatusFilter = filters?.find(f => f.field === 'lead_status_id' && f.operator === 'equals');
      
      // If we have an email filter, use the RPC function directly
      if (emailFilter && emailFilter.value && emailFilter.value.trim()) {
        console.log('Using RPC function for email filtering');
        console.log('Email value:', emailFilter.value.trim());
        
        // Get the results from the RPC function
        const { data: emailResults, error: emailError } = await supabase
          .rpc('find_contact_by_email', { 
            email_param: emailFilter.value.trim(),
            workspace_id_param: workspaceId
          });
        
        console.log('RPC function response:', { 
          data: emailResults, 
          count: emailResults?.length || 0,
          error: emailError 
        });
        
        if (emailError) {
          console.error('Error using RPC function for email filter:', emailError);
          // Fall back to regular query if RPC fails
          return this.getAudienceEstimateWithRegularQuery(filters, workspaceId);
        }
        
        // If there are other filters besides email, we need to apply them as well
        const otherFilters = filters.filter(f => !(f.field === 'email' && f.operator === 'equals'));
        if (otherFilters.length > 0) {
          // We need to apply the other filters to the email results
          console.log('Applying additional filters to email results');
          return this.getAudienceEstimateWithRegularQuery(otherFilters, workspaceId);
        }
        
        return emailResults?.length || 0;
      } 
      // If we have a lead status filter, use the RPC function for lead status
      else if (leadStatusFilter && leadStatusFilter.value) {
        console.log('Using RPC function for lead status filtering');
        console.log('Lead status ID:', leadStatusFilter.value);
        
        // Get the results from the RPC function
        const { data: statusResults, error: statusError } = await supabase
          .rpc('find_contact_by_lead_status', { 
            lead_status_id_param: leadStatusFilter.value,
            workspace_id_param: workspaceId
          });
        
        console.log('RPC function response for lead status:', { 
          data: statusResults, 
          count: statusResults?.length || 0,
          error: statusError 
        });
        
        if (statusError) {
          console.error('Error using RPC function for lead status filter:', statusError);
          // Fall back to regular query if RPC fails
          return this.getAudienceEstimateWithRegularQuery(filters, workspaceId);
        }
        
        // If there are other filters besides lead status, we need to apply them as well
        const otherFilters = filters.filter(f => !(f.field === 'lead_status_id' && f.operator === 'equals'));
        if (otherFilters.length > 0) {
          // We need to apply the other filters to the lead status results
          console.log('Applying additional filters to lead status results');
          return this.getAudienceEstimateWithRegularQuery(otherFilters, workspaceId);
        }
        
        return statusResults?.length || 0;
      } else {
        // Use regular query for all other cases
        return this.getAudienceEstimateWithRegularQuery(filters, workspaceId);
      }
    } catch (error) {
      console.error('Error getting audience estimate:', error);
      throw error;
    }
  }
  
  async getAudienceEstimateWithRegularQuery(filters, workspaceId) {
    try {
      // Start with base query
      let query = supabase
        .from('contacts')
        .select('count', { count: 'exact' })
        .eq('workspace_id', workspaceId);
        
      // Apply filters
      if (filters && filters.length > 0) {
        filters.forEach(filter => {
          if (filter.field && filter.value && filter.value.trim()) {
            console.log('Applying filter:', {
              field: filter.field,
              operator: filter.operator,
              value: filter.value.trim()
            });
            
            // Handle different operators
            switch (filter.operator) {
              case 'equals':
                query = query.eq(filter.field, filter.value.trim());
                break;
              case 'not_equals':
                query = query.neq(filter.field, filter.value.trim());
                break;
              case 'contains':
                query = query.ilike(filter.field, `%${filter.value.trim()}%`);
                break;
              case 'not_contains':
                query = query.not('ilike', filter.field, `%${filter.value.trim()}%`);
                break;
              case 'greater_than':
                query = query.gt(filter.field, filter.value.trim());
                break;
              case 'less_than':
                query = query.lt(filter.field, filter.value.trim());
                break;
              case 'starts_with':
                query = query.ilike(filter.field, `${filter.value.trim()}%`);
                break;
              case 'ends_with':
                query = query.ilike(filter.field, `%${filter.value.trim()}`);
                break;
              default:
                console.warn(`Unsupported operator: ${filter.operator}`);
                break;
            }
          }
        });
      }
      
      const { count, error } = await query;

      console.log('Regular query audience estimate result:', { count, error });

      if (error) {
        console.error('Error getting audience estimate with regular query:', error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error getting audience estimate with regular query:', error);
      throw error;
    }
  }

  /**
   * Get broadcast recipients
   * @param {string} id - The broadcast ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.pageSize - Page size
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The recipients and count
   */
  async getBroadcastRecipients(id, options = { page: 1, pageSize: 20 }, workspaceId) {
    try {
      const { page, pageSize } = options;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      const { data, count, error } = await supabase
        .from('broadcast_recipients')
        .select(`
          *,
          contact:contact_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `, { count: 'exact' })
        .eq('broadcast_id', id)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;
      
      return {
        recipients: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting broadcast recipients:', error);
      throw error;
    }
  }

  /**
   * Get test messages for a broadcast
   * @param {string} id - The broadcast ID 
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Array>} List of test messages
   */
  async getTestMessages(id, workspaceId) {
    try {
      const { data, error } = await supabase
        .from('broadcast_test_messages')
        .select('*')
        .eq('broadcast_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting test messages:', error);
      throw error;
    }
  }

  /**
   * Get contacts for broadcast based on audience filters
   * @param {Object} broadcast - The broadcast object with audience filters
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Array>} The contacts matching the filters
   * @private
   */
  async getContactsForBroadcast(broadcast, workspaceId) {
    try {
      const filters = broadcast.audience?.filters || [];
      
      // Start with base query
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId);
        
      // Apply filters
      if (filters && filters.length > 0) {
        // Extract email filter if it exists
        const emailFilter = filters.find(f => f.field === 'email' && f.operator === 'equals');
        
        // If we have an email filter, we'll handle it separately at the end
        const nonEmailFilters = emailFilter 
          ? filters.filter(f => !(f.field === 'email' && f.operator === 'equals'))
          : filters;
        
        // Apply all non-email filters
        nonEmailFilters.forEach(filter => {
          if (filter.field && filter.value) {
            console.log('Applying filter:', {
              field: filter.field,
              operator: filter.operator,
              value: filter.value
            });
            
            // Handle different operators for all fields
            if (filter.operator === 'equals') {
              console.log(`Applying equals filter for ${filter.field} with value: ${filter.value.trim()}`);
              query = query.eq(filter.field, filter.value.trim());
            } else if (filter.operator === 'contains') {
              console.log(`Applying contains filter for ${filter.field} with value: %${filter.value.trim()}%`);
              query = query.ilike(filter.field, `%${filter.value.trim()}%`);
            } else if (filter.operator === 'starts_with') {
              console.log(`Applying starts_with filter for ${filter.field} with value: ${filter.value.trim()}%`);
              query = query.ilike(filter.field, `${filter.value.trim()}%`);
            } else if (filter.operator === 'ends_with') {
              console.log(`Applying ends_with filter for ${filter.field} with value: %${filter.value.trim()}`);
              query = query.ilike(filter.field, `%${filter.value.trim()}`);
            } else if (filter.operator === 'greater_than') {
              console.log(`Applying greater_than filter for ${filter.field} with value: ${filter.value.trim()}`);
              query = query.gt(filter.field, filter.value.trim());
            } else if (filter.operator === 'less_than') {
              console.log(`Applying less_than filter for ${filter.field} with value: ${filter.value.trim()}`);
              query = query.lt(filter.field, filter.value.trim());
            }
          }
        });
        
        // If we have an email filter, use the RPC function to apply it
        if (emailFilter && emailFilter.value) {
          console.log('Applying email filter using RPC function');
          console.log('Email value:', emailFilter.value.trim());
          console.log('Workspace ID:', workspaceId);
          
          // First, let's check if the contact exists with a direct query
          const { data: directCheck, error: directError } = await supabase
            .from('contacts')
            .select('id, email')
            .eq('workspace_id', workspaceId)
            .eq('email', emailFilter.value.trim());
            
          console.log('Direct email check results:', { 
            data: directCheck, 
            count: directCheck?.length || 0,
            error: directError
          });
          
          // Get the results from the RPC function
          const { data: emailResults, error: emailError } = await supabase
            .rpc('find_contact_by_email', { 
              email_param: emailFilter.value.trim(),
              workspace_id_param: workspaceId
            });
          
          console.log('RPC function response:', { 
            data: emailResults, 
            count: emailResults?.length || 0,
            error: emailError 
          });
          
          if (emailError) {
            console.error('Error using RPC function for email filter:', emailError);
            // Fallback to regular filtering if RPC fails
            console.log(`Falling back to regular filtering for email: ${emailFilter.value.trim()}`);
            
            // Try case-insensitive search as fallback
            console.log('Trying case-insensitive search with ilike');
            return query.ilike('email', emailFilter.value.trim());
          }
          
          if (emailResults && emailResults.length > 0) {
            // Extract the IDs of the matching contacts
            const contactIds = emailResults.map(contact => contact.id);
            console.log(`Found ${contactIds.length} contacts matching email: ${emailFilter.value.trim()}`);
            console.log('Contact IDs:', contactIds);
            
            // Apply an IN filter to get only these contacts
            return query.in('id', contactIds);
          } else {
            console.log(`No contacts found matching email: ${emailFilter.value.trim()}`);
            
            // Try a broader search to see if there are any similar emails
            console.log('Trying broader search with ilike');
            const { data: broadResults } = await supabase
              .from('contacts')
              .select('id, email')
              .eq('workspace_id', workspaceId)
              .ilike('email', `%${emailFilter.value.trim()}%`);
            
            console.log('Broader search results:', { 
              data: broadResults, 
              count: broadResults?.length || 0,
              emails: broadResults?.map(c => c.email) || []
            });
            
            // Return an empty result set (no matches)
            return query.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        }
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      // For SMS broadcasts, filter out contacts without phone numbers
      // For email broadcasts, filter out contacts without email
      if (broadcast.type === 'sms') {
        return (data || []).filter(contact => contact.phone_number);
      } else if (broadcast.type === 'email') {
        return (data || []).filter(contact => contact.email);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting contacts for broadcast:', error);
      throw error;
    }
  }

  // Get broadcast history for a workspace
  async getBroadcastHistory(workspaceId, options = {}) {
    try {
      const { page = 0, pageSize = 20 } = options;

      const { data: broadcasts, error } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      return broadcasts || [];
    } catch (error) {
      console.error('Error fetching broadcast history:', error);
      throw error;
    }
  }

  // Get detailed broadcast status
  async getBroadcastStatus(broadcastId) {
    return await this.broadcastMessageService.getBroadcastStatus(broadcastId);
  }

  // Cancel a broadcast (if possible)
  async cancelBroadcast(broadcastId, workspaceId) {
    try {
      // Update broadcast status to cancelled
      const { error } = await supabase
        .from('broadcasts')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', broadcastId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error cancelling broadcast:', error);
      throw error;
    }
  }

  // Subscribe to broadcast status updates
  subscribeToBroadcastUpdates(broadcastId, callback) {
    const channel = supabase
      .channel(`broadcast:${broadcastId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcasts',
        filter: `id=eq.${broadcastId}`
      }, payload => {
        callback(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

// Create and export singleton instance
const broadcastService = new BroadcastService();
export { broadcastService, BroadcastService }; 