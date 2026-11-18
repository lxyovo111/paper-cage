# 游戏内音频

本目录是音频的源文件与试听材料；游戏运行时用的是项目根目录下的 8 个 mp3（由 FastAPI 的 `/static/` 提供）。

## 运行时会用到的文件

| 项目根文件 | 用途 | 来源 |
|---|---|---|
| `audio-day.mp3` | 白天 / 写规矩时的底噪 | `bz\声音试听小样\配乐-白天案卷.wav`，程序化合成（NumPy），36s，循环 |
| `audio-night.mp3` | 入夜后的底噪 | `bz\声音试听小样\配乐-夜间巡视.wav`，程序化合成，36s，循环 |
| `sfx-stamp.mp3` | 红章进入 / 写下规矩 / 重开 | `音效-印章.wav`，程序化合成，0.65s |
| `sfx-paper.mp3` | 归档完毕、判定条出现 | `音效-翻页.wav`，1.05s |
| `sfx-pen.mp3` | 点「归 档」时 | `音效-笔划.wav`，1.2s |
| `sfx-lights.mp3` | 熄灯 / 入夜转场 | `音效-熄灯.wav`，0.5s |
| `sfx-steps.mp3` | 夜里他开始走动 | `音效-脚步.wav`，2.4s |
| `sfx-verdict.mp3` | 判决书落下 | 本项目 `tools/audio_gen.py` 的 `sfx-5-verdict`，2.6s |

## 版权与来源

- 两段配乐与五段音效来自 `C:\Users\lcj\Desktop\bz\声音试听小样\`，由 `make_audio.py` 用 NumPy 从数学波形与噪声合成，**没有使用第三方采样、录音或素材库**。该脚本已复制到本目录 `make_audio_bz.py` 以便复现。
- `sfx-verdict.mp3` 来自本项目 `tools/audio_gen.py`，同样是程序化合成。
- 未使用 Pixabay 或其他第三方音频。交接包里那段 Pixabay 盖章（`stamp-102627.mp3`）没有进游戏，避免开源再分发与 Content ID 的风险。
- 转换命令（ffmpeg）：配乐 `-b:a 96k`，音效 `-b:a 128k`，统一 44.1kHz，输出到项目根目录。

## 接线

- 逻辑在 `ui/audio.js`：两条 BGM 交叉淡入（900ms），音效按事件播放，首次用户操作后才启动。
- 静音开关是页面左上角的小圆钮（`#mute-btn`），状态存 `localStorage['cage-muted']`。
- 本地 `server.mjs` 把 `/static/*` 映射到项目根，和创空间的 FastAPI `StaticFiles` 行为一致。
