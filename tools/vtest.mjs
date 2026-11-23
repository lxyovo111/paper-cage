import fs from 'node:fs';
import { connect } from './browser.mjs';

const OUT = 'C:/Users/lcj/Desktop/tap/six-rules/tools/';
const c = await connect();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function setup(w,h,mobile){
  await c.send('Emulation.setDeviceMetricsOverride', {width:w,height:h,deviceScaleFactor:1,mobile});
  await c.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&intro=0', 2200);
}

async function run(tag){
  const ready = await c.ev('!!window.__game && !!window.__game.g');
  console.log(tag, 'ready', ready);
  await c.ev('window.__game.askWrite()');
  await sleep(350);
  await c.ev("document.querySelector('#rtxt').value = '入夜后，任何人不得离开自己的房间。'; 1");
  await c.ev("document.querySelector('.sheet .btn.primary').click(); 1");
  await sleep(700);
  const info = await c.ev("(function(){var s=document.querySelector('.sheet'); if(!s) return {none:true}; var r=s.getBoundingClientRect(); return {text:s.innerText, rect:{x:r.x,y:r.y,w:r.width,h:r.height}, scroll:{h:s.scrollHeight,ch:s.clientHeight}};})()");
  console.log(tag, JSON.stringify(info, null, 2));
  const shot = await c.shot(OUT + 'v-verdict-' + tag + '.png');
  console.log('shot', shot);
}

await setup(1600,1000,false);
await run('desktop');
await setup(390,844,true);
await run('mobile');
c.close();
