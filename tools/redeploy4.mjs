import { attach } from "./attach.mjs";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach("modelscope");
const all = async () => JSON.parse(String(await p.ev("(()=>{const out=[];document.querySelectorAll(\"*\").forEach(e=>{const t=(e.innerText||\"\").trim(); if(!t||t.length>20)return; const r=e.getBoundingClientRect(); if(!r.width||!r.height)return; out.push({t,tag:e.tagName,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height),dis:!!e.disabled});});return JSON.stringify(out);})()")));
const clickAt = async (x,y) => { await p.send("Input.dispatchMouseEvent",{type:"mouseMoved",x,y,button:"none"}); await sleep(120); await p.send("Input.dispatchMouseEvent",{type:"mousePressed",x,y,button:"left",clickCount:1}); await sleep(100); await p.send("Input.dispatchMouseEvent",{type:"mouseReleased",x,y,button:"left",clickCount:1}); };
let list = await all();
const red = list.filter(o=>o.t==="重新部署" && o.x < 1600).sort((a,b)=>b.w-a.w)[0];
console.log("RED", JSON.stringify(red));
await clickAt(red.x, red.y);
let conf = null;
for (let i = 0; i < 14; i++) {
  await sleep(1500);
  list = await all();
  const cands = list.filter(o=>/确认部署/.test(o.t));
  if (cands.length) { conf = cands.sort((a,b)=>b.w-a.w)[0]; console.log("CAND", JSON.stringify(cands.slice(0,4))); if (!conf.dis) break; }
  if (i % 3 === 0) console.log("wait", i, "n", list.filter(o=>/确认|取消|部署信息/.test(o.t)).map(o=>o.t).join("/"));
}
console.log("CONF", JSON.stringify(conf || null));
if (conf && !conf.dis) { await clickAt(conf.x, conf.y); console.log("CLICKED"); }
await sleep(4000);
const body = String(await p.ev("document.body.innerText.slice(0,400)")).replace(/\n{2,}/g," | ");
console.log("BODY", body.slice(0,300));
p.close();