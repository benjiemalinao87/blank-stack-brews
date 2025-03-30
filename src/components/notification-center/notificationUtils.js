import { NOTIFICATION_TYPES } from '../../contexts/NotificationContext';

/**
 * Creates a notification object with the specified parameters
 * 
 * @param {Object} params - The notification parameters
 * @param {string} params.title - The notification title
 * @param {string} params.message - The notification message
 * @param {string} params.type - The notification type (info, success, warning, error)
 * @param {string} params.source - The source of the notification (e.g., "System", "Chat", etc.)
 * @param {string} params.icon - URL to an icon image
 * @param {Function} params.onClick - Function to call when the notification is clicked
 * @returns {Object} The notification object
 */
export const createNotification = ({
  title,
  message,
  type = NOTIFICATION_TYPES.INFO,
  source = null,
  icon = null,
  onClick = null,
}) => {
  return {
    title,
    message,
    type,
    source,
    icon,
    onClick,
  };
};

/**
 * Creates an info notification
 */
export const createInfoNotification = (params) => {
  return createNotification({
    ...params,
    type: NOTIFICATION_TYPES.INFO,
  });
};

/**
 * Creates a success notification
 */
export const createSuccessNotification = (params) => {
  return createNotification({
    ...params,
    type: NOTIFICATION_TYPES.SUCCESS,
  });
};

/**
 * Creates a warning notification
 */
export const createWarningNotification = (params) => {
  return createNotification({
    ...params,
    type: NOTIFICATION_TYPES.WARNING,
  });
};

/**
 * Creates an error notification
 */
export const createErrorNotification = (params) => {
  return createNotification({
    ...params,
    type: NOTIFICATION_TYPES.ERROR,
  });
};

/**
 * Creates a system notification
 */
export const createSystemNotification = (params) => {
  return createNotification({
    ...params,
    source: 'System',
  });
};

/**
 * Creates a chat notification
 */
export const createChatNotification = (params) => {
  return createNotification({
    ...params,
    source: 'Chat',
  });
};

/**
 * Creates a contact notification
 */
export const createContactNotification = (params) => {
  return createNotification({
    ...params,
    source: 'Contacts',
  });
};

/**
 * Creates an appointment notification
 */
export const createAppointmentNotification = (params) => {
  return createNotification({
    ...params,
    source: 'Appointments',
  });
}; 