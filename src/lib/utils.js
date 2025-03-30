import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and resolves Tailwind CSS conflicts
 * @param {...string} inputs - Class names to combine
 * @returns {string} - Combined class names with resolved conflicts
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 * @param {Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  
  return new Intl.DateTimeFormat(
    "en-US", 
    { ...defaultOptions, ...options }
  ).format(date instanceof Date ? date : new Date(date));
}

/**
 * Delay execution for a specified time
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after the delay
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} - Initials (up to 2 characters)
 */
export function getInitials(name) {
  if (!name) return "";
  
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
