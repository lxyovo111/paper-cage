import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = +(process.argv[4] || 9251);
const OUT = process.argv[2] || 'tools/live-frames';
const TAKE = process.argv[3] || 'a';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--force-device-scale-factor=2', '--window-size=1600,1000', '--remote-debugging-port=' + PORT,
  '--user-data-dir=C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-rec', 'about:blank'], { stdio: 'ignore' });
let ver = null;
for (let i = 0; i < 80 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); } catch (_) { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0; const pending = new Map();
ws.onmessage = m => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const { res, rej } = pending.get(d.id); pending.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); return; }
  if (d.method === 'Page.screencastFrame') onFrame(d);
};
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, { res, rej });
  const msg = { id: i, method, params }; if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
});

fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const stamps = [];
function onFrame(d) {
  const p = d.params;
  const n = String(stamps.length).padStart(5, '0');
  fs.writeFileSync(path.join(OUT, n + '.jpg'), Buffer.from(p.data, 'base64'));
  stamps.push(Date.now() - t0);
  send('Page.screencastFrameAck', { sessionId: p.sessionId }, d.sessionId).catch(() => {});
}

// 打开创空间页面，等 /play iframe 出现
const { targetId } = await send('Target.createTarget', { url: 'https://modelscope.cn/studios/lxyovo/six-rules' });
const { sessionId: pageSes } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, pageSes);
await send('Runtime.enable', {}, pageSes);
let frameSes = null, frameTarget = null;
for (let i = 0; i < 40 && !frameSes; i++) {
  await sleep(1000);
  const t = await send('Target.getTargets');
  const f = t.targetInfos.find(x => (x.url || '').includes('/play'));
  if (f) { const a = await send('Target.attachToTarget', { targetId: f.targetId, flatten: true }); frameSes = a.sessionId; frameTarget = f; }
}
if (!frameSes) { console.log('NO FRAME'); await send('Browser.close'); process.exit(1); }
await send('Page.enable', {}, frameSes);
await send('Runtime.enable', {}, frameSes);
await sleep(1500);

const evo = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, frameSes);
  if (r.exceptionDetails) return { err: String(r.exceptionDetails.text || '').slice(0, 120) };
  return r.result ? r.result.value : null;
};
const click = sel => evo('(()=>{const e=document.querySelector(' + JSON.stringify(sel) + '); if(!e) return "no"; e.click(); return "ok";})()');
const state = () => evo('JSON.stringify({phase: window.__game && window.__game.view ? window.__game.view.phase : null, day: window.__game && window.__game.g ? window.__game.g.day : null, aiTag: !!document.querySelector(".ai-tag"), lines: document.querySelectorAll("#report-live text").length, texts: (document.body.innerText||"").slice(0,0)})');

await send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1600, maxHeight: 1000, everyNthFrame: 1 }, frameSes);
console.log('recording, frame url =', frameTarget.url);
await sleep(2500);

if (TAKE === 'a') {
  // 第一天：写一条规矩（含 AI 校准）
  await click('[data-act=write]');
  await sleep(900);
  const rule = '夜里任何人不得离开自己的房间';
  for (const ch of rule) {
    await evo('(()=>{const e=document.querySelector("#rtxt"); if(!e) return 0; e.value += ' + JSON.stringify(ch) + '; e.dispatchEvent(new Event("input",{bubbles:true})); return 1;})()');
    await sleep(95);
  }
  await sleep(400);
  await click('[data-k=compile]');
  let tagAt = null;
  for (let i = 0; i < 60; i++) { await sleep(500); const s = JSON.parse(await state()); if (s.aiTag) { tagAt = i; break; } }
  console.log('aiTag after', tagAt === null ? 'never' : (tagAt * 0.5) + 's');
  await sleep(1200);
  await click('[data-k=ok]');
  await sleep(1400);
  await click('[data-act=night]');
  await sleep(1200);
  await click('.chip[data-k=pred]');
  // 等夜里的报告打完
  for (let i = 0; i < 60; i++) { await sleep(500); const s = JSON.parse(await state()); if (s.lines >= 3) { await sleep(2500); break; } }
  console.log('REPORT', await evo('JSON.stringify({route: window.__game && window.__game.view ? (window.__game.lastRoute||null) : null, lines: [...document.querySelectorAll("#report-live text")].map(t=>t.textContent)})'));
  await sleep(1500);
} else if (TAKE === 'b') {
  // 快进到结算：连点入夜，每次都跳过预判
  for (let d = 0; d < 9; d++) {
    const s = JSON.parse(await state() || '{}');
    if (s.phase === 'settle') break;
    const w = await click('[data-act=write]');
    if (w === 'ok') { await sleep(500); await click('[data-k=ok]'); await sleep(600); }
    await click('[data-act=night]');
    await sleep(900);
    await click('.chip[data-k=skip]');
    for (let i = 0; i < 40; i++) { await sleep(500); const q = JSON.parse(await state() || '{}'); if (q.phase !== 'night') break; }
  }
  await sleep(2500);
}

await send('Page.stopScreencast', {}, frameSes);
fs.writeFileSync(path.join(OUT, '_stamps.json'), JSON.stringify({ take: TAKE, t0, stamps, url: frameTarget.url }));
console.log('frames', stamps.length, 'dur', ((Date.now() - t0) / 1000).toFixed(1) + 's');
await send('Browser.close');
proc.kill();