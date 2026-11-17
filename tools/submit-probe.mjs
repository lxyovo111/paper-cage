import { attach } from './attach.mjs';
const p = await attach('modelscope');
await new Promise(r=>setTimeout(r,300));
await p.goto('https://modelscope.cn/active/AIstudio');
await new Promise(r=>setTimeout(r,4000));
const tabs = await p.ev("(()=>[...document.querySelectorAll('a,div,li,span')].filter(x=>x.innerText&&x.innerText.trim()==='作品提交').map(x=>({tag:x.tagName,cls:(x.className||'').toString().slice(0,40),href:x.getAttribute&&x.getAttribute('href')})).slice(0,6))()");
console.log('TABS', JSON.stringify(tabs));
const r = await p.ev("(()=>{const el=[...document.querySelectorAll('a,div,li,span')].filter(x=>x.innerText&&x.innerText.trim()==='作品提交')[0];if(!el)return null;const b=el.getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)};})()");
console.log('pos', JSON.stringify(r));
if (r) { await p.send('Input.dispatchMouseEvent', {type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1}); await p.send('Input.dispatchMouseEvent', {type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1}); }
await new Promise(r=>setTimeout(r,4000));
console.log('URL', await p.ev('location.href'));
await p.shot('tools/sub-01.png');
console.log('BODY', await p.ev("(()=>document.body.innerText.replace(/\\n{2,}/g,'\\n').slice(0,1500))()"));
p.close();
