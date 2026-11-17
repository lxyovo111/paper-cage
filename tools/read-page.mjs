// read-page.mjs — 在用户已登录的 Edge 里新开一个标签页读正文，读完关掉，不动原标签页。
import { attach } from './attach.mjs';
const url = process.argv[2];
const wait = +(process.argv[3] || 6000);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach('modelscope');
const t = await p.send('Target.createTarget', { url: 'about:blank' });
const n = await p.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sid = n.sessionId;
const send = (method, params) => p.send(method, params, sid);
await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url });
await sleep(wait);
const r = await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true });
console.log(String(r.result && r.result.value || '').slice(0, 12000));
await p.send('Target.closeTarget', { targetId: t.targetId });
p.close();
