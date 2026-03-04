/**
 * Telegram Client
 * Telegram Bot API integration using UrlFetchApp
 */

/**
 * Send message to Telegram
 * @param {string} chatId Telegram chat ID
 * @param {string} text Message text
 * @param {Object} options Additional options
 * @returns {Object} Telegram API response
 */
function sendTelegramMessage(chatId, text, options = {}) {
  try {
    const config = getConfig();
    const token = config.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: options.parseMode || 'Markdown',
      disable_notification: options.silent || false,
      disable_web_page_preview: options.disablePreview !== false
    };

    const requestOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, requestOptions);
    const result = JSON.parse(response.getContentText());

    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }

    log(`Message sent to ${chatId}: ${result.result.message_id}`);
    return result;

  } catch (error) {
    logError(`Failed to send Telegram message to ${chatId}`, error);
    throw error;
  }
}

/**
 * Send alert to Telegram with retry logic
 * @param {string} chatId Chat ID
 * @param {string} message Alert message
 * @param {number} maxRetries Maximum retry attempts (default 3)
 * @returns {Object} Send result
 */
function sendAlertWithRetry(chatId, message, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`Sending alert (attempt ${attempt}/${maxRetries})`);
      const result = sendTelegramMessage(chatId, message);
      return {
        success: true,
        messageId: result.result.message_id,
        attempts: attempt
      };

    } catch (error) {
      lastError = error;
      log(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 6s
        const delayMs = 2000 * attempt;
        log(`Waiting ${delayMs}ms before retry...`);
        Utilities.sleep(delayMs);
      }
    }
  }

  // All retries failed
  logError(`Failed after ${maxRetries} attempts`, lastError);
  return {
    success: false,
    error: lastError.message,
    attempts: maxRetries
  };
}

/**
 * Send multiple alerts with rate limiting
 * @param {string} chatId Chat ID
 * @param {Array<string>} alerts Array of alert messages
 * @returns {Array<Object>} Array of send results
 */
function sendMultipleAlerts(chatId, alerts) {
  if (!alerts || alerts.length === 0) {
    log('No alerts to send');
    return [];
  }

  log(`Sending ${alerts.length} alerts to ${chatId}`);

  const results = [];

  for (let i = 0; i < alerts.length; i++) {
    try {
      const result = sendAlertWithRetry(chatId, alerts[i]);
      results.push({
        index: i,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });

      // Rate limiting: delay between messages (except after last message)
      if (i < alerts.length - 1) {
        log('Rate limiting: waiting 1.5s before next message...');
        Utilities.sleep(1500); // 1.5 seconds
      }

    } catch (error) {
      logError(`Failed to send alert ${i + 1}/${alerts.length}`, error);
      results.push({
        index: i,
        success: false,
        error: error.message
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log(`Alerts sent: ${successful} succeeded, ${failed} failed`);

  return results;
}

/**
 * Validate bot token by calling getMe API
 * @param {string} token Bot token (optional, uses config if not provided)
 * @returns {Object} Validation result
 */
function validateBotToken(token = null) {
  try {
    if (!token) {
      const config = getConfig();
      token = config.TELEGRAM_BOT_TOKEN;
    }

    if (!token) {
      return {
        valid: false,
        error: 'No token provided'
      };
    }

    const url = `https://api.telegram.org/bot${token}/getMe`;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const result = JSON.parse(response.getContentText());

    if (!result.ok) {
      return {
        valid: false,
        error: result.description || 'Invalid token'
      };
    }

    log(`Bot token validated: ${result.result.username} (ID: ${result.result.id})`);

    return {
      valid: true,
      botInfo: {
        id: result.result.id,
        username: result.result.username,
        firstName: result.result.first_name
      }
    };

  } catch (error) {
    logError('Failed to validate bot token', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Get bot information
 * @returns {Object} Bot info or error
 */
function getBotInfo() {
  return validateBotToken();
}

/**
 * Get recent updates (for finding chat ID)
 * @param {number} limit Maximum number of updates (default 10)
 * @returns {Array<Object>} Array of updates
 */
function getUpdates(limit = 10) {
  try {
    const config = getConfig();
    const token = config.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const url = `https://api.telegram.org/bot${token}/getUpdates?limit=${limit}`;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const result = JSON.parse(response.getContentText());

    if (!result.ok) {
      throw new Error(result.description || 'Failed to get updates');
    }

    log(`Retrieved ${result.result.length} updates`);
    return result.result;

  } catch (error) {
    logError('Failed to get updates', error);
    throw error;
  }
}

/**
 * Extract chat IDs from recent updates
 * Useful for finding your chat ID
 * @returns {Array<Object>} Array of chat info
 */
function getChatIdsFromUpdates() {
  try {
    const updates = getUpdates(100);
    const chats = [];
    const seenChatIds = new Set();

    updates.forEach(update => {
      const chat = update.message?.chat || update.edited_message?.chat;
      if (chat && !seenChatIds.has(chat.id)) {
        seenChatIds.add(chat.id);
        chats.push({
          id: chat.id,
          type: chat.type,
          title: chat.title,
          username: chat.username,
          firstName: chat.first_name,
          lastName: chat.last_name
        });
      }
    });

    log(`Found ${chats.length} unique chats`);
    Logger.log('=== Chat IDs ===');
    chats.forEach(chat => {
      Logger.log(`ID: ${chat.id}, Type: ${chat.type}, Name: ${chat.title || chat.firstName || 'N/A'}`);
    });
    Logger.log('================');

    return chats;

  } catch (error) {
    logError('Failed to extract chat IDs', error);
    return [];
  }
}

/**
 * Send test message
 * @param {string} chatId Chat ID to send test to
 * @returns {Object} Send result
 */
function sendTestMessage(chatId = null) {
  try {
    if (!chatId) {
      const config = getConfig();
      chatId = config.TELEGRAM_CHAT_ID;
    }

    if (!chatId) {
      throw new Error('No chat ID provided or configured');
    }

    const testMessage = `✅ *Test Message - Teennie Expense Monitor*\n\n`;
    const timestamp = formatDate(new Date());
    const message = testMessage + `Hệ thống cảnh báo chi phí hoạt động bình thường.\n\n⏰ ${timestamp}`;

    return sendTelegramMessage(chatId, message);

  } catch (error) {
    logError('Failed to send test message', error);
    throw error;
  }
}

/**
 * Send alert (main entry point)
 * @param {string} chatId Chat ID
 * @param {string} alertMessage Alert message
 * @returns {Object} Send result
 */
function sendAlert(chatId, alertMessage) {
  return sendAlertWithRetry(chatId, alertMessage);
}
