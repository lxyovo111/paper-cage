import { launch, sleep } from './cdp.mjs';
const p = await launch();
await p.init();
await p.goto('http://127.0.0.1:7861/dist/index.html?seed=21&llm=0&speed=0.05');
await sleep(900);
await p.shot('tools/p1-start.png');
// 打开写规矩浮层
await p.ev('(()=>{const e=document.querySelector("[data-act=write]"); e.dispatchEvent(new MouseEvent("click",{bubbles:true}));})()');
await sleep(400);
await p.ev('(()=>{const t=document.querySelector("#rtxt"); t.value="夜里任何人不得离开自己的房间"; t.dispatchEvent(new Event("input",{bubbles:true}));})()');
await sleep(200);
await p.shot('tools/p2-write.png');
await p.ev('(()=>{document.querySelector("[data-k=compile]").dispatchEvent(new MouseEvent("click",{bubbles:true}));})()');
await sleep(600);
await p.shot('tools/p3-compiled.png');
await p.ev('(()=>{document.querySelector("[data-k=ok]").dispatchEvent(new MouseEvent("click",{bubbles:true}));})()');
await sleep(400);
// 入夜
await p.ev('(()=>{document.querySelector("[data-act=night]").dispatchEvent(new MouseEvent("click",{bubbles:true}));})()');
await sleep(400);
await p.shot('tools/p4-predict.png');
await p.ev('(()=>{document.querySelector("[data-k=skip]").dispatchEvent(new MouseEvent("click",{bubbles:true}));})()');
await sleep(1500);
await p.shot('tools/p5-night.png');
await sleep(7000);
await p.shot('tools/p6-morning.png');
console.log('errors none check');
await p.close();
