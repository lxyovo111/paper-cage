import { spawn } from 'node:child_process';
import fs from 'node:fs';
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=9342;
const DIR='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\nightanim2';
fs.mkdirSync(DIR,{recursive:true});
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1000','--remote-debugging-port='+PORT,'--user-data-dir=C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-nanim2','about:blank'],{stdio:'ignore'});
let ver=null; for(let i=0;i<80&&!ver;i++){try{ver=await(await fetch('http://127.0.0.1:'+PORT+'/json/version')).json();}catch(_){await sleep(250);}}
const ws=new WebSocket(ver.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0; const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result);}};
const send=(method,params={},sessionId)=>new Promise((res,rej)=>{const i=++id;pending.set(i,{res,rej});const msg={id:i,method,params};if(sessionId)msg.sessionId=sessionId;ws.send(JSON.stringify(msg));});
const {targetId}=await send('Target.createTarget',{url:'about:blank'});
const root=await send('Target.attachToTarget',{targetId,flatten:true}); const S=root.sessionId;
await send('Page.enable',{},S); await send('Runtime.enable',{},S);
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false},S);
await send('Page.navigate',{url:'http://127.0.0.1:7861/dist/index.html?intro=0&llm=0&seed=9'},S);
await sleep(3500);
const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},S); if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0,240)); return r.result.value;};
await ev('(()=>{const b=document.querySelector("[data-act=night]");b.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));})()');
await sleep(400);
await ev('(()=>{const b=document.querySelector("[data-k=skip]");b.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));})()');
for (let i=0;i<10;i++){
  await sleep(450);
  const info=await ev('(()=>{const t=document.querySelector(".nptok"); if(!t) return JSON.stringify({no:1}); const r=t.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width)},null,0);})()');
  console.log('S'+i, info);
  if(i===1||i===3||i===5){const shot=await send('Page.captureScreenshot',{format:'png'},S); fs.writeFileSync(DIR+'\\f'+i+'.png',Buffer.from(shot.data,'base64'));}
  if(i===7){await ev('(()=>{const t=document.querySelector(".nptok"); return t?getComputedStyle(t).opacity:"?";})()');}
}
try{ws.close();}catch(_){} proc.kill();
console.log('DONE');