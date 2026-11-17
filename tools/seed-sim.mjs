
import * as E from 'file:///C:/Users/lcj/Desktop/tap/six-rules/game/engine.js';
const RULES = [
  ['洗衣房的床单，夜里不许取走', 1], ['工具间的铁器，全天不许取走', 1], ['储藏室的麻绳，任何时候都不许碰', 1],
  ['食堂的刀，任何时候不许取走', 2], ['医务室的窗，任何时候都不许碰', 2], ['走廊的通风口，任何时候都不许碰', 2],
];
const out = [];
for (let seed = 1; seed <= 400; seed++) {
  const g = E.createGame(seed);
  const wrote = { 1: 0, 2: 0 };
  let ok = true;
  for (let d = 1; d <= 2; d++) {
    for (const [text, day] of RULES) {
      if (day !== d) continue;
      const w = E.writeRule(g, text);
      if (!w.ok) { ok = false; break; }
      wrote[d]++;
    }
  }
  const outcomes = [];
  for (let n = 0; n < 7 && !g.escaped && g.nights.length < 7; n++) {
    const holes = E.enumerateHoles(g);
    const pick = holes[0];
    const res = E.simulateNight(g, { routeId: pick.id });
    outcomes.push(res.outcome);
  }
  const s = E.settle(g);
  out.push({ seed, esc: g.escaped, title: s.title, nights: g.nights.length, out: outcomes.join(','), host: Math.round(g.hostility), obey: Math.round(g.obedience) });
}
const good = out.filter(x => !x.esc && x.nights >= 7);
console.log('good', good.length);
console.log(JSON.stringify(good.slice(0, 12)));
const dist = {};
out.forEach(x => { const k = x.esc ? 'esc' : x.title; dist[k] = (dist[k] || 0) + 1; });
console.log(JSON.stringify(dist));
console.log(JSON.stringify(out.slice(0, 5)));
