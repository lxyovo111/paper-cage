import { launch, sleep } from './cdp.mjs';
const errs = [];
const p = await launch();
await p.init();
p.on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('C:' + m.params.args.map(a => a.value || a.description).join(' ')); });
const click = async (sel) => { const ok = await p.ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return false; el.dispatchEvent(new MouseEvent('click',{bubbles:true})); return true;})()`); return ok; };
const shot = async (n) => { await p.shot('tools/live-' + n + '.png'); console.log('shot ' + n); };
const RULES = [
  '夜里任何人不得离开自己的房间',
  '医务室的窗，任何时候都不许碰',
  '工具间的铁器，全天不许取走',
  '洗衣房的床单，夜里不许取走',
  '储藏室的麻绳，全天不许触碰',
  '食堂的刀，任何时候不许取走',
];
await p.goto('http://127.0.0.1:7861/dist/index.html?seed=7&llm=0&speed=0.08&intro=0');
await sleep(700);
let ri = 0;
for (let step = 0; step < 60; step++) {
  const ph = await p.ev('window.__game.view.phase');
  if (ph === 'settle') break;
  await sleep(250);
  if (await click('[data-k="sick"]')) { console.log('sick choice'); await sleep(400); continue; }
  // 写规矩（每天最多 2 条，留 1 AP 给入夜/预判）
  const canWrite = await p.ev('!!document.querySelector("[data-act=write]")');
  const ap = await p.ev('window.__game.g.ap');
  if (canWrite && ri < RULES.length && ap >= 2) {
    const slot = await p.ev('(()=>{const e=document.querySelector("[data-act=write]"); return e?e.dataset.slot:null})()');
    await click('[data-act="write"][data-slot="' + slot + '"]');
    await sleep(150);
    await p.ev(`(()=>{const t=document.querySelector('#rtxt'); t.value=${JSON.stringify(RULES[ri])}; t.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await click('[data-k="compile"]');
    await sleep(500);
    await click('[data-k="ok"]');
    await sleep(300);
    console.log('wrote', ri + 1, RULES[ri]);
    ri++;
    continue;
  }
  if (await click('[data-act="night"]')) {
    await sleep(300);
    if (await click('[data-k="pred"]')) { await sleep(2500); }
    else if (await click('[data-k="skip"]')) { await sleep(2500); }
    continue;
  }
  await sleep(300);
}
await sleep(700);
await shot('dist-settle');
console.log('final=', await p.ev('JSON.stringify({phase:window.__game.view.phase, day:window.__game.g.day, escaped:window.__game.g.escaped, rules:window.__game.g.rules.length, nights:window.__game.g.nights.length})'));
console.log('errors=', errs.length ? errs.slice(0,6).join(' | ') : 'none');
await p.close();
