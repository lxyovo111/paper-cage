import { attach } from './attach.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
async function findAll() {
  const s = await p.ev("(()=>{const out=[];document.querySelectorAll('*').forEach(e=>{const t=(e.innerText||'').trim(); if(!t||t.length>24)return; const r=e.getBoundingClientRect(); if(!r.width)return; out.push({t,tag:e.tagName,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});});return JSON.stringify(out);})()");
  return JSON.parse(String(s));
}
async function clickAt(pt) {
  await p.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:pt.x, y:pt.y, button:'none' });
  await sleep(120);
  await p.send('Input.dispatchMouseEvent', { type:'mousePressed', x:pt.x, y:pt.y, button:'left', clickCount:1 });
  await sleep(90);
  await p.send('Input.dispatchMouseEvent', { type:'mouseReleased', x:pt.x, y:pt.y, button:'left', clickCount:1 });
}
let list = await findAll();
const red = list.filter(o => o.t === '重新部署');
console.log('candidates', JSON.stringify(red));
const target = red.sort((a,b)=> (b.w-a.w))[0] || null;
if (!target) { console.log('NO REDEPLOY'); process.exit(1); }
await clickAt(target);
console.log('clicked redeploy', JSON.stringify(target));
await sleep(2600);
list = await findAll();
const conf = list.filter(o => o.t === '确认部署');
console.log('confirm candidates', JSON.stringify(conf));
if (conf.length) { await clickAt(conf.sort((a,b)=>(b.w-a.w))[0]); console.log('clicked confirm'); } else console.log('no confirm modal');
await sleep(2500);
const txt = String(await p.ev('document.body.innerText.slice(0,900)')).replace(/\n{2,}/g,'\n');
console.log('AFTER', txt.slice(0,600));
p.close();
