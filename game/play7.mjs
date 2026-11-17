// play7.mjs — 在 node 里无头跑一局，检查叙事文本与流程（不涉及 DOM）
import * as E from '../game/engine.js';

const policy = process.argv[2] || 'careful';
const seed = +(process.argv[3] || 7);
const g = E.createGame(seed);

const PLAN = {
  careful: [
    '夜里任何人不得离开自己的房间。',
    '医务室的窗，任何时候都不许碰。',
    '工具间的铁器，全天不许取走。',
    '洗衣房的床单，夜里不许取走。',
    '储藏室的麻绳，全天不许触碰。',
    '食堂的刀，任何时候不许取走。',
  ],
  careless: ['入夜后，任何人不得离开自己的房间。'],
  blind: [],
  lazy: ['入夜后，任何人不得离开自己的房间。', '工具间的铁器，任何人不得触碰。'],
};

let wrote = PLAN[policy] || PLAN.careful;
console.log('=== 策略：' + policy + '  seed ' + seed + ' ===');
for (let d = 1; d <= 7; d++) {
  console.log('\n--- DAY ' + g.day + '  ap=' + g.ap + ' 服从度=' + g.obedience.toFixed(0) + ' 敌意=' + g.hostility + ' ---');
  if (g.day === 6) { console.log('[事件] 他病了'); E.sickChoice(g, 'treat'); }
  const text = wrote[g.day - 1];
  if (text && g.ap > 0 && g.rules.length < 6) {
    const w = E.writeRule(g, text);
    if (w.ok) console.log('写规矩：' + text + '\n        ' + w.note);
  }
  const holes = E.enumerateHoles(g);
  console.log('漏洞：' + holes.map(h => h.name + (h.open ? '(通)' : '(' + h.depth + '/' + h.total + ')')).join('  '));
  E.predict(g, holes[0].id);
  const res = E.simulateNight(g, { routeId: holes[0].id });
  console.log('今夜路线：' + res.route.name + '  猜中=' + res.predictedRight);
  for (const ev of res.events) console.log('  ' + ev.t + '  ' + ev.text);
  if (g.escaped) { console.log('!! 逃了'); break; }
}
const s = E.settle(g);
console.log('\n=== 结算 ===');
console.log(s.title + ' — ' + s.sub);
console.log(s.quote);
