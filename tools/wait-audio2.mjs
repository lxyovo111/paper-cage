const URL_='https://lxyovo-six-rules.ms.show/play';
async function tick(){
  try{ const r=await fetch(URL_); const t=await r.text();
    const ok = r.status===200 && t.includes('12.2%') && t.includes('audio-day.mp3');
    console.log(new Date().toISOString().slice(11,19), r.status, t.length, ok?'DEPLOYED':'waiting');
    if(ok) process.exit(0);
  }catch(e){ console.log('err', e.message); }
}
setInterval(tick, 15000); tick();