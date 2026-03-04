/**
 * Alert Service
 * Alert message generation and formatting
 */

/**
 * Generate alert messages from comparison results
 * @param {Object} comparisonResults Results from compareMonthExpenses
 * @returns {Array<string>} Array of formatted alert messages
 */
function generateAlerts(comparisonResults) {
  const messages = [];

  // Combine all alerts (criticals first, then warnings)
  const allAlerts = [
    ...comparisonResults.criticals,
    ...comparisonResults.warnings
  ];

  if (allAlerts.length === 0) {
    log('No alerts to generate');
    return messages;
  }

  // Filter alerts - only keep item-level alerts
  // Exclude: monthly_total, category, and specific sub-categories
  const excludedSubCategories = [
    'giá vốn nguyên vật liệu',
    'chi phí kinh doanh',
    'chi phí vận hành',
    'chi phí khác',
    'chi phí nhân sự',
    'thuế, phí',
    'chi phí đầu tư'
  ];

  const filteredAlerts = allAlerts.filter(alert => {
    // Exclude monthly_total level (DÒNG TIỀN RA)
    if (alert.level === 'monthly_total') {
      return false;
    }

    // Exclude category level (Định phí, Biến phí)
    if (alert.level === 'category') {
      return false;
    }

    // Exclude specific sub-categories
    if (alert.level === 'sub_category') {
      const categoryLower = alert.category.toLowerCase().trim();
      return !excludedSubCategories.some(excluded => categoryLower.includes(excluded));
    }

    // Keep all item-level alerts (tiểu khoản)
    return true;
  });

  if (filteredAlerts.length === 0) {
    log('No item-level alerts after filtering');
    return messages;
  }

  // Prioritize alerts
  const prioritized = prioritizeAlerts(filteredAlerts);

  // Generate ONE combined message instead of multiple separate messages
  const combinedMessage = formatCombinedTelegramAlert(prioritized);
  messages.push(combinedMessage);

  log(`Generated 1 combined alert message with ${prioritized.length} items`);
  return messages;
}

/**
 * Format Telegram alert message
 * @param {Object} alertData Alert data object
 * @returns {string} Formatted Telegram message with Markdown
 */
function formatTelegramAlert(alertData) {
  const {
    month,
    category,
    actual,
    budget,
    percentage,
    overBudget,
    remaining,
    level,
    alertLevel
  } = alertData;

  // Get emoji and status based on level and percentage
  const emoji = getAlertEmoji(level, percentage);
  const status = getAlertStatus(level, percentage);

  // Build message
  let message = `${emoji} *${status}: ${category}*\n\n`;
  message += `*Cơ sở:* Teennie\n`;
  message += `*Tháng:* ${month}/2026\n`;
  message += `*Chi phí thực tế:* ${formatCurrency(actual)}\n`;
  message += `*Ngân sách:* ${formatCurrency(budget)}\n`;
  message += `*Tỷ lệ:* ${formatPercentage(percentage)}\n`;

  // Add over budget or remaining
  if (overBudget > 0) {
    message += `\n*Vượt ngân sách:* ${formatCurrency(overBudget)}`;
  } else {
    message += `\n*Còn lại:* ${formatCurrency(remaining)}`;
  }

  return message;
}

/**
 * Format item-level alert
 * @param {Object} data Alert data
 * @returns {string} Formatted message
 */
function formatItemAlert(data) {
  const emoji = data.percentage >= 100 ? '🔴' : '⚠️';
  const status = data.percentage >= 100 ? 'VƯỢT NGƯỠNG' : 'CẢNH BÁO';

  let message = `${emoji} *${status}: ${data.category}*\n\n`;
  message += `*Tháng:* ${data.month}/2026\n`;
  message += `*Chi phí thực tế:* ${formatCurrency(data.actual)}\n`;
  message += `*Ngân sách:* ${formatCurrency(data.budget)}\n`;
  message += `*Tỷ lệ:* ${formatPercentage(data.percentage)}\n`;

  if (data.overBudget > 0) {
    message += `\n*Vượt ngân sách:* ${formatCurrency(data.overBudget)}\n`;
  } else {
    message += `\n*Còn lại:* ${formatCurrency(data.remaining)}\n`;
  }

  message += `\n${data.category} đã ${data.percentage >= 100 ? 'vượt quá' : 'đạt'} *${formatPercentage(data.percentage)}* ngân sách!`;

  return message;
}

