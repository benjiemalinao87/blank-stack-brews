import axios from 'axios';

// Queue Service Configuration
const QUEUE_SERVICE_URL = process.env.QUEUE_SERVICE_URL || 'https://queue-services-production.up.railway.app';

/**
 * Error types for queue service operations
 */
export const QueueErrorTypes = {
  SCHEDULING_FAILED: 'SCHEDULING_FAILED',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR'
};

/**
 * Custom error class for queue service operations
 */
class QueueServiceError extends Error {
  constructor(type, message, originalError = null) {
    super(message);
    this.name = 'QueueServiceError';
    this.type = type;
    this.originalError = originalError;
  }
}

/**
 * Queue Service class for handling message scheduling
 */
class QueueService {
  constructor() {
    this.client = axios.create({
      baseURL: QUEUE_SERVICE_URL,
      timeout: 10000 // 10 second timeout
    });

    // Add request logging
    this.client.interceptors.request.use(config => {
      console.log(`Queue Service Request: ${config.method?.toUpperCase()} ${config.url}`, {
        timestamp: new Date().toISOString()
      });
      return config;
    });

    // Add response logging and error handling
    this.client.interceptors.response.use(
      response => {
        console.log('Queue Service Response:', {
          status: response.status,
          timestamp: new Date().toISOString()
        });
        return response;
      },
      error => {
        console.error('Queue Service Error:', {
          message: error.message,
          status: error.response?.status,
          timestamp: new Date().toISOString()
        });
        throw this._handleError(error);
      }
    );
  }

  /**
   * Schedule an email message
   * @param {Object} emailData Email data including recipient, subject, content
   * @param {number} delayMs Delay in milliseconds
   * @returns {Promise<Object>} Job details including jobId
   */
  async scheduleEmail(emailData, delayMs = 0) {
    try {
      // Ensure callbackEndpoint is included in metadata
      const metadata = emailData.metadata || {};
      if (!metadata.callbackEndpoint) {
        metadata.callbackEndpoint = "/api/email/send";
      }

      const response = await this.client.post('/api/schedule-email', {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        contactId: emailData.contactId, // Ensure contactId is passed at top level
        workspaceId: emailData.workspaceId,
        delay: delayMs,
        metadata
      });

      return {
        success: true,
        jobId: response.data.jobId,
        scheduledTime: new Date(Date.now() + delayMs).toISOString()
      };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Schedule an SMS message
   * @param {Object} smsData SMS data including phone number and message
   * @param {number} delayMs Delay in milliseconds
   * @returns {Promise<Object>} Job details including jobId
   */
  async scheduleSMS(smsData, delayMs = 0) {
    try {
      // Ensure callbackEndpoint is included in metadata
      const metadata = smsData.metadata || {};
      if (!metadata.callbackEndpoint) {
        metadata.callbackEndpoint = "/send-sms";
      }

      const response = await this.client.post('/api/schedule-sms', {
        phoneNumber: smsData.phoneNumber,
        message: smsData.message,
        contactId: smsData.contactId, // Ensure contactId is passed at top level
        workspaceId: smsData.workspaceId,
        delay: delayMs,
        metadata
      });

      return {
        success: true,
        jobId: response.data.jobId,
        scheduledTime: new Date(Date.now() + delayMs).toISOString()
      };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Check the status of a scheduled job
   * @param {string} jobId The ID of the job to check
   * @returns {Promise<Object>} Job status details
   */
  async checkJobStatus(jobId) {
    try {
      const response = await this.client.get(`/api/job-status/${jobId}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Retry a failed job
   * @param {string} jobId The ID of the job to retry
   * @returns {Promise<Object>} Job retry details
   */
  async retryJob(jobId) {
    try {
      const response = await this.client.post(`/api/retry-job/${jobId}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Handle and transform errors from the queue service
   * @private
   */
  _handleError(error) {
    if (error instanceof QueueServiceError) {
      return error;
    }

    if (error.response) {
      // Server responded with error status
      return new QueueServiceError(
        QueueErrorTypes.SERVICE_ERROR,
        error.response.data?.message || 'Queue service error',
        error
      );
    }

    if (error.request) {
      // Request made but no response received
      return new QueueServiceError(
        QueueErrorTypes.NETWORK_ERROR,
        'Network error while connecting to queue service',
        error
      );
    }

    // Error in request configuration
    return new QueueServiceError(
      QueueErrorTypes.SCHEDULING_FAILED,
      'Failed to schedule message',
      error
    );
  }
}

// Export singleton instance
export const queueService = new QueueService(); 