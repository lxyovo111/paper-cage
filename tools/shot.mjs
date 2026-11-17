// shot.mjs — 用 resvg 把 renderScreen(state) 渲成 PNG，肉眼验收。
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderScreen } from '../ui/screen.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function shot(state, name) {
  const svg = await renderScreen(state);
  fs.writeFileSync(path.join(here, name + '.svg'), svg, 'utf8');
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1600 },
    font: { loadSystemFonts: true, defaultFontFamily: 'SimSun' },
    background: '#1b1712',
  });
  const png = r.render().asPng();
  fs.writeFileSync(path.join(here, name + '.png'), png);
  return path.join(here, name + '.png');
}

export const mock = {
  phase: 'day', day: 3, ap: 2, apMax: 3, obedience: 70, hostility: 42,
  rules: [
    { text: '入夜后，任何人不得离开自己的房门。', note: '22:00 — 05:00 · 全区域 · 禁止位移 · 无例外' },
    { text: '医务室须两人同行方可进入。', note: '全时段 · 医务室 · 需 2 人 · 无例外' },
    { text: '工具间铁器，任何人不得触碰。', note: '全时段 · 工具间 · 禁止取物 · 无例外' },
  ],
  report: [
    { t: '21:47', text: '三号牢房的灯还亮着。他没有离开牢房区。' },
    { t: '21:52', text: '值班记录多了一行：床单少了一条。' },
  ],
  path: null, tokens: null,
};

const nightMock = { ...mock, phase:'night', path: [[120,300],[300,250],[380,250],[470,250],[560,170]], day:3 };
const settleMock = { ...mock, phase:'settle',
  settle:{ title:'账本', sub:'你赢了七天。他记了一辈子。',
    quote:'「入夜后，任何人不得离开自己的房门。」——你写了它，它漏了 2 次。' },
  settleStats: { ai: 'AI ‖ 挑路 5/7 夜 · 开口 6/7 次', days:'坚 持 了 7 天', obedience:58, hostility:81 } };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const which = process.argv[2] || 'all';
  const jobs = [['day', mock], ['night', nightMock], ['settle', settleMock]];
  for (const [nm, st] of jobs) {
    if (which !== 'all' && which !== nm) continue;
    console.log(await shot(st, 'screen-' + nm));
  }
}
