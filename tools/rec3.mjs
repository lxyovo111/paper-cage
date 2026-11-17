// rec3.mjs — 线上录屏（Page.captureScreenshot 定频）。take a: 写规矩+AI校准+两夜；take b: 六条规矩快进到判决书
// 用法: node tools/rec3.mjs <outDir> <a|b> [port] [url] [seed]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = process.argv[2] || 'tools/r3-a';
const TAKE = process.argv[3] || 'a';
const PORT = +(process.argv[4] || 9271);
const URL_ = process.argv[5] || 'https://modelscope.cn/studios/lxyovo/six-rules';
const SEED = process.argv[6] || '';
const FPS = 12;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--window-size=1600,1100', '--remote-debugging-port=' + PORT,
  '--user-data-dir=C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-rec3', 'about:blank'], { stdio: 'ignore' });
let ver = null;
for (let i = 0; i < 120 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); } catch (_) { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(JSON.stringify(d.error))) : p.res(d.result); } };
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); const msg = { id: i, method, params }; if (sessionId) msg.sessionId = sessionId; ws.send(JSON.stringify(msg)); });

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
const page = list.find((t) => t.type === 'page');
const pa = await send('Target.attachToTarget', { targetId: page.id, flatten: true });
const pageSes = pa.sessionId;
await send('Page.enable', {}, pageSes);
await send('Runtime.enable', {}, pageSes);
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false }, pageSes);
await send('Page.navigate', { url: URL_ }, pageSes);

const LOCAL = URL_.indexOf('127.0.0.1') >= 0 || URL_.indexOf('localhost') >= 0;
let frameSes = null;
if (LOCAL) {
  frameSes = pageSes;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const r0 = await send('Runtime.evaluate', { expression: '!!(window.__game && window.__game.view)', returnByValue: true }, pageSes);
    if (r0.result && r0.result.value) break;
  }
} else {
  for (let i = 0; i < 90 && !frameSes; i++) {
    await sleep(1000);
    const t = await send('Target.getTargets');
    const f = t.targetInfos.find((x) => (x.url || '').includes('/play'));
    if (f) { const a = await send('Target.attachToTarget', { targetId: f.targetId, flatten: true }); frameSes = a.sessionId; }
  }
  if (!frameSes) { console.log('NO FRAME TARGET'); await send('Browser.close'); proc.kill(); process.exit(1); }
  await send('Runtime.enable', {}, frameSes);
  await sleep(2500);
  const evPage = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, pageSes); return r.result ? r.result.value : null; };
  await evPage('(()=>{const st=document.createElement("style"); st.textContent="header,[class*=header]{display:none!important} .iframeResizer___U3wJg,iframe#game-frame{position:fixed!important;top:0!important;left:0!important;width:1600px!important;height:1000px!important;z-index:99999!important;border:0!important} html,body{overflow:hidden!important;background:#161210!important;margin:0!important}"; document.head.appendChild(st); document.body.style.overflow="hidden"; return 1;})()');
  await sleep(1500);
}
if (LOCAL) await sleep(1200);

const evo = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, frameSes); if (r.exceptionDetails) return 'EX ' + String(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text).slice(0, 160); return r.result ? r.result.value : null; };
const click = (sel) => evo('(()=>{const e=document.querySelector(' + JSON.stringify(sel) + '); if(!e) return "no"; e.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window})); return "ok";})()');
const state = () => evo('JSON.stringify({phase:(window.__game&&window.__game.view)?window.__game.view.phase:null,day:(window.__game&&window.__game.g)?window.__game.g.day:null,rules:(window.__game&&window.__game.g)?window.__game.g.rules.length:null,ap:(window.__game&&window.__game.g)?window.__game.g.ap:null,aiTag:!!document.querySelector(".ai-tag"),pend:!!document.querySelector(".ai-pend"),lines:document.querySelectorAll("#report-live text").length,overlay:!!document.querySelector(".sheet"),sick:!!document.querySelector(".chip[data-k=sick]")})');
const reportTexts = () => evo('JSON.stringify([...document.querySelectorAll("#report-live text")].map(t=>t.textContent))');
const setRuleText = (txt) => evo('(()=>{const t=document.querySelector("#rtxt"); if(!t) return "no"; t.value=' + JSON.stringify(txt) + '; t.dispatchEvent(new Event("input",{bubbles:true})); return "ok";})()');

let running = true; const stamps = []; const marks = [];
const t0base = Date.now();
const mark = (name) => { marks.push({ name, t: +((Date.now() - t0base) / 1000).toFixed(2) }); };
const capLoop = (async () => {
  while (running) {
    const t0 = Date.now();
    try {
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }, pageSes);
      fs.writeFileSync(path.join(OUT, String(stamps.length).padStart(5, '0') + '.jpg'), Buffer.from(r.data, 'base64'));
      stamps.push(Date.now() - t0base);
    } catch (_) {}
    const dt = Date.now() - t0;
    if (dt < 1000 / FPS) await sleep(Math.max(1, Math.round(1000 / FPS) - dt));
  }
})();
await sleep(1200);
if (SEED) { const rs = await evo('(()=>{const u=new URL(location.href); u.searchParams.set("seed","' + SEED + '"); history.replaceState(null,"",u.pathname+u.search); window.__game.newGame(); return location.search;})()'); console.log('seed', rs); await sleep(1500); }
console.log('S0', await state());

