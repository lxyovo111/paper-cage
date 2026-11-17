import { launch } from './cdp.mjs';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await launch({ port: 9312, dir: 'C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-mtest', w: 390, h: 844, scale: 2 });
const errs = [];
p.on(m => {
  if (m.method === 'Runtime.exceptionThrown') { const e = m.params.exceptionDetails; errs.push('EXC ' + (e.exception && e.exception.description || e.text)); }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('CONSOLE ' + (m.params.args||[]).map(a=>a.value||a.description).join(' '));
});
await p.send('Page.enable'); await p.send('Runtime.enable');
await p.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await p.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const ev = async (expr) => { const r = await p.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error('EVAL ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text)); return r.result.value; };
const shot = async (name, h) => {
  const r = await p.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 390, height: h || 900, scale: 2 } });
  fs.writeFileSync('tools/' + name, Buffer.from(r.data, 'base64'));
  console.log('SHOT', name);
};
const click = async (sel) => ev("(()=>{const el=document.querySelector(" + JSON.stringify(sel) + ");if(!el)return 'no:'+ " + JSON.stringify(sel) + ";el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return 'ok';})()");
await p.send('Page.navigate', { url: 'http://127.0.0.1:7861/dist/index.html?seed=21&llm=0&speed=0.35' });
await sleep(3500);
console.log('ENV', JSON.stringify(await ev("({mq:matchMedia('(max-width: 900px)').matches,vb:(document.querySelector('#screen svg')||{}).getAttribute?document.querySelector('#screen svg').getAttribute('viewBox'):null,stageH:Math.round(document.getElementById('stage').getBoundingClientRect().height),vw:innerWidth,vh:innerHeight})")));
await shot('m-day.png', 900);
console.log('SLOT', await click('#rules g[data-act=write]'));
await sleep(500);
await ev("(()=>{const t=document.getElementById('rtxt');const s=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;s.call(t,'洗衣房的床单，夜里不许取走');t.dispatchEvent(new Event('input',{bubbles:true}));return t.value;})()");
console.log('COMPILE', await click('[data-k=compile]'));
await sleep(1200);
await shot('m-verify.png', 900);
console.log('OK', await click('[data-k=ok]'));
await sleep(1400);
await shot('m-rule.png', 900);
console.log('NIGHT', await click('[data-act=night]'));
await sleep(1000);
console.log('SKIP', await click('[data-k=skip]'));
await sleep(3000);
await shot('m-night.png', 900);
await sleep(6000);
await shot('m-night2.png', 900);
console.log('REPORT', JSON.stringify(await ev("(()=>[...document.querySelectorAll('#report-live text')].map(t=>t.textContent))()")));
await sleep(4000);
console.log('PHASE', JSON.stringify(await ev("({phase:window.__game.view.phase,day:window.__game.view.day})")));
await shot('m-day2.png', 900);
// 快进到结算：连点入夜 + 跳过预判
for (let i = 0; i < 9; i++) {
  const ph = await ev('window.__game.view.phase');
  if (ph === 'settle') break;
  await click('[data-act=night]');
  await sleep(700);
  const skipped = await click('[data-k=skip]');
  if (skipped !== 'ok') await click('.chip[data-k=pred]');
  await sleep(5200);
  console.log('ROUND', i, JSON.stringify(await ev("({phase:window.__game.view.phase,day:window.__game.view.day})")));
}
await sleep(1500);
await shot('m-settle.png', 760);
console.log('SETTLE', JSON.stringify(await ev("({phase:window.__game.view.phase,ai:(window.__game.view.settleStats||{}).ai})")));
console.log('ERRS', errs.slice(0, 8).join('\n'));
p.ws.close(); p.proc.kill();
