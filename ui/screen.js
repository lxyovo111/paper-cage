// screen.js — 把 state 渲染成一整屏 SVG。纯函数，无副作用，可在 node 里跑（给截图用）。
import { C, KAI, SONG, buildDefs, buildPaper } from './paper.js';

export const W = 1600, H = 1000;
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

export function cn(n) { return n <= 10 ? CN[n] : CN[Math.floor(n / 10)] + CN[n % 10]; }
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
  if (o.weight) a.push('font-weight="' + o.weight + '"');
  return '<text ' + a.join(' ') + '>' + esc(s) + '</text>';
}
// 按字宽硬折行（中文方块字，够用）
function wrap(s, max) {
  if (!s) return [];
  const out = [];
  let cur = '';
  for (const ch of String(s)) {
    if (ch === '\n') { out.push(cur); cur = ''; continue; }
    cur += ch;
    if (cur.length >= max) { out.push(cur); cur = ''; }
  }
  if (cur) out.push(cur);
  return out;
}

// ---- 各区块 ----------------------------------------------------------------
function header(st) {
  const ap = Math.max(0, Math.min(st.apMax || 3, st.ap == null ? 3 : st.ap));
  let dots = '';
  for (let i = 0; i < (st.apMax || 3); i++) {
    const x = 1468 - 7 - ((st.apMax || 3) - 1 - i) * 20;
    dots += i < ap
      ? '<circle cx="' + x + '" cy="118" r="6.4" fill="' + C.RED + '"/>'
      : '<circle cx="' + x + '" cy="118" r="6.4" fill="none" stroke="' + C.MUTED + '" stroke-width="1" opacity="0.75"/>';
  }
  const day = st.day || 1;
  return `
  <g id="head">
    ${T(132, 84, '案 卷 No.07 / 19', { size: 13, tracking: 2, fill: C.INK })}
    ${T(132, 112, '脱逃事件调查报告 · 内部资料', { size: 12, fill: C.MUTED, tracking: 0.5 })}
    <text x="800" y="86" text-anchor="middle" font-family="${SONG}" font-size="26" fill="${C.INK}" letter-spacing="3">第<tspan fill="${C.RED}" font-family="${KAI}" font-size="31" dx="6" dy="-1">${cn(day)}</tspan><tspan dx="8" dy="1">天</tspan></text>
    ${T(800, 128, '共 七 日', { size: 11, anchor: 'middle', tracking: 6, fill: C.MUTED })}
    ${T(1468, 84, '剩余行动力', { size: 11, anchor: 'end', fill: C.MUTED, tracking: 1 })}
    ${dots}
    <line x1="132" y1="170" x2="1468" y2="170" stroke="${C.INK2}" stroke-width="0.9" opacity="0.55"/>
    <line x1="132" y1="172.5" x2="1468" y2="172.5" stroke="${C.INK2}" stroke-width="0.5" opacity="0.28"/>
  </g>`;
}

