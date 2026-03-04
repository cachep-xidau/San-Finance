/**
 * TGIL Expense Alert System - Main Entry Point
 * Automated Telegram alerts for budget overruns
 *
 * Author: Claude Code
 * Version: 1.0.0
 */

/**
 * Main scheduled function - checks expenses and sends alerts
 * Runs at specific times: 12:00 and 16:00 daily
 */
function checkExpensesScheduled() {
  try {
    log('=== Expense Check Started ===');

    // Get configuration
    const config = getConfig();

    // Check if alerts are enabled
    if (!config.ENABLE_ALERTS) {
      log('Alerts are disabled in configuration');
      return;
    }

    // Validate configuration
    try {
      validateConfig(config);
    } catch (error) {
      logError('Invalid configuration', error);
      // Try to send error notification
      sendErrorNotification(error, 'Configuration validation failed');
      return;
    }

    // Detect which months to check (current month only)
    const changedMonths = detectChangedMonths(new Date());

    if (changedMonths.length === 0) {
      log('Current month has no data yet - skipping check');
      return;
    }

    log(`Checking month: ${changedMonths.join(', ')}`);

    // Process each month
    let totalAlertsSent = 0;
    changedMonths.forEach(month => {
      const alertsSent = processMonthAlerts(month);
      totalAlertsSent += alertsSent;
    });

    log(`=== Expense Check Completed: ${totalAlertsSent} alerts sent ===`);

  } catch (error) {
    logError('Expense check failed', error);
    // Try to send error notification
    sendErrorNotification(error, 'Expense check execution failed');
  }
}

/**
 * Process alerts for a single month
 * @param {string} month Month code (T1, T2, etc.)
 * @returns {number} Number of alerts sent
 */
function processMonthAlerts(month) {
  try {
    log(`Processing alerts for ${month}`);

    // Compare expenses against budget
    const comparisonResults = compareMonthExpenses(month);

    // Check if there are any alerts
    const totalAlerts = comparisonResults.warnings.length + comparisonResults.criticals.length;

    if (totalAlerts === 0) {
      log(`No budget overruns detected for ${month}`);
      return 0;
    }

    log(`Found ${totalAlerts} alerts for ${month} (${comparisonResults.criticals.length} critical, ${comparisonResults.warnings.length} warnings)`);

    // Generate alert messages
    const alertMessages = generateAlerts(comparisonResults);

    if (alertMessages.length === 0) {
      log('No alert messages generated');
      return 0;
    }

    // Send alerts to Telegram
    const config = getConfig();
    const chatId = config.TELEGRAM_CHAT_ID;

    const results = sendMultipleAlerts(chatId, alertMessages);

    // Count successful sends
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log(`Alerts sent for ${month}: ${successful} succeeded, ${failed} failed`);

    return successful;

  } catch (error) {
    logError(`Failed to process alerts for ${month}`, error);
    return 0;
  }
}

/**
 * Send error notification to admin
 * @param {Error} error Error object
 * @param {string} context Error context
 */
function sendErrorNotification(error, context) {
  try {
    const config = getConfig();
    const chatId = config.TELEGRAM_CHAT_ID;

    if (!chatId) {
      log('Cannot send error notification: TELEGRAM_CHAT_ID not configured');
      return;
    }

    const errorMessage = formatErrorMessage(error, context);
    sendTelegramMessage(chatId, errorMessage);

  } catch (e) {
    logError('Failed to send error notification', e);
  }
}

/**
 * Send daily summary at 20:00
 * Sends 2 messages: 1) Expense alerts, 2) Revenue report
 */
