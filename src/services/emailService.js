import axios from 'axios';
import config from '../utils/config';

const API_ENDPOINT = `${config.apiUrl}/api/email`;

/**
 * Send an email using the backend API
 * @param {Object} emailData - The email data to send
 * @param {string|string[]} emailData.to - Recipient email address(es)
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.body - Email body (HTML)
 * @param {Array} emailData.attachments - Array of attachment objects
 * @param {string} workspaceId - The workspace ID
 * @returns {Promise} - Promise resolving to the API response
 */
export const sendEmail = async (emailData, workspaceId) => {
  try {
    const { to, subject, body, attachments = [] } = emailData;
    
    // Validate required fields
    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, body');
    }
    
    const response = await axios.post(`${API_ENDPOINT}/send`, {
      to: Array.isArray(to) ? to : [to],
      subject,
      body,
      attachments,
      workspaceId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Get email history for a workspace
 * @param {string} workspaceId - The workspace ID
 * @returns {Promise} - Promise resolving to the API response
 */
export const getEmailHistory = async (workspaceId) => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/history`, {
      params: { workspaceId }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching email history:', error);
    throw error;
  }
};

export default {
  sendEmail,
  getEmailHistory
};
