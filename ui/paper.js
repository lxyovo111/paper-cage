// paper.js — 纸、墨、印章的视觉层。全部是 SVG 滤镜与纹理，不依赖图片。
export const C = {
  INK:'#221d19', INK2:'#40372d', MUTED:'#7e6f5c', MUT2:'#9c8e78',
  RED:'#882e1f', REDD:'#9c3626', PAPER:'#e8dcc0', PAPER_HI:'#efe6d2',
  WARM:'#80603c', BRASS:'#544a3c', STEEL:'#303a46', PENCIL:'#5c5850',
};
export const KAI = "'LXGW WenKai','KaiTi','STKaiti','Songti SC','Noto Serif CJK SC',serif";
export const SONG = "'Songti SC','SimSun','Noto Serif CJK SC',serif";

export function buildDefs() {
  return `
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.16"/></feComponentTransfer>
    </filter>
    <filter id="blotch" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="3" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.24" intercept="-0.08"/></feComponentTransfer>
    </filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
    <radialGradient id="vign" cx="50%" cy="45%" r="72%">
      <stop offset="48%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#3a2c1c" stop-opacity="0.28"/>
    </radialGradient>
    <linearGradient id="edgeShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2f22" stop-opacity="0.10"/>
      <stop offset="6%" stop-color="#000" stop-opacity="0"/>
      <stop offset="94%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#3a2f22" stop-opacity="0.13"/>
    </linearGradient>
  </defs>`;
}

export function buildPaper(w = 1600, h = 1000) {
  const stains = [
    [1288, 214, 62, 40, 0.10], [402, 640, 90, 54, 0.09], [980, 864, 74, 44, 0.10],
    [214, 302, 48, 34, 0.07], [742, 128, 40, 26, 0.06], [1360, 720, 56, 38, 0.08],
  ].map(function (s) { return '<ellipse cx="' + s[0] + '" cy="' + s[1] + '" rx="' + s[2] + '" ry="' + s[3] + '" fill="#8a6a3e" opacity="' + s[4] + '" filter="url(#soft)"/>'; }).join('');
  const fibers = [];
  for (let i = 0; i < 26; i++) {
    const x = 60 + ((i * 617) % 1480), y = 40 + ((i * 421) % 920), a = (i * 37) % 180;
    fibers.push('<line x1="' + x + '" y1="' + y + '" x2="' + (x + Math.cos(a) * 46).toFixed(1) + '" y2="' + (y + Math.sin(a) * 9).toFixed(1) + '" stroke="#8a7550" stroke-width="0.6" opacity="0.25"/>');
  }
  return `
  <g id="paper">
    <rect width="${w}" height="${h}" fill="${C.PAPER}"/>
    <rect width="${w}" height="${h}" fill="#b48d54" opacity="0.09" filter="url(#blotch)"/>
    <rect width="${w}" height="${h}" fill="#c8a060" opacity="0.06"/>
    ${stains}${fibers.join('')}
    <rect width="${w}" height="${h}" fill="url(#edgeShade)"/>
    <rect width="${w}" height="${h}" fill="url(#vign)"/>
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5"/>
    <line x1="1006" y1="0" x2="1006" y2="${h}" stroke="#7a6a4e" stroke-width="1.4" opacity="0.15"/>
    <line x1="1012" y1="0" x2="1012" y2="${h}" stroke="#ffffff" stroke-width="1.2" opacity="0.20"/>
    <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="#6b5a3e" stroke-width="1" opacity="0.35"/>
  </g>`;
}

export function pencilCircle(cx, cy, rx, ry, rot) {
  rot = rot || 0;
  let d = '';
  for (let i = 0; i <= 56; i++) {
    const a = (Math.PI * 2 * i) / 56;
    const j = i % 2 ? 1.02 : 0.985;
    const x = Math.cos(a) * rx * j, y = Math.sin(a) * ry * j;
    const xr = x * Math.cos(rot) - y * Math.sin(rot), yr = x * Math.sin(rot) + y * Math.cos(rot);
    d += (i ? 'L' : 'M') + (cx + xr).toFixed(1) + ' ' + (cy + yr).toFixed(1);
  }
  return '<path d="' + d + 'Z" fill="none" stroke="' + C.PENCIL + '" stroke-width="1.1" opacity="0.5"/>';
}
