// mobile.js — 手机竖屏版式：一屏纵向流（状态 → 简化平面图 → 狱规 → 状态条 → 巡查报告 → 入夜）。
// 只换排版，不换规则、不换判定：桌面版仍是 screen.js 的 1600×1000。
import { C, KAI, SONG, buildDefs, buildPaper } from './paper.js';
import { ROOM_RECTS, MAP_W, MAP_H } from './map.js';

export const MW = 800, MH = 1840, MSH = 1500;
const MX = 36, MY = 168, MS = 728 / MAP_W;
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
  const a = ['x="' + x + '"', 'y="' + y + '"', 'font-size="' + (o.size || 16) + '"',
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
  // 行首不落标点：把上一行最后一个字让给下一行（中文折行的基本要求）
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
    const x = 764 - (apMax - 1 - i) * 32;
    dots += i < ap
      ? '<circle cx="' + x + '" cy="104" r="11" fill="' + C.RED + '"/>'
      : '<circle cx="' + x + '" cy="104" r="11" fill="none" stroke="' + C.MUTED + '" stroke-width="1.6" opacity="0.8"/>';
  }
  return [
    '<g id="head">',
    T(36, 46, '案 卷 No.07 / 19', { size: 20, tracking: 2, fill: C.INK }),
    T(36, 76, '脱逃事件调查报告 · 内部资料', { size: 17, fill: C.MUTED }),
    '<text x="400" y="106" text-anchor="middle" font-family="' + SONG + '" font-size="46" fill="' + C.INK + '" letter-spacing="3">第<tspan fill="' + C.RED + '" font-family="' + KAI + '" font-size="52" dx="6" dy="-2">' + cn(st.day || 1) + '</tspan><tspan dx="8" dy="2">天</tspan></text>',
    T(400, 138, '共 七 日', { size: 17, anchor: 'middle', tracking: 6, fill: C.MUTED }),
    T(764, 42, '剩余行动力', { size: 17, anchor: 'end', fill: C.MUTED, tracking: 1 }),
    dots,
    '<line x1="36" y1="156" x2="764" y2="156" stroke="' + C.INK2 + '" stroke-width="1.4" opacity="0.5"/>',
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
    g += '<text x="' + (r[0] + 12) + '" y="' + (r[1] + 30) + '" font-family="' + SONG + '" font-size="23" fill="' + C.INK2 + '" stroke="' + C.PAPER + '" stroke-width="6" paint-order="stroke">' + esc(ROOM_NAMES[k] || k) + '</text>';
  }
  // 两个人物：囚犯（红）与狱警（黑），位置沿用桌面版的档案小像
  const tok = (cx, cy, label, color) =>
    '<g><circle cx="' + cx + '" cy="' + cy + '" r="18" fill="' + color + '" opacity="0.9"/>' +
    '<circle cx="' + cx + '" cy="' + (cy - 5) + '" r="6" fill="#f2e8d2"/>' +
    '<text x="' + cx + '" y="' + (cy + 46) + '" text-anchor="middle" font-family="' + SONG + '" font-size="19" fill="' + C.INK2 + '">' + label + '</text></g>';
  g += tok(345, 250, '他', C.RED);
  g += tok(405, 394, '狱警', C.BRASS);
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
      g += '<g class="nptok"><circle r="18" fill="' + C.RED + '"/><circle cy="-5" r="6" fill="#f2e8d2"/><animateMotion dur="2.2s" fill="freeze" path="' + d + '"/></g>';
    }
  }
  g += '</g>';
  return g;
}

