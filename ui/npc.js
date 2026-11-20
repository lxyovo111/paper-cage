// npc.js — 语言层。规则引擎算事实，LLM 只负责「把玩家的话编译成判定条」和「把漏洞写成一句话」。
// 全部带回退：LLM 超时 / 报错 / 输出不合规 → 直接用确定性规则。
import { compileRule, ruleFromLang, noteOf, ROOMS, ACTIONS, ROUTES } from '../game/engine.js';

const params = new URLSearchParams(location.search);
const LLM_ON = params.get('llm') !== '0';
export const llmOn = LLM_ON;
const TIMEOUT = 14000;          // 挑路 / 一句话：等 14 秒，超过就降级
const TIMEOUT_COMPILE = 34000;  // 编译：AI 核对可以晚，不挡玩家（本地判定先出）
// 部署形态：游戏页在 /，Gradio 语言层挂在 /ui 下
const NPC_API = '/gradio_api/call/npc';   // 魔搭 API Inference 冷启动可达 10s+，热了之后编译约 3–5s，所以前端不阻塞、只做「事后校准」

async function ask(payload, timeout) {
  const ac = new AbortController();
  const t = setTimeout(function () { ac.abort(); }, timeout || TIMEOUT);
  try {
    // 创空间里：Gradio 的隐藏接口 /gradio_api/call/npc（SSE 返回）
    const r = await fetch(NPC_API, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: [JSON.stringify(payload)] }), signal: ac.signal,
    });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    const ev = await fetch(NPC_API + '/' + j.event_id, { signal: ac.signal });
    const txt = await ev.text();
    const m = /event:\s*complete[\s\S]*?data:\s*(.+)/.exec(txt) || /data:\s*(.+)/.exec(txt);
    if (!m) throw new Error('no sse data');
    const arr = JSON.parse(m[1]);
    const out = JSON.parse(arr[0]);
    if (!out || out.ok === false) throw new Error((out && out.error) || 'llm fail');
    return out;
  } finally { clearTimeout(t); }
}

const ZONES = Object.keys(ROOMS), ACTS = Object.keys(ACTIONS), ITEMS = ['iron','sheet','rope','knife','key'];

// 把一句话编译成判定条。LLM 给了合法结构就用它，否则用引擎的正则版。
export async function compileSmart(text) {
  const local = compileRule(text);
  if (!local.ok || !LLM_ON) return local;
  try {
    const j = await ask({ task:'compile', text, lang:{
      rooms: ZONES.map(z => [z, ROOMS[z].name]), actions: ACTS.map(a => [a, ACTIONS[a]]), items: ITEMS,
    }}, TIMEOUT_COMPILE);
    const L = j && j.lang;
    if (!L || !L.window || !Array.isArray(L.actions) || !L.actions.length) throw new Error('bad shape');
    // 时间窗必须是合法区间：LLM 偶尔给出 0–0 这种空窗，直接用本地结果，别让它把规矩废掉
    // 引擎的时间窗支持跨夜（from > to），所以只禁止空窗和越界，不要求 to > from
    const wf = Number(L.window.from), wt = Number(L.window.to);
    if (!(wf >= 0 && wf <= 1439 && wt >= 0 && wt <= 1439) || wf === wt) throw new Error('bad window');
    const fixed = ruleFromLang(text, {
      window: L.window, zones: L.zones === 'ALL' ? 'ALL' : (Array.isArray(L.zones) ? L.zones : 'ALL'),
      actions: L.actions, escort: L.escort, item: ITEMS.includes(L.item) ? L.item : null,
    });
    // 双保险：本地能编译出具体区域/时间时，与 LLM 结果取「更具体」的一方
    const best = pickStricter(local, fixed);
    return { ok: true, rule: { text, lang: best.lang, note: best.note, leaks: 0, broken: false }, note: best.note, by: 'llm' };
  } catch (err) {
    return { ...local, by: 'local', degraded: true };
  }
}

function spec(l) {
  const broadZone = l.zones === 'ALL' ? 1 : 0;
  const broadTime = (l.window.from === 0 && l.window.to === 1439) ? 1 : 0;
  return broadZone + broadTime;
}
function pickStricter(a, b) {
  const A = { lang: a.rule.lang, note: a.note }, B = { lang: b.lang, note: b.note };
  return spec(B.lang) <= spec(A.lang) ? B : A;
}

