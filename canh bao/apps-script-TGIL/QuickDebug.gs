/**
 * Quick Debug - Tìm vấn đề tại sao không detect được months
 */

function debugWhyNoMonths() {
  Logger.log('=== DEBUG: Why No Months Detected ===\n');

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Report_TGIL');

    if (!sheet) {
      Logger.log('❌ Report_TGIL sheet not found!');
      return;
    }

    Logger.log('✅ Report_TGIL sheet found');
    Logger.log(`Total rows: ${sheet.getLastRow()}`);
    Logger.log(`Total columns: ${sheet.getLastColumn()}`);

    // Show row 2 (month headers)
    Logger.log('\n=== ROW 2: Month Headers ===');
    const lastCol = sheet.getLastColumn();
    const row2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];

    for (let i = 0; i < row2.length; i++) {
      const col = String.fromCharCode(65 + i); // A, B, C...
      const value = row2[i];
      if (value && value.toString().trim() !== '') {
        Logger.log(`${col}2: "${value}"`);
      }
    }

    // Show row 10 (expected: DÒNG TIỀN RA with totals)
    Logger.log('\n=== ROW 10: Expected Total Expenses ===');
    const row10 = sheet.getRange(10, 1, 1, lastCol).getValues()[0];

    Logger.log(`A10: "${row10[0]}" (numbering)`);
    Logger.log(`B10: "${row10[1]}" (category name)`);
    Logger.log(`C10: "${row10[2]}"`);

    // Show values in month columns
    Logger.log('\n=== ROW 10 VALUES (All Columns) ===');
    for (let i = 0; i < row10.length; i++) {
      const col = String.fromCharCode(65 + i);
      const value = row10[i];
      if (value !== '' && value !== null && value !== undefined) {
        Logger.log(`${col}10: ${value} (type: ${typeof value})`);
      }
    }

    // Try to find T1 position
    Logger.log('\n=== FINDING T1 POSITION ===');
    let t1Col = -1;
    for (let i = 0; i < row2.length; i++) {
      const cell = row2[i] ? row2[i].toString().toLowerCase().replace(/\s/g, '') : '';
      if (cell.includes('t1')) {
        t1Col = i;
        Logger.log(`✅ Found T1 at column ${i} (${String.fromCharCode(65 + i)})`);
        Logger.log(`   Header value: "${row2[i]}"`);
        Logger.log(`   Row 10 value at T1: ${row10[i]}`);
        break;
      }
    }

    if (t1Col === -1) {
      Logger.log('❌ T1 not found in row 2!');
    }

    // Check what getAvailableMonths is actually checking
    Logger.log('\n=== WHAT getAvailableMonths() SEES ===');
    const headerRow = sheet.getRange('E2:P2').getValues()[0];
    const dataRow = sheet.getRange('E10:P10').getValues()[0];

    Logger.log('Headers E2:P2:');
    headerRow.forEach((h, i) => {
      Logger.log(`  ${String.fromCharCode(69 + i)}: "${h}"`);
    });

    Logger.log('\nData E10:P10:');
    dataRow.forEach((d, i) => {
      const parsed = parseNumber(d);
      Logger.log(`  ${String.fromCharCode(69 + i)}: "${d}" → parsed: ${parsed}`);
    });

    // Show row 21 (chi phí quảng cáo)
    Logger.log('\n=== ROW 21: Your Test Data (Chi phí quảng cáo?) ===');
    const row21 = sheet.getRange(21, 1, 1, lastCol).getValues()[0];
    Logger.log(`B21: "${row21[1]}" (category)`);

    if (t1Col !== -1) {
      Logger.log(`T1 column value (row 21): ${row21[t1Col]}`);
    }

    // Show first 10 rows with data
    Logger.log('\n=== FIRST 10 NON-EMPTY ROWS (Category + First Data Column) ===');
    for (let r = 1; r <= Math.min(20, sheet.getLastRow()); r++) {
      const rowData = sheet.getRange(r, 1, 1, Math.min(10, lastCol)).getValues()[0];
      const category = rowData[1]; // Column B

      if (category && category.toString().trim() !== '') {
        Logger.log(`Row ${r}: "${category}"`);
      }
    }

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log(error.stack);
  }
}

/**
 * Debug: Force check T1 with manual data
 */
function debugForceCheckT1() {
  Logger.log('=== FORCE CHECK T1 ===\n');

  try {
    // Try to read T1 data
    const kpiData = getKPIData('T1');
    const reportData = getReportData('T1');

    Logger.log(`KPI data rows: ${kpiData.length}`);
    Logger.log(`Report data rows: ${reportData.length}`);

    // Show first 5 from each
    Logger.log('\n--- KPI Sample ---');
    kpiData.slice(0, 5).forEach(r => {
      Logger.log(`${r.category} (${r.level}): ${formatCurrency(r.amount)}`);
    });

    Logger.log('\n--- Report Sample ---');
    reportData.slice(0, 5).forEach(r => {
      Logger.log(`${r.category} (${r.level}): ${formatCurrency(r.amount)}`);
    });

    // Try comparison
    Logger.log('\n--- Comparison ---');
    const results = compareMonthExpenses('T1');
    Logger.log(`Warnings: ${results.warnings.length}`);
    Logger.log(`Criticals: ${results.criticals.length}`);

    if (results.criticals.length > 0) {
      Logger.log('\nCritical alerts found:');
      results.criticals.forEach(a => {
        Logger.log(`  - ${a.category}: ${formatPercentage(a.percentage)}`);
      });
    }

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log(error.stack);
  }
}
