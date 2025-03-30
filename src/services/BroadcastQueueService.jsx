import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseUnified';

// Queue Service URL from environment or default
const QUEUE_SERVICE_URL = process.env.REACT_APP_QUEUE_SERVICE_URL || 'https://queue-services-production.up.railway.app';

// Configuration for batch processing
const BATCH_CONFIG = {
  BATCH_SIZE: 100, // Maximum number of recipients per batch
  BATCH_DELAY_MS: 1000, // Delay between batches to prevent overwhelming the queue
  MAX_CONCURRENT_BATCHES: 5, // Maximum number of concurrent batch operations
};

/**
 * Split an array into batches of specified size
 * @param {Array} array - The array to split
 * @param {number} batchSize - The maximum batch size
 * @returns {Array<Array>} Array of batches
 */
function splitIntoBatches(array, batchSize = BATCH_CONFIG.BATCH_SIZE) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Process batches with controlled concurrency
 * @param {Array<Array>} batches - Array of batches to process
 * @param {Function} processBatch - Function to process each batch
 * @param {number} concurrency - Maximum number of concurrent operations
 * @returns {Promise<Array>} Combined results from all batches
 */
async function processBatchesWithConcurrency(batches, processBatch, concurrency = BATCH_CONFIG.MAX_CONCURRENT_BATCHES) {
  const results = [];
  const activeBatches = new Set();
  
  for (const batch of batches) {
    // Wait if we've reached max concurrency
    while (activeBatches.size >= concurrency) {
      await Promise.race(Array.from(activeBatches));
    }
    
    // Process the batch
    const batchPromise = (async () => {
      try {
        // Add delay between batches if there are multiple
        if (batches.length > 1 && results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.BATCH_DELAY_MS));
        }
        
        const batchResult = await processBatch(batch);
        results.push(...batchResult);
        return batchResult;
      } finally {
        activeBatches.delete(batchPromise);
      }
    })();
    
    activeBatches.add(batchPromise);
  }
  
  // Wait for all remaining batches to complete
  await Promise.all(Array.from(activeBatches));
  
  return results;
}

/**
 * Service for sending broadcasts through the Queue Service
 */
