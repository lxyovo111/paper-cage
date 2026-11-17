// rec2.mjs — 用 Page.captureScreenshot 定频抓帧（screencast 在 headless 多 target 下只出首帧）。
// 画面：把创空间页的平台外框隐藏，iframe 固定 1600x1000，直接截视口。
// 用法: node tools/rec2.mjs <outDir> <take:a|b|c> [port]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = process.argv[2] || 'tools/r2-a';
const TAKE = process.argv[3] || 'a';
const PORT = +(process.argv[4] || 9271);
const URL_ = process.argv[5] || 'https://modelscope.cn/studios/lxyovo/six-rules';
const FPS = 12;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--window-size=1600,1100', '--remote-debugging-port=' + PORT,
  '--user-data-dir=C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-rec2', 'about:blank'], { stdio: 'ignore' });
let ver = null;
for (let i = 0; i < 120 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); } catch (_) { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const { res, rej } = pending.get(d.id); pending.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } };
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, { res, rej });
  const msg = { id: i, method, params }; if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
});

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 用默认 page target（createTarget 出来的新标签在 headless 下不出帧）
const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
const page = list.find(t => t.type === 'page');
const { sessionId: pageSes } = await send('Target.attachToTarget', { targetId: page.id, flatten: true });
await send('Page.enable', {}, pageSes);
await send('Runtime.enable', {}, pageSes);
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false }, pageSes);
const evPageRaw = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true }, pageSes);
  return r.result ? r.result.value : null;
};
await send('Page.navigate', { url: URL_ }, pageSes);

let frameSes = URL_.includes('127.0.0.1') ? null : null;
if (URL_.includes('127.0.0.1')) {
  for (let i = 0; i < 40; i++) { await sleep(500); const ok = await evPageRaw('!!document.querySelector("[data-act=write]")'); if (ok) break; }
  frameSes = pageSes;
}
for (let i = 0; i < 60 && !frameSes; i++) {
  await sleep(1000);
  const t = await send('Target.getTargets');
  const f = t.targetInfos.find(x => (x.url || '').includes('/play'));
  if (f) { const a = await send('Target.attachToTarget', { targetId: f.targetId, flatten: true }); frameSes = a.sessionId; }
}
if (!frameSes) { console.log('NO FRAME TARGET'); await send('Browser.close'); proc.kill(); process.exit(1); }
await send('Runtime.enable', {}, frameSes);
await sleep(2500);

const evPage = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, pageSes);
  if (r.exceptionDetails) return 'EX ' + String(r.exceptionDetails.text || '').slice(0, 100);
  return r.result ? r.result.value : null;
};
const geo = URL_.includes('127.0.0.1') ? 'local' : await evPage(`(()=>{
  const st=document.createElement('style'); st.id='rec-fix';
  st.textContent="header,[class*=header]{display:none!important} .iframeResizer___U3wJg,iframe#game-frame{position:fixed!important;top:0!important;left:0!important;width:1600px!important;height:1000px!important;z-index:99999!important;border:0!important} html,body{overflow:hidden!important;background:#161210!important;margin:0!important}";
  document.head.appendChild(st);
  document.body.style.overflow='hidden';
  const f=document.querySelector('.iframeResizer___U3wJg')||document.querySelector('iframe');
  const r=f.getBoundingClientRect();
  return JSON.stringify({vw:innerWidth,vh:innerHeight,iframe:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},src:(f.src||'').slice(0,60)});
})()`);
console.log('geo', geo);
await sleep(2000);

const evo = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, frameSes);
  if (r.exceptionDetails) return 'EX ' + String(r.exceptionDetails.text || '').slice(0, 120);
  return r.result ? r.result.value : null;
};
const click = sel => evo('(()=>{const e=document.querySelector(' + JSON.stringify(sel) + '); if(!e) return "no"; e.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window})); return "ok";})()');
const state = () => evo('JSON.stringify({phase:(window.__game&&window.__game.view)?window.__game.view.phase:null,day:(window.__game&&window.__game.g)?window.__game.g.day:null,rules:(window.__game&&window.__game.g)?window.__game.g.rules.length:null,aiTag:!!document.querySelector(".ai-tag"),pend:!!document.querySelector(".ai-pend"),lines:document.querySelectorAll("#report-live text").length,overlay:!!document.querySelector(".sheet")})');
console.log('S0', await state());

