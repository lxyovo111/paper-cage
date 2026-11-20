// think-test.mjs — 试几种关掉 reasoning 的参数，找最快能出 JSON 的组合
import { readFileSync } from 'node:fs';
const KEY = process.env.MODELSCOPE_API_KEY || readFileSync(new URL('.ms-key', import.meta.url), 'utf8').trim();
const API = 'https://api-inference.modelscope.cn/v1/chat/completions';
const SYS = '你是规则编译器，只输出 JSON，不解释。';
const USR = '把「医务室的窗，任何时候都不许碰」翻译成 JSON: {"lang":{"window":{"from":0,"to":1439},"zones":["medical"],"actions":["TAKE"],"item":"iron"}}。只输出 JSON。';
const MODELS = ['Qwen/Qwen3.8-27B', 'Qwen/Qwen3.8-Flash-Next', 'Qwen/Qwen3.5-27B', 'Qwen/Qwen3.5-35B-A3B'];
const VARIANTS = [
  ['plain', {}],
  ['enable_thinking', { enable_thinking: false }],
  ['ctk', { chat_template_kwargs: { enable_thinking: false } }],
];
for (const model of MODELS) {
  for (const [name, extra] of VARIANTS) {
    const t0 = Date.now();
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 22000);
    try {
      const r = await fetch(API, { method:'POST', headers:{ 'content-type':'application/json', authorization:'Bearer '+KEY }, body: JSON.stringify(Object.assign({ model, messages:[{role:'system',content:SYS},{role:'user',content:USR}], temperature:0.2, max_tokens:120 }, extra)), signal: ctl.signal });
      clearTimeout(tm);
      const ms = Date.now()-t0; const txt = await r.text();
      let c = '', rc = '';
      try { const j = JSON.parse(txt); const m = j.choices[0].message; c = m.content||''; rc = m.reasoning_content||''; } catch(_) { c = txt.slice(0,90); }
      console.log(JSON.stringify({ model, v: name, ms, ok: /\{/.test(c), rc: rc.length, out: c.slice(0,80) }));
    } catch (e) { console.log(JSON.stringify({ model, v: name, ms: Date.now()-t0, err: String(e).slice(0,60) })); }
  }
}
process.exit(0);
