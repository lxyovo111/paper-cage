import { launch } from './cdp.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await launch({ port: 9401, dir: 'C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-plaza', w: 1600, h: 1000, scale: 1 });
await p.goto('https://mseo-ai-inf.ms.show/works', 8000);
const info = await p.ev(`(() => {
  const txt = document.body.innerText.slice(0, 2500);
  const links = [...document.querySelectorAll('a')].map(a => ({h:a.getAttribute('href'), t:(a.innerText||'').trim().slice(0,50)})).filter(x=>x.h);
  return { url: location.href, title: document.title, txt, links: links.slice(0,80), html: document.body.innerHTML.length };
})()`);
console.log(JSON.stringify(info, null, 1).slice(0, 7000));
await p.shot('tools/plaza0.png');
await p.close();
