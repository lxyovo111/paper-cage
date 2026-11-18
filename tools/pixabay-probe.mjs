import { launch } from './cdp.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await launch({ port: 9331, dir: 'C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-pix', w: 1440, h: 1000, scale: 1 });
await p.send('Page.enable'); await p.send('Runtime.enable');
await p.send('Page.navigate', { url: 'https://pixabay.com/sound-effects/film-special-effects-paper-rustle-81855/' });
await sleep(9000);
const info = await p.ev('JSON.stringify({title:document.title, txt:document.body.innerText.slice(0,300), audios:[...document.querySelectorAll("audio")].map(a=>a.src||a.currentSrc), mp3:[...performance.getEntriesByType("resource")].map(e=>e.name).filter(u=>u.indexOf(".mp3")>=0).slice(0,5)})');
console.log('INFO', info);
p.ws.close(); p.proc.kill();
