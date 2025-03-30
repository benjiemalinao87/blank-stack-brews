import { MessageService } from './messageService';
import { supabase } from './supabase';

const BATCH_SIZE = 500;
const RATE_LIMIT = {
  sms: 100,  // messages per second
  email: 50   // emails per second
};

class BroadcastMessageService extends MessageService {
  constructor() {
    super();
    this.queueServiceUrl = process.env.REACT_APP_QUEUE_SERVICE_URL;
    this.queueServiceEnabled = !!this.queueServiceUrl;
  }

  // Send broadcast messages using queue service with fallback
  async sendBroadcast(recipients, message, workspaceId, options = {}) {
    try {
      const { type = 'sms' } = options;
      
      // Split recipients into batches
      const batches = this.splitIntoBatches(recipients);
      const broadcastId = `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create broadcast record
      await this.createBroadcastRecord(broadcastId, recipients.length, workspaceId, type);

      // Try queue service first
      if (this.queueServiceEnabled) {
        try {
          return await this.sendViaBroadcastQueue(batches, message, workspaceId, broadcastId, options);
        } catch (queueError) {
          console.error('Queue service error, falling back to direct sending:', queueError);
          // Fall back to direct sending
          return await this.sendBroadcastDirectly(batches, message, workspaceId, broadcastId, options);
        }
      } else {
        // Direct sending if queue service not configured
        return await this.sendBroadcastDirectly(batches, message, workspaceId, broadcastId, options);
      }
    } catch (error) {
      console.error('Error in sendBroadcast:', error);
      throw error;
    }
  }

  // Split recipients into manageable batches
  splitIntoBatches(recipients) {
    const batches = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }

  // Send broadcast via queue service
  async sendViaBroadcastQueue(batches, message, workspaceId, broadcastId, options) {
    const { type, scheduleTime } = options;
    
    const queuePayload = {
      batches,
      message,
      workspaceId,
      broadcastId,
      type,
      ...(scheduleTime && { scheduleTime }), // Only include scheduleTime if it exists
      rateLimit: RATE_LIMIT[type]
    };

    const response = await fetch(`${this.queueServiceUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify(queuePayload)
    });

    if (!response.ok) {
      throw new Error(`Queue service error: ${response.statusText}`);
    }

    const totalRecipients = batches.reduce((sum, batch) => sum + batch.length, 0);

    return {
      broadcastId,
      status: 'queued',
      totalRecipients
    };
  }

  // Send broadcast directly (fallback method)
  async sendBroadcastDirectly(batches, message, workspaceId, broadcastId, options) {
    const { type } = options;
    let successCount = 0;
    let failureCount = 0;
    const totalRecipients = batches.reduce((sum, batch) => sum + batch.length, 0);

    for (const batch of batches) {
      await this.applyRateLimit(type);
      
      const results = await Promise.allSettled(
        batch.map(recipient => 
          this.sendMessage(recipient.contactId, message, workspaceId)
        )
      );

      successCount += results.filter(r => r.status === 'fulfilled').length;
      failureCount += results.filter(r => r.status === 'rejected').length;

      // Update progress
      await this.updateBroadcastProgress(broadcastId, successCount, failureCount, totalRecipients);
    }

    return {
      broadcastId,
      status: 'completed',
      successCount,
      failureCount
    };
  }

  // Create initial broadcast record
  async createBroadcastRecord(broadcastId, totalRecipients, workspaceId, type) {
    const { error } = await supabase
      .from('broadcasts')
      .insert({
        id: broadcastId,
        workspace_id: workspaceId,
        total_recipients: totalRecipients,
        type,
        status: 'pending',
        success_count: 0,
        failure_count: 0
      });

    if (error) throw error;
  }

  // Update broadcast progress
  async updateBroadcastProgress(broadcastId, successCount, failureCount, totalRecipients) {
    const { error } = await supabase
      .from('broadcasts')
      .update({
        success_count: successCount,
        failure_count: failureCount,
        status: successCount + failureCount === totalRecipients ? 'completed' : 'in_progress'
      })
      .eq('id', broadcastId);

    if (error) throw error;

    // Emit progress update via socket
    this.socket.emit('broadcast_progress', {
      broadcastId,
      successCount,
      failureCount,
      totalRecipients,
      percentComplete: Math.round(((successCount + failureCount) / totalRecipients) * 100)
    });
  }

  // Rate limiting implementation
  async applyRateLimit(type) {
    const limit = RATE_LIMIT[type];
    await new Promise(resolve => setTimeout(resolve, 1000 / limit));
  }

  // Get auth token for queue service
  async getAuthToken() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.access_token;
  }

  // Get broadcast status
  async getBroadcastStatus(broadcastId) {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (error) throw error;
    return data;
  }
}

// Create and export singleton instance
const broadcastMessageService = new BroadcastMessageService();
export { broadcastMessageService, BroadcastMessageService }; 