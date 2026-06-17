// ════════════════════════════════════════════════════════
//  MIPL Budget Tracker — Google Apps Script Backend v2
//  DELETE the old code and paste this entire file fresh
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

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// All requests come as GET to avoid CORS/redirect issues
// action=get  → load month data
// action=save → save month data (payload passed as encoded param)
function doGet(e) {
  try {
    const action = e.parameter.action || "get";
    const month  = e.parameter.month;

    if (!month) return buildResponse({ error: "No month provided" });

    const sheet = getOrCreateSheet();
    const rows  = sheet.getDataRange().getValues();

    if (action === "get") {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === month) {
          return buildResponse(JSON.parse(rows[i][1]));
        }
      }
      return buildResponse({});  // No data yet for this month
    }

    if (action === "save") {
      const payload = JSON.parse(decodeURIComponent(e.parameter.payload));

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === month) {
          sheet.getRange(i + 1, 2).setValue(JSON.stringify(payload));
          return buildResponse({ status: "updated" });
        }
      }
      sheet.appendRow([month, JSON.stringify(payload)]);
      return buildResponse({ status: "created" });
    }

    return buildResponse({ error: "Unknown action" });

  } catch (err) {
    return buildResponse({ error: err.toString() });
  }
}
