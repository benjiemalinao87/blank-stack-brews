/**
 * ⚠️ CRITICAL SOCKET CONFIGURATION - DO NOT MODIFY ⚠️
 * This file contains core socket.io configuration and setup.
 * It is essential for maintaining real-time communication between the client and server.
 * Modifications to this file can disrupt the entire messaging system.
 */

import { io } from 'socket.io-client';
import logger from './utils/logger';

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

// Connection state
let isConnected = false;
let lastError = null;
let connectionPromise = null;

// Initialize socket with retry logic and proper configuration
const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  transports: ['websocket'], // Only use WebSocket transport
  path: '/socket.io',
  secure: true,
  rejectUnauthorized: false,
  withCredentials: true
});

// Enhanced connection status tracking
socket.on('connect', () => {
  isConnected = true;
  lastError = null;
  connectionPromise = null;
  logger.debug('Socket connected');
});

socket.on('disconnect', (reason) => {
  isConnected = false;
  connectionPromise = null;
  logger.debug('Socket disconnected');
});

socket.on('connect_error', (error) => {
  lastError = error;
  isConnected = false;
  connectionPromise = null;
  logger.error('Socket error:', error);
});

// Create a promise that resolves when socket connects
const waitForConnection = () => {
  if (isConnected) return Promise.resolve();
  
  if (!connectionPromise) {
    connectionPromise = new Promise((resolve, reject) => {
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
  }

  return connectionPromise;
};

// Get current socket status with more details
const getSocketStatus = () => ({
  isConnected,
  lastError,
  id: socket.id,
  url: BACKEND_URL,
  transport: socket.io?.engine?.transport?.name
});

export { socket, waitForConnection, getSocketStatus };
export default socket;
