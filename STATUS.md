# 《纸上牢笼》· 交付状态（2026-11-25 21:55）

## 2026-11-25 第5天互锁修复（已上线并线上复测）

起因：用户指出第5天「上级检查必须再写一条」与「最多六条」互锁，若前四天写满就会卡死。复盘后发现问题比预想更严重：

1. **实际线上方向相反**：`wroteToday` 从 `newGame()` 起只置 true，从不按天清零。第5天只要此前任意一天写过规矩，检查就被绕过；如果从没写过，六条满时才会卡住。
2. **满六条没有合法出口**：现在允许在检查时选一条旧规矩改写，槽位仍是六条；引擎 `rewriteRule` 保留原 `id`，旧正文留在 `rewrittenFrom`，过去夜里引用过的那条仍能对上。
3. **零行动力也会卡死**：若第5天把行动力花光，检查要求写/改写，但旧逻辑会拒绝「今天没有行动力」。现在第5天检查当次在行动力不足时免单（`free`）：改写或新写都不扣 AP；有 AP 时仍扣 1。

**改动**：
- `ui/app.js` `dayBriefing()`：`const prevDay = view ? view.day : null; syncView(); if (prevDay !== null && g.day !== prevDay) { wroteToday = false; replaceRule = null; }`，按天重置「今天写过」。
- `ui/app.js` `askWrite(opts)`：支持 `opts.replace`；`free` 自动条件为 `g.day === 5 && !wroteToday && g.ap < 1`；编辑器标题「改 写 第①条」、副标题说明旧规矩会被换掉；同一文本拒绝「写一条不一样的」。
- `ui/app.js` `askInspectionRewrite()`：六条已满时列出六个 `.chip`，点选后进入改写；提示动态显示是否扣行动力。
- `ui/app.js` `showVerdict()`：改写时标题「改 写 完 毕」；`E.writeRule` / `E.rewriteRule` 传入 `{ free }`；提示写明「这次改写/写入不扣行动力」。
- `game/engine.js`：`writeRule(state,text,compiled,opts)` 与 `rewriteRule(state,id,text,compiled,opts)` 支持 `free`，默认三/四参调用行为不变；返回带 `free`。

**本地验证**：
- `node tools/test-inspection.mjs` 通过；`tools/test-rule-boundary.mjs` 全过。
- `node tools/test-inspection-zero.mjs`（六条满 / day5 / AP0）：检查面板 6 chip，提示「行动力已用完：这次改写不扣行动力」，改写后 `{rules:6,id:"r1",ap:0}`，再次入夜进入预判面板（9 chip）。
- `node tools/test-inspection-zero-new.mjs`（1 条 / day5 / AP0）：`askNight` 提示必须写，点空槽仍能打开编辑器，副标题「这条规矩不扣行动力」，写入后 `{rules:2,ap:0}`，再次入夜进入预判面板。
- `node tools/test-inspection-reset.mjs`：第1天写一条 → 手动拨到第4天 → 点「不猜，直接入夜」跑到第5天；`dayBriefing()` 已把 `wroteToday` 清零，第5天 `askNight` 重新要求写规矩（`toast`「今晚上级检查：你必须再写一条规矩」），不再绕过检查。
- `node tools/test-inspection-ui.mjs`（六条满 / day5 / AP2）：改写后 `{rules:6,id:"r1",ap:1}`，改写消耗 1 AP。
- `node tools/dist-test.mjs`：完整一局 `{"phase":"settle","day":7,"escaped":true,"rules":6,"nights":6}`，`errors= none`。
- `node tools/bundle.mjs` → `dist/index.html` 207,556 B。

**部署与线上复测（2026-11-25 21:51）：已上线。**
- 用户在本机 Edge 默认 profile 手动登录 ModelScope；CDP 9232 可用（`tools/attach925.mjs` 支持 `CDP_PORT`）。
- 上传 `index.html` 207,556 B / SHA256 `C4FC59FE71826D6A4765CD8F90206091033A18BB678D815B79F15BC44FF35864`，创空间文件列表显示 207.56KB；`tools/deploy925b.mjs` 重新部署，构建约 9 分钟。
- `/play` 返回 200 / 184,731 字符，含 `askInspectionRewrite` 与「这条规矩不扣行动力」；线上 iframe 实测（`tools/live-inspection-zero2.mjs`，在 game iframe 内执行）：6 条 / day5 / AP0 → 上级检查 6 chip，提示「行动力已用完：这次改写不扣行动力。」→「改 写 第 ① 条」→「改 写 完 毕」free=true → 写下后 `{rules:6,id:"r1",ap:0}` → 再次入夜进入预判面板 9 chip。
- 1 条 / day5 / AP0 路径用同一 dist 包在本地 `test-inspection-zero-new.mjs` 验证：提示必须写 → 点空槽 → 副标题「这条规矩不扣行动力」→ 写入后 `{rules:2,ap:0}` → 再次入夜进入预判。
- 线上地址：https://modelscope.cn/studios/lxyovo/six-rules ｜ https://lxyovo-six-rules.ms.show/play

## 2026-11-23 规则可核对性改版（已上线）

起因：真实试玩反馈「输入『入夜后，任何人不得离开自己的房间』，归档却显示限定三号牢房，第一夜报告又出现他进了储藏室」。核心问题是玩家写的规矩与引擎执行的判定不一致、且无法核对。