function sendDailySummary() {
  try {
    log('=== Daily Summary Started (20:00) ===');

    // Get configuration
    const config = getConfig();

    // Check if alerts are enabled
    if (!config.ENABLE_ALERTS) {
      log('Alerts are disabled in configuration');
      return;
    }

    // Validate configuration
    try {
      validateConfig(config);
    } catch (error) {
      logError('Invalid configuration', error);
      sendErrorNotification(error, 'Configuration validation failed');
      return;
    }

    // Get current month
    const currentMonth = getCurrentMonth();
    log(`Current month: ${currentMonth}`);

    const chatId = config.TELEGRAM_CHAT_ID;
    let totalMessagesSent = 0;

    // === MESSAGE 1: Expense Alerts (same as 12h, 16h) ===
    try {
      log('Sending message 1/2: Expense alerts');

      // Compare expenses against budget
      const comparisonResults = compareMonthExpenses(currentMonth);
      const totalAlerts = comparisonResults.warnings.length + comparisonResults.criticals.length;

      if (totalAlerts > 0) {
        log(`Found ${totalAlerts} expense alerts`);

        // Generate alert messages
        const alertMessages = generateAlerts(comparisonResults);

        if (alertMessages.length > 0) {
          // Send expense alerts
          const results = sendMultipleAlerts(chatId, alertMessages);
          const successful = results.filter(r => r.success).length;
          totalMessagesSent += successful;
          log(`Expense alerts sent: ${successful} succeeded`);
        }
      } else {
        log('No expense alerts to send');
      }
    } catch (error) {
      logError('Failed to send expense alerts', error);
    }

    // Wait 2 seconds between messages
    Utilities.sleep(2000);

    // === MESSAGE 2: Revenue Report ===
    try {
      log('Sending message 2/2: Revenue report');

      // Get revenue data
      const revenueData = getRevenueData(currentMonth);

      // Format revenue report message
      const reportMessage = formatRevenueReport(revenueData);

      // Send to Telegram
      const result = sendTelegramMessage(chatId, reportMessage);

      if (result) {
        totalMessagesSent++;
        log('✅ Revenue report sent successfully');
      }
    } catch (error) {
      logError('Failed to send revenue report', error);
    }

    log(`=== Daily Summary Completed: ${totalMessagesSent} messages sent ===`);

  } catch (error) {
    logError('Daily summary failed', error);
    sendErrorNotification(error, 'Daily summary execution failed');
  }
}

/**
 * Install time-based triggers
 * Run this function once to set up automatic checking
 */
function installTriggers() {
  try {
    log('Installing triggers...');

    // Remove all existing triggers for this project
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
      log(`Deleted trigger: ${trigger.getHandlerFunction()}`);
    });

    // Install trigger 1: 12:00 daily - expense alerts only
    ScriptApp.newTrigger('checkExpensesScheduled')
      .timeBased()
      .everyDays(1)
      .atHour(12)
      .create();

    log('✅ Trigger 1 installed: checkExpensesScheduled at 12:00 daily');

    // Install trigger 2: 16:00 daily - expense alerts only
    ScriptApp.newTrigger('checkExpensesScheduled')
      .timeBased()
      .everyDays(1)
      .atHour(16)
      .create();

    log('✅ Trigger 2 installed: checkExpensesScheduled at 16:00 daily');

    // Install trigger 3: 20:00 daily - revenue report only
    ScriptApp.newTrigger('sendDailySummary')
      .timeBased()
      .everyDays(1)
      .atHour(20)
      .create();

    log('✅ Trigger 3 installed: sendDailySummary at 20:00 daily');

    // Send confirmation
    const config = getConfig();
    if (config.TELEGRAM_CHAT_ID) {
      const message = `✅ *TGIL Expense Monitor - Triggers Installed*\n\n` +
                     `Hệ thống cảnh báo đã được kích hoạt:\n\n` +
                     `⚠️ Cảnh báo chi phí: *12:00*, *16:00*\n` +
                     `📊 Báo cáo doanh thu: *20:00*\n\n` +
                     `⏰ ${formatDate(new Date())}`;
      sendTelegramMessage(config.TELEGRAM_CHAT_ID, message);
    }

  } catch (error) {
    logError('Failed to install triggers', error);
    throw error;
  }
}

/**
 * Uninstall all triggers
 * Use this to stop automatic checking
 */
function uninstallTriggers() {
  try {
    log('Uninstalling triggers...');

    const triggers = ScriptApp.getProjectTriggers();
    let count = 0;

    triggers.forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
      count++;
    });

    log(`✅ Uninstalled ${count} triggers`);

    // Send confirmation
    const config = getConfig();
    if (config.TELEGRAM_CHAT_ID) {
      const message = `⏸️ *TGIL Expense Monitor - Triggers Removed*\n\n` +
                     `Hệ thống cảnh báo đã bị tắt.\n\n` +
                     `⏰ ${formatDate(new Date())}`;
      sendTelegramMessage(config.TELEGRAM_CHAT_ID, message);
    }

  } catch (error) {
    logError('Failed to uninstall triggers', error);
    throw error;
  }
}

