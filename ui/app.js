// app.js — 游戏主控。渲染归 screen.js，判定归 engine.js，语言归 npc.js。
import { renderScreen } from './screen.js';
import { renderMobile, renderMobileSettle, isMobileView } from './mobile.js';
import { renderLandscape, renderLandscapeSettle, isLandscapeView } from './landscape.js';
import { renderIntro, renderIntroMobile, renderIntroLandscape } from './intro.js';
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

let g = null, view = null, busy = false, wroteToday = false, replaceRule = null;
let coachSeen = false;
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
  view.day = g.day; view.ap = g.ap; view.apMax = g.apMax || E.PARAMS.apPerDay;
  view.obedience = Math.round(g.obedience); view.hostility = Math.round(g.hostility);
  view.rules = g.rules.map((r) => ({ text: r.text, note: r.note }));
}
// 版式三选一：竖屏手机 / 横屏手机 / 桌面。规则与判定完全一致，只换排版。
function viewMode() {
  if (isMobileView()) return 'mobile';
  if (isLandscapeView()) return 'landscape';
  return 'desktop';
}
function clearCoverAids() {
  const st = document.getElementById('stage');
  if (st) st.classList.remove('starting');
  const fb = document.getElementById('enter-fallback'); if (fb) fb.remove();
  const se = document.getElementById('start-err'); if (se) se.remove();
}
// 真实 HTML 兜底按钮：整张封面范围，SVG 点击失效时也能进
function mountFallback() {
  if (document.getElementById('enter-fallback')) return;
  const b = document.createElement('button');
  b.id = 'enter-fallback';
  b.type = 'button';
  b.dataset.act = 'start';
  b.setAttribute('aria-label', '进入游戏');
  b.title = '进入游戏';
  stage.appendChild(b);
}
async function paint() {
  const mode = viewMode();
  // 进入界面：封面也分横竖三版，和游戏本体用同一套纸与印章
  if (view && view.phase === 'cover') {
    if (mode === 'mobile') { stage.style.aspectRatio = '800 / 1840'; stage.innerHTML = renderIntroMobile(); }
    else if (mode === 'landscape') { stage.style.aspectRatio = ''; stage.innerHTML = renderIntroLandscape(); }
    else { stage.style.aspectRatio = ''; stage.innerHTML = renderIntro(); }
    mountFallback();
    bootReady();
    return;
  }
  clearCoverAids();
  // 手机竖屏走 mobile.js 的纵向版式；横屏走 landscape.js 的横排版式；桌面仍是 screen.js 的 1600×1000 一屏。
  if (mode === 'mobile') {
    const settle = view.phase === 'settle';
    stage.style.aspectRatio = settle ? '800 / 1500' : '800 / 1840';
    stage.innerHTML = settle ? renderMobileSettle(view) : renderMobile(view);
    bootReady();
    return;
  }
  if (mode === 'landscape') {
    stage.style.aspectRatio = '';
    stage.innerHTML = view.phase === 'settle' ? renderLandscapeSettle(view) : renderLandscape(view);
    bootReady();
    return;
  }
  stage.style.aspectRatio = '';
  stage.innerHTML = await renderScreen(view);
  bootReady();
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

// 第一次当监狱长：一张可跳过的小纸条，不挡地图、不挡操作。
function hideCoach() {
  const el = document.getElementById('coach');
  if (el && el.parentNode) el.parentNode.removeChild(el);
}
function showCoach() {
  if (coachSeen || !g || g.day !== 1 || g.rules.length) return;
  coachSeen = true;
  const d = document.createElement('div');
  d.id = 'coach';
  d.innerHTML = '<div class="coach-t">第 一 次 当 监 狱 长</div>' +
    '<div class="coach-b">① 点一条规矩空行，写一句人话。<br>' +
    '② 核对判定条上的时间、地点、限制，再点「写下」。<br>' +
    '③ 按右下角的红章「入夜」。</div>' +
    '<div class="coach-r"><button class="btn ghost" data-k="coach-skip">跳过引导</button>' +
    '<button class="btn primary" data-k="coach-ok">知道了</button></div>';
  d.addEventListener('click', function (ev) {
    const k = ev.target && ev.target.dataset && ev.target.dataset.k;
    if (k === 'coach-skip' || k === 'coach-ok') hideCoach();
  });
  ov.appendChild(d);
}

function newGame() {
  const m = /[?&]seed=(\d+)/.exec(location.search);
  g = E.createGame(m ? +m[1] : (Date.now() % 90000) + 1000);
  view = { phase:'day', day:1, ap:3, apMax:3, obedience:100, hostility:30, rules:[], report:[], path:null, tokens:null };
  wroteToday = false;
  replaceRule = null;
  const rb = document.getElementById('review-btn');
  if (rb && rb.parentNode) rb.parentNode.removeChild(rb);
  aiStat = { picks: 0, picksLLM: 0, lines: 0, linesLLM: 0 };
  dayBriefing();
  paint();
  hideCoach();
  setTimeout(showCoach, 900);
  if (g.day === 6) askSick();
}

function dayBriefing() {
  const prevDay = view ? view.day : null;
  syncView();
  // 「今天写过没有」必须按天清零：否则第 5 天的上级检查只看开局有没有写过，
  // 写过一次就永远绕过去了，检查形同虚设。
  if (prevDay !== null && g.day !== prevDay) { wroteToday = false; replaceRule = null; }
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
    if (last.skipped) lines.push({ t:'昨夜', text:'他今天动不了，没有出门。' });
    else if (last.outcome === 'idle' && !mv) lines.push({ t:'昨夜', text: out });
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
  else if (d === 5) {
    const full = g.rules.length >= E.PARAMS.rulesMax;
    lines.push({ t:'17:00', text: E.DAY_EVENTS[5].text + (full ? '（六条已满，可改写一条）' : '') });
  }
  else if (d === 6) lines.push({ t:'15:00', text: E.DAY_EVENTS[6].text });
  else if (d !== 1) lines.push({ t:'', text:'第 ' + CN[d] + ' 天。他今天话少。' });
  view.report = lines.slice(0, 4);
  // 报告和地图联动：把昨夜 trace 里的房间挂到前两行，点报告就能在地图上看见那个房间。
  if (last && last.trace && last.trace.length) {
    view.report.forEach(function (line, i) {
      if (i < 2) line.room = last.trace[Math.min(i, last.trace.length - 1)].room;
    });
  }
}

// ---------- 写规矩 ----------
const EXAMPLES = [
  '入夜后，任何人不得离开自己的房间。',
  '医务室的窗，任何时候都不许碰。',
  '工具间的铁器，全天不许取走。',
];

async function askWrite(opts) {
  if (busy) return;
  hideCoach();
  const replaceId = opts && opts.replace;
  // 第5天上级检查：行动力用光也必须能交差，否则会卡死在「必须写」与「没行动力」之间。
  const free = !!(opts && opts.free) || (g.day === 5 && !wroteToday && g.ap < 1);
  const target = replaceId ? (g.rules || []).find((r) => r.id === replaceId) : null;
  if (replaceId && !target) return toast('没有这条规矩。');
  if (g.rules.length >= E.PARAMS.rulesMax && !target) return toast('六条规矩已经写满了。今晚上级检查：点「入夜」可改写一条。');
  if (!free && g.ap < 1) return toast('今天的行动力用完了。');
  replaceRule = target || null;
  const sheet = openSheet(
    '<h3>' + (target ? '改 写 第 ' + ruleMark(target.id) + ' 条' : '写 一 条 规 矩') + '</h3>' +
    '<p class="sub">' + (target
      ? (free ? '上级检查：行动力已用完，这次改写不扣行动力；旧规矩仍会被换掉。' : '上级检查：六条已满。改写一条也算今晚交差，旧规矩会被换掉。')
      : (free ? '上级检查：行动力已用完，这条规矩不扣行动力。' : '一句话说清楚：什么时候 · 在哪儿 · 不许做什么')) + '</p>' +
    '<textarea id="rtxt" maxlength="60" placeholder="例：夜里不许离开牢房">' + (target ? esc(target.text) : '') + '</textarea>' +
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
    if (k === 'cancel') { replaceRule = null; closeSheet(); }
    if (k === 'compile') doCompile();
  });
  async function doCompile() {
    const text = ta.value.trim();
    if (text.length < 4) return toast('再写长一点。');
    if (target && text === target.text) return toast('写一条不一样的，才算今晚的新规矩。');
    // 先出确定性的判定条（规则引擎，0ms），AI 随后在后台核对一遍——不挡玩家。
    // 关键：这是「预览」。玩家若先按下「写下」，就锁定预览这一版；AI 晚到也不许再改。
    let local;
    try { local = E.compileRule(text); } catch (err) { local = { ok: false, error: '这句判不了。' }; }
    if (!local.ok) return toast(local.error || '这句判不了。');
    audio.sfx('pen');
    sheet.__locked = false;
    showVerdict(sheet, text, local, { pending: llmOn, calibrated: false, replace: target, free });
    compileSmart(text).then(function (r) {
      if (!r || !r.ok) return;
      if (sheet.__locked) return;                 // 玩家已经确认过预览版：不再改写
      if (!document.body.contains(sheet)) return; // 浮层已关：不再事后改册子里的规矩
      if (r.by !== 'llm') {
        const pend = sheet.querySelector('.ai-pend');
        if (pend) pend.textContent = 'AI 未返回，按本地判定执行。';
        return;
      }
      // AI 先回来：用校准后的判定条替换预览，并明确要求玩家再确认一次
      showVerdict(sheet, text, r, { pending: false, calibrated: true, replace: target, free });
    }).catch(function () {
      const pend = sheet && sheet.querySelector && sheet.querySelector('.ai-pend');
      if (pend) pend.textContent = 'AI 未返回，按本地判定执行。';
    });
  }
}

