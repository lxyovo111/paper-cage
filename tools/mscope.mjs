// tools/mscope.mjs — 附着到用户的 Edge，检查/操作魔搭页面
import { attach } from './attach.mjs';
import fs from 'node:fs';
const cmd = process.argv[2] || 'show';
const p = await attach('modelscope');
if (cmd === 'show') {
  const url = await p.ev('location.href');
  const title = await p.ev('document.title');
  console.log('URL:', url);
  console.log('TITLE:', title);
  const txt = await p.ev('document.body.innerText.slice(0,1500)');
  console.log('--- TEXT ---');
  console.log(txt);
  await p.shot('tools/mscope.png');
  console.log('shot tools/mscope.png');
} else if (cmd === 'buttons') {
  const btns = await p.ev('JSON.stringify([...document.querySelectorAll("button,a")].map(e=>({t:(e.innerText||e.getAttribute("aria-label")||"").trim().slice(0,30),h:e.href||"",c:(e.className||"").toString().slice(0,60)})).filter(x=>x.t).slice(0,80))');
  console.log(btns);
}
p.close();