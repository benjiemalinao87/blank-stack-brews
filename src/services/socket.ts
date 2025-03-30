import { io, Socket } from 'socket.io-client';
import { Message } from '../types';
import logger from '../utils/logger';

// Use the backend domain for socket connection
const SOCKET_URL = 'https://cc.automate8.com';

logger.info('Environment Check:', {
  apiUrl: '[REDACTED]',
  defaultUrl: '[REDACTED]',
  finalUrl: '[REDACTED]'
});

// Convert HTTP/HTTPS to WS/WSS
const getWebSocketUrl = (url: string) => {
  try {
    // Always use production URL for WebSocket
    const wsUrl = new URL('wss://cc.automate8.com');
    wsUrl.pathname = '/socket.io';
    
    logger.info('WebSocket URL configured');
    return wsUrl.toString();
  } catch (error) {
    logger.error('Error configuring WebSocket URL');
    return 'wss://cc.automate8.com/socket.io';
  }
};

class SocketService {
  private socket: Socket | null = null;
  private phoneNumber: string | null = null;
  private debugMode = false; // Disable debug mode in production
  private connectionAttempts = 0;
  private readonly MAX_ATTEMPTS = 3;

  private log(...args: any[]) {
    if (this.debugMode) {
      logger.info('[Socket]', ...this.sanitizeArgs(args));
    }
  }

  private error(...args: any[]) {
    logger.error('[Socket]', ...this.sanitizeArgs(args));
  }

  // Sanitize sensitive data before logging
  private sanitizeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const sanitized = { ...arg };
        // Redact sensitive fields
        ['socketId', 'phoneNumber', 'id', 'url', 'uri'].forEach(field => {
          if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
          }
        });
        return sanitized;
      }
      return arg;
    });
  }

  connect() {
    if (!this.socket) {
      this.connectionAttempts++;
      const wsUrl = getWebSocketUrl(SOCKET_URL);
      
      this.log('Connection Attempt:', {
        attempt: this.connectionAttempts,
        maxAttempts: this.MAX_ATTEMPTS
      });
      
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        withCredentials: true,
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: this.MAX_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true,
        forceNew: true
      });

      this.setupListeners();
    }
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.log('Connected:', {
        transport: this.socket?.io?.engine?.transport?.name
      });
      
      if (this.phoneNumber) {
        this.joinRoom(this.phoneNumber);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.error('Connection Error:', {
        error: error.message,
        type: error.type,
        transport: this.socket?.io?.engine?.transport?.name,
        attempt: this.connectionAttempts
      });
      
      if (this.socket?.io?.engine?.transport?.name === 'websocket') {
        this.log('Falling back to polling transport');
        this.socket.io.engine.transport.name = 'polling';
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('new_message', (message) => {
      this.log('Received new message');
    });

    this.socket.on('error', (error) => {
      this.error('Socket error:', error);
    });

    // Only enable debug logging in development
    if (this.debugMode) {
      const originalEmit = this.socket.emit.bind(this.socket);
      this.socket.emit = (event: string, ...args: any[]) => {
        this.log('Emitting event:', event);
        return originalEmit(event, ...args);
      };

      this.socket.onAny((eventName, ...args) => {
        this.log('Socket Event:', {
          event: eventName
        });
      });
    }
  }

  register(phoneNumber: string) {
    this.log('Registering phone');
    this.phoneNumber = phoneNumber;
    this.socket?.emit('register', phoneNumber);
  }

  onNewMessage(callback: (message: Message) => void) {
    if (!this.socket) return;
    this.log('Setting up new_message listener');
    this.socket.on('new_message', (data) => {
      this.log('Received new message');
      callback(data);
    });
  }

  onMessageStatus(callback: (update: { messageSid: string; status: string }) => void) {
    if (!this.socket) return;
    this.socket.on('message_status', callback);
  }

  disconnect() {
    this.log('Disconnecting socket');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private joinRoom(phoneNumber: string) {
    this.log('Joining room');
    this.socket?.emit('join', phoneNumber, (response: any) => {
      this.log('Join room response received');
    });
  }
}

export const socketService = new SocketService();