**规则语义（game/engine.js）**：编译结果显式带 `boundary: leave / enter / null` 与 `subject: any / target`；「离开/走出/出门」按跨门槛判定，「进入/回到」反向判定；「任何人」只约束在押囚犯、不包含狱警；「自己的房间」只指他本人的三号牢房。`ruleBlocks` 在 MOVE 前后房间变化时判边界，不再按动作白名单误放行。`ruleStrength` 对边界规矩乘 0.62，避免一条规矩锁死所有路线。
**确认卡（ui/app.js）**：本地先出预览并锁定，AI 晚到不覆盖；归档前逐项展示「对象 / 时间 / 地点 / 限制」，并明确三条提醒（唯一在押者、自己的房间、边界判定）。
**行动依据**：报告右上新增「行动依据 ▸」，逐步展示时间、动作、起点→终点、命中/未命中第几条规矩及执行率、参与规矩、引擎结论；声明只复述引擎记录、不展示模型思考。
**地图联动**：报告前两行可点击，地图上临时红框标出对应房间并提示。
**首回合引导**：第一夜可跳过三步提示纸条；不写成说明书。
**宽严代价**：确认卡显示写下后的服从度变化与该规矩执行率，边界/宽/具体三类定性提示。
**结局四问**：结算后可开「结局回顾」，回答哪条真拦住、哪条没用上、预判准了几夜、只能改一条改哪条。
**创作手记**：docs/创作手记-模板版.md 已补 AI 三处调用链路、边界语义、行动依据与音效说明；线上文章 438502 已通过 `PUT /api/v1/articles` 重写 `ContentDraft` 同步，公开页验证 `hasBad=false / hasBoundary=true / hasAI=true / hasAudio=true`。
**行动依据位置（2026-11-23 21:26）**：桌面版「行动依据 ▸」原在 x=1468,y=776，与右下角「入夜」印章（中心 1418,812，旋转 -9°）重叠；已移到 x=1266,y=776（印章左侧，热区 1146–1274），手机 / 横屏本来不重叠，未改。
**位置修复部署（2026-11-23 21:35）**：重新打包 202,842 B → 上传创空间（commit `fe64bb40`）→ 重新部署，构建 416s，`/play` 200 / 180,957 字符 / 含 `x="1146" y="760"`；线上 iframe 实测 why rect 1127–1253 / night rect 1339–1452，`overlap area=0`，截图 `tools/v-online-fix-clip.png`。

**已验证**：`tools/test-rule-boundary.mjs`（原话 → `boundary:"leave"`、`22:00–05:00 · 三号牢房 · 禁止离开 · 无例外`、holes 全 blocked、第一夜 blocked）；`tools/dist-test.mjs`（settle / 6 rules / no errors）；headless Edge 桌面与手机截图确认确认卡、行动依据、地图红框、代价提示、引导纸条、结局回顾。最终 dist 202,842 B。

**线上复测（2026-11-23 21:10 最终版）**：`/play` 200（180,957 字符）含「行动依据」「第一次当监狱长」；`tools/online-full.mjs` 用线上 iframe 完整跑一局（seed 8 / llm=1 / 7 夜），确认卡显示对象/时间/地点/限制与三条提醒、行动依据逐步显示命中第①条及执行率、报告行可点地图红框、结算 `#review-btn` 四问齐全、`errors=[]`；`tools/online-quick.mjs` 另测首回合纸条出现/可跳过、AI 校准后确认卡显示「AI 已校准」并保留 `22:00–05:00 · 医务室 · 禁止进入`。
**A/B/C/D 对照（2026-11-23 21:20，线上同种子 8 / 各 4 夜）**：A = AI 开 + 三条规矩（医务室禁止进入 / 放风区墙禁止碰 / 储藏室麻绳禁止取）→ 第1夜「狱警的钥匙」被抓，第2–4夜「食堂的后门」；B = AI 关 + 同三条规矩 → 连续四夜「狱警的钥匙」，第4夜逃出；C = AI 开、无规矩 → 连续四夜「医务室的窗」；D = AI 关、无规矩 → 同样四夜「医务室的窗」。结论：判定与结局完全由引擎算，AI 开关不改变判定；但 A 组第1夜被抓后换路、B 组不换，说明跨回合记忆/理由参与了选路；C/D 路线一致，AI 只多出理由句。

**部署（2026-11-23 12:19–12:33）**：在用户登录的 9225 Edge 里用 `tools/upload925.mjs` 上传 `.upload/index.html`（202,786 B），`tools/deploy925b.mjs` 点「重新部署 → 确认部署」，后台 `tools/wait-deploy2.mjs` 等到 `/play` 200（180,878 字符）含新标记，耗时 820s。之后又修了结局回顾里写死的「六条规矩」（只有 1 条规矩时会说错），重新打包 202,842 B，21:10 二次部署成功（`/play` 180,957 字符），`tools/online-full.mjs` 复测：一局 7 夜 settle、结局回顾显示「你写下的 1 条规矩…」、`errors=[]`。`tools/.ms-key` 仍是只读令牌，Git push 与 OpenAPI 均被拒（`token does not support repository operations` / `OperationNotAllowed`），因此部署只走浏览器 UI；最终版已 push 到 GitHub `9e0a4e4`。

## 公开链接
- 试玩（创空间）：https://modelscope.cn/studios/lxyovo/six-rules
- 游戏直出页（创空间内 iframe）：https://lxyovo-six-rules.ms.show/play （2026-11-25 21:51 重新部署成功：200 / 184,731 字符，含第5天上级检查改写、零行动力免单、按天重置 `wroteToday`；本机 dist/index.html 207,556 B 打包产物；线上 iframe 复测通过）
- 演示视频（90 秒，含「同一局面，两种选择」对照卡）：https://lxyovo-six-rules.ms.show/static/demo-90.mp4 （2026-11-21 10:04 更新：5,841,240 B / 72.87s / video/mp4，A/B 卡已重做为 AI 与兜底的选路对照）
- 创作手记（开发者实践）：https://modelscope.cn/posts/438502
  - 标题《纸上牢笼》创作手记 · 专题「AI+赛事」· 标签「基础模型LLM」· 封面为标题卡
- 参赛报名：已审核通过（小红书方案 https://xhslink.cn/o/Afux7g4n5JK）
- 作品提交：旧作品「第七夜」因平台锁定作品名无法编辑，2026/11/18 12:41:11 删除后以《纸上牢笼》重新提交，2026-11-18 约 15:30 审核通过。2026-11-19 12:25 再次删除并重新提交，简介换成第三版「我把 AI 关进监狱，第一晚他就摸到了门。……」（创空间描述与手记简介同步为该版）→ 新作品 id `ad9e646f-0e72-4387-bf92-e3ceddadb9b6`，提交时间 2026/11/19 12:22:32，**2026-11-19 13:11:31 审核通过**（`review_result=passed`、`is_public=1`、`reviewed_at=1795065091`）；监听脚本 `tools/review-watch.mjs`（日志 `tools/review-watch.log` 末行 `RESULT passed`）。旧提交数据备份 `tools/submission-backup.json`。审核通过截图 `tools/sub-approved.png`（赛事首页横幅「审核通过，去提交作品」）
- 作品广场：**已恢复可见**（`/api/works` 第 1 页即见），卡片名「纸上牢笼」、简介为第三版、分类「Gradio 应用」、封面为案卷封面；当前广场共 225 个作品，我们创空间 visits=2,772 / stars=0 / likes=0（2026-11-23 21:30 查询）。已通过的提交信息锁定（平台规则：审核通过后改简介需删除重提，慎用）

