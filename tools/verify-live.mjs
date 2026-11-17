const B = 'https://lxyovo-six-rules.ms.show';
const out = {};
for (const [k, u] of [['health', '/healthz'], ['play', '/play'], ['config', '/config']]) {
  try {
    const r = await fetch(B + u, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } });
    const t = await r.text();
    out[k] = { status: r.status, len: t.length, hasGame: t.includes('window.__game'), hasJs: t.includes('"js"'), head: t.slice(0, 220).replace(/\s+/g, ' ') };
  } catch (e) { out[k] = { err: String(e) }; }
}
console.log(JSON.stringify(out, null, 1));
