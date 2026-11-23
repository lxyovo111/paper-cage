import * as E from 'file:///C:/Users/lcj/Desktop/tap/six-rules/game/engine.js';
const texts=['入夜后，任何人不得离开自己的房间。','夜里禁止进入医务室。','医务室的窗，任何时候都不许碰。','不许离开三号牢房','全监狱任何时候不得离开自己的房间'];
for(const t of texts){const c=E.compileRule(t); console.log(t,'=>',JSON.stringify(c.rule&&c.rule.lang), c.note);}
const g=E.createGame(8);
const w=E.writeRule(g,'入夜后，任何人不得离开自己的房间。');
console.log('write',w.ok,w.note);
const holes=E.enumerateHoles(g);
console.log('holes',holes.map(h=>[h.id,h.open,h.depth,h.blockedAt,h.blockedBy]));
const res=E.simulateNight(g,{routeId:'window'});
console.log('outcome',res.outcome);
console.log(res.events.map(e=>e.kind+' '+e.t+' '+e.text).join('\n'));
