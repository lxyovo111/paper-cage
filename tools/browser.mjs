// tools/browser.mjs — 附着用户 Edge，支持 OOPIF sessionId
import fs from 'node:fs';

export async function connect() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const t = list.find(x => x.type === 'page') || list[0];
  if (!t) throw new Error('no page target');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); }
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    const msg = { id: i, method, params }; if (sessionId) msg.sessionId = sessionId;
    ws.send(JSON.stringify(msg));
  });
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (expr, sessionId) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + ((r.exceptionDetails.exception || {}).description || ''));
    return r.result.value;
  };
  const shot = async (file) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); return file; };
  const goto = async (url, waitMs = 3000) => { await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, waitMs)); };
  const attachFrame = async (match) => {
    const tg = await send('Target.getTargets');
    const f = tg.targetInfos.find(x => x.type === 'iframe' && (x.url || '').includes(match));
    if (!f) return null;
    const a = await send('Target.attachToTarget', { targetId: f.targetId, flatten: true });
    await send('Runtime.enable', {}, a.sessionId);
    return { sessionId: a.sessionId, url: f.url };
  };
  return { send, ev, shot, goto, attachFrame, close: () => ws.close(), target: t };
}