/**
 * List all installed triggers
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  Logger.log('=== Installed Triggers ===');

  if (triggers.length === 0) {
    Logger.log('No triggers installed');
  } else {
    triggers.forEach((trigger, index) => {
      Logger.log(`${index + 1}. Function: ${trigger.getHandlerFunction()}`);
      Logger.log(`   Event: ${trigger.getEventType()}`);
      Logger.log(`   Trigger source: ${trigger.getTriggerSource()}`);
    });
  }

  Logger.log('========================');
}

/**
 * Manual trigger for testing
 * Runs expense check immediately
 */
function runManualCheck() {
  try {
    log('=== Manual Check Started ===');

    // Run check (no cooldown with fixed schedule)
    checkExpensesScheduled();

    log('=== Manual Check Completed ===');

  } catch (error) {
    logError('Manual check failed', error);
    throw error;
  }
}

/**
 * Initialize the system
 * Run this once after deployment
 */
function initializeSystem() {
  try {
    log('=== Initializing TGIL Expense Monitor ===');

    // 1. Initialize configuration with defaults
    initializeConfig();
    log('✅ Configuration initialized');

    // 2. Validate sheet structure
    const validation = validateSheetStructure();
    if (!validation.valid) {
      throw new Error(`Sheet validation failed: ${validation.errors.join(', ')}`);
    }
    log('✅ Sheet structure validated');

    // 3. Test Telegram bot token
    const botValidation = validateBotToken();
    if (!botValidation.valid) {
      log(`⚠️ Bot token validation failed: ${botValidation.error}`);
      log('Please configure TELEGRAM_BOT_TOKEN in Script Properties');
    } else {
      log(`✅ Bot token validated: ${botValidation.botInfo.username}`);
    }

    // 4. Print configuration (for user to verify)
    debugPrintConfig();

    log('=== Initialization Complete ===');
    log('Next steps:');
    log('1. Set TELEGRAM_BOT_TOKEN in Script Properties');
    log('2. Set TELEGRAM_CHAT_ID in Script Properties');
    log('3. Run testSendAlert() to verify Telegram integration');
    log('4. Run installTriggers() to enable automatic checking');

  } catch (error) {
    logError('Initialization failed', error);
    throw error;
  }
}

/**
 * ====================
 * TRIGGER DEBUG TOOLS
 * ====================
 */

/**
 * Full trigger health check
 * Verifies triggers are configured correctly
 */