function showVerdict(sheet, text, r, opts) {
  opts = opts || {};
  const replace = opts.replace || null;
  const free = !!opts.free;
  sheet.__result = r;
  audio.sfx('paper');
  const lang = r.rule ? r.rule.lang : r.lang;
  const ex = E.explainLang(lang);
  const tag = opts.calibrated ? '<span class="ai-tag">AI 校准</span>' : '<span class="vtag">本地判定</span>';
  const status = opts.calibrated
    ? 'AI 已校准 · 请确认这一版'
    : (opts.pending ? '本地判定 · 预览（AI 正在核对）' : '本地判定');
  sheet.innerHTML =
    '<h3>' + (replace ? '改 写 完 毕' : '归 档 完 毕') + '</h3>' +
    '<p class="sub">' + (replace ? '新规矩会替掉第 ' + ruleMark(replace.id) + ' 条，槽位仍是六条' : '你的话被译成了一条能执行的判定') + '</p>' +
    '<div class="verdict"><div class="q">' + esc(text) + '</div>' +
    '<div class="n">' + esc(r.note) + tag + '</div>' +
    '<div class="vfields">' +
      '<div class="vrow"><span>对象</span><b>' + esc(ex.subject) + '</b></div>' +
      '<div class="vrow"><span>时间</span><b>' + esc(ex.time) + '</b></div>' +
      '<div class="vrow"><span>地点</span><b>' + esc(ex.place) + '</b></div>' +
      '<div class="vrow"><span>限制</span><b>' + esc(ex.limit) + '</b></div>' +
    '</div>' +
    ex.notes.map((n) => '<div class="vwarn">' + esc(n) + '</div>').join('') +
    (opts.pending ? '<div class="ai-pend">AI 正在核对这条规矩的判定…（现在写下 = 锁定预览版）</div>' : '') +
    '</div>' +
    '<p class="hint" style="margin-top:14px">' + costHint(r) + (free ? '<br>上级检查：行动力已用完，这次' + (replace ? '改写' : '写入') + '不扣行动力。' : '') + '</p>' +
    '<div class="row"><button class="btn ghost" data-k="back">改 写</button>' +
    '<button class="btn primary" data-k="ok">写 下</button></div>';
  sheet.querySelector('[data-k="back"]').addEventListener('click', () => { closeSheet(); askWrite(replace ? { replace: replace.id } : undefined); });
  sheet.querySelector('[data-k="ok"]').addEventListener('click', async () => {
    const rr = sheet.__result || r;
    sheet.__locked = true;   // 锁在玩家眼前这一版：AI 晚到不得再改
    const w = replace
      ? E.rewriteRule(g, replace.id, text, { ok:true, lang: rr.rule ? rr.rule.lang : rr.lang, note: rr.note }, { free })
      : E.writeRule(g, text, { ok:true, lang: rr.rule ? rr.rule.lang : rr.lang, note: rr.note }, { free });
    if (!w.ok) { sheet.__locked = false; return toast(w.error); }
    audio.sfx('stamp');
    wroteToday = true;
    replaceRule = null;
    closeSheet();
    syncView();
    const last = w.rule || g.rules[g.rules.length - 1];
    const lex = E.explainLang(last.lang);
    view.report = [
      { t: replace ? '改写' : '归档', text:'「' + last.text + '」' },
      { t:'', text: last.note },
      { t:'', text:'狱警服从度 ' + Math.round(g.obedience) + '，囚犯敌意 ' + Math.round(g.hostility) + '。' },
    ];
    if (lex.notes.length) view.report.push({ t:'提醒', text: lex.notes[0] });
    await paint();
  });
}

