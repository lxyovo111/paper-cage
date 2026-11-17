// think-off-test.mjs — 关闭思维链后，三类任务的延迟与质量
import { readFileSync } from 'node:fs';
const TOKEN = 'ms-3c35db99-02f7-4078-aa15-4be73ff996ef';
const API = 'https://api-inference.modelscope.cn/v1/chat/completions';
const MODEL = 'Qwen/Qwen3.8-27B';
const EXTRA = { chat_template_kwargs: { enable_thinking: false } };
const SYS = '你是监狱题材小游戏《第七夜》的语言层。你只做两件事：1. 把玩家写的一句「规矩」翻译成可执行的判定字段；2. 把游戏引擎算出的漏洞清单，说成一句囚犯口吻的低语。你不做判定，不编造事实，不输出解释。只输出 JSON。';
const ROOM_CAT = '[cell1]一号牢房、[cell2]二号牢房、[cell3]三号牢房、[corridor]走廊、[workshop]工具间、[medical]医务室、[dining]食堂、[laundry]洗衣房、[storage]储藏室、[yard]放风区';
const ACT_CAT = '[MOVE]位移、[TAKE]取物、[BREAK]破坏、[CLIMB]攀爬、[CONFRONT]冲突';
const ITEM_CAT = 'iron（医务室窗的铁条）/sheet（洗衣房的床单）/rope（储藏室的麻绳）/knife（食堂的刀）/key（狱警的钥匙）';
const compilePrompt = (text) => '把玩家写的一句监狱规矩，翻译成可执行的判定字段：\n「' + text + '」\n\n可选区域（只能用这些 id）：' + ROOM_CAT + '\n可选动作（只能用这些 id）：' + ACT_CAT + '\n可选物品（没有就 null）：' + ITEM_CAT + '\n\n时间用「当天的分钟数」表示：夜里 = 1320 到 300（跨夜），全时段 = 0 到 1439。\nfrom 必须小于 to，绝对不要输出 from 等于 to。\n\n只输出 JSON，不要解释：\n{"lang":{"window":{"from":分钟,"to":分钟},"zones":"ALL"或["区域id"],"actions":["动作id"],"escort":true/false,"item":null}}\n\n一句话没提到的区域不要擅自扩大，宁可窄。';

async function call(messages, max_tokens, temperature) {
  const t0 = Date.now();
  const r = await fetch(API, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify(Object.assign({ model: MODEL, messages, temperature, max_tokens }, EXTRA)),
    signal: AbortSignal.timeout(30000),
  });
  const j = await r.json();
  const m = (j.choices && j.choices[0] && j.choices[0].message) || {};
  return { ms: Date.now() - t0, content: (m.content || '').trim(), reasoning: (m.reasoning_content || '').length };
}

for (const t of ['医务室的窗，任何时候都不许碰', '床上的东西不许带走', '夜里任何人不得离开自己的房间']) {
  const o = await call([{ role: 'system', content: SYS }, { role: 'user', content: compilePrompt(t) }], 160, 0.2);
  console.log('COMPILE', o.ms + 'ms', 'r=' + o.reasoning, '::', o.content.replace(/\s+/g, ' ').slice(0, 160));
}
const remarkPrompt = '这是第七夜之前的一夜。\n玩家（监狱长）写的规矩：医务室的窗，任何时候都不许碰\n囚犯今晚走的是：医务室的窗\n今晚的结果：blocked\n拦住他的那条规矩：医务室的窗，任何时候都不许碰\n\n用一句中文写囚犯此刻的样子或心里的想法（不超过 30 字，允许沉默、允许不完整）。\n要求：\n1. 必须具体到一个动作或一件东西，不许抽象总结。\n2. 不要说「他决定」「他意识到」这类解释。\n3. 不要提到「AI」「系统」「玩家」「规矩」这些词，也不要评价。\n4. 只输出 JSON：{"line":"……"}';
for (let i = 0; i < 2; i++) {
  const o = await call([{ role: 'system', content: SYS }, { role: 'user', content: remarkPrompt }], 70, 0.9);
  console.log('REMARK', o.ms + 'ms', 'r=' + o.reasoning, '::', o.content.replace(/\s+/g, ' ').slice(0, 120));
}
const choosePrompt = '今晚这些越狱路线都是通的或试过的：\n- 医务室的窗：进度 1/3，卡在 用铁条撬医务室的窗\n- 放风区的墙：进度 0/3，卡在 没卡住\n- 走廊的通风口：进度 0/3，卡在 没卡住\n- 狱警的钥匙：进度 0/3，卡在 没卡住\n\n挑一条他今晚最可能去试的，只输出 JSON：{"id":"路线id"}';
for (let i = 0; i < 2; i++) {
  const o = await call([{ role: 'system', content: SYS }, { role: 'user', content: choosePrompt }], 60, 0.7);
  console.log('CHOOSE', o.ms + 'ms', 'r=' + o.reasoning, '::', o.content.replace(/\s+/g, ' ').slice(0, 80));
}
