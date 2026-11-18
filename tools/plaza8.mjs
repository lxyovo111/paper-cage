import { spawn } from 'node:child_process';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=9408, dir='C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza';
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1200','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
let t=null; for(let i=0;i<60&&!t;i++){try{const l=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();t=l.find(x=>x.type==='page');}catch(_){} if(!t)await sleep(200);}
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const{res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);}};
const send=(method,params={},sid)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});const msg={id:i,method,params};if(sid)msg.sessionId=sid;ws.send(JSON.stringify(msg));});
const ev=async(expr,sid)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true},sid);if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails).slice(0,300));return r.result.value;};
const frame=async()=>{const tg=await send('Target.getTargets');return tg.targetInfos.find(x=>(x.url||'').includes('mseo-ai-inf.ms.show')&&x.type==='iframe');};
const attach=async()=>{const f=await frame();const a=await send('Target.attachToTarget',{targetId:f.targetId,flatten:true});await send('Runtime.enable',{},a.sessionId);return a.sessionId;};
const extract=`(()=>{const arts=[...document.querySelectorAll('article[data-work-id]')];return arts.map(ar=>{const t=(ar.querySelector('h3')||{}).innerText||'';const ps=[...ar.querySelectorAll('p')].map(p=>(p.innerText||'').trim());const sp=[...ar.querySelectorAll('span')].map(s=>(s.innerText||'').trim()).filter(Boolean);const views=sp.find(s=>/^\d+$/.test(s))||'';const nums=sp.filter(s=>/^\d+$/.test(s));const date=(sp.find(s=>/^\d{4}\/\d+\/\d+$/.test(s))||'');return {title:t,author:ps[0]||'',desc:ps[1]||'',sub:ps[2]||'',views:nums[0]||'',likes:nums[1]||'',date};});})()`;
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1200,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'https://mseo-ai-inf.ms.show/works'}); await sleep(9000);
let sid=await attach(); await sleep(800);
await ev(`(()=>{const els=[...document.querySelectorAll('button')].filter(e=>(e.innerText||'').trim()==='最热');if(els[0])els[0].click();})()`,sid);
await sleep(3500);
sid=await attach(); await sleep(600);
const shot=await send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\plaza-hot.png',Buffer.from(shot.data,'base64'));
const all=[];
for(let page=1;page<=10;page++){
  sid=await attach(); await sleep(400);
  const rows=await ev(extract,sid);
  all.push(...rows.map(r=>({...r,page})));
  const next=await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>(e.innerText||'').trim()==='下一页');if(!b||b.disabled)return false;b.click();return true;})()`,sid);
  if(!next) break;
  await sleep(2600);
}
fs.writeFileSync('C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\plaza-hot-all.json',JSON.stringify(all,null,1));
const byViews=[...all].sort((a,b)=>(+b.views)-(+a.views));
console.log('TOTAL '+all.length);
console.log('TOP20 '+JSON.stringify(byViews.slice(0,20).map(x=>({t:x.title,v:x.views,l:x.likes,d:x.date,sub:x.sub})),null,0));
const kw={};
const kws=['AI','大模型','LLM','审讯','推理','解谜','经营','修仙','塔防','像素','3D','三消','节奏','卡牌','自走棋','视觉小说','对话','陪伴','恐怖','平台','Roguelike','模拟','剧情'];
for(const w of kws){kw[w]=all.filter(x=>((x.title+x.desc+x.sub).toLowerCase().includes(w.toLowerCase()))).length;}
console.log('KW '+JSON.stringify(kw));
const dates={}; all.forEach(x=>{dates[x.date]=(dates[x.date]||0)+1;});
console.log('DATES '+JSON.stringify(dates));
try{ws.close();}catch(_){};try{proc.kill();}catch(_){}