// ---------- 行动依据：把引擎这一夜真实记录过的「从哪来、到哪去、哪条规矩、判了什么」摊开 ----------
function roomName(z) { return (E.ROOMS[z] && E.ROOMS[z].name) || z || ''; }
function pct(x) { return Math.round((x || 0) * 100) + '%'; }
function ruleMark(id) {
  const i = (g.rules || []).findIndex((r) => r.id === id);
  return ['①', '②', '③', '④', '⑤', '⑥'][i] || '·';
}
function whyStepHtml(t) {
  const from = roomName(t.from);
  const to = roomName(t.room);
  const where = from && to && from !== to ? from + ' → ' + to : (to || from);
  let verdict = '无规矩适用';
  let cls = '';
  if (t.verdict === 'prepared') { verdict = '上一夜已备好，不构成新的风险'; cls = 'ok'; }
  else if (t.verdict === 'blocked') { verdict = '第 ' + ruleMark(t.ruleId) + ' 条命中（执行率 ' + pct(t.chance) + '）'; cls = 'bad'; }
  else if (t.verdict === 'leaked') { verdict = '第 ' + ruleMark(t.ruleId) + ' 条没拦住（执行率 ' + pct(t.chance) + '）'; cls = 'leak'; }
  if (t.caught) verdict += t.blind ? '；狱警把光挪开了' : '；狱警抓住了他';
  return '<div class="wstep" data-act="locate" data-room="' + esc(t.room || '') + '" style="cursor:pointer"><div class="wtime">' + esc(t.t || '') + '</div>' +
    '<div class="wbody"><div class="wact">' + esc(t.label || '') + '</div>' +
    '<div class="wverd ' + cls + '">' + esc(where) + ' · ' + esc(verdict) + '</div>' +
    (t.ruleText ? '<div class="wrule">「' + esc(t.ruleText) + '」</div>' : '') + '</div></div>';
}
function showWhy() {
  const last = g && g.nights && g.nights[g.nights.length - 1];
  if (!last) return toast('还没有昨夜可以查。');
  const trace = last.trace || [];
  const total = last.routeTotal || trace.length;
  const outcome = {
    blocked:'他被拦在门口，这一夜没能再往前走。',
    partial:'他走到一半，被拦了回去。',
    caught:'狱警抓住了他。',
    slip:'狱警看见了他，把光挪开了。',
    escape:'他出去了。',
    idle: last.skipped ? '他今天动不了，没有出门。' : '这一夜什么也没发生。',
  }[last.outcome] || '这一夜结束了。';
  const ruleIds = [...new Set(trace.filter((t) => t.ruleId).map((t) => t.ruleId))];
  const ruleRows = ruleIds.map((id) => {
    const rule = (g.rules || []).find((r) => r.id === id);
    const hit = trace.find((t) => t.ruleId === id) || {};
    return '<div class="wrule">' + ruleMark(id) + ' ' + esc(rule ? rule.text : '') +
      ' <span>· 执行率 ' + pct(hit.chance) + '</span></div>';
  }).join('');
  const openRooms = [...new Set(trace.filter((t) => !t.ruleId || t.verdict === 'leaked')
    .map((t) => roomName(t.room)).filter(Boolean))];
  const sheet = openSheet(
    '<h3>这 一 夜 的 行 动 依 据</h3>' +
    '<p class="sub">第 ' + (last.night || 1) + ' 夜 · ' + (last.skipped ? '他病了' : '「' + esc(last.routeName || last.routeId) + '」') + '</p>' +
    '<div class="verdict">' +
      '<div class="q">' + (last.skipped ? '他今天动不了，没有出门。' : '他从「' + esc(roomName(last.startRoom)) + '」出发，走的是「' + esc(last.routeName || '') + '」。') + '</div>' +
      '<div class="n">引擎判定：' + esc(outcome) + '</div>' +
    '</div>' +
    '<div class="why">' +
      '<h4>他这一夜实际走过的每一步</h4>' +
      (trace.length ? trace.map(whyStepHtml).join('') : '<div class="wrule">' + (last.skipped ? '他今天没有行动，所以没有留下脚步。' : '这一夜他没有走出第一步。') + '</div>') +
      (trace.length < total ? '<div class="wrule">这条路线还有 ' + (total - trace.length) + ' 步，他这一夜没走到。</div>' : '') +
      '<h4>参与判定的规矩</h4>' +
      (ruleRows || '<div class="wrule">这一夜没有任何一条规矩碰到他的路线。</div>') +
      '<h4>引擎结论</h4>' +
      '<div class="wrule">' + esc(last.skipped
        ? '他今天的行动被扣下了；这一夜没有发生路线判定。'
        : (last.outcome === 'escape'
          ? '没有任何一条规矩真正拦住他。'
          : (ruleRows ? '规矩参与了判定，结果以上面每一步的引擎判定为准。' : '他走的这条路上没有你的规矩；这是路线选择，不是判定失败。'))) + '</div>' +
      (openRooms.length ? '<div class="wnote">这些落脚点没有被规矩拦到：' + esc(openRooms.join('、')) +
        '。下一次可以把规矩写到具体房间，或者守住他跨出去的那道门。</div>' : '') +
      '<div class="wnote">本页只复述引擎实际记录过的判定，不展示模型的思考过程。</div>' +
    '</div>' +
    '<div class="row"><button class="btn primary" data-k="why-close">知 道 了</button></div>'
  );
  sheet.querySelector('[data-k="why-close"]').addEventListener('click', closeSheet);
}

