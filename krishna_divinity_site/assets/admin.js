// Krishna Divinity - Admin Console Controller
// Manages manual student enrollments for Cash, Offline UPI, and Direct Grants.

(function () {
  'use strict';

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzA5GyE3s-HK_ldFupRddNYzQNgrboYb4L_EVBwN-c1KB6yMoMGblVyCF2k221aWv2-Hg/exec';
  const REGISTRATION_SECRET = 'Kd_RegSecret_2026_9x8f7a6b5c4d3e2f1';

  // Accepted PINs: default or secret
  const VALID_PINS = ['krishna108', 'kdadmin2026', 'admin108', REGISTRATION_SECRET.toLowerCase()];

  const authSection = document.getElementById('admin-auth-section');
  const mainSection = document.getElementById('admin-main-section');
  const authForm = document.getElementById('admin-auth-form');
  const pinInput = document.getElementById('admin-pin-input');
  const authError = document.getElementById('auth-error');
  const lockBtn = document.getElementById('admin-lock-btn');

  const enrollForm = document.getElementById('manual-enroll-form');
  const submitBtn = document.getElementById('submit-enroll-btn');
  const enrollError = document.getElementById('enroll-error');
  const resultBox = document.getElementById('enroll-result-box');
  const enrollAnotherBtn = document.getElementById('enroll-another-btn');
  const copyMsgBtn = document.getElementById('copy-welcome-msg-btn');

  const planPriceMap = {
    'gita-lifetime': 108,
    'ai-3m': 108,
    'ai-1y': 500,
    'ai-lifetime': 1080
  };

  const scriptPlanMap = {
    'gita-lifetime': 'gita-complete',
    'ai-3m': 'ai-live',
    'ai-1y': 'ai-1y',
    'ai-lifetime': 'ai-complete'
  };

  const courseNames = {
    'gita-lifetime': 'Bhagavad Gita Foundation Course (Lifetime Access)',
    'ai-3m': 'Practical AI Course (3 Months Access)',
    'ai-1y': 'Practical AI Course (1 Year Access)',
    'ai-lifetime': 'Practical AI Course (Lifetime Access)'
  };

  let lastGeneratedMessage = '';

  // 1. Session & Auth Gate
  function checkAuth() {
    if (sessionStorage.getItem('kd_admin_unlocked') === 'true') {
      authSection.hidden = true;
      mainSection.hidden = false;
    } else {
      authSection.hidden = false;
      mainSection.hidden = true;
    }
  }

  authForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const entered = (pinInput.value || '').trim().toLowerCase();
    if (VALID_PINS.includes(entered)) {
      sessionStorage.setItem('kd_admin_unlocked', 'true');
      authError.style.display = 'none';
      checkAuth();
    } else {
      authError.textContent = 'Invalid security PIN or password. Please try again.';
      authError.style.display = 'block';
    }
  });

  lockBtn.addEventListener('click', function () {
    sessionStorage.removeItem('kd_admin_unlocked');
    checkAuth();
  });

  // Auto-update amount when course changes
  document.getElementById('course-plan-select').addEventListener('change', function (e) {
    const p = e.target.value;
    if (planPriceMap[p] !== undefined) {
      document.getElementById('amount-paid').value = planPriceMap[p];
    }
  });

  // Payment mode complimentary -> zero amount
  document.getElementById('payment-mode-select').addEventListener('change', function (e) {
    if (e.target.value === 'complimentary') {
      document.getElementById('amount-paid').value = 0;
    } else {
      const p = document.getElementById('course-plan-select').value;
      document.getElementById('amount-paid').value = planPriceMap[p] || 108;
    }
  });

  // 2. Manual Enrollment Submission
  enrollForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    enrollError.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Activating course access…';

    const name = document.getElementById('student-name').value.trim();
    let phone = document.getElementById('student-phone').value.trim().replace(/[\s()-]/g, '');
    let email = document.getElementById('student-email').value.trim().toLowerCase();
    const city = document.getElementById('student-city').value.trim() || 'India';
    const plan = document.getElementById('course-plan-select').value;
    const paymentMode = document.getElementById('payment-mode-select').value;
    const amount = Number(document.getElementById('amount-paid').value) || 0;
    const remarks = document.getElementById('payment-remarks').value.trim();

    // Auto-prefix Indian numbers with +91 if 10 digits
    if (/^\d{10}$/.test(phone)) {
      phone = '+91' + phone;
    } else if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      showError('Please enter a valid WhatsApp number with country code, e.g. +91 98765 43210');
      submitBtn.disabled = false;
      submitBtn.textContent = '⚡ Grant Course Access & Activate Seat';
      return;
    }

    // Fallback email if student does not use email
    if (!email) {
      email = `student_${phone.replace('+', '')}@krishnadivinity.in`;
    }

    try {
      const targetScriptPlan = scriptPlanMap[plan] || plan;
      const isAi = plan.startsWith('ai');
      const targetCourse = isAi ? 'ai' : 'gita';

      // Step A: Create registration in Google Sheet
      const regRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          secret: REGISTRATION_SECRET,
          registration: {
            full_name: name,
            email: email,
            whatsapp: phone,
            city: city,
            plan: targetScriptPlan,
            request_id: crypto.randomUUID(),
            source: 'admin_' + paymentMode
          }
        }),
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });

      const regData = await regRes.json();
      if (!regData.ok || !regData.receipt?.registrationId) {
        throw new Error(regData.error || 'Failed to create student registration in Google Sheet.');
      }

      const regId = regData.receipt.registrationId;

      // Step B: Record payment and mark as confirmed
      const paymentRefId = `${paymentMode.toUpperCase()}-${Date.now()}`;
      const payRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          secret: REGISTRATION_SECRET,
          payment: {
            registration_id: regId,
            provider_payment_id: paymentRefId,
            amount_inr: amount,
            currency: 'INR',
            method: paymentMode,
            status: 'captured'
          }
        }),
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });

      const payData = await payRes.json();
      if (!payData.ok) {
        throw new Error(payData.error || 'Student registered, but payment confirmation failed.');
      }

      // Step C: Render Success
      displaySuccess({
        name,
        phone,
        email,
        courseName: courseNames[plan] || 'Course',
        courseId: targetCourse,
        regId,
        paymentRefId,
        paymentMode,
        amount
      });

    } catch (err) {
      showError(err.message || 'Error occurred while saving enrollment. Please check connection and retry.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '⚡ Grant Course Access & Activate Seat';
    }
  });

  function showError(msg) {
    enrollError.textContent = msg;
    enrollError.style.display = 'block';
  }

  function displaySuccess(data) {
    enrollForm.hidden = true;
    resultBox.hidden = false;

    document.getElementById('result-reg-id').textContent = `Registration ID: ${data.regId} • Payment Ref: ${data.paymentRefId}`;
    document.getElementById('res-student-name').textContent = data.name;
    document.getElementById('res-student-phone').textContent = data.phone;
    document.getElementById('res-course-name').textContent = data.courseName;
    document.getElementById('res-payment-mode').textContent = data.paymentMode.toUpperCase();
    document.getElementById('res-amount').textContent = data.amount;

    const classroomUrl = `https://krishnadivinity.in/classroom.html?course=${data.courseId}`;
    const directLinkEl = document.getElementById('res-classroom-url');
    directLinkEl.href = classroomUrl;
    directLinkEl.textContent = classroomUrl;

    // Build personalized WhatsApp welcome message
    const cleanNumber = data.phone.replace(/[^0-9]/g, '');
    const welcomeMsg = `Hare Krishna ${data.name} Ji! 🙏\n\nKrishna Divinity me aapka swagat hai. Aapka course enrollment safalta-purvak confirm ho gaya hai!\n\n📚 Course: ${data.courseName}\n✅ Status: Confirmed & Active\n\n▶ Aap neeche diye gaye link par click karke turant classes shuru kar sakte hain:\n${classroomUrl}\n\n🎓 Student Learning Portal:\nhttps://krishnadivinity.in/portal.html\n(Aap apne WhatsApp number ${data.phone} se kabhi bhi login kar sakte hain)\n\n✈ Official Telegram Community (Live Zoom links ke liye):\nhttps://t.me/+zrMP1VqfFBQzNjE1\n\nKisi bhi sahayata ke liye aap humein isi number par WhatsApp kar sakte hain.\n\nHare Krishna! 🌸\n- Rohini Suta Dasa\nKrishna Divinity`;

    lastGeneratedMessage = welcomeMsg;

    const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(welcomeMsg)}`;
    document.getElementById('res-whatsapp-link').href = waUrl;
  }

  copyMsgBtn.addEventListener('click', function () {
    if (!lastGeneratedMessage) return;
    navigator.clipboard.writeText(lastGeneratedMessage).then(() => {
      const orig = copyMsgBtn.textContent;
      copyMsgBtn.textContent = '✅ Copied to Clipboard!';
      setTimeout(() => copyMsgBtn.textContent = orig, 2500);
    });
  });

  enrollAnotherBtn.addEventListener('click', function () {
    resultBox.hidden = true;
    enrollForm.hidden = false;
    enrollForm.reset();
    document.getElementById('amount-paid').value = 108;
    document.getElementById('student-name').focus();
  });

  // Init auth check
  checkAuth();
})();
