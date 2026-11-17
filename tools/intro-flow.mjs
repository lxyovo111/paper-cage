// intro-flow.mjs — 验收：封面 → 点红章 → 进入第一天；封面回车也能开始
import { launch, sleep } from "./cdp.mjs";
const errs = [];
const p = await launch({ port: 9333, dir: "C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-intro", w: 1600, h: 1000, scale: 2 });
await p.init();
p.on(m => { if (m.method === "Runtime.exceptionThrown") errs.push(m.params.exceptionDetails.text); });
await p.goto("http://127.0.0.1:7861/dist/index.html?seed=7&llm=0&intro=1");
await sleep(1200);
const before = await p.ev("({phase: window.__game.view.phase, seal: !!document.querySelector(\"[data-act=start]\")})");
const clicked = await p.ev("(()=>{const el=document.querySelector(\"[data-act=start]\"); if(!el) return false; el.dispatchEvent(new MouseEvent(\"click\",{bubbles:true,cancelable:true,view:window})); return true;})()");
await sleep(1200);
const after = await p.ev("({phase: window.__game.view.phase, day: window.__game.view.day, rules: window.__game.g.rules.length, seal: !!document.querySelector(\"[data-act=start]\"), write: !!document.querySelector(\"[data-act=write]\")})");
await p.shot("tools/intro-after.png");
console.log("BEFORE", JSON.stringify(before), "CLICK", clicked, "AFTER", JSON.stringify(after));
console.log("ERRS", errs.slice(0,3).join(" | ") || "none");
p.ws.close(); p.proc.kill();