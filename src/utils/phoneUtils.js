/**
 * Phone number utility functions for formatting and normalization
 */

/**
 * Formats a phone number for display in a consistent format
 * @param {string} phone - The phone number to format
 * @returns {string} The formatted phone number
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle US phone numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Handle international numbers
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if we can't format it
  return phone;
};

/**
 * Normalizes a phone number by removing all non-numeric characters
 * @param {string} phone - The phone number to normalize
 * @returns {string} The normalized phone number (digits only)
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's a US number without country code, add +1
  if (cleaned.length === 10) {
    return `1${cleaned}`;
  }
  
  return cleaned;
};

/**
 * Validates if a string is a valid phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  const normalized = normalizePhone(phone);
  
  // Must be either 10 digits (US without country code) or 11 digits starting with 1
  return (
    normalized.length === 10 ||
    (normalized.length === 11 && normalized.startsWith('1'))
  );
};
