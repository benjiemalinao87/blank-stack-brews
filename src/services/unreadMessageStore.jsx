import { create } from 'zustand';
import { supabase } from './supabase';

interface UnreadMessageState {
  unreadCounts: Record<string, number>;
  lastUnreadAt: Record<string, string>;
  
  // Actions
  incrementUnread: (contactId: string) => Promise<void>;
  resetUnread: (contactId: string) => Promise<void>;
  loadUnreadState: () => Promise<void>;
  handleNewMessage: (message: any) => Promise<void>;
}

const useUnreadMessageStore = create<UnreadMessageState>((set, get) => ({
  unreadCounts: {},
  lastUnreadAt: {},

  incrementUnread: async (contactId: string) => {
    try {
      // Update local state
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [contactId]: (state.unreadCounts[contactId] || 0) + 1
        },
        lastUnreadAt: {
          ...state.lastUnreadAt,
          [contactId]: new Date().toISOString()
        }
      }));

      // Update in Supabase
      const { data, error } = await supabase
        .from('unread_messages')
        .upsert({
          contact_id: contactId,
          unread_count: get().unreadCounts[contactId],
          last_unread_at: get().lastUnreadAt[contactId]
        }, {
          onConflict: 'contact_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing unread count:', error);
    }
  },

  resetUnread: async (contactId: string) => {
    try {
      // Update local state
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [contactId]: 0
        }
      }));

      // Update in Supabase
      const { error } = await supabase
        .from('unread_messages')
        .upsert({
          contact_id: contactId,
          unread_count: 0
        }, {
          onConflict: 'contact_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting unread count:', error);
    }
  },

  loadUnreadState: async () => {
    try {
      const { data, error } = await supabase
        .from('unread_messages')
        .select('*');

      if (error) throw error;

      const unreadCounts: Record<string, number> = {};
      const lastUnreadAt: Record<string, string> = {};

      data.forEach((item) => {
        unreadCounts[item.contact_id] = item.unread_count;
        lastUnreadAt[item.contact_id] = item.last_unread_at;
      });

      set({ unreadCounts, lastUnreadAt });
    } catch (error) {
      console.error('Error loading unread state:', error);
    }
  },

  handleNewMessage: async (message: any) => {
    if (message.direction === 'inbound') {
      await get().incrementUnread(message.from);
    }
  }
}));

export default useUnreadMessageStore;
