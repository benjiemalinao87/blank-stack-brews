import { Message } from '../types';
import { socket, waitForConnection } from '../socket';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = {
  sendMessage: async (to: string, message: string): Promise<Message> => {
    return new Promise((resolve, reject) => {
      try {
        // Wait for socket connection
        waitForConnection().then(() => {
          // Listen for message sent confirmation
          const messageTimeout = setTimeout(() => {
            reject(new Error('Message send timeout'));
            socket.off('message_sent');
            socket.off('message_error');
          }, 10000);

          socket.on('message_sent', (response: any) => {
            clearTimeout(messageTimeout);
            socket.off('message_sent');
            socket.off('message_error');

            if (response.success) {
              resolve({
                from: process.env.REACT_APP_TWILIO_PHONE || '',
                to,
                message,
                timestamp: new Date(),
                direction: 'outbound',
                messageSid: response.messageSid,
                status: response.status || 'sent'
              });
            } else {
              reject(new Error(response.error || 'Failed to send message'));
            }
          });

          socket.on('message_error', (error: any) => {
            clearTimeout(messageTimeout);
            socket.off('message_sent');
            socket.off('message_error');
            reject(new Error(error.message || 'Failed to send message'));
          });

          // Emit the send_message event
          socket.emit('send_message', {
            to,
            content: message
          });

        }).catch(error => {
          console.error('Socket connection error:', error);
          reject(new Error('Failed to connect to server'));
        });

      } catch (error: any) {
        console.error('Error sending message:', error);
        reject(error);
      }
    });
  }
};
