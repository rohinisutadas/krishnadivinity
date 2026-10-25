import {PLANS} from '../../backend/core.mjs';

const defaultOrigins = [
  'https://krishnadivinity.in',
  'https://www.krishnadivinity.in',
  'https://krishnadivinity.netlify.app',
  'https://luminous-mousse-726864.netlify.app',
  'http://127.0.0.1:4174'
];

function getCorsHeaders(reqOrigin, origins) {
  const origin = reqOrigin && origins.includes(reqOrigin) ? reqOrigin : origins[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Origin, Accept, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

const json = (data, status = 200, cors = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...cors
  }
});

export function createOrderHandler({env = process.env, fetcher = fetch} = {}) {
  return async request => {
    const envOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const origins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
    const reqOrigin = request.headers.get('origin');
    const corsHeaders = getCorsHeaders(reqOrigin, origins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({error: 'Method not allowed.'}, 405, corsHeaders);
    }

    if (reqOrigin && !origins.includes(reqOrigin)) {
      return json({error: 'Please submit from the course website.'}, 403, corsHeaders);
    }
    
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return json({error: 'Payment system is being configured.'}, 503, corsHeaders);
    }

    let input;
    try {
      input = await request.json();
    } catch {
      return json({error: 'Invalid request.'}, 400, corsHeaders);
    }

    const {registrationId, plan} = input || {};
    if (!registrationId || !/^REG-[\w-]+$/.test(registrationId)) {
      return json({error: 'Invalid registration reference.'}, 400, corsHeaders);
    }
    if (!plan || !Object.hasOwn(PLANS, plan)) {
      return json({error: 'Invalid course plan.'}, 400, corsHeaders);
    }

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
      }, 200, corsHeaders);
    } catch {
      return json({error: 'Unable to initiate payment. Please try again shortly.'}, 502, corsHeaders);
    }
  };
}

export default createOrderHandler();
export const config = {path: '/api/create-order', rateLimit: {windowLimit: 15, windowSize: 60, aggregateBy: ['ip', 'domain']}};
