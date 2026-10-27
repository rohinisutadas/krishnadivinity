// Krishna Divinity - Course Registration & Dual Payment Controller (Direct UPI + Razorpay)
// 100% Serverless, direct connection to Google Apps Script & UPI Deep Links

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzA5GyE3s-HK_ldFupRddNYzQNgrboYb4L_EVBwN-c1KB6yMoMGblVyCF2k221aWv2-Hg/exec';
const REGISTRATION_SECRET = 'Kd_RegSecret_2026_9x8f7a6b5c4d3e2f1';
const RAZORPAY_KEY_ID = 'rzp_live_TqtLjeTj9XYzsx';

// Merchant UPI Configuration
const UPI_CONFIG = {
  vpa: 'rohinisutadas-2@okhdfcbank',
  name: 'Roshan Verma',
  phone: '7356052212'
};

const form = document.querySelector('#registration-form');
const fields = document.querySelector('#registration-fields');
const availability = document.querySelector('#availability');
const course = document.querySelector('#course');
const plan = document.querySelector('#plan');
const button = document.querySelector('#submit-registration');
const errorBox = document.querySelector('#form-error');

// Modal Elements
const modal = document.querySelector('#payment-choice-modal');
const modalCloseBtn = document.querySelector('#modal-close-btn');
const modalCourseTitle = document.querySelector('#modal-course-title');
const modalAmountDisplay = document.querySelector('#modal-amount-display');
const upiBadgeAmount = document.querySelector('#upi-badge-amount');
const tabBtnUpi = document.querySelector('#tab-btn-upi');
const tabBtnRazorpay = document.querySelector('#tab-btn-razorpay');
const contentTabUpi = document.querySelector('#content-tab-upi');
const contentTabRazorpay = document.querySelector('#content-tab-razorpay');

// UPI Elements
const linkGPay = document.querySelector('#link-gpay');
const linkPhonePe = document.querySelector('#link-phonepe');
const linkPaytm = document.querySelector('#link-paytm');
const linkAnyUpi = document.querySelector('#link-any-upi');
const qrCodeImg = document.querySelector('#qr-code-img');
const copyUpiBtn = document.querySelector('#copy-upi-btn');
const utrInput = document.querySelector('#utr-number-input');
const confirmUpiBtn = document.querySelector('#confirm-upi-payment-btn');
const utrError = document.querySelector('#utr-input-error');
const openRazorpayBtn = document.querySelector('#open-razorpay-btn');

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
  button.textContent = `Pay ₹${price} & Start Learning (UPI / Cards)`;
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

// Current active receipt & input state
let activeReceipt = null;
let activePlan = 'gita-lifetime';
let activePrice = 108;
let activeInput = {};

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
      plan: chosenPlan,
      amountDue: priceInr,
      fullName: input.full_name,
      email: input.email,
      whatsapp: input.whatsapp
    };

    try {
      sessionStorage.setItem('kd_receipt', JSON.stringify(receipt));
    } catch {}

    activeReceipt = receipt;
    activePlan = chosenPlan;
    activePrice = priceInr;
    activeInput = input;

    // Open Dual Payment Choice Modal (Direct UPI + Razorpay)
    openPaymentChoiceModal(receipt, chosenPlan, priceInr);

  } catch (err) {
    showErrors(err.message || 'We could not confirm the save. Please retry with the same details.');
  } finally {
    busy = false;
    button.disabled = false;
    updateButtonPrice();
  }
});

