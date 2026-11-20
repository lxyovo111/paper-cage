#!/usr/bin/env node
// 密钥扫描闸门：把 API Key / token / 私钥挡在提交之外。
// 用法：node tools/secret-scan.mjs --staged（默认，供 pre-commit 调用）| --all
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const all = args.includes('--all');
const exts = new Set(['.mp3','.mp4','.jpg','.jpeg','.png','.gif','.webp','.wav','.pdf','.zip','.pyc','.ico','.woff','.woff2','.ttf']);
// 允许出现的位置：本地密钥仓（.gitignore 已忽略）与扫描器自身
const allowFiles = new Set(['tools/.ms-key','tools/secret-scan.mjs']);

const PATTERNS = [
  ['modelscope-token', /\bms-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
  ['github-token', /\b(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
  ['openai-style-key', /\bsk-[A-Za-z0-9]{24,}\b/],
  ['aws-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private-key-block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['bearer-literal', /Bearer\s+["']?[A-Za-z0-9._\-]{24,}/],
  ['secret-assignment', /\b(api[_-]?key|access[_-]?token|secret[_-]?key|client[_-]?secret)\s*[:=]\s*["'][A-Za-z0-9._\-]{16,}["']/i],
];

function mask(s) {
  if (s.length <= 8) return s[0] + '***';
  return s.slice(0, 4) + '…' + '(' + s.length + ' chars)';
}

function walkGit(dir, depth, out) {
  if (depth > 6) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walkGit(abs, depth + 1, out);
    else out.push(path.relative(ROOT, abs));
  }
  return out;
}

function stagedFiles() {
  return execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').map(s => s.trim()).filter(Boolean);
}

const targets = all
  ? execFileSync('git', ['ls-files', '-z', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\u0000').filter(Boolean)
  : stagedFiles();
const hits = [];
for (const rel of targets) {
  const norm = rel.split(path.sep).join('/');
  if (allowFiles.has(norm)) continue;
  if (exts.has(path.extname(rel).toLowerCase())) continue;
  let st;
  try { st = statSync(path.join(ROOT, rel)); } catch { continue; }
  if (!st.isFile() || st.size > 1_000_000) continue;
  let text;
  try { text = readFileSync(path.join(ROOT, rel), 'utf8'); } catch { continue; }
  if (text.includes('\u0000')) continue;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const [name, re] of PATTERNS) {
      const m = lines[i].match(re);
      if (m) hits.push({ file: norm, line: i + 1, rule: name, found: mask(m[0]) });
    }
  }
}

if (hits.length) {
  console.error('\n[secret-scan] 检测到疑似密钥，提交已阻止：');
  for (const h of hits) console.error('  ' + h.file + ':' + h.line + '  [' + h.rule + ']  ' + h.found);
  console.error('\n处理方式：把密钥移到环境变量或 tools/.ms-key（已被 .gitignore 忽略），然后重新 add。');
  process.exit(1);
}
console.log('[secret-scan] 未发现密钥模式，放行（检查 ' + targets.length + ' 个文件）');
