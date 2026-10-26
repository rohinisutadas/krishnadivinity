// Krishna Divinity - Student Enrollment Receipt & Direct Payment Controller
// Connects directly to Google Apps Script and Razorpay (100% serverless, zero external credits)

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzA5GyE3s-HK_ldFupRddNYzQNgrboYb4L_EVBwN-c1KB6yMoMGblVyCF2k221aWv2-Hg/exec';
const REGISTRATION_SECRET = 'Kd_RegSecret_2026_9x8f7a6b5c4d3e2f1';
const RAZORPAY_KEY_ID = 'rzp_live_TqtLjeTj9XYzsx';

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
const payBtn = document.querySelector('#pay-button');
const payStatusEl = document.querySelector('#payment-status');
const paymentIdEl = document.querySelector('#payment-id-display');
const classroomEnterBtn = document.querySelector('#classroom-enter-btn');

if (!receipt || !/^REG-[\w-]+$/.test(receipt.registrationId) || !names[receipt.plan]) {
  titleEl.textContent = 'Registration Status';
  msgEl.textContent = 'No registration receipt is available in this browser. Please select a course to begin.';
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
    payBtn.textContent = `Pay ₹${amount} Online (UPI, Cards, NetBanking)`;
    setupPaymentHandler(amount);
  }
}

function showPaymentSuccess(paymentId) {
  titleEl.textContent = 'Enrollment Confirmed 🎉';
  msgEl.textContent = 'Hare Krishna! Your payment has been received and your course access is fully unlocked.';
  payPendingBox.hidden = true;
  payConfirmedBox.hidden = false;
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

function setupPaymentHandler(amount) {
  payBtn.addEventListener('click', async () => {
    if (typeof Razorpay === 'undefined') {
      payStatusEl.textContent = 'Payment gateway loading. Please check your internet connection or reload.';
      return;
    }
    payBtn.disabled = true;
    payBtn.textContent = 'Opening secure checkout…';
    payStatusEl.textContent = 'Connecting to Razorpay…';

    try {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount * 100, // paise
        currency: 'INR',
        name: 'Krishna Divinity',
        description: names[receipt.plan] || 'Course Registration',
        image: 'assets/logo.jpg',
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
            payBtn.textContent = `Pay ₹${amount} Online (UPI, Cards, NetBanking)`;
            payStatusEl.textContent = 'Payment cancelled. You can try again whenever ready.';
          }
        },
        handler: async function (payResp) {
          payBtn.textContent = 'Confirming enrollment…';
          payStatusEl.textContent = 'Confirming payment with the student records…';

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

          // Update storage
          const updated = { ...receipt, status: 'confirmed', paymentId: payResp.razorpay_payment_id };
          sessionStorage.setItem('kd_receipt', JSON.stringify(updated));
          showPaymentSuccess(payResp.razorpay_payment_id);
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        payBtn.disabled = false;
        payBtn.textContent = `Retry Pay ₹${amount} Online`;
        payStatusEl.textContent = 'Payment failed: ' + (resp.error?.description || 'Please try another payment method.');
      });
      rzp.open();
    } catch (err) {
      payBtn.disabled = false;
      payBtn.textContent = `Retry Pay ₹${amount} Online`;
      payStatusEl.textContent = err.message || 'Unable to open checkout. Please try again.';
    }
  });
}
