const BASE = 'https://lxyovo-six-rules.ms.show';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function call(payload) {
  const t0 = Date.now();
  const r = await fetch(BASE + '/gradio_api/call/npc', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ data:[JSON.stringify(payload)] }) });
  if (!r.ok) throw new Error('post ' + r.status);
  const j = await r.json();
  const id = j.event_id; if (!id) throw new Error('no event_id');
  const s = await fetch(BASE + '/gradio_api/call/npc/' + id);
  const txt = await s.text();
  const lines = txt.split('\n').filter(l => l.startsWith('data:'));
  return { ms: Date.now()-t0, raw: lines.length ? lines[lines.length-1].slice(5).trim() : '' };
}
for (let i = 0; i < 24; i++) {
  try {
    const { ms, raw } = await call({ task:'compile', text:'夜里任何人不得进入洗衣房', lang:{ rooms:[], actions:[], items:[] } });
    console.log(new Date().toISOString().slice(11,19), 'ms', ms, raw.slice(0,220));
    const o = JSON.parse(raw);
    const w = o && o.ok && o.lang && o.lang.window;
    if (w && ((w.from === 1320 && w.to === 300) || (w.from > w.to && w.to <= 300))) { console.log('DEPLOYED-OK'); process.exit(0); }
  } catch (e) { console.log(new Date().toISOString().slice(11,19), 'ERR', String(e.message).slice(0,120)); }
  await sleep(40000);
}
console.log('TIMEOUT');
process.exit(1);
