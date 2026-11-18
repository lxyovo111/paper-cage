import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=9406, dir='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza';
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1000','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
let t=null; for(let i=0;i<60&&!t;i++){try{const l=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();t=l.find(x=>x.type==='page');}catch(_){} if(!t)await sleep(200);}
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const{res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);}};
const send=(method,params={},sid)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});const msg={id:i,method,params};if(sid)msg.sessionId=sid;ws.send(JSON.stringify(msg));});
const ev=async(expr,sid)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},sid);if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails).slice(0,400));return r.result.value;};
const frame=async()=>{const tg=await send('Target.getTargets');return tg.targetInfos.find(x=>(x.url||'').includes('mseo-ai-inf.ms.show')&&x.type==='iframe');};
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'https://mseo-ai-inf.ms.show/works'}); await sleep(9000);
let f=await frame(); let a=await send('Target.attachToTarget',{targetId:f.targetId,flatten:true}); let sid=a.sessionId; await send('Runtime.enable',{},sid); await sleep(1000);
await ev(`(()=>{const els=[...document.querySelectorAll('button')].filter(e=>(e.innerText||'').trim()==='最热');if(els[0])els[0].click();})()`,sid);
await sleep(3000);
f=await frame(); a=await send('Target.attachToTarget',{targetId:f.targetId,flatten:true}); sid=a.sessionId; await send('Runtime.enable',{},sid); await sleep(800);
const info = await ev(`(()=>{
  const out={};
  const leaf=[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&(e.innerText||'').trim()==='8747');
  if(leaf[0]){ let p=leaf[0]; const chain=[]; for(let i=0;i<6&&p;i++){ chain.push({tag:p.tagName,cls:String(p.className).slice(0,80),html:p.outerHTML.slice(0,1500)}); p=p.parentElement; } out.chain=chain; }
  const title=[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&(e.innerText||'').trim()==='人样');
  if(title[0]){ let p=title[0]; const c2=[]; for(let i=0;i<5&&p;i++){ c2.push({tag:p.tagName,cls:String(p.className).slice(0,80),html:p.outerHTML.slice(0,1200)}); p=p.parentElement;} out.title=c2; }
  return out;
})()`,sid);
console.log(JSON.stringify(info,null,1).slice(0,9000));
try{ws.close();}catch(_){};try{proc.kill();}catch(_){}
