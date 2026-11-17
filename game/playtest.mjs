import { createGame, writeRule, predict, enumerateHoles, simulateNight, settle } from './engine.js';
const CARELESS = [[1, '入夜后，任何人不得离开自己的房门。']];
const CAREFUL = [
  [1, '21点起，医务室禁止破坏与攀爬。'],
  [1, '21点起，洗衣房禁止取物。'],
  [2, '21点起，走廊禁止攀爬。'],
  [2, '21点起，食堂禁止取物。'],
  [3, '21点起，工具间禁止取物。'],
  [4, '21点起，放风区禁止冲突。'],
];
function run(plan) {
  return seed => {
    const g = createGame(seed);
    for (let d = 1; d <= 7 && !g.escaped; d++) {
      for (const [day, text] of plan) if (day === d) { const r = writeRule(g, text); if (!r.ok) console.error('  !! ' + text + ' → ' + r.error); }
      const holes = enumerateHoles(g);
      predict(g, holes[0].id);
      simulateNight(g, { routeId: holes[0].id });
    }
    return g.escaped ? g.nights.length : 'held';
  };
}
function dist(fn) {
  const m = {};
  for (let i = 1; i <= 500; i++) { const k = fn(i * 7919); m[k] = (m[k] || 0) + 1; }
  return Object.fromEntries(Object.entries(m).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}
console.log('careless', dist(run(CARELESS)));
console.log('careful ', dist(run(CAREFUL)));

const g = createGame(7);
console.log('\n编译检查：');
for (const t of ['21点起，医务室禁止破坏与攀爬。','22:00-05:00，洗衣房禁止取物。','入夜后，任何人不得离开自己的房门。','全时段，所有区域禁止位移。','夜里不许翻墙。','凌晨三点起，走廊不得走动。']) {
  const r = writeRule(g, t); console.log('  ' + t + '\n    → ' + (r.ok ? r.note : r.error));
}
console.log('\n复盘：');
const g2 = createGame(7);
for (let d = 1; d <= 7; d++) {
  for (const [day, text] of CAREFUL) if (day === d) writeRule(g2, text);
  const holes = enumerateHoles(g2);
  console.log('D' + d + ' 服从' + Math.round(g2.obedience) + ' 敌意' + Math.round(g2.hostility) + ' | ' +
    holes.map(h => (h.impro ? '★' : '') + h.name + (h.open ? '[通]' : '[' + h.depth + '/' + h.total + ']')).join(' '));
  predict(g2, holes[0].id);
  const r = simulateNight(g2, { routeId: holes[0].id });
  console.log('   → ' + r.route.name + ' ' + r.outcome + ' | ' + r.events.slice(1).map(e => e.text).join(' / '));
  if (g2.escaped) break;
}
console.log(settle(g2));
