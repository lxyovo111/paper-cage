import { attach } from './attach.mjs';
import fs from 'node:fs';
const file = process.argv[2];
const shot = process.argv[3];
const expr = fs.readFileSync(file, 'utf8');
const p = await attach('modelscope');
try {
  const v = await p.ev(expr);
  console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 1));
} catch (e) { console.log('EV-ERROR: ' + e.message); }
if (shot) { await p.shot(shot); console.log('shot ' + shot); }
p.close();