// 报告/行动依据里的「在地图上标出这个房间」：只加一层临时高亮，不碰判定与状态。
function locateRoom(room) {
  if (!room) return;
  const layer = document.querySelector('#map-room');
  if (!layer) return;
  closeSheet();
  const old = layer.querySelector('#room-spot');
  if (old) old.remove();
  const c = FALLBACK[room] || [380, 250];
  const NS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('id', 'room-spot');
  const r = document.createElementNS(NS, 'rect');
  r.setAttribute('x', String(c[0] - 64));
  r.setAttribute('y', String(c[1] - 46));
  r.setAttribute('width', '128');
  r.setAttribute('height', '92');
  r.setAttribute('fill', 'none');
  r.setAttribute('stroke', '#882e1f');
  r.setAttribute('stroke-width', '3');
  r.setAttribute('rx', '2');
  g.appendChild(r);
  layer.appendChild(g);
  toast('在地图上标出「' + roomName(room) + '」。');
  setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 2400);
}

function costHint(r) {
  const l = r.rule ? r.rule.lang : r.lang;
  if (!l) return '';
  const broad = l.zones === 'ALL' || (l.window.from === 0 && l.window.to === 1439);
  const P = E.PARAMS;
  const cost = P.obediencePerRule +
    (l.zones === 'ALL' ? P.obedienceBroadZone : 0) +
    (l.window.from === 0 && l.window.to === 1439 ? P.obedienceBroadTime : 0);
  const after = Math.max(P.obedienceFloor, Math.round((g.obedience + cost) * 10) / 10);
  let p = 1;
  try { p = E.ruleStrength(g, { lang: l, leaks: 0, wear: 0 }); } catch (err) {}
  const est = '写下之后：服从度 ' + Math.round(g.obedience) + ' → ' + after +
    '　这条规矩在他真走那条路时的执行率约 ' + Math.round(p * 100) + '%。';
  const tail = l.boundary
    ? '边界规矩守的是门槛，不是整间房：守门比室内巡查更难，但拦下来就是实打实的一夜。'
    : (broad
      ? '这条规矩管得太宽了。狱警会照办，但不会认真照办——服从度会掉得更快。'
      : '这条规矩写得很具体。具体就意味着他真的会去执行。');
  return est + ' ' + tail;
}

