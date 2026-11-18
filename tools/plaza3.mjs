import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9403;
const dir = 'C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza';
const proc = spawn(EDGE, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1000','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'], { stdio:'ignore' });
let t=null;
for (let i=0;i<60&&!t;i++){ try{ const l=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json(); t=l.find(x=>x.type==='page'); }catch(_){} if(!t) await sleep(200); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0; const pend=new Map();
ws.onmessage = m => { const d=JSON.parse(m.data); if(d.id&&pend.has(d.id)){const {res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);} };
const send=(method,params={},sid)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});const msg={id:i,method,params};if(sid)msg.sessionId=sid;ws.send(JSON.stringify(msg));});
const ev=async(expr,sid)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},sid);if(r.exceptionDetails)throw new Error(r.exceptionDetails.text+' '+((r.exceptionDetails.exception||{}).description||''));return r.result.value;};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'https://mseo-ai-inf.ms.show/works'});
await sleep(10000);
const tg = await send('Target.getTargets');
console.log('TARGETS '+JSON.stringify(tg.targetInfos.filter(x=>(x.url||'').includes('mseo')).map(x=>({type:x.type,url:x.url.slice(0,90)}))));
const f = tg.targetInfos.find(x=>(x.url||'').includes('mseo-ai-inf.ms.show') && x.type==='iframe');
const a = await send('Target.attachToTarget',{targetId:f.targetId,flatten:true});
const sid=a.sessionId; await send('Runtime.enable',{},sid); await sleep(2000);
const info = await ev(`(() => {
  const txt=document.body.innerText;
  const links=[...document.querySelectorAll('a')].map(a=>({h:a.getAttribute('href'),t:(a.innerText||'').trim().slice(0,80)})).filter(x=>x.h);
  return {url:location.href,title:document.title,txt:txt.slice(0,4000),links:links.slice(0,120),len:txt.length};
})()`,sid);
console.log(JSON.stringify(info,null,1).slice(0,9000));
const shot = await send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\plaza-top.png', Buffer.from(shot.data,'base64'));
try{ws.close();}catch(_){}; try{proc.kill();}catch(_){}
