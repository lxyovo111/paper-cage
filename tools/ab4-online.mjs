
import fs from 'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=9222;
const RULES=[
 '夜里任何人不得进入医务室。',
 '放风区的墙，任何时候都不许碰。',
 '储藏室的麻绳，任何时候不许取走。'
];
async function clean(){
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
  return {send,ev,close:()=>ws.close()};
}
async function attach(b,llm,seed){
  const app='%2Fplay%3Fseed%3D'+seed+'%26llm%3D'+llm+'%26intro%3D0%26speed%3D0.02';
  await b.send('Page.navigate',{url:'https://www.modelscope.cn/studios/lxyovo/six-rules?mode=full&app_path='+app});
  for(let i=0;i<60;i++){
    const tg=await b.send('Target.getTargets');
    const fs_=tg.targetInfos.filter(x=>x.type==='iframe'&&x.url.includes('ms.show/play'));
    if(fs_.length){
      const f=fs_[fs_.length-1];const a=await b.send('Target.attachToTarget',{targetId:f.targetId,flatten:true});
      await b.send('Runtime.enable',{},a.sessionId);return a.sessionId;
    }
    await sleep(700);
  }
  return null;
}
async function run(b,label,llm,useRules){
  const S=await attach(b,llm,8);
  if(!S){console.log('NO-FRAME',label);return null;}
  const wait=async(expr,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){try{if(await b.ev(expr,S))return true;}catch(e){}await sleep(400);}return false;};
  if(!await wait('!!(window.__game&&window.__game.view)',30000)){console.log('NO-BOOT',label);return null;}
  if(useRules){
    const inj=await b.ev('(()=>{const G=window.__game;const out=[];for(const text of '+JSON.stringify(RULES)+'){const c=G.E.compileRule(text);const w=G.E.writeRule(G.g,text,c);out.push({text,ok:w.ok,note:w.note});}return JSON.stringify(out);})()',S);
    console.log('INJ',label,inj);
  }
  const nights=[];
  for(let n=1;n<=4;n++){
    const before=await b.ev('window.__game.g.nights.length',S);
    await b.ev('window.__game.askNight()',S);
    if(!await wait('!!document.querySelector("[data-k=skip]")',10000)){console.log('NO-SKIP',label,n);break;}
    await b.ev('document.querySelector("[data-k=skip]").click()',S);
    const done=await wait('window.__game.g.nights.length>'+before+' && window.__game.view.phase!=="night"',90000);
    if(!done){console.log('NO-DONE',label,n);break;}
    const rec=JSON.parse(await b.ev('JSON.stringify(window.__game.g.nights[window.__game.g.nights.length-1])',S));
    nights.push({day:rec.day,routeName:rec.routeName,reason:rec.reason||'',outcome:rec.outcome,steps:(rec.trace||[]).length,blocked:(rec.trace||[]).filter(t=>t.verdict==='blocked').length,leaked:(rec.trace||[]).filter(t=>t.verdict==='leaked').length});
    console.log('NIGHT',label,n,rec.routeName,rec.outcome,'reason',(rec.reason||'').slice(0,40));
    if(await b.ev('window.__game.view.phase',S)==='settle')break;
  }
  return {label,llm,rules:useRules,nights};
}
const groups=[['A-ai-rules',1,true],['B-noai-rules',0,true],['C-ai-norules',1,false],['D-noai-norules',0,false]];
const res=[];
for(const g of groups){
  const b=await clean();
  const one=await run(b,g[0],g[1],g[2]);
  res.push(one);
  b.close();
  await sleep(1500);
}
fs.writeFileSync('C:/Users/lcj/Desktop/tap/six-rules/tools/ab4-result.json',JSON.stringify(res,null,1));
console.log('DONE');process.exit(0);
