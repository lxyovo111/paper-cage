import { attach } from './attach.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
async function findBtn(re) {
  const s = await p.ev("(()=>{const out=[];document.querySelectorAll('button,a,div[role=button],[class*=btn]').forEach(e=>{const t=(e.innerText||'').trim();if(!t||t.length>20)return;const r=e.getBoundingClientRect();if(!r.width)return;out.push({t,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});});return JSON.stringify(out);})()");
  const list = JSON.parse(String(s));
  const hit = list.find(o => re.test(o.t));
  return hit || null;
}
async function clickAt(pt) {
  await p.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:pt.x, y:pt.y, button:'none' });
  await sleep(120);
  await p.send('Input.dispatchMouseEvent', { type:'mousePressed', x:pt.x, y:pt.y, button:'left', clickCount:1 });
  await sleep(90);
  await p.send('Input.dispatchMouseEvent', { type:'mouseReleased', x:pt.x, y:pt.y, button:'left', clickCount:1 });
}
const a = await findBtn(/重新部署/);
console.log('redeploy btn', JSON.stringify(a));
if (!a) { console.log(await p.ev('document.body.innerText.slice(0,300)')); process.exit(1); }
await clickAt(a);
await sleep(2200);
const b = await findBtn(/^确认部署$/);
console.log('confirm btn', JSON.stringify(b));
if (b) await clickAt(b); else console.log('no confirm modal');
await sleep(2000);
const txt = String(await p.ev('document.body.innerText.slice(0,800)')).replace(/\n{2,}/g, '\n');
console.log('AFTER', txt.slice(0, 500));
p.close();
