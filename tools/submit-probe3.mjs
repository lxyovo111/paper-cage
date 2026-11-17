import { attach } from './attach.mjs';
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
console.log(list.filter(t=>t.type==='page').map(t=>t.url).join('\n'));
const p = await attach('modelscope');
console.log('TARGET', p.target.url);
const info = await p.ev("(()=>({title:document.title,elements:document.querySelectorAll('*').length,textLen:(document.body.textContent||'').length,iframes:[...document.querySelectorAll('iframe')].length,ready:document.readyState,login:(document.body.textContent||'').includes('登录')}))()");
console.log('INFO', JSON.stringify(info));
await p.shot('tools/sub-03.png');
p.close();
