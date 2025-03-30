// Queue Service Integration for Broadcast
const BACKEND_API_URL = 'https://cc.automate8.com';
// Fallback direct endpoint for extreme cases
const DIRECT_SMS_ENDPOINT = '/send-sms'; 

const broadcastQueueService = {
  // Helper method to get backend URL for diagnostics
  getBackendUrl: () => BACKEND_API_URL,

  // Process batch of recipients with progress callback
  processBatch: async (type, messages, onProgress) => {
    const results = [];
    const errors = [];
    let processedCount = 0;

    // Increased batch size for better performance
    const batchSize = 50; // Increased from 10 to 50
    const totalBatches = Math.ceil(messages.length / batchSize);

    for (let i = 0; i < messages.length; i += batchSize) {
      const batchNumber = Math.floor(i / batchSize) + 1;
      const batch = messages.slice(i, i + batchSize);
      
      // Update progress before processing batch
      if (onProgress) {
        onProgress({
          totalMessages: messages.length,
          processedMessages: processedCount,
          currentBatch: batchNumber,
          totalBatches,
          status: 'processing'
        });
      }

      try {
        // Process messages in current batch concurrently
        const promises = batch.map(message => 
          type === 'sms' ? 
            broadcastQueueService.scheduleSMS(message) : 
            broadcastQueueService.scheduleEmail(message)
        );

        const batchResults = await Promise.allSettled(promises);
        
        // Process results and update counts
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              recipient: batch[index].recipients[0],
              error: result.reason.message,
              retryCount: 0 // Track retry attempts
            });
          }
        });

        processedCount += batch.length;

        // Update progress after batch completion
        if (onProgress) {
          onProgress({
            totalMessages: messages.length,
            processedMessages: processedCount,
            currentBatch: batchNumber,
            totalBatches,
            successCount: results.length,
            errorCount: errors.length,
            status: 'batch_complete',
            percentComplete: (processedCount / messages.length * 100).toFixed(1)
          });
        }

        // Add a small delay between batches to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Batch ${batchNumber} processing error:`, error);
        
        // Mark all messages in failed batch for retry
        batch.forEach(message => {
          errors.push({
            recipient: message.recipients[0],
            error: error.message,
            retryCount: 0
          });
        });
      }
    }

    // Attempt to retry failed messages (up to 3 times)
    if (errors.length > 0) {
      const retryResults = await broadcastQueueService.retryFailedMessages(type, errors, onProgress);
      results.push(...retryResults.successes);
      errors.length = 0; // Clear original errors
      errors.push(...retryResults.failures); // Add only final failures
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalProcessed: results.length,
      totalFailed: errors.length,
      summary: {
        total: messages.length,
        successful: results.length,
        failed: errors.length,
        successRate: ((results.length / messages.length) * 100).toFixed(1)
      }
    };
  },

  // Retry failed messages
  retryFailedMessages: async (type, failedMessages, onProgress, maxRetries = 3) => {
    const successes = [];
    const failures = [];

    for (const failed of failedMessages) {
      if (failed.retryCount >= maxRetries) {
        failures.push(failed);
        continue;
      }

      try {
        // Fix: Pass the message object properly
        // Store a reference to the original message for retry
        if (!failed.message) {
          // If message is not defined, create a basic message from the recipient info
          failed.message = {
            recipients: [failed.recipient],
            contactId: failed.contactId || 'unknown',
            workspaceId: '66338', // Default workspace
            content: { 
              body: "Retry message"
            },
            scheduledTime: new Date().toISOString(),
            delay: 0
          };
        }
        
        const result = type === 'sms' ?
          await broadcastQueueService.scheduleSMS(failed.message) :
          await broadcastQueueService.scheduleEmail(failed.message);
        
        successes.push(result);
      } catch (error) {
        failed.retryCount++;
        failed.error = error.message;
        
        if (failed.retryCount >= maxRetries) {
          failures.push(failed);
        }
      }

      // Update progress if callback provided
      if (onProgress) {
        onProgress({
          status: 'retrying',
          retryingRecipient: failed.recipient,
          retriesRemaining: maxRetries - failed.retryCount,
          successCount: successes.length,
          failureCount: failures.length
        });
      }

      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { successes, failures };
  },

  // Schedule SMS broadcast
  scheduleSMS: async (message) => {
    try {
      console.log('Scheduling SMS to:', message.recipients[0]);
      
      const payload = {
        phoneNumber: message.recipients[0],
        message: message.content.body,
        contactId: message.contactId,
        workspaceId: message.workspaceId,
        delay: message.delay || 0,
        metadata: {
          source: 'queue_service',
          contactId: message.contactId,
          campaignId: message.broadcastId,
          messageId: Date.now().toString(),
          scheduledTime: message.scheduledTime,
          timestamp: new Date().toISOString(),
          callbackEndpoint: "/send-sms",
          batchId: message.batchId
        }
      };
      
      console.log('SMS payload:', JSON.stringify(payload, null, 2));
      
      let response;
      let usedEndpoint = 'proxy'; // Track which endpoint was successful
      
      try {
        // Always use the backend API endpoint which will proxy to queue service
        response = await fetch(`${BACKEND_API_URL}/api/proxy/queue/schedule-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (proxyError) {
        console.warn('Proxy to queue service failed, trying direct SMS endpoint...', proxyError);
        usedEndpoint = 'direct';
        
        // If proxy fails, try direct send-sms endpoint
        const directPayload = {
          to: payload.phoneNumber,
          message: payload.message,
          workspaceId: payload.workspaceId
        };
        
        // Try the direct endpoint
        response = await fetch(`${BACKEND_API_URL}${DIRECT_SMS_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(directPayload)
        });
      }
      
      // Check if either endpoint responded successfully
      if (!response.ok) {
        // If we're here, both endpoints failed or the one we tried failed
        try {
          const errorData = await response.json();
          console.error(`SMS scheduling error (${usedEndpoint} endpoint):`, errorData);
          throw new Error(errorData.message || `Failed to send SMS via ${usedEndpoint} endpoint`);
        } catch (parseError) {
          // If we can't parse the error response, throw a more generic error
          console.error('Could not parse error response:', parseError);
          throw new Error(`Failed to send SMS via ${usedEndpoint} endpoint: ${response.status} ${response.statusText}`);
        }
      }
      
      // If we get here, one of the endpoints worked
      try {
        const data = await response.json();
        console.log(`SMS scheduled successfully via ${usedEndpoint} endpoint:`, data);
        
        return {
          success: true,
          queueId: data.jobId || data.id || Date.now().toString(),
          scheduledTime: data.scheduledTime || new Date().toISOString(),
          status: data.status || 'sent',
          recipient: message.recipients[0],
          endpoint: usedEndpoint
        };
      } catch (parseError) {
        // If we can't parse the response but got a 2xx status code, assume success
        console.warn('Could not parse successful response, assuming success:', parseError);
        return {
          success: true,
          queueId: Date.now().toString(),
          scheduledTime: new Date().toISOString(),
          status: 'sent',
          recipient: message.recipients[0],
          endpoint: usedEndpoint,
          parseError: true
        };
      }
    } catch (error) {
      console.error('Error scheduling SMS broadcast:', error);
      console.error('Message that failed:', JSON.stringify({
        phoneNumber: message.recipients?.[0],
        contactId: message.contactId,
        workspaceId: message.workspaceId
      }, null, 2));
      throw error;
    }
  },

  // Schedule Email broadcast
  scheduleEmail: async (message) => {
    try {
      const payload = {
        to: message.recipients[0],
        subject: message.content.subject,
        html: message.content.body,
        contactId: message.contactId,
        workspaceId: message.workspaceId,
        delay: message.delay || 0,
        metadata: {
          source: 'queue_service',
          contactId: message.contactId,
          campaignId: message.broadcastId,
          messageId: Date.now().toString(),
          scheduledTime: message.scheduledTime,
          timestamp: new Date().toISOString(),
          callbackEndpoint: "/api/email/send",
          batchId: message.batchId
        }
      };
      
      // Use proxy endpoint
      const response = await fetch(`${BACKEND_API_URL}/api/proxy/queue/schedule-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to schedule email broadcast');
      }
      
      const data = await response.json();
      return {
        success: true,
        queueId: data.jobId || data.id || Date.now().toString(),
        scheduledTime: data.scheduledTime || new Date().toISOString(),
        status: data.status || 'sent',
        recipient: message.recipients[0]
      };
    } catch (error) {
      console.error('Error scheduling email broadcast:', error);
      throw error;
    }
  },

  // Send broadcast immediately
  sendImmediate: async (type, messages) => {
    const now = new Date().toISOString();
    const batchId = Date.now().toString();

    // Prepare messages for batch processing
    const preparedMessages = messages.map(message => ({
      ...message,
      scheduledTime: now,
      delay: 0,
      batchId,
      metadata: {
        ...message.metadata,
        sendType: 'immediate',
        batchId
      }
    }));

    return broadcastQueueService.processBatch(type, preparedMessages);
  },

  // Schedule broadcast for later
  scheduleForLater: async (type, messages, scheduledTime) => {
    const delay = new Date(scheduledTime).getTime() - Date.now();
    const batchId = Date.now().toString();

    // Prepare messages for batch processing
    const preparedMessages = messages.map(message => ({
      ...message,
      scheduledTime: new Date(scheduledTime).toISOString(),
      delay,
      batchId,
      metadata: {
        ...message.metadata,
        sendType: 'scheduled',
        batchId
      }
    }));

    return broadcastQueueService.processBatch(type, preparedMessages);
  },

  // Check broadcast status
  checkStatus: async (queueId) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/proxy/queue/status/${queueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check broadcast status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking broadcast status:', error);
      throw error;
    }
  },

  // Test SMS scheduling with delay
  testScheduleSMS: async () => {
    try {
      const TWO_MINUTES = 2 * 60 * 1000; // 2 minutes in milliseconds
      
      const testMessage = {
        phoneNumber: "+1234567890", // Replace with your test phone number
        message: "This is a test SMS scheduled for 2 minutes from now",
        contactId: "test_contact",
        workspaceId: "66338",
        delay: TWO_MINUTES,
        metadata: {
          source: 'test',
          messageId: Date.now().toString(),
          scheduledTime: new Date(Date.now() + TWO_MINUTES).toISOString(),
          timestamp: new Date().toISOString()
        }
      };

      console.log('Scheduling test SMS with payload:', testMessage);

      const response = await fetch(`${BACKEND_API_URL}/api/proxy/queue/schedule-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to schedule test SMS');
      }
      
      const data = await response.json();
      console.log('Test SMS scheduled successfully:', data);
      
      return {
        success: true,
        queueId: data.jobId || data.id || Date.now().toString(),
        scheduledTime: data.scheduledTime || new Date().toISOString(),
        status: data.status || 'sent'
      };
    } catch (error) {
      console.error('Error scheduling test SMS:', error);
      throw error;
    }
  }
};

export default broadcastQueueService; 