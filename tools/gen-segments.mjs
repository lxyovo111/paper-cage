import fs from 'node:fs';
const A = JSON.parse(fs.readFileSync('tools/rec-live-a2/_stamps.json','utf8'));
const B = JSON.parse(fs.readFileSync('tools/rec-live-b/_stamps.json','utf8'));
const toMap = (a) => Array.isArray(a) ? Object.fromEntries(a.map(o => [o.name, o.t])) : (a || {});
const m = toMap(A.marks);
const need = ['day1','ai-tag','rules3','night','day2','night2','block-n2','day3'];
for (const k of need) if (typeof m[k] !== 'number') { console.error('missing mark', k, JSON.stringify(m)); process.exit(1); }
const bm = toMap(B.marks);
const A2 = 'C:/Users/lcj/Desktop/tap/six-rules/tools/takeA3.mp4';
const B2 = 'C:/Users/lcj/Desktop/tap/six-rules/tools/takeB2.mp4';
const segs = [
  { type:'img', path:'C:/Users/lcj/Desktop/tap/six-rules/tools/card-title.jpg', dur:5 },
  { type:'vid', path:A2, start:0.2, dur: Math.max(1.2, m.day1 - 0.2), speed:1, caption:'第一天。三点行动力，一间监狱。' },
  { type:'vid', path:A2, start: m.day1 + 0.2, dur: Math.max(1.5, (m['ai-tag'] + 1.0) - (m.day1 + 0.2)), speed:1, caption:'写一句人话，AI 把它译成一条能执行的条件。' },
  { type:'vid', path:A2, start: m['ai-tag'] + 1.0, dur: Math.max(1.5, (m.night - 0.9) - (m['ai-tag'] + 1.0)), speed:2.2, caption:'越具体，狱警越听得懂。' },
  { type:'vid', path:A2, start: m.night + 1.15, dur: Math.max(2.5, (m.day2 - 0.3) - (m.night + 1.15)), speed:1, dark:true, caption:'第一夜：他进了工具间，拿走一根铁条。' },
  { type:'vid', path:A2, start: m.day2 - 0.2, dur: Math.max(1.5, (m.night2 - 1.0) - (m.day2 - 0.2)), speed:1, caption:'第二天，你在医务室门口补了一句。' },
  { type:'vid', path:A2, start: m.night2 + 1.2, dur: Math.max(2.5, (m['block-n2'] + 2.8) - (m.night2 + 1.2)), speed:1, dark:true, caption:'第二夜：他到了门口，被那句话堵回去。' },
  { type:'img', path:'C:/Users/lcj/Desktop/tap/six-rules/tools/card-ab.jpg', dur:8 },
  { type:'vid', path:B2, start:0, dur:9, speed:1.6, caption:'七天，最多六条规矩。没有人能全封住。' },
  { type:'vid', path:B2, start:20.9, dur:19.1, speed:4, caption:'他每天换一条缝。' },
  { type:'vid', path:B2, start:40, dur:32, speed:8, caption:'每一夜，路都更窄一点。' },
  { type:'vid', path:B2, start:72, dur:8.7, speed:3, caption:'七夜之后，一切交给判决书。' },
  { type:'img', path:'C:/Users/lcj/Desktop/tap/six-rules/tools/chk-verdict.jpg', dur:5, caption:'判定不是 AI 写的：引擎算完七天，只留一句话。' },
  { type:'img', path:'C:/Users/lcj/Desktop/tap/six-rules/tools/card-end.jpg', dur:8 },
];
segs.forEach((s,i)=>{ console.log(i+1, s.type, s.path.split('/').pop(), 'start', s.start ?? '', 'dur', s.dur.toFixed(2), 'out', (s.dur/(s.speed||1)).toFixed(2)); });
fs.writeFileSync('tools/segments.json', JSON.stringify(segs, null, 2));
const total = segs.reduce((a,s)=>a+(s.dur/(s.speed||1)),0);
console.log('TOTAL', total.toFixed(2));
