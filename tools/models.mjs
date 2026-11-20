import { readFileSync } from 'node:fs';
const TOKEN = process.env.MODELSCOPE_API_KEY || readFileSync(new URL('.ms-key', import.meta.url), 'utf8').trim();
const r = await fetch('https://api-inference.modelscope.cn/v1/models', { headers: { Authorization: 'Bearer ' + TOKEN } });
const j = await r.json();
console.log(JSON.stringify(j.data.map(x => x.id)));