## 首屏加速（2026-11-21 00:15–00:40，已上线）

**为什么慢**（2026-11-21 00:12 桌面快网、禁用缓存实测）：作品页 `https://modelscope.cn/studios/lxyovo/six-rules` 自身 JS 总量 12.4 MB（umi.js 4.1 MB + 异步块 1.9 MB + 107 个 js），iframe 到 4.55s 才出现；随后平台注入 Gradio 外壳页（alicdn 前端 + iframe-resizer/polyfills），我们的 Blocks `js` 才 `location.replace("/play")`；我们自己的 `/play` 当时 165,643 B **无压缩、无缓存头**，服务端 TTFB 0.9–1.2s（`/healthz` 空响应也 0.55s = 平台代理固定开销）。从点开到看见封面 ≈5.0s，其中 ~4.5s 在平台侧。

**改了什么**
1. `/play` 开 gzip + 弱 ETag + `Cache-Control: no-cache`（`app.py` 新增 `_play_page()`：按 mtime 预压 `gzip.compress(raw, 6)`、`sha1[:24]` 生成 `W/"..."`；`if-none-match` 命中回 304；`Vary: Accept-Encoding`）。166,994 → **51,487 B（31.4%）**。
2. `/static/` 前缀加 `Cache-Control: public, max-age=86400`（middleware `_static_cache`），BGM/音效/视频二次访问不再回源。
3. 首屏占位 `#boot`（`index.html` + `styles.css`）：「纸 上 牢 笼 / 正在打开案卷…」深色底，脚本就绪后 `bootDone()` 双层 rAF 淡出并移除节点，消灭解析期白屏。
4. `warm()` 从模块加载挪到点「进入」后 900ms（`ui/app.js`）：打开页面不再立刻打一次 LLM。
5. 夜间 BGM 懒加载（`ui/audio.js`）：`ensure()` 只建白天 BGM，`bg.mode==="night"` 时才建夜间 BGM，首开少下 432,945 B。

**线上验证（部署 00:31:59 CreatingBuildingImage → 00:38:25 Creating → 00:39:06 Running）**
- `/play` 200 / `Content-Encoding: gzip` / `Content-Length: 51,487` / `ETag: W/"2046166c27a47fdbb8e28d4a"` / `Cache-Control: no-cache`，TTFB 721ms；带 `if-none-match` → **304（0 字节）**。
- `/static/audio-day.mp3` Range → **206** + `public, max-age=86400`；`/healthz` 200。
- 标记：report-live / isLandscapeView / boot-done / `<title>纸上牢笼</title>` 全在；iframe 内 `/play` 的 `encodedBodySize` 由 165,643 → **51,487**。
- 回归：`dist-test.mjs` final settle（day7 / rules6 / nights6 / errors=none）；`mtest2.mjs` 竖屏 settle + LINES 4 + 无错；线上 AI compile 冒烟 `{"ok":true, ...}`。

**边界（不可控）**：平台作品页 12.4 MB JS、Gradio 外壳启动、免费 CPU 按需实例冷启动都在平台侧；桌面快网复测 cover 5,156ms（平台页占大头），gzip 的收益主要体现在 4G/慢网（少下 115 KB）与二次打开（`/static` 304/长缓存）。直连 `ms.show/play` 仍 302 回平台页，不能当快速入口。

## 已交付
- 游戏本体：单文件自包含 dist/index.html（2026-11-21 12:47 上线版 176,899 字节；横屏/竖屏/桌面三版式 + 首屏加速 + 阈值行为 + 进入兜底），确定性规则引擎 + SVG 全屏 UI + 夜戏动画
- AI 语言层：魔搭 API Inference（Qwen/Qwen3.8-27B，关思维链），三处用途 = 编译规矩 / 在引擎漏洞清单里挑路线 / 夜间一句独白；全部有本地兜底，界面不阻塞
- 演示视频：72.87s / 1600×1000 / 5.84 MB，结构 = 标题卡 → 写规矩+AI 校准 → 第一夜 → 第二夜被规矩堵住 → A/B 对照卡 → 快进七天 → 判决书 → 尾卡
- 创作手记：六节官方模板 + 第 7 节「开源与对照实验」+ 第 8 节「11-20 更新：AI 的记忆与状态」（含 2026-11-21 阈值行为补充）；公开页正文约 4.9 千字符，含试玩/视频/工具实测数据（0.7–2.7s vs 25s+）；2026-11-18 已改名为《纸上牢笼》并修复一次正文重复事故（现正文单份、8 节齐全）
- 手机竖屏版式（20:32 上线）：`ui/mobile.js` 纵向版式，一屏不滚动；桌面/横屏仍是横版
- **玩法与路线优化（22:2x，部署中）**：四条人物习性（看窗/手巧/怕黑/记仇，按种子抽一条，开局给第一份情报）；路线情报系统（他走过一次才算摸清，未知路在预判面板上显示「没查过这条路」）；提审（1 AP、敌意+6）与加派夜巡（2 AP、多一班）各换一条情报；物品跨夜留在口袋（被抓住搜身清空）；同一条规矩拦两次他必换路；漏过的规矩下次更松；结算判词点出他最后是从哪条路出去的
- **难度与夜戏（本轮，22:57 上线，commit a40a13f0）**：第四夜起他一夜走两步（`PARAMS.rushFromDay=4`）；IMPROV 五条路线门槛下调（door/rope 第2夜起、copy/sick 第3夜、riot 第4夜）；同一句话拦他越多，他越熟悉（`rule.wear` 每次 −10%，最多 −55%）；夜路行走动画从 2s 放慢到 3.4s（CSS offset-path 重写，修掉 SMIL 时间轴从页面加载起算导致小像瞬移到终点的问题），报告行间隔 760→950ms。两步夜报告改为紧凑排版（时间 11 / 正文 14，行距 24；先省掉「熄灯」一行，保证两个动作 + 被拦/被抓 + AI 独白都放得下；修过一个判断顺序 bug——必须先按原始事件数判紧凑、再删行，否则删完又落回宽松排版、最后一条被挤掉）。平衡：反应式玩家 120 局逃逸 60%（失守72/账本37/铁壁7/记得4）、静态六条 84%。最新部署（含紧凑报告）：/play 200 / 128437 字节，含 offset-path / scale(1.18) / rushFromDay / 音频；桌面与手机真浏览器夜戏复测通过（tools/live/desktop-2.png、tools/live/mobile-2.png），两步夜紧凑报告桌面/手机截图 tools/reportfit7/desk-13.png、tools/reportfit8/desk-12.png
- 音频（21:5x 接入，21:56 上线验收）：两条 BGM（白天案卷 / 夜间巡视）+ 6 个事件音效，全部程序化合成（无第三方素材）；`ui/audio.js` 交叉淡入、静音开关、首次交互后启动；文件为项目根 `audio-*.mp3` / `sfx-*.mp3`，由 `/static/` 提供，来源见 `docs/audio/README.md`；线上 `/static/*.mp3` 8 个文件均 200 / audio/mpeg，真实浏览器加载 audio-day / audio-night / sfx-stamp 成功，`#mute-btn` 可切换静音
- 进入界面（封面，`ui/intro.js`）：桌面 1600×1000 / 手机 800×1840，红章「进入」即开始；`?intro=0` 可跳过
- 美术接手说明：`docs/美术与进入界面-接手说明.md`（给外部 AI/美术的契约与验收清单）
- 开源仓库：https://github.com/lxyovo111/paper-cage （Apache-2.0；2026-11-19 由 seventh-night 改名，旧链接 301 跳转）
- 试玩物料：`docs/试玩说明.md`（可直接转发，含 5 个反馈问题）
- 人气奖物料：`docs/小红书-第二篇.md` + 配图 `tools/xhs-1.jpg` / `xhs-2.jpg` / `xhs-3.jpg`

