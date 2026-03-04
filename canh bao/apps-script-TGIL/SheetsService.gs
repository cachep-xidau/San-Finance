/**
 * Sheets Service
 * Data extraction from Google Sheets
 */

/**
 * Get the active spreadsheet
 * @returns {Spreadsheet} Active spreadsheet
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Get KPI sheet
 * @returns {Sheet} KPI sheet
 */
function getKPISheet() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('KPI');

  if (!sheet) {
    throw new Error('Sheet "KPI" not found. Please ensure the budget sheet is named "KPI".');
  }

  return sheet;
}

/**
 * Get Report sheet
 * @returns {Sheet} Report_TGIL sheet
 */
function getReportSheet() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Report_TGIL');

  if (!sheet) {
    throw new Error('Sheet "Report_TGIL" not found. Please ensure the actual expense sheet is named "Report_TGIL".');
  }

  return sheet;
}

/**
 * Find column index for a specific month in sheet
 * Auto-detects month column by searching row 2
 * @param {Sheet} sheet Sheet to search
 * @param {string} month Month code (T1, T2, etc.)
 * @returns {number} Column index (0-based) or -1 if not found
 */
function findMonthColumn(sheet, month) {
  try {
    // Read row 2 (where month headers are)
    const lastCol = sheet.getLastColumn();
    const headerRow = sheet.getRange(2, 1, 1, lastCol).getValues()[0];

    // Search for month code
    for (let i = 0; i < headerRow.length; i++) {
      const cell = cleanString(headerRow[i]).toLowerCase().replace(/\s/g, '');
      const target = month.toLowerCase();

      if (cell.includes(target) || cell === target) {
        log(`Found ${month} at column ${i} (${columnToLetter(i)})`);
        return i; // Return 0-based index
      }
    }

    log(`Month ${month} not found in sheet headers`);
    return -1;

  } catch (error) {
    logError(`Error finding month column for ${month}`, error);
    return -1;
  }
}

/**
 * Get KPI data for a specific month
 * @param {string} month Month code (T1, T2, ..., T12)
 * @returns {Array<Object>} Array of budget data objects
 */
function getKPIData(month) {
  try {
    const sheet = getKPISheet();

    // Auto-detect column index by finding T1 in row 2
    const columnIndex = findMonthColumn(sheet, month);

    if (columnIndex === -1) {
      throw new Error(`Month ${month} not found in sheet headers`);
    }

    // Read all data from sheet - extend to column Z to be safe
    const lastCol = Math.max(20, columnIndex + 12); // Ensure we read enough columns
    const range = sheet.getRange(1, 1, 60, lastCol);
    const data = range.getValues();

    // Parse and extract relevant rows
    const parsed = parseSheetData(data, columnIndex, 'KPI');

    log(`Loaded KPI data for ${month}: ${parsed.length} categories`);
    return parsed;

  } catch (error) {
    logError(`Failed to get KPI data for ${month}`, error);
    throw error;
  }
}

/**
 * Get Report data for a specific month
 * @param {string} month Month code (T1, T2, ..., T12)
 * @returns {Array<Object>} Array of actual expense data objects
 */
function getReportData(month) {
  try {
    const sheet = getReportSheet();

    // Auto-detect column index by finding month in row 2
    const columnIndex = findMonthColumn(sheet, month);

    if (columnIndex === -1) {
      throw new Error(`Month ${month} not found in sheet headers`);
    }

    // Read all data from sheet - extend to column Z to be safe
    const lastCol = Math.max(20, columnIndex + 12);
    const range = sheet.getRange(1, 1, 60, lastCol);
    const data = range.getValues();

    // Parse and extract relevant rows
    const parsed = parseSheetData(data, columnIndex, 'Report');

    log(`Loaded Report data for ${month}: ${parsed.length} categories`);
    return parsed;

  } catch (error) {
    logError(`Failed to get Report data for ${month}`, error);
    throw error;
  }
}

/**
 * Parse sheet data and extract expense information
 * @param {Array<Array>} data 2D array of sheet data
 * @param {number} columnIndex Column index for the month (0-based)
 * @param {string} sheetType Type of sheet (KPI or Report)
 * @returns {Array<Object>} Parsed expense data
 */
function parseSheetData(data, columnIndex, sheetType) {
  const parsed = [];

  // Skip header rows (rows 1-2)
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 1; // 1-based for display

    // Parse the row
    const expenseRow = parseExpenseRow(row, rowNumber, columnIndex);

    // Skip invalid rows (empty category or zero amount)
    if (!expenseRow || !expenseRow.category || expenseRow.category === '') {
      continue;
    }

    // Add to parsed data
    parsed.push(expenseRow);
  }

  return parsed;
}

