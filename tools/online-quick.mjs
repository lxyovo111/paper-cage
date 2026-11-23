
import fs from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=9222;
const list=await (await fetch('http://127.0.0.1:'+PORT+'/json/list')).json();
for(const t of list){ if(t.type==='page'||t.type==='iframe'){ try{await fetch('http://127.0.0.1:'+PORT+'/json/close/'+t.id);}catch(e){} } }
await sleep(1200);
const nt=await (await fetch('http://127.0.0.1:'+PORT+'/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(nt.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const {res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);}};
const send=(method,params={},sessionId)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});const msg={id:i,method,params};if(sessionId)msg.sessionId=sessionId;ws.send(JSON.stringify(msg));});
await send('Page.enable');await send('Runtime.enable');
const ev=async(expr,sessionId)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true,userGesture:true},sessionId);if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;};
const shot=async(file)=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(file,Buffer.from(r.data,'base64'));return file;};
const app='%2Fplay%3Fseed%3D8%26llm%3D1%26intro%3D0%26speed%3D0.02';
await send('Page.navigate',{url:'https://www.modelscope.cn/studios/lxyovo/six-rules?mode=full&app_path='+app});
let frame=null;
for(let i=0;i<60;i++){const tg=await send('Target.getTargets');const fs_=tg.targetInfos.filter(x=>x.type==='iframe'&&x.url.includes('ms.show/play'));if(fs_.length){frame=fs_[fs_.length-1];break;}await sleep(700);}
if(!frame){console.log('NO-FRAME');process.exit(2);}
const a=await send('Target.attachToTarget',{targetId:frame.targetId,flatten:true});const S=a.sessionId;await send('Runtime.enable',{},S);
const wait=async(expr,ms,label)=>{const t0=Date.now();while(Date.now()-t0<ms){try{if(await ev(expr,S))return true;}catch(e){}await sleep(400);}console.log('TIMEOUT',label);return false;};
await wait('!!(window.__game&&window.__game.view)',30000,'boot');
await sleep(1800);
const coach=await ev('(function(){var c=document.querySelector("#coach");if(!c)return null;return {text:c.innerText,rect:(function(r){return {x:r.x,y:r.y,w:r.width,h:r.height};})(c.getBoundingClientRect()),buttons:[...c.querySelectorAll("button")].map(b=>b.innerText)};})()',S);
console.log('COACH',JSON.stringify(coach));
await shot('C:/Users/lcj/Desktop/tap/six-rules/tools/online-coach.png');
const skip=await ev('(function(){var c=document.querySelector("#coach");if(!c)return false;var b=[...c.querySelectorAll("button")].find(x=>x.innerText.includes("跳过"));if(!b)return false;b.click();return true;})()',S);
await sleep(400);
console.log('SKIP',skip,'GONE',await ev('!document.querySelector("#coach")',S));
await ev('window.__game.askWrite()',S);
await sleep(400);
await ev('document.querySelector("#rtxt").value="晚上不许去医务室";1',S);
await ev('[...document.querySelectorAll(".sheet .btn")].find(x=>x.textContent.includes("归")||x.textContent.includes("档")).click();1',S);
const got=await wait('!!document.querySelector(".sheet") && (document.querySelector(".sheet").innerText.includes("AI 已校准")||document.querySelector(".sheet").innerText.includes("AI 校准"))',30000,'ai-calibrated');
const txt=await ev('(document.querySelector(".sheet")||{}).innerText||""',S);
console.log('CALIB',got);
console.log(txt.slice(0,1200));
await shot('C:/Users/lcj/Desktop/tap/six-rules/tools/online-calibrated.png');
process.exit(0);
