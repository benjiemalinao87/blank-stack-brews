declare global {
  interface Window {
    REACT_APP_API_URL: string;
    REACT_APP_TWILIO_WEBHOOK: string;
  }
}

export interface Message {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
  contact_id: string;
  status?: string;
  twilio_sid?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  isNew?: boolean;
  newCount?: number;
  phoneNumber?: string;  // Added for Twilio integration
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: "available" | "busy" | "offline";
  activeChats: number;
}

export interface TwilioConfig {
  phoneNumber: string;
  apiUrl: string;
}
