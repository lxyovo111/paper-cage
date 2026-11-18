import { attach } from './attach.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
await p.send('Page.navigate',{url:'https://modelscope.cn/studios/lxyovo/six-rules/settings'}); await sleep(7000);
const r1 = await p.ev('(()=>{const c=[...document.querySelectorAll("div")].filter(e=>(e.innerText||"").trim()==="重新部署" && e.getBoundingClientRect().width>100);if(!c.length)return "none";c[0].click();return "ok";})()');
console.log('BANNER', r1);
await sleep(4500);
const r2 = await p.ev('(()=>{const b=[...document.querySelectorAll("button")].find(x=>(x.innerText||"").replace(/\s+/g,"")==="确认部署");if(!b)return "nobtn";b.click();return "ok";})()');
console.log('CONFIRM', r2);
for(let i=0;i<20;i++){await sleep(2000);const t=await p.ev('document.body.innerText');const m=t.match(/构建中|部署中|发布中|排队中|运行中/);console.log(i,m?m[0]:null);if(m&&/构建中|部署中|发布中|排队中/.test(m[0]))break;}
p.close();