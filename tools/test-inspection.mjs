import assert from 'node:assert/strict';
import { createGame, writeRule, rewriteRule, compileRule, PARAMS } from '../game/engine.js';

const g = createGame(8);
g.day = 5;
const texts = [
  '夜里任何人不得离开自己的房间。',
  '医务室的窗，任何时候都不许碰。',
  '工具间的铁器，全天不许取走。',
  '洗衣房的床单，夜里不许取走。',
  '储藏室的麻绳，全天不许触碰。',
  '食堂的刀，任何时候不许取走。',
];
for (const t of texts) {
  g.ap = PARAMS.apPerDay;
  const c = compileRule(t);
  assert.equal(c.ok, true, 'compile failed: ' + t);
  const w = writeRule(g, t, c);
  assert.equal(w.ok, true, 'write failed: ' + t);
}
assert.equal(g.rules.length, 6);
assert.equal(writeRule(g, '放风区的墙，任何时候都不许碰。').ok, false, 'full cap must still block new rules');

g.ap = 3;
const before = g.obedience;
const rw = rewriteRule(g, 'r3', '放风区的墙，任何时候都不许碰。');
assert.equal(rw.ok, true, 'rewrite should succeed when full');
assert.equal(g.rules.length, 6, 'rewrite must not add a slot');
assert.equal(g.rules[2].id, 'r3', 'rule id must be stable for past traces');
assert.equal(g.rules[2].text, '放风区的墙，任何时候都不许碰。');
assert.equal(g.rules[2].rewrittenFrom, texts[2]);
assert.equal(g.ap, 2, 'rewrite costs 1 AP');
assert.ok(g.obedience < before, 'rewrite must cost obedience');
assert.equal(rewriteRule(g, 'r99', '夜里任何人不得离开自己的房间。').ok, false, 'unknown id must fail');
g.ap = 0;
assert.equal(rewriteRule(g, 'r3', '夜里任何人不得离开自己的房间。').ok, false, 'no AP must fail');

console.log(JSON.stringify({ ok:true, rules:g.rules.length, rewritten:g.rules[2].text, ap:g.ap, obedience:g.obedience }));
