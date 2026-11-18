const url = 'https://lxyovo-six-rules.ms.show/play';
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 90; i++) {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    const t = await r.text();
    const ok = r.status === 200 && t.includes('audio-day.mp3') && t.includes('__audio');
    console.log(new Date().toISOString().slice(11,19), r.status, t.length, ok ? 'DEPLOYED' : 'waiting');
    if (ok) process.exit(0);
  } catch (e) { console.log('err', String(e).slice(0,80)); }
  await sleep(15000);
}
process.exit(1);