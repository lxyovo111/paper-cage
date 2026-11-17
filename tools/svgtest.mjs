import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="160">
<rect width="520" height="160" fill="#efe6d2"/>
<text x="20" y="60" font-size="28" font-family="KaiTi, SimSun" fill="#2b2b2b">测试 六条规矩 ABC</text>
<rect x="20" y="90" width="200" height="40" fill="none" stroke="#8a6b4a" stroke-width="2"/>
<text x="20" y="150" font-size="16" font-family="SimSun" fill="#6b5a44">宋体小字 21:47 灯还亮着</text>
</svg>`;
const r = new Resvg(svg, { font: { loadSystemFonts: true }, fitTo: { mode: 'width', value: 1040 } });
fs.writeFileSync('svgtest.png', r.render().asPng());
console.log('ok');
