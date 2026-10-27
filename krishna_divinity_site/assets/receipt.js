// Krishna Divinity - Student Enrollment Receipt & Dual Payment Controller (Direct UPI + Razorpay)
// 100% Serverless, direct connection to Google Apps Script

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzA5GyE3s-HK_ldFupRddNYzQNgrboYb4L_EVBwN-c1KB6yMoMGblVyCF2k221aWv2-Hg/exec';
const REGISTRATION_SECRET = 'Kd_RegSecret_2026_9x8f7a6b5c4d3e2f1';
const RAZORPAY_KEY_ID = 'rzp_live_TqtLjeTj9XYzsx';

const UPI_CONFIG = {
  vpa: 'rohinisutadas-2@okhdfcbank',
  name: 'Roshan Verma',
  phone: '7356052212'
};

let receipt;
try { receipt = JSON.parse(sessionStorage.getItem('kd_receipt')); } catch {}

const names = {
  'gita-lifetime': 'Bhagavad Gita Foundation Course (Lifetime Access)',
  'ai-3m': 'Practical AI Course (3 Months Access)',
  'ai-1y': 'Practical AI Course (1 Year Access)',
  'ai-lifetime': 'Practical AI Course (Lifetime Access)',
  'gita-complete': 'Bhagavad Gita Foundation Course (Lifetime Access)',
  'ai-live': 'Practical AI Course (3 Months Access)',
  'ai-complete': 'Practical AI Course (Lifetime Access)'
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

const titleEl = document.querySelector('#receipt-title');
const msgEl = document.querySelector('#receipt-message');
const detailsEl = document.querySelector('#receipt-details');
const refEl = document.querySelector('#receipt-reference');
const planEl = document.querySelector('#receipt-plan');
const amountTagEl = document.querySelector('#receipt-amount-tag');
const payPendingBox = document.querySelector('#payment-pending-box');
const payConfirmedBox = document.querySelector('#payment-confirmed-box');
const classroomEnterBtn = document.querySelector('#classroom-enter-btn');
const paymentIdEl = document.querySelector('#payment-id-display');

// Dual tab elements
const tabBtnUpi = document.querySelector('#tab-btn-upi-rec');
const tabBtnRzp = document.querySelector('#tab-btn-rzp-rec');
const contentUpi = document.querySelector('#content-tab-upi-rec');
const contentRzp = document.querySelector('#content-tab-rzp-rec');

// UPI elements
const recGPay = document.querySelector('#rec-gpay');
const recPhonePe = document.querySelector('#rec-phonepe');
const recPaytm = document.querySelector('#rec-paytm');
const recAny = document.querySelector('#rec-any');
const recQrImg = document.querySelector('#rec-qr-img');
const recAmtDisplay = document.querySelector('#rec-amt-display');
const recCopyUpi = document.querySelector('#rec-copy-upi');
const recUtrInput = document.querySelector('#rec-utr-input');
const recConfirmUtrBtn = document.querySelector('#rec-confirm-utr-btn');
const recUtrError = document.querySelector('#rec-utr-error');
const payBtn = document.querySelector('#pay-button');
const payStatusEl = document.querySelector('#payment-status');

if (!receipt || !/^REG-[\w-]+$/.test(receipt.registrationId) || !names[receipt.plan]) {
  titleEl.textContent = 'Registration Status';
  msgEl.textContent = 'No active registration receipt found in this browser. Please select a course to begin.';
} else {
  detailsEl.hidden = false;
  titleEl.textContent = receipt.status === 'confirmed' ? 'Enrollment Confirmed' : 'Registration Received';
  refEl.textContent = 'Registration Reference: ' + receipt.registrationId;
  planEl.textContent = names[receipt.plan] || receipt.plan;
  
  const amount = Number(receipt.amountDue) || planPrices[receipt.plan] || 108;
  if (amountTagEl) amountTagEl.innerHTML = `<span class="badge" style="font-size:16px;background:#fef3c7;color:#92400e;padding:6px 14px;">₹${amount}</span>`;

  const isAi = receipt.plan?.startsWith('ai');
  const targetCourse = isAi ? 'ai' : 'gita';
  if (classroomEnterBtn) {
    classroomEnterBtn.href = `classroom.html?course=${targetCourse}`;
  }

  if (receipt.status === 'confirmed') {
    showPaymentSuccess(receipt.paymentId || 'Verified');
  } else if (receipt.status === 'waitlisted') {
    msgEl.textContent = 'Your details have been saved to the waiting list for the next batch. You will receive an update once a batch opens.';
    payPendingBox.hidden = true;
  } else {
    msgEl.textContent = 'Your registration has been saved! Complete your payment below to immediately unlock your course.';
    setupDualPayment(amount, targetCourse);
  }
}

function showPaymentSuccess(paymentId) {
  titleEl.textContent = 'Enrollment Confirmed 🎉';
  msgEl.textContent = 'Hare Krishna! Your payment has been received and your course access is fully unlocked.';
  if (payPendingBox) payPendingBox.hidden = true;
  if (payConfirmedBox) payConfirmedBox.hidden = false;
  if (paymentIdEl && paymentId) {
    paymentIdEl.textContent = 'Payment ID: ' + paymentId;
  }

  // Update student session in localStorage
  try {
    const isAi = receipt.plan?.startsWith('ai');
    const studentSession = {
      fullName: receipt.fullName || 'Seeker',
      email: receipt.email || '',
      whatsapp: receipt.whatsapp || '',
      enrolledCourses: [{
        courseId: isAi ? 'ai' : 'gita',
        courseName: isAi ? 'Practical AI Course' : 'Bhagavad Gita Foundation Course',
        plan: receipt.plan,
        validity: receipt.plan === 'ai-3m' ? '3_months' : (receipt.plan === 'ai-1y' ? '1_year' : 'lifetime'),
        validUntil: receipt.plan === 'ai-3m' ? calculateFutureDate(90) : (receipt.plan === 'ai-1y' ? calculateFutureDate(365) : 'lifetime')
      }]
    };
    localStorage.setItem('kd_student_session', JSON.stringify(studentSession));
  } catch {}
}

function calculateFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function setupDualPayment(amount, targetCourse) {
  if (recAmtDisplay) recAmtDisplay.textContent = `₹${amount}`;

  // Build UPI URI
  const noteText = receipt.registrationId.slice(0, 30);
  const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_CONFIG.vpa)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(noteText)}`;

  // Mobile App Links
  if (recGPay) recGPay.href = `tez://upi/pay?pa=${encodeURIComponent(UPI_CONFIG.vpa)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(noteText)}`;
  if (recPhonePe) recPhonePe.href = `phonepe://upi/pay?pa=${encodeURIComponent(UPI_CONFIG.vpa)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(noteText)}`;
  if (recPaytm) recPaytm.href = `paytmmp://pay?pa=${encodeURIComponent(UPI_CONFIG.vpa)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(noteText)}`;
  if (recAny) recAny.href = upiUri;

  // QR Code
  if (recQrImg) {
    recQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiUri)}`;
    recQrImg.onerror = () => {
      recQrImg.src = `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(upiUri)}`;
    };
  }

  // Copy UPI ID button
  if (recCopyUpi) {
    recCopyUpi.addEventListener('click', () => {
      navigator.clipboard.writeText(UPI_CONFIG.vpa).then(() => {
        recCopyUpi.textContent = 'Copied!';
        setTimeout(() => { recCopyUpi.textContent = 'Copy'; }, 2000);
      }).catch(() => {
        prompt('Copy UPI ID:', UPI_CONFIG.vpa);
      });
    });
  }

  // Tab switching
  if (tabBtnUpi && tabBtnRzp) {
    tabBtnUpi.addEventListener('click', () => {
      tabBtnUpi.style.background = '#fff';
      tabBtnUpi.style.color = '#b45309';
      tabBtnUpi.style.fontWeight = '700';
      tabBtnUpi.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
      tabBtnRzp.style.background = 'transparent';
      tabBtnRzp.style.color = '#64748b';
      tabBtnRzp.style.fontWeight = '600';
      tabBtnRzp.style.boxShadow = 'none';
      if (contentUpi) contentUpi.hidden = false;
      if (contentRzp) contentRzp.hidden = true;
    });

    tabBtnRzp.addEventListener('click', () => {
      tabBtnRzp.style.background = '#fff';
      tabBtnRzp.style.color = '#b45309';
      tabBtnRzp.style.fontWeight = '700';
      tabBtnRzp.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
      tabBtnUpi.style.background = 'transparent';
      tabBtnUpi.style.color = '#64748b';
      tabBtnUpi.style.fontWeight = '600';
      tabBtnUpi.style.boxShadow = 'none';
      if (contentRzp) contentRzp.hidden = false;
      if (contentUpi) contentUpi.hidden = true;
    });
  }

  // Direct UPI UTR verification
  if (recConfirmUtrBtn) {
    recConfirmUtrBtn.addEventListener('click', async () => {
      const utr = (recUtrInput?.value || '').trim().replace(/\s+/g, '');
      if (!utr || utr.length < 6) {
        if (recUtrError) {
          recUtrError.textContent = 'Please enter the 12-digit UPI Reference / UTR Number from your payment screen.';
          recUtrError.style.display = 'block';
        }
        recUtrInput?.focus();
        return;
      }

      if (recUtrError) recUtrError.style.display = 'none';
      recConfirmUtrBtn.disabled = true;
      recConfirmUtrBtn.textContent = 'Unlocking Course…';

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            secret: REGISTRATION_SECRET,
            payment: {
              registration_id: receipt.registrationId,
              provider_payment_id: utr,
              amount_inr: amount,
              currency: 'INR',
              method: 'direct_upi',
              status: 'captured'
            }
          }),
          redirect: 'follow'
        });

        // Update session
        receipt.status = 'confirmed';
        receipt.paymentId = utr;
        sessionStorage.setItem('kd_receipt', JSON.stringify(receipt));

        // Immediately redirect to Classroom
        location.href = `classroom.html?course=${targetCourse}`;

      } catch (err) {
        recConfirmUtrBtn.disabled = false;
        recConfirmUtrBtn.textContent = 'Unlock Course →';
        if (recUtrError) {
          recUtrError.textContent = 'Could not verify payment. Please retry or contact support.';
          recUtrError.style.display = 'block';
        }
      }
    });
  }

  // Razorpay Gateway
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      if (typeof Razorpay === 'undefined') {
        alert('Razorpay gateway is still loading. Please try again or use Direct UPI.');
        return;
      }
      payBtn.disabled = true;
      payBtn.textContent = 'Opening secure checkout…';
      if (payStatusEl) payStatusEl.textContent = 'Connecting to Razorpay…';

      const options = {
        key: receipt.keyId || RAZORPAY_KEY_ID,
        amount: amount * 100, // paise
        currency: 'INR',
        name: 'Krishna Divinity',
        description: names[receipt.plan] || 'Course Registration',
        image: 'assets/logo.jpg',
        ...(receipt.orderId ? { order_id: receipt.orderId } : {}),
        prefill: {
          name: receipt.fullName || '',
          email: receipt.email || '',
          contact: receipt.whatsapp || ''
        },
        notes: {
          registration_id: receipt.registrationId,
          plan: receipt.plan
        },
        theme: { color: '#b45309' },
        modal: {
          ondismiss: function () {
            payBtn.disabled = false;
            payBtn.textContent = 'Open Razorpay Gateway →';
            if (payStatusEl) payStatusEl.textContent = 'Payment cancelled. You can try again whenever ready or use Direct UPI.';
          }
        },
        handler: async function (payResp) {
          try {
            await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                secret: REGISTRATION_SECRET,
                payment: {
                  registration_id: receipt.registrationId,
                  provider_payment_id: payResp.razorpay_payment_id,
                  amount_inr: amount,
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

          // Update storage & redirect to Classroom
          const updated = { ...receipt, status: 'confirmed', paymentId: payResp.razorpay_payment_id };
          sessionStorage.setItem('kd_receipt', JSON.stringify(updated));
          showPaymentSuccess(payResp.razorpay_payment_id);
          location.href = `classroom.html?course=${targetCourse}`;
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        payBtn.disabled = false;
        payBtn.textContent = 'Open Razorpay Gateway →';
        if (payStatusEl) payStatusEl.textContent = 'Payment failed: ' + (resp.error?.description || 'Please try another payment method.');
      });
      rzp.open();
    });
  }
}
