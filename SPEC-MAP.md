# SPEC · ui/map.js（监狱平面图 SVG 模块）

## 你要交付的东西
一个文件：`C:\Users\lcj\Desktop\tap\six-rules\ui\map.js`（ESM，无依赖，纯字符串拼接，不碰 DOM）。

```js
export const MAP_W = 558, MAP_H = 520;
export const ROOM_RECTS = { cell1:[16,16,234,124], cell2:[16,140,234,124], cell3:[16,264,234,124],
  storage:[16,388,234,120], corridor:[250,16,220,492], workshop:[470,16,294,96],
  medical:[470,112,294,96], dining:[470,208,294,96], laundry:[470,304,294,96], yard:[470,400,294,108] };
// 夜间路径动画用：每条越狱路线的折线（viewBox 坐标），依次经过门
export const MAP_PATHS = { window:[[133,326],[250,332],[360,330],[470,160],[620,160],[620,150]],
  wall:[...], vent:[...], guard:[...], door:[...], rope:[...] };
export function buildMap() { return '<g id="map-room">…</g>'; }   // 返回 SVG 片段字符串，坐标空间 0 0 558 520
```

## 唯一的参考物（务必先看）
1. `C:\Users\lcj\Desktop\tap\six-rules\concept.png` — 1600×1000 的成品概念图，地图区域在整张图里的位置是 (204,182) 起点、宽 558×高 520（按 1:1 缩放到 concept.png 的 2 倍）。
2. `C:\Users\lcj\Desktop\tap\six-rules\crop_map.png` — 地图区域的放大裁切，就是你要复刻的样子。
3. `C:\Users\lcj\Desktop\tap\six-rules\render.py` — **Pillow 版实现，已有全部坐标**（"# ---------- map ----------" 到 "# ---------- right panel" 之间的整段：房间矩形、地砖、墙、门、每间房里的家具）。**你的任务是把它逐条翻译成 SVG**，不是重新设计。

## 硬要求
- 坐标空间与 render.py 完全一致：房间矩形、墙厚 WW=8、门宽 26、家具坐标都用 render.py 里的 viewBox 数字（render.py 里的 `mx/my` 是定点偏移，SVG 里不需要那层换算，直接用 raw 数字）。
- 线稿风格，不填色块（房间底色可以用非常淡的填充，与 concept.png 一致）。线宽 0.6–1.1。
- 墙：`WALLC = mix(INK,PAPER,0.63)` 填充 + `WALLB = mix(INK,PAPER,0.24)` 细边；INK=#2b2b2b，PAPER=#efe6d2 —— 直接写死近似色即可（可自己微调）。
- 门：门洞 + 门扇线 + 开启弧线（SVG `<path d="M… A…">`），弧度用 render.py 的 arc 角度推。
- 每间房要有功能家具（禁止全是矩形盒子糊弄）：牢房（床+床头板+枕头+被子压痕、马桶带水箱、洗手盆、凳子、外墙铁栏窗）、工具间（工作台+锤子扳手螺丝刀+台钳+砂轮机+零件推车+层架）、医务室（病床+输液架+抽屉柜+地上红十字）、食堂（两张长桌+长凳+盘子+打饭窗口+锅+泔水桶）、洗衣房（三台滚筒机+脏衣筐+蒸汽管）、储藏室（货架+木箱+油桶+扫帚）、放风区（斜线铺地+单杠+篮球板+长椅+粉笔圈）、走廊（地砖+长椅+地漏+拖把桶+比例尺）。细节照 concept.png 和 render.py。
- 房间名用 SVG `<text>`，字体 `font-family="KaiTi, SimSun"`，字号 11–13，颜色 #6b5a44，居中或按 concept 的位置。
- **两个人物标记必须是独立可分组的**，给 id：`<g id="token-prisoner">`、`<g id="token-guard">`，各是一枚 50×62 的「档案小像」卡片（相纸阴影 + 双层细边框 + 简笔头肩线稿，囚犯平头 + 囚服 V 领，狱警军帽 + 帽徽），下方小字「他」「狱警」。初始位置囚犯 (345,250) 中心、狱警 (405,394) 中心（viewBox 坐标）。
- 额外留一个空层：`<g id="nightpath"></g>`（放在最上层，app.js 会往里塞红色虚线）。
- **不要写死任何动画**。

## 验证方式（必须做，做完把图给 Lead 看）
本机没有浏览器，但有 resvg 可以栅格化 SVG：
```powershell
cd C:\Users\lcj\Desktop\tap\six-rules\tools
node your-render-script.mjs   # import { Resvg } from '@resvg/resvg-js'（已安装）
```
写出 `C:\Users\lcj\Desktop\tap\six-rules\tools\map-preview.png`（558×520 → 输出 1116×1040），然后**用 read_image 工具看这张 PNG**，和 `crop_map.png`（1116×1040 左右）逐处对比，不满意就改，至少迭代 3 轮：位置对不对、家具认不认得出、线条有没有互相压住、文字有没有被家具盖住。
最终产物里不能有 resvg 才能跑的东西（不要外链字体、不要 CSS）。

## 交付时报告
- `ui/map.js` 行数；
- `tools/map-preview.png` 路径；
- 你改了 concept 里哪些不合理的坐标、为什么；
- MAP_PATHS 里四条主线（window/wall/vent/guard）与三条 improvisation（door/rope/copy/riot/sick 有就写）的折线点。
