import {PLANS} from '../../backend/core.mjs';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

export function createOrderHandler({env = process.env, fetcher = fetch} = {}) {
  return async request => {
    if (request.method !== 'POST') return json({error: 'Method not allowed.'}, 405);
    const origins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!origins.includes(request.headers.get('origin'))) return json({error: 'Please submit from the course website.'}, 403);
    
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return json({error: 'Payment system is being configured.'}, 503);

    let input;
    try {
      input = await request.json();
    } catch {
      return json({error: 'Invalid request.'}, 400);
    }

    const {registrationId, plan} = input || {};
    if (!registrationId || !/^REG-[\w-]+$/.test(registrationId)) return json({error: 'Invalid registration reference.'}, 400);
    if (!plan || !Object.hasOwn(PLANS, plan)) return json({error: 'Invalid course plan.'}, 400);

    const priceInr = PLANS[plan].price;
    const amountInPaise = priceInr * 100;

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    try {
      const response = await fetcher('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: registrationId.slice(0, 40),
          notes: {
            registration_id: registrationId,
            plan: plan
          }
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error('razorpay_order_failed: ' + errText);
      }

      const order = await response.json();
      return json({
        ok: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId,
        plan: plan,
        registrationId: registrationId
      });
    } catch {
      return json({error: 'Unable to initiate payment. Please try again shortly.'}, 502);
    }
  };
}

export default createOrderHandler();
export const config = {path: '/api/create-order', rateLimit: {windowLimit: 15, windowSize: 60, aggregateBy: ['ip', 'domain']}};
