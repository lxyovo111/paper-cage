import { attach } from './attach.mjs';
const files = process.argv.slice(2);
const p = await attach('modelscope');
await p.send('DOM.enable');
const box = await p.ev("(()=>{const e=[...document.querySelectorAll('.antd5-dropdown-trigger')].find(x=>/添加文件/.test(x.innerText||'')); if(!e) return null; const r=e.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2});})()");
if (!box || box === 'null') { console.log('NO-TRIGGER'); process.exit(1); }
const b = JSON.parse(String(box));
await p.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:b.x, y:b.y, button:'none' });
await new Promise(r=>setTimeout(r,900));
// 点“上传文件”
await p.ev("(()=>{const it=[...document.querySelectorAll('.antd5-dropdown-menu-item')].find(e=>/上传文件/.test(e.innerText||'')); if(it) it.click(); return !!it;})()");
await new Promise(r=>setTimeout(r,1200));
const doc = await p.send('Runtime.evaluate', { expression: "document.querySelector('input[type=file]')" });
if (!doc.result || !doc.result.objectId) { console.log('NO-INPUT-AFTER-MENU', await p.ev('document.body.innerText.slice(0,300)')); process.exit(1); }
await p.send('DOM.setFileInputFiles', { objectId: doc.result.objectId, files });
await new Promise(r=>setTimeout(r,3000));
console.log(await p.ev("JSON.stringify({txt: document.body.innerText.replace(/\\n{2,}/g,'\\n').slice(0,900)})"));
p.close();