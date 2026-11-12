const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzA5GyE3s-HK_ldFupRddNYzQNgrboYb4L_EVBwN-c1KB6yMoMGblVyCF2k221aWv2-Hg/exec';
const REGISTRATION_SECRET = 'Kd_RegSecret_2026_9x8f7a6b5c4d3e2f1';

async function testSyncOne(payment) {
  console.log('Sending sync request for:', payment.provider_payment_id);
  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      secret: REGISTRATION_SECRET,
      payment: payment
    }),
    redirect: 'follow'
  });
  console.log('HTTP Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

// Let's test with Ronit raaj
testSyncOne({
  registration_id: 'REG-cd58f907-f247-4007-ae74-7db3c9869688',
  provider_payment_id: 'pay_TysKyw3qojBo3Y',
  amount_inr: 1080,
  currency: 'INR',
  method: 'razorpay',
  status: 'captured'
});
