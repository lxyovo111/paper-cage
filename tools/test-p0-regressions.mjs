import { compileRule, explainLang, ruleBlocks } from '../game/engine.js';

let fails = 0;
function ok(name, cond, extra) {
  if (!cond) { fails++; console.log('FAIL ' + name + (extra ? ' :: ' + extra : '')); }
  else console.log('ok   ' + name);
}
function note(text) { const c = compileRule(text); return { c, n: c.note }; }

const a = note('三天内不许离开房间');
ok('「三天」不绑三号牢房', a.c.rule.lang.zones === 'ALL' && !a.n.includes('三号牢房'), a.n);
const b = note('第三夜不许他离开房间');
ok('「第三夜」不绑三号牢房', b.c.rule.lang.zones === 'ALL' && !b.n.includes('三号牢房'), b.n);
const c = note('三号牢房任何时候不许离开');
ok('明确写三号牢房才绑 cell3', c.c.rule.lang.zones.length === 1 && c.c.rule.lang.zones[0] === 'cell3' && c.n.includes('三号牢房'), c.n);

const t1 = note('凌晨三点到五点不许离开');
ok('中文时间段读第二个端点', t1.n.includes('03:00–05:00'), t1.n);
const t2 = note('23点到1点不许离开');
ok('阿拉伯中文时间跨夜', t2.n.includes('23:00–01:00'), t2.n);
const t3 = note('22点到5点不许离开');
ok('22点到5点', t3.n.includes('22:00–05:00'), t3.n);
const t4 = note('23:00-01:00 不许离开');
ok('ASCII 跨夜不受影响', t4.n.includes('23:00–01:00'), t4.n);
const t5 = note('凌晨十二点到两点不许离开');
ok('凌晨十二点归零', t5.n.includes('00:00–02:00'), t5.n);
const t6 = note('23点到凌晨1点不许离开');
ok('不因出现凌晨误减 23 点', t6.n.includes('23:00–01:00'), t6.n);
const t7 = note('三点半到五点不许离开');
ok('半点端点', t7.n.includes('03:30–05:00'), t7.n);

const e = note('两人同行才可以离开');
ok('不再承诺不存在的「需两人同行」例外', !e.n.includes('需两人同行') && e.n.endsWith('无例外'), e.n);
const ex = explainLang(e.c.rule.lang);
ok('系统理解里明确说没有同行者', ex.notes.some(x => x.includes('没有同行者')), ex.notes.join(' | '));
const blocks = ruleBlocks({ lang: e.c.rule.lang }, { room: 'corridor', act: 'MOVE' }, 22 * 60, 'cell3');
ok('同行句仍按普通禁止执行（不产生假例外）', blocks === true, String(blocks));

if (fails) { console.error('P0 FAILED: ' + fails); process.exit(1); }
console.log('P0 PASS');
