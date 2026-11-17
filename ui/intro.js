// intro.js — 进入界面（封面）。桌面 1600x1000，手机竖屏 800x1840。
// 只负责「看起来怎样」：返回 SVG 字符串，不碰状态、不碰判定。
// 与外部唯一契约：输出里必须有一个 data-act="start" 的元素 —— 点它才开始新一局。
import { C, KAI, SONG, buildDefs, buildPaper } from "./paper.js";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 一段文字：x/y 是基线；anchor=middle 时水平居中
function T(x, y, s, o) {
  o = o || {};
  const f = o.kai === false ? SONG : KAI;
  let a = `x="${x}" y="${y}" fill="${o.fill || C.INK}" font-family="${f}" font-size="${o.size || 14}"`;
  if (o.tracking) a += ` letter-spacing="${o.tracking}"`;
  if (o.anchor) a += ` text-anchor="${o.anchor}"`;
  if (o.opacity != null) a += ` opacity="${o.opacity}"`;
  return `<text ${a}>${esc(s)}</text>`;
}

function H(x1, y1, x2, y2, o) {
  o = o || {};
  const st = o.stroke || C.INK2;
  const op = o.opacity == null ? 0.35 : o.opacity;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st}" stroke-width="${o.w || 1}" opacity="${op}"/>`;
}

// 他走过的那条路：一条很淡的虚线，压在纸上像铅笔痕迹
function trail(pts, op) {
  const d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
  return `<path d="${d}" fill="none" stroke="${C.RED}" stroke-width="2" stroke-dasharray="10 12" opacity="${op}"/>`;
}

// 红章按钮：双线方框 + 两个字；点它 = 开始新一局
function seal(cx, cy, n, label, rot) {
  const half = n / 2;
  const inner = n - Math.max(10, n * 0.09);
  const chars = Array.from(label);
  const fs = n * (chars.length <= 2 ? 0.30 : 0.24);
  const gap = fs * 1.5;
  const body = chars.map(function (ch, i) {
    const dx = (i - (chars.length - 1) / 2) * gap;
    return T(dx, fs * 0.36, ch, { size: fs, fill: C.RED, anchor: "middle" });
  }).join("");
  const r = rot == null ? -8 : rot;
  return `<g class="cover-seal" data-act="start" style="cursor:pointer" role="button" aria-label="进入游戏">` +
    `<g transform="translate(${cx} ${cy}) rotate(${r})">` +
    `<rect x="${-half}" y="${-half}" width="${n}" height="${n}" fill="none" stroke="${C.RED}" stroke-width="${Math.max(3, n * 0.035)}" opacity="0.92"/>` +
    `<rect x="${-inner / 2}" y="${-inner / 2}" width="${inner}" height="${inner}" fill="none" stroke="${C.RED}" stroke-width="${Math.max(1.4, n * 0.014)}" opacity="0.72"/>` +
    body +
    `</g></g>`;
}

// 三条说明，桌面与手机共用文案
const LINES = [
  "你写一句人话，它被译成一条能执行的条件。",
  "他每晚只走一条缝；AI 替他挑，判定归引擎。",
  "第七夜之后，是一张判决书。",
];

export function renderIntro() {
  let s = `<svg class="intro" viewBox="0 0 1600 1000" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;
  s += buildDefs();
  s += buildPaper(1600, 1000);
  // 页眉
  s += T(132, 88, "案  卷", { size: 13, tracking: 2 });
  s += T(214, 88, "No.07 / 19", { size: 13, kai: false, tracking: 2, fill: C.INK2 });
  s += T(132, 112, "内部资料 · 尚未结案", { size: 12, fill: C.MUTED, tracking: 1 });
  s += T(1468, 88, "魔搭创空间 · AI 造游戏", { size: 11, fill: C.MUT2, tracking: 1, anchor: "end" });
  s += H(132, 170, 1468, 170, { opacity: 0.4 });
  // 一条很淡的路径，只在页面下半部绕行，不压标题
  s += trail([[132, 906], [300, 906], [300, 946], [1300, 946], [1300, 906], [1468, 906]], 0.07);
  // 标题区
  s += T(800, 258, "二 〇 二 六 · 冬", { size: 13, fill: C.MUT2, tracking: 6, anchor: "middle" });
  s += T(800, 440, "第 七 夜", { size: 168, tracking: 20, anchor: "middle" });
  s += H(650, 492, 950, 492, { opacity: 0.42, w: 1.2 });
  s += T(800, 566, "七天，最多六条规矩", { size: 38, anchor: "middle", tracking: 4 });
  s += T(800, 620, "关住一个每天夜里都在找漏洞的人", { size: 38, anchor: "middle", tracking: 2 });
  LINES.forEach(function (t, i) {
    s += T(800, 698 + i * 34, t, { size: 16, fill: C.MUTED, anchor: "middle", tracking: 1 });
  });
  // 红章 = 开始
  s += seal(800, 862, 134, "进入");
  s += T(800, 972, "点击红章开始 · 一局约 8 分钟", { size: 12, fill: C.MUT2, anchor: "middle", tracking: 2 });
  return s + "</svg>";
}

export function renderIntroMobile() {
  let s = `<svg class="intro" viewBox="0 0 800 1840" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`;
  s += buildDefs();
  s += buildPaper(800, 1840);
  s += T(36, 66, "案  卷", { size: 21, tracking: 3 });
  s += T(132, 66, "No.07 / 19", { size: 21, kai: false, tracking: 2, fill: C.INK2 });
  s += T(36, 100, "内部资料 · 尚未结案", { size: 17, fill: C.MUTED, tracking: 1 });
  s += H(36, 132, 764, 132, { opacity: 0.4 });
  // 空白处留一条淡路径，第 1030–1180 一带
  s += trail([[70, 1180], [250, 1180], [250, 1060], [520, 1060], [520, 980], [740, 980]], 0.07);
  s += T(400, 250, "二 〇 二 六 · 冬", { size: 17, fill: C.MUT2, tracking: 6, anchor: "middle" });
  s += T(400, 410, "第 七 夜", { size: 138, tracking: 8, anchor: "middle" });
  s += H(270, 456, 530, 456, { opacity: 0.42, w: 1.2 });
  s += T(400, 534, "七天，最多六条规矩", { size: 34, anchor: "middle", tracking: 3 });
  s += T(400, 584, "关住一个每天夜里都在找漏洞的人", { size: 30, anchor: "middle", tracking: 1 });
  LINES.forEach(function (t, i) {
    s += T(400, 674 + i * 46, t, { size: 21, fill: C.MUTED, anchor: "middle" });
  });
  s += seal(400, 1372, 248, "进入");
  s += T(400, 1572, "点击红章开始", { size: 22, fill: C.MUT2, anchor: "middle", tracking: 3 });
  s += T(400, 1618, "一局约 8 分钟 · 建议竖屏", { size: 17, fill: C.MUT2, anchor: "middle", tracking: 2 });
  s += T(400, 1778, "魔搭创空间 · AI 造游戏", { size: 16, fill: C.MUT2, anchor: "middle", tracking: 2 });
  return s + "</svg>";
}
