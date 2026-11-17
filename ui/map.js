// ui/map.js — 《第七夜》监狱平面图（纯 SVG 字符串，无 DOM、无依赖）
//
// 坐标系与 render.py 的 map 段完全一致：单位沿用概念稿数值，1:1 直接抄，
// 地图纸张区域是 x 16..764 / y 16..508，所以 viewBox 用 "0 0 764 520"。
// （SPEC-MAP 里写的 MAP_W=558 是概念稿的缩放比 MS = 558/520，不是地图宽度；
//   按 render.py 的实际坐标，地图横向到 764，故 MAP_W=764。）
//
// 对外只暴露：
//   MAP_W / MAP_H   地图 viewBox 尺寸
//   ROOM_RECTS      十个房间的 [x, y, w, h]
//   MAP_PATHS       夜间越狱路线折线（viewBox 坐标，依次经过门）
//   buildMap()      返回 '<g id="map-room">…</g>' 字符串
//
// 图层顺序（自下而上）：纸张 → 房间 → 网格 → 地砖 / 场地铺装 → 墙 → 门 →
// 家具 → 比例尺 / 闸门 → 人物档案卡 → 房间名 → 夜间路径空层。

export const MAP_W = 764;
export const MAP_H = 520;

export const ROOM_RECTS = {
  cell1:    [16, 16, 234, 124],
  cell2:    [16, 140, 234, 124],
  cell3:    [16, 264, 234, 124],
  storage:  [16, 388, 234, 120],
  corridor: [250, 16, 220, 492],
  workshop: [470, 16, 294, 96],
  medical:  [470, 112, 294, 96],
  dining:   [470, 208, 294, 96],
  laundry:  [470, 304, 294, 96],
  yard:     [470, 400, 294, 108],
};

// 夜间路径：每条越狱路线一条折线，依次穿过门与目标房间。
// 主线四条 + 即兴路线（引擎 IMPROV）若干；app.js 按剧情往 #nightpath 里画红色虚线。
// 说明：render.py 并没有画“医务室的窗”和“食堂的后门”，
// 这两条路线的终点落在对应房间的外墙上（x≈764），动画按“翻出去”处理。
export const MAP_PATHS = {
  // 主线：医务室的窗 —— 工具间取铁条、医务室撬窗、翻窗
  window: [[133, 326], [250, 345], [330, 345], [330, 49], [470, 49], [530, 54],
           [470, 49], [430, 100], [430, 145], [470, 145], [560, 158], [680, 158], [763, 158]],
  // 主线：放风区的墙 —— 洗衣房取床单、把床单甩上放风区外墙
  wall:   [[133, 326], [250, 345], [330, 345], [330, 337], [470, 337], [540, 340],
           [470, 337], [430, 380], [470, 437], [560, 450], [660, 452], [756, 452], [764, 452]],
  // 主线：走廊的通风口 —— 储藏室取麻绳、走廊尽头卸通风口
  vent:   [[133, 326], [250, 345], [300, 345], [360, 420], [360, 504], [360, 514]],
  // 主线：狱警的钥匙 —— 食堂取刀、在走廊堵住巡夜狱警
  guard:  [[133, 326], [250, 345], [330, 345], [330, 241], [470, 241], [560, 240],
           [470, 241], [370, 300], [405, 394]],
  // 即兴：食堂的后门 —— 取铁条、撬后门、溜进放风区
  door:   [[133, 326], [250, 345], [330, 345], [330, 241], [470, 241], [560, 246],
           [700, 244], [764, 244]],
  // 即兴：床单做的绳 —— 洗衣房接床单、从医务室的窗放绳
  rope:   [[133, 326], [250, 345], [330, 345], [330, 337], [470, 337], [530, 340],
           [470, 337], [430, 300], [430, 145], [470, 145], [560, 158], [680, 158], [763, 158]],
  // 即兴：配一把钥匙 —— 工具间取铁条、趁狱警打盹拓齿形、开闸门
  copy:   [[133, 326], [250, 345], [330, 345], [330, 49], [470, 49], [530, 54],
           [470, 49], [430, 120], [430, 380], [405, 394], [430, 437], [470, 437],
           [540, 450], [601, 492], [601, 512]],
  // 即兴：放风区起哄 —— 煽动、趁乱、冲闸门
  riot:   [[133, 326], [250, 345], [330, 345], [340, 420], [400, 440], [470, 437],
           [540, 450], [601, 492], [601, 512]],
  // 即兴：装病 —— 骗开药柜、从医务室的窗爬出去
  sick:   [[133, 326], [250, 345], [330, 345], [330, 145], [470, 145], [600, 150],
           [700, 150], [720, 158], [763, 158]],
};

// ---------------------------------------------------------------------------
// 调色板（取自 render.py：INK=(34,29,25)、PAPER=(231,219,193)，其余为混合色）
// ---------------------------------------------------------------------------
const INK    = '#221d19';
const INK2   = '#403729';
const MUTED  = '#7e6f5c';
const RED    = '#882e1f';
const PAPER  = '#e7dbc1';