function rulesPanel(st) {
  const rules = (st.rules || []).slice(0, 6);
  const ring = ['①', '②', '③', '④', '⑤', '⑥'];
  let g = '';
  for (let i = 0; i < 6; i++) {
    const y = 238 + i * 62;
    g += T(1158, y, ring[i], { size: 16, fill: rules[i] ? C.INK : C.MUT2 });
    if (rules[i]) {
      const n = Array.from(rules[i].text).length;
      const size = n <= 16 ? 17 : n <= 19 ? 15 : n <= 23 ? 13.5 : 12.5;
      const per = Math.floor(286 / size);
      const lines = wrap(rules[i].text, per).slice(0, 2);
      const isLong = lines.length > 1;
      g += T(1182, y, lines[0], { size: size, font: KAI, fill: C.INK });
      if (isLong) g += T(1182, y + size + 2, lines[1], { size: size, font: KAI, fill: C.INK });
      const ny = isLong ? y + size * 2 + 4 : y + 24;
      g += T(1184, ny, '▶', { size: 9, fill: C.WARM });
      g += T(1198, ny, rules[i].note || '全时段 · 全区域 · 无例外', { size: 10.5, fill: C.WARM, tracking: 0.6 });
    } else {
      g += '<g class="slot" data-act="write" data-slot="' + i + '" style="cursor:pointer">';
      g += '<rect x="1150" y="' + (y - 26) + '" width="322" height="34" fill="#000" opacity="0.001"/>';
      g += '<line x1="1184" y1="' + (y - 3) + '" x2="1468" y2="' + (y - 3) + '" stroke="' + C.MUTED + '" stroke-width="0.9" stroke-dasharray="3 5" opacity="0.45"/>';
      g += '<text x="1268" y="' + (y - 8) + '" font-size="10.5" fill="' + C.MUT2 + '" opacity="0.55" letter-spacing="3">写一条规矩</text>';
      g += '</g>';
    }
  }
  return `
  <g id="rules">
    ${T(1158, 186, '狱 规', { size: 15, fill: C.INK, tracking: 8 })}
    ${T(1468, 190, '至多六条', { size: 10, anchor: 'end', fill: C.MUT2, tracking: 2 })}
    ${g}
    <line x1="1158" y1="654" x2="1468" y2="654" stroke="${C.INK2}" stroke-width="0.7" opacity="0.3"/>
    ${T(1158, 672, '状 态', { size: 10, fill: C.MUTED, tracking: 6 })}
    ${gauge(1158, 708, '狱警服从度', st.obedience == null ? 70 : st.obedience, C.BRASS)}
    ${gauge(1158, 742, '囚犯敌意', st.hostility == null ? 42 : st.hostility, C.RED)}
  </g>`;
}

function gauge(x, y, label, v, color) {
  const w = 176, bx = 1258, bw = 178;
  const p = Math.max(0, Math.min(100, v)) / 100;
  return `
  ${T(x, y, label, { size: 11.5, fill: C.MUTED, tracking: 1 })}
  <rect x="${bx}" y="${y - 6}" width="${bw}" height="5" fill="${C.INK}" opacity="0.14"/>
  <rect x="${bx}" y="${y - 6}" width="${(bw * p).toFixed(1)}" height="5" fill="${color}"/>
  ${T(1468, y, Math.round(v), { size: 12, anchor: 'end', fill: C.INK2 })}`;
}

function report(st) {
  const lines = st.report || [];
  const rows = [];
  let y = 792;
  for (const r of lines.slice(0, 5)) {
    const parts = wrap(r.text, 36);
    const rowTop = y - 18;
    const rowH = 22 * Math.min(2, parts.length) + 16;
    const rowParts = [T(252, y, r.t || '', { size: 12, fill: C.MUTED, tracking: 0.5 })];
    parts.slice(0, 2).forEach(function (p, i) {
      rowParts.push(T(306, y + i * 22, p, { size: 15.5, font: KAI, fill: i ? C.MUTED : C.INK2 }));
    });
    // data-room 来自昨夜 trace；点一行，地图上就亮一下那个房间。
    rows.push('<g data-act="locate" data-room="' + (r.room || '') + '" style="cursor:pointer">' +
      '<rect x="246" y="' + rowTop + '" width="1120" height="' + rowH + '" fill="#000" opacity="0.001"/>' +
      rowParts.join('') + '</g>');
    y += 22 * Math.min(2, parts.length) + 10;
  }
  const day = st.day || 1;
  return `
  <g id="report">
    <line x1="132" y1="752" x2="1468" y2="752" stroke="${C.INK2}" stroke-width="0.8" opacity="0.4"/>
    ${T(132, 776, '巡 查 报 告', { size: 13, fill: C.INK, tracking: 4 })}
    <g data-act="why" style="cursor:pointer">
      <rect x="1146" y="760" width="128" height="24" fill="#000" opacity="0.001"/>
      ${T(1266, 776, '行动依据 ▸', { size: 10.5, anchor: 'end', fill: C.WARM, tracking: 1 })}
    </g>
    ${T(132, 924, '值 班 人', { size: 10, fill: C.MUT2, tracking: 3 })}
    ${T(196, 924, '李', { size: 15, font: KAI, fill: C.INK2 })}
    <line x1="216" y1="927" x2="330" y2="927" stroke="${C.INK2}" stroke-width="0.7" opacity="0.4"/>
    ${T(1468, 924, '第 ' + cn(day) + ' 页 / 共 七 页', { size: 11, anchor: 'end', fill: C.MUT2, tracking: 3 })}
    ${rows.join('')}
    <g id="report-live"></g>
  </g>`;
}

