import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=9404, dir='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza';
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1000','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
let t=null; for(let i=0;i<60&&!t;i++){try{const l=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();t=l.find(x=>x.type==='page');}catch(_){} if(!t)await sleep(200);}
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const{res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);}};
const send=(method,params={},sid)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});const msg={id:i,method,params};if(sid)msg.sessionId=sid;ws.send(JSON.stringify(msg));});
const ev=async(expr,sid)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},sid);if(r.exceptionDetails)throw new Error(r.exceptionDetails.text+' '+((r.exceptionDetails.exception||{}).description||''));return r.result.value;};
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'https://mseo-ai-inf.ms.show/works'}); await sleep(9000);
let tg=await send('Target.getTargets');
let f=tg.targetInfos.find(x=>(x.url||'').includes('mseo-ai-inf.ms.show')&&x.type==='iframe');
const a=await send('Target.attachToTarget',{targetId:f.targetId,flatten:true}); const sid=a.sessionId;
await send('Runtime.enable',{},sid); await sleep(1500);
// click 最热
const clicked = await ev(`(() => {
  const els=[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && (e.innerText||'').trim()==='最热');
  if(!els.length) return 'none';
  const el=els[0]; el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  return 'ok:'+el.tagName;
})()`,sid);
console.log('CLICK '+clicked);
await sleep(3500);
const dump = await ev(`(() => {
  const txt=document.body.innerText;
  // find repeated card containers: elements whose descendant text includes 运行中
  const all=[...document.querySelectorAll('div')];
  const cards=all.filter(d=>{const t=d.innerText||'';return t.includes('运行中')&&t.includes('评论')&&t.length<1200;});
  // keep smallest containers
  const small=cards.filter(d=>!cards.some(o=>o!==d&&d.contains(o)));
  const out=small.map(c=>({cls:c.className, txt:(c.innerText||'').replace(/\n+/g,' | ').slice(0,300), html:c.outerHTML.slice(0,600)}));
  return {n:small.length, txt:txt.slice(0,2000), out:out.slice(0,3)};
})()`,sid);
console.log(JSON.stringify(dump,null,1).slice(0,7000));
const shot=await send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\plaza-hot.png',Buffer.from(shot.data,'base64'));
try{ws.close();}catch(_){};try{proc.kill();}catch(_){}