const MAPPAPER = '#ede3cd';  // 地图纸底
const CELL  = '#efe5cf';     // 牢房
const HALL  = '#e9dec7';     // 走廊
const WK    = '#eee3cb';     // 工具间
const MED   = '#f1e6d1';     // 医务室
const DINE  = '#ede3cb';     // 食堂
const LAUN  = '#e8dec8';     // 洗衣房
const YARD  = '#e7dbc4';     // 放风区
const STORE = '#ece1ca';     // 储藏室

const FU   = '#797163';      // mix(INK, PAPER, 0.44)  家具主线
const FU2  = '#aca28f';      // mix(INK, PAPER, 0.70)  家具次线
const FU3  = '#cfc4ad';      // mix(INK, PAPER, 0.88)  家具浅线
const WALLC = '#9e9583';     // mix(INK, PAPER, 0.63)  墙体填充
const WALLB = '#514b41';     // mix(INK, PAPER, 0.24)  墙体细边
const SURF  = '#e0d4bb';     // mix(PAPER, INK, 0.035) 家具台面
const BED   = '#e1d5bc';     // mix(PAPER, INK, 0.03)  床垫
const BLANKET  = '#d6cbb3';  // mix(PAPER, INK, 0.085) 被子
const BLANKET2 = '#e3d7be';  // mix(PAPER, INK, 0.02)  被子翻边
const CRUMPLE  = '#dbd0b7';  // mix(PAPER, INK, 0.06)  皱床单
const HATCH  = '#cbc0ac';    // mix(YARD, INK, 0.14)   放风区斜线
const GRID   = '#e2d8c3';    // mix(MAPPAPER, INK, 0.055) 方格纸
const SCALEC = '#7b7265';    // mix(INK, PAPER, 0.45)  比例尺

const CARD      = '#faf3e3'; // 档案卡相纸
const CARD_LINE = '#423b34'; // mix(INK, PAPER, 0.16)
const CARD_IN   = '#cfc8bb'; // mix(CARD, INK, 0.20)
const HAIR      = '#81786a'; // mix(INK, PAPER, 0.48)
const STUBBLE   = '#8e8675'; // mix(INK, PAPER, 0.55)
const STEEL     = '#303a46'; // 狱警小字

// 房间名颜色（SPEC 指定 #6b5a44）
const LABEL = '#6b5a44';

// 房间名的纸色描边（挖版光晕）：比房间底色略深一点，盖住家具线也不显脏
const HALO = '#e8dcc0';

// ---------------------------------------------------------------------------
// 基础工具：全部返回 SVG 片段字符串；数值统一保留两位小数，避免浮点尾巴
// ---------------------------------------------------------------------------
const num = (v) => String(Math.round(v * 100) / 100);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const line = (x1, y1, x2, y2, stroke = FU, sw = 1) =>
  '<line x1="' + num(x1) + '" y1="' + num(y1) + '" x2="' + num(x2) + '" y2="' + num(y2) +
  '" stroke="' + stroke + '" stroke-width="' + num(sw) + '" stroke-linecap="round"/>';

const rect = (x, y, w, h, o = {}) => {
  const { fill = 'none', stroke = FU, sw = 1, r = 0 } = o;
  return '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '"' +
    (r ? ' rx="' + num(r) + '"' : '') +
    ' fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + num(sw) + '"/>';
};

const ell = (x, y, w, h, o = {}) => {
  const { fill = 'none', stroke = FU, sw = 1 } = o;
  return '<ellipse cx="' + num(x + w / 2) + '" cy="' + num(y + h / 2) + '" rx="' + num(w / 2) +
    '" ry="' + num(h / 2) + '" fill="' + fill + '" stroke="' + stroke +
    '" stroke-width="' + num(sw) + '"/>';
};

const poly = (pts, o = {}) => {
  const { fill = 'none', stroke = FU, sw = 1 } = o;
  const p = pts.map(([x, y]) => num(x) + ',' + num(y)).join(' ');
  return '<polygon points="' + p + '" fill="' + fill + '" stroke="' + stroke +
    '" stroke-width="' + num(sw) + '" stroke-linejoin="round"/>';
};

const path = (d, o = {}) => {
  const { fill = 'none', stroke = FU, sw = 1 } = o;
  return '<path d="' + d + '" fill="' + fill + '" stroke="' + stroke +
    '" stroke-width="' + num(sw) + '" stroke-linecap="round" stroke-linejoin="round"/>';
};

// 文字：x / y 默认沿用 Pillow 的“左上角”口径，内部换算成 SVG 的基线坐标；
// baseline:true 时 y 直接当基线用（房间名按基线定位）。
// halo 用 paint-order="stroke" 在字形外圈画一道纸色描边，文字不会被家具、
// 网格或放风区斜线盖住；paint-order 浏览器与 resvg 都支持。
const text = (x, y, str, o = {}) => {
  const { size = 11, color = LABEL, anchor = 'start', tracking = 0,
    halo = null, family = 'KaiTi, SimSun', baseline = false } = o;
  const by = baseline ? y : y + size * 0.82;
  const ring = halo
    ? ' stroke="' + halo + '" stroke-width="4" stroke-linejoin="round" paint-order="stroke"'
    : '';
  return '<text x="' + num(x) + '" y="' + num(by) + '" font-family="' + family +
    '" font-size="' + num(size) + '" fill="' + color + '" text-anchor="' + anchor + '"' +
    ring + (tracking ? ' letter-spacing="' + num(tracking) + '"' : '') + '>' + esc(str) + '</text>';
};