function seal(st) {
  const label = st.phase === 'night' ? '夜 里' : '入 夜';
  const cx = 1418, cy = 812;
  return `
  <g id="act-night" class="hit" data-act="night" transform="translate(${cx} ${cy}) rotate(-9)" style="cursor:pointer">
    <rect x="-50" y="-50" width="100" height="100" fill="#c9b48a" opacity="0.001"/>
    <rect x="-42" y="-42" width="84" height="84" fill="none" stroke="${C.REDD}" stroke-width="3" opacity="0.9"/>
    <rect x="-36" y="-36" width="72" height="72" fill="none" stroke="${C.REDD}" stroke-width="1" opacity="0.75"/>
    <text x="0" y="9" text-anchor="middle" font-family="${KAI}" font-size="23" fill="${C.REDD}" letter-spacing="2">${label}</text>
  </g>`;
}

// ---- 结算页：整屏判决书（这张图就是传播物料） ----
function settlePage(st) {
  const s = st.settle || {};
  const rules = (st.rules || []);
  let rl = '';
  for (let i = 0; i < 6; i++) {
    const y = 452 + i * 40;
    rl += T(430, y, ['①','②','③','④','⑤','⑥'][i], { size: 14, fill: rules[i] ? C.INK : C.MUT2 });
    if (rules[i]) {
      rl += T(456, y, rules[i].text, { size: 15.5, font: KAI, fill: C.INK2 });
    } else {
      rl += '<line x1="456" y1="' + (y - 4) + '" x2="1160" y2="' + (y - 4) + '" stroke="' + C.MUTED + '" stroke-width="0.8" stroke-dasharray="3 5" opacity="0.4"/>';
    }
  }
  const sc = st.settleStats || {};
  return `
  <g id="settle">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#14110e" opacity="0.68"/>
    <rect x="300" y="96" width="1000" height="810" fill="${C.PAPER}"/>
    <rect x="300" y="96" width="1000" height="810" fill="#b48d54" opacity="0.08" filter="url(#blotch)"/>
    <rect x="300.5" y="96.5" width="999" height="809" fill="none" stroke="#6b5a3e" stroke-width="1.2" opacity="0.55"/>
    <rect x="314.5" y="110.5" width="971" height="781" fill="none" stroke="#6b5a3e" stroke-width="0.7" opacity="0.4"/>
    ${T(800, 186, '判 决 书', { size: 13, fill: C.MUTED, anchor: 'middle', tracking: 12 })}
    ${T(800, 292, s.title || '', { size: 62, font: KAI, fill: C.RED, anchor: 'middle', tracking: 18 })}
    ${T(800, 340, s.sub || '', { size: 15, fill: C.INK2, anchor: 'middle', tracking: 3 })}
    <line x1="600" y1="374" x2="1000" y2="374" stroke="${C.INK2}" stroke-width="0.7" opacity="0.35"/>
    ${T(430, 412, '六 条 规 矩', { size: 11, fill: C.MUT2, tracking: 6 })}
    ${rl}
    <line x1="430" y1="706" x2="1160" y2="706" stroke="${C.INK2}" stroke-width="0.7" opacity="0.32"/>
    ${T(430, 752, (s.quote || '').replace(/^——/, '——'), { size: 16, font: KAI, fill: C.INK, })}
    ${T(1160, 800, sc.days || '', { size: 12, fill: C.MUTED, anchor: 'end', tracking: 2 })}
    ${sc.ai ? T(430, 828, sc.ai, { size: 10.5, fill: C.MUT2, tracking: 1 }) : ''}
    ${T(430, 800, '狱警服从度 ' + (sc.obedience == null ? '' : sc.obedience) + '　囚犯敌意 ' + (sc.hostility == null ? '' : sc.hostility), { size: 12, fill: C.MUTED, tracking: 2 })}
    ${T(360, 150, '案 卷 No.07 / 19', { size: 10, fill: C.MUT2, tracking: 2 })}
    <g transform="translate(1180 700) rotate(-11)">
      <rect x="-52" y="-52" width="104" height="104" fill="none" stroke="${C.REDD}" stroke-width="3.4" opacity="0.85"/>
      <rect x="-45" y="-45" width="90" height="90" fill="none" stroke="${C.REDD}" stroke-width="1.1" opacity="0.7"/>
      <text x="0" y="8" text-anchor="middle" font-family="${KAI}" font-size="26" fill="${C.REDD}" letter-spacing="2" opacity="0.9">查 讫</text>
    </g>
    <g data-act="again" style="cursor:pointer" transform="translate(800 862)">
      <rect x="-110" y="-22" width="220" height="44" fill="#000" opacity="0.001"/>
      ${T(0, 6, '再 来 一 局', { size: 14, fill: C.MUTED, anchor: 'middle', tracking: 5 })}
    </g>
  </g>`;
}

