// app.js — 游戏主控。渲染归 screen.js，判定归 engine.js，语言归 npc.js。
import { renderScreen } from './screen.js';
import { renderMobile, renderMobileSettle, isMobileView } from './mobile.js';
import { renderIntro, renderIntroMobile } from './intro.js';
import { audio } from './audio.js';
import * as E from '../game/engine.js';
import { compileSmart, chooseHole, remark, warm, llmOn } from './npc.js';

const stage = document.getElementById('screen');
const ov = document.getElementById('overlay');
const CN = ['零', '一', '二', '三', '四', '五', '六', '七'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 演示与自动化测试用：?speed=0.1 把整夜的等待压到十分之一
const SPEED = Math.max(0.02, Math.min(4, +(new URLSearchParams(location.search).get('speed') || 1)));
const wait = (ms) => sleep(ms * SPEED);

let g = null, view = null, busy = false, wroteToday = false;
// 给评审看的一行账：这一局 AI 出了多少次手、其中多少次真的生效（失败就是降级成规则）
let aiStat = { picks: 0, picksLLM: 0, lines: 0, linesLLM: 0 };

const FALLBACK = {
  cell3:[120,300], cell1:[120,120], cell2:[120,210], corridor:[380,250], workshop:[560,100],
  medical:[560,170], dining:[560,240], laundry:[560,310], storage:[120,430], yard:[560,400],
};

// ---------- 小工具 ----------
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:absolute;left:50%;bottom:6%;transform:translateX(-50%);pointer-events:none;' +
      'background:rgba(34,29,25,.9);color:#f0e6d0;font-size:13px;letter-spacing:2px;padding:9px 18px;' +
      'font-family:var(--song);z-index:9;transition:opacity .3s;border:1px solid rgba(240,230,208,.25)';
    ov.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}

function openSheet(html) {
  ov.innerHTML = '<div class="scrim"><div class="sheet">' + html + '</div></div>';
  return ov.querySelector('.sheet');
}
function closeSheet() { ov.innerHTML = ''; }
ov.addEventListener('click', (ev) => {
  if (ev.target.classList.contains('scrim')) closeSheet();
});

// ---------- 视图同步 ----------
function syncView() {
  view.day = g.day; view.ap = g.ap; view.apMax = E.PARAMS.apPerDay;
  view.obedience = Math.round(g.obedience); view.hostility = Math.round(g.hostility);
  view.rules = g.rules.map((r) => ({ text: r.text, note: r.note }));
}
async function paint() {
  // 进入界面：封面也分横竖两版，和游戏本体用同一套纸与印章
  if (view && view.phase === 'cover') {
    if (isMobileView()) { stage.style.aspectRatio = '800 / 1840'; stage.innerHTML = renderIntroMobile(); }
    else { stage.style.aspectRatio = ''; stage.innerHTML = renderIntro(); }
    return;
  }
  // 手机竖屏走 mobile.js 的纵向版式；桌面仍是 screen.js 的 1600×1000 一屏。规则与判定完全一致。
  if (isMobileView()) {
    const settle = view.phase === 'settle';
    stage.style.aspectRatio = settle ? '800 / 1500' : '800 / 1840';
    stage.innerHTML = settle ? renderMobileSettle(view) : renderMobile(view);
    return;
  }
  stage.style.aspectRatio = '';
  stage.innerHTML = await renderScreen(view);
}
async function centers() {
  try {
    const mapMod = await import('./map.js');
    if (mapMod.ROOM_RECTS) {
      const o = {};
      for (const k in mapMod.ROOM_RECTS) {
        const r = mapMod.ROOM_RECTS[k];
        const x = Array.isArray(r) ? r[0] : r.x, y = Array.isArray(r) ? r[1] : r.y;
        const w = Array.isArray(r) ? r[2] : r.w, h = Array.isArray(r) ? r[3] : r.h;
        o[k] = [x + w / 2, y + h / 2];
      }
      return o;
    }
  } catch (err) {}
  return FALLBACK;
}
async function pathFor(route) {
  // 优先用地图预先画好的、穿门过廊的折线；没有就退回房间中心连线
  try {
    const mapMod = await import('./map.js');
    const p = mapMod.MAP_PATHS && mapMod.MAP_PATHS[route.id];
    if (p && p.length > 1) return p;
  } catch (err) {}
  const c = await centers();
  const pts = [c.cell3];
  for (const st of route.steps) pts.push(c[st.room] || c.corridor);
  return pts;
}