## 改名统一与重新部署（2026-11-19 22:10–2026-11-20 00:02）
- 问题：页面标题《纸上牢笼》、app.py SYSTEM 提示词仍是《第七夜》、仓库名 six-rules、README 标题「六条规矩」四处名字打架。已统一为《纸上牢笼》：本地 app.py（SYSTEM 名 / 夜间 prompt / `gr.Blocks(title=…)` / 载入 HTML）、README 首行 `# 纸上牢笼 · Paper Cage`、GitHub 仓库改名 `lxyovo111/seventh-night` → `lxyovo111/paper-cage`（旧链接 301，commit 7c806e8）。创空间 slug `six-rules` 与已审核提交链接保持不变（改 slug 需删稿重提重审，风险大）。
- 创空间「空间文件」里的 app.py/README 是改名前的旧副本（此前只重传了 index.html）→ 已重传，重克隆验证「第七夜」出现 0 次。
- **部署连续失败 4 次的根因**：创空间仓库里没有 `ms_deploy.json`（15 个文件，缺这个），平台回落到新默认镜像 `(Recommended)ubuntu22.04-(cuda12.8.1)-py312-torch2.10.0-modelscope1.37.0`；该镜像在 EAS 阶段「image optimizing」失败，`/play` 返回 412 `function is failed state (failed to do image optimizing)`，运行日志恒为空，只有构建日志能看到 FROM。
- **修复**：把 `ms_deploy.json` 补传进创空间仓库；再把服务器端部署设置（「调整部署设置 → JSON配置」）改成与之一致的小镜像 `ubuntu22.04-py311-torch2.3.1-modelscope1.31.0`（平台显示名 `ubuntu22.04-(cuda12.1.0)-py311-torch2.3.1-modelscope1.31.0`）+ `platform/2v-cpu-16g-mem`、密文变量 MODELSCOPE_API_KEY 填真实值（JSON 保存会把密文回写成占位符，必须重填）→ 重新部署：23:51:54 开始建镜像，23:57:50 转 Creating，**00:02:13 /play 200，部署成功**（状态 `Running`）。
- 验证：`/play` 200 / 128437 字节 / 含 `<g id="report-live">` / 标题含「纸上牢笼」/ 无「第七夜」；`/healthz` `{"ok":true}`；`/gradio_api/call/npc` 通路正常（返回 event_id 与 SSE complete）。
- ~~遗留：API-Inference 额度不足~~ → **2026-11-20 12:3x 已恢复**（直连 200；线上 compile/choose/remark 三个任务全部 ok）。昨晚的 429 是每日免费额度用尽，次日重置；一局只调 3 次，正常够用。

## P0 补强（2026-11-20 04:40–12:55，主攻「最佳 AI NPC」硬标准）
- **AI 决策接入角色记忆与状态（补「结合角色记忆与游戏状态自主决策」）**：`app.py` 的 `_choose` 现在接收 `payload.memory`（habitLine / grudge / leaks / progress / day / hostility / obedience），prompt 三段=【你记得的事】【你现在的状态】【今晚能走的路】，要求 `reason` 必须来自记忆、≤18 字、禁止「最可能/最容易」；输出 `{"id","reason"}`，id 仍必须映射回引擎枚举出的合法漏洞（非法 id 返回 `id:None`，reason 保留）→ 规则层仍在校验，AI 只是在合法集合里做选择。`ui/npc.js` 组 memory 并回传；`ui/app.js` 把 reason 写进 `g.nights[0].reason`，次日巡查报告多一行「他挑这条路，因为：…」；`?llm=0` 时该行不存在（消融可见）。
- **验证**：本地 prompt 3 例全部命中记忆（看窗→window「他怕闷，总盯着医务室那扇窗看」2.8s；记仇→guard「入狱那天盯着狱警的钥匙看了很久」0.8s；手巧→window 0.76s）。线上 `/gradio_api/call/npc` 带 memory 返回 `{"ok":true,"id":"guard","reason":"入狱那天盯着狱警的钥匙看了很久"}` 2.9s。真浏览器一整局（写规矩→入夜→第二天）巡查报告实拍到「他挑这条路，因为：手巧能把床单搓成绳挖通风口」，截图 `tools/_e2e-reason.png`。
- **部署**：`app.py` 14414 B + `index.html` 144538 B 上传（commit ce360b68），04:37 触发 → 04:46:39 `/play` 200 / 130012 字符；`/play` 含「他挑这条路，因为」「habitLine」，标题「纸上牢笼」。
- **手记补第 7 节「开源与对照实验」**（2026-11-20 00:2x 发布）：补 GitHub 仓库链接（Apache-2.0，含引擎/语言层/部署文件/本地复现命令）与 `?llm=0` 消融说明；公开页正文 4235 字，`hasPc`/`hasLlm` 均为 true（`GET /api/v1/articles/438502` 的 ContentMd 滞后，以公开页为准）。
- **创空间描述补开源与消融**（12:5x 保存成功）：末尾追加「｜开源仓库：https://github.com/lxyovo111/paper-cage （Apache-2.0）｜对照实验：链接后加 ?llm=0，就是同一局里关掉 AI 的版本。」，现 203 字；`GET /api/v1/studio/lxyovo/six-rules` 已回读含 paper-cage。（坑：描述编辑抽屉里用换行会触发「禁止首尾输入空格」校验，改用「｜」分隔即可保存。）
- **GitHub 仓库 About 已改好**（用户 2026-11-20 手动完成，复核：desc=「《纸上牢笼》：一个玩家、七天、最多六条规矩，关住一个每夜都在找漏洞的囚犯。判定归引擎，生成归 AI。魔搭创空间可玩。」，topics=ai-game/game-jam/llm/modelscope/svg，homepage 指向创空间，Apache-2.0）。

