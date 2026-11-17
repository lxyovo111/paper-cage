import * as E from '../game/engine.js';
const PLAN = [
  '夜里任何人不得离开自己的房间。',
  '医务室的窗，任何时候都不许碰',
  '工具间的铁器，全天不许取走',
  '洗衣房的床单，夜里不许取走',
  '储藏室的麻绳，全天不许触碰',
  '食堂的刀，任何时候不许取走',
];
// 会看昨夜报告再做决定的玩家：他在哪儿踩点，就把哪儿封上
function react(g, used) {
  const p = g.progress;
  if (!p) return null;
  const route = E.availableRoutes(g).find(r => r.id === p.routeId);
  if (!route) return null;
  const room = route.steps[Math.max(0, p.done - 1)].room;
  if (room === 'cell3' || used.has(room)) return null;
  const name = E.ROOMS[room].name;
  const text = '夜里任何人不得进入' + name;
  const c = E.compileRule(text);
  if (!c || !c.ok || !c.rule.lang || c.rule.lang.zones === 'ALL') return null;
  used.add(room);
  return text;
}
function run(seed) {
  const g = E.createGame(seed);
  const used = new Set(['cell3']);
  let ri = 0;
  const log = [];
  for (let d = 0; d < 9; d++) {
    if (g.escaped || g.nights.length >= g.maxDays) break;
    if (g.day === 6) E.sickChoice(g, 'treat');
    let wrote = 0;
    while (wrote < 2 && g.ap >= 1 && g.rules.length < 6) {
      const reactive = react(g, used);
      const text = reactive || PLAN[ri];
      if (!text) break;
      const w = E.writeRule(g, text);
      if (!w.ok) break;
      if (!reactive) ri++;
      log.push('D' + g.day + ' 写:' + text);
      wrote++;
    }
    const holes = E.enumerateHoles(g);
    E.predict(g, holes[0].id);
    const res = E.simulateNight(g, { routeId: holes[0].id });
    log.push('D' + g.day + ' 夜:' + res.route.name + ' -> ' + res.events.map(e => e.text).slice(1).join(' '));
  }
  const s = E.settle(g);
  return { seed, escaped: g.escaped, title: s.title, days: g.nights.length, rules: g.rules.length, log };
}
const tally = {};
for (let seed = 1; seed <= 120; seed++) { const r = run(seed); tally[r.title] = (tally[r.title] || 0) + 1; if (r.title === '记得' && !globalThis.__shown) { globalThis.__shown = 1; console.log('=== 记得样板 seed ' + r.seed + ' ==='); r.log.forEach(l => console.log(l)); console.log('---'); } }
console.log('反应式玩家 120 局称号分布: ' + JSON.stringify(tally));
