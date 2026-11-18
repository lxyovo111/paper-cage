import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=9416, dir='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza5';
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
await send('Page.navigate',{url:'https://mseo-ai-inf.ms.show/works'}); await sleep(8000);
let sid=await attach(); await sleep(600);
const search = await ev('(()=>{const inp=[...document.querySelectorAll("input")].find(i=>(i.placeholder||"").indexOf("搜索")>=0);if(!inp)return "noinput";inp.focus();const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;setter.call(inp,"第七夜");inp.dispatchEvent(new Event("input",{bubbles:true}));return "typed";})()',sid);
await sleep(3500);
sid=await attach(); await sleep(400);
const res = await ev('(()=>{const arts=[...document.querySelectorAll("article[data-work-id]")];return {n:arts.length,titles:arts.map(a=>(a.querySelector("h3")||{}).innerText||""),txt:document.body.innerText.slice(0,400)};})()',sid);
console.log('SEARCH '+search+' '+JSON.stringify(res));
// our studio page stats
await send('Page.navigate',{url:'https://modelscope.cn/studios/lxyovo/six-rules'}); await sleep(9000);
const stat = await ev('(()=>{const b=document.body.innerText;return b.slice(0,700);})()');
console.log('STUDIO '+JSON.stringify(stat));
try{ws.close();}catch(_){};try{proc.kill();}catch(_){}