/**
 * Parse a single expense row
 * @param {Array} row Row data array
 * @param {number} rowNumber Row number (1-based)
 * @param {number} columnIndex Column index for amount
 * @returns {Object|null} Parsed expense object or null if invalid
 */
function parseExpenseRow(row, rowNumber, columnIndex) {
  // Extract fields
  const numbering = row[0] ? cleanString(row[0]) : '';
  const category = row[1] ? cleanString(row[1]) : '';
  const amount = parseNumber(row[columnIndex]);

  // Skip empty categories
  if (!category || category === '') {
    return null;
  }

  // Determine expense level
  const level = determineLevel(numbering, category, rowNumber);

  return {
    rowNumber: rowNumber,
    numbering: numbering,
    category: category,
    amount: amount,
    level: level
  };
}

/**
 * Determine expense level (item, category, monthly_total)
 * @param {string} numbering Numbering column value (1, 2, 3, or empty)
 * @param {string} category Category name
 * @param {number} rowNumber Row number (1-based)
 * @returns {string} Level: 'monthly_total', 'category', 'sub_category', or 'item'
 */
function determineLevel(numbering, category, rowNumber) {
  // Normalize category for comparison
  const catLower = category.toLowerCase().trim();

  // Monthly total (row 10)
  if (rowNumber === 10 || catLower.includes('dòng tiền ra') || catLower.includes('tổng kết')) {
    return 'monthly_total';
  }

  // Main categories (no numbering, specific names)
  if (!numbering || numbering === '') {
    if (catLower.includes('định phí') || catLower === 'định phí') {
      return 'category';
    }
    if (catLower.includes('biến phí') || catLower === 'biến phí') {
      return 'category';
    }
    // Sub-categories (no numbering but indented in structure)
    if (catLower.includes('giá vốn') ||
        catLower.includes('chi phí kinh doanh') ||
        catLower.includes('chi phí vận hành') ||
        catLower.includes('chi phí khác') ||
        catLower.includes('chi phí nhân sự') ||
        catLower.includes('thuế') ||
        catLower.includes('chi phí đầu tư')) {
      return 'sub_category';
    }
  }

  // Items (have numbering: 1, 2, 3, etc.)
  if (numbering && numbering !== '') {
    return 'item';
  }

  // Default to item
  return 'item';
}

/**
 * Get available months with data in Report sheet
 * @returns {Array<string>} Array of month codes (T1, T2, etc.) that have data
 */
function getAvailableMonths() {
  try {
    const sheet = getReportSheet();

    // Auto-detect where months start by finding T1 in row 2
    const lastCol = sheet.getLastColumn();
    const headerRow = sheet.getRange(2, 1, 1, lastCol).getValues()[0];

    // Find T1 position
    let startCol = -1;
    for (let i = 0; i < headerRow.length; i++) {
      const cell = cleanString(headerRow[i]).toLowerCase().replace(/\s/g, '');
      if (cell.includes('t1')) {
        startCol = i;
        break;
      }
    }

    if (startCol === -1) {
      log('T1 not found in row 2, defaulting to no months');
      return [];
    }

    // Read row 10 starting from T1 position (for 12 months)
    const dataRow = sheet.getRange(10, startCol + 1, 1, 12).getValues()[0];
    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const months = [];

    for (let i = 0; i < Math.min(dataRow.length, 12); i++) {
      const value = parseNumber(dataRow[i]);
      // Month has data if value > 0
      if (value > 0) {
        months.push(monthNames[i]);
      }
    }

    log(`Available months with data: ${months.join(', ')}`);
    return months;

  } catch (error) {
    logError('Failed to get available months', error);
    return [];
  }
}

/**
 * Detect which months have changed since last check
 * Only checks current month to avoid spam from old months
 * @param {Date} lastCheck Last check timestamp
 * @returns {Array<string>} Array of changed month codes
 */
function detectChangedMonths(lastCheck) {
  try {
    const availableMonths = getAvailableMonths();
    const currentMonth = getCurrentMonth();

    log(`Current calendar month: ${currentMonth}`);

    // Only check current month (based on calendar date)
    if (availableMonths.includes(currentMonth)) {
      log(`Current month ${currentMonth} has data - will check it`);
      return [currentMonth];
    }

    // If current month has no data yet, don't check anything
    log(`Current month ${currentMonth} has no data yet - skipping checks`);
    log('This prevents checking old months when new month starts');
    return [];

  } catch (error) {
    logError('Failed to detect changed months', error);
    return [];
  }
}

