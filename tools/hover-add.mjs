import { attach } from './attach.mjs';
const p = await attach('modelscope');
const box = await p.ev("(()=>{const e=[...document.querySelectorAll('.antd5-dropdown-trigger')].find(x=>/添加文件/.test(x.innerText||'')); if(!e) return null; const r=e.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});})()");
console.log('box', box);
if (!box || box === 'null') { p.close(); process.exit(0); }
const b = JSON.parse(box);
await p.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:b.x, y:b.y, button:'none' });
await new Promise(r=>setTimeout(r,1200));
const menu = await p.ev("JSON.stringify({menus:[...document.querySelectorAll('[class*=dropdown],[class*=menu]')].filter(e=>e.offsetParent).map(e=>(e.className+':'+(e.innerText||'').replace(/\\s+/g,'|')).slice(0,120))})");
console.log('menu', menu);
p.close();