// ---------- 预判 + 入夜 ----------
// 第 5 天上级检查 + 六条已满：给一个明确出口，不能让「必须写」和「写不下」互锁。
function askInspectionRewrite() {
  if (busy) return;
  const free = g.ap < 1;
  const ring = ['①', '②', '③', '④', '⑤', '⑥'];
  const sheet = openSheet(
    '<h3>上 级 检 查</h3>' +
    '<p class="sub">六条已经写满。选一条改写，才算今晚交差——旧规矩会被换掉，槽位仍是六条。</p>' +
    '<p class="hint">' + (free ? '行动力已用完：这次改写不扣行动力。' : '改写也花 1 点行动力。') + '</p>' +
    '<div class="chips">' + g.rules.slice(0, 6).map((r, i) =>
      '<div class="chip" data-k="pick-rule" data-id="' + r.id + '"><div><div class="nm">第 ' + ring[i] + ' 条</div>' +
      '<div class="in">' + esc(r.text) + '</div></div></div>').join('') + '</div>' +
    '<div class="row"><button class="btn ghost" data-k="cancel">先不写</button></div>'
  );
  sheet.addEventListener('click', (ev) => {
    const k = ev.target.dataset && ev.target.dataset.k;
    if (k === 'cancel') { closeSheet(); return; }
    const el = ev.target.closest ? ev.target.closest('.chip') : null;
    if (el && el.dataset.id) { const id = el.dataset.id; closeSheet(); askWrite({ replace: id, free }); }
  });
}