// 线段裁剪（Liang–Barsky）：放风区斜线要用它裁到场地矩形内，避免画到走廊上。
const clipSeg = (x1, y1, x2, y2, xmin, ymin, xmax, ymax) => {
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) continue;
    const r = q[i] / p[i];
    if (p[i] < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return [x1 + dx * t0, y1 + dy * t0, x1 + dx * t1, y1 + dy * t1];
};

// ---------------------------------------------------------------------------
// 复用的家具画法（与 render.py 一一对应）
// ---------------------------------------------------------------------------
const bed = (x, y, w, h, bare = false) => {
  const s = [rect(x, y, w, h, { fill: BED, stroke: FU, sw: 1.1 })];
  s.push(line(x + 1.8, y + 1, x + 1.8, y + h - 1, FU, 2.4));             // 床头板
  s.push(rect(x + 7, y + 8, 24, h - 16, { r: 4, fill: BLANKET2, stroke: FU2, sw: 0.9 })); // 枕头
  if (bare) {
    for (let i = 0; i < 9; i++) s.push(line(x + 36 + i * 11, y + 4, x + 30 + i * 11, y + h - 4, FU3, 0.7));
    s.push(line(x + w - 3.5, y + 2, x + w - 3.5, y + h - 2, FU2, 0.8));  // 掀掉被子的床沿
  } else {
    const bx0 = x + 38, be = x + w - 3;
    s.push(poly([[bx0, y + 3], [be, y + 3], [be, y + h - 3], [bx0, y + h - 3]], { fill: BLANKET }));
    s.push(line(bx0, y + 3, bx0, y + h - 3, FU2, 0.9));
    s.push(poly([[bx0, y + 3], [bx0 + 13, y + 3], [bx0 + 18, y + h - 3], [bx0 + 5, y + h - 3]], { fill: BLANKET2 }));
    s.push(line(bx0 + 13, y + 3, bx0 + 18, y + h - 3, FU3, 0.7));
    for (const cx of [bx0 + 34, bx0 + 58, bx0 + 82]) s.push(line(cx, y + 5, cx + 6, y + h - 5, FU3, 0.65));
    s.push(line(be, y + 3, be, y + h - 3, FU2, 0.8));
  }
  return s.join('');
};

const table = (x, y, w, h) =>
  rect(x, y, w, h, { fill: SURF, stroke: FU, sw: 1.1 }) +
  rect(x + 2, y + 2, w - 4, h - 4, { stroke: FU3, sw: 0.6 });

const chair = (cx, cy, r = 8, back = 'top') => {
  let s = rect(cx - r, cy - r, r * 2, r * 2, { r: 3, fill: SURF, stroke: FU2, sw: 0.9 });
  if (back === 'top') s += line(cx - r + 1, cy - r, cx + r - 1, cy - r, FU, 1.6);
  if (back === 'left') s += line(cx - r, cy - r + 1, cx - r, cy + r - 1, FU, 1.6);
  return s;
};

const shelf = (x, y, w, h, n = 3) => {
  let s = rect(x, y, w, h, { fill: SURF, stroke: FU, sw: 1.1 });
  for (let i = 1; i < n; i++) s += line(x + 1, y + h * i / n, x + w - 1, y + h * i / n, FU3, 0.8);
  return s;
};

const boxes = (x, y, items) => items.map(([bx, by, bw, bh]) =>
  rect(x + bx, y + by, bw, bh, { fill: SURF, stroke: FU2, sw: 0.9 })).join('');

const barrel = (cx, cy, r = 12) =>
  ell(cx - r, cy - r, r * 2, r * 2, { fill: SURF, stroke: FU }) +
  ell(cx - r * 0.55, cy - r * 0.55, r * 1.1, r * 1.1, { stroke: FU3 });

// 一桌两凳的餐位（食堂）；bottom=false 时只画过道侧的凳子——靠墙那侧再摆凳
// 就会把凳子画进隔壁洗衣房，靠墙一侧留空更合理。
const tableSet = (y, bottom = true) => {
  let s = rect(486, y, 150, 22, { fill: SURF, stroke: FU, sw: 1.1 });
  s += line(486, y + 4, 636, y + 4, FU3, 0.7);
  s += rect(490, y - 9, 142, 6, { fill: SURF, stroke: FU2, sw: 0.8 });
  if (bottom) s += rect(490, y + 25, 142, 6, { fill: SURF, stroke: FU2, sw: 0.8 });
  for (let i = 0; i < 4; i++) s += ell(494 + i * 36, y + 6, 11, 11, { stroke: FU3 });
  return s;
};

// 滚筒洗衣机
const washer = (x, y, s = 42) =>
  rect(x, y, s, s, { fill: SURF, stroke: FU, sw: 1.1 }) +
  ell(x + s * 0.18, y + s * 0.22, s * 0.62, s * 0.62, { stroke: FU2 }) +
  ell(x + s * 0.40, y + s * 0.44, s * 0.18, s * 0.18, { stroke: FU3 }) +
  ell(x + s - 13, y + 6, 7, 7, { stroke: FU3 });

