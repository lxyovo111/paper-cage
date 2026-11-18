# 《纸上牢笼》· 交付状态（2026-11-18 12:40）

## 公开链接
- 试玩（创空间）：https://modelscope.cn/studios/lxyovo/six-rules
- 游戏直出页（创空间内 iframe）：https://lxyovo-six-rules.ms.show/play
- 演示视频（90 秒，含开/关 AI 对照）：https://lxyovo-six-rules.ms.show/static/demo-90.mp4 （200 / video/mp4 / 5.5 MB）
- 创作手记（开发者实践）：https://modelscope.cn/posts/438502
  - 标题《纸上牢笼》创作手记 · 专题「AI+赛事」· 标签「基础模型LLM」· 封面为标题卡
- 参赛报名：已审核通过（小红书方案 https://xhslink.cn/o/Afux7g4n5JK）
- 作品提交：**已删除重提**——旧作品「第七夜」（2026/11/17 19:25 提交、已审核通过）因平台锁定作品名无法编辑，2026/11/18 12:41:11 删除后以《纸上牢笼》重新提交，**待审核**（作品 id `09b83cbe-4048-4694-9a47-888538b12981`；旧提交数据备份 `tools/submission-backup.json`）

## 已交付
- 游戏本体：单文件自包含 dist/index.html（~132 KB），确定性规则引擎 + SVG 全屏 UI + 夜戏动画
- AI 语言层：魔搭 API Inference（Qwen/Qwen3.8-27B，关思维链），三处用途 = 编译规矩 / 在引擎漏洞清单里挑路线 / 夜间一句独白；全部有本地兜底，界面不阻塞
- 演示视频：72.87s / 1600×1000 / 5.84 MB，结构 = 标题卡 → 写规矩+AI 校准 → 第一夜 → 第二夜被规矩堵住 → A/B 对照卡 → 快进七天 → 判决书 → 尾卡
- 创作手记：六节官方模板，3742 字，含试玩/视频/工具实测数据（0.7–2.7s vs 25s+）；2026-11-18 已改名为《纸上牢笼》并修复一次正文重复事故（现正文单份、6 节齐全）
- 手机竖屏版式（20:32 上线）：`ui/mobile.js` 纵向版式，一屏不滚动；桌面/横屏仍是横版
- 进入界面（封面，`ui/intro.js`）：桌面 1600×1000 / 手机 800×1840，红章「进入」即开始；`?intro=0` 可跳过
- 美术接手说明：`docs/美术与进入界面-接手说明.md`（给外部 AI/美术的契约与验收清单）
- 开源仓库：https://github.com/lxyovo111/seventh-night （Apache-2.0，改名同步 commit 1fec50b）
- 试玩物料：`docs/试玩说明.md`（可直接转发，含 5 个反馈问题）
- 人气奖物料：`docs/小红书-第二篇.md` + 配图 `tools/xhs-1.jpg` / `xhs-2.jpg` / `xhs-3.jpg`

## 待办 / 可选
- 等《纸上牢笼》重新审核通过（上次约半天），通过后核对作品广场卡片名称
- 真人试玩：`docs/试玩说明.md` 可转发，收回 5 个问题后修 top2
- 人气奖：`docs/小红书-第二篇.md` + `tools/xhs-1..3.jpg` 待发布
- DGX 云节点未申请（不申请不影响参赛）

## 复现命令
- 重新打包：`node tools/bundle.mjs` → dist/index.html
- 本地跑：`node server.mjs` → http://127.0.0.1:7861/dist/index.html
- 无头回归：`node tools/dist-test.mjs`
- 平衡模拟：`node tools/seedscan2.mjs`（120 局：铁壁32/账本29/记得30/失守29）
- 视频重拼：`node tools/gen-segments.mjs && node tools/mkfilm2.mjs tools/demo-90.mp4 tools/segments.json`
- 部署：settings 页 → upload3.mjs → redeploy6.mjs（约 10 分钟）
