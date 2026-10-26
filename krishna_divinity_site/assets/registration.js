// Krishna Divinity - Course Registration & Direct Checkout Controller
// Connects directly to Google Apps Script and Razorpay (100% serverless, zero external credits)

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzA5GyE3s-HK_ldFupRddNYzQNgrboYb4L_EVBwN-c1KB6yMoMGblVyCF2k221aWv2-Hg/exec';
const REGISTRATION_SECRET = 'Kd_RegSecret_2026_9x8f7a6b5c4d3e2f1';
const RAZORPAY_KEY_ID = 'rzp_live_TqtLjeTj9XYzsx';

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

// Map plans for Google Sheets Core schema compatibility
const scriptPlanMap = {
  'gita-lifetime': 'gita-complete',
  'ai-3m': 'ai-live',
  'ai-lifetime': 'ai-complete'
};

let busy = false;
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

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  errorBox.hidden = true;
  form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  
  if (!form.reportValidity()) return;

  const input = Object.fromEntries(new FormData(form));
  input.consent = document.querySelector('#consent').checked;
  input.request_id = requestId;
  input.source = (params.get('source') || 'website').slice(0, 80);

  // Client-side phone format validation (+country code required)
  const phoneVal = (input.whatsapp || '').trim().replace(/\s+/g, '');
  if (!/^\+\d{8,15}$/.test(phoneVal)) {
    showErrors('Please include your country code with your WhatsApp number (e.g. +91 98765 43210).', {
      whatsapp: 'Include country code, e.g. +91 for India'
    });
    return;
  }
  input.whatsapp = phoneVal;

  busy = true;
  button.disabled = true;
  button.textContent = 'Saving enrollment…';

  try {
    const chosenPlan = input.plan || 'gita-lifetime';
    const priceInr = planPrices[chosenPlan] || 108;

    // Direct atomic registration to Google Apps Script (Text/Plain to eliminate CORS preflight)
    const scriptRegistration = {
      ...input,
      plan: scriptPlanMap[chosenPlan] || chosenPlan
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        secret: REGISTRATION_SECRET,
        registration: scriptRegistration
      }),
      redirect: 'follow',
      signal: AbortSignal.timeout(20000)
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('Registration could not be confirmed. Please check your connection and retry.');
    }

    if (!response.ok || !result.ok || !result.receipt?.registrationId) {
      showErrors(result.error || 'We could not save your registration. Please check your details and retry.', result.fields);
      return;
    }

    const receipt = {
      ...result.receipt,
      plan: chosenPlan, // preserve user's friendly plan identifier
      amountDue: priceInr,
      fullName: input.full_name,
      email: input.email,
      whatsapp: input.whatsapp
    };

    try {
      sessionStorage.setItem('kd_receipt', JSON.stringify(receipt));
    } catch {}

    // Open Razorpay Standard Checkout directly
    if (typeof Razorpay !== 'undefined') {
      button.textContent = 'Opening secure payment…';
      
      const rzpOptions = {
        key: RAZORPAY_KEY_ID,
        amount: priceInr * 100, // paise
        currency: 'INR',
        name: 'Krishna Divinity',
        description: descriptions[chosenPlan]?.[0] || 'Course Enrollment',
        image: 'assets/logo.jpg',
        prefill: {
          name: input.full_name || '',
          email: input.email || '',
          contact: input.whatsapp || ''
        },
        notes: {
          registration_id: receipt.registrationId,
          plan: chosenPlan
        },
        theme: { color: '#b45309' },
        modal: {
          ondismiss: function () {
            // Student closed Razorpay; redirect to success page where receipt shows pending payment button
            location.href = 'registration-success.html';
          }
        },
        handler: async function (payResp) {
          button.textContent = 'Confirming enrollment…';
          
          // Send payment confirmation directly to Google Apps Script
          try {
            await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                secret: REGISTRATION_SECRET,
                payment: {
                  registration_id: receipt.registrationId,
                  provider_payment_id: payResp.razorpay_payment_id,
                  amount_inr: priceInr,
                  currency: 'INR',
                  method: 'razorpay',
                  status: 'captured'
                }
              }),
              redirect: 'follow'
            });
          } catch (syncErr) {
            console.warn('Payment recording background sync note:', syncErr);
          }

          // Save student session in localStorage for immediate access to Portal & Classroom
          try {
            const isAi = chosenPlan.startsWith('ai');
            const studentSession = {
              fullName: input.full_name,
              email: input.email,
              whatsapp: input.whatsapp,
              enrolledCourses: [{
                courseId: isAi ? 'ai' : 'gita',
                courseName: isAi ? 'Practical AI Course' : 'Bhagavad Gita Foundation Course',
                plan: chosenPlan,
                validity: chosenPlan === 'ai-3m' ? '3_months' : (chosenPlan === 'ai-1y' ? '1_year' : 'lifetime'),
                validUntil: chosenPlan === 'ai-3m' ? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) : (chosenPlan === 'ai-1y' ? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10) : 'lifetime')
              }]
            };
            localStorage.setItem('kd_student_session', JSON.stringify(studentSession));
            sessionStorage.setItem('kd_receipt', JSON.stringify({
              ...receipt,
              status: 'confirmed',
              paymentId: payResp.razorpay_payment_id
            }));
          } catch {}

          location.href = 'registration-success.html';
        }
      };

      const rzp = new Razorpay(rzpOptions);
      rzp.on('payment.failed', function (resp) {
        showErrors('Payment was not completed: ' + (resp.error?.description || 'Please try another payment method.'));
      });
      rzp.open();
      return;
    }

    // Fallback if Razorpay SDK hasn't loaded yet
    location.href = 'registration-success.html';
  } catch (err) {
    showErrors(err.message || 'We could not confirm the save. Please retry with the same details.');
  } finally {
    busy = false;
    button.disabled = false;
    updateButtonPrice();
  }
});

// Set active status immediately
if (availability) {
  availability.textContent = 'Enrollments are open. Instant access after payment.';
}
if (fields) {
  fields.disabled = false;
}
