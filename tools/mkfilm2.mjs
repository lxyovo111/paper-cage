// mkfilm2.mjs — 按 segment 拼片，支持 img / vid(裁剪+变速) + 中文字幕
// 用法: node tools/mkfilm2.mjs <out.mp4> <segments.json>
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FF = 'C:\\Users\\lcj\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const OUT = process.argv[2] || 'tools/film.mp4';
const CFG = process.argv[3] || 'tools/segments.json';
const segs = JSON.parse(fs.readFileSync(CFG, 'utf8'));
const capDir = 'C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\cap';
fs.mkdirSync(capDir, { recursive: true });
const args = ['-y'];
const parts = [];
segs.forEach((s, i) => {
  if (s.type === 'img') { args.push('-loop', '1', '-t', String(s.dur), '-i', s.path); }
  else { args.push('-ss', String(s.start), '-t', String(s.dur), '-i', s.path); }
});
const filters = [];
segs.forEach((s, i) => {
  const base = 'scale=1600:1000:force_original_aspect_ratio=decrease,pad=1600:1000:(ow-iw)/2:(oh-ih)/2:color=0x1a1512,setsar=1';
  let f = '[' + i + ':v]';
  if (s.type === 'vid') { const sp = s.speed || 1; f += 'setpts=PTS/' + sp + ','; f += 'fps=30,'; }
  else { f += 'fps=30,'; }
  f += base;
  if (s.caption) {
    const cf = path.join(capDir, 's' + i + '.txt');
    fs.writeFileSync(cf, s.caption);
    const font = 'C\\:/Windows/Fonts/simkai.ttf';
    const textfile = cf.replace(/\\/g, '/').replace(':', '\\:');
    const fg = s.dark ? '0xE8DCC0' : '0x2a2118';
    const bg = s.dark ? '0x120e0a@0.55' : '0x2a2118@0.06';
    f += ",drawtext=fontfile='" + font + "':textfile='" + textfile + "':fontcolor=" + fg + ':fontsize=' + (s.fontsize || 30) + ':x=(w-text_w)/2:y=h-' + (s.captionY || 70) + ':box=1:boxcolor=' + bg + ':boxborderw=20';
  }
  f += '[v' + i + ']';
  filters.push(f);
});
filters.push(segs.map((s, i) => '[v' + i + ']').join('') + 'concat=n=' + segs.length + ':v=1:a=0[out]');
args.push('-filter_complex', filters.join(';'), '-map', '[out]', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT);
console.log('ffmpeg start');
const r = spawnSync(FF, args, { stdio: 'inherit' });
console.log('exit', r.status);
