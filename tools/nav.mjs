import { attach } from './attach.mjs';
const url = process.argv[2];
const p = await attach('modelscope');
try { await p.send('Page.navigate', { url }); } catch (e) { }
await new Promise(r => setTimeout(r, 4500));
try { console.log(await p.ev('location.href')); } catch (e) { console.log('nav-done (session closed)'); }
p.close();