/**
 * Format category-level alert
 * @param {Object} data Alert data
 * @returns {string} Formatted message
 */
function formatCategoryAlert(data) {
  const emoji = data.percentage >= 100 ? '🔴' : '⚠️';
  let message = `${emoji} *VƯỢT NGƯỠNG: ${data.category}*\n\n`;
  message += `*Tháng:* ${data.month}/2026\n`;
  message += `*Tổng chi phí:* ${formatCurrency(data.actual)}\n`;
  message += `*Ngân sách:* ${formatCurrency(data.budget)}\n`;
  message += `*Tỷ lệ:* ${formatPercentage(data.percentage)}\n`;

  if (data.overBudget > 0) {
    message += `\n*Vượt ngân sách:* ${formatCurrency(data.overBudget)}\n`;
  }

  message += `\n*Danh mục ${data.category} đã vượt ngưỡng!*\n`;
  message += `Tổng chi phí tháng ${data.month} đã đạt *${formatPercentage(data.percentage)}* ngân sách.`;

  return message;
}

/**
 * Format monthly total alert
 * @param {Object} data Alert data
 * @returns {string} Formatted message
 */
function formatMonthlyAlert(data) {
  const emoji = data.percentage >= 100 ? '🔴' : '⚠️';
  let message = `${emoji} *CẢNH BÁO NGHIÊM TRỌNG: Tổng chi phí tháng*\n\n`;
  message += `*Tháng:* ${data.month}/2026\n`;
  message += `*Tổng chi thực tế:* ${formatCurrency(data.actual)}\n`;
  message += `*Tổng ngân sách:* ${formatCurrency(data.budget)}\n`;
  message += `*Tỷ lệ:* ${formatPercentage(data.percentage)}\n`;

  if (data.overBudget > 0) {
    message += `\n*Vượt ngân sách:* ${formatCurrency(data.overBudget)}\n`;
  }

  message += `\n*CẢNH BÁO NGHIÊM TRỌNG!*\n`;
  message += `Tổng chi phí tháng ${data.month} đã vượt ngân sách *${formatPercentage(data.percentage - 100)}*!\n`;
  message += `Cần rà soát và điều chỉnh chi tiêu NGAY!`;

  return message;
}

/**
 * Format summary message for multiple alerts
 * @param {Array<Object>} alerts Array of alert objects
 * @param {string} month Month code
 * @returns {string} Summary message
 */
function formatSummaryMessage(alerts, month) {
  if (alerts.length === 0) {
    return `*Tất cả chi phí tháng ${month} đều trong ngân sách*`;
  }

  const summary = getAlertSummary({ warnings: [], criticals: alerts });

  let message = `*BÁO CÁO CHI PHÍ THÁNG ${month}*\n\n`;
  message += `*Tổng số cảnh báo:* ${summary.totalAlerts}\n`;
  message += `*Vượt ngân sách:* ${summary.totalCriticals}\n`;
  message += `*Gần đạt ngưỡng:* ${summary.totalWarnings}\n\n`;

  if (summary.monthlyTotalAlerts > 0) {
    message += `*Tổng chi phí tháng vượt ngân sách!*\n`;
  }

  if (summary.categoryAlerts > 0) {
    message += `*${summary.categoryAlerts} danh mục chi phí vượt ngưỡng*\n`;
  }

  if (summary.itemAlerts > 0) {
    message += `*${summary.itemAlerts} khoản chi vượt ngân sách*\n`;
  }

  if (summary.totalOverBudget > 0) {
    message += `\n*Tổng vượt chi:* ${formatCurrency(summary.totalOverBudget)}`;
  }

  return message;
}

