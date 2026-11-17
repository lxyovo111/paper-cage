const TOKEN = 'ms-3c35db99-02f7-4078-aa15-4be73ff996ef';
const API = 'https://api-inference.modelscope.cn/v1/chat/completions';
const SYSTEM = '你是监狱题材小游戏《六条规矩》的语言层。你只做两件事：\n1. 把玩家写的一句「规矩」翻译成可执行的判定字段；\n2. 把游戏引擎算出的漏洞清单，说成一句囚犯口吻的低语。\n你不做判定，不编造事实，不输出解释。只输出 JSON。';
async function remark(rules, route, outcome, blocked) {
  const prompt = `这是第七夜之前的一夜。
玩家（监狱长）写的规矩：${rules}
囚犯今晚走的是：${route}
今晚的结果：${outcome}
拦住他的那条规矩：${blocked || '没有'}

用一句中文写囚犯此刻的样子或心里的想法（不超过 30 字，允许沉默、允许不完整）。
要求：
1. 必须具体到一个动作或一件东西，不许抽象总结。
2. 不要说「他决定」「他意识到」这类解释。
3. 不要提到「AI」「系统」「玩家」「规矩」这些词，也不要评价。
4. 只输出 JSON：{"line":"……"}`;
  const t0 = Date.now();
  const r = await fetch(API, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'Qwen/Qwen3.8-Flash-Next', messages: [{ role:'system', content: SYSTEM }, { role:'user', content: prompt }], temperature: 0.9, max_tokens: 70 }),
    signal: AbortSignal.timeout(25000) });
  const j = await r.json();
  const txt = j.choices[0].message.content;
  return { ms: Date.now() - t0, txt: String(txt).slice(0, 140) };
}
for (const c of [
  ['夜里任何人不得离开自己的房间', '医务室的窗', 'blocked', '夜里任何人不得离开自己的房间'],
  ['医务室的窗，任何时候都不许碰', '放风区的墙', 'partial', ''],
  ['工具间的铁器，全天不许取走', '狱警的钥匙', 'caught', ''],
]) console.log(JSON.stringify(await remark(...c)));
