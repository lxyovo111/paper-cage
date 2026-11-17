import { spawn } from 'node:child_process';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PORT = 9241;
const proc = spawn(EDGE, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--force-device-scale-factor=2','--window-size=1600,1000','--remote-debugging-port='+PORT,
  '--user-data-dir=C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-probe','about:blank'], { stdio: 'ignore' });
let ver = null;
for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:'+PORT+'/json/version')).json(); } catch(_) { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map(); const sessions = []; const bySession = new Map();
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const {res,rej} = pending.get(m.id); pending.delete(m.id); if (m.error) rej(new Error(JSON.stringify(m.error))); else res(m.result); return; }
  if (m.method === 'Target.attachedToTarget') { bySession.set(m.params.sessionId, m.params.targetInfo); }
};
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, {res, rej});
  const msg = { id: i, method, params }; if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
});
await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
const { targetId } = await send('Target.createTarget', { url: 'https://modelscope.cn/studios/lxyovo/six-rules' });
const list = await send('Target.getTargets');
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);
await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, sessionId);
const aa = await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, sessionId).catch(e => String(e));
console.log('autoattach page:', JSON.stringify(aa).slice(0, 120));
await sleep(14000);
const t2 = await send('Target.getTargets');
console.log('targets:', JSON.stringify(t2.targetInfos.map(t => (t.type + ' ' + (t.url||'').slice(0, 50)))));
const ifr = [];
for (const ti of t2.targetInfos) {
  if ((ti.url || '').includes('/play')) {
    const a = await send('Target.attachToTarget', { targetId: ti.targetId, flatten: true });
    await send('Runtime.enable', {}, a.sessionId);
    ifr.push([a.sessionId, ti]);
  }
}
console.log('iframes:', ifr.map(([, t]) => t.url).join(' | '));
for (const [sid] of ifr) {
  try {
    const r = await send('Runtime.evaluate', { expression: `JSON.stringify({
      href: location.href, ih: innerHeight, iw: innerWidth,
      scrollY: scrollY, sh: document.documentElement.scrollHeight,
      stage: (() => { const s = document.querySelector('#stage'); if (!s) return null; const b = s.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; })(),
      hasScreen: !!document.querySelector('#screen svg'),
      bodyText: (document.body.innerText||'').slice(0,60)
    })`, returnByValue: true }, sid);
    console.log('probe:', r.result.value);
  } catch (e) { console.log('ev err', String(e).slice(0, 160)); }
}
await send('Browser.close');
proc.kill();
