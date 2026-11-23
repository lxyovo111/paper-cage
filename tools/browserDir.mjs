import fs from 'node:fs';
export async function connectUrl(url, port = 9222) {
  const nt = await (await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent(url), {method:'PUT'})).json();
  const t = nt;
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); const msg = { id: i, method, params }; if (sessionId) msg.sessionId = sessionId; ws.send(JSON.stringify(msg)); });
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (expr, sessionId) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true }, sessionId); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + ((r.exceptionDetails.exception || {}).description || '')); return r.result.value; };
  const shot = async (file) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); return file; };
  return { send, ev, shot, close: () => ws.close(), target: t };
}
export async function connect() { return connectUrl('about:blank'); }