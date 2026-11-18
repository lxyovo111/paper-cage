import numpy as np, wave, os
SR = 44100
AUD = "C:/Users/lcj/Desktop/tap/six-rules/docs/audio"
TMP = "C:/Users/lcj/Desktop/tap/six-rules/tools/audio-ref"
TOOLS = "C:/Users/lcj/Desktop/tap/six-rules/tools"
from PIL import Image, ImageDraw, ImageFont

def read_wav(p):
    with wave.open(p, "rb") as w:
        n = w.getnframes(); ch = w.getnchannels()
        d = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768.0
    if ch == 2: return d[0::2].copy(), d[1::2].copy()
    return d.copy(), d.copy()

def rms(x): return float(np.sqrt((x * x).mean()) + 1e-12)
def db(x): return 20 * np.log10(rms(x) + 1e-12)
def centroid(x):
    seg = x[int(SR*0.2):int(SR*1.2)] if x.size > int(SR*1.4) else x
    if seg.size < 1024: return 0.0
    sp = np.abs(np.fft.rfft(seg * np.hanning(seg.size)))
    fr = np.fft.rfftfreq(seg.size, 1.0 / SR)
    return float((sp * fr).sum() / (sp.sum() + 1e-9))

def fade(x, fin=0.01, fout=0.06):
    n = x.size; a = min(int(fin*SR), n//2); b = min(int(fout*SR), n//2)
    if a: x[:a] *= np.linspace(0,1,a)
    if b: x[-b:] *= np.linspace(1,0,b)
    return x

def best_window(x, want):
    n = int(SR * want)
    if x.size <= n: return fade(x.copy())
    step = int(SR * 0.1); best = 0; bi = 0
    for i in range(0, x.size - n, step):
        e = np.sqrt((x[i:i+n] ** 2).mean())
        if e > best: best = e; bi = i
    return fade(x[bi:bi+n].copy())

def fit(x, target_db=-20.0, peak=0.92):
    y = x * (10 ** (target_db / 20.0)) / rms(x)
    m = np.max(np.abs(y))
    if m > peak: y *= peak / m
    return y

clips = []
mine_stamp_L, mine_stamp_R = read_wav(os.path.join(AUD, "sfx-1-stamp.wav"))
pb_L, pb_R = read_wav(os.path.join(TMP, "pixabay-stamp.wav"))
mine_paper_L, mine_paper_R = read_wav(os.path.join(AUD, "sfx-2-paper.wav"))
ref_paper_L, ref_paper_R = read_wav(os.path.join(TMP, "cc0-wrapping-paper.wav"))
mine_bgm_L, mine_bgm_R = read_wav(os.path.join(AUD, "bgm-archive.wav"))
ref_bgm_L, ref_bgm_R = read_wav(os.path.join(TMP, "cc0-spinning-piano-chords.wav"))

def mk(name, label, L, R, tdb, note):
    clips.append((name, label, L, R, tdb, note))

mk("A1 合成 盖章", "合成 盖章", mine_stamp_L, mine_stamp_R, -20, "1.0s")
mk("B1 Pixabay 盖章", "Pixabay 盖章", pb_L, pb_R, -20, "0.6s")
mk("A2 合成 翻纸", "合成 翻纸", mine_paper_L, mine_paper_R, -20, "0.95s")
mk("B2 CC0 包装纸", "CC0 包装纸", best_window(ref_paper_L, 1.4), best_window(ref_paper_R, 1.4), -20, "1.4s")
mk("A3 合成 背景音乐", "合成 背景音乐", mine_bgm_L[:int(SR*16)], mine_bgm_R[:int(SR*16)], -23, "16s")
mk("B3 CC0 钢琴和弦", "CC0 钢琴和弦", fade(ref_bgm_L[int(SR*4):int(SR*20)]), fade(ref_bgm_R[int(SR*4):int(SR*20)]), -23, "16s")

gap = int(SR * 1.2)
lead = int(SR * 0.4)
total = lead + sum(c[2].size for c in clips) + gap * (len(clips) - 1) + int(SR * 0.6)
L = np.zeros(total); R = np.zeros(total)
pos = lead
marks = []
for name, label, a, b, tdb, note in clips:
    a = fit(a, tdb); b = fit(b, tdb)
    L[pos:pos + a.size] += a; R[pos:pos + b.size] += b
    marks.append((name, label, pos / SR, a.size / SR, note, a))
    pos += a.size + gap

def wavwrite(path, L, R):
    inter = np.empty(L.size * 2, dtype=np.int16)
    inter[0::2] = (np.clip(L, -1, 1) * 32767).astype(np.int16)
    inter[1::2] = (np.clip(R, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(inter.tobytes())

wavwrite(os.path.join(AUD, "ab-audition.wav"), L, R)
print("AB", round(total / SR, 2))
print("STATS pixabay_stamp db", round(db(pb_L), 1), "centroid", round(centroid(pb_L)))
print("STATS synth_stamp db", round(db(mine_stamp_L), 1), "centroid", round(centroid(mine_stamp_L)))
print("STATS ref_paper db", round(db(ref_paper_L), 1), "centroid", round(centroid(ref_paper_L)))
print("STATS ref_piano db", round(db(ref_bgm_L), 1), "centroid", round(centroid(ref_bgm_L)))
for m in marks: print("MARK", m[0], round(m[2], 2), round(m[3], 2))

W, H = 1600, 1080
img = Image.new("RGB", (W, H), (232, 220, 192))
d = ImageDraw.Draw(img)
fb = ImageFont.truetype("C:/Windows/Fonts/simkai.ttf", 42)
fs = ImageFont.truetype("C:/Windows/Fonts/simsun.ttc", 24)
fl = ImageFont.truetype("C:/Windows/Fonts/simsun.ttc", 18)
d.text((80, 46), "纸上牢笼 · 音效 A/B 对比", font=fb, fill=(34, 29, 25))
d.text((82, 106), "合成原创 vs 交接包 / CC0 真实录音 · 未接入游戏", font=fs, fill=(126, 111, 92))
d.line([80, 152, 1520, 152], fill=(64, 55, 45), width=2)
y = 186
for name, label, t, dur, note, a in marks:
    col = (136, 46, 31) if name.startswith("A") else (52, 74, 60)
    d.text((80, y), name, font=fs, fill=(34, 29, 25))
    d.text((80, y + 32), str(round(t, 1)) + "s 起 · " + note, font=fl, fill=(126, 111, 92))
    seg = a[:int(SR * 4.0)]
    step = max(1, seg.size // 1080)
    top = float(np.max(np.abs(seg))) + 1e-9
    pts = []
    for k in range(min(1080, seg.size // step)):
        v = float(np.max(np.abs(seg[k*step:(k+1)*step]))) / top
        pts.append((330 + k, y + 30 - v * 26))
    if len(pts) > 1: d.line(pts, fill=col, width=2)
    y += 140
img.save(os.path.join(TOOLS, "audio-ab-sheet.png"))
print("AB SHEET ok")