// ---- 夜：熄灯 + 灯光光斑 + 昨夜路径 -----------------------------------------
function nightLayer(st) {
  const p = (st && st.path) || [];
  if (!p.length) return '';
  const d = p.map(function (q, i) { return (i ? 'L' : 'M') + q[0] + ' ' + q[1]; }).join(' ');
  const defs =
    '<defs>' +
    '<radialGradient id="lampmask" cx="50%" cy="50%" r="50%">' +
    '<stop offset="0" stop-color="#000"/><stop offset="0.5" stop-color="#000"/><stop offset="1" stop-color="#fff"/>' +
    '</radialGradient>' +
    '<filter id="nsoft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="18"/></filter>' +
    '<mask id="nightmask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
    '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>' +
    '<g filter="url(#nsoft)">' +
    '<ellipse cx="612" cy="452" rx="404" ry="282" fill="url(#lampmask)"/>' +
    '<rect x="146" y="770" width="970" height="128" fill="#6a6a6a"/>' +
    '</g>' +
    '</mask>' +
    '</defs>';
  const dim = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#0b0805" opacity="0.74" mask="url(#nightmask)"/>';
  const line =
    '<g transform="translate(204,182) scale(1.0726)">' +
    '<path d="' + d + '" fill="none" stroke="#f2e6cf" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.10"/>' +
    '<path id="np" d="' + d + '" pathLength="100" fill="none" stroke="#a33323" stroke-width="2.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="100" stroke-dashoffset="0" opacity="0.92"/>' +
    '<g class="nptok" style="offset-path:path(\'' + d + '\');offset-rotate:0deg">' +
    '<g transform="scale(1.18)"><use href="#token-prisoner" transform="translate(-345 -250)"/></g></g>' +
    '</g>';
  return defs + dim + line;
}
// ---- 主渲染 ----------------------------------------------------------------
export async function renderScreen(st) {
  st = st || {};
  let map = '';
  try {
    const mapMod = await import('./map.js');
    map = mapMod.buildMap({ night: st.phase === 'night' || st.phase === 'settle', path: st.path || null, tokens: st.tokens || null });
  } catch (e) {
    map = fallbackMap(st);
  }
  const nightCls = st.phase === 'night' ? 'night' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" class="${nightCls}" font-family="${SONG}">
  ${buildDefs()}
  ${buildPaper(W, H)}
  ${header(st)}
  <g id="mapwrap" transform="translate(204,182) scale(1.0726)">
    <g id="mapbox">${map}</g>
  </g>
  <line x1="1132" y1="182" x2="1132" y2="738" stroke="${C.INK2}" stroke-width="0.7" opacity="0.22"/>
  ${rulesPanel(st)}
  ${report(st)}
  ${st.phase === 'night' ? nightLayer(st) : ''}
  ${st.phase === 'settle' ? settlePage(st) : seal(st)}
</svg>`;
}

function fallbackMap(st) {
  const p = (st && st.path) || [];
  const d = p.map(function (q, i) { return (i ? 'L' : 'M') + q[0] + ' ' + q[1]; }).join(' ');
  return '<g id="mapbox-inner">' +
    '<rect width="558" height="520" fill="none" stroke="' + C.INK2 + '" stroke-width="1.2" opacity="0.25"/>' +
    '<text x="279" y="270" text-anchor="middle" font-size="15" fill="' + C.MUTED + '">地图加载中…</text>' +
    (p.length > 1 ? '<g id="nightpath"><path class="trail" d="' + d + '" fill="none" stroke="#882e1f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 5" opacity="0.8"/></g>' : '') +
    '</g>';
}