## 作品页与手记打磨（2026-11-20 13:05–13:45）
- **封面换新**：原封面是无字案卷截图，在作品广场小卡片里几乎看不清。新封面 `tools/_cover-1400.jpg`（1400×770：大字「纸上牢笼」+ 副标 + 两行说明 + 红章「牢笼」）经 settings「编辑基础信息 → 封面图 → 裁剪 → 保存」上传成功（toast「编辑成功」）；`GET /api/v1/studio/lxyovo/six-rules` 的 CoverImage 已变为 `studio-cover_a99a324f-…jpg`。作品广场接口的 coverUrl 属缓存，稍后刷新。
- **手记三处过时事实修正**：①「后续想改进的方向」里把「跨夜记忆」从待改进改为已上线（指向第 8 节）②「自包含单文件约 100 KB」→「约 141 KB（144,538 字节）」③「音效：本版本未使用音效」→「2 条 BGM（白天/夜晚）+ 6 个事件音效，全部程序化合成，无第三方素材」。
- **手记新增第 8 节「11-20 更新：AI 的记忆与状态（补充）」**：挑路时 AI 会看到习性（看窗/手巧/怕黑/记仇）、哪条规矩拦过几次/漏过几次、路线进度、当前敌意与服从度；必须从引擎漏洞清单里挑一条并用 ≤18 字说明理由，次日报告多一行「他挑这条路，因为：…」，`?llm=0` 时该行不存在；判定一次都没变。
- **编辑路径（重要经验）**：钉钉 bi-editor 禁用了原生长选择（JS Range / 鼠标拖拽 / Ctrl+A 都选不中），`Input.insertText` 会插到点击处的模型光标，容易把新文本塞进已有句子中间（本轮曾把草稿写坏一次，已修复）。可靠做法是抓「保存草稿」的接口直接改草稿：`PUT https://modelscope.cn/api/v1/articles`（multipart；字段 Id/Type/IsCourse/GmtUpdated/Title/Description/ImageUrl/Path/Domains/Subjects/Related*/ContentDraft；ContentDraft 是编辑器 JSON：`["root",{},["p",{},leaf…],["h2",{spacing…},leaf…]]`），请求头 `X-CSRF-TOKEN` 取 cookie `csrf_token` 的 URL 解码值；PUT 成功后重载编辑器校验，再在 `/learn/editor/438502` 点「发 布」→「知道了」。脚本：`tools/_draftput2.mjs`（改草稿）、`tools/_publishpost4.mjs`（发布并回读 API）、`tools/_verifypost.mjs`（公开页复核）。
- **发布后公开页复核**：`https://modelscope.cn/posts/438502` 正文 4642 字符，含「8. 11-20 更新」「144,538」「2 条 BGM」「paper-cage」「llm=0」；旧文案「约 100 KB」「本版本未使用音效」均 0 次；「后续想改进的方向」只 1 次且无内联污染。
- **README 加「评审速览（三分钟版）」**：先玩一局看哪一行、对照 AI NPC 三条硬标准（状态可量化 / 决策可校验 / 对话与行为闭环）、 ablation 入口、代码入口；同时更新「AI 在哪」表的「挑今夜的路」行（输入含记忆与状态、输出含 ≤18 字理由、非法 id 丢弃）与 ablation 段（「因为」行消失）。

## 魔粒爆耗定位与 API Key 轮换（2026-11-20 18:00–19:00）
- **现象**：账号魔粒余额归零；2026-11-20 当日消耗 3250.5（旗舰 3212 = 1606 次 ×2、标准 38、轻量 0.5），而 11-19 旗舰 122 次、11-18 4 次、11-17 标准 243 次。
- **定位结论**：游戏模型 Qwen/Qwen3.8-27B 属**标准档（1 魔粒/次）**，当日标准档只有 38 次（= 我们自己的冒烟测试），**爆耗不是游戏本身**。真正原因：API Key 明文写在 6 个公开 GitHub 脚本里（2026-11-17 20:03 提交 7286d45 起公开，含 tools/models.mjs、think-test.mjs、compile-prompt-test.mjs、nex-test.mjs、remark-test.mjs、think-off-test.mjs），被外部拿去跑旗舰模型（消耗曲线 8→4→122→1606 次陡增吻合）。次要嫌疑 birthday-island（公开、35B-A3B），但访问量（92）撑不起 1606 次。
- **止血**：上述 6 个脚本移除硬编码 key，改为 process.env.MODELSCOPE_API_KEY || readFileSync(new URL(".ms-key", import.meta.url))；README 增加「本地调试脚本的 API Key」说明；commit **98c17b3** 已 push。HEAD 已无 key（git 历史仍保留旧 key，已作废）。
- **轮换**：新建细粒度令牌 paper-cage-2026（唯一 scope = api-inference，长期有效），新值写入 tools/.ms-key；旧令牌 lxy（已吊销，值不留档）**已删除**，直连验证旧 key → 401 Authentication failed。
- **创空间密文变量更新（重要经验）**：JSON 配置里改 secret **不会被识别为变更**（保存后抽屉显示「部署设置 0 处变更」，部署白跑）；必须走 **可视化配置** → 密文变量行内铅笔图标 → 填新值 → 保存 → 弹「是否立即重新部署」→ 重新部署 → 抽屉显示「部署设置 1 处变更 / 密文变量」→ 确认部署。本次 DeployedTime 18:52:17，18:53:31 Running。
- **验证**：部署后调用线上 /gradio_api/call/npc compile → 返回 429 insufficient balance（key 有效、余额为 0；若仍持有旧 key 应返回 401）→ **新 key 已生效**。 /play 200 / 130012 字符 / 含 report-live。
- **影响**：余额为 0 时游戏仍可玩（本地规则兜底），但 AI 层（编译/挑路/夜间独白）全部降级为模板 → 评审期需要魔粒。每日可得：登录 200 + 绑定阿里云 50 ≈ 250；创空间/文章影响力各 +50（浏览≥100 且喜欢≥5）。
- **待做（可选，省魔粒）——2026-11-20 用户决定不做，保持现状**：① ui/app.js:475 的 warm 从页面加载挪到点「进入」；② 夜间独白 remark 改本地模板（每局 21→14 次）；③ 编译按句子缓存。目标把每局 21 次调用降到 8–10 次。

