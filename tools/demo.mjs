// 录一局：node tools/demo.mjs <url> <outDir> [take]
import { launch, sleep } from './cdp.mjs';
import { startRec } from './screencast.mjs';
const url = process.argv[2];
const out = process.argv[3];
const take = process.argv[4] || 'a';
const p = await launch({ w: 1600, h: 1000, scale: 1 });
await p.init();
const errs = [];
p.on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params).slice(0, 300)); });
await p.goto(url);
await sleep(2600);
const clickSel = sel => p.ev("(()=>{const e=document.querySelector(" + JSON.stringify(sel) + "); if(!e) return false; e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return true;})()");
const clickText = (tag, txt) => p.ev("(()=>{const b=[...document.querySelectorAll('" + tag + "')].find(x=>(x.innerText||'').replace(/\\s/g,'')===" + JSON.stringify(txt.replace(/\s/g,'')) + "); if(!b) return false; b.click(); return true;})()");
const typeInto = (sel, text, ms) => p.ev("(()=>{const t=document.querySelector(" + JSON.stringify(sel) + "); if(!t) return false; const s=" + JSON.stringify(text) + "; t.focus(); let i=0; return new Promise(res=>{const id=setInterval(()=>{i++; t.value=s.slice(0,i); t.dispatchEvent(new Event('input',{bubbles:true})); if(i>=s.length){clearInterval(id);res(true);}}, " + String(ms) + ");});})()");
const hasAi = () => p.ev("!!document.querySelector('.ai-tag')");
const rec = await startRec(p, out);

if (take === 'a') {
  await sleep(1500);
  console.log('open slot', await clickSel('[data-act=write]'));
  await sleep(1500);
  console.log('type', await typeInto('#rtxt', '夜里任何人不得离开自己的房间', 110));
  await sleep(900);
  console.log('compile', await clickSel('[data-k=compile]'));
  await sleep(1800);
  let ai = false;
  for (let i = 0; i < 22; i++) { await sleep(400); if (await hasAi()) { ai = true; break; } }
  console.log('ai tag', ai);
  await sleep(2600);
  console.log('ok', await clickSel('[data-k=ok]'));
  await sleep(2400);
  console.log('night', await clickSel('[data-act=night]'));
  await sleep(1400);
  console.log('pred', await clickSel('.chip[data-k=pred]'));
  await sleep(10000);
} else if (take === 'b') {
  // 快进到第七夜结算：连续入夜
  await sleep(800);
  for (let d = 0; d < 8; d++) {
    const st = await p.ev("(()=>{const g=window.__game&&window.__game.g; return g?JSON.stringify({day:g.day,phase:g.phase,escaped:g.escaped}):'no';})()");
    console.log('day', d, st);
    if (/escaped":true/.test(st)) break;
    if (await clickSel('[data-act=night]')) { await sleep(1600); await clickSel('.chip[data-k=pred]'); }
    await sleep(9000);
  }
  await sleep(3000);
} else if (take === 'c') {
  await sleep(1500);
  await clickSel('[data-act=write]');
  await sleep(1400);
  console.log('type', await typeInto('#rtxt', '床上的东西不许带走', 130));
  await sleep(900);
  await clickSel('[data-k=compile]');
  await sleep(2200);
  let ai = false;
  for (let i = 0; i < 22; i++) { await sleep(400); if (await hasAi()) { ai = true; break; } }
  console.log('ai tag', ai);
  await sleep(3000);
}
const frames = await rec.stop();
console.log('frames', frames.length, 'span', frames.length ? ((frames[frames.length-1].t - frames[0].t)/1000).toFixed(1)+'s' : 0);
console.log('errors', errs.length, errs.slice(0,2).join(' | '));
await p.close();