// ---------------------------------------------------------------------------
// 各图层
// ---------------------------------------------------------------------------
const paperLayer = () =>
  '<!-- 纸张 -->' + rect(16, 16, 748, 492, { fill: MAPPAPER, stroke: 'none' });

const roomLayer = () => '<!-- 房间底色 -->' + Object.entries(ROOM_RECTS)
  .map(([id, [x, y, w, h]]) => {
    const fill = {
      cell1: CELL, cell2: CELL, cell3: CELL, storage: STORE, corridor: HALL,
      workshop: WK, medical: MED, dining: DINE, laundry: LAUN, yard: YARD,
    }[id];
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>';
  }).join('');

const gridLayer = () => {
  const out = ['<!-- 方格纸 -->'];
  for (let gx = 16; gx < 765; gx += 26) out.push(line(gx, 16, gx, 508, GRID, 0.7));
  for (let gy = 16; gy < 509; gy += 26) out.push(line(16, gy, 764, gy, GRID, 0.7));
  return out.join('');
};

// 地砖：走廊 34 格、食堂 26、洗衣房 23、医务室 30；工具间只画横向条纹
const tiles = (x0, y0, x1, y1, step) => {
  const out = [];
  for (let gx = x0; gx < x1; gx += step) out.push(line(gx, y0, gx, y1, FU3, 0.7));
  for (let gy = y0; gy < y1; gy += step) out.push(line(x0, gy, x1, gy, FU3, 0.7));
  return out.join('');
};

const floorLayer = () => {
  let s = '<!-- 地砖 / 场地铺装 -->';
  s += tiles(253, 19, 467, 505, 34);   // 走廊
  s += tiles(473, 211, 761, 301, 26);  // 食堂
  s += tiles(473, 307, 761, 397, 23);  // 洗衣房
  s += tiles(473, 115, 761, 205, 30);  // 医务室
  for (let gy = 19; gy < 109; gy += 15) s += line(473, gy, 761, gy, FU3, 0.6); // 工具间
  return s;
};

// 放风区：45° 斜线铺地，裁剪在场地内框里（render.py 用遮罩，这里用线段裁剪）
const yardHatchLayer = () => {
  let s = '<!-- 放风区斜线 -->';
  for (let k = -90; k < 90; k++) {
    const x0 = 330 + k * 19;
    const seg = clipSeg(x0, 398, x0 + 150, 520, 474.5, 404.5, 759.5, 503.5);
    if (seg) s += line(seg[0], seg[1], seg[2], seg[3], HATCH, 0.7);
  }
  return s;
};

const wallV = (x, y1, y2) => rect(x - 4, y1, 8, y2 - y1, { fill: WALLC, stroke: WALLB, sw: 0.7 });
const wallH = (y, x1, x2) => rect(x1, y - 4, x2 - x1, 8, { fill: WALLC, stroke: WALLB, sw: 0.7 });

const wallLayer = () => {
  let s = '<!-- 墙 -->';
  s += wallV(250, 16, 508);
  s += wallV(470, 16, 508);
  for (const y of [140, 264, 388]) s += wallH(y, 16, 250);
  for (const y of [112, 208, 304, 400]) s += wallH(y, 470, 764);
  // 外墙：厚 9 的墙体 + 内外两道细边（render.py 的外框描边）
  s += rect(20.5, 20.5, 739, 483, { fill: 'none', stroke: WALLC, sw: 9 });
  s += rect(16.4, 16.4, 747.2, 491.2, { stroke: WALLB, sw: 0.8 });
  s += rect(25, 25, 730, 474, { stroke: WALLB, sw: 0.8 });
  return s;
};

// 竖墙上的门：门洞补地面色 + 门扇 + 90° 开启弧线
const doorV = (x, y0, side, floor) => {
  const w = 26;
  const arc = side > 0
    ? 'M ' + num(x + w) + ' ' + num(y0) + ' A ' + w + ' ' + w + ' 0 0 1 ' + num(x) + ' ' + num(y0 + w)
    : 'M ' + num(x) + ' ' + num(y0 + w) + ' A ' + w + ' ' + w + ' 0 0 1 ' + num(x - w) + ' ' + num(y0);
  return rect(x - 4.6, y0, 9.2, w, { fill: floor, stroke: 'none' }) +
    line(x, y0, x + side * w, y0, FU, 1.1) +
    path(arc, { stroke: FU2, sw: 0.9 });
};

const doorLayer = () => {
  let s = '<!-- 门 -->';
  for (const y0 of [88, 206, 332, 444]) s += doorV(250, y0, +1, HALL);          // 牢房 / 储藏室 → 走廊
  const rightFloors = { 36: WK, 132: MED, 228: DINE, 324: LAUN, 424: YARD };
  for (const y0 of [36, 132, 228, 324, 424]) s += doorV(470, y0, -1, rightFloors[y0]); // 走廊 → 右列房间
  return s;
};

