import { readFileSync } from 'node:fs';
const TOKEN = process.env.MODELSCOPE_API_KEY || readFileSync(new URL('.ms-key', import.meta.url), 'utf8').trim();
const API = 'https://api-inference.modelscope.cn/v1/chat/completions';
const MODEL = 'Qwen/Qwen3.8-27B';
const SYS = '你是监狱题材小游戏《六条规矩》的语言层。你只做两件事：1. 把玩家写的一句「规矩」翻译成可执行的判定字段；2. 把游戏引擎算出的漏洞清单，说成一句囚犯口吻的低语。你不做判定，不编造事实，不输出解释。只输出 JSON。';
const ROOM_CAT = '[cell1]一号牢房、[cell2]二号牢房、[cell3]三号牢房、[corridor]走廊、[workshop]工具间、[medical]医务室、[dining]食堂、[laundry]洗衣房、[storage]储藏室、[yard]放风区';
const ACT_CAT = '[MOVE]位移、[TAKE]取物、[BREAK]破坏、[CLIMB]攀爬、[CONFRONT]冲突';
const ITEM_CAT = 'iron（医务室窗的铁条）/sheet（洗衣房的床单）/rope（储藏室的麻绳）/knife（食堂的刀）/key（狱警的钥匙）';
function prompt(text) {
  return '把玩家写的一句监狱规矩，翻译成可执行的判定字段：\n「' + text + '」\n\n可选区域（只能用这些 id）：' + ROOM_CAT + '\n可选动作（只能用这些 id）：' + ACT_CAT + '\n可选物品（没有就 null）：' + ITEM_CAT + '\n\n时间用「当天的分钟数」表示：夜里 = 1320 到 300（跨夜），全时段 = 0 到 1439。\nfrom 必须小于 to，绝对不要输出 from 等于 to。\n\n只输出 JSON，不要解释：\n{"lang":{"window":{"from":分钟,"to":分钟},"zones":"ALL"或["区域id"],"actions":["动作id"],"escort":true/false,"item":null}}\n\n一句话没提到的区域不要擅自扩大，宁可窄。';
}
const cases = ['床上的东西不许带走', '入夜后，任何人不得离开自己的房间'];
for (const c of cases) {
  const t0 = Date.now();
  try {
    const r = await fetch(API, { method:'POST', headers:{ Authorization:'Bearer ' + TOKEN, 'content-type':'application/json' },
      body: JSON.stringify({ model: MODEL, messages: [{ role:'system', content: SYS }, { role:'user', content: prompt(c) }], temperature: 0.2, max_tokens: 160 }),
      signal: AbortSignal.timeout(40000) });
    const j = await r.json();
    const txt = j.choices ? String(j.choices[0].message.content).replace(/\s+/g, ' ') : JSON.stringify(j).slice(0, 90);
    console.log((Date.now() - t0) + 'ms', c, '=>', txt);
  } catch (e) { console.log((Date.now() - t0) + 'ms', c, 'ERR', String(e).slice(0, 60)); }
}