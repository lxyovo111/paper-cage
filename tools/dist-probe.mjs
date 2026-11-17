import { launch, sleep } from './cdp.mjs';
const errs = [];
const p = await launch();
await p.init();
p.on(m => {
  if (m.method === 'Runtime.exceptionThrown') errs.push('EX: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled') errs.push('C[' + m.params.type + ']: ' + m.params.args.map(a => a.value || a.description).join(' '));
});
await p.goto('http://127.0.0.1:7861/dist/index.html?seed=7&llm=0&speed=0.08');
await sleep(1200);
console.log('errs=', errs.slice(0, 8).join('\n---\n') || 'none');
console.log('has __game=', await p.ev('typeof window.__game'));
console.log('body=', await p.ev('document.body.innerHTML.length'));
await p.close();
