const URL_ = 'https://lxyovo-six-rules.ms.show/play';
const t0 = Date.now();
let last = '';
while (Date.now() - t0 < 25 * 60 * 1000) {
  try {
    const r = await fetch(URL_, { signal: AbortSignal.timeout(15000) });
    const t = await r.text();
    const ok = r.status === 200 && t.includes('report-live');
    const line = new Date().toISOString().slice(11, 19) + ' status ' + r.status + ' len ' + t.length + ' report-live ' + t.includes('report-live') + ' title ' + (/<title>(.*?)<\/title>/.exec(t) || [, ''])[1];
    if (line !== last) { console.log(line); last = line; }
    if (ok) { console.log('DEPLOYED'); break; }
  } catch (e) { console.log(new Date().toISOString().slice(11, 19) + ' err ' + String(e).slice(0, 60)); }
  await new Promise(r => setTimeout(r, 20000));
}
