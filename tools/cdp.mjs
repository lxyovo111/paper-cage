import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch({ port = 9223, dir = 'C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-profile', w = 1600, h = 1000, scale = 2 } = {}) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--hide-scrollbars', '--force-device-scale-factor=' + scale, '--window-size=' + w + ',' + h,
    '--remote-debugging-port=' + port, '--user-data-dir=' + dir, 'about:blank'], { stdio: 'ignore' });
  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + port + '/json/list');
      const list = await r.json();
      target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl) || null;
    } catch (_) {}
    if (!target) await sleep(200);
  }
  if (!target) { proc.kill(); throw new Error('chrome not reachable'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else if (m.method) listeners.forEach(f => f(m));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const on = f => listeners.push(f);
  const page = {
    proc, ws, send, on,
    async init() {
      await send('Page.enable'); await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile: false });
      await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 30, g: 26, b: 22, a: 1 } });
    },
    async goto(url) {
      const loaded = new Promise(res => { const f = m => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(f), 1); res(); } }; on(f); });
      await send('Page.navigate', { url });
      await Promise.race([loaded, sleep(8000)]);
      await sleep(600);
    },
    async ev(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('EVAL: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async shot(file) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
      return file;
    },
    async close() { try { ws.close(); } catch (_) {} try { proc.kill(); } catch (_) {} },
  };
  return page;
}
export { sleep };