class BroadcastQueueService {
  /**
   * Send an SMS broadcast to multiple recipients
   * @param {Object} broadcastData - The broadcast data
   * @param {Array} contacts - The list of contact objects
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} Result with success/failure counts
   */
  async sendSmsBroadcast(broadcastData, contacts, workspaceId) {
    try {
      const isSendingNow = !broadcastData.content.scheduledDate;
      const scheduledTime = broadcastData.content.scheduledDate ? new Date(broadcastData.content.scheduledDate) : new Date();
      const timestamp = new Date().toISOString();
      const campaignId = uuidv4();
      
      // Initialize counters
      let successCount = 0;
      let failureCount = 0;
      let results = [];
      
      // Get the current user for tracking
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update broadcast status in database
      const { data: updatedBroadcast, error: updateError } = await supabase
        .from('broadcasts')
        .update({
          status: isSendingNow ? 'sending' : 'scheduled',
          scheduled_date: scheduledTime.toISOString(),
          sent_date: isSendingNow ? timestamp : null,
          actual_recipients: contacts.length,
          updated_at: timestamp
        })
        .eq('id', broadcastData.id)
        .eq('workspace_id', workspaceId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Create broadcast recipients records
      const recipientsData = contacts.map(contact => ({
        broadcast_id: broadcastData.id,
        contact_id: contact.id,
        status: 'pending',
        created_at: timestamp
      }));
      
      const { error: recipientsError } = await supabase
        .from('broadcast_recipients')
        .insert(recipientsData);
        
      if (recipientsError) throw recipientsError;
      
      // Calculate delay in milliseconds
      const delay = isSendingNow ? 0 : scheduledTime.getTime() - Date.now();
      
      // Split contacts into batches for processing
      const batches = splitIntoBatches(contacts, BATCH_CONFIG.BATCH_SIZE);
      console.log(`Processing ${contacts.length} contacts in ${batches.length} batches of max ${BATCH_CONFIG.BATCH_SIZE}`);
      
      // Define batch processing function
      const processBatch = async (batchContacts) => {
        const batchResults = [];
        
        // Process each contact in the batch
        for (const contact of batchContacts) {
          try {
            if (!contact.phone_number) {
              failureCount++;
              batchResults.push({
                contactId: contact.id,
                success: false,
                error: 'No phone number available'
              });
              continue;
            }
            
            // Create the message payload
            const messagePayload = {
              phoneNumber: contact.phone_number,
              message: broadcastData.content.body,
              contactId: contact.id,  // Required at top level
              workspaceId,
              delay,  // Include delay even if it's 0
              metadata: {
                source: 'broadcast_service',
                contactId: contact.id,
                campaignId,
                messageId: uuidv4(),
                broadcastId: broadcastData.id,
                scheduledTime: scheduledTime.toISOString(),
                timestamp,
                callbackEndpoint: "/send-sms"  // Required in metadata
              }
            };
            
            // Send to Queue Service
            const response = await fetch(`${QUEUE_SERVICE_URL}/api/schedule-sms`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(messagePayload)
            });
            
            const result = await response.json();
            
            if (response.ok) {
              successCount++;
              batchResults.push({
                contactId: contact.id,
                success: true,
                jobId: result.jobId
              });
              
              // Update recipient status
              await supabase
                .from('broadcast_recipients')
                .update({
                  status: isSendingNow ? 'sent' : 'scheduled',
                  message_id: result.jobId,
                  updated_at: new Date().toISOString()
                })
                .eq('broadcast_id', broadcastData.id)
                .eq('contact_id', contact.id);
            } else {
              failureCount++;
              batchResults.push({
                contactId: contact.id,
                success: false,
                error: result.error || 'Failed to schedule message'
              });
              
              // Update recipient status
              await supabase
                .from('broadcast_recipients')
                .update({
                  status: 'failed',
                  error_message: result.error || 'Failed to schedule message',
                  updated_at: new Date().toISOString()
                })
                .eq('broadcast_id', broadcastData.id)
                .eq('contact_id', contact.id);
            }
          } catch (error) {
            failureCount++;
            batchResults.push({
              contactId: contact.id,
              success: false,
              error: error.message
            });
            
            // Update recipient status
            await supabase
              .from('broadcast_recipients')
              .update({
                status: 'failed',
                error_message: error.message,
                updated_at: new Date().toISOString()
              })
              .eq('broadcast_id', broadcastData.id)
              .eq('contact_id', contact.id);
          }
        }
        
        return batchResults;
      };
      
      // Process all batches with controlled concurrency
      results = await processBatchesWithConcurrency(batches, processBatch);
      
      // Update broadcast analytics
      await supabase
        .from('broadcast_analytics')
        .update({
          total_sent: successCount,
          total_failed: failureCount,
          updated_at: new Date().toISOString()
        })
        .eq('broadcast_id', broadcastData.id);
      
      // Update broadcast status if completed
      if (isSendingNow) {
        await supabase
          .from('broadcasts')
          .update({
            status: 'sent',
            updated_at: new Date().toISOString()
          })
          .eq('id', broadcastData.id);
      }
      
      return {
        success: successCount,
        failure: failureCount,
        results,
        broadcastId: broadcastData.id,
        batchCount: batches.length
      };
    } catch (error) {
      console.error('Error sending SMS broadcast:', error);
      throw error;
    }
  }
  
