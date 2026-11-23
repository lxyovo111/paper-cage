import { connect } from './browser.mjs';
import fs from 'node:fs';
const OUT='C:/Users/lcj/Desktop/tap/six-rules/tools/';
const c=await connect();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitBoot(){
  for(let i=0;i<40;i++){ try{ if(await c.ev('!!(window.__game&&window.__game.g&&document.querySelector("[data-act=night]"))')) return true; }catch(e){} await sleep(400); }
  return false;
}
async function measure(tag){
  const info=await c.ev('(function(){function r(sel){var e=document.querySelector(sel);if(!e)return null;var b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)};}var a=r("[data-act=why]"),b=r("[data-act=night]");var ov=null;if(a&&b){var ix=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));var iy=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));ov={w:ix,h:iy,area:ix*iy};}return {why:a,night:b,overlap:ov,label:(document.querySelector("[data-act=why]")||{}).textContent};})()');
  console.log(tag,JSON.stringify(info));
  return info;
}
async function shotClip(file,x,y,w,h){
  const r=await c.send('Page.captureScreenshot',{format:'png',clip:{x,y,width:w,height:h,scale:1}});
  fs.writeFileSync(file,Buffer.from(r.data,'base64'));
  console.log('shot',file);
}
// desktop
await c.send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await c.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&intro=0',2400);
console.log('boot',await waitBoot());
await sleep(500);
await measure('desktop');
await c.shot(OUT+'v-whypos-desktop.png');
await shotClip(OUT+'v-whypos-desktop-clip.png',1080,700,430,280);
// mobile
await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await c.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&intro=0',2400);
console.log('boot-m',await waitBoot());
await sleep(500);
await measure('mobile');
await c.shot(OUT+'v-whypos-mobile.png');
c.close();
