// Usage: node tools/mkvideo.mjs <framesDir> <out.mp4> [fps]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const FF = 'C:\\Users\\lcj\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const dir = process.argv[2];
const outp = process.argv[3];
const FPS = Number(process.argv[4] || 30);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
const ts = files.map(f => ({ f: path.join(dir, f), t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => a.t - b.t);
if (!ts.length) throw new Error('no frames');
const cfr = dir + '-cfr';
fs.rmSync(cfr, { recursive: true, force: true });
fs.mkdirSync(cfr, { recursive: true });
const t0 = ts[0].t, t1 = ts[ts.length - 1].t;
const n = Math.max(1, Math.round((t1 - t0) / 1000 * FPS));
let k = 0;
for (let i = 0; i < n; i++) {
  const tt = t0 + (i / FPS) * 1000;
  while (k + 1 < ts.length && ts[k + 1].t <= tt) k++;
  const dst = path.join(cfr, String(i).padStart(5, '0') + '.jpg');
  try { fs.linkSync(ts[k].f, dst); } catch (_) { fs.copyFileSync(ts[k].f, dst); }
}
const r = spawnSync(FF, ['-y', '-framerate', String(FPS), '-i', path.join(cfr, '%05d.jpg'), '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outp], { encoding: 'utf8' });
if (r.status !== 0) { console.log((r.stderr || '').split('\n').filter(l => /Error/.test(l)).join('\n')); throw new Error('ffmpeg failed ' + r.status); }
console.log('ok', outp, (n / FPS).toFixed(2) + 's', fs.statSync(outp).size, 'bytes');