// ---------- 开局 ----------
// 封面：只填 paint 需要的字段，真正的状态在 newGame() 里创建
function showCover() {
  view = { phase:'cover', day:1, ap:3, apMax:3, obedience:100, hostility:30, rules:[], report:[], path:null, tokens:null };
  paint();
}

function newGame() {
  const m = /[?&]seed=(\d+)/.exec(location.search);
  g = E.createGame(m ? +m[1] : (Date.now() % 90000) + 1000);
  view = { phase:'day', day:1, ap:3, apMax:3, obedience:100, hostility:30, rules:[], report:[], path:null, tokens:null };
  wroteToday = false;
  aiStat = { picks: 0, picksLLM: 0, lines: 0, linesLLM: 0 };
  dayBriefing();
  paint();
  if (g.day === 6) askSick();
}

function dayBriefing() {
  syncView();
  view.phase = 'day'; view.path = null; view.tokens = null;
  const d = g.day;
  let lines = [];
  const last = g.nights[g.nights.length - 1];
  if (last) {
    const pick = (k) => last.events.filter((e) => e.kind === k)[0];
    const out = { blocked:'他被拦住了。', partial:'他走到一半，退了回去。', caught:'他被抓了回来。',
      slip:'狱警看了他一眼，把光挪开了。', escape:'他出去了。', idle:'今夜什么也没发生。' }[last.outcome] || '';
    const mv = pick('move');
    const act = last.events.filter((e) => ['take','break','climb','steal','note'].indexOf(e.kind) >= 0)[0];
    if (last.outcome === 'idle' && !mv) lines.push({ t:'昨夜', text: out });
    else if (mv) { lines.push({ t:'昨夜', text: mv.text }); if (act) lines.push({ t:'', text: act.text }); }
    else lines.push({ t:'昨夜', text: out });
    if (last.reason) lines.push({ t:'', text:'他挑这条路，因为：' + last.reason });
  }
  if (d === 1) lines = [
    { t:'档案', text:g.habit ? g.habit.line : '' },
    { t:'', text:'七天。你有六条规矩，和一个每天夜里都在找缝的人。' },
    { t:'', text:'写一条规矩，然后按右下角的「入夜」。' },
  ];
  else if (d === 3) lines.push({ t:'22:30', text: E.DAY_EVENTS[3].text });
  else if (d === 5) lines.push({ t:'17:00', text: E.DAY_EVENTS[5].text });
  else if (d === 6) lines.push({ t:'15:00', text: E.DAY_EVENTS[6].text });
  else if (d !== 1) lines.push({ t:'', text:'第 ' + CN[d] + ' 天。他今天话少。' });
  view.report = lines.slice(0, 4);
}

// ---------- 写规矩 ----------
const EXAMPLES = [
  '入夜后，任何人不得离开自己的房间。',
  '医务室的窗，任何时候都不许碰。',
  '工具间的铁器，全天不许取走。',
];

