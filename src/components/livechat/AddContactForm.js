import { isValidPhone as validatePhoneNumber } from '../../utils/phoneUtils';

const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If already in E.164 format
  if (phone.startsWith('+')) {
    // Check for valid US or AU format
    return /^\+1\d{10}$/.test(phone) || /^\+61\d{9}$/.test(phone);
  }

  // Check for valid lengths
  if (cleaned.length === 10) {
    // US number or AU number starting with 0
    return true;
  }

  if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    // AU number without leading 0
    return true;
  }

  // Check for numbers with country code
  if (cleaned.length === 11) {
    // US number starting with 1 or AU number starting with 61
    return cleaned.startsWith('1') || cleaned.startsWith('61');
  }

  return false;
}; 