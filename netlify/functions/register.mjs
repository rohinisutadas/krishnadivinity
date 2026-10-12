import {validate} from '../../backend/core.mjs';

const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function createHandler({env=process.env,fetcher=fetch}={}) {
  return async request => {
    const configured = env.REGISTRATION_ENABLED==='true' && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.GOOGLE_SCRIPT_URL || '') && (env.REGISTRATION_SECRET || '').length>=32;
    if (request.method==='GET') return json({enabled:!!configured});
    if (request.method!=='POST') return json({error:'Method not allowed.'},405);
    const origins = (env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
    if (!origins.includes(request.headers.get('origin'))) return json({error:'Please submit from the course website.'},403);
    if (!configured) return json({error:'Registrations are not open yet. Please return later.'},503);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error:'JSON required.'},415);
    if (Number(request.headers.get('content-length'))>8192) return json({error:'Request too large.'},413);
    let input;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length>8192) return json({error:'Request too large.'},413);
      input=JSON.parse(raw);
    } catch { return json({error:'Invalid request.'},400); }
    if (input?.website) return json({error:'Unable to accept this request.'},400);
    const {data,errors}=validate(input);
    if (Object.keys(errors).length) return json({error:'Please check the highlighted fields.',fields:errors},400);
    try {
      const response=await fetcher(env.GOOGLE_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.REGISTRATION_SECRET,registration:data}),signal:AbortSignal.timeout(15000),redirect:'follow'});
      if (!response.ok) throw new Error('storage_failed');
      const result=await response.json();
      if (!result.ok || !result.receipt?.registrationId) throw new Error('storage_failed');
      return json({ok:true,receipt:result.receipt});
    } catch {
      // Do not log student data or credentials. A timeout may have occurred after a save;
      // retain request_id in the browser so a retry is safe.
      return json({error:'We could not confirm your registration. Please retry using the same details; repeated attempts will not create another registration.'},502);
    }
  };
}
export default createHandler();
export const config={path:'/api/register',rateLimit:{windowLimit:10,windowSize:60,aggregateBy:['ip','domain']}};
