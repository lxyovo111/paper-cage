const URL_='https://lxyovo-six-rules.ms.show/play';
const t0=Date.now();
while(Date.now()-t0<15*60*1000){
  try{
    const r=await fetch(URL_,{redirect:'follow'});
    const t=await r.text();
    if(r.status===200 && t.indexOf('TOKS')>=0){console.log('DEPLOYED',t.length);process.exit(0);}
    console.log(new Date().toISOString(), r.status, t.length);
  }catch(e){console.log('ERR',e.message);}
  await new Promise(r=>setTimeout(r,20000));
}
console.log('TIMEOUT');process.exit(2);