import * as E from '../game/engine.js';
const PLAN = [
  '夜里任何人不得离开自己的房间。',
  '医务室的窗，任何时候都不许碰',
  '工具间的铁器，全天不许取走',
  '洗衣房的床单，夜里不许取走',
  '储藏室的麻绳，全天不许触碰',
  '食堂的刀，任何时候不许取走',
];
function run(seed, predictAlways = true) {
  const g = E.createGame(seed);
  let ri = 0;
  for (let d = 0; d < 8; d++) {
    if (g.escaped || g.nights.length >= g.maxDays) break;
    if (g.day === 6) E.sickChoice(g, 'treat');
    let wrote = 0;
    while (ri < PLAN.length && wrote < 2 && g.ap >= 1 && g.rules.length < 6) {
      const w = E.writeRule(g, PLAN[ri]);
      if (!w.ok) break;
      ri++; wrote++;
    }
    const holes = E.enumerateHoles(g);
    if (predictAlways) E.predict(g, holes[0].id);
    const res = E.simulateNight(g, { routeId: holes[0].id });
    g.__last = res;
  }
  const s = E.settle(g);
  const ev = (g.__last ? g.__last.events : []).map(e => e.kind + ':' + e.text.slice(0, 18));
  return { seed, escaped: g.escaped, title: s.title, days: g.nights.length, rules: g.rules.length, last: ev.slice(0, 5) };
}
const tally = {};
const out = [];
for (let seed = 1; seed <= 120; seed++) { const r2 = run(seed); out.push(r2); tally[r2.title] = (tally[r2.title] || 0) + 1; }
console.log('称号分布(120 局, 静态六条计划): ' + JSON.stringify(tally));
const esc = out.filter(o => o.escaped);
console.log('逃逸 ' + esc.length + '/60   守住 ' + (60 - esc.length));
const held = out.filter(o => !o.escaped);
console.log('守住的前 12 个 seed：');
for (const h of held.slice(0, 12)) console.log(JSON.stringify(h));
console.log('逃逸样板：');
for (const h of esc.slice(0, 3)) console.log(JSON.stringify(h));
