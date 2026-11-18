const URL_ = 'https://lxyovo-six-rules.ms.show/play';
const NEED = ['提审他', '没查过这条路', '加派夜巡'];
for (let i = 0; i < 80; i++) {
  try {
    const r = await fetch(URL_, { cache: 'no-store' });
    const t = await r.text();
    const ok = r.status === 200 && NEED.every(s => t.includes(s));
    console.log(new Date().toISOString().slice(11, 19), r.status, t.length, ok ? 'DEPLOYED' : 'waiting');
    if (ok) process.exit(0);
  } catch (e) { console.log(new Date().toISOString().slice(11, 19), 'ERR', e.message); }
  await new Promise(r2 => setTimeout(r2, 15000));
}
process.exit(1);
