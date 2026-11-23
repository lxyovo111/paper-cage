
import fs from 'node:fs';
import { connect } from './browser.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const c=await connect();
await c.send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await c.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&intro=0&speed=0.02',2500);
const wait=async(expr,ms,label)=>{const t0=Date.now();while(Date.now()-t0<ms){try{if(await c.ev(expr))return true;}catch(e){}await sleep(300);}console.log('TIMEOUT',label);return false;};
await wait('window.__game && window.__game.g','boot');
await c.ev('window.__game.askWrite()');await sleep(300);
await c.ev('document.querySelector("#rtxt").value="入夜后，任何人不得离开自己的房间。";1');
await c.ev('document.querySelector(".sheet .btn.primary").click();1');await sleep(800);
await c.ev('document.querySelector(".sheet .btn.primary").click();1');await sleep(400);
for(let n=0;n<10;n++){
  if(await c.ev('window.__game.view.phase')==='settle')break;
  const before=await c.ev('window.__game.g.nights.length');
  await c.ev('window.__game.askNight()');
  if(await wait('!!document.querySelector("[data-k=skip]")',8000,'skip')) await c.ev('document.querySelector("[data-k=skip]").click()');
  await sleep(500);
  await c.ev('(function(){var s=document.querySelector(".sheet");if(s){var b=s.querySelector(".btn.primary")||s.querySelector(".btn");if(b)b.click();}})()');
  await wait('window.__game.g.nights.length>'+before+' && window.__game.view.phase!=="night"',60000,'night');
}
console.log('FINAL',await c.ev('JSON.stringify({phase:window.__game.view.phase,day:window.__game.g.day,rules:window.__game.g.rules.length,review:!!document.querySelector("#review-btn"),outcomes:window.__game.g.nights.map(n=>n.outcome)})'));
if(await c.ev('!!document.querySelector("#review-btn")')){
  await c.ev('document.querySelector("#review-btn").click()');await sleep(500);
  console.log('REVIEW',await c.ev('document.querySelector(".sheet").innerText'));
  console.log('SHOT',await c.shot('C:/Users/lcj/Desktop/tap/six-rules/tools/v-review-one.png'));
}
c.close();process.exit(0);
