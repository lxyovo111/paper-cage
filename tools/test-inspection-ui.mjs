import { connect } from './browser.mjs';
import { sleep } from './cdp.mjs';

const b = await connect();
const ev = b.ev;
const click = async (sel) => ev('(()=>{const el=document.querySelector(' + JSON.stringify(sel) + '); if(!el) return false; el.dispatchEvent(new MouseEvent("click",{bubbles:true})); return true;})()');
await b.goto('http://127.0.0.1:7861/dist/index.html?seed=8&llm=0&speed=0.05&intro=0', 1600);
const setup = await ev(`(()=>{
  const g = window.__game.g;
  g.day = 5; g.ap = 3;
  const texts = [
    '夜里任何人不得离开自己的房间。',
    '医务室的窗，任何时候都不许碰。',
    '工具间的铁器，全天不许取走。',
    '洗衣房的床单，夜里不许取走。',
    '储藏室的麻绳，全天不许触碰。',
    '食堂的刀，任何时候不许取走。'
  ];
  for (const t of texts) { g.ap = 3; const r = window.__game.E.writeRule(g, t); if (!r.ok) return 'write failed: ' + t; }
  return { rules:g.rules.length, day:g.day, ap:g.ap };
})()`);
console.log('setup=', JSON.stringify(setup));

await ev('window.__game.askNight()');
await sleep(250);
const chooser = await ev('JSON.stringify({title:(document.querySelector(".sheet h3")||{}).textContent, chips:document.querySelectorAll(".sheet .chip").length, text:(document.querySelector(".sheet")||{}).innerText.slice(0,180)})');
console.log('chooser=', chooser);
await b.shot('tools/inspection-chooser.png');

console.log('pick=', await click('.sheet .chip'));
await sleep(250);
console.log('editor=', await ev('JSON.stringify({title:(document.querySelector(".sheet h3")||{}).textContent, val:(document.querySelector("#rtxt")||{}).value})'));
await b.shot('tools/inspection-editor.png');
await ev('(()=>{const t=document.querySelector("#rtxt"); t.value="放风区的墙，任何时候都不许碰。"; t.dispatchEvent(new Event("input",{bubbles:true}));})()');
await click('[data-k="compile"]');
await sleep(350);
console.log('verdict=', await ev('JSON.stringify({title:(document.querySelector(".sheet h3")||{}).textContent, sub:(document.querySelector(".sheet .sub")||{}).textContent, hasOk:!!document.querySelector("[data-k=ok]")})'));
await click('[data-k="ok"]');
await sleep(600);
console.log('afterRewrite=', await ev('JSON.stringify({rules:window.__game.g.rules.length, id:window.__game.g.rules[0].id, text:window.__game.g.rules[0].text, from:window.__game.g.rules[0].rewrittenFrom, ap:window.__game.g.ap, sheet:!!document.querySelector(".sheet")})'));

await ev('window.__game.askNight()');
await sleep(300);
console.log('night=', await ev('JSON.stringify({title:(document.querySelector(".sheet h3")||{}).textContent, preds:document.querySelectorAll(".sheet .chip[data-k=pred]").length})'));
await b.shot('tools/test-inspection-ui.png');
b.close();
