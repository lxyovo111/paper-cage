// cover-shot.mjs — 给「进入界面」拍两张验收图：桌面 1600x1000 / 手机 390x844
import { launch } from "./cdp.mjs";
import fs from "node:fs";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const URL_ = "http://127.0.0.1:7861/dist/index.html?intro=1";
// 桌面
{
  const p = await launch({ port: 9331, dir: "C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-cover-d", w: 1600, h: 1000, scale: 2 });
  await p.init();
  await p.goto(URL_);
  await sleep(1600);
  await p.shot("tools/cover-d.png");
  console.log("DESK", JSON.stringify(await p.ev("({phase: (window.__game||{}).view && window.__game.view.phase, hasSeal: !!document.querySelector(\"[data-act=start]\")})")));
  p.ws.close(); p.proc.kill();
}
// 手机竖屏
{
  const p = await launch({ port: 9332, dir: "C:\\Users\\lcj\\Desktop\\tap\\six-rules\\tools\\edge-cover-m", w: 390, h: 844, scale: 2 });
  await p.send("Page.enable"); await p.send("Runtime.enable");
  await p.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await p.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await p.send("Page.navigate", { url: URL_ });
  await sleep(1800);
  const r = await p.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } });
  fs.writeFileSync("tools/cover-m.png", Buffer.from(r.data, "base64"));
  const info = await p.send("Runtime.evaluate", { expression: "({vb: document.querySelector(\"svg.intro\") && document.querySelector(\"svg.intro\").getAttribute(\"viewBox\"), seal: !!document.querySelector(\"[data-act=start]\"), sh: document.documentElement.scrollHeight})", returnByValue: true });
  console.log("MOBILE", JSON.stringify(info.result.value));
  p.ws.close(); p.proc.kill();
}