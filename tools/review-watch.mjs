import fs from 'node:fs';
const TOKEN_FILE = 'C:/Users/lcj/Desktop/tap/six-rules/tools/.review-token';
const ID = 'ad9e646f-0e72-4387-bf92-e3ceddadb9b6';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => { const line = new Date().toISOString() + ' ' + s; console.log(line); try { fs.appendFileSync('C:/Users/lcj/Desktop/tap/six-rules/tools/review-watch.log', line + '\n'); } catch (_) {} };
log('WATCH start id=' + ID);
const MAX = 12 * 60 * 60 * 1000;
const t0 = Date.now();
while (Date.now() - t0 < MAX) {
  try {
    const tk = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    const r = await fetch('https://mseo-ai-inf.ms.show/api/submissions/mine', { headers: { 'x-session-token': tk, accept: 'application/json' } });
    const j = await r.json();
    const it = (j.data || [])[0];
    if (!it) log('MISSING submission (deleted?)');
    else if (it.review_result) { log('RESULT ' + it.review_result + ' cat=' + it.studio_category + ' public=' + it.is_public + ' reason=' + (it.review_reason || '')); process.exit(0); }
    else log('pending name=' + it.work_name + ' submitted=' + it.submitted_at);
  } catch (e) { log('ERR ' + (e && e.message)); }
  await sleep(180000);
}
log('TIMEOUT after 12h');
process.exit(2);