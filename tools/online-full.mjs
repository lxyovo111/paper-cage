
import fs from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=9222;
async function clean(){
  const list=await (await fetch('http://127.0.0.1:'+PORT+'/json/list')).json();
  for(const t of list){ if(t.type==='page'||t.type==='iframe'){ try{await fetch('http://127.0.0.1:'+PORT+'/json/close/'+t.id);}catch(e){} } }
  await sleep(1200);
  const nt=await (await fetch('http://127.0.0.1:'+PORT+'/json/new?about:blank',{method:'PUT'})).json();
  const ws=new WebSocket(nt.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
  let id=0;const pend=new Map();const errors=[];
  ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.method==='Runtime.exceptionThrown'){errors.push((d.params.exceptionDetails.exception||{}).description||d.params.exceptionDetails.text);}if(d.id&&pend.has(d.id)){const {res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);}};
  const send=(method,params={},sessionId)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});const msg={id:i,method,params};if(sessionId)msg.sessionId=sessionId;ws.send(JSON.stringify(msg));});
  await send('Page.enable');await send('Runtime.enable');
  const ev=async(expr,sessionId)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true,userGesture:true},sessionId);if(r.exceptionDetails)throw new Error(r.exceptionDetails.text+' '+((r.exceptionDetails.exception||{}).description||''));return r.result.value;};
  const shot=async(file)=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(file,Buffer.from(r.data,'base64'));return file;};
  return {send,ev,shot,errors,close:()=>ws.close()};
}
const b=await clean();
const app='%2Fplay%3Fseed%3D8%26llm%3D1%26intro%3D0%26speed%3D0.02';
const url='https://www.modelscope.cn/studios/lxyovo/six-rules?mode=full&app_path='+app;
await b.send('Page.navigate',{url});
let frame=null;
for(let i=0;i<60;i++){
  const tg=await b.send('Target.getTargets');
  const fs_=tg.targetInfos.filter(x=>x.type==='iframe'&&x.url.includes('ms.show/play'));
  if(fs_.length){frame=fs_[fs_.length-1];break;}
  await sleep(700);
}
if(!frame){console.log('NO-FRAME');process.exit(2);}
const a=await b.send('Target.attachToTarget',{targetId:frame.targetId,flatten:true});
const S=a.sessionId;await b.send('Runtime.enable',{},S);
const wait=async(expr,ms,label)=>{const t0=Date.now();while(Date.now()-t0<ms){try{if(await b.ev(expr,S))return true;}catch(e){}await sleep(350);}console.log('TIMEOUT',label||expr);return false;};
console.log('FRAME',frame.url);
await wait('!!(window.__game&&window.__game.view)',30000,'boot');
const out={};
out.markers=await b.ev('JSON.stringify({why:document.body.innerText.includes("行动依据"),coachText:(document.querySelector("#coach")||{}).innerText||"",hasCoach:!!document.querySelector("#coach")})',S);
console.log('MARKERS',out.markers);
await b.shot('C:/Users/lcj/Desktop/tap/six-rules/tools/online-day1.png');
// coach visible; skip it
await b.ev('(()=>{const b=document.querySelector("#coach [data-k=coach-skip],#coach .btn");if(b)b.click();return !!b;})()',S);
await sleep(400);
out.coachAfterSkip=await b.ev('!!document.querySelector("#coach")',S);
// write rule through UI
await b.ev('window.__game.askWrite()',S);
await sleep(400);
await b.ev('document.querySelector("#rtxt").value="入夜后，任何人不得离开自己的房间。";1',S);
await b.ev('[...document.querySelectorAll(".sheet .btn")].find(x=>x.textContent.includes("归")||x.textContent.includes("档")).click();1',S);
await wait('!!document.querySelector(".sheet") && document.querySelector(".sheet").innerText.includes("对象")',15000,'verdict');
await sleep(1200);
out.verdict=await b.ev('document.querySelector(".sheet").innerText.slice(0,900)',S);
await b.shot('C:/Users/lcj/Desktop/tap/six-rules/tools/online-verdict.png');
await b.ev('document.querySelector(".sheet .btn.primary").click();1',S);
await sleep(500);
out.ruleAfterWrite=await b.ev('JSON.stringify((window.__game.g.rules||[]).map(r=>({text:r.text,note:r.note,boundary:r.lang.boundary,subject:r.lang.subject})))',S);
console.log('RULE',out.ruleAfterWrite);
// night 1
await b.ev('window.__game.askNight()',S);
await wait('!!document.querySelector("[data-k=skip]")',10000,'skip1');
await b.ev('document.querySelector("[data-k=skip]").click()',S);
await wait('window.__game.g.day>=2 && window.__game.view.phase==="day"',90000,'day2');
out.day2=await b.ev('JSON.stringify({day:window.__game.g.day,phase:window.__game.view.phase,nights:window.__game.g.nights.length,report:(window.__game.view.report||[])})',S);
console.log('DAY2',String(out.day2).slice(0,800));
// why sheet
await b.ev('document.querySelector("[data-act=why]").dispatchEvent(new MouseEvent("click",{bubbles:true}));1',S);
await sleep(600);
out.why=await b.ev('(document.querySelector(".sheet")||{}).innerText||""',S);
await b.shot('C:/Users/lcj/Desktop/tap/six-rules/tools/online-why.png');
await b.ev('document.querySelector("[data-k=why-close]").click();1',S);
await sleep(400);
// map locate via first report line
out.reportLocs=await b.ev('JSON.stringify([...document.querySelectorAll("[data-act=locate]")].map(x=>x.dataset.room))',S);
await b.ev('document.querySelector("[data-act=locate]").dispatchEvent(new MouseEvent("click",{bubbles:true}));1',S);
await sleep(500);
out.spot=await b.ev('JSON.stringify({spot:!!document.querySelector("#room-spot"),toast:(document.querySelector(".toast")||{}).innerText||""})',S);
await b.shot('C:/Users/lcj/Desktop/tap/six-rules/tools/online-maploc.png');
// finish game
for(let n=0;n<10;n++){
  const ph=await b.ev('window.__game.view.phase',S);
  if(ph==='settle')break;
  if(await b.ev('!!document.querySelector("#review-btn")',S))break;
  await b.ev('window.__game.askNight()',S);
  const opened=await wait('!!document.querySelector("[data-k=skip]")',10000,'skip'+n);
  if(opened){await b.ev('document.querySelector("[data-k=skip]").click()',S);}
  await sleep(600);
  // dismiss any modal choice (sick / inspection)
  const modal=await b.ev('(function(){var s=document.querySelector(".sheet");if(!s)return null;var t=s.innerText.slice(0,400);var btn=s.querySelector(".btn.primary")||s.querySelector(".btn");if(btn)btn.click();return t;})()',S);
  if(modal)console.log('MODAL',n,String(modal).slice(0,200));
  await wait('window.__game.view.phase!=="night"',60000,'nightend'+n);
}
out.final=await b.ev('JSON.stringify({day:window.__game.g.day,phase:window.__game.view.phase,escaped:window.__game.g.escaped,nights:window.__game.g.nights.length,outcomes:window.__game.g.nights.map(n=>n.outcome),reviewBtn:!!document.querySelector("#review-btn")})',S);
console.log('FINAL',out.final);
if(await b.ev('!!document.querySelector("#review-btn")',S)){
  await b.ev('document.querySelector("#review-btn").click()',S);
  await sleep(600);
  out.review=await b.ev('(document.querySelector(".sheet")||{}).innerText||""',S);
  await b.shot('C:/Users/lcj/Desktop/tap/six-rules/tools/online-review.png');
}
out.errors=b.errors.slice(0,6);
fs.writeFileSync('C:/Users/lcj/Desktop/tap/six-rules/tools/online-full-result.json',JSON.stringify(out,null,1));
console.log('ERRORS',JSON.stringify(out.errors));
b.close();process.exit(0);