// ---------------------------------------------------------------------------
// 家具：编号顺序与 render.py 完全对应，坐标一律用原稿数字
// ---------------------------------------------------------------------------
const furnitureLayer = () => {
  const s = ['<!-- 家具 -->'];
  const g = (str) => s.push(str);

  // --- 一号牢房 ---
  g('<!-- 一号牢房 -->');
  g(bed(30, 50, 132, 52));
  g(ell(196, 42, 26, 32, { fill: SURF, stroke: FU }));                       // 马桶
  g(rect(196, 34, 26, 9, { r: 2, fill: SURF, stroke: FU2, sw: 0.9 }));       // 水箱
  g(ell(198, 90, 22, 16, { fill: SURF, stroke: FU2 }));                      // 洗手盆
  g(line(219, 96, 228, 96, FU2, 1.2));                                       // 水龙头
  g(ell(176, 116, 18, 18, { fill: SURF, stroke: FU2 }));                     // 凳子

  // --- 二号牢房 ---
  g('<!-- 二号牢房 -->');
  g(bed(30, 172, 132, 52));
  g(table(188, 166, 56, 42));
  g(chair(216, 220, 9));
  g(ell(200, 174, 9, 9, { stroke: FU3 }));                                   // 杯底
  g(rect(214, 172, 14, 14, { fill: SURF, stroke: FU3, sw: 0.7 }));           // 方盒
  g(line(198, 200, 236, 200, FU3, 0.8));                                     // 桌面刻线
  g(shelf(188, 236, 56, 14, 2));
  g(boxes(188, 236, [[3, 3, 11, 8], [19, 3, 13, 8], [37, 3, 15, 8]]));

  // --- 三号牢房 ---
  g('<!-- 三号牢房 -->');
  g(bed(30, 296, 132, 52, true));                                            // 掀了被子的床
  g(poly([[168, 330], [184, 324], [196, 332], [192, 344], [200, 350], [188, 356], [172, 352], [162, 342]],
    { fill: CRUMPLE, stroke: FU2, sw: 0.8 }));                               // 揉皱的床单
  g(line(170, 336, 186, 336, FU3, 0.65));
  g(line(174, 344, 192, 340, FU3, 0.65));
  g(line(180, 350, 196, 346, FU3, 0.65));
  g(poly([[196, 332], [214, 326], [222, 332], [210, 338]], { fill: '#dcd1b8', stroke: FU3, sw: 0.6 }));
  g(ell(196, 290, 18, 18, { fill: SURF, stroke: FU2 }));                     // 小凳
  g(line(205, 299, 222, 314, FU3, 1.0));                                     // 凳子后的划痕
  g(line(120, 368, 142, 382, FU3, 0.9));
  g(line(130, 364, 152, 378, FU3, 0.9));

  // --- 储藏室 ---
  g('<!-- 储藏室 -->');
  g(shelf(30, 420, 110, 28, 2));
  g(boxes(30, 422, [[4, 4, 16, 9], [24, 4, 12, 9], [40, 4, 20, 9], [66, 4, 14, 9], [86, 4, 16, 9]]));
  g(shelf(30, 454, 110, 26, 2));
  g(boxes(30, 456, [[5, 4, 14, 8], [23, 4, 18, 8], [45, 4, 12, 8], [61, 4, 22, 8], [87, 4, 14, 8]]));
  g(rect(154, 416, 84, 52, { fill: SURF, stroke: FU, sw: 1.1 }));            // 板条箱
  g(line(154, 416, 206, 468, FU2, 0.9));                                     // 风车状捆带
  g(line(206, 416, 154, 468, FU2, 0.9));
  g(rect(154, 474, 38, 28, { fill: SURF, stroke: FU2, sw: 0.9 }));           // 小木箱
  g(barrel(222, 470, 13));                                                   // 油桶
  g(barrel(222, 446, 10));
  g(line(80, 478, 104, 502, FU2, 1.2));                                      // 扫帚柄（左移 16，避开比例尺的 0/10 数字）
  g(poly([[72, 470], [88, 478], [80, 490], [64, 482]], { fill: SURF, stroke: FU2, sw: 0.8 })); // 扫帚头

  // --- 工具间 ---
  g('<!-- 工具间 -->');
  // 工作台整组下移 8，给左上角的“工具间”房间名让出位置
  g(rect(482, 46, 208, 32, { fill: SURF, stroke: FU, sw: 1.1 }));            // 工作台
  g(rect(486, 50, 200, 24, { stroke: FU3, sw: 0.6 }));
  g(line(496, 62, 516, 62, FU2, 1.3));                                       // 锤柄
  g(rect(514, 57, 8, 10, { fill: SURF, stroke: FU2, sw: 0.8 }));             // 锤头
  g(line(532, 54, 538, 70, FU2, 1.1));                                       // 扳手 / 螺丝刀
  g(line(548, 54, 554, 70, FU2, 1.1));
  g(line(566, 58, 572, 68, FU2, 1.1));
  g(rect(584, 52, 42, 20, { fill: SURF, stroke: FU2, sw: 0.9 }));            // 台钳
  g(line(605, 52, 605, 60, FU2, 1.2));
  g(ell(500, 80, 20, 20, { fill: SURF, stroke: FU }));                       // 砂轮机
  g(ell(505, 85, 10, 10, { stroke: FU3 }));
  g(line(510, 100, 510, 106, FU3, 1.0));
  g(shelf(700, 40, 52, 62, 3));                                              // 层架
  for (const cy of [48, 68, 88]) g(ell(706, cy, 12, 12, { stroke: FU3 }));   // 零件桶
  g(line(636, 44, 650, 44, FU2, 1.0));
  g(line(636, 50, 650, 50, FU3, 0.9));
  g(rect(640, 78, 44, 18, { fill: SURF, stroke: FU2, sw: 0.9 }));            // 零件推车
  g(line(640, 87, 684, 87, FU3, 0.8));
  g(ell(647, 99, 7, 7, { stroke: FU3 }));
  g(ell(673, 99, 7, 7, { stroke: FU3 }));

  // --- 医务室 ---
  g('<!-- 医务室 -->');
  // 病床与输液架整组下移 8，给左上角的“医务室”房间名让出位置
  g(rect(482, 140, 134, 46, { fill: BED, stroke: FU, sw: 1.1 }));            // 病床
  g(line(483.8, 141, 483.8, 185, FU, 2.2));                                  // 床头板
  g(rect(487, 146, 24, 32, { r: 4, fill: BLANKET2, stroke: FU2, sw: 0.9 })); // 枕头
  g(poly([[516, 143], [613, 143], [613, 183], [516, 183]], { fill: BLANKET })); // 被子
  g(line(516, 143, 516, 183, FU2, 0.9));
  g(poly([[516, 143], [529, 143], [534, 183], [521, 183]], { fill: BLANKET2 }));
  g(line(529, 143, 534, 183, FU3, 0.7));
  for (const cx of [540, 564, 588]) g(line(cx, 145, cx + 4, 181, FU3, 0.65));
  g(line(613, 143, 613, 183, FU2, 0.8));
  g(line(624, 132, 624, 194, FU2, 1.3));                                     // 输液架
  g(ell(618, 132, 13, 17, { fill: SURF, stroke: FU2 }));
  g(line(624, 194, 618, 198, FU3, 1.0));
  g(shelf(700, 130, 54, 48, 3));                                             // 抽屉柜
  g(ell(706, 134, 12, 9, { stroke: FU3 }));
  g(ell(722, 134, 12, 9, { stroke: FU3 }));
  g(ell(738, 134, 12, 9, { stroke: FU3 }));
  g(table(482, 187, 58, 16));                                               // 小桌收进房间，不再压墙线
  g(chair(554, 195, 8));                                                     // 小凳挪到桌右首（还在医务室内），让开“食堂”房间名
  g(line(660, 190, 678, 190, RED, 1.7));                                     // 地上红十字
  g(line(669, 181, 669, 199, RED, 1.7));

  // --- 食堂 ---
  g('<!-- 食堂 -->');
  // 两套桌凳整体下移 4~10，给左上角的“食堂”房间名让出位置；两套中间的长凳恰好共线。
  // 第二套靠墙一侧不摆凳（再摆会越过墙线画进洗衣房）。
  g(tableSet(240));
  g(tableSet(280, false));
  g(rect(662, 226, 94, 26, { fill: SURF, stroke: FU, sw: 1.1 }));            // 打饭窗口
  g(ell(674, 230, 18, 18, { fill: SURF, stroke: FU2 }));                     // 汤锅
  g(ell(700, 232, 13, 13, { stroke: FU3 }));
  g(ell(724, 286, 16, 16, { fill: SURF, stroke: FU2 }));                     // 泔水桶
  g(line(728, 290, 736, 298, FU3, 0.9));

  // --- 洗衣房 ---
  g('<!-- 洗衣房 -->');
  // 三台滚筒机统一下移 10，给左上角的“洗衣房”房间名让出位置
  g(washer(482, 336));
  g(washer(532, 336));
  g(washer(582, 336));
  g(poly([[700, 336], [752, 336], [746, 386], [706, 386]], { fill: SURF, stroke: FU2, sw: 1.0 })); // 脏衣筐
  g(line(704, 344, 748, 344, FU3, 0.8));
  g(line(703, 352, 749, 352, FU3, 0.8));
  g(line(478, 392, 758, 392, FU2, 1.3));                                     // 蒸汽管
  g(line(478, 397, 758, 397, FU3, 0.9));
  for (const jx of [500, 560, 620, 680, 740]) g(line(jx, 386, jx, 398, FU2, 0.9));

  // --- 放风区 ---
  g('<!-- 放风区 -->');
  g(ell(516, 436, 7, 7, { stroke: FU }));                                    // 单杠
  g(ell(596, 436, 7, 7, { stroke: FU }));
  g(line(516, 436, 596, 436, FU, 1.4));
  g(line(516, 436, 516, 448, FU3, 0.9));
  g(line(596, 436, 596, 448, FU3, 0.9));
  g(ell(656, 466, 12, 12, { stroke: FU2 }));                                 // 篮球
  g(ell(560, 450, 64, 50, { stroke: FU3, sw: 0.9 }));                        // 粉笔圈
  g(rect(716, 478, 36, 14, { fill: SURF, stroke: FU2, sw: 0.8 }));           // 长椅
  for (let gy = 482; gy < 491; gy += 3) g(line(718, gy, 750, gy, FU3, 0.7));

  // --- 走廊杂物 ---
  g('<!-- 走廊杂物 -->');
  g(rect(258, 398, 64, 14, { fill: SURF, stroke: FU2, sw: 0.9 }));           // 长椅
  g(ell(430, 462, 20, 20, { fill: SURF, stroke: FU2 }));                     // 拖把桶
  g(line(430, 472, 414, 486, FU3, 1.1));                                     // 拖把杆
  g(ell(350, 300, 14, 14, { stroke: FU3 }));                                 // 地漏
  g(line(347, 307, 353, 307, FU3, 0.8));
  g(line(350, 304, 350, 310, FU3, 0.8));

  // --- 放风区补充陈设 ---
  g('<!-- 放风区补充陈设 -->');
  g(rect(536, 408, 30, 6, { fill: SURF, stroke: FU2, sw: 0.8 }));            // 台阶
  g(ell(551, 420, 13, 13, { stroke: FU2 }));
  g(line(545, 426, 557, 432, FU3, 0.8));
  g(rect(690, 418, 52, 14, { fill: SURF, stroke: FU2, sw: 0.9 }));           // 长条凳
  g(line(696, 418, 696, 432, FU3, 0.7));
  g(line(736, 418, 736, 432, FU3, 0.7));

  // --- 外墙铁栏窗（三间牢房共用一堵外墙）---
  g('<!-- 外墙铁栏窗 -->');
  for (const wy0 of [58, 182, 306]) {
    const wy1 = wy0 + 38;
    g(rect(16, wy0, 10, wy1 - wy0, { fill: '#e3d7be', stroke: FU2, sw: 0.9 }));
    for (let wy = wy0 + 10; wy < wy1 - 4; wy += 9) g(line(17, wy, 25, wy, FU3, 0.8));
  }
  return s.join('');
};

