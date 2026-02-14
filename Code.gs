// ============================================================
// WorkerSync — Google Apps Script Backend
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('WorkerSync')
    .addItem('Open Sidebar', 'showSidebar')
    .addSeparator()
    .addItem('Initialize Sheets', 'initializeAllSheets')
    .addToUi();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('page')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('WorkerSync');
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('WorkerSync');
  SpreadsheetApp.getUi().showSidebar(html);
}

function getWebAppUrl() {
  try { return ScriptApp.getService().getUrl(); }
  catch(e) { return ''; }
}

// ============================================================
// Sheet Initialization
// ============================================================

function initializeAllSheets() {
  const ss = SpreadsheetApp.getActive();

  const defs = {
    'Workers':        ['Name', 'Pay Rate', 'Date Added'],
    'Attendance':     ['Date', 'Worker Name', 'Days', 'Pay Rate'],
    'Reports':        ['Worker Name', 'Total Days', 'Total Pay'],
    'DeletedWorkers': ['Name', 'Pay Rate', 'Date Deleted'],
    'Config':         ['Key', 'Value']
  };

  Object.entries(defs).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
  });

  const config = ss.getSheetByName('Config');
  if (config.getLastRow() <= 1) {
    [
      ['Currency Symbol', '₹'],
      ['App Name',        'WorkerSync'],
      ['Company Name',    '']
    ].forEach(r => config.appendRow(r));
  }

  return 'Sheets initialized.';
}

function ensureAttendanceHeader_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Attendance');
  if (sheet && sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Worker Name', 'Days', 'Pay Rate']);
  }
}

// ============================================================
// Config
// ============================================================

function getConfig() {
  const cs = SpreadsheetApp.getActive().getSheetByName('Config');
  if (!cs || cs.getLastRow() < 2) {
    return { currencySymbol: '₹', appName: 'WorkerSync', companyName: '' };
  }
  const map = {};
  cs.getDataRange().getValues().slice(1).forEach(row => {
    if (row[0]) map[row[0]] = row[1];
  });
  return {
    currencySymbol: map['Currency Symbol'] || '₹',
    appName:        map['App Name']        || 'WorkerSync',
    companyName:    map['Company Name']    || ''
  };
}

// ============================================================
// Workers
// ============================================================

function addOrUpdateWorker(name, payRate) {
  const n = (name || '').trim();
  if (!n) throw new Error('Worker name is required.');
  const r = parseFloat(payRate);
  if (isNaN(r) || r < 0) throw new Error('Pay rate must be a non-negative number.');

  const sheet = SpreadsheetApp.getActive().getSheetByName('Workers');
  const data  = sheet.getDataRange().getValues();
  const rowIdx = data.findIndex(row => row[0] === n) + 1;

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 2).setValue(r);
  } else {
    sheet.appendRow([n, r, new Date()]);
  }
}

function editWorker(originalName, newName, newPayRate) {
  const n = (newName || '').trim();
  if (!n) throw new Error('Worker name is required.');
  const r = parseFloat(newPayRate);
  if (isNaN(r) || r < 0) throw new Error('Pay rate must be a non-negative number.');

  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName('Workers');
  const wd = ws.getDataRange().getValues();
  const ri = wd.findIndex(row => row[0] === originalName) + 1;

  if (ri > 0) {
    ws.getRange(ri, 1).setValue(n);
    ws.getRange(ri, 2).setValue(r);
    if (originalName !== n) {
      const ds = ss.getSheetByName('DeletedWorkers');
      if (ds) {
        const dd = ds.getDataRange().getValues();
        const di = dd.findIndex(row => row[0] === originalName) + 1;
        if (di > 0) {
          ds.getRange(di, 1).setValue(n);
          ds.getRange(di, 2).setValue(r);
        }
      }
    }
    return true;
  }
  return false;
}

function getWorkers() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Workers');
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1);
}

function getWorkerNames() {
  return getWorkers().map(w => w[0]);
}

function deleteWorker(name) {
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName('Workers');
  const wd = ws.getDataRange().getValues();
  const ri = wd.findIndex(r => r[0] === name) + 1;

  if (ri > 0) {
    const pay = wd[ri - 1][1];
    let ds = ss.getSheetByName('DeletedWorkers');
    if (!ds) {
      ds = ss.insertSheet('DeletedWorkers');
      ds.appendRow(['Name', 'Pay Rate', 'Date Deleted']);
    }
    ds.appendRow([name, pay, new Date()]);
    ws.deleteRow(ri);
    return true;
  }
  return false;
}

// ============================================================
// Attendance
// ============================================================

function updateAttendance(date, attendanceData) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Attendance');
  ensureAttendanceHeader_();

  const workers = getWorkers();
  const payMap  = {};
  workers.forEach(w => { payMap[w[0]] = parseFloat(w[1]) || 0; });

  const allData = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [];
  const tz = Session.getScriptTimeZone();

  Object.keys(attendanceData).forEach(worker => {
    const status = attendanceData[worker];
    // FIX #8: skip blank — never default to absent
    if (status === '' || status === null || status === undefined) return;
    const parsed = parseFloat(status);
    if (isNaN(parsed)) return;

    const pay = payMap[worker] || 0;

    // FIX #1: upsert — prevent duplicate rows for same date + worker
    const existIdx = allData.findIndex((row, i) => {
      if (i === 0) return false;
      const rowDate = Utilities.formatDate(new Date(row[0]), tz, 'yyyy-MM-dd');
      return rowDate === date && row[1] === worker;
    });

    if (existIdx > 0) {
      sheet.getRange(existIdx + 1, 3).setValue(parsed);
      sheet.getRange(existIdx + 1, 4).setValue(pay);
    } else {
      sheet.appendRow([new Date(date), worker, parsed, pay]);
    }
  });
}

