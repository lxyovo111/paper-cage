import { attach } from './attach.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
await p.send('Page.navigate',{url:'https://modelscope.cn/active/AIstudio'}); await sleep(9000);
const tg = await p.send('Target.getTargets');
const fs2 = tg.targetInfos.filter(x=>(x.url||'').includes('mseo-ai-inf'));
console.log('TARGETS', JSON.stringify(fs2.map(x=>({type:x.type,url:x.url.slice(0,90)}))));
const f = fs2.find(x=>x.type==='iframe');
if(!f){console.log('NO_IFRAME');process.exit(0);}
const a = await p.send('Target.attachToTarget',{targetId:f.targetId,flatten:true});
const sid=a.sessionId;
const send=(m,q)=>p.send(m,q,sid);
await send('Runtime.enable');
const ev=async js=>{const r=await send('Runtime.evaluate',{expression:js,returnByValue:true});return r.result&&r.result.value;};
console.log('URL', await ev('location.href'));
console.log('HEAD', String(await ev('document.body.innerText')).replace(/[\r\n]+/g,' | ').slice(0,400));
p.close();