import numpy as np, wave, os
from PIL import Image, ImageDraw, ImageFont

SR = 44100
OUT = "C:/Users/lcj/Desktop/tap/six-rules/docs/audio"
TOOLS = "C:/Users/lcj/Desktop/tap/six-rules/tools"
os.makedirs(OUT, exist_ok=True)

def wavwrite(path, L, R):
    L = np.clip(L, -1, 1); R = np.clip(R, -1, 1)
    inter = np.empty(L.size * 2, dtype=np.int16)
    inter[0::2] = (L * 32767).astype(np.int16)
    inter[1::2] = (R * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(inter.tobytes())

def noise(n, seed=1):
    return np.random.default_rng(seed).normal(0.0, 1.0, n)

def fir(fc, taps=257):
    if fc >= SR / 2 * 0.98:
        return np.array([1.0])
    m = np.arange(taps) - (taps - 1) / 2.0
    h = np.sinc(2.0 * fc / SR * m) * np.hamming(taps)
    h /= h.sum()
    return h

def conv(x, h):
    return np.convolve(x, h, mode="same")

def lp(x, fc):
    return conv(x, fir(fc))

def hp(x, fc):
    return x - lp(x, fc)

def bp(x, f1, f2):
    return hp(lp(x, f2), f1)

def envad(n, a, d):
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1.0) * np.exp(-np.maximum(t - a, 0.0) / max(d, 1e-4))
    return e

def fade_edges(x, fin=0.004, fout=0.05):
    n = x.size
    a = min(int(fin * SR), n // 2); b = min(int(fout * SR), n // 2)
    if a > 0: x[:a] *= np.linspace(0, 1, a)
    if b > 0: x[-b:] *= np.linspace(1, 0, b)
    return x

def add(dst, src, at):
    i = int(at * SR)
    n = min(src.size, dst.size - i)
    if n > 0: dst[i:i+n] += src[:n]

def fftconv(x, h):
    n = x.size + h.size - 1
    N = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(h, N), N)
    return y[:x.size]

def reverb(x, decay=0.45, mix=0.22, seed=11):
    n = int(SR * 0.9)
    ir = noise(n, seed) * np.exp(-np.arange(n) / SR / decay)
    ir = lp(ir, 5200)
    ir /= np.sqrt((ir * ir).sum()) + 1e-9
    wet = fftconv(x, ir)
    r = np.sqrt((x * x).mean()) + 1e-9
    wet *= r / (np.sqrt((wet * wet).mean()) + 1e-9)
    return x * (1 - mix) + wet * mix

def norm(x, peak=0.85):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 1e-9 else x

def widen(mono, amount=0.35):
    d = int(0.011 * SR)
    right = np.copy(mono)
    right[d:] = mono[:-d]
    return mono, mono * (1 - amount) + right * amount

def save(name, x, peak=0.85, width=0.25, seam=False):
    x = np.asarray(x, dtype=np.float64)
    if seam and x.size > 2000:
        k = int(0.05 * SR)
        w = np.linspace(0, 1, k)
        x[-k:] = x[-k:] * (1 - w) + x[:k][::-1] * w
    x = norm(fade_edges(x), peak)
    Lc, Rc = widen(x, width)
    wavwrite(os.path.join(OUT, name + ".wav"), Lc, Rc)
    return Lc, Rc

def build_stamp():
    n = int(SR * 1.0); t = np.arange(n) / SR
    click = hp(noise(n, 5), 2200) * envad(n, 0.0006, 0.015)
    body = np.sin(2 * np.pi * (78 * np.exp(-t * 7.0) + 42) * t) * envad(n, 0.002, 0.11)
    crunch = bp(noise(n, 7), 650, 2800) * envad(n, 0.004, 0.085)
    x = 0.9 * body + 0.55 * crunch + 0.3 * click
    return save("sfx-1-stamp", reverb(x, 0.4, 0.2), 0.85, 0.2)

def build_paper():
    n = int(SR * 0.95); x = np.zeros(n)
    for k in range(5):
        seg = int(SR * (0.10 + 0.05 * k))
        at = 0.02 + 0.14 * k + 0.03 * (k % 2)
        b = bp(noise(seg, 20 + k), 1400 + 500 * k, 6500) * envad(seg, 0.008, 0.06)
        add(x, b * (0.9 - 0.1 * k), at)
    return save("sfx-2-paper", reverb(x, 0.25, 0.14), 0.8, 0.35)

