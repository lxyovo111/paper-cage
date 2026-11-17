#!/usr/bin/env node
// 用法: node tools/push-studio.mjs <studio-git-url> <token>
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const [url, token] = process.argv.slice(2);
if (!url || !token) { console.log('need: <studio-git-url> <token>'); process.exit(1); }
const stage = process.env.TEMP + '\\six-rules-push';
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });
const copy = (p) => {
  const dst = path.join(stage, p);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(p, dst, { recursive: true });
};
for (const f of ['app.py', 'requirements.txt', 'ms_deploy.json', 'README.md']) copy(f);
copy('dist');
const auth = url.replace('https://', 'https://oauth2:' + encodeURIComponent(token) + '@');
const run = (c) => execSync(c, { cwd: stage, stdio: 'inherit' });
run('git init -q');
run('git config user.email game@local');
run('git config user.name six-rules');
run('git add -A');
run('git commit -q -m "feat: 六条规矩 v1"');
run('git branch -M main');
run('git remote add origin ' + auth);
run('git push -u origin main --force');
console.log('PUSHED to ' + url);