## 手机横屏版式（2026-11-20 20:40–21:40）
- **背景**：手机横屏（844×390）原来落进桌面 1600×1000 版式，被压成 624×390，字小到不可读。
- **新增 `ui/landscape.js`**（画布 1180×546，操作比例贴近 844×390）：左栏平面图 440 宽 + 下方巡查报告；右栏六条狱规 + 服从度/敌意 + 右下「入夜」红章；另含横屏判决书 `renderLandscapeSettle()`。
- **`ui/intro.js`** 增 `renderIntroLandscape()`（横屏封面，标题 92px、红章「进入」、右侧提示「点击红章开始 / 建议横屏」）；页眉整体左移避开左上角静音钮。
- **`ui/app.js`** 三档 `viewMode()`（mobile / landscape / desktop），封面、正文、判决书分别走对应渲染器；夜间报告的打字排版参数改由 `#report-live` 的 `data-cfg` 自带（竖屏数值写进 mobile.js，行为不变）。
- **`styles.css`** 新增媒体查询 `(orientation:landscape) and (max-height:560px) and (max-width:1180px)`：`#stage` 按 1180/546 铺满、无阴影，写规矩弹层（`.sheet`）压缩到 92vh 内、两列示例、按钮缩小。
- **`tools/bundle.mjs`** 加入 landscape 模块；dist/index.html 从 144,538 → **165,643 字节**。
- **验证**：`node tools/dist-test.mjs` 桌面全流程 settle、errors=none；`node tools/mtest2.mjs` 竖屏 settle 正常；横屏 844×390（CDP 设备模拟，DPR 3）全流程走通：封面→进入→写规矩（AI 编译）→入夜→预判→次日巡查报告，5 行报告（含 AI「因为…」）不溢出。截图：`tools/_l2-cover.png`、`tools/_l2-sheet.png`、`tools/_l4-day1.png`、`tools/_l4-night.png`、`tools/_l2-settle.png`。
- **上线**：index.html 已上传创空间（commit d190e55a，165,643 B）→ 21:17 触发重新部署 → 21:32 Creating → **21:33 Running**；`/play` 200 且与本机 dist 逐字符一致。
- **AI 冒烟**：部署后线上 `/gradio_api/call/npc` compile 返回 `{"ok":true,"lang":{"window":{"from":1320,"to":300},...}}`（魔粒已恢复，AI 层正常；余额为 0 时会自动降级为模板）。

## 对照实验与措辞收口（2026-11-21 09:45–10:05）

**背景**：用户指出「关掉模型仍有本地兜底，不能简单说没有 AI 就无法玩」，要求把举证方式改成「同一局面下 AI 的选择如何改变策略体验」，并同步三处措辞。

**对照实验（tools/_ab-choose.mjs，同一颗种子 + 同一套规矩）**：构造 12 组「同一局面、只改他记得的事」（棋盘 = 六条全堵 / 只写两条；记忆 = 基线 / 记仇×2 / 漏过×2 / 高压）：
- 兜底版本每次都取引擎权重第一条（B1 6 次全是「医务室的窗」、B2 6 次全是「走廊的通风口」），AI 版本给出 **3 条不同路线**，与兜底不一致 **8/12 组**；
- 把「哪条规矩拦过他 / 漏过他」换一条，他就从窗改成墙或通风口（**2/5 组**）；
- **12/12 带理由行**，理由均引用被改动的那条记忆；B2 里窗口已卡 2/4，AI 仍 6/6 选它（习性压过可行性）。

**三处改动（已完成）**：
1. `README.md`：旧段「关掉 AI 会发生什么（ablation）」→「同一局面，两种选择（对照实验）」，加 4 行对照表 + 上述数字 + 「这不是『没有 AI 就玩不了』……删掉 AI 你不会输，但你会少一个可以恨、可以骗、可以读懂的人」。
2. 创作手记第 7 节（公开页 https://modelscope.cn/posts/438502 ）：原「对照实验……」段替换为三段（说明 / 12 组数字 / 不是没有 AI 就玩不了），ContentDraft PUT + 发布成功，编辑区 4,688 字符，公开页渲染含「8/12」「兜底」「同一局面，两种选择」；`/api/v1/articles/438502` 的 ContentMd 是异步缓存、短时滞后（draftHas812=true 而 md 尚未刷新），页面为准。
3. 演示视频 A/B 卡重做：`tools/_cardab2.py` → `tools/card-ab.jpg`，标题「同一夜 · 同样六条规矩」、左「AI 开着 / 他走的是「放风区的墙」/ 因为：洗衣房那条规矩拦过他两次。」、右「兜底 · ?llm=0 / 他走的是「医务室的窗」/ 按权重取第一条，不看历史。」、底部「判定一次都没变……变的只是他从哪条路走」。整片重编码 `node tools/mkfilm2.mjs tools/demo-90.mp4 tools/segments.json` → 72.87s / 5,841,240 B。
4. 创空间描述经查无「AI 不可替代」类表述（只写「判定归引擎，生成归 AI」），未改；源文档 `docs/创作手记.md` 第四节标题与 ablation 段同步改写。

