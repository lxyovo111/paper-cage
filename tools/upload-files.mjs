import { attach } from './attach.mjs';
const files = process.argv.slice(2);
const p = await attach('modelscope');
await p.send('DOM.enable');
const r = await p.send('Runtime.evaluate', { expression: "document.querySelector('input[type=file]')" });
if (!r.result || !r.result.objectId) { console.log('NO-FILE-INPUT'); process.exit(1); }
await p.send('DOM.setFileInputFiles', { objectId: r.result.objectId, files });
await new Promise(x => setTimeout(x, 6000));
const info = await p.ev("JSON.stringify({txt: document.body.innerText.replace(/\\n{2,}/g,'\\n').slice(0,1600)})");
console.log(info);
p.close();