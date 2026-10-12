import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const core=await fs.readFile(path.join(root,'backend/core.mjs'),'utf8');
await fs.writeFile(path.join(root,'google-apps-script/Core.gs'),'// GENERATED: run npm run build after editing backend/core.mjs\n'+core.replace(/^export /gm,''));
console.log('Static pages ready. Apps Script core generated. Deploy with Netlify build/CLI to include server functions.');