async function askWrite() {
  if (busy) return;
  if (g.rules.length >= E.PARAMS.rulesMax) return toast('六条规矩已经写满了。');
  if (g.ap < 1) return toast('今天的行动力用完了。');
  const sheet = openSheet(
    '<h3>写 一 条 规 矩</h3>' +
    '<p class="sub">一句话说清楚：什么时候 · 在哪儿 · 不许做什么</p>' +
    '<textarea id="rtxt" maxlength="60" placeholder="例：夜里不许离开牢房"></textarea>' +
    '<p class="hint">写得越具体越拦得住；写得越宽，狱警越不服从。</p>' +
    '<div class="examples" id="exs">' + EXAMPLES.map((x) => '<span>' + x + '</span>').join('') + '</div>' +
    '<div class="row"><button class="btn ghost" data-k="cancel">不写了</button>' +
    '<button class="btn primary" data-k="compile">归 档</button></div>'
  );
  const ta = sheet.querySelector('#rtxt');
  ta.focus();
  sheet.querySelector('#exs').addEventListener('click', (ev) => {
    if (ev.target.tagName === 'SPAN') { ta.value = ev.target.textContent; ta.focus(); }
  });
  ta.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); doCompile(); } });
  sheet.addEventListener('click', (ev) => {
    const k = ev.target.dataset && ev.target.dataset.k;
    if (k === 'cancel') closeSheet();
    if (k === 'compile') doCompile();
  });
  async function doCompile() {
    const text = ta.value.trim();
    if (text.length < 4) return toast('再写长一点。');
    // 先出确定性的判定条（规则引擎，0ms），AI 随后在后台核对一遍——不挡玩家
    let local;
    try { local = E.compileRule(text); } catch (err) { local = { ok: false, error: '这句判不了。' }; }
    if (!local.ok) return toast(local.error || '这句判不了。');
    audio.sfx('pen');
    const idx = g.rules.length;
    showVerdict(sheet, text, local, llmOn);
    compileSmart(text).then(function (r) {
      if (!r || !r.ok || r.by !== 'llm') return;
      // 浮层还开着：直接换判定条 + AI 标签
      const nEl = sheet.querySelector('.verdict .n');
      if (nEl && document.body.contains(sheet)) {
        nEl.innerHTML = esc(r.note) + '<span class="ai-tag">AI 校准</span>';
        sheet.__result = r;
        const pend = sheet.querySelector('.ai-pend');
        if (pend) pend.remove();
        return;
      }
      // 玩家已经写下去了：规矩已经进册，把它的判定条就地更新
      const rule = g.rules[idx];
      if (rule && rule.text === text) {
        rule.lang = r.rule ? r.rule.lang : rule.lang;
        rule.note = r.note;
        if (view.phase === 'day' && !busy) { syncView(); paint(); }
      }
    }).catch(function () {});
  }
}

function showVerdict(sheet, text, r, pending) {
  sheet.__result = r;
  audio.sfx('paper');
  sheet.innerHTML =
    '<h3>归 档 完 毕</h3>' +
    '<p class="sub">你的话被译成了一条能执行的判定</p>' +
    '<div class="verdict"><div class="q">' + esc(text) + '</div>' +
    '<div class="n">' + esc(r.note) + '</div>' +
    (pending ? '<div class="ai-pend">AI 正在核对这条规矩的判定…</div>' : '') + '</div>' +
    '<p class="hint" style="margin-top:14px">' + costHint(r) + '</p>' +
    '<div class="row"><button class="btn ghost" data-k="back">改 写</button>' +
    '<button class="btn primary" data-k="ok">写 下</button></div>';
  sheet.querySelector('[data-k="back"]').addEventListener('click', () => { closeSheet(); askWrite(); });
  sheet.querySelector('[data-k="ok"]').addEventListener('click', async () => {
    const rr = sheet.__result || r;
    const w = E.writeRule(g, text, { ok:true, lang: rr.rule ? rr.rule.lang : rr.lang, note: rr.note });
    if (!w.ok) return toast(w.error);
    audio.sfx('stamp');
    wroteToday = true;
    closeSheet();
    syncView();
    const last = g.rules[g.rules.length - 1];
    view.report = [
      { t:'归档', text:'「' + last.text + '」' },
      { t:'', text: last.note },
      { t:'', text:'狱警服从度 ' + Math.round(g.obedience) + '，囚犯敌意 ' + Math.round(g.hostility) + '。' },
    ];
    await paint();
  });
}

function costHint(r) {
  const l = r.rule ? r.rule.lang : r.lang;
  const broad = l.zones === 'ALL' || (l.window.from === 0 && l.window.to === 1439);
  return broad
    ? '这条规矩管得太宽了。狱警会照办，但不会认真照办——服从度会掉得更快。'
    : '这条规矩写得很具体。具体就意味着他真的会去执行。';
}