function rulesBlock(st) {
  const rules = (st.rules || []).slice(0, 6);
  const ring = ['①', '②', '③', '④', '⑤', '⑥'];
  const top = 766, step = 84;
  let g = '';
  for (let i = 0; i < 6; i++) {
    const y = top + i * step;
    g += T(36, y, ring[i], { size: 26, fill: rules[i] ? C.INK : C.MUT2 });
    if (rules[i]) {
      const n = Array.from(rules[i].text).length;
      const size = n <= 15 ? 29 : n <= 19 ? 26 : 22;
      const per = Math.floor(470 / size);
      const lines = wrap(rules[i].text, per).slice(0, 2);
      g += T(74, y, lines[0], { size: size, font: KAI, fill: C.INK });
      if (lines[1]) g += T(74, y + size + 4, lines[1], { size: size, font: KAI, fill: C.INK });
      const ny = y + (lines[1] ? size * 2 + 10 : 34);
      g += T(76, ny, '▶', { size: 16, fill: C.WARM });
      g += T(98, ny, rules[i].note || '全时段 · 全区域 · 无例外', { size: 19, fill: C.WARM, tracking: 0.4 });
    } else {
      g += '<g class="slot" data-act="write" data-slot="' + i + '" style="cursor:pointer">';
      g += '<rect x="20" y="' + (y - 34) + '" width="756" height="68" fill="#000" opacity="0.001"/>';
      g += '<line x1="74" y1="' + (y + 8) + '" x2="764" y2="' + (y + 8) + '" stroke="' + C.MUTED + '" stroke-width="1.6" stroke-dasharray="5 8" opacity="0.45"/>';
      g += '<text x="98" y="' + (y + 4) + '" font-family="' + SONG + '" font-size="22" fill="' + C.MUT2 + '" opacity="0.6" letter-spacing="4">写一条规矩</text>';
      g += '</g>';
    }
  }
  return '<g id="rules">' + T(36, 722, '狱 规', { size: 26, fill: C.INK, tracking: 8 }) +
    T(764, 722, '至多六条', { size: 19, anchor: 'end', fill: C.MUT2, tracking: 2 }) + g + '</g>';
}

function gaugeBlock(st) {
  const ob = Math.max(0, Math.min(100, st.obedience == null ? 100 : st.obedience));
  const ho = Math.max(0, Math.min(100, st.hostility == null ? 30 : st.hostility));
  const row = (label, val, color, y) =>
    T(36, y, label, { size: 21, fill: C.MUTED, tracking: 1 }) +
    '<rect x="196" y="' + (y - 15) + '" width="440" height="16" fill="#000" opacity="0.08"/>' +
    '<rect x="196" y="' + (y - 15) + '" width="' + (440 * val / 100).toFixed(1) + '" height="16" fill="' + color + '"/>' +
    T(764, y, String(Math.round(val)), { size: 21, anchor: 'end', fill: C.INK2 });
  return '<g id="gauge">' + row('狱警服从度', ob, C.BRASS, 1302) + row('囚犯敌意', ho, C.RED, 1352) + '</g>';
}

function reportBlock(st) {
  const night = st.phase === 'night';
  const rows = (st.report || []).slice(0, 6);
  let g = T(36, 1424, '巡 查 报 告', { size: 24, tracking: 4, fill: C.INK });
  if (!night) {
    let y = 1476;
    for (const r of rows) {
      if (y > 1700) break;
      if (r.t) g += T(36, y, r.t, { size: 20, fill: C.MUTED, tracking: 0.5 });
      const lines = wrap(r.text, 24).slice(0, 2);
      lines.forEach((ln, i) => { g += T(116, y + i * 34, ln, { size: 25, font: KAI, fill: i ? C.MUTED : C.INK }); });
      y += lines.length > 1 ? 84 : 46;
    }
  }
  // 夜里逐条打字：坐标沿用桌面版（x=252/306, y 从 792 起），由 data-cfg 折算到手机版式
  return '<g id="report">' + g +
    '<g id="report-live" data-cfg=\'{"x1":36,"x2":116,"y0":1476,"k":1.55,"fs":25,"cols":24}\'></g>' +
    '</g>';
}

function nightButton(st) {
  const night = st.phase === 'night';
  return '<g data-act="night" style="cursor:pointer">' +
    '<rect x="452" y="1672" width="312" height="124" fill="none" stroke="' + C.REDD + '" stroke-width="4"/>' +
    '<text x="608" y="1754" text-anchor="middle" font-family="' + KAI + '" font-size="54" fill="' + C.RED + '" letter-spacing="12">' + (night ? '夜 里' : '入 夜') + '</text>' +
    '</g>';
}

function footer(st) {
  return '<g id="foot">' +
    T(36, 1818, '值班人', { size: 20, fill: C.MUTED, tracking: 2 }) +
    T(126, 1818, '李', { size: 22, font: KAI, fill: C.INK2 }) +
    '<line x1="156" y1="1820" x2="316" y2="1820" stroke="' + C.MUTED + '" stroke-width="1.2" opacity="0.5"/>' +
    T(764, 1818, '第 ' + cn(st.day || 1) + ' 页 / 共 七 页', { size: 20, anchor: 'end', fill: C.MUT2, tracking: 2 }) +
    '</g>';
}

