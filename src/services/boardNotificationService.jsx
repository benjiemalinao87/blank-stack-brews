import { supabase } from './supabase';
import { initializeSocket, addMessageHandler } from './messageService';

/**
 * Service to handle board notification functionality
 * Tracks unread messages for boards based on the board's phone number
 */
const boardNotificationService = {
  /**
   * Get the count of unread messages for a specific board
   * @param {string} boardId - The ID of the board
   * @returns {Promise<number>} - The count of unread messages
   */
  getUnreadCount: async (boardId) => {
    try {
      // Get all contacts associated with this board
      const { data: boardContacts, error: contactsError } = await supabase
        .from('board_contacts')
        .select('contact_id')
        .eq('board_id', boardId);
      
      if (contactsError) {
        console.error('Error fetching board contacts:', contactsError);
        return 0;
      }
      
      if (!boardContacts || boardContacts.length === 0) {
        return 0;
      }
      
      // Extract contact IDs
      const contactIds = boardContacts.map(bc => bc.contact_id);
      
      // Get the sum of unread counts for these contacts
      const { data: contacts, error: unreadError } = await supabase
        .from('contacts')
        .select('unread_count')
        .in('id', contactIds);
      
      if (unreadError) {
        console.error('Error fetching contact unread counts:', unreadError);
        return 0;
      }
      
      // Sum up all unread counts
      const totalUnread = contacts.reduce((sum, contact) => {
        return sum + (contact.unread_count || 0);
      }, 0);
      
      return totalUnread;
    } catch (error) {
      console.error('Error calculating unread count:', error);
      return 0;
    }
  },
  
  /**
   * Get unread counts for all boards in a workspace
   * @param {string} workspaceId - The ID of the workspace
   * @returns {Promise<Object>} - Object mapping board IDs to unread counts
   */
  getAllBoardUnreadCounts: async (workspaceId) => {
    try {
      // Get all boards in the workspace
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('id')
        .eq('workspace_id', workspaceId);
      
      if (boardsError) {
        console.error('Error fetching boards:', boardsError);
        return {};
      }
      
      // Initialize result object
      const result = {};
      
      // Get unread count for each board
      for (const board of boards) {
        result[board.id] = await boardNotificationService.getUnreadCount(board.id);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting all board unread counts:', error);
      return {};
    }
  },
  
  /**
   * Subscribe to real-time updates for unread counts
   * @param {Function} callback - Function to call when unread counts change
   * @param {string} workspaceId - The ID of the workspace to monitor
   * @returns {Function} - Unsubscribe function
   */
  subscribeToUnreadCounts: (callback, workspaceId) => {
    // Initialize socket connection
    initializeSocket();
    
    // Add message handler for new messages
    const handleNewMessage = async (message) => {
      if (message.workspace_id === workspaceId) {
        // When a new message arrives, recalculate unread counts
        const unreadCounts = await boardNotificationService.getAllBoardUnreadCounts(workspaceId);
        callback(unreadCounts);
      }
    };
    
    // Add the handler
    addMessageHandler(handleNewMessage);
    
    // Also subscribe to contact changes in Supabase
    const subscription = supabase
      .channel('contacts-channel')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'contacts',
        filter: `workspace_id=eq.${workspaceId}`
      }, async (payload) => {
        // When a contact is updated, recalculate unread counts
        const unreadCounts = await boardNotificationService.getAllBoardUnreadCounts(workspaceId);
        callback(unreadCounts);
      })
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }
};

export default boardNotificationService;
