// audio.js — 音频层：两条 BGM 交叉淡入 + 事件音效。首次用户操作后才启动（浏览器自动播放限制）。
// 文件放创空间根目录，由 FastAPI 的 /static 提供；本地 server.mjs 也把 /static 映射到项目根。
const BASE = '/static/';
const FILES = {
  day: 'audio-day.mp3', night: 'audio-night.mp3',
  stamp: 'sfx-stamp.mp3', paper: 'sfx-paper.mp3', pen: 'sfx-pen.mp3',
  lights: 'sfx-lights.mp3', steps: 'sfx-steps.mp3', verdict: 'sfx-verdict.mp3',
};
const VOL = { day: 0.16, night: 0.20, stamp: 0.55, paper: 0.45, pen: 0.35, lights: 0.5, steps: 0.45, verdict: 0.65 };
let muted = false;
try { muted = localStorage.getItem('cage-muted') === '1'; } catch (err) {}
const bg = { day: null, night: null, mode: 'day', started: false, fade: null };

function el(key) {
  const a = new Audio(BASE + FILES[key]);
  a.loop = true;
  a.preload = 'auto';
  a.volume = 0;
  return a;
}
// 白天 BGM 在开局就用，夜里那条 433 KB 等第一次切夜里再加载，别和首屏抢带宽。
function nightEl() {
  if (!bg.night) bg.night = el('night');
  return bg.night;
}
function ensure() {
  if (!bg.day) bg.day = el('day');
}
function now() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
function fade() {
  if (bg.fade) { clearInterval(bg.fade); bg.fade = null; }
  if (!bg.day || muted) return;
  if (bg.mode === 'night') nightEl();
  const t0 = now();
  const from = { day: bg.day.volume, night: bg.night ? bg.night.volume : 0 };
  const to = { day: bg.mode === 'day' ? VOL.day : 0, night: bg.mode === 'night' ? VOL.night : 0 };
  bg.fade = setInterval(function () {
    const k = Math.min(1, (now() - t0) / 900);
    bg.day.volume = from.day + (to.day - from.day) * k;
    if (bg.night) bg.night.volume = from.night + (to.night - from.night) * k;
    if (k >= 1) { clearInterval(bg.fade); bg.fade = null; }
  }, 40);
}
function playBg() {
  ensure();
  [bg.day, bg.night].forEach(function (a) {
    if (!a) return;
    const p = a.play();
    if (p && p.catch) p.catch(function () {});
  });
  bg.started = true;
  fade();
}
function pauseBg() {
  if (bg.fade) { clearInterval(bg.fade); bg.fade = null; }
  [bg.day, bg.night].forEach(function (a) { if (a) a.pause(); });
}
function paintBtn() {
  const b = document.getElementById('mute-btn');
  if (!b) return;
  b.textContent = muted ? '静' : '音';
  b.className = muted ? 'muted' : '';
  b.setAttribute('aria-label', muted ? '开启声音' : '关闭声音');
  b.title = muted ? '开启声音' : '关闭声音';
}
function mountBtn() {
  if (document.getElementById('mute-btn')) { paintBtn(); return; }
  const b = document.createElement('button');
  b.id = 'mute-btn';
  b.type = 'button';
  b.addEventListener('click', function (ev) { ev.stopPropagation(); audio.toggle(); });
  (document.getElementById('stage') || document.body).appendChild(b);
  paintBtn();
}
export const audio = {
  get muted() { return muted; },
  init() { ensure(); if (!muted) playBg(); },
  setMode(mode) { bg.mode = mode === 'night' ? 'night' : 'day'; ensure(); if (bg.started) fade(); },
  sfx(name) {
    if (muted || !FILES[name]) return;
    try {
      const a = new Audio(BASE + FILES[name]);
      a.volume = VOL[name] || 0.5;
      const p = a.play();
      if (p && p.catch) p.catch(function () {});
    } catch (err) {}
  },
  toggle() {
    muted = !muted;
    try { localStorage.setItem('cage-muted', muted ? '1' : '0'); } catch (err) {}
    if (muted) pauseBg(); else playBg();
    paintBtn();
  },
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBtn);
else mountBtn();
