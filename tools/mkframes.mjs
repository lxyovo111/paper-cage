import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const [dir, out] = process.argv.slice(2);
if (!dir || !out) { console.error('usage: node tools/mkframes.mjs <framesDir> <out.mp4>'); process.exit(1); }
const stamps = JSON.parse(fs.readFileSync(path.join(dir, '_stamps.json'), 'utf8')).stamps;
const files = fs.readdirSync(dir).filter(f => /\.jpg$/.test(f)).sort();
if (files.length !== stamps.length) console.error('WARN frames', files.length, 'stamps', stamps.length);
const list = [];
for (let i = 0; i < files.length; i++) {
  const cur = stamps[i];
  const next = i + 1 < files.length ? stamps[i + 1] : cur + 100;
  const dur = Math.max(0.02, (next - cur) / 1000);
  const abs = path.resolve(dir, files[i]).replace(/\\/g, '/');
  list.push("file '" + abs + "'");
  list.push('duration ' + dur.toFixed(3));
}
const absLast = path.resolve(dir, files[files.length - 1]).replace(/\\/g, '/');
list.push("file '" + absLast + "'");
const listFile = path.join(dir, '_concat.txt');
fs.writeFileSync(listFile, list.join('\n') + '\n');
const FF = 'C:/Users/lcj/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-movflags', '+faststart', out];
const r = spawnSync(FF, args, { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr.slice(-2000)); process.exit(1); }
const probe = spawnSync('C:/Users/lcj/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffprobe.exe', ['-v','error','-show_entries','format=duration,size','-of','json',out], { encoding:'utf8' });
console.log('WROTE', out, probe.stdout.replace(/\s+/g,' ').slice(0,300));
