import { connect } from './browser.mjs';
const OUT = 'C:/Users/lcj/Desktop/tap/six-rules/tools/';
const c = await connect();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await c.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await c.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&intro=0&speed=0.02', 2400);
await sleep(1800);
const coach = await c.ev("!!document.getElementById('coach')");
console.log('coach shown', coach);
if (coach) console.log('shot', await c.shot(OUT + 'v-coach-desktop.png'));
if (coach) { await c.ev("document.querySelector('#coach [data-k=coach-skip]').click(); 1"); await sleep(200); }
console.log('coach after skip', await c.ev("!!document.getElementById('coach')"));
for (let d = 1; d <= 7; d++) {
  const st = await c.ev('JSON.stringify({day:window.__game.g.day,phase:window.__game.view.phase,rules:window.__game.g.rules.length,nights:window.__game.g.nights.length})');
  console.log('before', d, st);
  if (JSON.parse(st).phase === 'settle') break;
  await c.ev('window.__game.askNight()');
  await sleep(300);
  const hasSkip = await c.ev("!!document.querySelector('[data-k=skip]')");
  if (!hasSkip) {
    await c.ev('window.__game.askWrite()');
    await sleep(200);
    await c.ev("document.querySelector('#rtxt').value = '夜里任何人不得进入医务室。'; 1");
    await c.ev("document.querySelector('.sheet .btn.primary').click(); 1");
    await sleep(300);
    await c.ev("document.querySelector('.sheet .btn.primary').click(); 1");
    await sleep(300);
    await c.ev('window.__game.askNight()');
    await sleep(300);
  }
  const hasSkip2 = await c.ev("!!document.querySelector('[data-k=skip]')");
  if (hasSkip2) await c.ev("document.querySelector('[data-k=skip]').click(); 1");
  await sleep(3500);
  const sick = await c.ev("!!document.querySelector('[data-k=sick]')");
  if (sick) { await c.ev("document.querySelector('[data-k=sick]').click(); 1"); await sleep(300); }
}
await sleep(800);
console.log('final', await c.ev('JSON.stringify({day:window.__game.g.day,phase:window.__game.view.phase,nights:window.__game.g.nights.length,escaped:window.__game.g.escaped})'));
const rb = await c.ev("!!document.getElementById('review-btn')");
console.log('review button', rb);
if (rb) { await c.ev("document.getElementById('review-btn').click(); 1"); await sleep(500);
  console.log('shot', await c.shot(OUT + 'v-review-desktop.png'));
  console.log(await c.ev("(function(){var s=document.querySelector('.sheet');return s?s.innerText.slice(0,1400):'NO SHEET';})()"));
}
c.close();