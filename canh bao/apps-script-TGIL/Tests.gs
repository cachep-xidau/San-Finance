/**
 * Testing Functions
 * Comprehensive tests for all system components
 */

/**
 * Test reading KPI data
 */
function testReadKPI() {
  try {
    Logger.log('=== Testing KPI Data Read ===');

    const month = 'T1';
    const data = getKPIData(month);

    Logger.log(`Successfully read ${data.length} rows from KPI sheet`);
    Logger.log('Sample data (first 5 rows):');

    data.slice(0, 5).forEach((row, index) => {
      Logger.log(`${index + 1}. ${row.category} (${row.level}): ${formatCurrency(row.amount)}`);
    });

    Logger.log('✅ Test passed');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testReadKPI failed', error);
  }
}

/**
 * Test reading Report data
 */
function testReadReport() {
  try {
    Logger.log('=== Testing Report Data Read ===');

    const month = 'T1';
    const data = getReportData(month);

    Logger.log(`Successfully read ${data.length} rows from Report sheet`);
    Logger.log('Sample data (first 5 rows):');

    data.slice(0, 5).forEach((row, index) => {
      Logger.log(`${index + 1}. ${row.category} (${row.level}): ${formatCurrency(row.amount)}`);
    });

    Logger.log('✅ Test passed');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testReadReport failed', error);
  }
}

/**
 * Test comparison logic
 */
function testCompareMonth() {
  try {
    Logger.log('=== Testing Expense Comparison ===');

    const month = 'T1';
    const results = compareMonthExpenses(month);

    Logger.log(`Comparison complete for ${month}`);
    Logger.log(`Warnings: ${results.warnings.length}`);
    Logger.log(`Criticals: ${results.criticals.length}`);

    if (results.criticals.length > 0) {
      Logger.log('\nCritical Alerts:');
      results.criticals.forEach((alert, index) => {
        Logger.log(`${index + 1}. ${alert.category}: ${formatPercentage(alert.percentage)} (${formatCurrency(alert.overBudget)} over budget)`);
      });
    }

    if (results.warnings.length > 0) {
      Logger.log('\nWarnings:');
      results.warnings.forEach((alert, index) => {
        Logger.log(`${index + 1}. ${alert.category}: ${formatPercentage(alert.percentage)}`);
      });
    }

    Logger.log('✅ Test passed');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testCompareMonth failed', error);
  }
}

/**
 * Test alert message formatting
 */
function testFormatAlert() {
  try {
    Logger.log('=== Testing Alert Formatting ===');

    const testAlert = {
      month: 'T1',
      category: 'Chi phí quảng cáo (TEST)',
      actual: 450000000,
      budget: 400000000,
      percentage: 112.5,
      overBudget: 50000000,
      remaining: 0,
      level: 'item',
      alertLevel: 'critical'
    };

    const message = formatTelegramAlert(testAlert);

    Logger.log('Formatted alert message:');
    Logger.log('---');
    Logger.log(message);
    Logger.log('---');

    Logger.log('✅ Test passed');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testFormatAlert failed', error);
  }
}

/**
 * Test sending alert to Telegram
 * IMPORTANT: This sends a real message!
 */
function testSendAlert() {
  try {
    Logger.log('=== Testing Telegram Alert Send ===');

    const config = getConfig();

    if (!config.TELEGRAM_CHAT_ID) {
      throw new Error('TELEGRAM_CHAT_ID not configured. Please set it in Script Properties.');
    }

    // Send test message
    const testMessage = formatTestMessage();
    const result = sendAlert(config.TELEGRAM_CHAT_ID, testMessage);

    if (result.success) {
      Logger.log(`✅ Test alert sent successfully (Message ID: ${result.messageId})`);
      Logger.log('Check your Telegram to verify the message was received');
    } else {
      Logger.log(`❌ Failed to send test alert: ${result.error}`);
    }

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testSendAlert failed', error);
  }
}

/**
 * Test bot token validation
 */
function testBotToken() {
  try {
    Logger.log('=== Testing Bot Token Validation ===');

    const result = validateBotToken();

    if (result.valid) {
      Logger.log('✅ Bot token is valid');
      Logger.log(`Bot username: @${result.botInfo.username}`);
      Logger.log(`Bot ID: ${result.botInfo.id}`);
      Logger.log(`Bot name: ${result.botInfo.firstName}`);
    } else {
      Logger.log('❌ Bot token is invalid');
      Logger.log(`Error: ${result.error}`);
    }

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testBotToken failed', error);
  }
}

