# 《纸上牢笼》· 交付状态（2026-11-20 21:45）

## 公开链接
- 试玩（创空间）：https://modelscope.cn/studios/lxyovo/six-rules
- 游戏直出页（创空间内 iframe）：https://lxyovo-six-rules.ms.show/play （2026-11-20 21:33 重新部署成功：200 / 150298 字符 / 含 report-live + 手机横屏版式；内容与本机 dist/index.html 逐字符一致）
- 演示视频（90 秒，含开/关 AI 对照）：https://lxyovo-six-rules.ms.show/static/demo-90.mp4 （200 / video/mp4 / 5.5 MB）
- 创作手记（开发者实践）：https://modelscope.cn/posts/438502
  - 标题《纸上牢笼》创作手记 · 专题「AI+赛事」· 标签「基础模型LLM」· 封面为标题卡
- 参赛报名：已审核通过（小红书方案 https://xhslink.cn/o/Afux7g4n5JK）
- 作品提交：旧作品「第七夜」因平台锁定作品名无法编辑，2026/11/18 12:41:11 删除后以《纸上牢笼》重新提交，2026-11-18 约 15:30 审核通过。2026-11-19 12:25 再次删除并重新提交，简介换成第三版「我把 AI 关进监狱，第一晚他就摸到了门。……」（创空间描述与手记简介同步为该版）→ 新作品 id `ad9e646f-0e72-4387-bf92-e3ceddadb9b6`，提交时间 2026/11/19 12:22:32，**2026-11-19 13:11:31 审核通过**（`review_result=passed`、`is_public=1`、`reviewed_at=1795065091`）；监听脚本 `tools/review-watch.mjs`（日志 `tools/review-watch.log` 末行 `RESULT passed`）。旧提交数据备份 `tools/submission-backup.json`。审核通过截图 `tools/sub-approved.png`（赛事首页横幅「审核通过，去提交作品」）
- 作品广场：**已恢复可见**（`/api/works` 第 1 页即见），卡片名「纸上牢笼」、简介为第三版、分类「Gradio 应用」、封面为案卷封面；当前广场共 148 个作品，我们创空间 visits=767 / stars=0 / likes=0 / hot_score=76.7。已通过的提交信息锁定（平台规则：审核通过后改简介需删除重提，慎用）

## 已交付
- 游戏本体：单文件自包含 dist/index.html（144,538 字节，约 141 KB），确定性规则引擎 + SVG 全屏 UI + 夜戏动画
- AI 语言层：魔搭 API Inference（Qwen/Qwen3.8-27B，关思维链），三处用途 = 编译规矩 / 在引擎漏洞清单里挑路线 / 夜间一句独白；全部有本地兜底，界面不阻塞
- 演示视频：72.87s / 1600×1000 / 5.84 MB，结构 = 标题卡 → 写规矩+AI 校准 → 第一夜 → 第二夜被规矩堵住 → A/B 对照卡 → 快进七天 → 判决书 → 尾卡
- 创作手记：六节官方模板 + 第 7 节「开源与对照实验」+ 第 8 节「11-20 更新：AI 的记忆与状态」；公开页正文约 4.6 千字符，含试玩/视频/工具实测数据（0.7–2.7s vs 25s+）；2026-11-18 已改名为《纸上牢笼》并修复一次正文重复事故（现正文单份、8 节齐全）
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
- 平衡模拟：`node tools/seedscan2.mjs`（120 局，反应式玩家；最新：失守72/账本37/铁壁7/记得4，逃逸 60%）；`node tools/seedscan.mjs`（静态六条，逃逸 84%）
- 视频重拼：`node tools/gen-segments.mjs && node tools/mkfilm2.mjs tools/demo-90.mp4 tools/segments.json`
- 部署：settings 页 → upload3.mjs → redeploy6.mjs（约 10 分钟）
