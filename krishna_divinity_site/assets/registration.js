const form=document.querySelector('#registration-form');
const fields=document.querySelector('#registration-fields');
const availability=document.querySelector('#availability');
const course=document.querySelector('#course');
const plan=document.querySelector('#plan');
const button=document.querySelector('#submit-registration');
const errorBox=document.querySelector('#form-error');
const descriptions={
  'gita-complete':['Gita Foundation Course — ₹108','Live classes, recorded lessons and learning resources through your student login.'],
  'ai-live':['AI Live Classes — ₹108','10 live modules with practical demonstrations and guided practice. Recorded-course access is not included.'],
  'ai-complete':['AI Live + Recorded Course — ₹1,080','10 live modules plus recorded lessons and learning resources through your personal student login.']
};
let enabled=false, busy=false;
let requestId=crypto.randomUUID();
const params=new URLSearchParams(location.search);
if (params.get('course')==='ai') course.value='ai';
function updatePlans(preferred) {
  plan.replaceChildren();
  const keys=course.value==='ai'?['ai-live','ai-complete']:['gita-complete'];
  keys.forEach(key=>plan.add(new Option(descriptions[key][0],key)));
  if (keys.includes(preferred)) plan.value=preferred;
  document.querySelector('#plan-help').textContent=descriptions[plan.value][1];
}
updatePlans(params.get('plan'));
course.addEventListener('change',()=>updatePlans());
plan.addEventListener('change',()=>document.querySelector('#plan-help').textContent=descriptions[plan.value][1]);
document.querySelector('#date_of_birth').max=new Date(Date.now()+19800000).toISOString().slice(0,10);
function showErrors(message,errors={}) {
  errorBox.textContent=message;errorBox.hidden=false;
  for(const [key,value] of Object.entries(errors)) {
    const element=document.getElementById(key+'-error');
    if(element) {element.textContent=value;document.getElementById(key)?.setAttribute('aria-invalid','true');}
  }
  const invalid=form.querySelector('[aria-invalid="true"]');
  if(invalid) invalid.focus();
}
async function checkAvailability() {
  try {
    const response=await fetch('/api/register',{cache:'no-store'});
    const data=await response.json();
    if(!response.ok || !data.enabled) throw new Error();
    enabled=true;fields.disabled=false;
    availability.textContent=data.demo?'LOCAL DEMO — use invented details only. Nothing is sent to Google Sheets.':'Registrations are open. No payment is collected here.';
    form.dataset.demo=String(!!data.demo);
  } catch {
    availability.textContent='Registrations are not open yet. Please return later.';
    fields.disabled=true;
  }
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!enabled || busy) return;
  errorBox.hidden=true;
  form.querySelectorAll('.field-error').forEach(el=>el.textContent='');
  form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
  if(!form.reportValidity()) return;
  const input=Object.fromEntries(new FormData(form));
  input.consent=document.querySelector('#consent').checked;
  input.request_id=requestId;
  input.source=(params.get('source') || 'website').slice(0,80);
  busy=true;button.disabled=true;button.textContent='Saving registration…';
  try {
    const response=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(20000)});
    let result;try {result=await response.json();} catch {throw new Error('Registration could not be confirmed. Please try again.');}
    if(!response.ok || !result.ok) {showErrors(result.error || 'Please try again.',result.fields);return;}
    const receipt={...result.receipt,demo:form.dataset.demo==='true'};
    try { sessionStorage.setItem('kd_receipt',JSON.stringify(receipt)); } catch {
      availability.textContent=`Registration saved. Reference: ${receipt.registrationId}. No payment was collected.`;
      form.reset();enabled=false;fields.disabled=true;return;
    }
    location.href='registration-success.html';
  } catch {
    showErrors('We could not confirm the save. Please retry with the same details. Your request reference is kept for this page so retries do not create duplicate registrations.');
  } finally {busy=false;button.disabled=false;button.textContent='Submit registration';}
});
checkAvailability();