  /**
   * Send an email broadcast to multiple recipients
   * @param {Object} broadcastData - The broadcast data
   * @param {Array} contacts - The list of contact objects
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} Result with success/failure counts
   */
  async sendEmailBroadcast(broadcastData, contacts, workspaceId) {
    try {
      const isSendingNow = !broadcastData.content.scheduledDate;
      const scheduledTime = broadcastData.content.scheduledDate ? new Date(broadcastData.content.scheduledDate) : new Date();
      const timestamp = new Date().toISOString();
      const campaignId = uuidv4();
      
      // Initialize counters
      let successCount = 0;
      let failureCount = 0;
      let results = [];
      
      // Get the current user for tracking
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update broadcast status in database
      const { data: updatedBroadcast, error: updateError } = await supabase
        .from('broadcasts')
        .update({
          status: isSendingNow ? 'sending' : 'scheduled',
          scheduled_date: scheduledTime.toISOString(),
          sent_date: isSendingNow ? timestamp : null,
          actual_recipients: contacts.length,
          updated_at: timestamp
        })
        .eq('id', broadcastData.id)
        .eq('workspace_id', workspaceId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Create broadcast recipients records
      const recipientsData = contacts.map(contact => ({
        broadcast_id: broadcastData.id,
        contact_id: contact.id,
        status: 'pending',
        created_at: timestamp
      }));
      
      const { error: recipientsError } = await supabase
        .from('broadcast_recipients')
        .insert(recipientsData);
        
      if (recipientsError) throw recipientsError;
      
      // Calculate delay in milliseconds
      const delay = isSendingNow ? 0 : scheduledTime.getTime() - Date.now();
      
      // Split contacts into batches for processing
      const batches = splitIntoBatches(contacts, BATCH_CONFIG.BATCH_SIZE);
      console.log(`Processing ${contacts.length} contacts in ${batches.length} batches of max ${BATCH_CONFIG.BATCH_SIZE}`);
      
      // Define batch processing function
      const processBatch = async (batchContacts) => {
        const batchResults = [];
        
        // Process each contact in the batch
        for (const contact of batchContacts) {
          try {
            if (!contact.email) {
              failureCount++;
              batchResults.push({
                contactId: contact.id,
                success: false,
                error: 'No email address available'
              });
              continue;
            }
            
            // Create the message payload
            const messagePayload = {
              to: contact.email,
              subject: broadcastData.content.subject,
              html: broadcastData.content.body,
              contactId: contact.id,  // Required at top level
              workspaceId,
              delay,  // Include delay even if it's 0
              metadata: {
                source: 'broadcast_service',
                contactId: contact.id,
                campaignId,
                messageId: uuidv4(),
                broadcastId: broadcastData.id,
                scheduledTime: scheduledTime.toISOString(),
                timestamp,
                callbackEndpoint: "/api/email/send"  // Required in metadata
              }
            };
            
            // Send to Queue Service
            const response = await fetch(`${QUEUE_SERVICE_URL}/api/schedule-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(messagePayload)
            });
            
            const result = await response.json();
            
            if (response.ok) {
              successCount++;
              batchResults.push({
                contactId: contact.id,
                success: true,
                jobId: result.jobId
              });
              
              // Update recipient status
              await supabase
                .from('broadcast_recipients')
                .update({
                  status: isSendingNow ? 'sent' : 'scheduled',
                  message_id: result.jobId,
                  updated_at: new Date().toISOString()
                })
                .eq('broadcast_id', broadcastData.id)
                .eq('contact_id', contact.id);
            } else {
              failureCount++;
              batchResults.push({
                contactId: contact.id,
                success: false,
                error: result.error || 'Failed to schedule email'
              });
              
              // Update recipient status
              await supabase
                .from('broadcast_recipients')
                .update({
                  status: 'failed',
                  error_message: result.error || 'Failed to schedule email',
                  updated_at: new Date().toISOString()
                })
                .eq('broadcast_id', broadcastData.id)
                .eq('contact_id', contact.id);
            }
          } catch (error) {
            failureCount++;
            batchResults.push({
              contactId: contact.id,
              success: false,
              error: error.message
            });
            
            // Update recipient status
            await supabase
              .from('broadcast_recipients')
              .update({
                status: 'failed',
                error_message: error.message,
                updated_at: new Date().toISOString()
              })
              .eq('broadcast_id', broadcastData.id)
              .eq('contact_id', contact.id);
          }
        }
        
        return batchResults;
      };
      
      // Process all batches with controlled concurrency
      results = await processBatchesWithConcurrency(batches, processBatch);
      
      // Update broadcast analytics
      await supabase
        .from('broadcast_analytics')
        .update({
          total_sent: successCount,
          total_failed: failureCount,
          updated_at: new Date().toISOString()
        })
        .eq('broadcast_id', broadcastData.id);
      
      // Update broadcast status if completed
      if (isSendingNow) {
        await supabase
          .from('broadcasts')
          .update({
            status: 'sent',
            updated_at: new Date().toISOString()
          })
          .eq('id', broadcastData.id);
      }
      
      return {
        success: successCount,
        failure: failureCount,
        results,
        broadcastId: broadcastData.id,
        batchCount: batches.length
      };
    } catch (error) {
      console.error('Error sending email broadcast:', error);
      throw error;
    }
  }
  
  /**
   * Send a test SMS message
   * @param {string} broadcastId - The broadcast ID
   * @param {string} recipient - The recipient phone number
   * @param {string} content - The message content
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The result
   */
  async sendTestSms(broadcastId, recipient, content, workspaceId) {
    try {
      // Ensure recipient is in proper format
      if (!recipient.startsWith('+')) {
        recipient = `+${recipient}`;
      }
      
      const timestamp = new Date().toISOString();
      
      // Create the message payload
      const messagePayload = {
        phoneNumber: recipient,
        message: content,
        contactId: null,  // Test messages don't need to be linked to a contact
        workspaceId,
        delay: 0,  // Test messages are always immediate
        metadata: {
          source: 'broadcast_test',
          broadcastId,
          messageId: uuidv4(),
          scheduledTime: timestamp,
          timestamp,
          callbackEndpoint: "/send-sms"
        }
      };
      
      // Send to Queue Service
      const response = await fetch(`${QUEUE_SERVICE_URL}/api/schedule-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Record test message in database
        const { data, error } = await supabase
          .from('broadcast_test_messages')
          .insert({
            broadcast_id: broadcastId,
            recipient,
            status: 'sent',
            message_id: result.jobId,
            created_by: (await supabase.auth.getUser()).data?.user?.id
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return {
          success: true,
          jobId: result.jobId,
          message: 'Test SMS sent successfully',
          testMessageId: data.id
        };
      } else {
        // Record failed test message
        const { data, error } = await supabase
          .from('broadcast_test_messages')
          .insert({
            broadcast_id: broadcastId,
            recipient,
            status: 'failed',
            error_message: result.error || 'Failed to send test SMS',
            created_by: (await supabase.auth.getUser()).data?.user?.id
          })
          .select()
          .single();
        
        if (error) throw error;
        
        throw new Error(result.error || 'Failed to send test SMS');
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      throw error;
    }
  }
  
  /**
   * Send a test email
   * @param {string} broadcastId - The broadcast ID
   * @param {string} recipient - The recipient email
   * @param {string} subject - The email subject
   * @param {string} content - The email content (HTML)
   * @param {string} workspaceId - The workspace ID
   * @returns {Promise<Object>} The result
   */
  async sendTestEmail(broadcastId, recipient, subject, content, workspaceId) {
    try {
      const timestamp = new Date().toISOString();
      
      // Create the message payload
      const messagePayload = {
        to: recipient,
        subject,
        html: content,
        contactId: null,  // Test messages don't need to be linked to a contact
        workspaceId,
        delay: 0,  // Test messages are always immediate
        metadata: {
          source: 'broadcast_test',
          broadcastId,
          messageId: uuidv4(),
          scheduledTime: timestamp,
          timestamp,
          callbackEndpoint: "/api/email/send"
        }
      };
      
      // Send to Queue Service
      const response = await fetch(`${QUEUE_SERVICE_URL}/api/schedule-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Record test message in database
        const { data, error } = await supabase
          .from('broadcast_test_messages')
          .insert({
            broadcast_id: broadcastId,
            recipient,
            status: 'sent',
            message_id: result.jobId,
            created_by: (await supabase.auth.getUser()).data?.user?.id
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return {
          success: true,
          jobId: result.jobId,
          message: 'Test email sent successfully',
          testMessageId: data.id
        };
      } else {
        // Record failed test message
        const { data, error } = await supabase
          .from('broadcast_test_messages')
          .insert({
            broadcast_id: broadcastId,
            recipient,
            status: 'failed',
            error_message: result.error || 'Failed to send test email',
            created_by: (await supabase.auth.getUser()).data?.user?.id
          })
          .select()
          .single();
        
        if (error) throw error;
        
        throw new Error(result.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
}

export const broadcastQueueService = new BroadcastQueueService(); 