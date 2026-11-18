# 《纸上牢笼》· 交付状态（2026-11-18 23:11）

## 公开链接
- 试玩（创空间）：https://modelscope.cn/studios/lxyovo/six-rules
- 游戏直出页（创空间内 iframe）：https://lxyovo-six-rules.ms.show/play
- 演示视频（90 秒，含开/关 AI 对照）：https://lxyovo-six-rules.ms.show/static/demo-90.mp4 （200 / video/mp4 / 5.5 MB）
- 创作手记（开发者实践）：https://modelscope.cn/posts/438502
  - 标题《纸上牢笼》创作手记 · 专题「AI+赛事」· 标签「基础模型LLM」· 封面为标题卡
- 参赛报名：已审核通过（小红书方案 https://xhslink.cn/o/Afux7g4n5JK）
- 作品提交：旧作品「第七夜」因平台锁定作品名无法编辑，2026/11/18 12:41:11 删除后以《纸上牢笼》重新提交；**2026-11-18 约 15:30 审核通过**（作品 id `09b83cbe-4048-4694-9a47-888538b12981`，review_result=passed；旧提交数据备份 `tools/submission-backup.json`）
- 作品广场：搜索「纸上牢笼」可见卡片（名称、简介、创空间、手记链接齐全）

## 已交付
- 游戏本体：单文件自包含 dist/index.html（~132 KB），确定性规则引擎 + SVG 全屏 UI + 夜戏动画
- AI 语言层：魔搭 API Inference（Qwen/Qwen3.8-27B，关思维链），三处用途 = 编译规矩 / 在引擎漏洞清单里挑路线 / 夜间一句独白；全部有本地兜底，界面不阻塞
- 演示视频：72.87s / 1600×1000 / 5.84 MB，结构 = 标题卡 → 写规矩+AI 校准 → 第一夜 → 第二夜被规矩堵住 → A/B 对照卡 → 快进七天 → 判决书 → 尾卡
- 创作手记：六节官方模板，3742 字，含试玩/视频/工具实测数据（0.7–2.7s vs 25s+）；2026-11-18 已改名为《纸上牢笼》并修复一次正文重复事故（现正文单份、6 节齐全）
- 手机竖屏版式（20:32 上线）：`ui/mobile.js` 纵向版式，一屏不滚动；桌面/横屏仍是横版
- **玩法与路线优化（22:2x，部署中）**：四条人物习性（看窗/手巧/怕黑/记仇，按种子抽一条，开局给第一份情报）；路线情报系统（他走过一次才算摸清，未知路在预判面板上显示「没查过这条路」）；提审（1 AP、敌意+6）与加派夜巡（2 AP、多一班）各换一条情报；物品跨夜留在口袋（被抓住搜身清空）；同一条规矩拦两次他必换路；漏过的规矩下次更松；结算判词点出他最后是从哪条路出去的
- **难度与夜戏（本轮，22:57 上线，commit a40a13f0）**：第四夜起他一夜走两步（`PARAMS.rushFromDay=4`）；IMPROV 五条路线门槛下调（door/rope 第2夜起、copy/sick 第3夜、riot 第4夜）；同一句话拦他越多，他越熟悉（`rule.wear` 每次 −10%，最多 −55%）；夜路行走动画从 2s 放慢到 3.4s（CSS offset-path 重写，修掉 SMIL 时间轴从页面加载起算导致小像瞬移到终点的问题），报告行间隔 760→950ms。两步夜报告改为紧凑排版（时间 11 / 正文 14，行距 24；先省掉「熄灯」一行，保证两个动作 + 被拦/被抓 + AI 独白都放得下；修过一个判断顺序 bug——必须先按原始事件数判紧凑、再删行，否则删完又落回宽松排版、最后一条被挤掉）。平衡：反应式玩家 120 局逃逸 60%（失守72/账本37/铁壁7/记得4）、静态六条 84%。最新部署（含紧凑报告）：/play 200 / 128437 字节，含 offset-path / scale(1.18) / rushFromDay / 音频；桌面与手机真浏览器夜戏复测通过（tools/live/desktop-2.png、tools/live/mobile-2.png），两步夜紧凑报告桌面/手机截图 tools/reportfit7/desk-13.png、tools/reportfit8/desk-12.png
- 音频（21:5x 接入，21:56 上线验收）：两条 BGM（白天案卷 / 夜间巡视）+ 6 个事件音效，全部程序化合成（无第三方素材）；`ui/audio.js` 交叉淡入、静音开关、首次交互后启动；文件为项目根 `audio-*.mp3` / `sfx-*.mp3`，由 `/static/` 提供，来源见 `docs/audio/README.md`；线上 `/static/*.mp3` 8 个文件均 200 / audio/mpeg，真实浏览器加载 audio-day / audio-night / sfx-stamp 成功，`#mute-btn` 可切换静音
- 进入界面（封面，`ui/intro.js`）：桌面 1600×1000 / 手机 800×1840，红章「进入」即开始；`?intro=0` 可跳过
- 美术接手说明：`docs/美术与进入界面-接手说明.md`（给外部 AI/美术的契约与验收清单）
- 开源仓库：https://github.com/lxyovo111/seventh-night （Apache-2.0，改名同步 commit 1fec50b）
- 试玩物料：`docs/试玩说明.md`（可直接转发，含 5 个反馈问题）
- 人气奖物料：`docs/小红书-第二篇.md` + 配图 `tools/xhs-1.jpg` / `xhs-2.jpg` / `xhs-3.jpg`

## 待办 / 可选
- 玩法/难度/夜戏已上线，桌面+手机真机夜戏验收通过；建议用户亲自再玩一局确认难度手感（尤其第 4 夜起的一夜两步）
- 音频听感验收：需要人耳确认音量配比（BGM 0.16/0.20，音效 0.35–0.65）是否合适，可再调
- 暂无人耳验收：真实浏览器已确认音频文件加载与静音切换，实际出声需一台有声设备
- 真人试玩：`docs/试玩说明.md` 可转发，收回 5 个问题后修 top2
- 人气奖：`docs/小红书-第二篇.md` + `tools/xhs-1..3.jpg` 待发布
- DGX 云节点未申请（不申请不影响参赛）

## 复现命令
- 重新打包：`node tools/bundle.mjs` → dist/index.html
- 本地跑：`node server.mjs` → http://127.0.0.1:7861/dist/index.html
- 无头回归：`node tools/dist-test.mjs`
- 平衡模拟：`node tools/seedscan2.mjs`（120 局，反应式玩家；最新：失守72/账本37/铁壁7/记得4，逃逸 60%）；`node tools/seedscan.mjs`（静态六条，逃逸 84%）
- 视频重拼：`node tools/gen-segments.mjs && node tools/mkfilm2.mjs tools/demo-90.mp4 tools/segments.json`
- 部署：settings 页 → upload3.mjs → redeploy6.mjs（约 10 分钟）