// ---------- 预判 + 入夜 ----------
async function askNight() {
  if (busy) return;
  if (g.day === 5 && !wroteToday) return toast('今晚上级检查：你必须再写一条规矩。');
  const holes = E.enumerateHoles(g);
  const sheet = openSheet(
    '<h3>今 夜 他 会 试 哪 条 路</h3>' +
    '<p class="sub">没查过的路只能赌。猜中：明天多 1 点行动力，狱警也会多站一班</p>' +
    '<p class="hint">档案：' + esc(g.habit ? g.habit.line : '') + '</p>' +
    '<div class="chips">' + E.availableRoutes(g).map((r) => {
      const hole = holes.find((h) => h.id === r.id) || {};
      const detail = hole.known
        ? (hole.open ? '这条路是通的' : '卡在：' + (hole.blockedAt || '') + (hole.strength < 0.6 ? '（拦得不稳）' : ''))
        : '没查过这条路';
      return '<div class="chip" data-k="pred" data-id="' + r.id + '"><div><div class="nm">' + r.name +
        '</div><div class="in" style="' + (hole.known ? '' : 'opacity:.5') + '">' + detail + '</div></div></div>';
    }).join('') + '</div>' +
    '<div class="row stack"><button class="btn ghost" data-k="interrogate">提审他 · 1 行动力</button>' +
    '<button class="btn ghost" data-k="patrol">加派夜巡 · 2 行动力</button></div>' +
    '<div class="row"><button class="btn ghost" data-k="skip">不猜，直接入夜</button></div>'
  );
  sheet.addEventListener('click', async (ev) => {
    const el = ev.target.closest ? ev.target.closest('.chip') : null;
    const k = ev.target.dataset && ev.target.dataset.k;
    if (el) { closeSheet(); E.predict(g, el.dataset.id); runNight(); return; }
    if (k === 'skip') { closeSheet(); runNight(); return; }
    if (k === 'interrogate' || k === 'patrol') {
      const r = k === 'interrogate' ? E.interrogate(g) : E.extraPatrol(g);
      if (!r.ok) return toast(r.error);
      closeSheet();
      syncView();
      await paint();
      const nm = r.route ? '「' + r.route.name + '」' : '一条你已经知道的路';
      toast(k === 'interrogate' ? '他交代了：' + nm : '夜巡回报：他最近在看' + nm);
      askNight();
    }
  });
}

