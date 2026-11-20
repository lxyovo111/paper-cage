import { readFileSync } from 'node:fs';
const TOKEN = process.env.MODELSCOPE_API_KEY || readFileSync(new URL('.ms-key', import.meta.url), 'utf8').trim();
const API = 'https://api-inference.modelscope.cn/v1/chat/completions';
const MODEL = 'nex-agi/Nex-N2.5-mini';
async function chat(messages, max_tokens, temperature) {
  const t0 = Date.now();
  try {
    const r = await fetch(API, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, temperature: temperature || 0.3, max_tokens: max_tokens || 140 }), signal: AbortSignal.timeout(20000) });
    const j = await r.json();
    if (!j.choices) return { ms: Date.now() - t0, err: JSON.stringify(j).slice(0, 100) };
    return { ms: Date.now() - t0, txt: String(j.choices[0].message.content).replace(/\s+/g, ' ') };
  } catch (e) { return { ms: Date.now() - t0, err: String(e).slice(0, 80) }; }
}
const ROOMS = '[cell1]一号牢房、[cell2]二号牢房、[cell3]三号牢房、[corridor]走廊、[workshop]工具间、[medical]医务室、[dining]食堂、[laundry]洗衣房、[storage]储藏室、[yard]放风区';
const ACTS = '[MOVE]位移、[TAKE]取物、[BREAK]破坏、[CLIMB]攀爬、[CONFRONT]冲突';
function cp(text) { return '把这句话转成判定字段：\n「' + text + '」\n\n可选区域：' + ROOMS + '\n可选动作：' + ACTS + '\n可选物品：iron/sheet/rope/knife/key\n时间用分钟：夜里=1320到300，全时段=0到1439，from 必须小于 to。\n\n只输出 JSON：\n{"lang":{"window":{"from":分钟,"to":分钟},"zones":"ALL"或["区域id"],"actions":["动作id"],"escort":true/false,"item":null}}'; }
for (const t of ['夜里不许拿走医务室的东西','床上的东西不许带走','医务室的窗，任何时候都不许碰','入夜后，任何人不得离开自己的房间']) {
  const o = await chat([{ role: 'user', content: cp(t) }], 140, 0.2);
  console.log(t, '=>', JSON.stringify(o));
}
for (const s of ['夜里任何人不得离开自己的房间', '医务室的窗，任何时候都不许碰']) {
  const prompt = '监狱长写的规矩：' + s + '\n囚犯今晚去摸医务室的窗，被规矩挡住退回去了。\n用一句中文写他此刻的样子（不超过30字，具体到一个动作或一件东西，不许评价）。只输出 JSON：{"line":"……"}';
  const o = await chat([{ role: 'user', content: prompt }], 70, 0.9);
  console.log('REMARK', JSON.stringify(o));
}