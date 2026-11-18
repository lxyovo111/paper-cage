import { attach } from './attach.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
for (let i=0;i<12;i++){ await sleep(2500); const t = await p.ev('document.body.innerText'); const m = t.match(/Upload [^\n]*/g); const upd = t.indexOf('文件有更新')>=0; console.log(i, upd, JSON.stringify((m||[]).slice(0,4))); if (upd) break; }
p.close();