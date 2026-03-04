/**
 * Comparison Service
 * Budget vs actual expense comparison logic
 */

/**
 * Compare month expenses against budget
 * @param {string} month Month code (T1, T2, etc.)
 * @returns {Object} Comparison results with warnings and criticals
 */
function compareMonthExpenses(month) {
  try {
    log(`Comparing expenses for ${month}`);

    // Get KPI and Report data
    const kpiData = getKPIData(month);
    const reportData = getReportData(month);

    if (kpiData.length === 0) {
      log(`No KPI data found for ${month}`);
      return { warnings: [], criticals: [] };
    }

    if (reportData.length === 0) {
      log(`No Report data found for ${month}`);
      return { warnings: [], criticals: [] };
    }

    // Get thresholds from config
    const config = getConfig();
    const warningThreshold = config.WARNING_THRESHOLD;
    const criticalThreshold = config.CRITICAL_THRESHOLD;

    const alerts = {
      warnings: [],
      criticals: []
    };

    // Compare each budget item with actual
    kpiData.forEach(budget => {
      // Find matching actual expense
      const actual = findMatchingExpense(reportData, budget);

      if (!actual) {
        // No matching expense found - skip
        return;
      }

      // Check if should compare
      if (!shouldCompare(actual.amount, budget.amount)) {
        return;
      }

      // Calculate percentage
      const percentage = (actual.amount / budget.amount) * 100;

      // Check thresholds
      if (percentage >= criticalThreshold) {
        // Critical alert
        const alertData = buildAlertData(
          month,
          budget.category,
          actual.amount,
          budget.amount,
          percentage,
          budget.level,
          'critical'
        );
        alerts.criticals.push(alertData);

      } else if (percentage >= warningThreshold) {
        // Warning alert
        const alertData = buildAlertData(
          month,
          budget.category,
          actual.amount,
          budget.amount,
          percentage,
          budget.level,
          'warning'
        );
        alerts.warnings.push(alertData);
      }
    });

    log(`Comparison complete: ${alerts.warnings.length} warnings, ${alerts.criticals.length} criticals`);

    return alerts;

  } catch (error) {
    logError(`Failed to compare expenses for ${month}`, error);
    throw error;
  }
}

/**
 * Find matching expense in report data
 * @param {Array<Object>} reportData Report data array
 * @param {Object} budgetItem Budget item to match
 * @returns {Object|null} Matching expense or null
 */
function findMatchingExpense(reportData, budgetItem) {
  // Try exact match by category name
  for (let i = 0; i < reportData.length; i++) {
    if (categoriesMatch(reportData[i].category, budgetItem.category)) {
      return reportData[i];
    }
  }

  // Try match by row number (fallback)
  for (let i = 0; i < reportData.length; i++) {
    if (reportData[i].rowNumber === budgetItem.rowNumber) {
      return reportData[i];
    }
  }

  return null;
}

/**
 * Check if should compare (skip zero values)
 * @param {number} actual Actual expense amount
 * @param {number} budget Budget amount
 * @returns {boolean} True if should compare
 */
function shouldCompare(actual, budget) {
  // Skip if both are zero
  if (actual === 0 && budget === 0) {
    return false;
  }

  // Skip if budget is zero (can't calculate percentage)
  if (budget === 0) {
    return false;
  }

  // Skip if actual is zero (no expense yet)
  if (actual === 0) {
    return false;
  }

  return true;
}

/**
 * Build alert data object
 * @param {string} month Month code
 * @param {string} category Category name
 * @param {number} actual Actual expense amount
 * @param {number} budget Budget amount
 * @param {number} percentage Percentage of budget used
 * @param {string} level Expense level (item/category/monthly_total)
 * @param {string} alertLevel Alert level (warning/critical)
 * @returns {Object} Alert data object
 */
function buildAlertData(month, category, actual, budget, percentage, level, alertLevel) {
  const overBudget = Math.max(0, actual - budget);
  const remaining = Math.max(0, budget - actual);

  return {
    month: month,
    category: category,
    actual: actual,
    budget: budget,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    overBudget: overBudget,
    remaining: remaining,
    level: level,
    alertLevel: alertLevel
  };
}

/**
 * Check threshold for a specific expense
 * @param {number} actual Actual amount
 * @param {number} budget Budget amount
 * @param {number} thresholdPercent Threshold percentage (90, 100, etc.)
 * @returns {Object} Threshold check result
 */
function checkThreshold(actual, budget, thresholdPercent) {
  if (budget === 0) {
    return {
      exceeded: false,
      percentage: 0,
      remaining: 0,
      overBudget: 0
    };
  }

  const percentage = (actual / budget) * 100;
  const exceeded = percentage >= thresholdPercent;
  const remaining = budget - actual;
  const overBudget = Math.max(0, actual - budget);

  return {
    exceeded: exceeded,
    percentage: Math.round(percentage * 10) / 10,
    remaining: remaining,
    overBudget: overBudget,
    alertLevel: percentage >= 100 ? 'critical' : 'warning'
  };
}

/**
 * Filter and prioritize alerts
 * Sorts alerts by priority: monthly_total > category > sub_category > item
 * @param {Array<Object>} alerts Array of alert objects
 * @returns {Array<Object>} Sorted alerts
 */
function prioritizeAlerts(alerts) {
  const levelPriority = {
    'monthly_total': 1,
    'category': 2,
    'sub_category': 3,
    'item': 4
  };

  return alerts.sort((a, b) => {
    // Sort by level priority first
    const aPriority = levelPriority[a.level] || 5;
    const bPriority = levelPriority[b.level] || 5;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Then by percentage (descending)
    return b.percentage - a.percentage;
  });
}

/**
 * Categorize alerts by level
 * @param {Array<Object>} alerts Array of alert objects
 * @returns {Object} Alerts grouped by level
 */
function categorizeAlertsByLevel(alerts) {
  const categorized = {
    monthly_total: [],
    category: [],
    sub_category: [],
    item: []
  };

  alerts.forEach(alert => {
    const level = alert.level || 'item';
    if (categorized[level]) {
      categorized[level].push(alert);
    }
  });

  return categorized;
}

/**
 * Get summary statistics for alerts
 * @param {Object} comparisonResults Comparison results
 * @returns {Object} Summary statistics
 */
function getAlertSummary(comparisonResults) {
  const allAlerts = [
    ...comparisonResults.warnings,
    ...comparisonResults.criticals
  ];

  const byLevel = categorizeAlertsByLevel(allAlerts);

  return {
    totalAlerts: allAlerts.length,
    totalWarnings: comparisonResults.warnings.length,
    totalCriticals: comparisonResults.criticals.length,
    monthlyTotalAlerts: byLevel.monthly_total.length,
    categoryAlerts: byLevel.category.length,
    subCategoryAlerts: byLevel.sub_category.length,
    itemAlerts: byLevel.item.length,
    highestPercentage: allAlerts.length > 0
      ? Math.max(...allAlerts.map(a => a.percentage))
      : 0,
    totalOverBudget: allAlerts.reduce((sum, a) => sum + a.overBudget, 0)
  };
}
