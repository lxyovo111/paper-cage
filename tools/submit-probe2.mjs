import { attach } from './attach.mjs';
const p = await attach('modelscope');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function clickAt(x, y) {
  await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}
await wait(500);
const r = await p.ev("(()=>{const el=[...document.querySelectorAll('a,div,li,span,button')].filter(x=>x.innerText&&x.innerText.trim()==='作品提交')[0];if(!el)return null;const b=el.getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)};})()");
console.log('pos', JSON.stringify(r));
if (r) { await clickAt(r.x, r.y); }
await wait(5000);
console.log('URL', await p.ev('location.href'));
await p.shot('tools/sub-02.png');
console.log('BODY', await p.ev("(()=>document.body.innerText.replace(/\\n{2,}/g,'\\n').slice(0,1200))()"));
p.close();
