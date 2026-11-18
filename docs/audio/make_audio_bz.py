"""Original procedural audio sketches. No recordings, sample libraries or external audio.

Run with Python and NumPy. Generates 16-bit stereo WAV files next to this script.
These are auditions, not production-ready mixes or gapless loops.
"""
from pathlib import Path
import wave
import numpy as np

ROOT = Path(__file__).resolve().parent
SR = 32000
RNG = np.random.default_rng(20261118)


def save(name, data, peak=0.72):
    data = np.asarray(data, dtype=np.float64)
    if data.ndim == 1:
        data = np.column_stack([data, data])
    maximum = np.max(np.abs(data))
    if maximum:
        data = data * min(peak / maximum, 1.0)
    samples = np.int16(np.clip(data, -1, 1) * 32767)
    with wave.open(str(ROOT / name), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(samples.tobytes())


def add(buf, x, when, pan=0.0):
    start = int(when * SR)
    n = min(len(x), len(buf) - start)
    if n <= 0:
        return
    # Equal-power stereo panning, staying close to the centre.
    angle = (pan + 1) * np.pi / 4
    buf[start:start+n, 0] += x[:n] * np.cos(angle)
    buf[start:start+n, 1] += x[:n] * np.sin(angle)


def note(midi, duration=4.0, velocity=0.1, tone=1.0):
    t = np.arange(int(duration * SR)) / SR
    f = 440 * (2 ** ((midi - 69) / 12))
    env = (1 - np.exp(-t * 45)) * np.exp(-t * 1.2)
    x = (np.sin(2*np.pi*f*t) + 0.24*np.sin(2*np.pi*2*f*t)*np.exp(-2*t)
         + 0.065*np.sin(2*np.pi*3*f*t)*np.exp(-3*t))
    return velocity * tone * env * x


def echo(buf, delay, gain):
    out = buf.copy()
    shift = int(delay * SR)
    out[shift:, 0] += gain * buf[:-shift, 1]
    out[shift:, 1] += gain * buf[:-shift, 0]
    return out


def fade(buf, a=1.0, b=2.0):
    fi, fo = int(a * SR), int(b * SR)
    buf[:fi] *= np.linspace(0, 1, fi)[:, None]
    buf[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return buf


def music(name, night=False):
    duration = 36
    t = np.arange(duration * SR) / SR
    out = np.zeros((len(t), 2), dtype=np.float64)
    # Slow, quiet detuned chords, deliberately no percussion.
    roots = [50, 46, 53, 48]  # D3, Bb2, F3, C3
    for i, m in enumerate(roots):
        start = i * 8.0
        dur = min(10.5, duration - start)
        u = np.arange(int(dur * SR)) / SR
        e = np.minimum(1, u / 2.5) * np.minimum(1, (dur-u) / 2.5)
        freqs = [m, m+7, m+12] if night else [m, m+7, m+15]
        for j, pitch in enumerate(freqs):
            f = 440 * 2 ** ((pitch - 69) / 12)
            slow = np.sin(2*np.pi*f*u) + .30*np.sin(2*np.pi*f*1.003*u)
            amp = (0.012 if night else 0.010) * (0.7 if j else 1.0)
            add(out, slow * e * amp, start, (-.22, .18, .04)[j])
    # Sparse, original piano-like motif. The night sketch uses fewer notes.
    seq = [(1.3, 62), (3.3, 65), (5.8, 69), (8.7, 65),
           (11.1, 62), (13.4, 60), (16.9, 57), (19.2, 60),
           (22.1, 65), (24.9, 64), (28.0, 62), (30.4, 57), (33.2, 62)]
    if night:
        seq = [(2.2, 57), (6.0, 62), (10.6, 60), (15.2, 57),
               (19.9, 65), (24.5, 60), (29.2, 57), (33.0, 62)]
    for i, (when, pitch) in enumerate(seq):
        add(out, note(pitch, velocity=0.055 if night else 0.085), when,
            [-.18, .12, .02][i % 3])
    out = echo(echo(out, .31, .25), .57, .16)
    save(name, fade(out * 3.0, 1.5, 3.0))


def filtered_noise(duration, lo, hi):
    n = int(duration * SR)
    noise = RNG.standard_normal(n)
    spectrum = np.fft.rfft(noise)
    hz = np.fft.rfftfreq(n, 1/SR)
    # Gentle band shape avoids abrupt brick-wall ringing.
    mask = np.exp(-((hz - (lo+hi)/2) / ((hi-lo)/2))**4)
    signal = np.fft.irfft(spectrum * mask, n)
    return signal / (np.max(np.abs(signal)) + 1e-10)


def effect_stamp():
    t = np.arange(int(.65*SR))/SR
    x = .53*np.sin(2*np.pi*(110*t - 30*t*t))*np.exp(-28*t)
    x += .28*filtered_noise(.65, 160, 2500)*np.exp(-35*t)
    x += .05*filtered_noise(.65, 1200, 7000)*np.exp(-9*t)
    save('音效-印章.wav', x)


def effect_pen():
    t = np.arange(int(1.2*SR))/SR
    n = filtered_noise(1.2, 1800, 8000)
    gate = np.zeros_like(t)
    for start, dur in [(.04,.12),(.23,.17),(.48,.12),(.69,.21),(.99,.12)]:
        gate += np.where((t>=start)&(t<start+dur), np.sin(np.pi*(t-start)/dur)**2, 0)
    save('音效-笔划.wav', .18*n*gate)


def effect_paper():
    t = np.arange(int(1.05*SR))/SR
    n = filtered_noise(1.05, 250, 6500)
    env = np.exp(-((t-.35)/.22)**2) + .4*np.exp(-((t-.73)/.10)**2)
    env *= .72 + .28*np.sin(2*np.pi*17*t)**2
    save('音效-翻页.wav', .22*n*env)


def effect_switch():
    t = np.arange(int(.5*SR))/SR
    n = filtered_noise(.5, 300, 5000)
    x = .33*n*np.exp(-t*60) + .17*np.sin(2*np.pi*680*t)*np.exp(-t*44)
    save('音效-熄灯.wav', x)


def effect_steps():
    t = np.arange(int(2.4*SR))/SR
    x = np.zeros_like(t)
    noise = filtered_noise(2.4, 100, 2300)
    for i, start in enumerate([.1,.73,1.38,2.03]):
        u = np.maximum(t-start, 0)
        active = t >= start
        x += active*(.27*np.sin(2*np.pi*(100*u-18*u*u))*np.exp(-22*u)
                     + .10*noise*np.exp(-24*u))
    save('音效-脚步.wav', x)


if __name__ == '__main__':
    music('配乐-白天案卷.wav')
    music('配乐-夜间巡视.wav', night=True)
    effect_stamp()
    effect_pen()
    effect_paper()
    effect_switch()
    effect_steps()
    print('Generated seven original synthesized WAV sketches.')
