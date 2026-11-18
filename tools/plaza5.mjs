import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=9405, dir='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza';
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1000','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
let t=null; for(let i=0;i<60&&!t;i++){try{const l=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();t=l.find(x=>x.type==='page');}catch(_){} if(!t)await sleep(200);}
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const{res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);}};
const send=(method,params={},sid)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});const msg={id:i,method,params};if(sid)msg.sessionId=sid;ws.send(JSON.stringify(msg));});
const evRaw=async(expr,sid)=>{try{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},sid);return {ok:true,v:r.result&&r.result.value,exc:r.exceptionDetails?JSON.stringify(r.exceptionDetails).slice(0,300):null};}catch(e){return {ok:false,err:String(e).slice(0,300)};}};
const frame=async()=>{const tg=await send('Target.getTargets');return tg.targetInfos.find(x=>(x.url||'').includes('mseo-ai-inf.ms.show')&&x.type==='iframe');};
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'https://mseo-ai-inf.ms.show/works'}); await sleep(9000);
let f=await frame(); let a=await send('Target.attachToTarget',{targetId:f.targetId,flatten:true}); let sid=a.sessionId;
await send('Runtime.enable',{},sid); await sleep(1200);
console.log('CLICK '+JSON.stringify(await evRaw(`(()=>{const els=[...document.querySelectorAll('button')].filter(e=>(e.innerText||'').trim()==='最热');if(!els.length)return 'none';els[0].click();return 'ok';})()`,sid)));
await sleep(3000);
f=await frame(); a=await send('Target.attachToTarget',{targetId:f.targetId,flatten:true}); sid=a.sessionId; await send('Runtime.enable',{},sid); await sleep(1000);
const r1=await evRaw(`(()=>{try{const txt=document.body.innerText;const all=[...document.querySelectorAll('div')];const cards=all.filter(d=>{const t=d.innerText||'';return t.indexOf('运行中')>=0 && t.indexOf('评论')>=0 && t.length<1500;});const small=cards.filter(d=>!cards.some(o=>o!==d&&d.contains(o)));return {n:small.length,head:txt.slice(0,600),one:(small[0]||{}).outerHTML?small[0].outerHTML.slice(0,1200):'none'};}catch(e){return {err:String(e)}}})()`,sid);
console.log('DUMP '+JSON.stringify(r1).slice(0,4000));
const shot=await send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\plaza-hot.png',Buffer.from(shot.data,'base64'));
try{ws.close();}catch(_){};try{proc.kill();}catch(_){}
