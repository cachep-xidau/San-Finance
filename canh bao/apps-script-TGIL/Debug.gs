/**
 * Debug Functions
 * Temporary functions to diagnose sheet structure issues
 */

/**
 * Debug: Show actual sheet structure
 */
function debugShowSheetStructure() {
  try {
    Logger.log('=== DEBUGGING SHEET STRUCTURE ===');

    // Check KPI sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const kpiSheet = ss.getSheetByName('KPI');

    if (!kpiSheet) {
      Logger.log('❌ KPI sheet not found!');
      Logger.log('Available sheets:');
      ss.getSheets().forEach(sheet => {
        Logger.log(`  - "${sheet.getName()}"`);
      });
      return;
    }

    Logger.log('✅ KPI sheet found');
    Logger.log(`Rows: ${kpiSheet.getLastRow()}, Columns: ${kpiSheet.getLastColumn()}`);

    // Show row 1 (headers)
    Logger.log('\n=== ROW 1 (Headers) ===');
    const row1 = kpiSheet.getRange('A1:P1').getValues()[0];
    row1.forEach((cell, index) => {
      const col = String.fromCharCode(65 + index); // A, B, C, ...
      Logger.log(`${col}1: "${cell}"`);
    });

    // Show row 2 (month headers)
    Logger.log('\n=== ROW 2 (Month Headers) ===');
    const row2 = kpiSheet.getRange('A2:P2').getValues()[0];
    row2.forEach((cell, index) => {
      const col = String.fromCharCode(65 + index);
      Logger.log(`${col}2: "${cell}"`);
    });

    // Show columns E-P of row 2 specifically (expected month headers)
    Logger.log('\n=== COLUMNS E-P OF ROW 2 (Expected: T1-T12) ===');
    const monthHeaders = kpiSheet.getRange('E2:P2').getValues()[0];
    monthHeaders.forEach((cell, index) => {
      const expectedMonth = 'T' + (index + 1);
      const match = cell && cell.toString().includes(expectedMonth);
      Logger.log(`Column ${String.fromCharCode(69 + index)}: "${cell}" - Expected: ${expectedMonth} - Match: ${match ? '✅' : '❌'}`);
    });

    // Show row 10 (DÒNG TIỀN RA)
    Logger.log('\n=== ROW 10 (Expected: DÒNG TIỀN RA) ===');
    const row10 = kpiSheet.getRange('A10:C10').getValues()[0];
    Logger.log(`A10: "${row10[0]}"`);
    Logger.log(`B10: "${row10[1]}"`);
    Logger.log(`C10: "${row10[2]}"`);

    // Show some data rows
    Logger.log('\n=== ROWS 11-15 (Sample Categories) ===');
    const sampleRows = kpiSheet.getRange('A11:C15').getValues();
    sampleRows.forEach((row, index) => {
      Logger.log(`Row ${11 + index}: Numbering="${row[0]}", Category="${row[1]}", Col C="${row[2]}"`);
    });

    Logger.log('\n=== DIAGNOSIS ===');
    Logger.log('Check the output above to see:');
    Logger.log('1. Are month headers in row 2, columns E-P?');
    Logger.log('2. Do they contain T1, T2, ..., T12?');
    Logger.log('3. Is "DÒNG TIỀN RA" in row 10, column B?');

  } catch (error) {
    Logger.log('❌ Error in debugShowSheetStructure:');
    Logger.log(error.message);
    Logger.log(error.stack);
  }
}

/**
 * Debug: Show what validation is checking
 */
function debugShowValidationLogic() {
  try {
    Logger.log('=== VALIDATION LOGIC ===');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const kpiSheet = ss.getSheetByName('KPI');

    if (!kpiSheet) {
      Logger.log('❌ No KPI sheet');
      return;
    }

    // This is what the validation code checks
    const headers = kpiSheet.getRange('E2:P2').getValues()[0];
    const expectedHeaders = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

    Logger.log('\nValidation checks if each header INCLUDES the expected month code:');

    for (let i = 0; i < expectedHeaders.length; i++) {
      const actualHeader = headers[i] ? headers[i].toString() : '';
      const expected = expectedHeaders[i];
      const cleanedActual = actualHeader.toLowerCase().trim().replace(/\s+/g, ' ');

      const includes = actualHeader.includes(expected);

      Logger.log(`\nColumn ${String.fromCharCode(69 + i)} (${expected}):`);
      Logger.log(`  Actual value: "${actualHeader}"`);
      Logger.log(`  Cleaned: "${cleanedActual}"`);
      Logger.log(`  Includes "${expected}": ${includes ? '✅ YES' : '❌ NO'}`);

      if (!includes) {
        Logger.log(`  ⚠️ VALIDATION WILL FAIL HERE!`);
      }
    }

  } catch (error) {
    Logger.log('❌ Error:');
    Logger.log(error.message);
  }
}

/**
 * Debug: Fix common CSV import issues
 */
function debugFixSheetHeaders() {
  try {
    Logger.log('=== ATTEMPTING TO FIX SHEET HEADERS ===');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const kpiSheet = ss.getSheetByName('KPI');

    if (!kpiSheet) {
      Logger.log('❌ KPI sheet not found');
      return;
    }

    // Check row 2
    const row2 = kpiSheet.getRange('E2:P2').getValues()[0];
    Logger.log('Current row 2 headers (E-P):');
    row2.forEach((cell, i) => {
      Logger.log(`  ${String.fromCharCode(69 + i)}: "${cell}"`);
    });

    // Check if we need to fix
    const needsFix = !row2[0].toString().includes('T1');

    if (needsFix) {
      Logger.log('\n⚠️ Headers need fixing');
      Logger.log('SUGGESTION: Your CSV might have headers like "KẾ HOẠCH" in row 1, and months in row 2');
      Logger.log('The actual month codes (T1, T2, etc.) might be in a different format');
      Logger.log('\nPlease run debugShowSheetStructure() and share the output so I can help fix this.');
    } else {
      Logger.log('\n✅ Headers look OK');
    }

  } catch (error) {
    Logger.log('❌ Error:');
    Logger.log(error.message);
  }
}
