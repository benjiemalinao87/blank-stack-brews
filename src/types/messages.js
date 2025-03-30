// Message Types
export const MESSAGE_TYPE = {
  TEXT: 'text',
  EMAIL: 'email',
  LINK: 'link',
  PHONE: 'phone',
  MIXED: 'mixed'
};

// Message Directions
export const MESSAGE_DIRECTION = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound'
};

// Message Status
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

/**
 * @typedef {Object} Message
 * @property {string} id - UUID of the message
 * @property {string} workspace_id - UUID of the workspace
 * @property {string} contact_id - UUID of the contact
 * @property {('inbound'|'outbound')} direction - Direction of the message
 * @property {('text'|'email'|'link'|'phone'|'mixed')} message_type - Type of the message
 * @property {string} content - Content of the message
 * @property {Object} metadata - Additional metadata about the message
 * @property {number} sentiment - Sentiment score of the message
 * @property {number[]} embedding - Vector embedding of the message
 * @property {string} twilio_sid - Twilio message SID
 * @property {('pending'|'delivered'|'read'|'failed')} status - Status of the message
 * @property {string} created_at - ISO timestamp of when the message was created
 * @property {string} updated_at - ISO timestamp of when the message was last updated
 * @property {string} created_by - UUID of the user who created the message
 */

/**
 * @typedef {Object} MessageGroup
 * @property {Message[]} messages - Array of messages in the group
 * @property {string} direction - Direction of messages in the group
 * @property {string} timestamp - Timestamp of the first message in the group
 */ 