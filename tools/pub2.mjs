import { connect } from './browser.mjs';
const b = await connect();
const t = await b.send('Target.createTarget', { url: 'about:blank' });
const a = await b.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sid = a.sessionId;
await b.send('Page.enable', {}, sid);
await b.send('Runtime.enable', {}, sid);
await b.send('Page.navigate', { url: 'https://modelscope.cn/learn/editor/438502' }, sid);
await new Promise(r=>setTimeout(r,10000));
const box = await b.ev("(()=>{let found=null;document.querySelectorAll('button').forEach((e)=>{if(e.innerText.indexOf('发')>=0&&e.innerText.indexOf('布')>=0){const r=e.getBoundingClientRect();found={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};}});return found;})()", sid);
console.log('BTN', JSON.stringify(box));
if(box){
  await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x:box.x,y:box.y,button:'left',clickCount:1},sid);
  await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x,y:box.y,button:'left',clickCount:1},sid);
}
await new Promise(r=>setTimeout(r,3000));
const dlg = await b.ev("(()=>({text:document.body.innerText.slice(-400),buttons:[...document.querySelectorAll('button')].map(e=>JSON.stringify(e.innerText)).slice(-8)}))()", sid);
console.log('DLG', JSON.stringify(dlg).slice(0,900));
await b.shot('tools/pub2.png');
b.close();
