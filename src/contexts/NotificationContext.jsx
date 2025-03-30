import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Define notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Create the context
const NotificationContext = createContext();

// Maximum number of notifications to store
const MAX_NOTIFICATIONS = 50;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    setNotifications(prev => {
      // Add new notification at the beginning and limit the total count
      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      return updated;
    });
    
    // Increment unread count
    setUnreadCount(prev => prev + 1);
    
    return newNotification.id;
  }, []);

  // Remove a notification by ID
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      return prev.map(notification => {
        if (notification.id === id && !notification.read) {
          setUnreadCount(count => Math.max(0, count - 1));
          return { ...notification, read: true };
        }
        return notification;
      });
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      return prev.map(notification => ({ ...notification, read: true }));
    });
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Toggle notification center visibility
  const toggleNotificationCenter = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close notification center
  const closeNotificationCenter = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Open notification center
  const openNotificationCenter = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Context value
  const value = {
    notifications,
    unreadCount,
    isOpen,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    toggleNotificationCenter,
    closeNotificationCenter,
    openNotificationCenter,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext; 