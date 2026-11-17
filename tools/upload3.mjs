import { attach } from './attach.mjs';
const files = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
await p.send('DOM.enable');
console.log('url', await p.ev('location.href'));
const box = await p.ev("(()=>{const e=[...document.querySelectorAll('.antd5-dropdown-trigger')].find(x=>/添加文件/.test(x.innerText||'')); if(!e) return null; const r=e.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});})()");
if (!box || box === 'null') { console.log('NO-TRIGGER'); console.log(await p.ev('document.body.innerText.slice(0,600)')); process.exit(1); }
const b = JSON.parse(String(box));
await p.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:b.x, y:b.y, button:'none' });
await sleep(900);
console.log('menu', await p.ev("[...document.querySelectorAll('.antd5-dropdown-menu-item')].map(e=>e.innerText.trim()).join('|')"));
await p.ev("(()=>{const it=[...document.querySelectorAll('.antd5-dropdown-menu-item')].find(e=>/上传文件/.test(e.innerText||'')); if(it) it.click(); return !!it;})()");
await sleep(1200);
const doc = await p.send('Runtime.evaluate', { expression: "document.querySelector('input[type=file]')" });
if (!doc.result || !doc.result.objectId) { console.log('NO-INPUT'); process.exit(1); }
await p.send('DOM.setFileInputFiles', { objectId: doc.result.objectId, files });
await sleep(1500);
// 点击模态框底部的“上传文件”确认按钮
const clicked = await p.ev("(()=>{const bs=[...document.querySelectorAll('.antd5-modal button, .antd5-drawer button, button')].filter(x=>/^上传文件$/.test((x.innerText||'').trim())); if(!bs.length) return 'no-btn'; for (const b of bs) { if (b.offsetParent) { b.click(); return 'clicked'; } } return 'hidden';})()");
console.log('confirm', clicked);
for (let i = 0; i < 20; i++) { await sleep(1500); const t = await p.ev('document.body.innerText.slice(0,900)'); if (/提交|成功|重新部署/.test(t)) { console.log('TXT', t.replace(/\n{2,}/g,'\n').slice(0,700)); break; } if (i === 19) console.log('TIMEOUT', t.slice(0,400)); }
p.close();