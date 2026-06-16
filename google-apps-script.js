// ════════════════════════════════════════════════════════
//  MIPL Budget Tracker — Google Apps Script Backend
//  Paste this entire file into your Google Apps Script editor
// ════════════════════════════════════════════════════════

const SHEET_NAME = "BudgetData";

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, 2).setValues([["month_key", "data"]]);
  }
  return sheet;
}

// GET — load data for a given month
function doGet(e) {
  const month = e.parameter.month;
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === month) {
      const result = JSON.parse(data[i][1]);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // No data yet for this month — return empty
  return ContentService
    .createTextOutput(JSON.stringify({}))
    .setMimeType(ContentService.MimeType.JSON);
}

// POST — save data for a given month
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const month = payload.month;
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  // Check if this month already has a row
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === month) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(payload));
      return ContentService
        .createTextOutput(JSON.stringify({ status: "updated" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // New month — append a row
  sheet.appendRow([month, JSON.stringify(payload)]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: "created" }))
    .setMimeType(ContentService.MimeType.JSON);
}
