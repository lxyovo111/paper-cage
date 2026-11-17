const TOKEN = 'ms-3c35db99-02f7-4078-aa15-4be73ff996ef';
const r = await fetch('https://api-inference.modelscope.cn/v1/models', { headers: { Authorization: 'Bearer ' + TOKEN } });
const j = await r.json();
console.log(JSON.stringify(j.data.map(x => x.id)));