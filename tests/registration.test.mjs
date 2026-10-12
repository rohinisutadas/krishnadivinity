import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SCHEMA,validate,registrationMutation,selectBatch} from '../backend/core.mjs';
import {createHandler} from '../netlify/functions/register.mjs';
const now=new Date('2026-10-11T12:00:00Z');
const input={full_name:'Test Student',email:'test@example.com',whatsapp:'+919876543210',city:'Test City',date_of_birth:'',consent:true,plan:'ai-live',request_id:'test-request-123456'};
const empty=()=>Object.fromEntries(Object.keys(SCHEMA).map(name=>[name,[]]));
let sequence=0;const id=()=>String(++sequence);
const save=(mutation,db)=>mutation.rows.forEach(r=>db[r.sheet].push(r.record));
const batch=(overrides={})=>({batch_id:'AI-1',course:'ai',start_at:'2026-11-01T18:00:00+05:30',status:'open',capacity:1,...overrides});
test('required email/city/consent, international phone, DOB calendar validation',()=>{
  assert.deepEqual(validate(input,now).errors,{});
  for(const key of ['email','city','full_name','whatsapp'])assert.ok(validate({...input,[key]:''},now).errors[key]);
  assert.ok(validate({...input,consent:false},now).errors.consent);
  for(const date_of_birth of ['2026-02-30','2027-01-01','bad','1899-01-01'])assert.ok(validate({...input,date_of_birth},now).errors.date_of_birth);
  assert.equal(validate({...input,whatsapp:'+91 98765 43210'},now).data.whatsapp,'+919876543210');
  assert.deepEqual(validate({...input,date_of_birth:'2000-02-29'},now).errors,{});
  assert.ok(validate({...input,plan:'ai-upgrade'},now).errors.plan);
});
test('server owns prices and payment status; no open batch creates a waitlist',()=>{
  const data=validate({...input,amount_due_inr:1,status:'confirmed'},now).data;
  const m=registrationMutation(data,empty(),now,id);
  assert.equal(m.receipt.amountDue,108);assert.equal(m.receipt.status,'waitlisted');
  assert.equal(m.rows.length,2);assert.equal(m.rows[0].record.date_of_birth,'');
});
test('earliest available future batch, capacity, course isolation and malformed dates',()=>{
  const batches=[batch({batch_id:'LATER',start_at:'2026-12-01T18:00:00+05:30'}),batch(),batch({batch_id:'PAST',start_at:'2026-01-01T18:00:00+05:30'}),batch({batch_id:'WRONG',course:'gita'}),batch({batch_id:'CLOSED',status:'closed'}),batch({batch_id:'NO-TZ',start_at:'2026-10-12T18:00:00'})];
  assert.equal(selectBatch(batches,[],'ai',now).batch_id,'AI-1');
  assert.equal(selectBatch(batches,[{batch_id:'AI-1',status:'pending_payment'}],'ai',now).batch_id,'LATER');
  assert.equal(selectBatch(batches,[{batch_id:'AI-1',status:'cancelled'}],'ai',now).batch_id,'AI-1');
  assert.equal(selectBatch([batch({start_at:'2026-11-01T12:00:00.000Z'})],[],'ai',now).batch_id,'AI-1');
});
test('safe retry and repeated signup; one person can join both courses; shared phone is not identity',()=>{
  const db=empty();db.Batches=[batch()];const data=validate(input,now).data;
  const m=registrationMutation(data,db,now,id);save(m,db);
  assert.equal(registrationMutation(data,db,now,id).rows.length,0);
  assert.equal(registrationMutation({...data,request_id:'other-request-1234'},db,now,id).receipt.duplicate,true);
  const changed=registrationMutation({...data,request_id:'new-request-12345',plan:'ai-complete'},db,now,id);
  assert.equal(changed.receipt.planChange,true);assert.equal(changed.rows.length,0);
  const gita=registrationMutation({...data,request_id:'gita-request-12345',plan:'gita-complete'},db,now,id);
  assert.equal(gita.rows.length,1);assert.equal(gita.rows[0].record.student_id,db.Students[0].student_id);
  assert.equal(registrationMutation({...data,request_id:'family-request-123',full_name:'Other Student'},db,now,id).rows.length,2);
  assert.throws(()=>registrationMutation({...data,full_name:'Someone Else'},db,now,id),/request_conflict/);
});
const env={REGISTRATION_ENABLED:'true',GOOGLE_SCRIPT_URL:'https://script.google.com/macros/s/test/exec',REGISTRATION_SECRET:'x'.repeat(40),ALLOWED_ORIGINS:'https://example.com'};
const request=(data=input,origin='https://example.com')=>new Request('https://example.com/api/register',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('endpoint rejects disabled service, foreign origins and invalid input without a Google call',async()=>{
  let calls=0;const fetcher=()=>{calls++;throw Error();};
  assert.equal((await createHandler({env:{},fetcher})(request())).status,403);
  assert.equal((await createHandler({env:{...env,REGISTRATION_ENABLED:'false'},fetcher})(request())).status,503);
  const handler=createHandler({env,fetcher});
  assert.equal((await handler(request(input,'https://evil.example'))).status,403);
  assert.equal((await handler(request({...input,email:''}))).status,400);
  assert.equal((await handler(request({...input,website:'spam'}))).status,400);
  assert.equal(calls,0);
});
test('endpoint confirms only successful storage, and never returns backend errors or secret',async()=>{
  const failed=createHandler({env,fetcher:async()=>new Response(JSON.stringify({ok:false,error:'sensitive'}))});
  const fail=await failed(request());assert.equal(fail.status,502);assert.ok(!(await fail.text()).includes('sensitive'));
  const good=createHandler({env,fetcher:async(url,opts)=>{
    const posted=JSON.parse(opts.body);assert.equal(posted.secret,env.REGISTRATION_SECRET);assert.equal(posted.registration.email,input.email);
    return new Response(JSON.stringify({ok:true,receipt:{registrationId:'REG-test',status:'waitlisted',plan:'ai-live',amountDue:108}}));
  }});
  assert.equal((await good(request())).status,200);
});
test('Apps Script authenticates, locks, and writes both rows in one atomic call with literal cells',()=>{
  let writes=[],locked=false,reads=0;
  const book={getId:()=> 'test-book',getSheetByName:name=>({getSheetId:()=>Object.keys(SCHEMA).indexOf(name),getDataRange:()=>({getDisplayValues:()=>{reads++;return [SCHEMA[name]];}})})};
  const context={Date,JSON,Object,String,Number,Error,console,
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='REGISTRATION_SECRET'?env.REGISTRATION_SECRET:'test-book'})},
    LockService:{getScriptLock:()=>({tryLock:()=>{locked=true;return true;},hasLock:()=>locked,releaseLock:()=>{locked=false;}})},
    SpreadsheetApp:{openById:()=>book},Sheets:{Spreadsheets:{batchUpdate:payload=>writes.push(payload)}},
    Utilities:{getUuid:()=>String(++sequence)},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../google-apps-script/Core.gs',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('../google-apps-script/adapter.gs',import.meta.url),'utf8'),context);
  const invoke=secret=>context.doPost({postData:{contents:JSON.stringify({secret,registration:{...input,full_name:'=IMPORTXML("evil")'}})}});
  assert.equal(invoke('wrong').ok,false);assert.equal(reads,0);
  assert.equal(invoke(env.REGISTRATION_SECRET).ok,true);assert.equal(writes.length,1);assert.equal(writes[0].requests.length,2);
  assert.equal(writes[0].requests[0].appendCells.rows[0].values[1].userEnteredValue.stringValue,'=IMPORTXML("evil")');
  assert.equal(locked,false);
});
