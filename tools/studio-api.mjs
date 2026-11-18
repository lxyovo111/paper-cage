const urls = [
 'https://modelscope.cn/api/v1/studios/lxyovo/six-rules',
 'https://www.modelscope.cn/api/v1/studios/lxyovo/six-rules',
];
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const t = await r.text();
    console.log(u, r.status, t.slice(0, 800));
  } catch (e) { console.log(u, 'ERR', String(e).slice(0,200)); }
}
