import { spawn } from 'node:child_process';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EDGE='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port=9420, dir='C:\\Users\\lcj\\Desktop\\tap\\edge-cdp';
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1200','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
let t=null; for(let i=0;i<80&&!t;i++){try{const l=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();t=l.find(x=>x.type==='page');}catch(_){} if(!t)await sleep(250);}
if(!t){console.log('NO_TARGET');process.exit(1);}
const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0;const pend=new Map();
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend.has(d.id)){const{res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result);}};
const send=(method,params={})=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method,params}));});
const ev=async(expr)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails).slice(0,300));return r.result.value;};
await send('Page.enable');await send('Runtime.enable');
await send('Page.navigate',{url:'https://modelscope.cn/my/overview'}); await sleep(8000);
const st=await ev('(()=>{const b=document.body.innerText;return {url:location.href,head:b.slice(0,300),hasLogin:b.indexOf("登 录")>=0||b.indexOf("登录")>=0};})()');
console.log(JSON.stringify(st).slice(0,800));
try{ws.close();}catch(_){};try{proc.kill();}catch(_){}