**上线与验证**：demo-90.mp4 上传创空间（commit 31）→ 2026-11-21 10:00 触发重新部署 → **10:04:47 Running**；`/static/demo-90.mp4` Range 206，Content-Range `bytes 0-1/5841240`、`public, max-age=86400`；`/play` 200 / gzip 51,487 B / ETag 未变；`/healthz` ok。
**Git**：commit **7319af3**（README + docs）已 push `github.com:lxyovo111/paper-cage.git` main；视频与卡片在 tools/（仓库忽略），随创空间交付。

## 阈值行为与心情（2026-11-21 10:15–10:45，已上线）

**玩法补强（引擎判定，AI 只解释）**：
- **报复阈值**：囚犯敌意 ≥ 70 且某条规矩拦过他 ≥ 2 次 → moodOf() 返回 revenge；enumerateHoles() 给「会被该规矩堵住的路」权重 +2.0（同区域擦边 +0.5），并把候选池收窄到这些路；simulateNight() 被该规矩拦下后**不换路**（对照：低敌意时 60% 概率换路），拦截文案改为「他明知道这条规矩在，还是去撞了一次」；入夜多一行「他今晚不太对劲。他像是冲着你那条规矩来的。」
- **懈怠阈值**：狱警服从度 < 40 → revenge 优先、否则 sloppy；ruleStrength() 里大而空的规矩（全区域或全时段）强度再 ×0.5（0.55 → 约 0.26）；入夜多一行「狱警今晚没精神。大而空的规矩没人去巡。」
- **AI 侧**：ui/npc.js 把 mood 写进 memory，并把候选池收窄到 mood 为 revenge 的路（AI 仍池内自主选）；app.py 的 _choose() prompt 增加【今晚的心情】段与两条硬要求（报复时 reason 必须点名那条规矩；懈怠时要利用这一点），并声明心情是引擎按阈值给的、AI 不能选。
- **夜里多一行的排版**：ui/app.js 紧凑阈值从「>5 条」改为「>4 条」（compactAt 默认 4），并修了折行叠字：两行事件（规矩原文常见）现在按实际行数让位（rowsN * rowH），横屏 pitchCompact 24→22，保证 5 条 + 折行 + AI 独白落在 546 画布内（实测末行基线 513 / 底部 515）。

**验证**：引擎单测（宽规矩强度 obedience 100/50→0.550、39→0.259、30→0.234；敌意 85+记仇 3 时 top 权重 2.25 的被堵路 vs 敌意 30 时 1.35；两夜 progress 保持 window-1 反复撞 vs 对照第二夜清空）；dist-test.mjs settle（day7/rules6/nights6/errors=none）；mtest2.mjs 竖屏 settle + LINES 4 无错；横屏 844×390 设备模拟截图 tools/_lm-night.png（5 条含折行 + 独白不溢出）。

**发布**：app.py + dist/index.html 上传创空间（32 提交）→ 10:34 触发 → **10:38:57 Running**；/play 200 / 154,751 字符，与本机 dist 逐字符一致；线上 /gradio_api/call/npc 冒烟：revenge 返回 {"ok":true,"id":"window","reason":"撞烂那条拦我三次的工具间规矩"}（点名了那条规矩）、compile 正常。
**文档**：README 新增「阈值行为」小节与评审速览条目；创作手记第 8 节追加一段（已发布，公开页含「阈值行为（2026-11-21 补）」）；docs/创作手记.md 同步。

## 进入点击兜底与首屏阶段提示（2026-11-21 12:20–12:55，已上线）

**问题**：部分用户反馈「点了进入没反应」。排查发现封面唯一热区是红章那枚 g.cover-seal[data-act=start]（桌面 134px、竖屏约 128 CSS px），点标题/空白完全无反应；而部分设备 WebView 不合成 SVG 元素上的 click，点红章也没反应。另 start 路径没有 try/catch，若 newGame() 抛错则静默失败。

**改法（A 点击兜底 + B 首屏真实阶段）**：
1. ui/intro.js 三套封面（桌面/竖屏/横屏）都包进 g.cover-hit[data-act=start]，整张封面都是热区；红章不再需要精确点中。
2. ui/app.js 新增 #enter-fallback：真实 HTML button，position:absolute;inset:0;z-index:5 覆盖封面，SVG 点击失效的 WebView 也能进（静音钮 z-index 30 在其上，不误触）。
3. 三级事件兜底：click + touchend + pointerup（非鼠标），700ms 去重；pointerdown 立即给红章压暗反馈（#stage.starting）；Enter/空格也能开局。
4. startGame() 包 try/catch，失败在底部显示「打开失败，请刷新重试」；error/unhandledrejection 仅在封面阶段显示该提示。
5. 首屏占位分三段真实文案：正在打开案卷… → 正在铺开桌面… → 案卷已就绪（不显示假百分比）；8 秒未就绪显示「打开较慢？刷新重试」，该计时器放在 index.html 的普通脚本里，模块加载失败也生效。
6. 2.5s 兜底 bootReady()：万一 paint 抛错，至少撤掉占位露出页面与错误提示。

**验证（本地 1600×1000 鼠标 + iPhone 390×844 真 touch，CDP 设备模拟）**：
- 桌面：封面空白/标题点击 → phase=day, day=1；按下未松手 → starting=true 且仍 cover；点静音钮 → muted=true 且不误开局；点底部空白 → day。
- 竖屏：真 touch 点标题 (195,300) → day；无异常。
- 首屏失败路径：屏蔽 app.js 后 8s，页面显示「正在打开案卷… / 打开较慢？[刷新重试]」。
- node tools/dist-test.mjs settle（day7/rules6/nights6/errors=none）；node tools/mtest2.mjs 竖屏 settle + LINES 4 无错；打包产物 dist/index.html 176,899 B，含 enter-fallback / boot-stage / cover-hit。

**上线与线上验收**：上传 dist/index.html（创空间 34 提交）→ 12:39 触发 → **12:45:37 Creating → 12:47:06 Running**；/play 200 / gzip 54,908 B / ETag 变更 / 与本地 dist 逐字符一致；标记全在；304 复验 0 字节。真实平台页 iframe（1570×1019）里用 CDP 点封面空白 → phase=day, day=1（改前点空白无反应）。

