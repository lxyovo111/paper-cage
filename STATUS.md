# 《纸上牢笼》· 交付状态（2026-11-20 12:55）

## 公开链接
- 试玩（创空间）：https://modelscope.cn/studios/lxyovo/six-rules
- 游戏直出页（创空间内 iframe）：https://lxyovo-six-rules.ms.show/play （2026-11-20 04:46 重新部署成功：200 / 130012 字符 / 含 report-live）
- 演示视频（90 秒，含开/关 AI 对照）：https://lxyovo-six-rules.ms.show/static/demo-90.mp4 （200 / video/mp4 / 5.5 MB）
- 创作手记（开发者实践）：https://modelscope.cn/posts/438502
  - 标题《纸上牢笼》创作手记 · 专题「AI+赛事」· 标签「基础模型LLM」· 封面为标题卡
- 参赛报名：已审核通过（小红书方案 https://xhslink.cn/o/Afux7g4n5JK）
- 作品提交：旧作品「第七夜」因平台锁定作品名无法编辑，2026/11/18 12:41:11 删除后以《纸上牢笼》重新提交，2026-11-18 约 15:30 审核通过。2026-11-19 12:25 再次删除并重新提交，简介换成第三版「我把 AI 关进监狱，第一晚他就摸到了门。……」（创空间描述与手记简介同步为该版）→ 新作品 id `ad9e646f-0e72-4387-bf92-e3ceddadb9b6`，提交时间 2026/11/19 12:22:32，**2026-11-19 13:11:31 审核通过**（`review_result=passed`、`is_public=1`、`reviewed_at=1795065091`）；监听脚本 `tools/review-watch.mjs`（日志 `tools/review-watch.log` 末行 `RESULT passed`）。旧提交数据备份 `tools/submission-backup.json`。审核通过截图 `tools/sub-approved.png`（赛事首页横幅「审核通过，去提交作品」）
- 作品广场：**已恢复可见**（`/api/works` 第 1 页即见），卡片名「纸上牢笼」、简介为第三版、分类「Gradio 应用」、封面为案卷封面；当前广场共 148 个作品，我们创空间 visits=767 / stars=0 / likes=0 / hot_score=76.7。已通过的提交信息锁定（平台规则：审核通过后改简介需删除重提，慎用）

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
- **仍需人处理**：GitHub 仓库 `lxyovo111/paper-cage` 的 About 简介还是旧文《第七夜》——自动化点击 edit 按钮不弹窗（可见按钮点不动、settings 页无 description 字段、页面内 fetch PATCH 因无 csrf token 返回 no-token），请手动改为：《纸上牢笼》：一个玩家、七天、最多六条规矩，关住一个每夜都在找漏洞的囚犯。判定归引擎，生成归 AI。魔搭创空间可玩。

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
