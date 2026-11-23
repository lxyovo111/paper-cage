const URL='https://lxyovo-six-rules.ms.show/play';
const NEED='x="1146" y="760"';
const t0=Date.now();
async function once(){
  try{
    const r=await fetch(URL,{headers:{'user-agent':'Mozilla/5.0'}});
    const t=await r.text();
    const ok=t.includes(NEED);
    console.log(new Date().toISOString(),'status',r.status,'len',t.length,'layoutFixed',ok);
    return ok;
  }catch(e){console.log(new Date().toISOString(),'ERR',e.message);return false;}
}
if(await once()){console.log('ALREADY');process.exit(0);}
for(let i=0;i<80;i++){await new Promise(r=>setTimeout(r,15000));if(await once()){console.log('READY after',Math.round((Date.now()-t0)/1000),'s');process.exit(0);}}
console.log('TIMEOUT');process.exit(1);