/**
 * Validate sheet structure
 * Ensures sheets have expected format
 * @returns {Object} Validation result
 */
function validateSheetStructure() {
  const result = {
    valid: true,
    errors: []
  };

  try {
    // Check KPI sheet exists
    const kpiSheet = getKPISheet();
    if (!kpiSheet) {
      result.valid = false;
      result.errors.push('KPI sheet not found');
    }

    // Check Report sheet exists
    const reportSheet = getReportSheet();
    if (!reportSheet) {
      result.valid = false;
      result.errors.push('Report_TGIL sheet not found');
    }

    // Check sheet dimensions
    if (kpiSheet && kpiSheet.getLastRow() < 40) {
      result.valid = false;
      result.errors.push('KPI sheet has insufficient rows (expected 60+)');
    }

    if (reportSheet && reportSheet.getLastRow() < 40) {
      result.valid = false;
      result.errors.push('Report sheet has insufficient rows (expected 60+)');
    }

    // Check month headers exist (row 2, any columns)
    if (kpiSheet) {
      const lastCol = kpiSheet.getLastColumn();
      const headerRow = kpiSheet.getRange(2, 1, 1, lastCol).getValues()[0];
      const expectedMonths = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

      // Check if we can find T1 anywhere in row 2
      let foundT1 = false;
      for (let i = 0; i < headerRow.length; i++) {
        const cell = cleanString(headerRow[i]).toLowerCase().replace(/\s/g, '');
        if (cell.includes('t1')) {
          foundT1 = true;
          log(`Found T1 at column ${columnToLetter(i)} - validation passed`);
          break;
        }
      }

      if (!foundT1) {
        result.valid = false;
        result.errors.push('Missing month headers (T1 not found in row 2)');
      }
    }

    log('Sheet structure validation: ' + (result.valid ? 'PASSED' : 'FAILED'));
    if (!result.valid) {
      log('Validation errors: ' + result.errors.join(', '));
    }

    return result;

  } catch (error) {
    logError('Failed to validate sheet structure', error);
    result.valid = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Get revenue data for a specific month
 * @param {string} month Month code (T1, T2, ..., T12)
 * @returns {Object} Revenue data with breakdown
 */
function getRevenueData(month) {
  try {
    const kpiSheet = getKPISheet();
    const reportSheet = getReportSheet();

    // Find month column
    const columnIndex = findMonthColumn(kpiSheet, month);

    if (columnIndex === -1) {
      throw new Error(`Month ${month} not found in sheet headers`);
    }

    // Read all data to find revenue rows (rows 7, 8, 9)
    const lastCol = Math.max(20, columnIndex + 12);
    const kpiData = kpiSheet.getRange(1, 1, 60, lastCol).getValues();
    const reportData = reportSheet.getRange(1, 1, 60, lastCol).getValues();

    // Extract revenue data (row 7, 8, 9 - but using 0-based index so 6, 7, 8)
    // Row 7 (index 6): Doanh thu (total)
    // Row 8 (index 7): Doanh thu khách Cũ
    // Row 9 (index 8): Doanh thu khách Mới

    const revenueTotal = {
      kpi: parseNumber(kpiData[6][columnIndex]),
      actual: parseNumber(reportData[6][columnIndex])
    };

    const revenueOld = {
      kpi: parseNumber(kpiData[7][columnIndex]),
      actual: parseNumber(reportData[7][columnIndex])
    };

    const revenueNew = {
      kpi: parseNumber(kpiData[8][columnIndex]),
      actual: parseNumber(reportData[8][columnIndex])
    };

    log(`Revenue data for ${month}:`);
    log(`  Total: KPI=${formatCurrency(revenueTotal.kpi)}, Actual=${formatCurrency(revenueTotal.actual)}`);
    log(`  Old customers: KPI=${formatCurrency(revenueOld.kpi)}, Actual=${formatCurrency(revenueOld.actual)}`);
    log(`  New customers: KPI=${formatCurrency(revenueNew.kpi)}, Actual=${formatCurrency(revenueNew.actual)}`);

    return {
      month: month,
      total: revenueTotal,
      oldCustomers: revenueOld,
      newCustomers: revenueNew
    };

  } catch (error) {
    logError(`Failed to get revenue data for ${month}`, error);
    throw error;
  }
}