async function askNight() {
  if (busy) return;
  hideCoach();
  if (g.day === 5 && !wroteToday) {
    if (g.rules.length >= E.PARAMS.rulesMax) return askInspectionRewrite();
    return toast('今晚上级检查：你必须再写一条规矩。');
  }
  // 第 6 天扣了他的行动：这一夜没有路线可猜，直接入夜。
  if (g.sickSkipNight) return runNight();
  const holes = E.enumerateHoles(g);
  const sheet = openSheet(
    '<h3>今 夜 他 会 试 哪 条 路</h3>' +
    '<p class="sub">没查过的路只能赌。猜中：明天多 1 点行动力，狱警也会多站一班</p>' +
    '<p class="hint">档案：' + esc(g.habit ? g.habit.line : '') + '</p>' +
    '<div class="chips">' + E.availableRoutes(g).map((r) => {
      const hole = holes.find((h) => h.id === r.id) || {};
      // 玩家写的规矩是他自己的：哪条路被堵着、哪条没被堵，他应该能看见——否则「猜他走哪条」只能靠运气。
      const blockedBy = hole.blockedBy || hole.blockedAt || '';
      const detail = blockedBy
        ? '堵在：' + blockedBy + (hole.known && hole.strength < 0.6 ? '（拦得不稳）' : '')
        : (hole.known ? '这条路是通的' : '这条路没被规矩堵住');
      return '<div class="chip" data-k="pred" data-id="' + r.id + '"><div><div class="nm">' + r.name +
        '</div><div class="in" style="' + (hole.known || hole.blockedAt ? '' : 'opacity:.5') + '">' + detail + '</div></div></div>';
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
  const sickSkip = !!g.sickSkipNight;
  const holes = sickSkip ? [] : E.enumerateHoles(g);
  // AI 的「决定」：引擎先把所有真实漏洞算清，LLM 只能在这张清单里挑一条最像人的；
  // 挑完仍由引擎逐条校验、执行。关掉 AI（?llm=0）就退回「第一条最松的路」，这就是 ablation。
  // 与动画并行：让 AI 挑路线的时间藏在「熄灯 + 画夜路」的 3.5 秒里
  const pickP = sickSkip ? Promise.resolve(null) : chooseHole(holes, g).catch(() => null);
  const guess = sickSkip ? null : holes[0].id;
  const route0 = sickSkip ? null : (E.availableRoutes(g).find((r) => r.id === guess) || E.ROUTES[1]);
  view.phase = 'night'; syncView();
  audio.setMode('night'); audio.sfx('lights');
  if (sickSkip) {
    // 他病着，今晚没有夜路可画。报告只写「熄灯」和「他今天动不了」。
    view.path = null;
    view.tokens = null;
    view.report = [];
    await paint();
    await wait(1200);
  } else {
    setTimeout(function () { audio.sfx('steps'); }, 900 * SPEED);
    view.path = await pathFor(route0);
    view.report = [];
    await paint();
    await wait(3500);
  }
  const pick = await pickP;
  let actual = null;
  if (!sickSkip) {
    aiStat.picks += 1;
    if (pick && pick.by === 'llm') aiStat.picksLLM += 1;
    actual = (pick && pick.id) || guess;
    const route = E.availableRoutes(g).find((r) => r.id === actual) || E.ROUTES[1];
    if (actual !== guess && route !== route0) {
      view.path = await pathFor(route);
      await paint();
      await wait(2200);
    }
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
  const remarkP = sickSkip ? Promise.resolve(null) : remark(g, {
    routeName: res.route.name, outcome: res.outcome, blocked: blk ? blk.text : '',
  }).catch(() => null);
  const live = stage.querySelector('#report-live');
  // 第五夜起他一夜走两步，事件会比以前多；先把「熄灯」这类气氛行省掉，保证两个动作都能看见
  // 版式参数由 #report-live 的 data-cfg 自己带（桌面/竖屏/横屏三套），这里不再判断设备
  let liveCfg = null;
  try {
    const raw = live && live.getAttribute && live.getAttribute('data-cfg');
    if (raw) liveCfg = JSON.parse(raw);
  } catch (err) { liveCfg = null; }
  const evs = res.events.slice();
  // 紧凑排版阈值：默认 4（夜里会多一行「今晚的心情」，提早一档，保证 AI 最后一句话不被挤出纸面）
  const compactAt = liveCfg && liveCfg.compactAt != null ? liveCfg.compactAt : 4;
  const compact = res.events.length > compactAt;   // 按原始条数判断，否则删掉「熄灯」后又被判成宽松排版，最后一条会被挤掉
  if (compact) { const si = evs.findIndex(function (e) { return e.kind === 'start'; }); if (si >= 0) evs.splice(si, 1); }
  const mobileView = isMobileView();
  const pitch = liveCfg && liveCfg.pitch
    ? (compact ? (liveCfg.pitchCompact || liveCfg.pitch) : liveCfg.pitch)
    : (compact ? (mobileView ? 20 : 24) : 30);
  const maxY = liveCfg && liveCfg.maxY
    ? (compact ? (liveCfg.maxYCompact || liveCfg.maxY) : liveCfg.maxY)
    : (compact ? (mobileView ? 892 : 912) : 906);
  // 一行打印不下会折成两行（规矩原文经常超过一行），下一行要按实际行数让位，否则两行叠在一起
  const cfgCols = liveCfg && liveCfg.cols ? liveCfg.cols : 42;
  const cfgFs = liveCfg && liveCfg.fs ? Math.round(liveCfg.fs * (compact ? 0.86 : 1)) : null;
  const rowH = liveCfg ? (cfgFs * (compact ? 1.16 : 1.3)) : (compact ? 16 : 21);
  let y = 792;
  for (const ev of evs) {
    if (y > maxY) break;
    appendLine(live, ev, y, compact);
    const rowsN = ev.text ? Math.min(2, Math.ceil(Array.from(ev.text).length / cfgCols)) : 1;
    const rowExtra = rowsN > 1 ? (rowsN - 1) * rowH : 0;
    y += (ev.kind === 'escape' ? pitch + 4 : pitch) + rowExtra;
    await wait(ev.kind === 'escape' ? 1400 : 950);
  }
  // 这句话永远要有：AI 慢就先落一句模板，AI 回来后原地换掉 —— 玩家不需要等任何人。
  const rk = await Promise.race([remarkP, wait(7500).then(() => null)]);
  const noteEl = y <= maxY + 6 ? appendLine(live, { t: '', text: (rk && rk.line) || (res.skipped ? '他今天没有下床。' : localNightLine(res.outcome)), kind: 'note', id: 'remark-line' }, y, compact) : null;
  if (!res.skipped) aiStat.lines += 1;
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
  mountReviewBtn();
}

// ---------- 结算后的四问回顾：只统计引擎记录，不替玩家打分 ----------
function showReview() {
  const nights = g.nights || [];
  const steps = [];
  nights.forEach(function (n) { (n.trace || []).forEach(function (t) { steps.push(t); }); });
  const stat = (g.rules || []).map(function (r) {
    const mine = steps.filter(function (t) { return t.ruleId === r.id; });
    return {
      rule: r,
      blocked: mine.filter(function (t) { return t.verdict === 'blocked'; }).length,
      leaked: mine.filter(function (t) { return t.verdict === 'leaked'; }).length,
    };
  });
  const used = stat.filter(function (s) { return s.blocked + s.leaked > 0; });
  const cold = stat.filter(function (s) { return s.blocked + s.leaked === 0; });
  used.sort(function (a, b) { return b.blocked - a.blocked; });
  const top = used[0];
  const worst = used.slice().sort(function (a, b) { return (b.leaked - b.blocked) - (a.leaked - a.blocked); })[0];
  const right = nights.filter(function (n) { return n.predictedRight; }).length;
  const risky = nights.filter(function (n) {
    return (n.trace || []).some(function (t) { return t.leaked === true || t.verdict === 'leaked'; });
  });
  const q = [];
  q.push('<div class="qa"><b>① 哪条规矩真的拦住了他？</b><p>' +
    (top && top.blocked ? '「' + esc(top.rule.text) + '」——拦下 ' + top.blocked + ' 次。' +
      (top.leaked ? '也漏过 ' + top.leaked + ' 次。' : '一次没漏。') :
      '没有一条规矩真正拦住过他。这条路上，你写的东西更像愿望，不是门。') + '</p></div>');
  q.push('<div class="qa"><b>② 哪条规矩一次也没用上？</b><p>' +
    (cold.length ? cold.map(function (s) { return '「' + esc(s.rule.text) + '」'; }).join('、') +
      '——他一次也没走到那条规矩管的地方。' :
      ((g.rules || []).length ? '你写下的 ' + (g.rules || []).length + ' 条规矩都碰到过他的路线，没有一条是纯摆设。' : '你一条规矩都没写。')) + '</p></div>');
  q.push('<div class="qa"><b>③ 你的预判准了几夜？</b><p>' +
    '七夜里猜中 ' + right + ' 夜。' +
    (risky.length ? '有 ' + risky.length + ' 夜里，他明明踩中了你的规矩，还是漏了过去——那是服从度在掉。' :
      '没有一夜是“规矩在，但没人执行”。') + '</p></div>');
  q.push('<div class="qa"><b>④ 如果只能改一条，改哪条？</b><p>' +
    (worst && worst.leaked > worst.blocked
      ? '先改「' + esc(worst.rule.text) + '」：它被踩中了，却没拦住。写得再窄一点，或者换到他真正会停下的那道门。'
      : (cold.length
        ? '把「' + esc(cold[0].rule.text) + '」换掉：它一次也没等到他。用你写下的规矩里的一条，去堵他真走过的那条路。'
        : '结构已经咬合了。下次可以试着少写一条宽规矩，把省下的服从度留给一条更窄的边界规矩。')) + '</p></div>');
  const sheet = openSheet(
    '<h3>结 局 回 顾</h3>' +
    '<p class="sub">四个问题，都从这七夜的引擎记录里来</p>' +
    '<div class="review">' + q.join('') + '</div>' +
    '<div class="row"><button class="btn primary" data-k="review-close">关 上</button></div>'
  );
  sheet.querySelector('[data-k="review-close"]').addEventListener('click', closeSheet);
}
function mountReviewBtn() {
  const old = document.getElementById('review-btn');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  if (!g || !g.escaped && !(g.nights && g.nights.length >= g.maxDays)) return;
  const b = document.createElement('button');
  b.id = 'review-btn';
  b.textContent = '结 局 回 顾 ▸';
  b.addEventListener('click', showReview);
  ov.appendChild(b);
}

// ---------- 点击 ----------
// 封面兜底（2026-11-21）：整个封面都是热区（intro.js 用 <g data-act="start"> 包住），
// 再加一个真实 HTML 按钮（#enter-fallback）盖在封面上——个别 WebView 对 SVG 的点击合成不可靠。
// 同时把 click / touchend / pointerup 都接上，700ms 内去重，避免浏览器补发 click 造成重开。
let lastStartAt = 0;
function actOf(node) {
  let n = node;
  while (n && n !== document) {
    if (n.dataset && n.dataset.act) return n;
    n = n.parentNode || n.host || null;
  }
  return null;
}
function startFeedback() {
  const st = document.getElementById('stage');
  if (st) st.classList.add('starting');
}
function startError(err) {
  startFeedback();
  let d = document.getElementById('start-err');
  if (!d) {
    d = document.createElement('div');
    d.id = 'start-err';
    d.textContent = '打开失败，请刷新重试';
    d.style.cssText = 'position:absolute;left:50%;bottom:12%;transform:translateX(-50%);z-index:40;' +
      'background:rgba(34,29,25,.92);color:#f0e6d0;font-family:var(--song);font-size:13px;letter-spacing:1px;' +
      'padding:8px 16px;border:1px solid rgba(240,230,208,.3);pointer-events:none';
    (document.getElementById('stage') || document.body).appendChild(d);
  }
  try { console.error('[start]', err); } catch (_) {}
}
function startGame() {
  if (Date.now() - lastStartAt < 700) return;
  lastStartAt = Date.now();
  startFeedback();
  try {
    audio.init(); audio.sfx('stamp');
    newGame();
    setTimeout(warm, 900);
  } catch (err) { startError(err); }
}
function tryStart(ev) {
  const el = actOf(ev && ev.target);
  if (!el) return false;
  const act = el.dataset.act;
  if (act !== 'start' && act !== 'again') return false;
  startGame();
  return true;
}
document.addEventListener('click', (ev) => {
  if (tryStart(ev)) return;
  const el = actOf(ev.target);
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'write') askWrite();
  if (act === 'night') askNight();
  if (act === 'why') showWhy();
  if (act === 'locate') locateRoom(el.dataset.room);
});
// 部分移动浏览器在 SVG 上不合成 click：touchend / pointerup 各兜一层（startGame 内有 700ms 去重）
document.addEventListener('touchend', (ev) => { if (view && view.phase === 'cover') tryStart(ev); }, { passive: true });
document.addEventListener('pointerup', (ev) => { if (view && view.phase === 'cover' && ev.pointerType !== 'mouse') tryStart(ev); }, { passive: true });
// 按下就给出反馈，别让人等一个 click 才知道点到了
document.addEventListener('pointerdown', (ev) => {
  if (!view || view.phase !== 'cover') return;
  const el = actOf(ev.target);
  if (el && el.dataset.act === 'start') startFeedback();
}, { capture: true, passive: true });
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') closeSheet();
  // 封面支持回车 / 空格开始
  if (view && view.phase === 'cover' && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault(); startGame();
  }
});
// 开局/渲染异常不再静默：封面阶段显示一行提示，方便用户刷新而不是以为点坏了
window.addEventListener('error', (ev) => { if (view && view.phase === 'cover') startError(ev.error || new Error(ev.message || 'error')); });
window.addEventListener('unhandledrejection', (ev) => { if (view && view.phase === 'cover') startError(ev.reason || new Error('rejection')); });
// 竖屏 ↔ 横屏 ↔ 桌面切换（旋转屏幕 / 拉伸窗口）时换版式重画
let __wasMode = viewMode();
window.addEventListener('resize', () => {
  const now = viewMode();
  if (now !== __wasMode) { __wasMode = now; paint(); }
});

// 首屏占位分三段真实阶段（HTML 已到 / 脚本已跑 / 版式已画好），不显示假百分比
let __booted = false;
function bootStage(t) {
  if (__booted) return;
  const el = document.getElementById('boot-stage');
  if (el) el.textContent = t;
}
function bootReady() {
  if (__booted) return;
  __booted = true;
  const el = document.getElementById('boot-stage');
  if (el) el.textContent = '案卷已就绪';
  bootDone();
}
function bootDone() {
  const b = document.getElementById('boot');
  if (!b) return;
  b.classList.add('boot-done');
  setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 600);
}
bootStage('正在铺开桌面…');
// 8s 提示与刷新按钮在 index.html 的普通脚本里（模块加载失败时也生效）
// 兜底：万一 paint 抛错，2.5s 后也先撤掉占位，至少能看到页面与错误提示
setTimeout(function () { bootReady(); }, 2500);
// 首次交互解锁音频（浏览器不允许页面加载即播放）；封面点击也会走这里
document.addEventListener('pointerdown', function () { audio.init(); }, { once: true, capture: true });
// ?intro=0 跳过封面（自动化测试与录屏用）；默认先显示进入界面
if (/[?&]intro=0/.test(location.search)) newGame(); else showCover();
// 预热语言模型：挪到点「进入」之后（页面加载时发只是白占首屏带宽与并发），
// 提前 900ms 起跑，等玩家写完第一条规矩时模型已经热了。
window.__game = { get g() { return g; }, get view() { return view; }, newGame, showCover, E, showSettle, askNight, askWrite };
window.__audio = audio;