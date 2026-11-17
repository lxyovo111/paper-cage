const URL = 'https://lxyovo-six-rules.ms.show/play';
const t0 = Date.now();
for (let i = 0; i < 90; i++) {
  try {
    const r = await fetch(URL, { cache: 'no-store' });
    const t = await r.text();
    const ok = r.status === 200 && t.indexOf('mlamp') >= 0;
    console.log(new Date().toISOString().slice(11,19), r.status, t.length, ok ? 'DEPLOYED' : '-');
    if (ok) { console.log('DONE at ' + Math.round((Date.now()-t0)/1000) + 's'); process.exit(0); }
  } catch (e) { console.log('ERR', e.message); }
  await new Promise(r => setTimeout(r, 20000));
}
console.log('TIMEOUT');