/**
 * RSVP collector for the Suvodeep & Sanchari wedding site.
 *
 * Paste this whole file into a Google Apps Script project bound to a
 * Google Sheet, then deploy it as a Web App. Full walkthrough: SETUP.md
 *
 * Every RSVP becomes one row in the "RSVPs" tab. Nothing is ever deleted
 * or overwritten, so a guest who replies twice simply leaves two rows —
 * the later one wins.
 */

/* ------------------------------------------------------------------ */
/* Set this to your own address to get an email on every RSVP.         */
/* Leave it as '' to turn notification emails off.                     */
var NOTIFY_EMAIL = '';
/* ------------------------------------------------------------------ */

var SHEET_NAME = 'RSVPs';

var COLUMNS = [
  'Timestamp', 'Name', 'Email', 'Attending',
  'Phone', 'Dietary', 'Song request', 'Message', 'User agent'
];

/**
 * Receives the RSVP form POST.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    // Serialise writes so two guests submitting at once can't clobber a row.
    lock.waitLock(20000);

    var data = JSON.parse(e.postData.contents);

    // Honeypot: bots fill every field they find, humans never see this one.
    if (data.website) {
      return json({ ok: true });
    }

    if (!data.name || !data.email) {
      return json({ ok: false, error: 'Name and email are required.' });
    }

    var sheet = getSheet();

    sheet.appendRow([
      new Date(),
      data.name       || '',
      data.email      || '',
      data.attending  || '',
      data.phone      || '',
      data.dietary    || '',
      data.song       || '',
      data.message    || '',
      data.userAgent  || ''
    ]);

    notify(data);

    return json({ ok: true });

  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) });

  } finally {
    lock.releaseLock();
  }
}

/**
 * Visiting the /exec URL in a browser hits this — handy for checking the
 * deployment is live before you trust it with real replies.
 */
function doGet() {
  return json({ ok: true, status: 'RSVP endpoint is live.' });
}

/* ----------------------------- helpers ----------------------------- */

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // First run: lay down the header row and freeze it.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length)
         .setFontWeight('bold')
         .setBackground('#0e2342')
         .setFontColor('#f6e2a0');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
  }

  return sheet;
}

function notify(data) {
  if (!NOTIFY_EMAIL) return;

  try {
    var coming = String(data.attending || '').indexOf('Joyfully') === 0;
    var subject = (coming ? '🎉 RSVP: ' : '💔 Regrets: ') + data.name;

    var body =
      'Name: '        + (data.name || '')       + '\n' +
      'Email: '       + (data.email || '')      + '\n' +
      'Attending: '   + (data.attending || '')  + '\n' +
      'Phone: '       + (data.phone || '')      + '\n' +
      'Dietary: '     + (data.dietary || '')    + '\n' +
      'Song: '        + (data.song || '')       + '\n' +
      'Message: '     + (data.message || '')    + '\n';

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (err) {
    // A failed notification must never cost us the RSVP itself.
    console.error('Notification failed: ' + err);
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
