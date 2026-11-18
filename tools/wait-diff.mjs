const URL_='https://lxyovo-six-rules.ms.show/play';
const NEED=['offset-path:path(','scale(1.18)','rushFromDay'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<80;i++){
  try{const r=await fetch(URL_);const t=await r.text();
    const ok=NEED.every(s=>t.indexOf(s)>=0);
    console.log(new Date().toTimeString().slice(0,8),r.status,t.length,ok?'DEPLOYED':'waiting');
    if(r.status===200&&ok){process.exit(0);}
  }catch(e){console.log(new Date().toTimeString().slice(0,8),'ERR',e.message);}
  await sleep(15000);
}
process.exit(1);