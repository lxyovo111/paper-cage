// tools/attach.mjs — 附着到用户已开的 Edge（9222），提供 goto/ev/shot/click
import fs from 'node:fs';

async function list() {
  const r = await fetch('http://127.0.0.1:9222/json/list');
  return await r.json();
}

export async function attach(match = 'modelscope') {
  let targets = await list();
  let t = targets.find(x => x.type === 'page' && (x.url || '').includes(match));
  if (!t) t = targets.find(x => x.type === 'page');
  if (!t) throw new Error('no page target');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pend = new Map();
  const events = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); }
    else if (d.method) events.push(d);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  return {
    target: t,
    send,
    events,
    ev: async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || '')); return r.result.value; },
    goto: async (url) => { await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, 2500)); },
    shot: async (file) => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); return file; },
    close: () => ws.close(),
  };
}

if (process.argv[1] && process.argv[1].endsWith('attach.mjs')) {
  const t = await list();
  console.log(t.filter(x => x.type === 'page').map(x => x.url).join('\n'));
}