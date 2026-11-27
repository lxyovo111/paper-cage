import assert from 'node:assert/strict';
import { connect } from './browser.mjs';
import { sleep } from './cdp.mjs';

const b = await connect();
const ev = b.ev;
const click = (sel) => ev('(()=>{const el=document.querySelector(' + JSON.stringify(sel) + '); if(!el) return false; el.dispatchEvent(new MouseEvent("click",{bubbles:true})); return true;})()');
const metrics = (width, height, mobile) => b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile });

await metrics(390, 844, true);
await b.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&speed=0.05&intro=0', 1800);
await sleep(600);
const boot = JSON.parse(await ev('JSON.stringify({phase:window.__game.view.phase,map:!!document.querySelector("#map-room"),old:!!document.querySelector("#map")})'));
console.log('boot', JSON.stringify(boot));
assert.equal(boot.map, true, '手机版没有 #map-room');
assert.equal(boot.old, false, '手机版仍有旧 #map');

// 走一夜，第二天报告里应有点击定位
await ev('window.__game.askNight()');
await sleep(250);
await click('[data-k="skip"]');
for (let i = 0; i < 80; i++) {
  await sleep(100);
  const st = JSON.parse(await ev('JSON.stringify({phase:window.__game.view.phase,day:window.__game.g.day,nights:window.__game.g.nights.length,loc:document.querySelectorAll("[data-act=locate]").length})'));
  if (st.phase === 'day' && st.day === 2 && st.loc > 0) { console.log('day2', JSON.stringify(st)); break; }
  if (i === 79) throw new Error('夜戏未完成: ' + JSON.stringify(st));
}
assert.ok(await click('[data-act="locate"]'), '报告行无法点击');
await sleep(150);
const spot = JSON.parse(await ev('JSON.stringify({spot:!!document.querySelector("#room-spot"),toast:(document.querySelector("#toast")||{}).textContent})'));
console.log('locate', JSON.stringify(spot));
assert.equal(spot.spot, true, '手机上点报告行没有高亮');
assert.ok((spot.toast || '').includes('在地图上标出'), '定位没有反馈');

// 行动力：真实走一夜并猜中，第二天界面必须有 4 个点（syncView 的修复）
const predId = await ev('window.__game.E.enumerateHoles(window.__game.g)[0].id');
await ev('window.__game.askNight()');
await sleep(250);
await click('[data-k="pred"][data-id="' + predId + '"]');
for (let i = 0; i < 80; i++) {
  await sleep(100);
  const st = JSON.parse(await ev('JSON.stringify({phase:window.__game.view.phase,day:window.__game.g.day,nights:window.__game.g.nights.length})'));
  if (st.phase === 'day' && st.day === 3) { console.log('day3', JSON.stringify(st)); break; }
  if (i === 79) throw new Error('猜中预判夜没有结束: ' + JSON.stringify(st));
}
const dots = JSON.parse(await ev('JSON.stringify({ap:window.__game.view.ap,apMax:window.__game.view.apMax,gap:window.__game.g.ap,gapMax:window.__game.g.apMax,dots:document.querySelectorAll(\'circle[cy="104"][r="11"]\').length})'));
console.log('dots', JSON.stringify(dots));
assert.equal(dots.gapMax, 4, '引擎没有保留 apMax=4');
assert.equal(dots.apMax, 4, 'view.apMax 没有跟随 g.apMax');
assert.equal(dots.dots, 4, '手机版只画了 3 个行动力点');

// 第 6 天扣行动：入夜应直接跳过、不显示预判面板
const before = await ev('window.__game.g.nights.length');
await ev('(()=>{const g=window.__game.g; g.day=6; g.ap=3; g.apMax=3; window.__game.view.day=6; window.__game.view.ap=3; window.__game.view.apMax=3; window.__game.E.sickChoice(g,"ignore"); window.__game.askNight();})()');
await sleep(250);
const pred = await ev('document.querySelectorAll(".sheet .chip[data-k=pred]").length');
assert.equal(pred, 0, '扣行动后仍然出现预判面板');
for (let i = 0; i < 80; i++) {
  await sleep(100);
  const st = JSON.parse(await ev('JSON.stringify({day:window.__game.g.day,nights:window.__game.g.nights.length,phase:window.__game.view.phase})'));
  if (st.nights > before && st.day === 7) { console.log('sick', JSON.stringify(st)); break; }
  if (i === 79) throw new Error('扣行动夜没有结束: ' + JSON.stringify(st));
}
const sick = JSON.parse(await ev('JSON.stringify({skipped:window.__game.g.nights[window.__game.g.nights.length-1].skipped,outcome:window.__game.g.nights[window.__game.g.nights.length-1].outcome,trace:window.__game.g.nights[window.__game.g.nights.length-1].trace.length,events:window.__game.g.nights[window.__game.g.nights.length-1].events.map(e=>e.text).join(" / ")})'));
console.log('sickResult', JSON.stringify(sick));
assert.equal(sick.skipped, true);
assert.equal(sick.outcome, 'idle');
assert.equal(sick.trace, 0);
assert.ok((sick.events || '').includes('他今天动不了'), '扣行动的夜报没有写他动不了');
const report = await ev('JSON.stringify(window.__game.view.report)');
assert.ok(report.includes('他今天动不了'), '第二天报告没有承接扣行动: ' + report);
assert.ok(await click('[data-act="why"]'), '找不到行动依据按钮');
await sleep(150);
const why = await ev('(document.querySelector(".sheet")||{}).innerText || ""');
assert.ok(why.includes('他病了'), '行动依据没有写他病了: ' + why);
assert.ok(why.includes('没有发生路线判定'), '行动依据结论不对: ' + why);
await click('[data-k="why-close"]');
await sleep(100);

// 横屏同样要有 #map-room，且点报告行能高亮
await metrics(1100, 540, false);
await b.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&speed=0.05&intro=0', 1600);
await sleep(700);
const land = JSON.parse(await ev('JSON.stringify({land:!!document.querySelector(".screen-svg.landscape"),map:!!document.querySelector("#map-room"),old:!!document.querySelector("#map")})'));
console.log('landscape', JSON.stringify(land));
assert.equal(land.land, true, '没有进入横屏版式');
assert.equal(land.map, true, '横屏版没有 #map-room');
assert.equal(land.old, false, '横屏版仍有旧 #map');
await ev('window.__game.askNight()');
await sleep(250);
await click('[data-k="skip"]');
for (let i = 0; i < 80; i++) {
  await sleep(100);
  const st = JSON.parse(await ev('JSON.stringify({phase:window.__game.view.phase,day:window.__game.g.day,loc:document.querySelectorAll("[data-act=locate]").length})'));
  if (st.phase === 'day' && st.day === 2 && st.loc > 0) break;
  if (i === 79) throw new Error('横屏夜戏未完成: ' + JSON.stringify(st));
}
assert.ok(await click('[data-act="locate"]'), '横屏报告行无法点击');
await sleep(150);
const lspot = JSON.parse(await ev('JSON.stringify({spot:!!document.querySelector("#room-spot"),toast:(document.querySelector("#toast")||{}).textContent})'));
console.log('landscapeLocate', JSON.stringify(lspot));
assert.equal(lspot.spot, true, '横屏点报告行没有高亮');

console.log('FOUR FIXES UI PASS');
b.close();