**Git**：本段代码与 STATUS 同批提交并 push（见 GitHub main 最新 commit）。

## 难度调整：AI 会换路，预判不再是白送（2026-11-21 20:20–21:15，已上线）

**问题**：玩家反馈「随便都能困住他」。拆开看是三个叠加的原因：
1. 夜里的 AI 一直撞档案里那条习性路线，被玩家的窄规矩堵住也不换，等于送。
2. `predict()` 在猜错的夜晚也会把 `state.warned` 置为 true，猜错反而白送 +24% 抓捕率。
3. 预判面板只写「这条路是通的 / 没查过」，不写「被哪条规矩堵住」，玩家没有依据换路。

**改法**：
1. `game/engine.js`：`predict()` 只在猜中时设置 `warned`；猜错不再送抓捕加成。
2. `ui/npc.js`：给 AI 的漏洞清单加 `open` 与 `blockedBy`（被哪条规矩堵住）；LLM 如果挑了一条被堵的路且清单里还有通的路，规则层把它纠正到第一条通的路（`corrected: true`）；只有所有路都被堵、或心情是报复时才允许撞。
3. `app.py` 的 `_choose` prompt：清单标签改成「通 / 卡在「规矩原文」/ 他试过」，并硬性要求只要清单里有「通」的路就优先挑通的。
4. `ui/app.js` 预判面板：有 `blockedBy` 显示「堵在：规矩原文」，强度不足 0.6 时补「拦得不稳」；没有则显示「这条路是通的 / 这条路没被规矩堵住」。
5. 抓捕参数从早期 `.10/.24/.24` 调整为 **`catchBase .20 / catchObedience .30 / catchWarned .08`**；`?llm=0` 的本地兜底仍按引擎权重取第一条（可能撞上已经堵死的路），这正是 AI 开 / 关的可见差异之一。
6. 修了一个字段错位：引擎 `blockedAt` 是路线步骤叙述，`blockedBy` 才是规矩原文；面板和 prompt 原来误用了 `blockedAt`。

**平衡模拟（400 颗种子，7 夜封顶，数字为囚犯逃出率，越低说明玩家越强）**：

| 玩家策略 | 逃出率 |
| - | - |
| 不写规矩，只预判一条通的路 | 39.5% |
| 写窄规矩，只按习性预判 | 74.8% |
| 写窄规矩，每天早上按报告补昨晚的路 | 60.3% |
| 六条全时段全区域宽规矩，写完不再调整 | 93.0% |

对照早期参数：封住习性路线的玩家从 86.5% 胜率降到约 25.2%，这是本次难度提升的主要来源；看报告补路明显更强（60.3% vs 74.8% 逃出率）；写宽规矩仍然必输（93.0% 逃出）。

**验证**：
- `node tools/bundle.mjs` → dist/index.html 177,848 B；桌面 `node tools/dist-test.mjs` settle（day7/rules6/nights6/errors=none）；竖屏 `node tools/mtest2.mjs` settle + LINES 4 无错。
- AI 规则层纠正实测：`tools/_testguard.mjs` 让模型故意挑被堵的 window，夜里实际走 `wall`（第一条通的路）、`reason` 为空（本地纠正）。
- 横屏 844×390：预判面板正确显示「堵在：夜里任何人不许进入医务室」；第二天 3 行报告不溢出（`tools/_land-night2.png`）。

**上线**：上传 app.py（17,217 B）+ .upload/index.html（177,848 B）到创空间（36 提交）→ 2026-11-21 21:00 触发部署 → **21:05:21 Running**。线上验收：`/play` 200 / 159,909 字符 / 177,848 B / gzip 55,287 B / ETag W/"66b2560944256d21a956fca8"，与本机 dist 逐字符一致；`堵在`、`blockedBy`、`corrected` 等标记全在。线上 `choose` 冒烟：给 window（被堵）+ wall/vent（通）三条路，AI 返回 `{"ok":true,"id":"wall","reason":"放风时总抬头看天"}`（挑通的路且用上记忆）；`compile` 正常。

## 待办 / 可选
- 玩法/难度/夜戏已上线，桌面+手机真机夜戏验收通过；建议用户亲自再玩一局确认难度手感（尤其第 4 夜起的一夜两步）
- 音频听感验收：需要人耳确认音量配比（BGM 0.16/0.20，音效 0.35–0.65）是否合适，可再调
- 暂无人耳验收：真实浏览器已确认音频文件加载与静音切换，实际出声需一台有声设备
- 真人试玩：`docs/试玩说明.md` 可转发，收回 5 个问题后修 top2
- 魔粒：余额 0，需每日登录/绑定阿里云补（或按上方「省魔粒」改造降耗）；birthday-island 仍用旧 key 作 secret，旧令牌删除后其 AI 会失效（按用户要求不处理）
- 人气奖：封面已换新；`docs/小红书-第二篇.md` + `tools/xhs-1..3.jpg`、`docs/小红书-第三篇-第二晚.md` + `tools/x2-card1..5.jpg` 待发布；广场 our likes=0（榜首约 12），需要拉赞
- DGX 云节点未申请（不申请不影响参赛）

## 复现命令
- 重新打包：`node tools/bundle.mjs` → dist/index.html
- 本地跑：`node server.mjs` → http://127.0.0.1:7861/dist/index.html
- 无头回归：`node tools/dist-test.mjs`
- 难度模拟：`node tools/_sweep3.mjs`（400 颗种子，多策略参数扫描；最新参数 b20o30w08：不写规矩 39.5% / 只看档案 74.8% / 看报告补路 60.3% / 静态六条 93.0% 逃出）
- 视频重拼：`node tools/gen-segments.mjs && node tools/mkfilm2.mjs tools/demo-90.mp4 tools/segments.json`
- 部署：`node tools/_upload-mdj.mjs "<绝对路径>"` 上传（只接受平铺文件）→ `node tools/_deploynow.mjs` 触发（settings → 重新部署 → 确认部署）→ `node tools/_watch-deploy2.mjs <旧DeployedTime>` 轮询到 Running（约 5–16 分钟）
- 线上校验：`node tools/_verify-ab.mjs`（/play 头与标记、gzip、304、与本地 dist 逐字符比对）