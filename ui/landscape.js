// landscape.js — 手机横屏版式：一屏横排（左：平面图 + 巡查报告；右：狱规 + 状态 + 入夜）。
// 只换排版，不换规则、不换判定：桌面版仍是 screen.js 的 1600×1000，竖屏是 mobile.js 的 800×1840。
import { C, KAI, SONG, buildDefs, buildPaper } from './paper.js';
import { ROOM_RECTS, MAP_W, MAP_H, portrait } from './map.js';

export const LW = 1180, LH = 546;
const MX = 26, MY = 74, MS = 440 / MAP_W;   // 平面图：左栏 440 宽
const RX = 492;                              // 右栏起点
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

export const ROOM_NAMES = {
  cell1: '一号牢房', cell2: '二号牢房', cell3: '三号牢房', corridor: '走廊',
  workshop: '工具间', medical: '医务室', dining: '食堂', laundry: '洗衣房',
  storage: '储藏室', yard: '放风区',
};

function cn(n) { return n <= 10 ? CN[n] : CN[Math.floor(n / 10)] + CN[n % 10]; }
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function T(x, y, s, o) {
  o = o || {};
  const a = ['x="' + x + '"', 'y="' + y + '"', 'font-size="' + (o.size || 14) + '"',
    'fill="' + (o.fill || C.INK2) + '"', 'font-family="' + (o.font || SONG) + '"'];
  if (o.anchor) a.push('text-anchor="' + o.anchor + '"');
  if (o.tracking != null) a.push('letter-spacing="' + o.tracking + '"');
  if (o.opacity != null) a.push('opacity="' + o.opacity + '"');
  return '<text ' + a.join(' ') + '>' + esc(s) + '</text>';
}
function wrap(s, max) {
  if (!s) return [];
  const out = []; let cur = '';
  for (const ch of String(s)) {
    if (ch === '\n') { out.push(cur); cur = ''; continue; }
    cur += ch;
    if (cur.length >= max) { out.push(cur); cur = ''; }
  }
  if (cur) out.push(cur);
  const lead = '。，、；：！？）」』%·…';
  for (let i = 1; i < out.length; i++) {
    if (lead.indexOf(out[i][0]) >= 0 && out[i - 1].length > 12) {
      out[i] = out[i - 1].slice(-1) + out[i];
      out[i - 1] = out[i - 1].slice(0, -1);
    }
  }
  return out;
}

function header(st) {
  const apMax = st.apMax || 3;
  const ap = Math.max(0, Math.min(apMax, st.ap == null ? 3 : st.ap));
  let dots = '';
  for (let i = 0; i < apMax; i++) {
    const x = 1154 - (apMax - 1 - i) * 22;
    dots += i < ap
      ? '<circle cx="' + x + '" cy="46" r="7" fill="' + C.RED + '"/>'
      : '<circle cx="' + x + '" cy="46" r="7" fill="none" stroke="' + C.MUTED + '" stroke-width="1.4" opacity="0.8"/>';
  }
  return [
    '<g id="head">',
    T(64, 32, '案 卷', { size: 16, tracking: 2, fill: C.INK }) + T(124, 32, 'No.07 / 19', { size: 16, tracking: 1.5, fill: C.INK2 }),
    T(64, 53, '脱逃事件调查报告 · 内部资料', { size: 13, fill: C.MUTED }),
    '<text x="590" y="40" text-anchor="middle" font-family="' + SONG + '" font-size="26" fill="' + C.INK + '" letter-spacing="2">第<tspan fill="' + C.RED + '" font-family="' + KAI + '" font-size="30" dx="5" dy="-1">' + cn(st.day || 1) + '</tspan><tspan dx="6" dy="1">天</tspan></text>',
    T(590, 59, '共 七 日', { size: 11.5, anchor: 'middle', tracking: 5, fill: C.MUT2 }),
    T(1154, 28, '剩余行动力', { size: 13, anchor: 'end', fill: C.MUTED, tracking: 1 }),
    dots,
    '<line x1="26" y1="64" x2="1154" y2="64" stroke="' + C.INK2 + '" stroke-width="1.2" opacity="0.5"/>',
    '</g>',
  ].join('');
}

