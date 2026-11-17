import { attach } from "./attach.mjs";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await attach("modelscope");
const r1 = await p.ev("(()=>{const btn=[...document.querySelectorAll(\"button\")].find(b=>b.innerText.replace(/\s+/g,\"\")===\"确认部署\");if(!btn)return \"nobtn\";btn.click();return \"ok\";})()");
console.log("CLICK", r1);
await sleep(5000);
const r2 = await p.ev("(()=>{const t=document.body.innerText;const m=t.match(/构建中|部署中|发布中|运行中|排队中/);return {state:m?m[0]:null, hint:(t.match(/空间正在发布中[^\n]*/)||[])[0]||null};})()");
console.log("STATE", JSON.stringify(r2));
p.close();