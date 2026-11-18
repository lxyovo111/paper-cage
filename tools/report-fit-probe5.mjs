import { spawn } from 'node:child_process';
import fs from 'node:fs';
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=9347; const DIR='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\reportfit4';
fs.mkdirSync(DIR,{recursive:true});
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1000','--remote-debugging-port='+PORT,'--user-data-dir=C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-rfit5','about:blank'],{stdio:'ignore'});
let ver=null; for(let i=0;i<80&&!ver;i++){try{ver=await(await fetch('http://127.0.0.1:'+PORT+'/json/version')).json();}catch(_){await sleep(250);}}
const ws=new WebSocket(ver.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0; const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result);}};
const send=(method,params={},sid)=>new Promise((res,rej)=>{const i=++id;pending.set(i,{res,rej});const msg={id:i,method,params};if(sid)msg.sessionId=sid;ws.send(JSON.stringify(msg));});
const {targetId}=await send('Target.createTarget',{url:'about:blank'});
const root=await send('Target.attachToTarget',{targetId,flatten:true}); const S=root.sessionId;
await send('Page.enable',{},S); await send('Runtime.enable',{},S);
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false},S);
await send('Page.navigate',{url:'http://127.0.0.1:7861/dist/index.html?intro=0&llm=0&seed=9'},S);
await sleep(3200);
const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},S); if(r.exceptionDetails) return 'ERR '+JSON.stringify(r.exceptionDetails).slice(0,200); return r.result.value;};
console.log('SET', await ev('(()=>{const G=window.__game; G.g.day=4; G.g.tutorialPending=false; G.g.ap=9; G.g.progress=null; ["夜里任何人不得进入医务室","夜里任何人不得进入放风区","夜里任何人不得进入走廊"].forEach(function(t){ try{ G.E.writeRule(G.g,t); }catch(e){} }); G.syncView&&G.syncView(); return JSON.stringify({day:G.g.day});})()'));
await ev('(()=>{document.querySelector("[data-act=night]").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));})()');
await sleep(600);
await ev('(()=>{const b=document.querySelector("[data-k=skip]"); if(!b) return "noskip"; b.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window})); return "ok";})()');
let best={n:-1,shot:null};
for(let k=0;k<24;k++){ await sleep(400);
  const st=await ev('(()=>{const live=document.querySelector("#report-live"); const svg=document.querySelector("#screen svg"); const phase=(window.__game&&window.__game.view)?window.__game.view.phase:null; if(!live) return JSON.stringify({phase,missing:true}); const gs=[...live.children]; const ts=gs.map(g=>[...g.querySelectorAll("text")].map(t=>({s:t.textContent,fs:t.getAttribute("font-size"),y:t.getAttribute("y")}))); return JSON.stringify({phase,n:gs.length,ts});})()');
  let o; try{o=JSON.parse(st);}catch(_){o={raw:st};}
  if(o.n>best.n){ best={n:o.n,shot:null,items:o.ts}; const s=await send('Page.captureScreenshot',{format:'png'},S); const p=DIR+'\\desk-'+k+'.png'; fs.writeFileSync(p,Buffer.from(s.data,'base64')); best.shot=p; }
  console.log('T'+String(k).padStart(2,'0'), st);
  if(o.phase==='day' && k>6) break; }
console.log('BEST', JSON.stringify(best));
try{ws.close();}catch(_){} proc.kill(); console.log('DONE');