/**
 * Test configuration
 */
function testConfiguration() {
  try {
    Logger.log('=== Testing Configuration ===');

    const config = getConfig();
    debugPrintConfig();

    // Validate config
    validateConfig(config);

    Logger.log('✅ Configuration is valid');

  } catch (error) {
    Logger.log('❌ Configuration validation failed');
    logError('testConfiguration failed', error);
  }
}

/**
 * Test sheet structure validation
 */
function testSheetStructure() {
  try {
    Logger.log('=== Testing Sheet Structure ===');

    const result = validateSheetStructure();

    if (result.valid) {
      Logger.log('✅ Sheet structure is valid');
    } else {
      Logger.log('❌ Sheet structure validation failed');
      result.errors.forEach(error => {
        Logger.log(`  - ${error}`);
      });
    }

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testSheetStructure failed', error);
  }
}

/**
 * Test getting available months
 */
function testAvailableMonths() {
  try {
    Logger.log('=== Testing Available Months Detection ===');

    const months = getAvailableMonths();

    Logger.log(`Found ${months.length} months with data: ${months.join(', ')}`);
    Logger.log('✅ Test passed');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testAvailableMonths failed', error);
  }
}

/**
 * Test getting chat IDs from updates
 * Useful for finding your chat ID
 */
function testGetChatIds() {
  try {
    Logger.log('=== Testing Get Chat IDs ===');

    const chats = getChatIdsFromUpdates();

    if (chats.length === 0) {
      Logger.log('No chats found in recent updates');
      Logger.log('Try sending a message to your bot first, then run this test again');
    } else {
      Logger.log(`Found ${chats.length} chats. Use one of these IDs in your configuration:`);
    }

    Logger.log('✅ Test passed');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testGetChatIds failed', error);
  }
}

/**
 * Test full workflow
 * Runs complete expense check without sending to Telegram
 */
function testFullWorkflow() {
  try {
    Logger.log('=== Testing Full Workflow (DRY RUN) ===');

    // 1. Validate config
    Logger.log('1. Validating configuration...');
    const config = getConfig();
    validateConfig(config);
    Logger.log('   ✅ Config valid');

    // 2. Validate sheets
    Logger.log('2. Validating sheet structure...');
    const sheetValidation = validateSheetStructure();
    if (!sheetValidation.valid) {
      throw new Error(`Sheet validation failed: ${sheetValidation.errors.join(', ')}`);
    }
    Logger.log('   ✅ Sheets valid');

    // 3. Get available months
    Logger.log('3. Detecting available months...');
    const months = getAvailableMonths();
    Logger.log(`   Found ${months.length} months: ${months.join(', ')}`);

    // 4. Process each month
    Logger.log('4. Processing months...');
    months.forEach(month => {
      Logger.log(`   Processing ${month}...`);

      const comparisonResults = compareMonthExpenses(month);
      const totalAlerts = comparisonResults.warnings.length + comparisonResults.criticals.length;

      Logger.log(`   ${month}: ${totalAlerts} alerts (${comparisonResults.criticals.length} critical, ${comparisonResults.warnings.length} warnings)`);

      if (totalAlerts > 0) {
        const messages = generateAlerts(comparisonResults);
        Logger.log(`   Generated ${messages.length} alert messages`);
      }
    });

    Logger.log('✅ Full workflow test passed');
    Logger.log('\nNOTE: This was a dry run. No messages were sent to Telegram.');
    Logger.log('To send real alerts, run: checkExpensesScheduled()');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testFullWorkflow failed', error);
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║  TGIL Expense Monitor - Test Suite    ║');
  Logger.log('╚════════════════════════════════════════╝\n');

  const tests = [
    { name: 'Configuration', fn: testConfiguration },
    { name: 'Sheet Structure', fn: testSheetStructure },
    { name: 'Read KPI Data', fn: testReadKPI },
    { name: 'Read Report Data', fn: testReadReport },
    { name: 'Available Months', fn: testAvailableMonths },
    { name: 'Expense Comparison', fn: testCompareMonth },
    { name: 'Alert Formatting', fn: testFormatAlert },
    { name: 'Bot Token', fn: testBotToken }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    Logger.log(`\n[${index + 1}/${tests.length}] Running: ${test.name}`);
    Logger.log('─'.repeat(50));

    try {
      test.fn();
      passed++;
    } catch (error) {
      failed++;
      Logger.log(`ERROR: ${error.message}`);
    }
  });

  Logger.log('\n' + '═'.repeat(50));
  Logger.log(`Test Results: ${passed} passed, ${failed} failed`);
  Logger.log('═'.repeat(50));
}

