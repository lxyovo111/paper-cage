const url='https://github.com/lxyovo111/seventh-night';
const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0'}});
const t=await r.text();
console.log('status',r.status,'len',t.length);
for(const k of ['一个玩家、七天','modelscope.cn/studios/lxyovo/six-rules','topic-tag','ai-game']) console.log(k, t.includes(k));
const m=t.match(/<meta name="description" content="([^"]*)"/); console.log('meta', m?m[1].slice(0,200):'none');
const topics=[...t.matchAll(/data-octo-dimensions="topic:([^"]+)"/g)].map(x=>x[1]); console.log('topics',JSON.stringify(topics));
