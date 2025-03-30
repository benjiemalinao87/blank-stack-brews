
// Basic implementation of the API service
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = {
  sendMessage: async (to, message) => {
    return new Promise((resolve, reject) => {
      try {
        // This is a mock implementation
        setTimeout(() => {
          resolve({
            to,
            message,
            timestamp: new Date(),
            direction: 'outbound',
            messageSid: 'mock-message-sid-' + Date.now(),
            status: 'sent'
          });
        }, 500);
      } catch (error) {
        console.error('Error sending message:', error);
        reject(error);
      }
    });
  }
};
