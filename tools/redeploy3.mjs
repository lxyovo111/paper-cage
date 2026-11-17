import { attach } from './attach.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
async function all() {
  const s = await p.ev("(()=>{const out=[];document.querySelectorAll('*').forEach(e=>{const t=(e.innerText||'').trim(); if(!t||t.length>30)return; const r=e.getBoundingClientRect(); if(!r.width)return; out.push({t,tag:e.tagName,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)});});return JSON.stringify(out);})()");
  return JSON.parse(String(s));
}
async function clickAt(x,y) {
  await p.send('Input.dispatchMouseEvent', { type:'mouseMoved', x, y, button:'none' });
  await sleep(150);
  await p.send('Input.dispatchMouseEvent', { type:'mousePressed', x, y, button:'left', clickCount:1 });
  await sleep(110);
  await p.send('Input.dispatchMouseEvent', { type:'mouseReleased', x, y, button:'left', clickCount:1 });
}
let list = await all();
const red = list.filter(o=>o.t==='重新部署').sort((a,b)=>b.w-a.w)[0];
console.log('RED', JSON.stringify(red));
if (!red) process.exit(1);
await clickAt(red.x, red.y);
await sleep(3200);
list = await all();
const conf = list.filter(o=>o.t==='确认部署').sort((a,b)=>b.w-a.w)[0];
console.log('CONF', JSON.stringify(conf || null));
if (conf) { await clickAt(conf.x, conf.y); console.log('clicked confirm'); }
await sleep(3000);
list = await all();
console.log('MODAL_LEFT', JSON.stringify(list.filter(o=>o.t==='确认部署').length));
const body = String(await p.ev('document.body.innerText.slice(0,500)')).replace(/\n{2,}/g,'\n');
console.log('BODY', body.slice(0,260));
p.close();
