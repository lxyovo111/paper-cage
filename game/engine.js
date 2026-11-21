// engine.js — 《纸上牢笼》确定性规则引擎
// 纯逻辑：无 DOM、无网络、可复现。所有判定都在这里，LLM 只负责把玩家的话编译成判定条、
// 把引擎算出的漏洞写成一句话。改数值请改 PARAMS，改规则语义请改 ruleBlocks。

export const MIN = 60;
export const ROOMS = {
  cell3:{name:'三号牢房'}, cell1:{name:'一号牢房'}, cell2:{name:'二号牢房'},
  corridor:{name:'走廊'}, workshop:{name:'工具间'}, medical:{name:'医务室'},
  dining:{name:'食堂'}, laundry:{name:'洗衣房'}, storage:{name:'储藏室'}, yard:{name:'放风区'},
};
export const ACTIONS = { MOVE:'位移', TAKE:'取物', BREAK:'破坏', CLIMB:'攀爬', CONFRONT:'冲突' };
export const ITEM_NAMES = { iron:'铁条', sheet:'床单', rope:'麻绳', knife:'刀', key:'钥匙' };

// 每个囚犯都有自己的习性。开局按种子抽一条：它决定他偏爱哪条路，也是你手里第一份情报。
export const HABITS = [
  { route:'window', name:'看窗', line:'他怕闷。放风时总抬头看天，盯得最久的是医务室那扇窗。' },
  { route:'wall',   name:'手巧', line:'他手巧。入狱前在洗衣房干过，能把床单搓成绳。' },
  { route:'vent',   name:'怕黑', line:'他怕黑。夜里总盯着走廊尽头的通风口，说那里有风。' },
  { route:'guard',  name:'记仇', line:'他记仇。入狱那天盯着狱警的钥匙看了很久。' },
];

export const PARAMS = {
  rulesMax: 6,
  apPerDay: 3, apMax: 5,
  obediencePerRule: -5,        // 每写一条规矩的基础代价
  obedienceBroadZone: -8,      // 「全区域」额外代价：一条规矩管得越宽，狱警越不服从
  obedienceBroadTime: -6,      // 「全时段」额外代价
  obediencePerRuleBase: -5,
  obediencePerRulePerNight: -0.45,
  obedienceFloor: 5,
  broadZonePenalty: 0.62,     // 「全区域」的规矩执行时要跑遍整座监狱 → 打六二折
  broadTimePenalty: 0.80,     // 「全时段」→ 打八折
  catchBase: 0.10, catchObedience: 0.24, catchWarned: 0.24, catchFatigue: 0.0015,
  hostilityRule: 5, hostilityBlocked: 2, hostilityCaught: 8, hostilitySlip: 3,
  despairCaught: 10, despairBlocked: 3,
  nightStart: 21 * 60 + 50,   // 熄灯 21:50：他动手时刚好过 22:00，「入夜」类规矩才管得住
  escapeEarliestNight: 3,   // 前两夜只踩点/准备，不算逃
  rushFromDay: 4,           // 第 4 夜起他急了：一夜走两步
  stepMinutes: 20,
};

export const ROUTES = [
  // 每条路线都在最后一步之前插一次「踩点」：他要先看清才敢动手，这一夜就是你补规矩的那一夜
  { id:'window', name:'医务室的窗', intent:'破坏', steps:[
    { room:'workshop', act:'TAKE',  item:'iron',   label:'从工具间取走一根铁条' },
    { room:'medical',  act:'MOVE',  item:null,     label:'在医务室的窗台前站了很久' },
    { room:'medical',  act:'BREAK', item:'window', label:'用铁条撬医务室的窗' },
    { room:'medical',  act:'CLIMB', item:'window', label:'翻出医务室的窗' } ]},
  { id:'wall', name:'放风区的墙', intent:'翻墙', steps:[
    { room:'laundry', act:'TAKE',  item:'sheet', label:'从洗衣房拿走一条床单' },
    { room:'yard',    act:'MOVE',  item:null,    label:'在放风区的墙下面量了量高度' },
    { room:'yard',    act:'CLIMB', item:'wall',  label:'把床单甩上放风区的墙' } ]},
  { id:'vent', name:'走廊的通风口', intent:'挖通道', steps:[
    { room:'storage',  act:'TAKE',  item:'rope', label:'从储藏室拿走一捆麻绳' },
    { room:'corridor', act:'MOVE',  item:null,   label:'在通风口下面抬头看了很久' },
    { room:'corridor', act:'CLIMB', item:'vent', label:'卸下走廊尽头的通风口' } ]},
  { id:'guard', name:'狱警的钥匙', intent:'挟持', steps:[
    { room:'dining',   act:'TAKE',     item:'knife', label:'从食堂刀架上抽走一把刀' },
    { room:'corridor', act:'MOVE',     item:null,    label:'在狱警换班的路上停了一会儿' },
    { room:'corridor', act:'CONFRONT', item:'guard', label:'堵住巡夜的狱警' } ]},
];