def build_pencil():
    n = int(SR * 1.6); t = np.arange(n) / SR
    nz = bp(noise(n, 31), 2600, 9000)
    am = 0.55 + 0.3 * np.sin(2 * np.pi * 6.5 * t) + 0.15 * np.sin(2 * np.pi * 0.7 * t + 1.3)
    e = np.minimum(t / 0.08, 1.0) * np.minimum((t[-1] - t) / 0.12 + 0.0001, 1.0)
    x = nz * np.clip(am, 0.05, 1.0) * np.clip(e, 0, 1)
    x = lp(x, 7000)
    return save("sfx-3-pencil", norm(x, 0.5), 0.5, 0.15, seam=True)

def build_night():
    n = int(SR * 3.2); t = np.arange(n) / SR
    wind = bp(noise(n, 41), 110, 900) * envad(n, 1.1, 1.3)
    drop = np.sin(2 * np.pi * (95 * np.exp(-t * 0.9) + 38) * t) * envad(n, 0.4, 1.6)
    room = lp(noise(n, 43), 350) * envad(n, 0.6, 2.0)
    x = 0.5 * wind + 0.55 * drop + 0.3 * room
    return save("sfx-4-night", reverb(x, 0.7, 0.32), 0.8, 0.4)

def build_verdict():
    n = int(SR * 2.6); t = np.arange(n) / SR
    slide = bp(noise(n, 51), 800, 5200) * envad(n, 0.02, 0.22)
    thud = np.sin(2 * np.pi * (62 * np.exp(-t * 8) + 40) * t) * envad(n, 0.003, 0.18)
    bell = np.zeros(n)
    for f, d, g in [(196.0, 1.7, 0.34), (293.7, 1.2, 0.2), (392.0, 0.9, 0.12)]:
        bell += g * np.sin(2 * np.pi * f * t) * envad(n, 0.01, d)
    x = 0.6 * slide + 0.7 * thud + bell * 0.55
    return save("sfx-5-verdict", reverb(x, 0.75, 0.28), 0.85, 0.3)

def build_enter():
    n = int(SR * 1.8); t = np.arange(n) / SR
    press = bp(noise(n, 61), 500, 3200) * envad(n, 0.004, 0.12)
    thud = np.sin(2 * np.pi * (88 * np.exp(-t * 9) + 44) * t) * envad(n, 0.002, 0.2)
    chime = np.zeros(n)
    for f, d, g in [(523.25, 1.1, 0.16), (783.99, 0.8, 0.1), (1046.5, 0.6, 0.06)]:
        chime += g * np.sin(2 * np.pi * f * t) * envad(n, 0.006, d)
    x = 0.8 * thud + 0.5 * press + chime
    return save("sfx-6-enter", reverb(x, 0.6, 0.26), 0.8, 0.25)

def pad_note(freq, dur, gain, detune=0.0):
    n = int(SR * dur); t = np.arange(n) / SR
    f = freq * (1 + detune)
    x = np.sin(2 * np.pi * f * t) + 0.32 * np.sin(2 * np.pi * 2 * f * t) + 0.10 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(t / 3.0, 1.0) * np.exp(-np.maximum(t - 3.0, 0.0) / 4.0)
    return x * e * gain

def build_bgm():
    chords = [
        (45, [57, 60, 64]),
        (41, [53, 57, 60]),
        (48, [55, 60, 64]),
        (43, [55, 59, 62]),
    ]
    cd = 18.0; total = int(SR * (cd * 4 + 6))
    mix = np.zeros(total)
    for i, (root, triad) in enumerate(chords):
        at = i * cd
        seg = pad_note(440.0 * 2 ** ((root - 69) / 12.0) / 2, cd + 5, 0.16)
        add(mix, seg, at)
        for j, m in enumerate(triad):
            f = 440.0 * 2 ** ((m - 69) / 12.0)
            add(mix, pad_note(f, cd + 5, 0.075, 0.0012), at)
            add(mix, pad_note(f, cd + 5, 0.06, -0.0015), at)
    rng = np.random.default_rng(77)
    penta = [69, 72, 74, 76, 79, 81]
    tpos = 4.0
    mel = np.zeros(total)
    while tpos < cd * 4 - 3:
        m = penta[int(rng.integers(0, len(penta)))]
        f = 440.0 * 2 ** ((m - 69) / 12.0)
        nn = int(SR * 3.0); tt = np.arange(nn) / SR
        note = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt / 1.1) * np.minimum(tt / 0.006, 1.0) * 0.055
        add(mel, note, tpos)
        tpos += 2.6 + float(rng.random()) * 2.4
    tex = np.zeros(total)
    tp = 7.0
    while tp < cd * 4:
        nn = int(SR * 0.6)
        b = bp(noise(nn, int(tp * 10) + 101), 1200, 6000) * envad(nn, 0.05, 0.22) * 0.022
        add(tex, b, tp)
        tp += 8.5 + float(rng.random()) * 3.0
    music = mix + mel + tex
    music = lp(music, 6500)
    music = reverb(music, 0.9, 0.28, 5)
    music = norm(music, 0.34)
    return save("bgm-archive", music, 0.34, 0.45)

