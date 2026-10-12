let receipt;try {receipt=JSON.parse(sessionStorage.getItem('kd_receipt'));} catch {}
const names={'gita-complete':'Bhagavad Gita Complete Course','ai-live':'AI Live Classes','ai-complete':'AI Live + Recorded Course'};
if(receipt && /^REG-[\w-]+$/.test(receipt.registrationId) && names[receipt.plan]) {
  document.querySelector('#receipt-title').textContent=receipt.demo?'Demo completed':receipt.duplicate?'Registration already received':'Registration received';
  const message=receipt.planChange?'You already have a registration for this course. Your existing option has been kept. Please request a plan change through course support once available.':receipt.status==='waitlisted'?'Your details have been saved to the waiting list. No batch is currently available; you will receive a course update when a batch is arranged.':'Your details have been saved and assigned to the next available batch. Your enrolment is pending payment; class details will be shared separately.';
  document.querySelector('#receipt-message').textContent=(receipt.demo?'This was a local test. No details were sent to Google Sheets. ':'')+message;
  document.querySelector('#receipt-details').hidden=false;
  document.querySelector('#receipt-reference').textContent='Reference: '+receipt.registrationId;
  document.querySelector('#receipt-plan').textContent='Course: '+names[receipt.plan];
}
