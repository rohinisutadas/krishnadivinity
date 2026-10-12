import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createHandler} from '../netlify/functions/register.mjs';
import {SCHEMA,validate,registrationMutation} from '../backend/core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../krishna_divinity_site');
const demo=process.argv.includes('--demo');
const db=Object.fromEntries(Object.keys(SCHEMA).map(k=>[k,[]]));
const date=new Date(Date.now()+86400000*30).toISOString();
db.Batches=[{batch_id:'DEMO-GITA',course:'gita',start_at:date,capacity:20,status:'open'},{batch_id:'DEMO-AI',course:'ai',start_at:date,capacity:20,status:'open'}];
const handler=createHandler();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1:4174');
    if(url.pathname==='/api/register') {
      let raw='';for await(const chunk of req) {raw+=chunk;if(Buffer.byteLength(raw)>8192){res.writeHead(413);res.end();return;}}
      let response;
      if(demo) {
        let result;
        let status=200;
        if(req.method==='GET') result={enabled:true,demo:true};
        else if(req.method!=='POST') {result={error:'Method not allowed'};status=405;}
        else {
          let input;try{input=JSON.parse(raw);}catch{input=null;}
          const checked=validate(input);
          if(Object.keys(checked.errors).length){result={error:'Check your details.',fields:checked.errors};status=400;}
          else {
            const mutation=registrationMutation(checked.data,db,new Date(),randomUUID);
            mutation.rows.forEach(r=>db[r.sheet].push(r.record));
            result={ok:true,receipt:mutation.receipt};
          }
        }
        response=new Response(JSON.stringify(result),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
      } else response=await handler(new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:raw})}));
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
    }
    const requested=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\//,'');
    const file=path.resolve(root,requested);
    if(!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(4174,'127.0.0.1',()=>console.log(`Local website: http://127.0.0.1:4174 — ${demo?'DEMO: memory only, no Google writes':'registration requires server configuration'}`));
