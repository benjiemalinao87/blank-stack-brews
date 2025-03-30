
/**
 * Socket service implementation
 */
import { io } from 'socket.io-client';

// Get the appropriate backend URL based on environment
export const getBackendUrl = () => {
  // Try to get URL from window.REACT_APP_API_URL (set in config.js)
  const apiUrl = window.REACT_APP_API_URL;
  
  if (apiUrl) {
    // Convert HTTP/HTTPS to WS/WSS
    return apiUrl.replace(/^http/, 'ws');
  }
  
  // Fallback to production URL
  return 'wss://cc.automate8.com';
};

const BACKEND_URL = getBackendUrl();

// Initialize socket with retry logic and proper configuration
export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  transports: ['websocket'], 
  path: '/socket.io',
  secure: true,
  rejectUnauthorized: false,
  withCredentials: true
});

// Create a promise that resolves when socket connects
export const waitForConnection = () => {
  if (socket.connected) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Socket connection timeout'));
    }, 10000);

    socket.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });

    socket.once('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

export default socket;
