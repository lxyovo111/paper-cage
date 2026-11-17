const URL = "https://lxyovo-six-rules.ms.show/play";
const t0 = Date.now();
let last = "";
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(URL, { cache: "no-store" });
    const t = await r.text();
    const line = new Date().toISOString().slice(11,19) + " " + r.status + " " + t.length;
    if (r.status === 200 && t.indexOf("data-act=\"start\"") >= 0 && t.indexOf("intro") >= 0) {
      console.log(line + " DEPLOYED");
      console.log("DONE", Math.round((Date.now()-t0)/1000) + "s");
      process.exit(0);
    }
    if (line !== last) { console.log(line); last = line; }
  } catch (e) { console.log("ERR", e.message); }
  await new Promise(r => setTimeout(r, 20000));
}
console.log("TIMEOUT");