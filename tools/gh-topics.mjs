import { connect } from './browser.mjs';
const b = await connect();
const t = await b.send('Target.createTarget', { url: 'about:blank' });
const a = await b.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sid = a.sessionId;
await b.send('Page.enable', {}, sid);
await b.send('Runtime.enable', {}, sid);
await b.send('Page.navigate', { url: 'https://github.com/lxyovo111/seventh-night' }, sid);
await new Promise(r=>setTimeout(r,6500));
await b.ev("(()=>{const c=[...document.querySelectorAll('button')].find(e=>(e.getAttribute('aria-label')||'').toLowerCase().includes('metadata'));if(c)c.click();return true;})()", sid);
await new Promise(r=>setTimeout(r,2500));
const box = await b.ev("(()=>{const el=document.querySelector('input[placeholder=\"Add topics\"]');if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()", sid);
console.log('BOX', JSON.stringify(box));
if(box){
  for(const tag of ['ai-game','llm','game-jam','modelscope','svg']){
    await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x:box.x,y:box.y,button:'left',clickCount:1},sid);
    await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x,y:box.y,button:'left',clickCount:1},sid);
    await b.send('Input.insertText',{text:tag},sid);
    await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13},sid);
    await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13},sid);
    await new Promise(r=>setTimeout(r,700));
  }
  const chips = await b.ev("(()=>[...document.querySelectorAll('form.js-topic-form span, form.js-topic-form .js-issue-topic-chip')].map(e=>e.innerText.trim()).filter(Boolean))()", sid);
  console.log('CHIPS', JSON.stringify(chips));
  const sv = await b.ev("(()=>{const el=[...document.querySelectorAll('button')].find(e=>e.innerText.trim().toLowerCase()==='save changes');if(!el)return {ok:false};el.click();return {ok:true};})()", sid);
  console.log('SAVE', JSON.stringify(sv));
  await new Promise(r=>setTimeout(r,5000));
}
const t2=await (await fetch('https://github.com/lxyovo111/seventh-night',{headers:{'user-agent':'Mozilla/5.0'}})).text();
const topics=[...t2.matchAll(/data-octo-dimensions="topic:([^"]+)"/g)].map(x=>x[1]);
console.log('TOPICS_AFTER', JSON.stringify(topics));
await b.shot('tools/gh-repo-after.png');
b.close();
