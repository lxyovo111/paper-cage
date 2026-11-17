import { attach } from './attach.mjs';
const file = process.argv[2];
const p = await attach('modelscope');
await p.send('DOM.enable');
const r = await p.send('Runtime.evaluate', { expression: "document.querySelector('input[type=file]')" });
if (!r.result || !r.result.objectId) { console.log('NO-FILE-INPUT'); process.exit(1); }
await p.send('DOM.setFileInputFiles', { objectId: r.result.objectId, files: [file] });
await new Promise(x => setTimeout(x, 2500));
const info = await p.ev("JSON.stringify({imgs: [...document.querySelectorAll('img')].map(i=>i.src).filter(s=>s.startsWith('data:')||s.includes('cover')).slice(0,3), txt: document.body.innerText.includes('请上传封面图') ? 'still-need-cover' : 'ok'})");
console.log(info);
p.close();