// 让 AI 在引擎算好的漏洞清单里挑一条路 —— 但记忆必须进决策输入。
// 他是什么人（habit）、他记着哪条规矩拦过他几次（grudge）、哪条规矩漏过（leaks）、
// 上一夜走到哪一步（progress）、现在的敌意与服从度，全都喂给模型；模型回一条路 + 一句理由。
// 关掉 AI（?llm=0）就退回「第一条最松的路」且没有理由 —— 这就是 ablation 的可见差异。
export async function chooseHole(holes, state) {
  const top = holes[0];
  if (!LLM_ON || !top) return { id: top && top.id, line: top && template(top), by: 'local' };
  try {
    const routeName = (id) => {
      const r = ROUTES.find((x) => x.id === id);
      return r ? r.name : '';
    };
    const grudge = Object.keys(state.grudge || {})
      .filter((id) => state.grudge[id] > 0)
      .map((id) => {
        const r = (state.rules || []).find((x) => x.id === id);
        return (r ? '「' + r.text + '」' : id) + '拦过他 ' + state.grudge[id] + ' 次';
      });
    const leaks = (state.rules || [])
      .filter((r) => (r.leaks || 0) > 0)
      .map((r) => '「' + r.text + '」漏过 ' + r.leaks + ' 次');
    const memory = {
      day: state.day,
      habitLine: state.habit ? state.habit.line : '',
      hostility: Math.round(state.hostility || 0),
      obedience: Math.round(state.obedience || 0),
      grudge,
      leaks,
      progress: state.progress ? routeName(state.progress.routeId) + ' 走到第 ' + state.progress.done + ' 步' : '',
    };
    const j = await ask({
      task: 'choose',
      holes: holes.slice(0, 6).map((h) => ({ id: h.id, name: h.name, intent: h.intent || '', known: !!h.known, depth: h.depth, total: h.total, blockedAt: h.blockedAt || '' })),
      memory,
    });
    const hit = holes.find((h) => h.id === (j && j.id));
    if (!hit) return { id: top.id, line: template(top), by: 'local', degraded: true };
    const reason = (j && typeof j.reason === 'string') ? Array.from(j.reason.trim()).slice(0, 24).join('') : '';
    return { id: hit.id, reason, by: 'llm', line: template(hit) };
  } catch (e) {
    return { id: top.id, line: template(top), by: 'local', degraded: true };
  }
}
function template(h) {
  if (h.open) return '他知道 ' + h.name + '，今晚就去试试。';
  return '他试过 ' + h.name + '，被' + (h.blockedAt || '规矩') + '拦住过一次。';
}

// 夜里的一句话：他今晚走的是哪条路、被哪条规矩拦过。
// 只写一句，不下判断 —— 判定全部在引擎里，这里只负责「像个人」。
export async function remark(state, ctx) {
  const tpl = templateNight(ctx);
  if (!LLM_ON) return { line: tpl, by: 'local' };
  try {
    const j = await ask({
      task: 'remark',
      state: {
        day: state.day,
        rules: (state.rules || []).map(r => ({ text: r.text })),
        route: ctx.routeName, outcome: ctx.outcome, blocked: ctx.blocked || '',
      },
    });
    const line = j && typeof j.line === 'string' ? j.line.trim() : '';
    if (!line || Array.from(line).length > 32) throw new Error('bad line');
    return { line, by: 'llm' };
  } catch (e) {
    return { line: tpl, by: 'local', degraded: true };
  }
}

function templateNight(ctx) {
  if (ctx.outcome === 'escape') return '门开着，风是从外面进来的。';
  if (ctx.outcome === 'caught') return '他被按住的时候没有挣扎，只是看着灯。';
  if (ctx.outcome === 'slip') return '灯挪开了。他站在原地没动。';
  if (ctx.outcome === 'blocked') return '他在门口站了一会儿，把手插回兜里。';
  return '他把床板翻过来，又翻了回去。';
}

// 预热：页面加载时先戳一下模型，免得玩家写第一条规矩时刚好撞上冷启动。失败无所谓。
export function warm() {
  if (!LLM_ON) return;
  fetch(NPC_API, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: [JSON.stringify({ task: 'warm' })] }),
  }).catch(function () {});
}