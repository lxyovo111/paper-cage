import numpy as np, wave, os
SR = 44100
OUT = "C:/Users/lcj/Desktop/tap/six-rules/docs/audio"

def read_wav(p):
    with wave.open(p, "rb") as w:
        n = w.getnframes(); data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768.0
        ch = w.getnchannels()
    if ch == 2:
        return data[0::2].copy(), data[1::2].copy()
    return data.copy(), data.copy()

def rms(x):
    return np.sqrt((x * x).mean()) + 1e-12

def fit(x, target_db=-20.0, peak=0.92):
    g = (10 ** (target_db / 20.0)) / rms(x)
    y = x * g
    m = np.max(np.abs(y))
    if m > peak:
        y *= peak / m
    return y

def fade(x, fin=0.01, fout=0.05):
    n = x.size; a = int(fin * SR); b = int(fout * SR)
    if a: x[:a] *= np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)
    return x

items = [
    ("sfx-1-stamp.wav", "盖章 / 入夜", -20.0),
    ("sfx-2-paper.wav", "翻纸 / 归档", -20.0),
    ("sfx-3-pencil.wav", "写字沙沙", -22.0),
    ("sfx-4-night.wav", "熄灯 / 入夜转场", -22.0),
    ("sfx-5-verdict.wav", "判决书落下", -20.0),
    ("sfx-6-enter.wav", "红章进入", -20.0),
]
gap = int(SR * 1.2)
parts = []
marks = []
for fn, label, tdb in items:
    Lc, Rc = read_wav(os.path.join(OUT, fn))
    a = fit(Lc, tdb); b = fit(Rc, tdb)
    parts.append((a, b))
bgL, bgR = read_wav(os.path.join(OUT, "bgm-archive.wav"))
seg = int(SR * 16)
bgL = fit(bgL[:seg], -23.0); bgR = fit(bgR[:seg], -23.0)
bgL = fade(bgL, 0.4, 2.0); bgR = fade(bgR, 0.4, 2.0)

total = sum(p[0].size for p in parts) + gap * len(parts) + bgL.size + int(SR * 1.0)
aL = np.zeros(int(total)); aR = np.zeros(int(total))
pos = 0
for (a, b) in parts:
    aL[pos:pos + a.size] += a; aR[pos:pos + b.size] += b
    pos += a.size + gap
bgAt = pos
aL[pos:pos + bgL.size] += bgL; aR[pos:pos + bgR.size] += bgR

def wavwrite(path, L, R):
    L = np.clip(L, -1, 1); R = np.clip(R, -1, 1)
    inter = np.empty(L.size * 2, dtype=np.int16)
    inter[0::2] = (L * 32767).astype(np.int16)
    inter[1::2] = (R * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(inter.tobytes())

wavwrite(os.path.join(OUT, "audition.wav"), aL, aR)
print("AUDITION", round(aL.size / SR, 2), "bg_at", round(bgAt / SR, 2))