function getAttendanceRecords(date, workerName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Attendance');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const tz = Session.getScriptTimeZone();

  return sheet.getDataRange().getValues().slice(1)
    .filter(row => {
      if (!row[0]) return false;
      const d = Utilities.formatDate(new Date(row[0]), tz, 'yyyy-MM-dd');
      return (date       ? d === date                                            : true)
          && (workerName ? row[1].toLowerCase().includes(workerName.toLowerCase()) : true);
    })
    .map(row => ({
      date:   Utilities.formatDate(new Date(row[0]), tz, 'yyyy-MM-dd'),
      worker: row[1],
      status: row[2]
    }));
}

// FIX #2: guard uses findIndex with explicit header skip, not rowIndex > 0 shortcut
function updateAttendanceRecord(originalDate, worker, newStatus) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Attendance');
  if (!sheet || sheet.getLastRow() < 2) return false;
  const tz   = Session.getScriptTimeZone();
  const data = sheet.getDataRange().getValues();

  const ri = data.findIndex((row, i) => {
    if (i === 0) return false;
    return Utilities.formatDate(new Date(row[0]), tz, 'yyyy-MM-dd') === originalDate
        && row[1] === worker;
  });

  if (ri > 0) {
    sheet.getRange(ri + 1, 3).setValue(parseFloat(newStatus) || 0);
    return true;
  }
  return false;
}

function deleteAttendanceRecord(date, worker) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Attendance');
  if (!sheet || sheet.getLastRow() < 2) return false;
  const tz   = Session.getScriptTimeZone();
  const data = sheet.getDataRange().getValues();

  const ri = data.findIndex((row, i) => {
    if (i === 0) return false;
    return Utilities.formatDate(new Date(row[0]), tz, 'yyyy-MM-dd') === date
        && row[1] === worker;
  });

  if (ri > 0) {
    sheet.deleteRow(ri + 1);
    return true;
  }
  return false;
}

// ============================================================
// Reports
// ============================================================

function calculateTotalPay(startDate, endDate) {
  try {
    const ss = SpreadsheetApp.getActive();
    const as = ss.getSheetByName('Attendance');
    if (!as || as.getLastRow() < 2) {
      return { reportData: [], attendanceHistory: [], totalAmount: 0 };
    }

    // FIX #5: use string comparison on formatted dates to avoid timezone boundary drift
    const tz = Session.getScriptTimeZone();

    const workers     = getWorkers();
    const activeNames = new Set(workers.map(w => w[0]));
    const payMap      = {};
    workers.forEach(w => { payMap[w[0]] = parseFloat(w[1]) || 0; });

    const delPayMap = {};
    const ds = ss.getSheetByName('DeletedWorkers');
    if (ds && ds.getLastRow() > 1) {
      ds.getDataRange().getValues().slice(1).forEach(r => { delPayMap[r[0]] = parseFloat(r[1]) || 0; });
    }

    const allRows = as.getDataRange().getValues().slice(1);
    const filtered = allRows.filter(row => {
      if (!row[0]) return false;
      const d = Utilities.formatDate(new Date(row[0]), tz, 'yyyy-MM-dd');
      return d >= startDate && d <= endDate;
    });

    const wMap = {};
    filtered.forEach(row => {
      const n = row[1];
      if (!wMap[n]) wMap[n] = [];
      wMap[n].push(row);
    });

    const reportData = Object.entries(wMap).map(([name, rows]) => {
      const days = rows.reduce((s, r) => s + (parseFloat(r[2]) || 0), 0);
      const last = rows[rows.length - 1];
      const rate = (last[3] !== undefined && last[3] !== '')
        ? parseFloat(last[3]) || 0
        : payMap[name] || delPayMap[name] || 0;
      return {
        name: activeNames.has(name) ? name : `${name} (deleted)`,
        days,
        pay: days * rate
      };
    });

    const totalAmount = reportData.reduce((s, r) => s + r.pay, 0);

    const rs = ss.getSheetByName('Reports') || ss.insertSheet('Reports');
    rs.clear();
    rs.appendRow(['Worker Name', 'Total Days', 'Total Pay']);
    reportData.forEach(r => rs.appendRow([r.name, r.days, r.pay]));

    return {
      reportData,
      attendanceHistory: filtered.map(row => ({
        date:   Utilities.formatDate(new Date(row[0]), tz, 'dd-MMM-yyyy'),
        worker: row[1],
        status: row[2]
      })),
      totalAmount
    };

  } catch (err) {
    Logger.log('calculateTotalPay error: ' + err.message);
    return { reportData: [], attendanceHistory: [], totalAmount: 0, error: err.message };
  }
}
