// wait-deploy.mjs — 等新包上线（/play 的 <title> 变成第七夜）
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch('https://lxyovo-six-rules.ms.show/play');
    const t = await r.text();
    const title = (t.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    console.log(new Date().toISOString().slice(11, 19), 'status', r.status, 'len', t.length, 'title', title, 'ai-pend', t.includes('ai-pend'));
    if (title.includes('纸上牢笼')) { console.log('DEPLOYED'); process.exit(0); }
  } catch (e) { console.log('fetch-fail', String(e.message).slice(0, 60)); }
  await sleep(20000);
}
console.log('TIMEOUT');
process.exit(1);
