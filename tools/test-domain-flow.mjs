import { randomUUID } from 'node:crypto';

async function runFullDomainTest() {
  const domain = 'https://krishnadivinity.in';
  console.log(`\n========================================`);
  console.log(`Testing Full Flow on ${domain}`);
  console.log(`========================================\n`);

  // 1. Check API Status
  console.log('1. Checking Registration Status (GET /api/register)...');
  const getRes = await fetch(`${domain}/api/register`);
  console.log('HTTP Status:', getRes.status);
  const getBody = await getRes.json();
  console.log('Response:', getBody);
  if (!getBody.enabled) {
    throw new Error('Registration is not enabled on this domain!');
  }
  console.log('✔ Registration is enabled!\n');

  // 2. Perform Test Registration
  console.log('2. Submitting New Test Registration (POST /api/register)...');
  const regPayload = {
    full_name: 'Rohini Student Test',
    whatsapp: '+917356052212',
    email: 'test.enrollment@krishnadivinity.in',
    city: 'Bengaluru',
    plan: 'gita-complete',
    consent: true,
    request_id: randomUUID()
  };

  const regRes = await fetch(`${domain}/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': domain
    },
    body: JSON.stringify(regPayload)
  });

  console.log('HTTP Status:', regRes.status);
  const regData = await regRes.json();
  console.log('Registration Result:', JSON.stringify(regData, null, 2));

  if (!regRes.ok || !regData.ok || !regData.receipt?.registrationId) {
    throw new Error('Registration failed on ' + domain);
  }
  const regId = regData.receipt.registrationId;
  console.log(`✔ Registration successful! Generated ID: ${regId}\n`);

  // 3. Create Razorpay Live Order
  console.log('3. Generating Razorpay Order (POST /api/create-order)...');
  const orderRes = await fetch(`${domain}/api/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': domain
    },
    body: JSON.stringify({
      registrationId: regId,
      plan: 'gita-complete'
    })
  });

  console.log('HTTP Status:', orderRes.status);
  const orderData = await orderRes.json();
  console.log('Order Result:', JSON.stringify(orderData, null, 2));

  if (!orderRes.ok || !orderData.ok || !orderData.orderId) {
    throw new Error('Order creation failed on ' + domain);
  }
  console.log(`✔ Razorpay Order successfully created! Order ID: ${orderData.orderId}\n`);

  console.log('========================================');
  console.log('ALL TESTS PASSED ON https://krishnadivinity.in');
  console.log('========================================\n');
}

runFullDomainTest().catch(err => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
