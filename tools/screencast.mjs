import fs from 'node:fs';
import path from 'node:path';

export async function startRec(p, outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const frames = [];
  let n = 0;
  const onFrame = (m) => {
    if (m.method !== 'Page.screencastFrame') return;
    const f = path.join(outDir, String(n++).padStart(5, '0') + '.jpg');
    fs.writeFileSync(f, Buffer.from(m.params.data, 'base64'));
    frames.push({ f, t: Date.now() });
    p.send('Page.screencastFrameAck', { sessionId: m.params.sessionId }).catch(() => {});
  };
  p.on(onFrame);
  await p.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1600, maxHeight: 1000, everyNthFrame: 1 });
  return {
    frames,
    async stop() { await p.send('Page.stopScreencast').catch(() => {}); return frames; },
  };
}

export function writeConcat(frames, file) {
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const dur = i + 1 < frames.length ? Math.max(0.05, (frames[i + 1].t - frames[i].t) / 1000) : 1.0;
    lines.push('file ' + JSON.stringify(frames[i].f.replace(/\\/g, '/')));
    lines.push('duration ' + dur.toFixed(3));
  }
  if (frames.length) { lines.push('file ' + JSON.stringify(frames[frames.length - 1].f.replace(/\\/g, '/'))); }
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return file;
}