const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
  ? ''
  : 'https://krishnadivinity.netlify.app';

const form = document.querySelector('#registration-form');
const fields = document.querySelector('#registration-fields');
const availability = document.querySelector('#availability');
const course = document.querySelector('#course');
const plan = document.querySelector('#plan');
const button = document.querySelector('#submit-registration');
const errorBox = document.querySelector('#form-error');

const descriptions = {
  'gita-lifetime': ['Bhagavad Gita Foundation Course — ₹108 (Lifetime Access)', 'Complete course access: live classes, class recordings, and downloadable PDF study notes.'],
  'ai-3m': ['Practical AI Course — ₹108 (3 Months Access)', '10 practical modules, live demonstrations, recordings, and PDF notes with 3 months access.'],
  'ai-1y': ['Practical AI Course — ₹500 (1 Year Access)', '10 practical modules, recordings, and PDF notes with 1 full year access.'],
  'ai-lifetime': ['Practical AI Course — ₹1,080 (Lifetime Access)', 'Complete 10-module AI course with lifetime access, PDF cheatsheets, and all future updates.'],
  // Legacy plan compatibility
  'gita-complete': ['Bhagavad Gita Foundation Course — ₹108 (Lifetime Access)', 'Complete course access with lifetime validity.'],
  'ai-live': ['Practical AI Course — ₹108 (3 Months Access)', '10 live modules with 3 months access.'],
  'ai-complete': ['Practical AI Course — ₹1,080 (Lifetime Access)', '10 live modules with lifetime access.']
};

const planPrices = {
  'gita-lifetime': 108,
  'ai-3m': 108,
  'ai-1y': 500,
  'ai-lifetime': 1080,
  'gita-complete': 108,
  'ai-live': 108,
  'ai-complete': 1080
};

let enabled = false, busy = false;
let requestId = crypto.randomUUID();
const params = new URLSearchParams(location.search);

if (params.get('course') === 'ai') course.value = 'ai';

function updatePlans(preferred) {
  plan.replaceChildren();
  const keys = course.value === 'ai' ? ['ai-3m', 'ai-1y', 'ai-lifetime'] : ['gita-lifetime'];
  keys.forEach(key => plan.add(new Option(descriptions[key][0], key)));
  
  if (preferred && (keys.includes(preferred) || descriptions[preferred])) {
    plan.value = preferred;
  }
  
  updateButtonPrice();
}

function updateButtonPrice() {
  const currentPlan = plan.value;
  const price = planPrices[currentPlan] || 108;
  button.textContent = `Pay ₹${price} & Start Learning (UPI, Cards, NetBanking)`;
  document.querySelector('#plan-help').textContent = descriptions[currentPlan]?.[1] || '';
}

updatePlans(params.get('plan'));
course.addEventListener('change', () => updatePlans());
plan.addEventListener('change', () => updateButtonPrice());

function showErrors(message, errors = {}) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  for (const [key, value] of Object.entries(errors)) {
    const element = document.getElementById(key + '-error');
    if (element) {
      element.textContent = value;
      document.getElementById(key)?.setAttribute('aria-invalid', 'true');
    }
  }
  const invalid = form.querySelector('[aria-invalid="true"]');
  if (invalid) invalid.focus();
}

async function checkAvailability() {
  try {
    const response = await fetch(`${API_BASE}/api/register`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.enabled) throw new Error();
    enabled = true;
    fields.disabled = false;
    availability.textContent = data.demo ? 'LOCAL DEMO MODE — test registrations enabled.' : 'Enrollments are open. Instant access after payment.';
    form.dataset.demo = String(!!data.demo);
  } catch {
    availability.textContent = 'Enrollments are currently updating. Please return shortly.';
    fields.disabled = true;
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!enabled || busy) return;
  errorBox.hidden = true;
  form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  
  if (!form.reportValidity()) return;

  const input = Object.fromEntries(new FormData(form));
  input.consent = document.querySelector('#consent').checked;
  input.request_id = requestId;
  input.source = (params.get('source') || 'website').slice(0, 80);

  busy = true;
  button.disabled = true;
  button.textContent = 'Saving details…';

  try {
    const response = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(20000)
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('Registration could not be confirmed. Please try again.');
    }

    if (!response.ok || !result.ok) {
      showErrors(result.error || 'Please try again.', result.fields);
      return;
    }

    const receipt = {
      ...result.receipt,
      fullName: input.full_name,
      email: input.email,
      whatsapp: input.whatsapp,
      demo: form.dataset.demo === 'true'
    };

    try {
      sessionStorage.setItem('kd_receipt', JSON.stringify(receipt));
    } catch {}

    // Check if we can open Razorpay immediately
    const isDemo = form.dataset.demo === 'true';
    if (!isDemo && typeof Razorpay !== 'undefined') {
      button.textContent = 'Opening secure checkout…';
      try {
        const orderRes = await fetch(`${API_BASE}/api/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: receipt.registrationId, plan: receipt.plan })
        });
        const orderData = await orderRes.json();
        if (orderRes.ok && orderData.ok && orderData.orderId) {
          const rzpOptions = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'Krishna Divinity',
            description: descriptions[receipt.plan]?.[0] || 'Course Enrollment',
            order_id: orderData.orderId,
            prefill: {
              name: receipt.fullName || '',
              email: receipt.email || '',
              contact: receipt.whatsapp || ''
            },
            theme: { color: '#b45309' },
            modal: {
              ondismiss: function () {
                location.href = 'registration-success.html';
              }
            },
            handler: async function (payResp) {
              button.textContent = 'Confirming enrollment…';
              try {
                await fetch(`${API_BASE}/api/verify-payment`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: payResp.razorpay_order_id,
                    razorpay_payment_id: payResp.razorpay_payment_id,
                    razorpay_signature: payResp.razorpay_signature,
                    registrationId: receipt.registrationId,
                    plan: receipt.plan
                  })
                });
              } catch {}

              // Save student session for portal access
              try {
                const isAi = receipt.plan?.startsWith('ai');
                const studentSession = {
                  fullName: receipt.fullName,
                  email: receipt.email,
                  whatsapp: receipt.whatsapp,
                  enrolledCourses: [{
                    courseId: isAi ? 'ai' : 'gita',
                    courseName: isAi ? 'Practical AI Course' : 'Bhagavad Gita Foundation Course',
                    plan: receipt.plan,
                    validity: receipt.validity || 'lifetime',
                    validUntil: receipt.validUntil || (receipt.plan === 'ai-3m' ? new Date(Date.now() + 90*86400000).toISOString().slice(0,10) : (receipt.plan === 'ai-1y' ? new Date(Date.now() + 365*86400000).toISOString().slice(0,10) : 'lifetime'))
                  }]
                };
                localStorage.setItem('kd_student_session', JSON.stringify(studentSession));
                sessionStorage.setItem('kd_receipt', JSON.stringify({ ...receipt, status: 'confirmed', paymentId: payResp.razorpay_payment_id }));
              } catch {}

              location.href = 'registration-success.html';
            }
          };

          const rzp = new Razorpay(rzpOptions);
          rzp.open();
          return;
        }
      } catch (err) {
        console.error('Razorpay checkout open failed:', err);
      }
    }

    // Default redirect to registration-success
    location.href = 'registration-success.html';
  } catch (err) {
    showErrors(err.message || 'We could not confirm the save. Please retry with the same details.');
  } finally {
    busy = false;
    button.disabled = false;
    updateButtonPrice();
  }
});

checkAvailability();
