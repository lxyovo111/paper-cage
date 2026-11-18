import { attach } from './attach.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
await p.send('Page.navigate',{url:'https://modelscope.cn/studios/lxyovo/six-rules/settings'}); await sleep(7000);
const cand = await p.ev('(()=>{const out=[];document.querySelectorAll("*").forEach(e=>{const t=(e.innerText||"").trim();if(t!=="重新部署")return;const b=e.getBoundingClientRect();if(!b.width)return;out.push({tag:e.tagName,cls:e.className,x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),w:Math.round(b.width),h:Math.round(b.height)});});return JSON.stringify(out);})()');
console.log('CAND', cand);
await p.shot('redeploy-before.png');
const c = JSON.parse(String(cand))[0];
if(c){ await p.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:c.x,y:c.y,button:'none'}); await sleep(300); await p.send('Input.dispatchMouseEvent',{type:'mousePressed',x:c.x,y:c.y,button:'left',clickCount:1}); await sleep(120); await p.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:c.x,y:c.y,button:'left',clickCount:1}); }
await sleep(4000);
console.log('AFTER-URL', await p.ev('location.href'));
console.log('BODY', String(await p.ev('document.body.innerText')).replace(/[\r\n]+/g,' | ').slice(0,900));
await p.shot('redeploy-after.png');
p.close();