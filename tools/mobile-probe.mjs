import { launch, sleep } from './cdp.mjs';
import fs from 'node:fs';
const p = await launch({ port: 9301, dir: 'C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-mobile', w: 390, h: 844, scale: 3 });
await p.send('Page.enable'); await p.send('Runtime.enable');
await p.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await p.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await p.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', platform: 'iPhone' });
await p.send('Page.navigate', { url: 'https://modelscope.cn/studios/lxyovo/six-rules' });
await sleep(14000);
const top = await p.ev("(()=>({w:innerWidth,h:innerHeight,iframes:[...document.querySelectorAll('iframe')].map(f=>({src:f.src&&f.src.slice(0,90),r:f.getBoundingClientRect().toJSON()}))}))()");
console.log('TOP', JSON.stringify(top));
await p.shot('tools/m1-top.png');
let list = [];
for (let i=0;i<30;i++){ try { const r=await fetch('http://127.0.0.1:9301/json/list'); list = await r.json(); } catch(e){} const f = list.find(t=>String(t.url||'').includes('/play')); if (f) { console.log('FRAME', f.url.slice(0,80)); break; } await sleep(1000); }
const f = list.find(t=>String(t.url||'').includes('/play'));
if (!f) { console.log('NO_PLAY_FRAME', JSON.stringify(list.map(t=>String(t.url||'').slice(0,60)))); await p.close(); process.exit(0); }
const a = await p.send('Target.attachToTarget', { targetId: f.id, flatten: true });
const sid = a.sessionId;
await p.send('Runtime.enable', {}, sid);
for (let i=0;i<25;i++){ const ok = await p.send('Runtime.evaluate',{expression:'!!window.__game',returnByValue:true},sid).then(r=>r.result.value).catch(()=>false); if(ok) break; await sleep(1000); }
const geo = await p.send('Runtime.evaluate', { expression: "(()=>{const s=document.querySelector('#stage');const svg=document.querySelector('#screen svg');const r=s?s.getBoundingClientRect():null;const cs=s?getComputedStyle(s):null;const slots=document.querySelectorAll('[data-act=write]');const night=document.querySelector('[data-act=night]');const nr=night?night.getBoundingClientRect():null;return {vw:innerWidth,vh:innerHeight,dpr:devicePixelRatio,stage:r?{x:r.x,y:r.y,w:r.width,h:r.height}:null,stageCSS:cs?{w:cs.width,h:cs.height,transform:cs.transform}:null,svg:!!svg,slots:slots.length,night:nr?{x:nr.x,y:nr.y,w:nr.width,h:nr.height}:null,fonts:[...document.querySelectorAll('#screen svg text')].slice(0,3).map(t=>getComputedStyle(t).fontSize),body:document.body.innerText.slice(0,120)};})()", returnByValue: true }, sid);
console.log('GEO', JSON.stringify(geo.result.value));
const s2 = await p.send('Page.captureScreenshot', { format: 'png' }, sid).catch(e=>({err:String(e)}));
if (s2 && s2.data) fs.writeFileSync('tools/m2-play.png', Buffer.from(s2.data,'base64'));
await p.shot('tools/m3-top2.png');
await p.close();