function mapContent(st) {
  let g = '';
  const F = 'fill="none" stroke="' + C.MUTED + '" stroke-width="2" opacity="0.5"';
  const D = (d) => '<path d="' + d + '" ' + F + '/>';
  const R = (x, y, w, h) => D('M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'z');
  const CIR = (cx, cy, r) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + F + '/>';
  const LN = (x1, y1, x2, y2) => D('M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2);
  function furniture(k, r) {
    const [x, y, w, h] = r;
    let d = '';
    if (k === 'cell1' || k === 'cell2' || k === 'cell3') {
      d += R(x + 16, y + 48, 104, 56) + R(x + 22, y + 54, 26, 44);
      for (let i = 1; i < 4; i++) d += LN(x + 16, y + 48 + i * 14, x + 120, y + 48 + i * 14);
      if (k === 'cell3') for (let i = 0; i < 4; i++) d += LN(x + 20 + i * 26, y + 118, x + 34 + i * 26, y + 98);
      d += CIR(x + 206, y + 96, 13) + CIR(x + 206, y + 52, 11);
      d += LN(x + w, y + h - 24, x + w - 28, y + h - 4);
    } else if (k === 'storage') {
      d += R(x + 16, y + 46, 62, 54) + R(x + 82, y + 62, 48, 38);
      d += LN(x + 16, y + 46, x + 78, y + 100) + LN(x + 78, y + 46, x + 16, y + 100);
      d += CIR(x + 168, y + 84, 18) + CIR(x + 206, y + 100, 12);
      d += R(x + 16, y + 100, 128, 12);
    } else if (k === 'corridor') {
      for (let gx = x + 40; gx < x + w; gx += 44) d += LN(gx, y + 4, gx, y + h - 4);
      for (let gy = y + 60; gy < y + h; gy += 60) d += LN(x + 4, gy, x + w - 4, gy);
      d += R(x + 16, y + 300, 66, 18) + CIR(x + 178, y + 424, 9);
      d += R(x + 12, y + 96, 40, 24);
    } else if (k === 'workshop') {
      d += R(x + 22, y + 44, 150, 26) + CIR(x + 54, y + 40, 7) + CIR(x + 84, y + 40, 7);
      d += R(x + 196, y + 28, 74, 34) + LN(x + 196, y + 45, x + 270, y + 45);
      d += CIR(x + 48, y + 74, 16) + R(x + 92, y + 62, 34, 26);
    } else if (k === 'medical') {
      d += R(x + 22, y + 36, 130, 46) + R(x + 28, y + 42, 26, 34);
      d += LN(x + 232, y + 22, x + 232, y + 66) + LN(x + 210, y + 44, x + 254, y + 44);
      d += R(x + 196, y + 66, 58, 20);
    } else if (k === 'dining') {
      d += R(x + 26, y + 38, 128, 20) + R(x + 26, y + 66, 128, 20);
      d += CIR(x + 44, y + 34, 6) + CIR(x + 74, y + 34, 6) + CIR(x + 104, y + 34, 6);
      d += CIR(x + 44, y + 64, 6) + CIR(x + 74, y + 64, 6) + CIR(x + 104, y + 64, 6);
      d += R(x + 186, y + 20, 76, 24) + CIR(x + 224, y + 76, 16);
    } else if (k === 'laundry') {
      d += CIR(x + 42, y + 48, 21) + CIR(x + 90, y + 48, 21) + CIR(x + 138, y + 48, 21);
      d += R(x + 188, y + 28, 60, 44) + LN(x + 188, y + 28, x + 202, y + 72) + LN(x + 248, y + 28, x + 234, y + 72);
      d += LN(x + 22, y + 80, x + 250, y + 80);
    } else if (k === 'yard') {
      for (let i = -h; i < w; i += 26) {
        const x1 = x + Math.max(4, i), y1 = y + Math.max(4, 4 - i);
        const len = Math.min(x + w - 4 - x1, y + h - 4 - y1);
        if (len > 6) d += LN(x1, y1, x1 + len, y1 + len);
      }
      d += R(x + 70, y + 70, 90, 16) + CIR(x + 200, y + 78, 18);
      d += R(x + w - 92, y + 34, 76, 14);
    }
    return d;
  }
  for (const k in ROOM_RECTS) {
    const r = ROOM_RECTS[k];
    g += '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" fill="#efe6d2" stroke="' + C.INK2 + '" stroke-width="2.4"/>';
    g += furniture(k, r);
    g += '<text x="' + (r[0] + 12) + '" y="' + (r[1] + 30) + '" font-family="' + SONG + '" font-size="25" fill="' + C.INK2 + '" stroke="' + C.PAPER + '" stroke-width="6" paint-order="stroke">' + esc(ROOM_NAMES[k] || k) + '</text>';
  }
  const TOKS = 1.5;
  const tok = (cx, cy, label, kind, lc, id) =>
    '<g' + (id ? ' id="' + id + '"' : '') + '><g transform="translate(' + cx + ' ' + cy + ') scale(' + TOKS + ')">' + portrait(0, 0, kind) + '</g>' +
    '<text x="' + cx + '" y="' + (cy + 68) + '" text-anchor="middle" font-family="' + SONG + '" font-size="21" fill="' + lc + '">' + label + '</text></g>';
  g += tok(345, 250, '他', 'prisoner', C.RED, 'token-prisoner');
  g += tok(405, 394, '狱警', 'guard', C.STEEL, 'token-guard');
  return g;
}

function mapBlock(st) {
  const night = st.phase === 'night';
  let g = '<g id="map" transform="translate(' + MX + ' ' + MY + ') scale(' + MS.toFixed(5) + ')">';
  g += mapContent(st);
  if (night) {
    const p = st.path;
    const last = p && p.length ? p[p.length - 1] : [345, 250];
    g += '<defs><radialGradient id="mlamp" gradientUnits="userSpaceOnUse" cx="' + last[0] + '" cy="' + last[1] + '" r="230">' +
      '<stop offset="0" stop-color="#0b0805" stop-opacity="0.02"/>' +
      '<stop offset="0.45" stop-color="#0b0805" stop-opacity="0.34"/>' +
      '<stop offset="0.78" stop-color="#0b0805" stop-opacity="0.66"/>' +
      '<stop offset="1" stop-color="#0b0805" stop-opacity="0.82"/></radialGradient></defs>';
    g += '<rect x="0" y="0" width="' + MAP_W + '" height="' + MAP_H + '" fill="url(#mlamp)"/>';
    if (p && p.length > 1) {
      const d = p.map((pt, i) => (i ? 'L' : 'M') + pt[0] + ' ' + pt[1]).join(' ');
      g += '<g id="nightpath"><path class="trail" d="' + d + '"/></g>';
      g += '<g class="nptok" style="offset-path:path(\'' + d + '\');offset-rotate:0deg">' +
        '<g transform="scale(1.5)">' + portrait(0, 0, 'prisoner') + '</g></g>';
    }
  }
  g += '</g>';
  return g;
}

function rulesBlock(st) {
  const rules = (st.rules || []).slice(0, 6);
  const ring = ['①', '②', '③', '④', '⑤', '⑥'];
  const top = 122, step = 50;
  let g = '';
  for (let i = 0; i < 6; i++) {
    const y = top + i * step;
    g += T(RX, y, ring[i], { size: 16, fill: rules[i] ? C.INK : C.MUT2 });
    if (rules[i]) {
      const n = Array.from(rules[i].text).length;
      const size = n <= 20 ? 18 : 16;
      const lines = wrap(rules[i].text, Math.floor(580 / size)).slice(0, 2);
      g += T(RX + 26, y, lines[0], { size: size, font: KAI, fill: C.INK });
      if (lines[1]) g += T(RX + 26, y + size + 4, lines[1], { size: size, font: KAI, fill: C.INK });
      g += T(RX + 26, y + (lines[1] ? size * 2 + 8 : 22), '▶', { size: 10, fill: C.WARM });
      g += T(RX + 44, y + (lines[1] ? size * 2 + 8 : 22), rules[i].note || '全时段 · 全区域 · 无例外', { size: 13, fill: C.WARM });
    } else {
      g += '<g class="slot" data-act="write" data-slot="' + i + '" style="cursor:pointer">';
      g += '<rect x="' + (RX - 8) + '" y="' + (y - 24) + '" width="640" height="44" fill="#000" opacity="0.001"/>';
      g += '<line x1="' + (RX + 26) + '" y1="' + (y + 6) + '" x2="1154" y2="' + (y + 6) + '" stroke="' + C.MUTED + '" stroke-width="1.2" stroke-dasharray="4 7" opacity="0.4"/>';
      g += '<text x="' + (RX + 26) + '" y="' + (y + 2) + '" font-family="' + SONG + '" font-size="14.5" fill="' + C.MUT2 + '" opacity="0.6" letter-spacing="3">写一条规矩</text>';
      g += '</g>';
    }
  }
  return '<g id="rules">' + T(RX, 98, '狱 规', { size: 19, fill: C.INK, tracking: 6 }) +
    T(1154, 98, '至多六条', { size: 12.5, anchor: 'end', fill: C.MUT2, tracking: 2 }) + g + '</g>';
}

function gaugeBlock(st) {
  const ob = Math.max(0, Math.min(100, st.obedience == null ? 100 : st.obedience));
  const ho = Math.max(0, Math.min(100, st.hostility == null ? 30 : st.hostility));
  const row = (label, val, color, y) =>
    T(RX, y, label, { size: 13, fill: C.MUTED, tracking: 0.5 }) +
    '<rect x="' + (RX + 92) + '" y="' + (y - 9) + '" width="400" height="11" fill="#000" opacity="0.08"/>' +
    '<rect x="' + (RX + 92) + '" y="' + (y - 9) + '" width="' + (400 * val / 100).toFixed(1) + '" height="11" fill="' + color + '"/>' +
    T(1154, y, String(Math.round(val)), { size: 13, anchor: 'end', fill: C.INK2 });
  return '<g id="gauge">' + row('狱警服从度', ob, C.BRASS, 416) + row('囚犯敌意', ho, C.RED, 438) + '</g>';
}

function reportBlock(st) {
  const night = st.phase === 'night';
  const rows = (st.report || []).slice(0, 6);
  let g = T(26, 390, '巡 查 报 告', { size: 14, tracking: 3, fill: C.INK });
  if (!night) {
    let y = 414;
    for (const r of rows) {
      if (y > 536) break;
      if (r.t) g += T(26, y, r.t, { size: 12, fill: C.MUTED });
      const lines = wrap(r.text, 25).slice(0, 2);
      lines.forEach((ln, i) => { g += T(64, y + i * 20, ln, { size: 16, font: KAI, fill: i ? C.MUTED : C.INK }); });
      y += lines.length > 1 ? 40 : 26;
    }
  }
  // 夜里逐条打字：坐标沿用桌面版（y 从 792 起），由 data-cfg 折算到横屏版式
  return '<g id="report">' + g +
    '<g id="report-live" data-cfg=\'{"x1":26,"x2":64,"y0":410,"k":1,"fs":15.5,"cols":25,"pitch":29,"pitchCompact":24,"maxY":928,"maxYCompact":925}\'></g>' +
    '</g>';
}

function nightButton(st) {
  const night = st.phase === 'night';
  return '<g data-act="night" style="cursor:pointer">' +
    '<rect x="1040" y="448" width="104" height="74" fill="none" stroke="' + C.REDD + '" stroke-width="2.4"/>' +
    '<text x="1092" y="496" text-anchor="middle" font-family="' + KAI + '" font-size="34" fill="' + C.RED + '" letter-spacing="7">' + (night ? '夜 里' : '入 夜') + '</text>' +
    '</g>';
}

function footer(st) {
  return '<g id="foot">' + T(1154, 541, '第 ' + cn(st.day || 1) + ' 页 / 共 七 页', { size: 11, anchor: 'end', fill: C.MUT2, tracking: 2 }) + '</g>';
}

export function renderLandscape(st) {
  const night = st.phase === 'night';
  return '<svg class="screen-svg landscape' + (night ? ' night' : '') + '" viewBox="0 0 ' + LW + ' ' + LH + '" xmlns="http://www.w3.org/2000/svg">' +
    buildDefs() + buildPaper(LW, LH) + header(st) + mapBlock(st) +
    rulesBlock(st) + gaugeBlock(st) + reportBlock(st) + nightButton(st) + footer(st) + '</svg>';
}

export function renderLandscapeSettle(st) {
  const rules = (st.rules || []).slice(0, 6);
  const sc = st.settle || {};
  const stats = st.settleStats || {};
  const ring = ['①', '②', '③', '④', '⑤', '⑥'];
  let g = '';
  g += T(LW / 2, 36, '判 决 书', { size: 13, anchor: 'middle', tracking: 9, fill: C.INK2 });
  g += '<text x="' + (LW / 2) + '" y="136" text-anchor="middle" font-family="' + KAI + '" font-size="62" fill="' + C.RED + '" letter-spacing="8">' + esc(sc.title || '') + '</text>';
  g += T(LW / 2, 174, sc.sub || '', { size: 16, anchor: 'middle', fill: C.INK2, tracking: 1 });
  g += '<line x1="70" y1="200" x2="' + (LW - 70) + '" y2="200" stroke="' + C.INK2 + '" stroke-width="1" opacity="0.4"/>';
  g += T(70, 228, '六 条 规 矩', { size: 12.5, tracking: 5, fill: C.MUTED });
  const colX = [70, 610];
  for (let i = 0; i < 6; i++) {
    const cx = colX[i < 3 ? 0 : 1], y = 260 + (i % 3) * 40;
    g += T(cx, y, ring[i], { size: 13, fill: rules[i] ? C.INK : C.MUT2 });
    if (rules[i]) {
      const lines = wrap(rules[i].text, 32).slice(0, 2);
      g += T(cx + 26, y, lines[0], { size: 16, font: KAI, fill: C.INK });
      if (lines[1]) g += T(cx + 26, y + 19, lines[1], { size: 16, font: KAI, fill: C.INK });
    } else {
      g += '<line x1="' + (cx + 26) + '" y1="' + (y - 4) + '" x2="' + (cx + 520) + '" y2="' + (y - 4) + '" stroke="' + C.MUTED + '" stroke-width="1" stroke-dasharray="4 7" opacity="0.4"/>';
    }
  }
  g += '<line x1="70" y1="386" x2="' + (LW - 70) + '" y2="386" stroke="' + C.INK2 + '" stroke-width="1" opacity="0.4"/>';
  const q = wrap(sc.quote || '', 40).slice(0, 2);
  q.forEach((ln, i) => { g += T(70, 412 + i * 22, ln, { size: 15, font: KAI, fill: C.INK }); });
  g += T(70, 452, '狱警服从度 ' + stats.obedience + '　囚犯敌意 ' + stats.hostility, { size: 12, fill: C.MUTED });
  g += T(LW - 70, 452, stats.days || '', { size: 12, anchor: 'end', fill: C.MUT2, tracking: 1 });
  if (stats.ai) g += T(70, 472, stats.ai, { size: 11, fill: C.MUT2, tracking: 1 });
  g += '<g transform="translate(1040 400) rotate(-11)" opacity="0.92"><rect x="-48" y="-48" width="96" height="96" fill="none" stroke="' + C.RED + '" stroke-width="3" opacity="0.8"/><rect x="-42" y="-42" width="84" height="84" fill="none" stroke="' + C.RED + '" stroke-width="1.2" opacity="0.65"/><text x="0" y="10" text-anchor="middle" font-family="' + KAI + '" font-size="26" fill="' + C.RED + '" letter-spacing="6" opacity="0.88">查 讫</text></g>';
  g += '<g data-act="again" style="cursor:pointer"><rect x="470" y="466" width="200" height="42" fill="none" stroke="' + C.INK2 + '" stroke-width="1.6" opacity="0.75"/><text x="570" y="494" text-anchor="middle" font-family="' + KAI + '" font-size="18" fill="' + C.INK2 + '" letter-spacing="6">再 来 一 局</text></g>';
  g += T(70, 528, '案 卷 No.07 / 19', { size: 10, fill: C.MUT2, tracking: 2 });
  return '<svg class="screen-svg landscape settle" viewBox="0 0 ' + LW + ' ' + LH + '" xmlns="http://www.w3.org/2000/svg">' +
    buildDefs() + buildPaper(LW, LH) + '<rect x="18" y="18" width="' + (LW - 36) + '" height="' + (LH - 36) + '" fill="none" stroke="' + C.INK2 + '" stroke-width="1" opacity="0.35"/>' + g + '</svg>';
}

export function isLandscapeView() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(orientation: landscape) and (max-height: 560px) and (max-width: 1180px)').matches;
}
