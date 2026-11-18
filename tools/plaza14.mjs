import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=9414, dir='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza4';
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
for (const idx of [0,1,2]) {
  await send('Page.navigate',{url:'https://mseo-ai-inf.ms.show/works'}); await sleep(8000);
  let sid=await attach(); await sleep(600);
  await ev('(()=>{const els=[...document.querySelectorAll("button")].filter(e=>(e.innerText||"").trim()==="最热");if(els[0])els[0].click();})()',sid);
  await sleep(3000);
  sid=await attach(); await sleep(400);
  const clicked = await ev('(()=>{const arts=[...document.querySelectorAll("article[data-work-id]")];const ar=arts['+idx+'];const b=[...ar.querySelectorAll("button")].find(x=>(x.innerText||"").trim()==="评论");if(!b)return "nobtn";b.click();return (ar.querySelector("h3")||{}).innerText;})()',sid);
  await sleep(2500);
  sid=await attach(); await sleep(400);
  const modal = await ev('(()=>{const txt=document.body.innerText;const links=[...document.querySelectorAll("a")].map(a=>a.href).filter(h=>/modelscope.cn\/studios|ms.show/.test(h));return {txt:txt.slice(-2600),links:[...new Set(links)].slice(0,10)};})()',sid);
  const shot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync('C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\plaza-modal-'+idx+'.png',Buffer.from(shot.data,'base64'));
  console.log('=== '+idx+' '+clicked+'\n'+JSON.stringify(modal,null,1).slice(0,2600));
  await ev('(()=>{const b=[...document.querySelectorAll("button")].find(x=>/关闭|取消/.test((x.innerText||"").trim()));if(b)b.click();return 1;})()',sid);
}
try{ws.close();}catch(_){};try{proc.kill();}catch(_){}
