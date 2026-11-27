const URL_='https://lxyovo-six-rules.ms.show/play';
const t0=Date.now(); let last='';
while(Date.now()-t0 < 25*60*1000){
  try{
    const r=await fetch(URL_,{signal:AbortSignal.timeout(15000)});
    const t=await r.text();
    const hasNew=t.includes('sickSkipNight') && t.includes('他今天动不了');
    const line=new Date().toISOString().slice(11,19)+' status '+r.status+' len '+t.length+' new '+hasNew;
    if(line!==last){console.log(line);last=line;}
    if(r.status===200 && hasNew){console.log('DEPLOYED_NEW'); process.exit(0);}
  }catch(e){console.log(new Date().toISOString().slice(11,19)+' err '+String(e).slice(0,80));}
  await new Promise(r=>setTimeout(r,15000));
}
console.log('TIMEOUT'); process.exit(2);