// ---------------------------------------------------------------------------
// 比例尺 + 闸门
// ---------------------------------------------------------------------------
const scaleLayer = () => {
  let s = '<!-- 比例尺 / 闸门 -->';
  // 储藏室下方的比例尺
  s += line(30, 492, 110, 492, SCALEC, 1.1);
  for (const x of [30, 70, 110]) s += line(x, 488, x, 496, SCALEC, 1);
  s += text(34, 482, '0', { size: 8, color: MUTED, family: 'SimSun' });
  s += text(102, 482, '10', { size: 8, color: MUTED, family: 'SimSun' });
  // 走廊下方的比例尺
  s += line(276, 486, 344, 486, FU2, 1.2);
  for (const x of [276, 310, 344]) s += line(x, 481, x, 491, FU2, 1);
  s += text(278, 470, '0', { size: 8, color: MUTED, family: 'SimSun' });
  s += text(336, 470, '10', { size: 8, color: MUTED, family: 'SimSun' });
  // 闸门（放风区南墙）
  s += rect(556, 499, 90, 11, { fill: MAPPAPER, stroke: INK, sw: 1.2 });
  for (const gx of [569, 582, 595, 608, 621, 634]) s += line(gx, 499, gx, 510, INK, 0.9);
  s += text(601, 464, '闸 门', { size: 9, color: INK2, anchor: 'middle', family: 'SimSun' });
  return s;
};