async function watchNight(tag, maxMs) {
  const t0 = Date.now(); let block = null; let texts = [];
  while (Date.now() - t0 < maxMs) {
    const st = JSON.parse((await state()) || '{}');
    if (st.lines) { try { texts = JSON.parse(await reportTexts() || '[]'); } catch (_) {} const b = texts.find((t) => t && t.indexOf('：') >= 0 && t.indexOf('「') >= 0); if (b && !block) { block = b; mark('block-' + tag); console.log('BLOCK ' + tag + ' ' + b); } }
    if (st.phase !== 'night' && Date.now() - t0 > 1500) break;
    await sleep(300);
  }
  return { tag, texts, block };
}

async function writeOne(text, waitAi) {
  const w = await click('[data-act=write]');
  if (w !== 'ok') return 'no-slot';
  await sleep(650);
  await setRuleText(text);
  await sleep(350);
  await click('[data-k=compile]');
  await sleep(500);
  if (waitAi) {
    let tagAt = null;
    for (let i = 0; i < 50; i++) { await sleep(300); const st = JSON.parse((await state()) || '{}'); if (st.aiTag) { tagAt = (i * 0.3).toFixed(1); break; } }
    mark('ai-tag'); console.log('aiTag', tagAt === null ? 'never' : tagAt + 's');
    await sleep(1600);
  } else { await sleep(600); }
  const r = await click('[data-k=ok]');
  await sleep(1200);
  return r;
}

if (TAKE === 'a') {
  // 第一天：三条窄规矩堵死洗衣房/储藏室/食堂 → 只剩医务室的窗通着
  mark('day1');
  console.log('w1', await writeOne('夜里任何人不得进入洗衣房', true));
  console.log('w2', await writeOne('夜里任何人不得进入储藏室', false));
  console.log('w3', await writeOne('夜里任何人不得进入食堂', false));
  mark('rules3'); await sleep(900);
  mark('night'); console.log('night', await click('[data-act=night]'));
  await sleep(900);
  console.log('skip1', await click('[data-k=skip]'));
  const n1 = await watchNight('n1', 45000);
  mark('day2'); await sleep(2800);
  // 第二天：堵住医务室的位移 → 他昨天踩过的窗，今天过不去了
  console.log('w4', await writeOne('夜里任何人不得进入医务室', false));
  await sleep(600);
  mark('night2'); console.log('night2', await click('[data-act=night]'));
  await sleep(900);
  console.log('skip2', await click('[data-k=skip]'));
  const n2 = await watchNight('n2', 45000);
  mark('day3'); await sleep(2800);
  console.log('N1', JSON.stringify(n1.texts));
  console.log('N2', JSON.stringify(n2.texts));
} else if (TAKE === 'b') {
  const PLAN = [
    ['洗衣房的床单，夜里不许取走', '工具间的铁器，全天不许取走', '储藏室的麻绳，任何时候都不许碰'],
    ['食堂的刀，任何时候不许取走', '医务室的窗，任何时候都不许碰', '走廊的通风口，任何时候都不许碰'],
  ];
  for (let round = 0; round < 16; round++) {
    let s = JSON.parse((await state()) || '{}');
    if (s.phase === 'settle') { console.log('settle at round', round); break; }
    if (s.sick) { await click('.chip[data-id="treat"]'); await sleep(800); s = JSON.parse((await state()) || '{}'); }
    if (s.overlay && !s.sick) { await click('[data-k=skip]'); await sleep(600); }
    const day = s.day;
    if (day <= 2 && PLAN[day - 1]) {
      for (const t of PLAN[day - 1]) { console.log('write d' + day, t, await writeOne(t)); }
    }
    s = JSON.parse((await state()) || '{}');
    if (s.phase === 'settle') break;
    console.log('night day', s.day, await click('[data-act=night]'));
    await sleep(800);
    const sk = await click('[data-k=skip]');
    if (sk !== 'ok') { await sleep(500); await click('[data-k=skip]'); }
    const t0 = Date.now();
    while (Date.now() - t0 < 45000) { const q = JSON.parse((await state()) || '{}'); if (q.phase !== 'night' && Date.now() - t0 > 2000) break; await sleep(400); }
    await sleep(900);
    mark('day' + (s.day + 1));
  }
  await sleep(2800);
  mark('settle-shown');
  const ledger = await evo('JSON.stringify([...document.querySelectorAll("svg text")].map(t=>t.textContent).filter(t=>t&&t.indexOf("AI ‖")>=0))');
  console.log('LEDGER', ledger);
  console.log('S_END', await state());
} else {
  console.log('unknown take');
}

await sleep(1200);
running = false;
await capLoop;
fs.writeFileSync(path.join(OUT, '_stamps.json'), JSON.stringify({ take: TAKE, fps: FPS, frames: stamps.length, marks, stamps }, null, 0));
console.log('frames', stamps.length, 'dur', ((Date.now() - t0base) / 1000).toFixed(1) + 's');
await send('Browser.close').catch(() => {});
proc.kill();