async function runNight() {
  busy = true;
  const holes = E.enumerateHoles(g);
  // AI 的「决定」：引擎先把所有真实漏洞算清，LLM 只能在这张清单里挑一条最像人的；
  // 挑完仍由引擎逐条校验、执行。关掉 AI（?llm=0）就退回「第一条最松的路」，这就是 ablation。
  // 与动画并行：让 AI 挑路线的时间藏在「熄灯 + 画夜路」的 3.5 秒里
  const pickP = chooseHole(holes, g).catch(() => null);
  const guess = holes[0].id;
  const route0 = E.availableRoutes(g).find((r) => r.id === guess) || E.ROUTES[1];
  view.phase = 'night'; syncView();
  audio.setMode('night'); audio.sfx('lights');
  setTimeout(function () { audio.sfx('steps'); }, 900 * SPEED);
  view.path = await pathFor(route0);
  view.report = [];
  await paint();
  await wait(3500);
  const pick = await pickP;
  aiStat.picks += 1;
  if (pick && pick.by === 'llm') aiStat.picksLLM += 1;
  const actual = (pick && pick.id) || guess;
  const route = E.availableRoutes(g).find((r) => r.id === actual) || E.ROUTES[1];
  if (actual !== guess && route !== route0) {
    view.path = await pathFor(route);
    await paint();
    await wait(2200);
  }

  const res = E.simulateNight(g, { routeId: actual });
  // AI 挑路时给的那句理由：记进这一夜。第二天早上的巡查报告会写「他挑这条路，因为……」——
  // 记忆不是旁白，是决策输入；关掉 AI 这一行就不存在，正是对照组的差别。
  const reasonTxt = (pick && pick.reason) || '';
  const nightRec = g.nights[g.nights.length - 1];
  if (nightRec && reasonTxt) nightRec.reason = reasonTxt;
  // AI 只写「他今晚的样子」这一句。判定、路线、结局全在引擎里，AI 没有权限改任何数值。
  // 与逐条打印并行：打印完它刚好回来，不额外等；关掉 AI 或超时就用模板句。
  const blk = res.events.find((e) => e.kind === 'block');
  const remarkP = remark(g, {
    routeName: res.route.name, outcome: res.outcome, blocked: blk ? blk.text : '',
  }).catch(() => null);
  const live = stage.querySelector('#report-live');
  // 第五夜起他一夜走两步，事件会比以前多；先把「熄灯」这类气氛行省掉，保证两个动作都能看见
  const evs = res.events.slice();
  const compact = res.events.length > 5;   // 按原始条数判断，否则删掉「熄灯」后又被判成宽松排版，最后一条会被挤掉
  if (compact) { const si = evs.findIndex(function (e) { return e.kind === 'start'; }); if (si >= 0) evs.splice(si, 1); }
  const mobileView = isMobileView();
  const pitch = compact ? (mobileView ? 20 : 24) : 30;
  const maxY = compact ? (mobileView ? 892 : 912) : 906;
  let y = 792;
  for (const ev of evs) {
    if (y > maxY) break;
    appendLine(live, ev, y, compact);
    y += ev.kind === 'escape' ? pitch + 4 : pitch;
    await wait(ev.kind === 'escape' ? 1400 : 950);
  }
  // 这句话永远要有：AI 慢就先落一句模板，AI 回来后原地换掉 —— 玩家不需要等任何人。
  const rk = await Promise.race([remarkP, wait(7500).then(() => null)]);
  const noteEl = y <= maxY + 6 ? appendLine(live, { t: '', text: (rk && rk.line) || localNightLine(res.outcome), kind: 'note', id: 'remark-line' }, y, compact) : null;
  aiStat.lines += 1;
  if (rk && rk.line && rk.by === 'llm') aiStat.linesLLM += 1;
  if (noteEl && (!rk || rk.by !== 'llm')) {
    remarkP.then(function (late) {
      if (!late || !late.line || late.by !== 'llm') return;
      const t2 = noteEl.querySelectorAll('text');
      if (t2.length > 1) t2[1].textContent = Array.from(late.line).slice(0, 42).join('');
      aiStat.linesLLM += 1;
    }).catch(function () {});
  }
  await wait(1100);
  busy = false;
  if (g.escaped || g.nights.length >= g.maxDays) await showSettle();
  else { audio.setMode('day'); dayBriefing(); await paint(); if (g.day === 6) askSick(); }
}

function appendLine(live, ev, y, compact) {
  if (!live) return null;
  const NS = 'http://www.w3.org/2000/svg';
  // 版式换算：桌面版直接用屏幕坐标；手机版由 #report-live 的 data-cfg 折算（同一套打字逻辑）
  let cfg = null;
  try { const raw = live.getAttribute && live.getAttribute('data-cfg'); if (raw) cfg = JSON.parse(raw); } catch (err) {}
  const k = cfg ? cfg.k : 1;
  const Y = cfg ? cfg.y0 + (y - 792) * k : y;
  const X1 = cfg ? cfg.x1 : 252, X2 = cfg ? cfg.x2 : 306;
  const FS = cfg ? Math.round(cfg.fs * (compact ? 0.86 : 1)) : null;
  const COLS = cfg ? cfg.cols : 42;
  const color = { block:'#882e1f', leak:'#882e1f', catch:'#544a3c', escape:'#882e1f', event:'#80603c', note:'#7e6f5c' }[ev.kind] || '#40372d';
  const font = ev.kind === 'event' || ev.kind === 'note' ? 'KaiTi' : 'SimSun';
  const chars = Array.from(ev.text);
  const rows = [];
  for (let i = 0; i < chars.length; i += COLS) rows.push(chars.slice(i, i + COLS).join(''));
  const box = document.createElementNS(NS, 'g');
  const t0 = document.createElementNS(NS, 'text');
  t0.setAttribute('x', String(X1)); t0.setAttribute('y', String(Y));
  t0.setAttribute('font-size', String(FS ? Math.round(FS * 0.72) : (compact ? 11 : 12))); t0.setAttribute('fill', '#7e6f5c');
  t0.setAttribute('letter-spacing', '0.5'); t0.textContent = ev.t || '';
  box.appendChild(t0);
  rows.slice(0, 2).forEach((row, i) => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', String(X2)); t.setAttribute('y', String(Y + (cfg ? i * FS * (compact ? 1.16 : 1.3) : i * (compact ? 16 : 21))));
    t.setAttribute('font-size', String(FS || (compact ? 14 : (ev.kind === 'event' ? 14 : 15.5))));
    t.setAttribute('font-family', font);
    t.setAttribute('fill', i ? '#7e6f5c' : color);
    t.textContent = row;
    box.appendChild(t);
  });
  if (ev.id) box.setAttribute('id', ev.id);
  live.appendChild(box);
  return ev.id ? box : null;
}