clips = []
for fn, fname, label in [
    (build_stamp, "sfx-1-stamp", "盖章 / 入夜"),
    (build_paper, "sfx-2-paper", "翻纸 / 归档"),
    (build_pencil, "sfx-3-pencil", "写字沙沙"),
    (build_night, "sfx-4-night", "熄灯 / 入夜转场"),
    (build_verdict, "sfx-5-verdict", "判决书落下"),
    (build_enter, "sfx-6-enter", "红章进入"),
]:
    a, b = fn()
    clips.append((fname, label, a, b))

bl, br = build_bgm()

gap = int(SR * 1.0)
total = sum(c[2].size for c in clips) + gap * len(clips) + int(SR * 14)
aL = np.zeros(total); aR = np.zeros(total)
pos = 0
marks = []
for name, label, a, b in clips:
    marks.append((label, pos / SR, a.size / SR))
    aL[pos:pos + a.size] += a; aR[pos:pos + b.size] += b
    pos += a.size + gap
marks.append(("背景音乐（节选 14 秒）", pos / SR, 14.0))
aL[pos:pos + int(SR * 14)] += bl[:int(SR * 14)]
aR[pos:pos + int(SR * 14)] += br[:int(SR * 14)]
wavwrite(os.path.join(OUT, "audition.wav"), aL, aR)

def rms_db(x):
    return 20 * np.log10(np.sqrt((x * x).mean()) + 1e-12)

print("DUR", round(total / SR, 2))
print("BGM", round(bl.size / SR, 2), "rms_db", round(rms_db(bl), 1))
for name, label, a, b in clips:
    print("SFX", name, round(a.size / SR, 2), "rms_db", round(rms_db(a), 1))

W, H = 1600, 1000
img = Image.new("RGB", (W, H), (232, 220, 192))
d = ImageDraw.Draw(img)
font_b = ImageFont.truetype("C:/Windows/Fonts/simkai.ttf", 44)
font_s = ImageFont.truetype("C:/Windows/Fonts/simsun.ttc", 22)
font_l = ImageFont.truetype("C:/Windows/Fonts/simsun.ttc", 18)
d.text((90, 60), "纸上牢笼 · 音频样本", font=font_b, fill=(34, 29, 25))
d.text((92, 122), "自研合成 · 无第三方素材 · 未部署", font=font_s, fill=(126, 111, 92))
d.line([90, 168, 1510, 168], fill=(64, 55, 45), width=2)
rows = [(n, l, a) for (n, l, a, b) in clips] + [("bgm-archive", "背景音乐（节选）", bl)]
y = 200
for i, (name, label, a) in enumerate(rows):
    d.text((90, y), label, font=font_s, fill=(34, 29, 25))
    d.text((90, y + 30), name + ".wav", font=font_l, fill=(126, 111, 92))
    seg = a[:int(SR * 3.0)]
    step = max(1, seg.size // 1180)
    top = float(np.max(np.abs(seg))) + 1e-9
    pts = []
    for k in range(min(1180, seg.size // step)):
        v = float(np.max(np.abs(seg[k * step:(k + 1) * step]))) / top
        pts.append((340 + k, y + 26 - v * 24))
    if len(pts) > 1:
        d.line(pts, fill=(136, 46, 31) if i < 6 else (84, 74, 60), width=2)
    y += 118
img.save(os.path.join(TOOLS, "audio-sheet.png"))
print("SHEET ok")