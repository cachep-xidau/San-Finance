/**
 * Alert Service - Combined Version
 * Generate ONE consolidated alert message instead of multiple separate alerts
 */

/**
 * Generate ONE combined alert message from comparison results
 * @param {Object} comparisonResults Results from compareMonthExpenses
 * @returns {Array<string>} Array with single combined message (or empty if no alerts)
 */
function generateCombinedAlert(comparisonResults) {
  const messages = [];

  // Combine all alerts
  const allAlerts = [
    ...comparisonResults.criticals,
    ...comparisonResults.warnings
  ];

  if (allAlerts.length === 0) {
    log('No alerts to generate');
    return messages;
  }

  // Filter alerts - only keep item-level alerts (same as before)
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
    if (alert.level === 'monthly_total') return false;
    if (alert.level === 'category') return false;
    if (alert.level === 'sub_category') {
      const categoryLower = alert.category.toLowerCase().trim();
      return !excludedSubCategories.some(excluded => categoryLower.includes(excluded));
    }
    return true;
  });

  if (filteredAlerts.length === 0) {
    log('No item-level alerts after filtering');
    return messages;
  }

  // Prioritize alerts
  const prioritized = prioritizeAlerts(filteredAlerts);

  // Generate ONE combined message
  const combinedMessage = formatCombinedTelegramAlert(prioritized);
  messages.push(combinedMessage);

  log(`Generated 1 combined alert message with ${prioritized.length} items`);
  return messages;
}

/**
 * Format combined Telegram alert message with ALL alerts in one message
 * @param {Array<Object>} alerts Array of alert data objects
 * @returns {string} Single formatted Telegram message with all alerts
 */
function formatCombinedTelegramAlert(alerts) {
  if (alerts.length === 0) {
    return '*Không có cảnh báo nào*';
  }

  // Get month from first alert
  const month = alerts[0].month;

  // Separate critical and warning alerts
  const criticals = alerts.filter(a => a.percentage >= 100);
  const warnings = alerts.filter(a => a.percentage >= 90 && a.percentage < 100);

  // Build header
  let message = `🚨 *BÁO CÁO CHI PHÍ THÁNG ${month}/2026*\n\n`;
  message += `*Cơ sở:* TGIL\n`;
  message += `*Thời gian:* ${formatDate(new Date())}\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;

  // Summary statistics
  const totalOverBudget = criticals.reduce((sum, a) => sum + (a.overBudget || 0), 0);
  const totalWarningRemaining = warnings.reduce((sum, a) => sum + (a.remaining || 0), 0);

  message += `📊 *TỔNG QUAN:*\n`;
  message += `🔴 Vượt ngân sách: ${criticals.length} khoản\n`;
  message += `⚠️ Cảnh báo (≥90%): ${warnings.length} khoản\n`;
  if (totalOverBudget > 0) {
    message += `💸 Tổng vượt chi: *${formatCurrency(totalOverBudget)}*\n`;
  }
  message += `\n`;

  // Critical alerts section (≥100%)
  if (criticals.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `🔴 *VƯỢT NGÂN SÁCH (${criticals.length})*\n\n`;

    criticals.forEach((alert, index) => {
      message += `${index + 1}. *${alert.category}*\n`;
      message += `   • Chi phí: ${formatCurrency(alert.actual)}\n`;
      message += `   • Ngân sách: ${formatCurrency(alert.budget)}\n`;
      message += `   • Tỷ lệ: *${formatPercentage(alert.percentage)}*\n`;
      message += `   • Vượt: *${formatCurrency(alert.overBudget)}*\n`;
      message += `\n`;
    });
  }

  // Warning alerts section (90-99%)
  if (warnings.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `⚠️ *CẢNH BÁO (${warnings.length})*\n\n`;

    warnings.forEach((alert, index) => {
      message += `${index + 1}. *${alert.category}*\n`;
      message += `   • Chi phí: ${formatCurrency(alert.actual)}\n`;
      message += `   • Ngân sách: ${formatCurrency(alert.budget)}\n`;
      message += `   • Tỷ lệ: *${formatPercentage(alert.percentage)}*\n`;
      message += `   • Còn lại: ${formatCurrency(alert.remaining)}\n`;
      message += `\n`;
    });
  }

  // Footer with action items
  message += `━━━━━━━━━━━━━━━━━━\n`;

  if (criticals.length > 0) {
    message += `\n⚠️ *HÀNH ĐỘNG CẦN THIẾT:*\n`;
    message += `• Rà soát chi tiêu của ${criticals.length} khoản vượt ngân sách\n`;
    message += `• Xem xét điều chỉnh ngân sách hoặc cắt giảm chi phí\n`;
    message += `• Báo cáo kế toán trưởng ngay\n`;
  }

  if (warnings.length > 0 && criticals.length === 0) {
    message += `\n💡 *KHUYẾN NGHỊ:*\n`;
    message += `• Theo dõi sát sao ${warnings.length} khoản gần đạt ngưỡng\n`;
    message += `• Chuẩn bị điều chỉnh chi tiêu nếu cần\n`;
  }

  return message;
}

/**
 * Format compact version (for very long lists)
 * @param {Array<Object>} alerts Array of alert data objects
 * @returns {string} Compact formatted message
 */
function formatCompactCombinedAlert(alerts) {
  if (alerts.length === 0) {
    return '*Không có cảnh báo nào*';
  }

  const month = alerts[0].month;
  const criticals = alerts.filter(a => a.percentage >= 100);
  const warnings = alerts.filter(a => a.percentage >= 90 && a.percentage < 100);

  let message = `🚨 *CHI PHÍ THÁNG ${month}/2026*\n\n`;

  // Critical items
  if (criticals.length > 0) {
    message += `🔴 *Vượt ngân sách (${criticals.length}):*\n`;
    criticals.forEach((a, i) => {
      message += `${i + 1}. ${a.category}: ${formatPercentage(a.percentage)} (+${formatCurrency(a.overBudget)})\n`;
    });
    message += `\n`;
  }

  // Warning items
  if (warnings.length > 0) {
    message += `⚠️ *Cảnh báo (${warnings.length}):*\n`;
    warnings.forEach((a, i) => {
      message += `${i + 1}. ${a.category}: ${formatPercentage(a.percentage)}\n`;
    });
  }

  return message;
}

/**
 * USAGE EXAMPLE:
 *
 * Replace in Code.gs, function processMonthAlerts():
 *
 * OLD CODE:
 *   const alertMessages = generateAlerts(comparisonResults);
 *
 * NEW CODE:
 *   const alertMessages = generateCombinedAlert(comparisonResults);
 *
 * This will send 1 message instead of 3 separate messages.
 */
