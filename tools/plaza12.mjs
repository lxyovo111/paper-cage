import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=9412, dir='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza3';
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1200','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
let t=null; for(let i=0;i<60&&!t;i++){try{const l=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();t=l.find(x=>x.type==='page');}catch(_){} if(!t)await sleep(200);}
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const{res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);}};
const send=(method,params={},sid)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});const msg={id:i,method,params};if(sid)msg.sessionId=sid;ws.send(JSON.stringify(msg));});
const ev=async(expr,sid)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},sid);if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails).slice(0,300));return r.result.value;};
const frame=async()=>{const tg=await send('Target.getTargets');return tg.targetInfos.find(x=>(x.url||'').includes('mseo-ai-inf.ms.show')&&x.type==='iframe');};
const attach=async()=>{const f=await frame();const a=await send('Target.attachToTarget',{targetId:f.targetId,flatten:true});await send('Runtime.enable',{},a.sessionId);return a.sessionId;};
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1200,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'https://mseo-ai-inf.ms.show/works'}); await sleep(8500);
let sid=await attach(); await sleep(600);
await ev('(()=>{const els=[...document.querySelectorAll("button")].filter(e=>(e.innerText||"").trim()==="最热");if(els[0])els[0].click();})()',sid);
await sleep(3000);
sid=await attach(); await sleep(400);
// click the studio summary block of first card
const res = await ev(`(()=>{
  const ar=document.querySelector('article[data-work-id]');
  const blk=ar.querySelector('div[class*="bg-\\[#F8F6FF\\]"]');
  if(!blk) return 'no block';
  const a=blk.querySelector('a'); if(a) return 'anchor:'+a.href;
  blk.click();
  return 'clicked';
})()`,sid);
console.log('ACT '+res);
await sleep(4000);
const tg=await send('Target.getTargets');
console.log('TARGETS '+JSON.stringify(tg.targetInfos.filter(x=>x.type==='page'||x.type==='iframe').map(x=>({type:x.type,url:(x.url||'').slice(0,140)})),null,1));
try{ws.close();}catch(_){};try{proc.kill();}catch(_){}
