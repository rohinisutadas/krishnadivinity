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
