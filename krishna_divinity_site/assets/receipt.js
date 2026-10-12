let receipt;
try { receipt = JSON.parse(sessionStorage.getItem('kd_receipt')); } catch {}

const names = {
  'gita-complete': 'Gita Foundation Course',
  'ai-live': 'AI Live Classes',
  'ai-complete': 'AI Live + Recorded Course'
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

if (!receipt || !/^REG-[\w-]+$/.test(receipt.registrationId) || !names[receipt.plan]) {
  titleEl.textContent = 'Registration Status';
  msgEl.textContent = 'No registration receipt is available in this browser. Please submit the registration form first.';
} else {
  detailsEl.hidden = false;
  titleEl.textContent = receipt.status === 'confirmed' ? 'Enrollment Confirmed' : 'Registration Received';
  refEl.textContent = 'Registration Reference: ' + receipt.registrationId;
  planEl.textContent = names[receipt.plan];
  
  const amount = Number(receipt.amountDue) || (receipt.plan === 'ai-complete' ? 1080 : 108);
  if (amountTagEl) amountTagEl.innerHTML = `<span class="badge" style="font-size:16px;background:#fef3c7;color:#92400e;padding:6px 14px;">₹${amount}</span>`;

  if (receipt.status === 'confirmed') {
    showPaymentSuccess(receipt.paymentId || 'Verified');
  } else if (receipt.status === 'waitlisted') {
    msgEl.textContent = 'Your details have been saved to the waiting list for the next batch. You will receive an update once a batch opens.';
    payPendingBox.hidden = true;
  } else {
    msgEl.textContent = 'Your registration has been saved! Complete your payment below to secure your seat.';
    payBtn.textContent = `Pay ₹${amount} Online (UPI, Cards, NetBanking)`;
    setupPaymentHandler(amount);
  }
}

function showPaymentSuccess(paymentId) {
  titleEl.textContent = 'Enrollment Confirmed 🎉';
  msgEl.textContent = 'Hare Krishna! Your payment has been received and your batch seat is officially confirmed.';
  payPendingBox.hidden = true;
  payConfirmedBox.hidden = false;
  if (paymentIdEl && paymentId) {
    paymentIdEl.textContent = 'Payment ID: ' + paymentId;
  }
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
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: receipt.registrationId, plan: receipt.plan })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Could not start payment.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Krishna Divinity',
        description: names[receipt.plan] || 'Course Registration',
        order_id: orderData.orderId,
        prefill: {
          name: receipt.fullName || '',
          email: receipt.email || '',
          contact: receipt.whatsapp || ''
        },
        theme: { color: '#b48325' },
        modal: {
          ondismiss: function () {
            payBtn.disabled = false;
            payBtn.textContent = `Pay ₹${amount} Online (UPI, Cards, NetBanking)`;
            payStatusEl.textContent = 'Payment cancelled. You can try again whenever ready.';
          }
        },
        handler: async function (response) {
          payBtn.textContent = 'Verifying payment…';
          payStatusEl.textContent = 'Verifying your payment with the server…';
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registrationId: receipt.registrationId,
                plan: receipt.plan
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.ok) {
              throw new Error(verifyData.error || 'Verification failed.');
            }
            // Update storage
            const updated = { ...receipt, status: 'confirmed', paymentId: response.razorpay_payment_id };
            sessionStorage.setItem('kd_receipt', JSON.stringify(updated));
            showPaymentSuccess(response.razorpay_payment_id);
          } catch (err) {
            payStatusEl.textContent = 'Payment received by Razorpay (ID: ' + response.razorpay_payment_id + '). Confirmation will reflect shortly in your record.';
            showPaymentSuccess(response.razorpay_payment_id);
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        payBtn.disabled = false;
        payBtn.textContent = `Retry Pay ₹${amount} Online`;
        payStatusEl.textContent = 'Payment failed: ' + (resp.error.description || 'Please try another payment method.');
      });
      rzp.open();
    } catch (err) {
      payBtn.disabled = false;
      payBtn.textContent = `Retry Pay ₹${amount} Online`;
      payStatusEl.textContent = err.message || 'Unable to open checkout. Please try again.';
    }
  });
}
