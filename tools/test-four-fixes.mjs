import assert from 'node:assert/strict';
import * as E from '../game/engine.js';
import { renderMobile } from '../ui/mobile.js';
import { renderLandscape } from '../ui/landscape.js';

const base = { phase:'day', day:1, ap:3, apMax:3, obedience:100, hostility:30, rules:[], report:[] };

// ① 手机/横屏地图必须有 locateRoom() 查找的 #map-room
const mobile = renderMobile({ ...base, apMax:4, ap:4 });
const landscape = renderLandscape({ ...base, apMax:4, ap:4 });
assert.ok(mobile.includes('id="map-room"'), '手机版缺少 #map-room');
assert.ok(landscape.includes('id="map-room"'), '横屏版缺少 #map-room');
assert.ok(!/<g id="map"/.test(mobile), '手机版仍有旧 #map');
assert.ok(!/<g id="map"/.test(landscape), '横屏版仍有旧 #map');
assert.ok(mobile.includes('cx="668" cy="104" r="11"'), '手机版没有画出第 4 个行动力点');
assert.ok(renderMobile({ ...base }).includes('cx="700" cy="104" r="11"'), '手机版 3 点位置不对');

// ④ 猜中预判：实际有 4 点，界面也必须拿到 apMax=4
{
  const g = E.createGame(8);
  g.day = 2;
  g.ap = 3;
  E.predict(g, 'window');
  const res = E.simulateNight(g, { routeId:'window' });
  assert.equal(res.predictedRight, true, '预判应判对');
  assert.equal(g.ap, 4, '猜中后应有 4 点行动力');
  assert.equal(g.apMax, 4, '猜中后 apMax 应为 4');
  g.ap -= 1;
  assert.equal(g.apMax, 4, '花掉第 4 点后 apMax 仍应保留');
}

// ③ 黑雨只在第 3 夜；第 4 天白天必须清掉 0.70 执行率状态
{
  const g = E.createGame(8);
  g.day = 3;
  E.simulateNight(g, { routeId:'window' });
  assert.equal(g.day, 4);
  assert.equal(g.blackout, false, '第 4 天白天仍带着黑雨');
}

// ② 第 6 天扣行动：这一夜真的不走路、不判定、不揭示路线
{
  const g = E.createGame(8);
  g.day = 6;
  g.ap = 2;
  g.progress = { routeId:'window', done:2 };
  g.prisoner.items = ['iron'];
  const intelBefore = Object.keys(g.intel).sort().join(',');
  E.sickChoice(g, 'ignore');
  assert.equal(g.sickSkipNight, true);
  const res = E.simulateNight(g, {});
  assert.equal(res.skipped, true);
  assert.equal(res.outcome, 'idle');
  assert.equal(g.nights.length, 1);
  assert.equal(g.nights[0].skipped, true);
  assert.equal(g.nights[0].trace.length, 0);
  assert.equal(g.nights[0].outcome, 'idle');
  assert.equal(g.day, 7);
  assert.equal(g.ap, 3);
  assert.equal(g.apMax, 3);
  assert.deepEqual(g.progress, { routeId:'window', done:2 });
  assert.deepEqual(g.prisoner.items, ['iron']);
  assert.equal(Object.keys(g.intel).sort().join(','), intelBefore, '病假夜不应揭示新路线');
}

// ② 对照：叫医生不跳过夜
{
  const g = E.createGame(8);
  g.day = 6;
  E.sickChoice(g, 'treat');
  assert.equal(g.sickSkipNight, false);
  assert.equal(g.trust, 72);
  assert.equal(g.obedience, 100);
}

console.log('FOUR FIXES PASS');
