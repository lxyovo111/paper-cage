// rename-studio.mjs — 把创空间中文名称改为《第七夜》，保存并回读验证
import { attach } from './attach.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NEW = process.argv[2] || '第七夜';
const p = await attach('modelscope');
const t = await p.send('Target.createTarget', { url: 'about:blank' });
const n = await p.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sid = n.sessionId;
const send = (m, q) => p.send(m, q, sid);
const ev = async (js) => { const r = await send('Runtime.evaluate', { expression: js, returnByValue: true }); return r.result && r.result.value; };
await send('Page.enable'); await send('Runtime.enable');

await send('Page.navigate', { url: 'https://modelscope.cn/studios/edit/?target=lxyovo/six-rules' });
await sleep(7000);

// 1) 设置中文名称
console.log('set:', await ev(`(() => {
  const inputs = Array.from(document.querySelectorAll('input.antd5-input')).filter(e => !e.disabled);
  const el = inputs.find(e => e.value === '六条规矩' || e.value === '第七夜') || inputs[1];
  if (!el) return 'noinput';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  el.focus();
  setter.call(el, '${NEW}');
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return 'set:' + el.value;
})()`));
await sleep(1200);

// 2) 点保存（不按 offsetParent 过滤：吸底按钮的 offsetParent 是 null）
console.log('save:', await ev(`(() => {
  const b = Array.from(document.querySelectorAll('button')).find(x => (x.innerText || '').replace(/\\s+/g, '') === '保存');
  if (!b) return 'notfound';
  const r = b.getBoundingClientRect();
  for (const type of ['mousedown', 'mouseup', 'click']) b.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }));
  return 'clicked@' + Math.round(r.x) + ',' + Math.round(r.y);
})()`));
await sleep(4000);
console.log('after-save-url:', await ev('location.href'));

// 3) 回读设置页
await send('Page.navigate', { url: 'https://modelscope.cn/studios/lxyovo/six-rules/settings' });
await sleep(7000);
console.log('readback:', await ev(`(() => { const t = document.body.innerText; const i = t.indexOf('展示名称'); return t.slice(0, 40).replace(/\\n+/g, ' / ') + ' || ' + (i >= 0 ? t.slice(i, i + 40).replace(/\\n+/g, ' / ') : 'no-mark'); })()`));
await p.send('Target.closeTarget', { targetId: t.targetId });
p.close();
