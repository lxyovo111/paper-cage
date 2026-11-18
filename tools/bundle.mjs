// bundle.mjs — 把 ESM 模块各自包进 IIFE，通过共享命名空间 M 互相引用，拼成一个自包含 index.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODS = [
  ['paper', 'ui/paper.js'],
  ['intro', 'ui/intro.js'],
  ['map', 'ui/map.js'],
  ['engine', 'game/engine.js'],
  ['npc', 'ui/npc.js'],
  ['mobile', 'ui/mobile.js'],
  ['screen', 'ui/screen.js'],
  ['app', 'ui/app.js'],
];

const EXPORT_RE = /^export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;

function transform(src, tag) {
  let names = [];
  let m;
  EXPORT_RE.lastIndex = 0;
  while ((m = EXPORT_RE.exec(src))) names.push(m[1]);
  let out = src;
  // import 声明 → 从命名空间解构
  out = out.replace(/^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
    (all, ns, from) => '  const ' + ns + ' = M[' + JSON.stringify(modTag(from)) + '];');
  out = out.replace(/^\s*import\s*\{([^}]+)\}\s*from\s+['"]([^'"]+)['"];?\s*$/gm,
    (all, list, from) => '  const {' + list + '} = M[' + JSON.stringify(modTag(from)) + '];');
  out = out.replace(/^\s*import\s+[^;\n]+;?\s*$/gm, '');
  // 动态 import map.js：直接指向命名空间
  out = out.replace(/await import\('\.\.?\/(?:ui\/)?map\.js'\)/g, 'M.map');
  // 去掉 export 前缀
  out = out.replace(/^\s*export\s+default\s+/gm, '  const __default = ');
  out = out.replace(/^export\s+/gm, '');
  const assign = names.map(n => n + ':' + n).join(', ');
  return '(function(){\n' + out + '\nM[' + JSON.stringify(tag) + '] = {' + assign + '};\n})();\n';
}

function modTag(p) {
  if (p.indexOf('engine') >= 0) return 'engine';
  if (p.indexOf('paper') >= 0) return 'paper';
  if (p.indexOf('intro') >= 0) return 'intro';
  if (p.indexOf('map') >= 0) return 'map';
  if (p.indexOf('npc') >= 0) return 'npc';
  if (p.indexOf('mobile') >= 0) return 'mobile';
  if (p.indexOf('screen') >= 0) return 'screen';
  if (p.indexOf('app') >= 0) return 'app';
  return p;
}

let js = 'const M = {};\n';
for (const [tag, rel] of MODS) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    if (rel === 'ui/map.js') { js += 'M.map = { ROOM_RECTS: {}, MAP_W: 558, MAP_H: 520, buildMap: function(){ return ""; } };\n'; continue; }
    throw new Error('missing ' + rel);
  }
  js += '/* ===== ' + rel + ' ===== */\n' + transform(fs.readFileSync(p, 'utf8'), tag);
}

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const html = '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>纸上牢笼</title>\n' +
  '<script src="//g.alicdn.com/code/lib/iframe-resizer/4.3.2/iframeResizer.contentWindow.min.js"><\/script>\n' +
  '<style>\n' + css + '\n</style>\n</head>\n<body>\n' +
  '<div id="desk"><div id="stage"><div id="screen"></div><div id="overlay"></div></div></div>\n' +
  '<script>\n(function(){\n' + js + '\n})();\n</script>\n</body>\n</html>\n';

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html, 'utf8');
console.log('dist/index.html', (html.length / 1024).toFixed(1) + ' KB');