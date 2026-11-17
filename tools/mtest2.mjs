import { launch } from './cdp.mjs';
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await launch({ port: 9313, dir: 'C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-mtest', w: 390, h: 844, scale: 2 });
const errs = [];
p.on(m => {
  if (m.method === 'Runtime.exceptionThrown') { const e = m.params.exceptionDetails; errs.push('EXC ' + (e.exception && e.exception.description || e.text)); }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('CONSOLE ' + (m.params.args||[]).map(a=>a.value||a.description).join(' '));
});
await p.send('Page.enable'); await p.send('Runtime.enable');
await p.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await p.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const ev = async (expr) => { const r = await p.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error('EVAL ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text)); return r.result.value; };
const shot = async (name) => {
  await ev('window.scrollTo(0,0)');
  const h = await ev('Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)');
  const r = await p.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
  fs.writeFileSync('tools/' + name, Buffer.from(r.data, 'base64'));
  console.log('SHOT', name, 'h=' + h);
};
const click = async (sel) => ev("(()=>{const el=document.querySelector(" + JSON.stringify(sel) + ");if(!el)return 'no:'+ " + JSON.stringify(sel) + ";el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return 'ok';})()");
await p.send('Page.navigate', { url: 'http://127.0.0.1:7861/dist/index.html?seed=21&llm=0&speed=0.5&intro=0' });
await sleep(3500);
await shot('m2-day.png');
await click('#rules g[data-act=write]'); await sleep(400);
await ev("(()=>{const t=document.getElementById('rtxt');const s=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;s.call(t,'洗衣房的床单，夜里不许取走');t.dispatchEvent(new Event('input',{bubbles:true}));return t.value;})()");
await click('[data-k=compile]'); await sleep(1000);
await shot('m2-verify.png');
await click('[data-k=ok]'); await sleep(1200);
await shot('m2-rule.png');
await click('[data-act=night]'); await sleep(900);
await click('[data-k=skip]');
await sleep(1400);
await shot('m2-night.png');
let n = 0;
for (let i = 0; i < 14; i++) {
  await sleep(400);
  n = await ev("document.querySelectorAll('#report-live text').length");
  const ph = await ev('window.__game.view.phase');
  if (n >= 3 || ph !== 'night') break;
}
console.log('LINES', n);
await shot('m2-night-report.png');
for (let i = 0; i < 20; i++) { const ph = await ev('window.__game.view.phase'); if (ph === 'day') break; await sleep(400); }
await sleep(500);
await shot('m2-day2.png');
for (let i = 0; i < 9; i++) {
  const ph = await ev('window.__game.view.phase');
  if (ph === 'settle') break;
  await click('[data-act=night]'); await sleep(700);
  const sk = await click('[data-k=skip]');
  if (sk !== 'ok') await click('.chip[data-k=pred]');
  await sleep(4600);
}
await sleep(1200);
await shot('m2-settle.png');
console.log('SETTLE', JSON.stringify(await ev("({p:window.__game.view.phase, ai:(window.__game.view.settleStats||{}).ai})")));
console.log('ERRS', errs.slice(0, 6).join('\n'));
p.ws.close(); p.proc.kill();