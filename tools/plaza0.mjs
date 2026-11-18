import { connect } from './browser.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const b = await connect();
const t = await b.send('Target.createTarget', { url: 'https://mseo-ai-inf.ms.show/works' });
const a = await b.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sid = a.sessionId;
await b.send('Runtime.enable', {}, sid);
await sleep(7000);
const info = await b.ev(`(() => {
  const txt = document.body.innerText.slice(0, 3000);
  const links = [...document.querySelectorAll('a')].map(a => ({h: a.getAttribute('href'), t: (a.innerText||'').trim().slice(0,60)})).filter(x => x.h);
  return { url: location.href, title: document.title, txt, links: links.slice(0, 60) };
})()`, sid);
console.log(JSON.stringify(info, null, 1).slice(0, 6000));
const shot = await b.send('Page.captureScreenshot', { format: 'png' }, sid);
(await import('node:fs')).writeFileSync('tools/plaza0.png', Buffer.from(shot.data, 'base64'));
await b.send('Target.closeTarget', { targetId: t.targetId });
b.close();
