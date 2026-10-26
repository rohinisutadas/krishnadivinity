import {validate, PLANS} from '../../backend/core.mjs';

const defaultOrigins = [
  'https://krishnadivinity.in',
  'https://www.krishnadivinity.in',
  'https://krishna-divinity.web.app',
  'https://krishna-divinity.firebaseapp.com',
  'https://krishnadivinity.netlify.app',
  'https://luminous-mousse-726864.netlify.app',
  'http://127.0.0.1:4174',
  'http://localhost:4174'
];

function isOriginAllowed(reqOrigin, origins) {
  if (!reqOrigin) return true;
  if (origins.includes(reqOrigin)) return true;
  try {
    const url = new URL(reqOrigin);
    if (url.hostname === 'krishnadivinity.in' || url.hostname.endsWith('.krishnadivinity.in')) return true;
    if (url.hostname === 'krishna-divinity.web.app' || url.hostname === 'krishna-divinity.firebaseapp.com') return true;
    if (url.hostname.endsWith('.netlify.app')) return true;
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return true;
  } catch {}
  return false;
}

function getCorsHeaders(reqOrigin, origins) {
  const allowed = isOriginAllowed(reqOrigin, origins);
  const origin = (allowed && reqOrigin) ? reqOrigin : (origins[0] || '*');
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

export function createHandler({env = process.env, fetcher = fetch} = {}) {
  return async request => {
    const envOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const origins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
    const reqOrigin = request.headers.get('origin');
    const corsHeaders = getCorsHeaders(reqOrigin, origins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const configured = env.REGISTRATION_ENABLED === 'true' &&
      /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.GOOGLE_SCRIPT_URL || '') &&
      (env.REGISTRATION_SECRET || '').length >= 32;

    if (request.method === 'GET') {
      return json({enabled: !!configured}, 200, corsHeaders);
    }

    if (request.method !== 'POST') {
      return json({error: 'Method not allowed.'}, 405, corsHeaders);
    }

    if (reqOrigin && !isOriginAllowed(reqOrigin, origins)) {
      return json({error: 'Please submit from the course website.'}, 403, corsHeaders);
    }

    if (!configured) {
      return json({error: 'Registrations are not open yet. Please return later.'}, 503, corsHeaders);
    }

    if (!request.headers.get('content-type')?.startsWith('application/json')) {
      return json({error: 'JSON required.'}, 415, corsHeaders);
    }

    if (Number(request.headers.get('content-length')) > 8192) {
      return json({error: 'Request too large.'}, 413, corsHeaders);
    }

    let input;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 8192) {
        return json({error: 'Request too large.'}, 413, corsHeaders);
      }
      input = JSON.parse(raw);
    } catch {
      return json({error: 'Invalid request.'}, 400, corsHeaders);
    }

    if (input?.website) {
      return json({error: 'Unable to accept this request.'}, 400, corsHeaders);
    }

    const {data, errors} = validate(input);
    if (Object.keys(errors).length) {
      return json({error: 'Please check the highlighted fields.', fields: errors}, 400, corsHeaders);
    }

    // Map new plan keys to legacy keys for older Google Apps Script deployment if needed
    const scriptPlanMap = {
      'gita-lifetime': 'gita-complete',
      'ai-3m': 'ai-live',
      'ai-lifetime': 'ai-complete'
    };
    const scriptData = {
      ...data,
      plan: scriptPlanMap[data.plan] || data.plan
    };

    try {
      const response = await fetcher(env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({secret: env.REGISTRATION_SECRET, registration: scriptData}),
        signal: AbortSignal.timeout(15000),
        redirect: 'follow'
      });

      if (!response.ok) throw new Error('storage_failed');
      const result = await response.json();
      if (!result.ok || !result.receipt?.registrationId) throw new Error('storage_failed');

      return json({
        ok: true,
        receipt: {
          ...result.receipt,
          plan: data.plan // preserve user's chosen plan
        }
      }, 200, corsHeaders);
    } catch {
      return json({
        error: 'We could not confirm your registration. Please retry using the same details; repeated attempts will not create another registration.'
      }, 502, corsHeaders);
    }
  };
}

export default createHandler();
export const config = {path: '/api/register', rateLimit: {windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain']}};
