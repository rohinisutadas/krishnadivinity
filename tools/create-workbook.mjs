import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
import {SCHEMA} from '../backend/core.mjs';
const out=new URL('../outputs/registration/',import.meta.url);
await fs.mkdir(out,{recursive:true});
const book=Workbook.create();
for (const [name,headers] of Object.entries(SCHEMA)) {
  const sheet=book.worksheets.add(name);
  const header=sheet.getRangeByIndexes(0,0,1,headers.length);
  header.values=[headers];header.format.fill='#eeeeee';header.format.font={name:'Arial',size:11,bold:true,color:'#111111'};
  header.format.columnWidth=25;header.format.rowHeight=34;header.format.wrapText=true;
  sheet.freezePanes.freezeRows(1);sheet.freezePanes.freezeColumns(1);
}
const guide=book.worksheets.add('Guide');
const rows=[
 ['Topic','Instructions'],
 ['Purpose','Student records and course registrations. No real students or invented batches have been added.'],
 ['Required details','Name, WhatsApp number with country code, email and city. Date of birth is optional.'],
 ['Student identity','Same name, email and phone reuse a student record. A phone alone never merges family members.'],
 ['Course codes','gita = Bhagavad Gita; ai = Practical AI'],
 ['Plan codes','gita-complete = ₹108; ai-live = ₹108; ai-complete = AI Live + Recorded Course, ₹1,080'],
 ['Batches','Add a unique batch_id, course, future start_at, positive capacity and status open to accept registrations.'],
 ['Start time','Enter start_at as ISO text with timezone, such as YYYY-MM-DDTHH:mm:ss+05:30. Do not omit the timezone.'],
 ['Assignment','Earliest future open batch with remaining capacity is selected. No matching batch means waitlisted.'],
 ['Capacity','Pending-payment and confirmed registrations both occupy capacity. Cancelled/refunded records do not.'],
 ['Waiting list','Existing waitlisted students need administrator assignment when new batches are opened. New submissions are assigned automatically.'],
 ['Statuses','Registrations: pending_payment, waitlisted, confirmed, cancelled, refunded, completed. Batches: open or closed.'],
 ['Payments','Reserved for a later verified payment integration. Submitting a form never marks payment successful.'],
 ['AI upgrade','₹972 applies only after verifying the previous ₹108 payment. Upgrade automation is not enabled.'],
 ['Access','WhatsApp and recorded-course access are tracked but are not provisioned automatically yet.'],
 ['Consent','course-updates-v1 covers selected-course updates only; promotional messages are not included.'],
 ['Privacy','Keep this workbook restricted to authorised administrators. Do not publish it or put student records in GitHub.'],
 ['Schema','Keep headers and tab names unchanged. The registration service validates them before writing.'],
 ['Dates','Registration timestamps and birth dates are stored as ISO text by the service to avoid timezone conversion.'],
 ['Duplicates','Retries with the same request ID are safe. A second active registration for the same student/course is not created.']
];
guide.getRange(`A1:B${rows.length}`).values=rows;
guide.getRange(`A1:B${rows.length}`).format.font={name:'Arial',size:11};
guide.getRange('A1:B1').format.fill='#eeeeee';guide.getRange('A1:B1').format.font.bold=true;
guide.getRange(`A1:A${rows.length}`).format.columnWidth=24;
guide.getRange(`B1:B${rows.length}`).format.columnWidth=90;
guide.getRange(`A1:B${rows.length}`).format.wrapText=true;
guide.getRange(`A1:B${rows.length}`).format.rowHeight=44;
book.recalculate();
console.log((await book.inspect({kind:'sheet',include:'id,name',maxChars:1500})).ndjson);
for(const name of [...Object.keys(SCHEMA),'Guide']) {
  const image=await book.render({sheetName:name,range:name==='Guide'?'A1:B8':'A1:F3',scale:1,format:'png'});
  await fs.writeFile(new URL(name+'.png',out),new Uint8Array(await image.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(book)).save(fileURLToPath(new URL('Krishna-Divinity-Registrations.xlsx',out)));
console.log('Workbook exported');