// Setup & Open Dual Payment Modal
function openPaymentChoiceModal(receipt, chosenPlan, priceInr) {
  if (!modal) return;

  const courseTitle = descriptions[chosenPlan]?.[0] || 'Course Enrollment';
  if (modalCourseTitle) modalCourseTitle.textContent = courseTitle;
  if (modalAmountDisplay) modalAmountDisplay.textContent = `₹${priceInr}`;
  if (upiBadgeAmount) upiBadgeAmount.textContent = `₹${priceInr}`;

  // Build standard UPI link
  const noteText = receipt.registrationId.slice(0, 30);
  const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_CONFIG.vpa)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${priceInr}&cu=INR&tn=${encodeURIComponent(noteText)}`;

  // Mobile App Links
  if (linkGPay) linkGPay.href = `tez://upi/pay?pa=${encodeURIComponent(UPI_CONFIG.vpa)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${priceInr}&cu=INR&tn=${encodeURIComponent(noteText)}`;
  if (linkPhonePe) linkPhonePe.href = `phonepe://upi/pay?pa=${encodeURIComponent(UPI_CONFIG.vpa)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${priceInr}&cu=INR&tn=${encodeURIComponent(noteText)}`;
  if (linkPaytm) linkPaytm.href = `paytmmp://pay?pa=${encodeURIComponent(UPI_CONFIG.vpa)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${priceInr}&cu=INR&tn=${encodeURIComponent(noteText)}`;
  if (linkAnyUpi) linkAnyUpi.href = upiUri;

  // Desktop Dynamic QR Code
  if (qrCodeImg) {
    qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiUri)}`;
    qrCodeImg.onerror = () => {
      // Fallback QR service
      qrCodeImg.src = `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(upiUri)}`;
    };
  }

  // Reset tab to Direct UPI
  switchPayTab('upi');
  
  // Clear any previous UTR inputs or errors
  if (utrInput) utrInput.value = '';
  if (utrError) {
    utrError.style.display = 'none';
    utrError.textContent = '';
  }

  // Show modal
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  // If closed without completing, redirect to success/status page where receipt is saved
  location.href = 'registration-success.html';
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closePaymentModal);
}

// Tab Switching
function switchPayTab(tab) {
  if (tab === 'upi') {
    tabBtnUpi?.classList.add('active');
    tabBtnRazorpay?.classList.remove('active');
    if (contentTabUpi) contentTabUpi.hidden = false;
    if (contentTabRazorpay) contentTabRazorpay.hidden = true;
  } else {
    tabBtnRazorpay?.classList.add('active');
    tabBtnUpi?.classList.remove('active');
    if (contentTabRazorpay) contentTabRazorpay.hidden = false;
    if (contentTabUpi) contentTabUpi.hidden = true;
  }
}

if (tabBtnUpi) tabBtnUpi.addEventListener('click', () => switchPayTab('upi'));
if (tabBtnRazorpay) tabBtnRazorpay.addEventListener('click', () => switchPayTab('razorpay'));

// Copy UPI ID helper
if (copyUpiBtn) {
  copyUpiBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(UPI_CONFIG.vpa).then(() => {
      const orig = copyUpiBtn.textContent;
      copyUpiBtn.textContent = 'Copied!';
      setTimeout(() => { copyUpiBtn.textContent = orig; }, 2000);
    }).catch(() => {
      prompt('Copy UPI ID:', UPI_CONFIG.vpa);
    });
  });
}

// Step 2: Confirm Direct UPI by entering 12-digit UTR
if (confirmUpiBtn) {
  confirmUpiBtn.addEventListener('click', async () => {
    const utr = (utrInput?.value || '').trim().replace(/\s+/g, '');
    if (!utr || utr.length < 6) {
      if (utrError) {
        utrError.textContent = 'Please enter the 12-digit UPI Reference / UTR Number from your payment screen.';
        utrError.style.display = 'block';
      }
      utrInput?.focus();
      return;
    }

    if (utrError) utrError.style.display = 'none';
    confirmUpiBtn.disabled = true;
    confirmUpiBtn.textContent = 'Verifying & Unlocking Course…';

    try {
      // Send payment confirmation directly to Google Apps Script
      const payResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          secret: REGISTRATION_SECRET,
          payment: {
            registration_id: activeReceipt.registrationId,
            provider_payment_id: utr,
            amount_inr: activePrice,
            currency: 'INR',
            method: 'direct_upi',
            status: 'captured'
          }
        }),
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });

      // Save student session in localStorage for immediate access to Portal & Classroom
      const isAi = activePlan.startsWith('ai');
      const targetCourse = isAi ? 'ai' : 'gita';
      
      const studentSession = {
        fullName: activeInput.full_name || activeReceipt.fullName || 'Seeker',
        email: activeInput.email || activeReceipt.email || '',
        whatsapp: activeInput.whatsapp || activeReceipt.whatsapp || '',
        enrolledCourses: [{
          courseId: targetCourse,
          courseName: isAi ? 'Practical AI Course' : 'Bhagavad Gita Foundation Course',
          plan: activePlan,
          validity: activePlan === 'ai-3m' ? '3_months' : (activePlan === 'ai-1y' ? '1_year' : 'lifetime'),
          validUntil: activePlan === 'ai-3m' ? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) : (activePlan === 'ai-1y' ? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10) : 'lifetime')
        }]
      };
      
      try {
        localStorage.setItem('kd_student_session', JSON.stringify(studentSession));
        sessionStorage.setItem('kd_receipt', JSON.stringify({
          ...activeReceipt,
          status: 'confirmed',
          paymentId: utr
        }));
      } catch {}

      // Immediately redirect to Classroom so student can watch classes right away!
      location.href = `classroom.html?course=${targetCourse}`;

    } catch (err) {
      if (utrError) {
        utrError.textContent = 'Could not verify right now. Please check your internet connection or retry.';
        utrError.style.display = 'block';
      }
      confirmUpiBtn.disabled = false;
      confirmUpiBtn.textContent = 'Unlock Course →';
    }
  });
}

// Razorpay Gateway Button Click
if (openRazorpayBtn) {
  openRazorpayBtn.addEventListener('click', () => {
    if (typeof Razorpay === 'undefined') {
      alert('Razorpay gateway is still loading. Please try again in a few seconds or use Direct UPI.');
      return;
    }

    const rzpOptions = {
      key: activeReceipt?.keyId || RAZORPAY_KEY_ID,
      amount: activePrice * 100, // paise
      currency: 'INR',
      name: 'Krishna Divinity',
      description: descriptions[activePlan]?.[0] || 'Course Enrollment',
      image: 'assets/logo.jpg',
      ...(activeReceipt?.orderId ? { order_id: activeReceipt.orderId } : {}),
      prefill: {
        name: activeInput.full_name || '',
        email: activeInput.email || '',
        contact: activeInput.whatsapp || ''
      },
      notes: {
        registration_id: activeReceipt?.registrationId,
        plan: activePlan
      },
      theme: { color: '#b45309' },
      handler: async function (payResp) {
        modal.hidden = true;
        button.textContent = 'Unlocking course…';
        
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              secret: REGISTRATION_SECRET,
              payment: {
                registration_id: activeReceipt.registrationId,
                provider_payment_id: payResp.razorpay_payment_id,
                amount_inr: activePrice,
                currency: 'INR',
                method: 'razorpay',
                status: 'captured'
              }
            }),
            redirect: 'follow'
          });
        } catch (syncErr) {
          console.warn('Payment recording note:', syncErr);
        }

        const isAi = activePlan.startsWith('ai');
        const targetCourse = isAi ? 'ai' : 'gita';
        const studentSession = {
          fullName: activeInput.full_name,
          email: activeInput.email,
          whatsapp: activeInput.whatsapp,
          enrolledCourses: [{
            courseId: targetCourse,
            courseName: isAi ? 'Practical AI Course' : 'Bhagavad Gita Foundation Course',
            plan: activePlan,
            validity: activePlan === 'ai-3m' ? '3_months' : (activePlan === 'ai-1y' ? '1_year' : 'lifetime'),
            validUntil: activePlan === 'ai-3m' ? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) : (activePlan === 'ai-1y' ? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10) : 'lifetime')
          }]
        };
        try {
          localStorage.setItem('kd_student_session', JSON.stringify(studentSession));
          sessionStorage.setItem('kd_receipt', JSON.stringify({
            ...activeReceipt,
            status: 'confirmed',
            paymentId: payResp.razorpay_payment_id
          }));
        } catch {}

        // Immediate redirect to Classroom
        location.href = `classroom.html?course=${targetCourse}`;
      }
    };

    const rzp = new Razorpay(rzpOptions);
    rzp.on('payment.failed', function (resp) {
      alert('Payment failed: ' + (resp.error?.description || 'Please try again or use Direct UPI.'));
    });
    rzp.open();
  });
}

// Set active status immediately
if (availability) {
  availability.textContent = 'Enrollments are open. Instant access after payment.';
}
if (fields) {
  fields.disabled = false;
}