let running = true; const stamps = []; const marks = [];
const t0base = Date.now();
const mark = (name) => { marks.push({ name, t: +((Date.now() - t0base) / 1000).toFixed(2) }); };
const capLoop = (async () => {
  while (running) {
    const t0 = Date.now();
    try {
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 }, pageSes);
      fs.writeFileSync(path.join(OUT, String(stamps.length).padStart(5, '0') + '.jpg'), Buffer.from(r.data, 'base64'));
      stamps.push(Date.now() - t0base);
    } catch (_) {}
    const dt = Date.now() - t0;
    if (dt < 1000 / FPS) await sleep(Math.max(1, Math.round(1000 / FPS) - dt));
  }
})();
await sleep(1200);
console.log('recording take', TAKE);

if (TAKE === 'a') {
  // 第一夜之前写一条窄规（医务室的窗），第二夜它就会把那条路堵住——报告里会引用这条规矩原文。
  mark('open-sheet'); console.log('click write', await click('[data-act=write]'));
  await sleep(800);
  const rule1 = '医务室的窗，任何时候都不许碰';
  for (const ch of rule1) {
    await evo('(()=>{const e=document.querySelector("#rtxt"); if(!e) return 0; e.value += ' + JSON.stringify(ch) + '; e.dispatchEvent(new Event("input",{bubbles:true})); return 1;})()');
    await sleep(100);
  }
  await sleep(400);
  mark('compile'); console.log('compile', await click('[data-k=compile]'));
  await sleep(500);
  console.log('S1', await state());
  let tagAt = null;
  for (let i = 0; i < 100; i++) { await sleep(500); const st = JSON.parse(await state()); if (st.aiTag) { tagAt = (i * 0.5).toFixed(1); break; } }
  mark('ai-tag'); console.log('aiTag', tagAt === null ? 'never' : tagAt + 's');
  await sleep(1800);
  mark('ok'); console.log('ok', await click('[data-k=ok]'));
  await sleep(1600);
  mark('night'); console.log('night', await click('[data-act=night]'));
  await sleep(1400);
  mark('pred'); console.log('pred', await click('.chip[data-k=pred]'));
  for (let i = 0; i < 90; i++) { await sleep(500); const st = JSON.parse(await state()); if (st.phase !== 'night') break; }
  await sleep(2500);
  mark('day2'); console.log('S2', await state());
  // 第二夜：他的进度在医务室，会撞上刚才那条规矩
  mark('night2'); await click('[data-act=night]');
  await sleep(1200);
  mark('pred2'); await click('[data-k=skip]');
  for (let i = 0; i < 120; i++) { await sleep(500); const st = JSON.parse(await state()); if (st.phase !== 'night') break; }
  await sleep(3500);
  mark('day3'); console.log('S3', await state());
  console.log('REPORT', await evo('JSON.stringify([...document.querySelectorAll("#report-live text")].map(t=>t.textContent))'));
  await sleep(1200);
} else if (TAKE === 'b') {
  for (let d = 0; d < 10; d++) {
    const s = JSON.parse((await state()) || '{}');
    if (s.phase === 'settle') { console.log('at settle', d); break; }
    console.log('day', s.day, 'rules', s.rules, 'phase', s.phase);
    const w = await click('[data-act=write]');
    if (w === 'ok') { await sleep(700); await click('[data-k=ok]'); await sleep(1100); }
    await click('[data-act=night]');
    await sleep(1200);
    await click('[data-k=skip]');
    for (let i = 0; i < 60; i++) { await sleep(500); const q = JSON.parse((await state()) || '{}'); if (q.phase !== 'night') break; }
    await sleep(800);
  }
  await sleep(2500);
  console.log('S_END', await state());
} else if (TAKE === 'c') {
  await click('[data-act=write]');
  await sleep(800);
  await click('[data-k=ok]');
  await sleep(1400);
  await click('[data-act=night]');
  await sleep(1400);
  await click('[data-k=skip]');
  for (let i = 0; i < 60; i++) { await sleep(500); const s = JSON.parse((await state()) || '{}'); if (s.lines >= 3) { await sleep(3500); break; } }
  console.log('REPORT', await evo('JSON.stringify([...document.querySelectorAll("#report-live text")].map(t=>t.textContent))'));
}

running = false;
await capLoop;
fs.writeFileSync(path.join(OUT, '_stamps.json'), JSON.stringify({ take: TAKE, fps: FPS, frames: stamps.length, marks, stamps }, null, 0));
console.log('frames', stamps.length, 'dur', ((Date.now() - t0base) / 1000).toFixed(1) + 's');
await send('Browser.close').catch(() => {});
proc.kill();
