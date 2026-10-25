import crypto from 'node:crypto';
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

export function verifyPaymentHandler({env = process.env, fetcher = fetch} = {}) {
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

    const keySecret = env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return json({error: 'Payment system not configured.'}, 503, corsHeaders);
    }

    let input;
    try {
      input = await request.json();
    } catch {
      return json({error: 'Invalid request.'}, 400, corsHeaders);
    }

    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId, plan} = input || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registrationId || !plan) {
      return json({error: 'Missing payment verification data.'}, 400, corsHeaders);
    }

    // Verify HMAC-SHA256 signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(text).digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return json({error: 'Payment verification failed.'}, 400, corsHeaders);
    }

    const planInfo = PLANS[plan];
    if (!planInfo) {
      return json({error: 'Invalid plan.'}, 400, corsHeaders);
    }

    // Call Google Apps Script to confirm registration and record payment
    try {
      const gsResponse = await fetcher(env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          secret: env.REGISTRATION_SECRET,
          payment: {
            registration_id: registrationId,
            provider_order_id: razorpay_order_id,
            provider_payment_id: razorpay_payment_id,
            amount_inr: planInfo.price,
            plan: plan
          }
        }),
        signal: AbortSignal.timeout(15000),
        redirect: 'follow'
      });

      if (!gsResponse.ok) throw new Error('gs_update_failed');
      const gsResult = await gsResponse.json();
      if (!gsResult.ok) throw new Error('gs_update_failed');

      return json({
        ok: true,
        confirmed: true,
        paymentId: razorpay_payment_id,
        paymentReference: gsResult.paymentReference,
        registrationId: registrationId,
        plan: plan
      }, 200, corsHeaders);
    } catch {
      // Even if Google Sheets recording timed out, Razorpay payment was confirmed!
      return json({
        ok: true,
        confirmed: true,
        paymentId: razorpay_payment_id,
        registrationId: registrationId,
        notice: 'Payment received. Registration will reflect shortly.'
      }, 200, corsHeaders);
    }
  };
}

export default verifyPaymentHandler();
export const config = {path: '/api/verify-payment', rateLimit: {windowLimit: 15, windowSize: 60, aggregateBy: ['ip', 'domain']}};
