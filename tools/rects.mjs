import { ROOM_RECTS, MAP_W, MAP_H } from '../ui/map.js';
console.log(MAP_W, MAP_H);
for (const k in ROOM_RECTS) console.log(k, JSON.stringify(ROOM_RECTS[k]));
