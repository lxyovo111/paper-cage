// mkfilm.mjs — 拼片。用法: node tools/mkfilm.mjs out.mp4 "img|<path>|<秒>" "vid|<path>|<start>|<dur>" ...
import { execFileSync } from 'node:child_process';
const FF = 'C:\\Users\\lcj\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const out = process.argv[2];
const parts = process.argv.slice(3).map(s => {
  const a = s.split('|');
  if (a[0] === 'img') return { kind: 'img', path: a[1], dur: +a[2] };
  return { kind: 'vid', path: a[1], start: a[2] ? +a[2] : null, dur: a[3] ? +a[3] : null };
});
const args = ['-y'];
const filters = [];
parts.forEach((p, i) => {
  if (p.kind === 'img') { args.push('-loop', '1', '-t', String(p.dur), '-i', p.path); }
  else {
    if (p.start !== null) args.push('-ss', String(p.start));
    args.push('-i', p.path);
    if (p.dur !== null) args.push('-t', String(p.dur));
  }
  filters.push('[' + i + ':v]scale=1600:1000:force_original_aspect_ratio=decrease,pad=1600:1000:(ow-iw)/2:(oh-ih)/2:color=0x1a1512,setsar=1,fps=30,format=yuv420p[v' + i + ']');
});
filters.push(parts.map((p, i) => '[v' + i + ']').join('') + 'concat=n=' + parts.length + ':v=1:a=0[out]');
args.push('-filter_complex', filters.join(';'), '-map', '[out]', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
console.log('parts', parts.length);
execFileSync(FF, args, { stdio: ['ignore', 'ignore', 'inherit'] });
console.log('wrote', out);
