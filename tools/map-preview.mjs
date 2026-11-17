// tools/map-preview.mjs — 开发期预览脚本：把 ui/map.js 的 buildMap() 栅格化成 PNG。
//
// 只服务于人工目检，不进入游戏运行时：
//   node tools/map-preview.mjs
// 产出 tools/map-preview.png（正常预览）与 tools/map-preview-paths.png（叠 MAP_PATHS 的检查图）。
//
// ui/map.js 本身不依赖 @resvg/resvg-js —— 这个包只在本脚本里用。

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { MAP_W, MAP_H, MAP_PATHS, buildMap } from '../ui/map.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCALE = 2;          // 输出 2 倍图，方便看清 0.6 的细线
const BG = '#efe6d2';     // 纸面底色，接近 app 实际背景

// 统一套一层 <svg> 外壳：地图片段本身不含 viewBox 与底色
function toSvg(extra = '') {
  // 宽高写 1:1，倍率交给 fitTo:zoom，避免外面再乘一次 SCALE 变成 4 倍图
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + MAP_W + '" height="' + MAP_H +
    '" viewBox="0 0 ' + MAP_W + ' ' + MAP_H + '">' +
    '<rect x="0" y="0" width="' + MAP_W + '" height="' + MAP_H + '" fill="' + BG + '"/>' +
    buildMap() + extra + '</svg>';
}

function writePng(file, extra) {
  const resvg = new Resvg(toSvg(extra), {
    fitTo: { mode: 'zoom', value: SCALE },
    font: { loadSystemFonts: true, defaultFontFamily: 'SimSun' },
  });
  const png = resvg.render().asPng();
  writeFileSync(resolve(HERE, file), png);
  console.log(file.padEnd(26), png.length, 'bytes');
}

// 路径检查图：红色虚线画出 MAP_PATHS，红点是起点、蓝点是终点，路线编号标在起终点中点
function pathOverlay() {
  let s = '<g id="debug-paths" pointer-events="none">';
  for (const [id, pts] of Object.entries(MAP_PATHS)) {
    const d = pts.map(([x, y], i) => (i ? 'L ' : 'M ') + x + ' ' + y).join(' ');
    s += '<path d="' + d + '" fill="none" stroke="#b8362a" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.85"/>';
    const [sx, sy] = pts[0];
    const [ex, ey] = pts[pts.length - 1];
    s += '<circle cx="' + sx + '" cy="' + sy + '" r="3" fill="#b8362a"/>';
    s += '<circle cx="' + ex + '" cy="' + ey + '" r="3" fill="#2a4a8a"/>';
    s += '<text x="' + ((sx + ex) / 2) + '" y="' + ((sy + ey) / 2) +
      '" font-size="9" font-family="SimSun" fill="#2a4a8a">' + id + '</text>';
  }
  return s + '</g>';
}

writePng('map-preview.png');
writePng('map-preview-paths.png', pathOverlay());
