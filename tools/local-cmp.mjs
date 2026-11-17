import { compileRule } from '../game/engine.js';
const cands = ['床上的东西不许带走','别让他有机会撕床单','洗衣房的东西，夜里一样都不许拿','他要是去洗衣房，就把床单看住','不许用床单做绳子','把洗衣房的床单锁起来'];
for (const c of cands) { const r = compileRule(c); console.log(JSON.stringify({ c, note: r.note, ok: r.ok })); }