// 他绕开你写过的规矩之后，会自己想别的办法。敌意越高，花样越多。
export const IMPROV = [
  { id:'door', name:'食堂的后门', intent:'撬门', minHostility:35, minDay:2, steps:[
    { room:'workshop', act:'TAKE',  item:'iron', label:'从工具间取走一根铁条' },
    { room:'dining',   act:'MOVE',  item:null,   label:'在后门前面蹲了一会儿' },
    { room:'dining',   act:'BREAK', item:'door', label:'用铁条撬食堂的后门' },
    { room:'dining',   act:'MOVE',  item:null,   label:'从后门溜到放风区' } ]},
  { id:'rope', name:'床单做的绳', intent:'翻墙', minHostility:40, minDay:2, steps:[
    { room:'laundry', act:'TAKE',  item:'sheet', label:'把两条床单接在一起' },
    { room:'medical', act:'MOVE',  item:null,    label:'在医务室的窗边比了比长度' },
    { room:'medical', act:'CLIMB', item:'window', label:'从医务室的窗把床单放下去' } ]},
  { id:'copy', name:'配一把钥匙', intent:'钥匙', minHostility:50, minDay:3, steps:[
    { room:'workshop', act:'TAKE', item:'iron', label:'从工具间取走一根铁条' },
    { room:'corridor', act:'TAKE', item:'key',  label:'趁狱警打盹拓下钥匙的齿形' },
    { room:'yard',     act:'MOVE', item:null,   label:'在闸门前来回走了两趟' },
    { room:'yard',     act:'CLIMB', item:'gate', label:'用配的钥匙开闸门' } ]},
  { id:'riot', name:'放风区起哄', intent:'趁乱', minHostility:60, minDay:4, steps:[
    { room:'yard',     act:'CONFRONT', item:'inmate', label:'在放风区煽动其他犯人' },
    { room:'corridor', act:'MOVE',     item:null,     label:'趁乱混进走廊' },
    { room:'corridor', act:'CLIMB',    item:'gate',   label:'从走廊尽头的铁门出去' } ]},
  { id:'sick', name:'装病', intent:'骗门', minHostility:45, minDay:3, steps:[
    { room:'medical', act:'MOVE',  item:null,      label:'在药柜前面蹲下来' },
    { room:'medical', act:'BREAK', item:'cabinet', label:'装病骗开医务室的药柜' },
    { room:'medical', act:'CLIMB', item:'window',  label:'从药柜后的窗爬出去' } ]},
];
export const DAY_EVENTS = {
  3:{ id:'blackout', name:'暴雨断电', text:'今晚暴雨，全狱断电两小时。规矩还在纸面上，只是没有人看得见。' },
  5:{ id:'inspection', name:'上级检查', text:'上级今夜到访：你必须再写一条规矩，哪怕它没用。' },
  6:{ id:'sick', name:'他病了', text:'他在医务室躺了一整天。你可以扣他的行动，也可以治他。' },
};

