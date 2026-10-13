// Core.gs is generated from backend/core.mjs by npm run build.
function doGet() {
  return output_({ok:false,error:'Use the registration website.'});
}
function output_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var settings = PropertiesService.getScriptProperties();
    var secret = settings.getProperty('REGISTRATION_SECRET');
    var text = e && e.postData && e.postData.contents;
    if (!text || text.length>12000) return output_({ok:false});
    var payload = JSON.parse(text);
    if (!secret || secret.length<32 || payload.secret!==secret) return output_({ok:false});

    if (!lock.tryLock(10000)) return output_({ok:false,error:'busy'});
    var book = SpreadsheetApp.openById(settings.getProperty('SPREADSHEET_ID'));
    var db = {}, ids = {};
    Object.keys(SCHEMA).forEach(function(name) {
      var sheet = book.getSheetByName(name);
      if (!sheet) throw new Error('missing_sheet');
      var values = sheet.getDataRange().getDisplayValues();
      if (JSON.stringify(values[0])!==JSON.stringify(SCHEMA[name])) throw new Error('invalid_headers');
      ids[name]=sheet.getSheetId();
      db[name]=values.slice(1).filter(function(row){return row[0];}).map(function(row) {
        var record={}; SCHEMA[name].forEach(function(key,i){record[key]=row[i] || '';}); return record;
      });
    });

    if (payload.payment) {
      if (!payload.payment.registration_id || !payload.payment.provider_payment_id) return output_({ok:false,error:'invalid_payment'});
      var payMutation = paymentMutation(payload.payment, db, new Date(), function(){ return Utilities.getUuid(); });
      var regRowIdx = -1;
      for (var r = 0; r < db.Registrations.length; r++) {
        if (db.Registrations[r].registration_id === payload.payment.registration_id) {
          regRowIdx = r;
          break;
        }
      }
      if (regRowIdx === -1) throw new Error('registration_not_found');
      var regSheet = book.getSheetByName('Registrations');
      regSheet.getRange(regRowIdx + 2, 9).setValue('confirmed');
      if (payMutation.updateRegistration && payMutation.updateRegistration.recordings_access === 'active') {
        regSheet.getRange(regRowIdx + 2, 11).setValue('active');
      }
      if (payMutation.rows.length) {
        var payRequests = payMutation.rows.map(function(row){
          return {appendCells:{sheetId:ids[row.sheet],rows:[{values:SCHEMA[row.sheet].map(function(key){
            var val = row.record[key];
            return {userEnteredValue:typeof val==='number'?{numberValue:val}:{stringValue:String(val == null?'':val)}};
          })}],fields:'userEnteredValue'}};
        });
        Sheets.Spreadsheets.batchUpdate({requests:payRequests}, book.getId());
      }

      // Automatically send confirmation email with batch and contact details
      try {
        var regRecord = db.Registrations[regRowIdx];
        var studentRecord = db.Students.find(function(s){ return s.student_id === regRecord.student_id; });
        var batchRecord = db.Batches.find(function(b){ return b.batch_id === regRecord.batch_id; });
        sendConfirmationEmail_(studentRecord, regRecord, batchRecord, payload.payment);
      } catch (mailErr) {
        console.error('sendConfirmationEmail error: ' + mailErr);
      }

      return output_({ok:true,confirmed:true,paymentReference:payMutation.paymentReference});
    }

    var validated = validate(Object.assign({},payload.registration,{consent:true}));
    if (Object.keys(validated.errors).length) return output_({ok:false});
    var mutation = registrationMutation(validated.data,db,new Date(),function(){return Utilities.getUuid();});
    if (mutation.rows.length) {
      // One atomic Sheets batch: both student and registration are saved, or neither is.
      // Explicit stringValue prevents formula injection (including names beginning '=').
      var requests=mutation.rows.map(function(row){return {appendCells:{sheetId:ids[row.sheet],rows:[{values:SCHEMA[row.sheet].map(function(key){var value=row.record[key]; return {userEnteredValue:typeof value==='number'?{numberValue:value}:{stringValue:String(value == null?'':value)}};})}],fields:'userEnteredValue'}};});
      Sheets.Spreadsheets.batchUpdate({requests:requests},book.getId());
    }
    return output_({ok:true,receipt:mutation.receipt});
  } catch (err) {
    return output_({ok:false,error:'storage_unavailable'});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function sendConfirmationEmail_(student, reg, batch, payment) {
  if (typeof MailApp === 'undefined') return;
  if (!student || !student.email) return;

  var planDetails = (typeof PLANS !== 'undefined' && PLANS[reg.plan]) ? PLANS[reg.plan] : {
    name: reg.course === 'gita' ? 'Gita Foundation Course' : 'Practical AI Course',
    price: payment.amount_inr || 108
  };

  var courseName = planDetails.name;
  var studentName = student.full_name || 'Seeker';
  var batchId = reg.batch_id || 'To be allocated';

  var batchTiming = 'To be announced in batch WhatsApp community';
  if (batch && batch.start_at) {
    try {
      var d = new Date(batch.start_at);
      batchTiming = Utilities.formatDate(d, 'Asia/Kolkata', 'EEEE, d MMMM yyyy, hh:mm a') + ' IST';
    } catch (e) {
      batchTiming = batch.start_at;
    }
  }

  var instructor = (batch && batch.instructor) ? batch.instructor : 'Rohini Suta Dasa';
  var schedule = (batch && batch.schedule) ? batch.schedule : 'Live Interactive Online Sessions';
  var amountPaid = payment.amount_inr || planDetails.price || 108;
  var paymentId = payment.provider_payment_id || '';
  var regRef = reg.registration_id || '';
  var waGroupLink = 'https://chat.whatsapp.com/HS3jV1CPnwZ8O8yuKcmyR7';
  var supportNo = '+917356052212';
  var waSupportLink = 'https://wa.me/917356052212';

  var subject = '🌸 Enrollment Confirmed: ' + courseName + ' | Krishna Divinity';

  var htmlBody = '<!DOCTYPE html>'
    + '<html>'
    + '<head><meta charset="utf-8"></head>'
    + '<body style="margin:0;padding:20px 0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;line-height:1.6;">'
    + '<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.06);">'
    + '  <div style="background:linear-gradient(135deg,#92400e,#b45309);padding:26px 20px;text-align:center;color:#ffffff;">'
    + '    <h1 style="margin:0;font-size:24px;letter-spacing:1px;font-weight:700;">KRISHNA DIVINITY</h1>'
    + '    <p style="margin:6px 0 0;font-size:14px;opacity:0.92;">Ancient Wisdom &bull; Modern Skills &bull; Meaningful Living</p>'
    + '  </div>'
    + '  <div style="padding:28px 24px;">'
    + '    <p style="font-size:16px;margin-top:0;"><strong>Hare Krishna ' + studentName + ' Ji,</strong></p>'
    + '    <p style="color:#4b5563;font-size:15px;">Your payment has been received successfully! Your seat for <strong>' + courseName + '</strong> is officially confirmed.</p>'
    + '    <div style="background:#fdfaf3;border:1px solid #fde68a;border-radius:8px;padding:18px 20px;margin:22px 0;">'
    + '      <h3 style="margin:0 0 12px;color:#92400e;font-size:16px;border-bottom:1px solid #fef08a;padding-bottom:8px;">📋 Batch & Enrollment Details</h3>'
    + '      <table style="width:100%;border-collapse:collapse;font-size:14px;">'
    + '        <tr><td style="padding:6px 0;color:#6b7280;width:38%;">Course:</td><td style="padding:6px 0;font-weight:600;color:#111827;">' + courseName + '</td></tr>'
    + '        <tr><td style="padding:6px 0;color:#6b7280;">Batch ID:</td><td style="padding:6px 0;font-weight:600;color:#111827;">' + batchId + '</td></tr>'
    + '        <tr><td style="padding:6px 0;color:#6b7280;">Start Date & Time:</td><td style="padding:6px 0;font-weight:600;color:#b45309;">' + batchTiming + '</td></tr>'
    + '        <tr><td style="padding:6px 0;color:#6b7280;">Instructor:</td><td style="padding:6px 0;color:#111827;">' + instructor + '</td></tr>'
    + '        <tr><td style="padding:6px 0;color:#6b7280;">Format:</td><td style="padding:6px 0;color:#111827;">' + schedule + '</td></tr>'
    + '        <tr><td style="padding:6px 0;color:#6b7280;">Amount Paid:</td><td style="padding:6px 0;font-weight:600;color:#166534;">₹' + amountPaid + ' (Confirmed)</td></tr>'
    + '        <tr><td style="padding:6px 0;color:#6b7280;">Payment ID:</td><td style="padding:6px 0;font-family:monospace;color:#4b5563;">' + paymentId + '</td></tr>'
    + '        <tr><td style="padding:6px 0;color:#6b7280;">Registration Ref:</td><td style="padding:6px 0;font-family:monospace;color:#4b5563;">' + regRef + '</td></tr>'
    + '      </table>'
    + '    </div>'
    + '    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">'
    + '      <h3 style="margin:0 0 8px;color:#166534;font-size:16px;">📲 Next Step: Join Your Batch WhatsApp Group</h3>'
    + '      <p style="margin:0 0 16px;font-size:14px;color:#15803d;">Live Zoom class links, session reminders, and lesson notes are shared in the group.</p>'
    + '      <a href="' + waGroupLink + '" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:600;font-size:15px;box-shadow:0 2px 4px rgba(22,163,74,0.3);">💬 Join Batch WhatsApp Community</a>'
    + '    </div>'
    + '    <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:14px;color:#6b7280;">'
    + '      <p style="margin:0 0 8px;"><strong>📞 Need Help or Batch Transfer?</strong></p>'
    + '      <p style="margin:0;">Support Phone / WhatsApp: <a href="' + waSupportLink + '" style="color:#b45309;font-weight:600;text-decoration:none;">' + supportNo + '</a></p>'
    + '    </div>'
    + '    <p style="font-size:13px;color:#9ca3af;margin-top:20px;margin-bottom:0;">Warm regards,<br><strong style="color:#4b5563;">Krishna Divinity Team</strong></p>'
    + '  </div>'
    + '</div>'
    + '</body>'
    + '</html>';

  var plainBody = 'Hare Krishna ' + studentName + ' Ji,\n\n'
    + 'Your payment for ' + courseName + ' has been received and your seat is confirmed.\n\n'
    + '--- BATCH & ENROLLMENT DETAILS ---\n'
    + 'Course: ' + courseName + '\n'
    + 'Batch ID: ' + batchId + '\n'
    + 'Start Date & Time: ' + batchTiming + '\n'
    + 'Instructor: ' + instructor + '\n'
    + 'Amount Paid: ₹' + amountPaid + ' (Confirmed)\n'
    + 'Payment ID: ' + paymentId + '\n'
    + 'Registration Reference: ' + regRef + '\n\n'
    + '--- NEXT STEP: JOIN BATCH WHATSAPP GROUP ---\n'
    + 'Join the batch WhatsApp group for Zoom links and materials:\n'
    + waGroupLink + '\n\n'
    + 'Support Phone / WhatsApp: ' + supportNo + ' (' + waSupportLink + ')\n\n'
    + 'Warm regards,\nKrishna Divinity Team';

  MailApp.sendEmail({
    to: student.email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: 'Krishna Divinity'
  });
}

