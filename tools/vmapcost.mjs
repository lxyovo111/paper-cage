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
await c.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await c.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&intro=0', 2400);
await waitFor('window.__game && window.__game.g', 'boot');
await c.ev('window.__game.askWrite()');
await sleep(300);
await c.ev("document.querySelector('#rtxt').value = '入夜后，任何人不得离开自己的房间。'; 1");
await c.ev("document.querySelector('.sheet .btn.primary').click(); 1");
await sleep(600);
let info = await c.ev("(function(){var s=document.querySelector('.sheet');var r=s.getBoundingClientRect();return {text:s.innerText.slice(0,1200),rect:{w:Math.round(r.width),h:Math.round(r.height)},scroll:{h:s.scrollHeight,ch:s.clientHeight}};})()");
console.log('cost', JSON.stringify(info));
console.log('shot', await c.shot(OUT + 'v-cost-desktop.png'));
await c.ev("document.querySelector('.sheet .btn.primary').click(); 1");
await sleep(500);
await c.ev('window.__game.askNight()');
await sleep(500);
await c.ev("document.querySelector('[data-k=skip]').click(); 1");
const ok = await waitFor('window.__game.g.day >= 2 && window.__game.view.phase === "day"', 'day2', 60000);
console.log('day2', ok);
const loc = await c.ev("(function(){var gs=[].slice.call(document.querySelectorAll('[data-act=locate]')); return gs.map(function(g){return g.dataset.room;});})()");
console.log('locate targets', JSON.stringify(loc));
await c.ev("var g=document.querySelector('[data-act=locate]'); g.dispatchEvent(new MouseEvent('click',{bubbles:true})); 1");
await sleep(300);
const spot = await c.ev("!!document.querySelector('#room-spot')");
console.log('room-spot', spot);
const toast = await c.ev("(document.querySelector('#toast')||{}).innerText || ''");
console.log('toast', toast);
console.log('shot', await c.shot(OUT + 'v-maploc-desktop.png'));
c.close();