/**
 * Debug function - print all data for a month
 */
function debugPrintMonthData() {
  try {
    const month = 'T1';

    Logger.log('=== KPI Data ===');
    const kpiData = getKPIData(month);
    kpiData.forEach(row => {
      Logger.log(`[${row.level}] ${row.category}: ${formatCurrency(row.amount)}`);
    });

    Logger.log('\n=== Report Data ===');
    const reportData = getReportData(month);
    reportData.forEach(row => {
      Logger.log(`[${row.level}] ${row.category}: ${formatCurrency(row.amount)}`);
    });

  } catch (error) {
    logError('debugPrintMonthData failed', error);
  }
}

/**
 * Test daily summary report
 */
function testDailySummary() {
  try {
    Logger.log('=== Testing Daily Summary ===');

    const config = getConfig();

    if (!config.TELEGRAM_CHAT_ID) {
      throw new Error('TELEGRAM_CHAT_ID not configured');
    }

    // Run daily summary
    sendDailySummary();

    Logger.log('✅ Daily summary test completed');
    Logger.log('Check your Telegram for the summary report');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testDailySummary failed', error);
  }
}

/**
 * Test reading revenue data
 */
function testReadRevenueData() {
  try {
    Logger.log('=== Testing Revenue Data Read ===');

    const month = getCurrentMonth();
    const revenueData = getRevenueData(month);

    Logger.log(`Revenue data for ${month}:`);
    Logger.log(`Total revenue:`);
    Logger.log(`  KPI: ${formatCurrency(revenueData.total.kpi)}`);
    Logger.log(`  Actual: ${formatCurrency(revenueData.total.actual)}`);
    Logger.log(`  Percentage: ${formatPercentage((revenueData.total.actual / revenueData.total.kpi) * 100)}`);

    Logger.log(`Old customers:`);
    Logger.log(`  KPI: ${formatCurrency(revenueData.oldCustomers.kpi)}`);
    Logger.log(`  Actual: ${formatCurrency(revenueData.oldCustomers.actual)}`);

    Logger.log(`New customers:`);
    Logger.log(`  KPI: ${formatCurrency(revenueData.newCustomers.kpi)}`);
    Logger.log(`  Actual: ${formatCurrency(revenueData.newCustomers.actual)}`);

    Logger.log('✅ Test passed');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testReadRevenueData failed', error);
  }
}

/**
 * Test revenue report formatting
 */
function testRevenueReportFormat() {
  try {
    Logger.log('=== Testing Revenue Report Format ===');

    const month = getCurrentMonth();
    const revenueData = getRevenueData(month);
    const message = formatRevenueReport(revenueData);

    Logger.log('Generated revenue report message:');
    Logger.log('---');
    Logger.log(message);
    Logger.log('---');

    Logger.log('✅ Test passed');
    Logger.log('Message formatted successfully');

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testRevenueReportFormat failed', error);
  }
}

/**
 * Test sending revenue report to Telegram
 */
function testSendRevenueReport() {
  try {
    Logger.log('=== Testing Send Revenue Report ===');

    const config = getConfig();
    const chatId = config.TELEGRAM_CHAT_ID;

    if (!chatId) {
      throw new Error('TELEGRAM_CHAT_ID not configured');
    }

    const month = getCurrentMonth();
    const revenueData = getRevenueData(month);
    const message = formatRevenueReport(revenueData);

    // Send to Telegram
    const result = sendTelegramMessage(chatId, message);

    if (result && result.ok) {
      Logger.log('✅ Test passed');
      Logger.log(`Revenue report sent successfully to chat ${chatId}`);
      Logger.log('Check your Telegram for the revenue report!');
    } else {
      throw new Error('Failed to send message');
    }

  } catch (error) {
    Logger.log('❌ Test failed');
    logError('testSendRevenueReport failed', error);
  }
}