export function renderMobile(st) {
  const night = st.phase === 'night';
  return '<svg class="screen-svg mobile' + (night ? ' night' : '') + '" viewBox="0 0 ' + MW + ' ' + MH + '" xmlns="http://www.w3.org/2000/svg">' +
    buildDefs() + buildPaper(MW, MH) + header(st) + mapBlock(st) +
    rulesBlock(st) + gaugeBlock(st) + reportBlock(st) + nightButton(st) + footer(st) + '</svg>';
}

export function renderMobileSettle(st) {
  const rules = (st.rules || []).slice(0, 6);
  const sc = st.settle || {};
  const stats = st.settleStats || {};
  const ring = ['①', '②', '③', '④', '⑤', '⑥'];
  let g = '';
  g += T(MW / 2, 120, '判 决 书', { size: 26, anchor: 'middle', tracking: 12, fill: C.INK2 });
  g += '<text x="' + (MW / 2) + '" y="248" text-anchor="middle" font-family="' + KAI + '" font-size="98" fill="' + C.RED + '" letter-spacing="10">' + esc(sc.title || '') + '</text>';
  g += T(MW / 2, 306, sc.sub || '', { size: 28, anchor: 'middle', fill: C.INK2, tracking: 1 });
  g += '<line x1="70" y1="356" x2="' + (MW - 70) + '" y2="356" stroke="' + C.INK2 + '" stroke-width="1" opacity="0.4"/>';
  g += T(70, 404, '六 条 规 矩', { size: 21, tracking: 6, fill: C.MUTED });
  for (let i = 0; i < 6; i++) {
    const y = 470 + i * 74;
    g += T(70, y, ring[i], { size: 24, fill: rules[i] ? C.INK : C.MUT2 });
    if (rules[i]) {
      const lines = wrap(rules[i].text, 17).slice(0, 2);
      g += T(108, y, lines[0], { size: 28, font: KAI, fill: C.INK });
      if (lines[1]) g += T(108, y + 32, lines[1], { size: 28, font: KAI, fill: C.INK });
    } else {
      g += '<line x1="108" y1="' + (y - 4) + '" x2="' + (MW - 70) + '" y2="' + (y - 4) + '" stroke="' + C.MUTED + '" stroke-width="1.2" stroke-dasharray="4 7" opacity="0.4"/>';
    }
  }
  g += '<line x1="70" y1="960" x2="' + (MW - 70) + '" y2="960" stroke="' + C.INK2 + '" stroke-width="1" opacity="0.4"/>';
  const q = wrap(sc.quote || '', 24).slice(0, 4);
  q.forEach((ln, i) => { g += T(70, 1016 + i * 44, ln, { size: 27, font: KAI, fill: C.INK }); });
  g += T(70, 1210, '狱警服从度 ' + stats.obedience + '　囚犯敌意 ' + stats.hostility, { size: 21, fill: C.MUTED });
  g += T(MW - 70, 1210, stats.days || '', { size: 21, anchor: 'end', fill: C.MUT2, tracking: 1 });
  if (stats.ai) g += T(70, 1250, stats.ai, { size: 20, fill: C.MUT2, tracking: 1 });
  g += '<g transform="translate(694 186) rotate(-11)" opacity="0.92"><rect x="-78" y="-78" width="156" height="156" fill="none" stroke="' + C.RED + '" stroke-width="4" opacity="0.8"/><rect x="-70" y="-70" width="140" height="140" fill="none" stroke="' + C.RED + '" stroke-width="1.5" opacity="0.65"/><text x="0" y="15" text-anchor="middle" font-family="' + KAI + '" font-size="40" fill="' + C.RED + '" letter-spacing="9" opacity="0.88">查 讫</text></g>';
  g += '<g data-act="again" style="cursor:pointer"><rect x="250" y="1330" width="300" height="92" fill="none" stroke="' + C.INK2 + '" stroke-width="2" opacity="0.75"/><text x="400" y="1392" text-anchor="middle" font-family="' + KAI + '" font-size="34" fill="' + C.INK2 + '" letter-spacing="8">再 来 一 局</text></g>';
  g += T(70, 1466, '案 卷 No.07 / 19', { size: 18, fill: C.MUT2, tracking: 2 });
  return '<svg class="screen-svg mobile settle" viewBox="0 0 ' + MW + ' ' + MSH + '" xmlns="http://www.w3.org/2000/svg">' +
    buildDefs() + buildPaper(MW, MSH) + '<rect x="18" y="18" width="' + (MW - 36) + '" height="' + (MSH - 36) + '" fill="none" stroke="' + C.INK2 + '" stroke-width="1" opacity="0.35"/>' + g + '</svg>';
}

export function isMobileView() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 900px) and (orientation: portrait)').matches;
}