// ---------------------------------------------------------------------------
// 人物档案卡（app.js 会整体移动这两组，所以坐标写成绝对位置、组上只留 id）
// ---------------------------------------------------------------------------
const portrait = (vcx, vcy, kind) => {
  const w = 50, h = 62;
  const x0 = vcx - w / 2, y0 = vcy - h / 2;
  const hx = vcx, hy = y0 + 23;
  const rx = 10, ry = 11.2;
  const s = [];
  // 相纸阴影
  s.push('<rect x="' + num(x0 + 2) + '" y="' + num(y0 + 2.5) + '" width="' + w + '" height="' + h +
    '" fill="#3c2c1a" fill-opacity="0.2" filter="url(#map-card-shadow)"/>');
  // 卡片 + 双层细边框
  s.push(rect(x0, y0, w, h, { fill: CARD, stroke: CARD_LINE, sw: 1.4 }));
  s.push(rect(x0 + 2.4, y0 + 2.4, w - 4.8, h - 4.8, { stroke: CARD_IN, sw: 0.6 }));
  // 头肩线稿
  const face = (outer, inner) => 'M ' + num(outer[0]) + ' ' + num(outer[1]) + ' A ' + num(rx) + ' ' + num(ry) +
    ' 0 0 ' + inner + ' ' + num(outer[2]) + ' ' + num(outer[3]);
  s.push('<ellipse cx="' + num(hx) + '" cy="' + num(hy) + '" rx="' + rx + '" ry="' + ry +
    '" fill="none" stroke="' + CARD_LINE + '" stroke-width="1.3"/>');
  if (kind === 'prisoner') {
    // 平头：帽盖 + 竖向发茬高光
    s.push(path('M ' + num(hx - rx) + ' ' + num(hy) + ' A ' + rx + ' ' + ry + ' 0 0 1 ' +
      num(hx + rx) + ' ' + num(hy), { fill: HAIR, stroke: 'none' }));
    for (const sxx of [-7, -4.5, -2, 0.5, 3, 5.5, 8]) {
      s.push(line(hx + sxx, hy - ry + 1.5, hx + sxx + 0.8, hy - ry + 8, CARD, 0.55));
    }
  } else {
    // 军帽：帽筒 + 帽檐 + 帽徽
    s.push(rect(hx - rx - 2, hy - ry - 3.2, (rx + 2) * 2, ry * 0.68 + 3.2,
      { fill: FU, stroke: CARD_LINE, sw: 1.0 }));
    s.push(line(hx - rx - 4, hy - ry * 0.32, hx + rx + 4, hy - ry * 0.32, CARD_LINE, 1.6));
    s.push(line(hx - rx - 2, hy - ry - 3.2, hx + rx + 2, hy - ry - 3.2, CARD_LINE, 0.9));
    s.push(ell(hx - 2.2, hy - ry + 1.2, 4.4, 4.4, { stroke: CARD, sw: 0.8 }));
  }
  // 耳朵
  s.push(line(hx - rx - 1.2, hy + 2, hx - rx + 1.2, hy + 4, CARD_LINE, 0.9));
  s.push(line(hx + rx - 1.2, hy + 2, hx + rx + 1.2, hy + 4, CARD_LINE, 0.9));
  if (kind === 'prisoner') {
    for (const sxx of [-4.5, -2.2, 0, 2.2, 4.5]) s.push(line(hx + sxx, hy + 9.2, hx + sxx, hy + 10.6, STUBBLE, 0.5));
  }
  // 眉眼嘴
  s.push(line(hx - 4.6, hy + 1.4, hx - 2.0, hy + 1.4, CARD_LINE, 1.1));
  s.push(line(hx + 2.0, hy + 1.4, hx + 4.6, hy + 1.4, CARD_LINE, 1.1));
  s.push(line(hx - 1.8, hy + 6.2, hx + 1.8, hy + 6.2, CARD_LINE, 0.8));
  // 肩线 + 肩弧
  s.push(line(hx - 3.6, hy + ry * 0.95, hx - 4.6, y0 + h - 14, CARD_LINE, 1.0));
  s.push(line(hx + 3.6, hy + ry * 0.95, hx + 4.6, y0 + h - 14, CARD_LINE, 1.0));
  s.push(path('M ' + num(hx - 19.33) + ' ' + num(y0 + 57 - 7.42) +
    ' A 21 19 0 0 1 ' + num(hx + 19.33) + ' ' + num(y0 + 57 - 7.42),
    { stroke: CARD_LINE, sw: 1.2 }));
  if (kind === 'prisoner') {
    // 囚服 V 领
    s.push(line(hx - 6, y0 + h - 13, hx, y0 + h - 6, CARD_LINE, 0.9));
    s.push(line(hx + 6, y0 + h - 13, hx, y0 + h - 6, CARD_LINE, 0.9));
  }
  return s.join('');
};