/**
 * Format error notification message
 * @param {Error} error Error object
 * @param {string} context Error context
 * @returns {string} Error message for admin
 */
function formatErrorMessage(error, context = '') {
  let message = `*LỖI HỆ THỐNG - Teennie Expense Monitor*\n\n`;

  if (context) {
    message += `*Ngữ cảnh:* ${context}\n`;
  }

  message += `*Lỗi:* ${error.message}\n`;
  message += `*Thời gian:* ${formatDate(new Date())}\n\n`;
  message += `Vui lòng kiểm tra logs để biết thêm chi tiết.`;

  return message;
}

/**
 * Format test alert message
 * @returns {string} Test message
 */
function formatTestMessage() {
  const testData = {
    month: 'T1',
    category: 'Test Category (Kiểm tra hệ thống)',
    actual: 450000000,
    budget: 400000000,
    percentage: 112.5,
    overBudget: 50000000,
    remaining: 0,
    level: 'item',
    alertLevel: 'critical'
  };

  return formatTelegramAlert(testData);
}

/**
 * Format combined Telegram alert message with ALL alerts in one message
 * Simple format without sections, just numbered list with emoji indicators
 * @param {Array<Object>} alerts Array of alert data objects
 * @returns {string} Single formatted Telegram message with all alerts
 */
function formatCombinedTelegramAlert(alerts) {
  if (alerts.length === 0) {
    return '*Không có cảnh báo nào*';
  }

  // Get month from first alert
  const month = alerts[0].month;

  // Build header
  let message = `*BÁO CÁO CHI PHÍ THÁNG ${month}/2026*\n`;
  message += `*Cơ sở:* Teennie\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;

  // List all alerts with emoji prefix (🔴 for >=100%, ⚠️ for 90-99%)
  alerts.forEach((alert, index) => {
    const emoji = alert.percentage >= 100 ? '🔴' : '⚠️';

    message += `${index + 1}. ${emoji} *${alert.category}*\n`;
    message += `   • Chi phí: ${formatCurrency(alert.actual)}\n`;
    message += `   • Ngân sách: ${formatCurrency(alert.budget)}\n`;
    message += `   • Tỷ lệ: *${formatPercentage(alert.percentage)}*\n`;

    if (alert.percentage >= 100) {
      message += `   • Vượt: *${formatCurrency(alert.overBudget)}*\n`;
    } else {
      message += `   • Còn lại: ${formatCurrency(alert.remaining)}\n`;
    }
  });

  return message;
}

/**
 * Format revenue report message for daily summary at 20:00
 * @param {Object} revenueData Revenue data from getRevenueData()
 * @returns {string} Formatted Telegram message
 */
function formatRevenueReport(revenueData) {
  const { month, total, oldCustomers, newCustomers } = revenueData;

  // Calculate total percentage
  const totalPercentage = total.kpi > 0 ? (total.actual / total.kpi) * 100 : 0;

  // Build message
  let message = `*BÁO CÁO DOANH THU THÁNG ${month}/2026*\n`;
  message += `*Cơ sở:* Teennie\n`;
  message += `${formatDate(new Date())}\n\n`;

  // Total revenue
  message += `*TỔNG DOANH THU*\n`;
  message += `   • KPI: ${formatCurrency(total.kpi)}\n`;
  message += `   • Thực tế: ${formatCurrency(total.actual)}\n`;
  message += `   • Tỷ lệ: ${formatPercentage(totalPercentage)}\n`;

  if (total.actual >= total.kpi) {
    message += `   • Vượt KPI: ✅ ${formatCurrency(total.actual - total.kpi)}\n\n`;
  } else {
    message += `   • Còn lại: ${formatCurrency(total.kpi - total.actual)}\n\n`;
  }

  // Old and new customers (simple format - only actual values)
  message += `*KHÁCH CŨ:* ${formatCurrency(oldCustomers.actual)}\n`;
  message += `*KHÁCH MỚI:* ${formatCurrency(newCustomers.actual)}`;

  return message;
}
