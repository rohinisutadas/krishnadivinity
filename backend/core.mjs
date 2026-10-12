// Shared by the Netlify endpoint, Apps Script bundle and local tests.
export const SCHEMA = {
  Students: ['student_id','full_name','whatsapp','email','city','date_of_birth','consent_at','consent_version','created_at'],
  Registrations: ['registration_id','request_id','student_id','course','plan','batch_id','registered_at','amount_due_inr','status','whatsapp_status','recordings_access','source'],
  Payments: ['payment_reference','registration_id','provider_order_id','provider_payment_id','amount_inr','currency','status','paid_at','refund_amount_inr','refunded_at'],
  Batches: ['batch_id','course','start_at','capacity','status','language','schedule','instructor']
};
export const PLANS = {
  'gita-complete': {course:'gita',name:'Gita Foundation Course',price:108},
  'ai-live': {course:'ai',name:'AI Live Classes',price:108},
  'ai-complete': {course:'ai',name:'AI Live + Recorded Course',price:1080}
};
export function validate(input, now = new Date()) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {errors:{form:'Please enter your registration details.'}};
  const clean = (key, max, required = true) => {
    const value = typeof input[key] === 'string' ? input[key].trim().replace(/[\u0000-\u001f\u007f]/g,'') : '';
    if ((required && !value) || value.length > max) errors[key] = `Please enter a valid ${key.replace(/_/g,' ')}.`;
    return value;
  };
  const data = {full_name:clean('full_name',100),email:clean('email',254).toLowerCase(),city:clean('city',100),date_of_birth:clean('date_of_birth',10,false),plan:clean('plan',30),request_id:clean('request_id',80),source:clean('source',80,false) || 'website'};
  data.whatsapp = clean('whatsapp',30).replace(/[\s()-]/g,'');
  if (!/^\+[1-9]\d{7,14}$/.test(data.whatsapp)) errors.whatsapp = 'Enter a WhatsApp number with country code, such as +919876543210.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!Object.hasOwn(PLANS,data.plan)) errors.plan = 'Choose one of the available course options.';
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(data.request_id)) errors.form = 'Please refresh the page and try again.';
  if (input.consent !== true) errors.consent = 'Please agree to receive updates about your course.';
  if (data.date_of_birth) {
    const date = new Date(data.date_of_birth + 'T00:00:00Z');
    const today = new Date(now.getTime()+19800000).toISOString().slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date_of_birth) || isNaN(date) || date.toISOString().slice(0,10)!==data.date_of_birth || data.date_of_birth>today || data.date_of_birth<'1900-01-01') errors.date_of_birth = 'Enter a valid date of birth that is not in the future.';
  }
  return {data,errors};
}
export function selectBatch(batches, registrations, course, now) {
  return batches.filter(b => {
    const capacity = Number(b.capacity);
    const occupied = registrations.filter(r=>r.batch_id===b.batch_id && !['cancelled','refunded'].includes(r.status)).length;
    return b.batch_id && b.course===course && b.status==='open' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(b.start_at) && Date.parse(b.start_at)>now.getTime() && Number.isInteger(capacity) && capacity>occupied;
  }).sort((a,b)=>Date.parse(a.start_at)-Date.parse(b.start_at) || a.batch_id.localeCompare(b.batch_id))[0];
}
export function registrationMutation(data, db, now, id) {
  const plan = PLANS[data.plan];
  const normalizeName = value => value.trim().replace(/\s+/g,' ').toLowerCase();
  const student = db.Students.find(s=>s.email.toLowerCase()===data.email && s.whatsapp===data.whatsapp && normalizeName(s.full_name)===normalizeName(data.full_name));
  const retry = db.Registrations.find(r=>r.request_id===data.request_id);
  if (retry) {
    if (!student || retry.student_id!==student.student_id || retry.plan!==data.plan) throw new Error('request_conflict');
    return {rows:[],receipt:receiptFor(retry)};
  }
  // Do not silently replace someone's plan or create a second chargeable enrolment.
  const existing = student && db.Registrations.find(r=>r.student_id===student.student_id && r.course===plan.course && !['cancelled','refunded','completed'].includes(r.status));
  if (existing) return {rows:[],receipt:{...receiptFor(existing),duplicate:true,planChange:existing.plan!==data.plan}};
  const timestamp = now.toISOString();
  const person = student || {student_id:'ST-'+id(),full_name:data.full_name,whatsapp:data.whatsapp,email:data.email,city:data.city,date_of_birth:data.date_of_birth,consent_at:timestamp,consent_version:'course-updates-v1',created_at:timestamp};
  const batch = selectBatch(db.Batches,db.Registrations,plan.course,now);
  const registration = {registration_id:'REG-'+id(),request_id:data.request_id,student_id:person.student_id,course:plan.course,plan:data.plan,batch_id:batch?.batch_id || '',registered_at:timestamp,amount_due_inr:plan.price,status:batch?'pending_payment':'waitlisted',whatsapp_status:'not_invited',recordings_access:data.plan==='ai-live'?'not_included':'pending',source:data.source};
  return {rows:[...(student?[]:[{sheet:'Students',record:person}]),{sheet:'Registrations',record:registration}],receipt:receiptFor(registration)};
}
export function receiptFor(r) {
  return {registrationId:r.registration_id,plan:r.plan,status:r.status,amountDue:Number(r.amount_due_inr)};
}
