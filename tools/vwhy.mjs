import { connect } from './browser.mjs';
const OUT = 'C:/Users/lcj/Desktop/tap/six-rules/tools/';
const c = await connect();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, max) {
  const t0 = Date.now();
  while (Date.now() - t0 < (max || 45000)) {
    try { if (await c.ev('(' + fn + ')()')) return true; } catch (e) {}
    await sleep(500);
  }
  console.log('TIMEOUT', label);
  return false;
}
async function setup(w, h, mobile) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await c.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&intro=0', 2400);
  await waitFor('window.__game && window.__game.g', 'boot');
}
async function play(tag) {
  await c.ev('window.__game.askWrite()');
  await sleep(300);
  await c.ev("document.querySelector('#rtxt').value = '入夜后，任何人不得离开自己的房间。'; 1");
  await c.ev("document.querySelector('.sheet .btn.primary').click(); 1");
  await sleep(600);
  await c.ev("document.querySelector('.sheet .btn.primary').click(); 1");
  await sleep(500);
  await c.ev('window.__game.askNight()');
  await sleep(500);
  await c.ev("document.querySelector('[data-k=skip]').click(); 1");
  const ok = await waitFor('window.__game.g.day >= 2 && window.__game.view.phase === "day"', tag + ' day2', 60000);
  console.log(tag, 'day2', ok, await c.ev('JSON.stringify({day:window.__game.g.day,phase:window.__game.view.phase,nights:window.__game.g.nights.length})'));
  await c.ev("document.querySelector('[data-act=why]').dispatchEvent(new MouseEvent('click',{bubbles:true})); 1");
  await sleep(500);
  const info = await c.ev("(function(){var s=document.querySelector('.sheet'); if(!s) return {none:true}; var r=s.getBoundingClientRect(); return {text:s.innerText.slice(0,1600), rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, scroll:{h:s.scrollHeight,ch:s.clientHeight}};})()");
  console.log(tag, JSON.stringify(info, null, 1));
  console.log('shot', await c.shot(OUT + 'v-why-' + tag + '.png'));
}
await setup(1600, 1000, false);
await play('desktop');
await setup(390, 844, true);
await play('mobile');
c.close();