const tokenLayer = () => {
  return '<!-- 人物档案卡：囚犯 / 狱警 -->' +
    '<g id="token-prisoner">' + portrait(345, 250, 'prisoner') +
      text(345, 292, '他', { size: 9.5, color: RED, anchor: 'middle', family: 'SimSun' }) + '</g>' +
    '<g id="token-guard">' + portrait(405, 394, 'guard') +
      text(405, 436, '狱警', { size: 9.5, color: STEEL, anchor: 'middle', family: 'SimSun' }) + '</g>';
};

// ---------------------------------------------------------------------------
// 房间名（最后画，带纸张色光晕，保证不被家具/网格盖住）
// ---------------------------------------------------------------------------
// 统一版式：房间名放在房间左上角、水平内缩 12，基线 y = 房顶 + 22，字号 12、
// 字距 3、纸色 4px 挖版描边。名字不在文字里加空格，靠 letter-spacing 拉开。
const labelLayer = () => {
  const s = ['<!-- 房间名 -->'];
  const name = (id, str, color = LABEL) => {
    const [x, y] = ROOM_RECTS[id];
    s.push(text(x + 12, y + 22, str, {
      size: 12, color, halo: HALO, tracking: 3, baseline: true, family: 'KaiTi, SimSun',
    }));
  };
  name('cell1', '一号牢房');
  name('cell2', '二号牢房');
  name('cell3', '三号牢房', RED);
  name('storage', '储藏室');
  name('workshop', '工具间');
  name('medical', '医务室');
  name('dining', '食堂');
  name('laundry', '洗衣房');
  name('yard', '放风区');
  // 走廊名沿用概念稿的居中位置（走廊中段），同样带挖版描边
  s.push(text(360, 203, '走廊', {
    size: 12, color: MUTED, halo: HALO, tracking: 3, anchor: 'middle',
    baseline: true, family: 'KaiTi, SimSun',
  }));
  return s.join('');
};

// ---------------------------------------------------------------------------
// 入口：返回 <g id="map-room">…</g>，坐标空间 0 0 764 520
// ---------------------------------------------------------------------------
export function buildMap() {
  return [
    '<g id="map-room">',
    '<defs><filter id="map-card-shadow" x="-60%" y="-60%" width="220%" height="220%">' +
      '<feGaussianBlur stdDeviation="2.4"/></filter></defs>',
    paperLayer(),
    roomLayer(),
    gridLayer(),
    floorLayer(),
    yardHatchLayer(),
    wallLayer(),
    doorLayer(),
    furnitureLayer(),
    scaleLayer(),
    tokenLayer(),
    labelLayer(),
    '<g id="nightpath"></g>',
    '</g>',
  ].join('');
}