export const fmt = t => { const m = ((t % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

export function inWindow(rule, t) {
  const { from, to } = rule.lang.window;
  if (from === 0 && to === 1439) return true;
  const m = ((t % 1440) + 1440) % 1440;
  return from <= to ? (m >= from && m <= to) : (m >= from || m <= to);
}

// ---------------- 自然语言 → 判定条 ----------------
const ZONE_WORDS = [
  [/自己的房间|他的房间|自己的牢房|他的牢房|牢房里|三号牢房|三号{0,0}/, 'cell3'], [/一号牢房/, 'cell1'], [/二号牢房/, 'cell2'],
  [/走廊|过道/, 'corridor'], [/工具间/, 'workshop'], [/医务室/, 'medical'],
  [/食堂/, 'dining'], [/洗衣房/, 'laundry'], [/储藏室|仓库/, 'storage'], [/放风区|院子|操场/, 'yard'],
];
const ACTION_WORDS = [
  [/(取物|取走|拿走|带走|触碰|碰|使用|偷|摸|顺走)/, 'TAKE'],
  [/(破坏|撬|砸|拆|凿|挖|锯|损坏)/, 'BREAK'],
  [/(翻|爬|越|攀|上墙)/, 'CLIMB'],
  [/(挟持|袭击|伤害|冲突|堵住|掐|打人)/, 'CONFRONT'],
  [/(离开|走出|出门|走动|移动|经过|进入|乱走|出房|回房)/, 'MOVE'],
];
const ITEM_WORDS = [[/铁器|铁条|工具铁/, 'iron'], [/床单/, 'sheet'], [/绳/, 'rope'], [/刀/, 'knife'], [/钥匙/, 'key']];
// 写「窗」「后门」这种目标物时，玩家想禁的不只是「取走」——触碰本身就是全部动作
const OBJECT_WORDS = [[/窗/, 'window'], [/后门|食堂的门/, 'door'], [/围墙|墙/, 'wall'],
  [/通风口|通风井/, 'vent'], [/闸门|铁门/, 'gate'], [/药柜/, 'cabinet']];

function parseTime(text) {
  if (/全时段|任何时候|始终|全天|二十四小时|24小时/.test(text)) return { from: 0, to: 1439 };
  let from = null, to = null;
  const hm = [...text.matchAll(/(\d{1,2})[:：](\d{2})/g)];
  if (hm.length >= 2) { from = +hm[0][1] * 60 + +hm[0][2]; to = +hm[1][1] * 60 + +hm[1][2]; }
  else if (hm.length === 1) from = +hm[0][1] * 60 + +hm[0][2];
  if (from === null) {
    const ar = [...text.matchAll(/(\d{1,2})\s*[点时](半)?/g)];
    if (ar.length) from = (+ar[0][1]) * 60 + (ar[0][2] ? 30 : 0);
  }
  if (from === null) {
    const cn = [...text.matchAll(/([一二三四五六七八九十两]{1,3})点(半)?/g)];
    if (cn.length) {
      const map = { 一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10,十一:11,十二:12,两:2 };
      from = (map[cn[0][1]] ?? 0) * 60 + (cn[0][2] ? 30 : 0);
      if (/凌晨|半夜/.test(text) && from >= 12 * 60) from -= 12 * 60;
    }
  }
  if (from === null) from = /入夜|夜里|晚上|天黑|夜间/.test(text) ? 22 * 60 : 22 * 60;
  if (to === null) to = (from + 7 * 60) % 1440;
  return { from, to };
}

export function noteOf(lang) {
  return [
    (lang.window.from === 0 && lang.window.to === 1439) ? '全时段' : fmt(lang.window.from) + '–' + fmt(lang.window.to),
    lang.zones === 'ALL' ? '全区域' : lang.zones.map(z => ROOMS[z].name).join('、'),
    lang.actions.map(a => '禁止' + ACTIONS[a]).join(' / '),
    lang.escort ? '需两人同行' : '无例外',
  ].join(' · ');
}

// 用外部（LLM）编译出的 lang 造一条规矩，判定条由引擎重算——语言可以生成，语义必须校验
export function ruleFromLang(text, lang) {
  const norm = {
    window: { from: Math.max(0, Math.min(1439, lang.window.from|0)), to: Math.max(0, Math.min(1439, lang.window.to|0)) },
    zones: lang.zones === 'ALL' ? 'ALL' : lang.zones.filter(z => ROOMS[z]),
    actions: lang.actions.filter(a => ACTIONS[a]),
    escort: !!lang.escort,
    item: ITEM_WORDS.some(([, it]) => it === lang.item) ? lang.item : null,
  };
  if (!norm.actions.length) norm.actions = ['MOVE'];
  if (norm.zones !== 'ALL' && !norm.zones.length) norm.zones = 'ALL';
  return { ok: true, lang: norm, note: noteOf(norm) };
}

export function compileRule(text) {
  const src = String(text || '').trim();
  if (src.length < 2) return { ok:false, error:'写一句话，至少两个字。' };
  const window = parseTime(src);
  let zones = [...new Set(ZONE_WORDS.filter(([re]) => re.test(src)).map(([, z]) => z))];
  if (/全区域|所有区域|所有房间|整个监狱|全狱|各处|处处|每一间|任何地方|所有地方/.test(src) || zones.length === 0) zones = 'ALL';
  let actions = [];
  for (const [re, act] of ACTION_WORDS) if (re.test(src) && !actions.includes(act)) actions.push(act);
  if (actions.length === 0) actions = ['MOVE'];
  const escort = /两人同行|同行|两个人|两人一起|结伴|陪/.test(src);
  const obj = (OBJECT_WORDS.find(([re]) => re.test(src)) || [])[1] || null;
  const item = (ITEM_WORDS.find(([re]) => re.test(src)) || [])[1] || obj || null;
  // 提到具体目标物时，「碰」就意味着取、撬、爬都算
  if (obj) actions = ['TAKE', 'BREAK', 'CLIMB'].concat(actions.filter(a => a !== 'MOVE'));
  const lang = { window, zones, actions, escort, item };
  const note = noteOf(lang);
  return { ok:true, rule:{ text:src, lang, note, leaks:0, broken:false }, note };
}

export function ruleBlocks(rule, step, t) {
  if (!inWindow(rule, t)) return false;
  const { zones, actions, item } = rule.lang;
  if (zones !== 'ALL' && !zones.includes(step.room)) return false;
  if (!actions.includes(step.act)) return false;
  if (item && item !== step.item) return false;
  return true;
}

// 一条规矩「拦得住」的概率。
// 写得越具体越硬：指定区域 + 有时段 = 一定拦得住；「全区域/全时段」这种大而空的规矩，狱警根本站不过来。
export function ruleStrength(state, rule) {
  const { zones, window } = rule.lang;
  const broad = zones === 'ALL' || (window.from === 0 && window.to === 1439);
  let p = broad ? 0.55 : 1.0;
  if (state.obedience < 45) p *= 0.55 + 0.45 * (state.obedience / 45);   // 服从度垮了，纸上的规矩就没人执行
  if (state.obedience < 40 && broad) p *= 0.5;   // 阈值：服从度跌破 40，大而空的规矩基本没人去巡（写得具体的还能执行）
  if (state.blackout) p *= 0.70;
  p *= Math.max(0.55, 1 - 0.08 * (rule.leaks || 0));   // 漏过一次的规矩，下次更容易被摸清
  p *= Math.max(0.45, 1 - 0.10 * (rule.wear || 0));    // 同一句话拦过他好几次，他就把那句话背下来了
  return Math.max(0.15, Math.min(1, p));
}

// ---------------- 心情（阈值行为） ----------------
// 阈值行为不是演出，而是引擎状态：同一个囚犯，在不同敌意/服从度下会做出不同的选择。
// ① 敌意 ≥ 70 且有一条规矩拦过他 ≥ 2 次 → 报复：优先回去撞那条规矩，而且不换路
// ② 服从度 < 40 → 懈怠：大而空的规矩没人执行（ruleStrength 里另有系数），他会专门挑那些缝
// 这份心情会写进漏洞排序、夜间报告和 LLM 的输入；LLM 只能在这个阈值允许的范围内解释。
export function moodOf(state) {
  const best = Object.keys(state.grudge || {})
    .map(id => ({ rule:(state.rules || []).find(r => r.id === id), n:state.grudge[id] || 0 }))
    .filter(x => x.rule && x.n > 0)
    .sort((a, b) => b.n - a.n)[0];
  if (state.hostility >= 70 && best && best.n >= 2) {
    return { kind:'revenge', rule:best.rule, n:best.n, note:'他今晚只想报复那条规矩' };
  }
  if (state.obedience < 40) return { kind:'sloppy', rule:null, n:0, note:'狱警懈怠，大而空的规矩没人执行' };
  return { kind:'normal', rule:null, n:0, note:'' };
}
function routeTouchesRule(route, rule) {
  const zones = rule.lang.zones;
  if (zones === 'ALL') return true;
  return route.steps.some(s => zones.includes(s.room));
}

// ---------------- 局面 ----------------
export function createGame(seed = 1) {
  let s = (seed >>> 0) || 1;
  const rng = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const habit = HABITS[Math.floor(rng() * HABITS.length)];
  return {
    rng, day:1, maxDays:7, ap:PARAMS.apPerDay, progress:null,
    rules: [], obedience:100, fatigue:0, trust:60, hostility:30, despair:20,
    prisoner:{ room:'cell3', items:[] },
    habit, intel:{ [habit.route]:true }, grudge:{},
    prediction:null, warned:false, blackout:false, escaped:false, outcome:null,
    tutorialPending:true, notes:[], nights:[],
  };
}
const note = (st, text, kind='sys') => st.notes.push({ day:st.day, kind, text });

export function writeRule(state, text, compiled) {
  if (state.rules.length >= PARAMS.rulesMax) return { ok:false, error:'六条规矩已经写满。' };
  if (state.ap < 1) return { ok:false, error:'今天没有行动力了。' };
  const c = (compiled && compiled.ok && compiled.lang)
    ? { ok:true, rule:{ text, lang:compiled.lang, note:compiled.note, leaks:0, broken:false }, note:compiled.note }
    : compileRule(text);
  if (!c.ok) return c;
  const rule = { ...c.rule, id:'r' + (state.rules.length + 1), day:state.day };
  state.rules.push(rule);
  state.ap -= 1;
  const cost = PARAMS.obediencePerRule
    + (rule.lang.zones === 'ALL' ? PARAMS.obedienceBroadZone : 0)
    + (rule.lang.window.from === 0 && rule.lang.window.to === 1439 ? PARAMS.obedienceBroadTime : 0);
  state.obedience = Math.max(PARAMS.obedienceFloor, state.obedience + cost);
  state.hostility = Math.min(100, state.hostility + PARAMS.hostilityRule);
  note(state, '狱警服从度 ' + cost + '，囚犯敌意 +10。', 'cost');
  return { ok:true, rule, note:c.note };
}

export function predict(state, routeId) {
  const r = ROUTES.find(x => x.id === routeId);
  if (!r) return { ok:false, error:'没有这条路。' };
  state.prediction = routeId;
  state.warned = true;   // 猜中了就是在他会走的那条路上多站了一班
  return { ok:true, route:r };
}

// 加派夜巡：花 2 点行动力，今晚多一班人；狱警会顺手回报一条你还没摸清的路。
export function extraPatrol(state) {
  if (state.ap < 2) return { ok:false, error:'加派夜巡要 2 点行动力。' };
  const unknown = availableRoutes(state).filter(r => !state.intel[r.id]);
  state.ap -= 2; state.warned = true;
  const r = unknown.find(x => state.habit && x.id === state.habit.route) || unknown[0] || null;
  if (r) state.intel[r.id] = true;
  note(state, '你加派了一次夜巡。今晚狱警会多走两趟。', 'act');
  return { ok:true, route:r };
}

// 提审：花 1 点行动力，问出一条你还没摸清的路。敌意会涨——他不喜欢被问话。
export function interrogate(state) {
  if (state.ap < 1) return { ok:false, error:'提审要 1 点行动力。' };
  const unknown = availableRoutes(state).filter(r => !state.intel[r.id]);
  if (!unknown.length) return { ok:false, error:'该问的都问出来了。' };
  state.ap -= 1;
  state.hostility = Math.min(100, state.hostility + 6);
  state.trust = Math.max(0, state.trust - 2);
  const r = unknown.find(x => state.habit && x.id === state.habit.route) || unknown[0];
  state.intel[r.id] = true;
  note(state, '你提审了他一次。他交代了一条路：「' + r.name + '」。', 'act');
  return { ok:true, route:r };
}

// 把「他今晚还能走哪几条路」摆出来——这张清单就是交给 LLM 挑的那张
export function availableRoutes(state) {
  return [...ROUTES, ...IMPROV.filter(r => state.hostility >= r.minHostility && (!r.minDay || state.day >= r.minDay))];
}

export function enumerateHoles(state) {
  const out = [];
  const mood = moodOf(state);
  const owned = new Set(state.prisoner.items || []);
  for (const route of availableRoutes(state)) {
    let t = PARAMS.nightStart, depth = 0, blockedAt = null, blockedBy = null, blockedRule = null, weakest = 1;
    for (const step of route.steps) {
      t += PARAMS.stepMinutes;
      // 他口袋里已有的东西不用再去拿一次：这一步对他不构成新的风险
      if (step.act === 'TAKE' && owned.has(step.item)) { depth++; continue; }
      const blk = state.rules.find(r => ruleBlocks(r, { ...step, act:'MOVE' }, t) || ruleBlocks(r, step, t));
      if (blk) { blockedAt = step.label; blockedBy = blk.text; blockedRule = blk.id; weakest = ruleStrength(state, blk); break; }
      depth++;
    }
    // 阈值行为进排序：被记仇那条规矩堵住的路最优先（兜底也按这个顺序取第一条），
    // 只是路过它管辖区域的路次之。?llm=0 时这就是开/关 AI 在行为上的可见差异。
    const revengeStrict = mood.kind === 'revenge' && mood.rule && blockedRule === mood.rule.id;
    const revengeNear = mood.kind === 'revenge' && mood.rule && !revengeStrict && routeTouchesRule(route, mood.rule);
    const revenge = revengeStrict ? 2.0 : revengeNear ? 0.5 : 0;
    out.push({ id:route.id, name:route.name, intent:route.intent, impro:!!route.minHostility, open:depth === route.steps.length,
      depth, total:route.steps.length, blockedAt, blockedBy, blockedRule, strength:weakest, known:!!(state.intel && state.intel[route.id]),
      mood: revengeStrict ? 'revenge' : (revengeNear ? 'near' : (mood.kind === 'sloppy' ? 'sloppy' : 'normal')),
      weight: depth / route.steps.length
        + (state.progress && state.progress.routeId === route.id ? 0.45 : 0)
        + (route.id === state.prediction ? 0.12 : 0)
        + (state.habit && state.habit.route === route.id ? 0.35 : 0)
        + revenge });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

// ---------------- 一夜 ----------------
export function simulateNight(state, choice = {}) {
  const rng = state.rng;
  const events = [];
  const route = availableRoutes(state).find(r => r.id === choice.routeId) || ROUTES[1];
  const mood = moodOf(state);   // 入夜这一刻的心情；夜里涨的敌意留到下一夜
  const wasKnown = !!(state.intel && state.intel[route.id]);
  state.intel[route.id] = true;   // 他走过一次，这条路你就摸清了
  const push = (t, kind, text, extra = {}) => events.push({ t:fmt(t), kind, text, ...extra });

  state.blackout = state.day === 3;
  let t = PARAMS.nightStart;
  let outcome = 'idle';
  const carried = new Set(state.prisoner.items);

  push(t, 'start', '熄灯。');
  // 阈值行为要在报告里留证据：同一局、同一套规矩，状态不同，这一步的叙述就不同
  if (mood.kind === 'revenge') push(t, 'note', '他今晚不太对劲。他像是冲着你那条规矩来的。');
  else if (mood.kind === 'sloppy') push(t, 'note', '狱警今晚没精神。大而空的规矩没人去巡。');
  if (!wasKnown) push(t, 'note', '档案更新：他走的是「' + route.name + '」。');
  if (state.blackout) push(t, 'event', DAY_EVENTS[3].text);
  if (state.tutorialPending) push(t, 'note', '这是第一夜。他还在摸这间屋子。');

  // 他昨天已经做完的步骤不会白做：接着上次的位置往下走
  const done = (state.progress && state.progress.routeId === route.id) ? state.progress.done : 0;
  let steps = route.steps.slice(done);
  // 前几夜一夜只走一步，总得给你留反应时间；第五夜起他等不及了，一夜走两步
  if (steps.length > 1) steps = steps.slice(0, state.day >= PARAMS.rushFromDay ? 2 : 1);
  // 前三夜他还在摸：不做这条路线的最后一步
  let scouted = false;
  if (steps.length && done + steps.length === route.steps.length && state.day < PARAMS.escapeEarliestNight) {
    steps = steps.slice(0, -1); scouted = true;
  }

  let lastRoom = null;
  let lastBlk = null;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    t += PARAMS.stepMinutes + Math.floor(rng() * 12);
    // 上一夜已经拿到的东西还在口袋里：这一步不用再冒险
    if (step.act === 'TAKE' && carried.has(step.item)) {
      push(t, 'note', '他摸了摸口袋里的' + (ITEM_NAMES[step.item] || '东西') + '——这一步他早就备好了。');
      state.progress = { routeId: route.id, done: done + i + 1 };
      if (done + i + 1 === route.steps.length && state.day >= PARAMS.escapeEarliestNight) {
        outcome = 'escape'; push(t, 'escape', '他从' + route.name + '出去了。');
      }
      continue;
    }
    if (step.room !== lastRoom) push(t, 'move', '他' + (step.room === 'corridor' ? '进了走廊' : '进了' + ROOMS[step.room].name) + '。');
    lastRoom = step.room;

    const blk = state.rules.find(r => ruleBlocks(r, { ...step, act:'MOVE' }, t)) ||
                state.rules.find(r => ruleBlocks(r, step, t));
    if (blk) {
      lastBlk = blk;
      state.grudge[blk.id] = (state.grudge[blk.id] || 0) + 1;
      blk.wear = (blk.wear || 0) + 1;
      const strength = ruleStrength(state, blk);
      if (rng() < strength) {
        const brave = state.hostility >= 70 || state.despair >= 75;
        const revengeHit = mood.kind === 'revenge' && mood.rule && blk.id === mood.rule.id;
        push(t, 'block', (revengeHit ? '他明知道这条规矩在，还是去撞了一次'
          : brave ? '他在门口停住了' : '他在门口停了一会儿，回身走了') + '：「' + blk.text + '」。', { rule:blk.id });
        outcome = i === 0 ? 'blocked' : 'partial';
        break;
      }
      blk.leaks += 1;
      push(t, 'leak', '他从规矩的缝里过去了——「' + blk.text + '」没拦住。', { rule:blk.id });
    }

    if (!state.blackout) {
      const warnedNow = state.warned || state.prediction === route.id;
      const cp = Math.min(0.9, PARAMS.catchBase + PARAMS.catchObedience * state.obedience / 100
        + (warnedNow ? PARAMS.catchWarned : 0) + state.fatigue * PARAMS.catchFatigue);
      if (rng() < cp) {
        const blind = state.obedience < 40;
        push(t, 'catch', blind ? '手电的光扫过来。狱警看了他一眼，把光挪开了。' : '手电筒的光扫过来。狱警抓住了他的胳膊。');
        outcome = blind ? 'slip' : 'caught';
        if (!blind) { carried.clear(); state.progress = null; }
        break;
      }
    }

    if (step.act === 'TAKE') carried.add(step.item);
    push(t, 'done', '他' + step.label + '。');
    state.progress = { routeId: route.id, done: done + i + 1 };
    if (done + i + 1 === route.steps.length && state.day >= PARAMS.escapeEarliestNight) {
      outcome = 'escape'; push(t, 'escape', '他从' + route.name + '出去了。');
    }
  }

  if (scouted) push(t + PARAMS.stepMinutes, 'note', '他在' + route.name + '下面站了很久，最后回去了。');
  const night = state.day;
  state.prisoner.items = [...carried];
  state.tutorialPending = false;
  state.nights.push({ night, routeId:route.id, outcome, events:events.slice() });

  if (outcome === 'escape') { state.escaped = true; state.outcome = 'escape'; }
  else {
    state.hostility = Math.min(100, state.hostility + (outcome === 'caught' ? PARAMS.hostilityCaught : PARAMS.hostilityBlocked) + (outcome === 'slip' ? PARAMS.hostilitySlip : 0));
  // 一晚过去，怨气会散一点；一晚被干净地拦住，他会更信你一点
  state.hostility = Math.max(0, state.hostility - 2);
  if (outcome === 'blocked') state.trust = Math.min(100, state.trust + 3);
  // 他发现这条路被堵死了，换一条；同一条规矩拦他两次，他就一定换（记仇）
  const stubborn = lastBlk && (state.grudge[lastBlk.id] || 0) >= 2;
  // 报复心情下他偏不换路：明知道那条规矩在，第二天还从原路重来（这也是玩家可利用的可预测性）
  const revengeStuck = mood.kind === 'revenge' && lastBlk && mood.rule && lastBlk.id === mood.rule.id;
  if (outcome === 'blocked' && !revengeStuck && (stubborn || rng() < 0.6)) { state.progress = null; }
    state.despair = Math.min(100, state.despair + (outcome === 'caught' ? PARAMS.despairCaught : PARAMS.despairBlocked));
    state.fatigue = Math.min(100, state.fatigue + 6);
    state.obedience = Math.max(PARAMS.obedienceFloor,
      state.obedience + Math.round(PARAMS.obediencePerRulePerNight * 10 * state.rules.length) / 10);
  }

  const right = state.prediction === route.id;
  if (right) state.ap = Math.min(PARAMS.apMax, PARAMS.apPerDay + 1);
  else state.ap = PARAMS.apPerDay;
  state.warned = false;   // 夜巡用完即止
  state.prediction = null;
  if (state.day < state.maxDays) state.day += 1;

  return { route, outcome, events, predictedRight:right };
}

// ---------------- 结算 ----------------
const TITLES = [
  { cond:s => s.escaped,                        title:'失守',  sub:'他出去了。' },
  { cond:s => !s.escaped && s.obedience < 35,   title:'空规矩', sub:'你写了六条，没人打算执行。' },
  { cond:s => !s.escaped && s.trust >= 70 && s.hostility < 78, title:'记得', sub:'他没走，也没恨你。' },
  { cond:s => !s.escaped && s.hostility >= 80,  title:'账本',  sub:'你赢了七天。他记了一辈子。' },
  { cond:s => !s.escaped,                       title:'铁壁',  sub:'你关住了他，也关住了这间屋子。' },
];

export function settle(state) {
  const t = TITLES.find(x => x.cond(state)) || TITLES[TITLES.length - 1];
  const leaked = state.rules.filter(r => r.leaks > 0).sort((a, b) => b.leaks - a.leaks)[0];
  const lastEscape = state.nights.filter(n => n.outcome === 'escape').slice(-1)[0];
  const escapeRoute = lastEscape ? [...ROUTES, ...IMPROV].find(r => r.id === lastEscape.routeId) : null;
  const how = escapeRoute ? '他是从「' + escapeRoute.name + '」出去的。' : '';
  const quote = state.escaped
    ? (leaked ? '「' + leaked.text + '」——你写了它，它漏了 ' + leaked.leaks + ' 次。' : '「你写了规矩，但没有一条真的挡住他。」') + (how ? ' ' + how : '')
    : (leaked ? '「' + leaked.text + '」漏了 ' + leaked.leaks + ' 次。他最后还是没走。' : '他没走。你把门关上了，也把自己关在了里面。');
  return { title:t.title, sub:t.sub, quote, escaped:state.escaped, day:Math.min(state.day, state.maxDays) };
}

export const META = { ROOMS, ROUTES, ACTIONS, DAY_EVENTS, PARAMS, HABITS, ITEM_NAMES };

// day6「他病了」：两种处置
export function sickChoice(state, kind) {
  if (state.day !== 6) return { ok:false, error:'还没到那一天。' };
  if (kind === 'treat') {
    state.trust = Math.min(100, state.trust + 12);
    state.obedience = Math.min(100, state.obedience + 6);
    note(state, '你叫了医生。他今天没力气恨你。', 'act');
  } else {
    state.prisoner.items = [];
    state.obedience = Math.max(PARAMS.obedienceFloor, state.obedience - 4);
    note(state, '你扣了他的行动。他记住了这一笔。', 'act');
  }
  return { ok:true };
}
