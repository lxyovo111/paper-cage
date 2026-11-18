const MARK='按原始条数判断';
const URL='https://lxyovo-six-rules.ms.show/play';
const t0=Date.now();
for(;;){
  try{
    const r=await fetch(URL,{cache:'no-store'});
    const t=await r.text();
    const ok=r.status===200 && t.indexOf(MARK)>=0;
    console.log(new Date().toISOString().slice(11,19), r.status, t.length, ok?'DEPLOYED':'waiting');
    if(ok) break;
  }catch(e){ console.log(new Date().toISOString().slice(11,19),'ERR',String(e).slice(0,80)); }
  if(Date.now()-t0>1500000) { console.log('TIMEOUT'); break; }
  await new Promise(r=>setTimeout(r,15000));
}
console.log('DONE');