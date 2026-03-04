/**
 * Utility Functions
 * Formatting helpers, parsing, and utility functions
 */

/**
 * Format number as Vietnamese currency (VND)
 * @param {number} amount Amount in VND
 * @returns {string} Formatted currency string (e.g., "₫1.000.000")
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₫0';
  }

  // Format with thousand separators (Vietnamese style with dots)
  const formatted = Math.round(amount).toLocaleString('vi-VN');
  return '₫' + formatted;
}

/**
 * Format percentage
 * @param {number} percentage Percentage value
 * @param {number} decimals Number of decimal places (default 1)
 * @returns {string} Formatted percentage (e.g., "95.5%")
 */
function formatPercentage(percentage, decimals = 1) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0%';
  }

  return percentage.toFixed(decimals) + '%';
}

/**
 * Format date for Vietnamese locale
 * @param {Date} date Date object
 * @returns {string} Formatted date string (dd/MM/yyyy HH:mm)
 */
function formatDate(date) {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }

  return Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm');
}

/**
 * Parse number from Vietnamese/English format
 * Handles: "1.000.000", "1,000,000", "-", empty strings
 * @param {string|number} str String to parse
 * @returns {number} Parsed number or 0 if invalid
 */
function parseNumber(str) {
  // Handle if already a number
  if (typeof str === 'number') {
    return isNaN(str) ? 0 : str;
  }

  // Handle null/undefined/empty
  if (!str || str === null || str === undefined) {
    return 0;
  }

  // Convert to string and trim
  str = str.toString().trim();

  // Handle dash (means zero/empty in CSV)
  if (str === '-' || str === '') {
    return 0;
  }

  // Remove all dots, commas, and spaces
  // This handles both "1.000.000" (Vietnamese) and "1,000,000" (English)
  const cleaned = str.replace(/[\.,\s]/g, '');

  // Parse as float
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Clean string - trim and remove special characters
 * @param {string} str String to clean
 * @returns {string} Cleaned string
 */
function cleanString(str) {
  if (!str) return '';

  return str.toString().trim().replace(/\s+/g, ' ');
}

/**
 * Get column letter for month
 * Maps T1→E, T2→F, ..., T12→P
 * @param {string} month Month code (T1, T2, etc.)
 * @returns {number} Column index (0-based)
 */
function getMonthColumn(month) {
  const monthMap = {
    'T1': 4,   // Column E (0-indexed)
    'T2': 5,   // Column F
    'T3': 6,   // Column G
    'T4': 7,   // Column H
    'T5': 8,   // Column I
    'T6': 9,   // Column J
    'T7': 10,  // Column K
    'T8': 11,  // Column L
    'T9': 12,  // Column M
    'T10': 13, // Column N
    'T11': 14, // Column O
    'T12': 15  // Column P
  };

  return monthMap[month] !== undefined ? monthMap[month] : -1;
}

/**
 * Get month name from number
 * @param {number} monthNum Month number (1-12)
 * @returns {string} Month code (T1-T12)
 */
function getMonthName(monthNum) {
  if (monthNum < 1 || monthNum > 12) {
    return 'T1';
  }

  return 'T' + monthNum;
}

/**
 * Get current month code (T1-T12)
 * @returns {string} Current month code
 */
function getCurrentMonth() {
  const now = new Date();
  const monthNum = now.getMonth() + 1; // 0-indexed, so +1
  return getMonthName(monthNum);
}

/**
 * Normalize category name for matching
 * Removes extra spaces, converts to lowercase
 * @param {string} category Category name
 * @returns {string} Normalized category name
 */
function normalizeCategory(category) {
  if (!category) return '';

  return category
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/gi, '');
}

/**
 * Check if two category names match (fuzzy matching)
 * @param {string} cat1 First category name
 * @param {string} cat2 Second category name
 * @returns {boolean} True if match
 */
function categoriesMatch(cat1, cat2) {
  if (!cat1 || !cat2) return false;

  const norm1 = normalizeCategory(cat1);
  const norm2 = normalizeCategory(cat2);

  // Exact match
  if (norm1 === norm2) return true;

  // Contains match (for sub-items)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

  return false;
}

/**
 * Sleep/pause execution
 * @param {number} milliseconds Time to sleep in ms
 */
function sleep(milliseconds) {
  Utilities.sleep(milliseconds);
}

/**
 * Log to console with timestamp
 * @param {string} message Log message
 * @param {Object} data Optional data object to log
 */
function log(message, data = null) {
  const timestamp = formatDate(new Date());
  const logMessage = `[${timestamp}] ${message}`;

  Logger.log(logMessage);

  if (data) {
    Logger.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Log error with details
 * @param {string} message Error message
 * @param {Error} error Error object
 */
function logError(message, error) {
  const timestamp = formatDate(new Date());
  Logger.log(`[${timestamp}] ERROR: ${message}`);

  if (error) {
    Logger.log(`Error details: ${error.message}`);
    if (error.stack) {
      Logger.log(`Stack trace: ${error.stack}`);
    }
  }
}

/**
 * Convert column index to letter (A, B, C, ...)
 * @param {number} columnIndex 0-based column index
 * @returns {string} Column letter
 */
function columnToLetter(columnIndex) {
  let letter = '';
  let num = columnIndex;

  while (num >= 0) {
    letter = String.fromCharCode((num % 26) + 65) + letter;
    num = Math.floor(num / 26) - 1;
  }

  return letter;
}

/**
 * Truncate string to max length
 * @param {string} str String to truncate
 * @param {number} maxLength Maximum length
 * @returns {string} Truncated string with "..." if needed
 */
function truncate(str, maxLength) {
  if (!str) return '';

  str = str.toString();

  if (str.length <= maxLength) return str;

  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Get emoji for alert level
 * @param {string} level Alert level (warning, critical, monthly_total)
 * @param {number} percentage Percentage value
 * @returns {string} Emoji
 */
function getAlertEmoji(level, percentage) {
  if (percentage >= 100) return '🔴';
  return '⚠️';
}

/**
 * Get status text for alert
 * @param {string} level Alert level
 * @param {number} percentage Percentage value
 * @returns {string} Status text in Vietnamese
 */
function getAlertStatus(level, percentage) {
  if (level === 'monthly_total') return 'CẢNH BÁO NGHIÊM TRỌNG';
  if (percentage >= 100) return 'VƯỢT NGƯỠNG';
  return 'CẢNH BÁO';
}