// AI 慢的时候先落这一句，保证「夜里总有人说话」
function localNightLine(outcome) {
  if (outcome === 'escape') return '门开着，风是从外面进来的。';
  if (outcome === 'caught') return '他被按住的时候没有挣扎，只是看着灯。';
  if (outcome === 'slip') return '灯挪开了。他站在原地没动。';
  if (outcome === 'blocked') return '他在门口站了一会儿，把手插回兜里。';
  return '他把床板翻过来，又翻了回去。';
}

// ---------- 第 6 天：他病了 ----------
function askSick() {
  const sheet = openSheet(
    '<h3>他 病 了</h3>' +
    '<p class="sub">他在医务室躺了一整天</p>' +
    '<div class="chips" style="grid-template-columns:1fr">' +
    '<div class="chip" data-k="sick" data-id="treat"><div><div class="nm">叫医生来</div><div class="in">信任 +12 · 服从度 +6</div></div></div>' +
    '<div class="chip" data-k="sick" data-id="ignore"><div><div class="nm">扣下他今天的行动</div><div class="in">他今天动不了 · 服从度 −4 · 他会记住这一笔</div></div></div>' +
    '</div>'
  );
  sheet.addEventListener('click', (ev) => {
    const el = ev.target.closest ? ev.target.closest('.chip') : null;
    if (!el) return;
    E.sickChoice(g, el.dataset.id);
    closeSheet();
    syncView();
    view.report = [{ t:'处置', text: el.dataset.id === 'treat' ? '你叫了医生。' : '你把他关在里面，什么也没给他。' }];
    paint();
  });
}

// ---------- 结算 ----------
async function showSettle() {
  audio.setMode('day'); audio.sfx('verdict');
  const s = E.settle(g);
  syncView();
  view.phase = 'settle'; view.path = null;
  view.settle = { title: s.title, sub: s.sub, quote: s.quote };
  view.settleStats = {
    days: '坚 持 了 ' + Math.min(g.nights.length, 7) + ' 天',
    obedience: Math.round(g.obedience), hostility: Math.round(g.hostility),
    ai: 'AI ‖ 挑路 ' + aiStat.picksLLM + '/' + aiStat.picks + ' 夜 · 开口 ' + aiStat.linesLLM + '/' + aiStat.lines + ' 次',
  };
  view.report = [];
  await paint();
}

// ---------- 点击 ----------
document.addEventListener('click', (ev) => {
  const el = ev.target.closest ? ev.target.closest('[data-act]') : null;
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'start' || act === 'again') { audio.init(); audio.sfx('stamp'); newGame(); return; }
  if (act === 'write') askWrite();
  if (act === 'night') askNight();
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') closeSheet();
  // 封面支持回车 / 空格开始
  if (view && view.phase === 'cover' && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault(); audio.init(); audio.sfx('stamp'); newGame();
  }
});
// 手机 ↔ 桌面切换（旋转屏幕 / 拉伸窗口）时换版式重画
let __wasMobile = isMobileView();
window.addEventListener('resize', () => {
  const now = isMobileView();
  if (now !== __wasMobile) { __wasMobile = now; paint(); }
});

// 首次交互解锁音频（浏览器不允许页面加载即播放）；封面点击也会走这里
document.addEventListener('pointerdown', function () { audio.init(); }, { once: true, capture: true });
// ?intro=0 跳过封面（自动化测试与录屏用）；默认先显示进入界面
if (/[?&]intro=0/.test(location.search)) newGame(); else showCover();
warm();   // 预热语言模型，别让第一条规矩撞上冷启动
window.__game = { get g() { return g; }, get view() { return view; }, newGame, showCover, E, showSettle, askNight, askWrite };
window.__audio = audio;