function triggerHealthCheck() {
  Logger.log('=== TRIGGER HEALTH CHECK (TGIL) ===');
  Logger.log('');

  const triggers = ScriptApp.getProjectTriggers();
  const count = triggers.length;

  Logger.log(`Total triggers: ${count}`);
  Logger.log('');

  // Count by function
  const checkExpenseCount = triggers.filter(t => t.getHandlerFunction() === 'checkExpensesScheduled').length;
  const dailySummaryCount = triggers.filter(t => t.getHandlerFunction() === 'sendDailySummary').length;
  const otherFunctions = triggers
    .filter(t => t.getHandlerFunction() !== 'checkExpensesScheduled' && t.getHandlerFunction() !== 'sendDailySummary')
    .map(t => t.getHandlerFunction());

  // Report
  Logger.log('Function counts:');
  Logger.log(`  checkExpensesScheduled: ${checkExpenseCount} (expected: 2)`);
  Logger.log(`  sendDailySummary: ${dailySummaryCount} (expected: 1)`);

  if (otherFunctions.length > 0) {
    Logger.log(`  ⚠️ Unexpected functions: ${otherFunctions.join(', ')}`);
  }
  Logger.log('');

  // Check timezone
  const timezone = Session.getScriptTimeZone();
  Logger.log(`Script timezone: ${timezone}`);
  Logger.log('Expected: Asia/Bangkok or Asia/Ho_Chi_Minh (GMT+7)');
  Logger.log('');

  // Overall health
  let health = 'GOOD';
  const issues = [];

  if (count !== 3) {
    health = 'WARNING';
    issues.push(`Expected 3 triggers, found ${count}`);
  }

  if (checkExpenseCount !== 2) {
    health = 'WARNING';
    issues.push(`Expected 2 checkExpensesScheduled triggers, found ${checkExpenseCount}`);
  }

  if (dailySummaryCount !== 1) {
    health = 'WARNING';
    issues.push(`Expected 1 sendDailySummary trigger, found ${dailySummaryCount}`);
  }

  if (otherFunctions.length > 0) {
    health = 'ERROR';
    issues.push(`Found unexpected trigger functions: ${otherFunctions.join(', ')}`);
  }

  if (!timezone.includes('Bangkok') && !timezone.includes('Ho_Chi_Minh') && !timezone.includes('Jakarta')) {
    health = 'WARNING';
    issues.push('Timezone may be incorrect - triggers will run at wrong times');
  }

  Logger.log(`Health Status: ${health}`);
  Logger.log('');

  if (issues.length > 0) {
    Logger.log('Issues found:');
    issues.forEach((issue, i) => {
      Logger.log(`  ${i + 1}. ${issue}`);
    });
    Logger.log('');
    Logger.log('Recommended action:');
    Logger.log('1. Run deleteAllTriggersNuclear()');
    Logger.log('2. Run installTriggers()');
    Logger.log('3. Run triggerHealthCheck() again');
  } else {
    Logger.log('✅ All checks passed!');
    Logger.log('Triggers are configured correctly.');
    Logger.log('');
    Logger.log('Expected schedule:');
    Logger.log('  12:00 - checkExpensesScheduled (alerts)');
    Logger.log('  16:00 - checkExpensesScheduled (alerts)');
    Logger.log('  20:00 - sendDailySummary (daily report)');
  }

  Logger.log('');
  Logger.log('=== END HEALTH CHECK ===');
}

/**
 * Debug: List all triggers with full details
 */
function debugListAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  Logger.log('=== ALL TRIGGERS (TGIL) ===');
  Logger.log(`Total count: ${triggers.length}`);
  Logger.log('');

  if (triggers.length === 0) {
    Logger.log('⚠️ NO TRIGGERS FOUND!');
    Logger.log('Run installTriggers() to create triggers.');
    return 0;
  }

  triggers.forEach((trigger, index) => {
    Logger.log(`Trigger ${index + 1}:`);
    Logger.log(`  Function: ${trigger.getHandlerFunction()}`);
    Logger.log(`  Event Type: ${trigger.getEventType()}`);
    Logger.log(`  Trigger Source: ${trigger.getTriggerSource()}`);
    Logger.log(`  Unique ID: ${trigger.getUniqueId()}`);
    Logger.log('');
  });

  Logger.log('====================');
  return triggers.length;
}

/**
 * Delete ALL triggers (nuclear option)
 * Use this to clean up old triggers before reinstalling
 */
function deleteAllTriggersNuclear() {
  const triggers = ScriptApp.getProjectTriggers();
  const count = triggers.length;

  Logger.log('🔥 DELETING ALL TRIGGERS...');
  Logger.log(`Found ${count} triggers to delete`);
  Logger.log('');

  triggers.forEach((trigger, index) => {
    Logger.log(`Deleting ${index + 1}/${count}: ${trigger.getHandlerFunction()}`);
    ScriptApp.deleteTrigger(trigger);
  });

  Logger.log('');
  Logger.log(`✅ Deleted ${count} triggers`);

  // Verify
  const remaining = ScriptApp.getProjectTriggers().length;
  Logger.log(`Remaining triggers: ${remaining}`);
  Logger.log('');

  if (remaining === 0) {
    Logger.log('✅ All triggers deleted successfully!');
    Logger.log('Next step: Run installTriggers() to create clean triggers');
  } else {
    Logger.log(`⚠️ Warning: Still have ${remaining} triggers remaining!`);
    Logger.log('You may need to delete them manually via UI');
  }

  return remaining;
}
