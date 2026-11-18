# -*- coding: utf-8 -*-
import random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, S = 1080, 1440, 2
PAPER = (232, 220, 192)
INK = (34, 29, 25)
INK2 = (64, 55, 45)
MUTED = (126, 111, 92)
MUT2 = (156, 142, 120)
RED = (136, 46, 31)
WARM = (128, 96, 60)
KAI = "C:/Windows/Fonts/simkai.ttf"
SONG = "C:/Windows/Fonts/simsun.ttc"
OUT = "C:/Users/lcj/Desktop/tap/six-rules/tools/"

def paper(seed=7):
    rnd = random.Random(seed)
    base_im = Image.new("RGB", (W*S, H*S), PAPER)
    ov = Image.new("RGB", (W*S, H*S), PAPER)
    d = ImageDraw.Draw(ov)
    for i in range(52):
        cx, cy = rnd.uniform(0, W*S), rnd.uniform(0, H*S)
        r = rnd.uniform(160, 680)
        col = (223, 209, 179) if rnd.random() < 0.6 else (241, 232, 208)
        d.ellipse([cx-r, cy-r*0.62, cx+r, cy+r*0.62], fill=col)
    ov = ov.filter(ImageFilter.GaussianBlur(30*S))
    im = Image.blend(base_im, ov, 0.55)
    d = ImageDraw.Draw(im)
    for _ in range(90):
        x, y = rnd.uniform(0, W*S), rnd.uniform(0, H*S)
        r = rnd.uniform(1.2, 3.6)
        c = (196, 168, 122) if rnd.random() < 0.5 else (205, 182, 140)
        d.ellipse([x-r, y-r, x+r, y+r], fill=c)
    px = im.load()
    for _ in range(30000):
        x, y = rnd.randrange(W*S), rnd.randrange(H*S)
        r, g, b = px[x, y]
        k = rnd.uniform(-12, 12)
        px[x, y] = (max(0, min(255, int(r+k))), max(0, min(255, int(g+k))), max(0, min(255, int(b+k))))
    for _ in range(800):
        x, y = rnd.uniform(0, W*S), rnd.uniform(0, H*S)
        ln = rnd.uniform(4, 24)
        ang = rnd.uniform(-0.3, 0.3)
        d.line([x, y, x+ln*math.cos(ang), y+ln*math.sin(ang)], fill=(216, 202, 172), width=1)
    vig = Image.new("L", (W*S, H*S), 0)
    dv = ImageDraw.Draw(vig)
    dv.ellipse([-W*S*0.16, -H*S*0.2, W*S*1.16, H*S*1.2], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(110*S))
    dark = Image.new("RGB", (W*S, H*S), (212, 199, 168))
    return Image.composite(im, dark, vig)

def txt(d, xy, s, size, font=SONG, fill=INK, anchor="mm", tracking=0):
    f = ImageFont.truetype(font, size*S)
    if tracking == 0:
        d.text((xy[0]*S, xy[1]*S), s, font=f, fill=fill, anchor=anchor)
        return
    widths = [d.textlength(ch, font=f) for ch in s]
    total = sum(widths) + tracking*S*(len(s)-1)
    x = xy[0]*S - total/2 if anchor[0] == "m" else xy[0]*S
    for ch, w in zip(s, widths):
        d.text((x, xy[1]*S), ch, font=f, fill=fill, anchor="l" + anchor[1])
        x += w + tracking*S

def seal(im, cx, cy, size, text):
    n = size * 2 * S
    box = Image.new("RGBA", (n, n), (0,0,0,0))
    bd = ImageDraw.Draw(box)
    bd.rectangle([8*S, 8*S, n-8*S, n-8*S], outline=(154, 54, 38, 215), width=4*S)
    bd.rectangle([26*S, 26*S, n-26*S, n-26*S], outline=(154, 54, 38, 145), width=2*S)
    f = ImageFont.truetype(KAI, int(size*0.46)*S)
    bd.text((n//2, n//2), text, font=f, fill=(154, 54, 38, 210), anchor="mm")
    box = box.rotate(-9, resample=Image.BICUBIC, expand=True)
    im.paste(box, (int(cx*S - box.size[0]/2), int(cy*S - box.size[1]/2)), box)

def save(im, name):
    im.resize((W, H), Image.LANCZOS).save(OUT + name, quality=92)
    print("wrote", name)

def card1():
    im = paper(11)
    d = ImageDraw.Draw(im)
    txt(d, (84, 96), "案 卷      No.07 / 19", 16, SONG, MUTED, anchor="lm", tracking=4)
    d.line([84*S, 132*S, 996*S, 132*S], fill=INK2, width=1)
    txt(d, (540, 470), "第 七 夜", 100, KAI, INK, tracking=18)
    d.line([300*S, 566*S, 780*S, 566*S], fill=(160, 143, 116), width=1)
    txt(d, (540, 646), "你是监狱长。七天，最多六条规矩，", 30, SONG, INK2, tracking=2)
    txt(d, (540, 706), "关住一个每天都在找漏洞的人。", 30, SONG, INK2, tracking=2)
    txt(d, (540, 846), "他说的话、走的路，由 AI 决定；", 21, KAI, MUTED, tracking=1)
    txt(d, (540, 888), "你能不能关住他，由规矩决定。", 21, KAI, MUTED, tracking=1)
    seal(im, 858, 1074, 150, "六 条")
    txt(d, (540, 1300), "魔搭创空间 · 可以直接玩", 19, SONG, MUTED, tracking=3)
    save(im, "xhs-1.jpg")

def card2():
    im = paper(23)
    d = ImageDraw.Draw(im)
    txt(d, (84, 96), "你 写 一 句 人 话", 22, SONG, MUTED, anchor="lm", tracking=4)
    d.line([84*S, 136*S, 996*S, 136*S], fill=INK2, width=1)
    txt(d, (540, 262), "夜里任何人不得进入洗衣房", 42, KAI, INK, tracking=2)
    txt(d, (540, 338), "↓  译成一条能执行的条件", 22, SONG, MUTED, tracking=2)
    d.rectangle([84*S, 400*S, 996*S, 480*S], fill=(238, 229, 207), outline=(190, 176, 148), width=1)
    txt(d, (116, 440), "▶  22:00–05:00  ·  洗衣房  ·  禁止位移  ·  无例外", 23, SONG, WARM, anchor="lm")
    txt(d, (884, 440), "AI 校准", 19, SONG, RED, anchor="mm")
    txt(d, (540, 556), "写得越宽，狱警越不服从。", 25, KAI, INK2, tracking=2)
    d.line([84*S, 626*S, 996*S, 626*S], fill=(190, 176, 148), width=1)
    txt(d, (540, 686), "同一个意思，两种写法", 20, SONG, MUTED, tracking=3)
    txt(d, (540, 768), "「所有人夜里都不许乱走」", 32, KAI, MUT2)
    txt(d, (540, 818), "→  22:00–05:00 · 全区域 · 禁止位移（一个狱警守不住整座监狱）", 17, SONG, MUTED)
    txt(d, (540, 920), "「洗衣房的床单，夜里不许取走」", 32, KAI, INK)
    txt(d, (540, 970), "→  22:00–05:00 · 洗衣房 · 禁止取物  ·  拦得住", 17, SONG, WARM)
    txt(d, (540, 1092), "你写的是意思。执行的是判定条。", 22, KAI, RED, tracking=2)
    txt(d, (540, 1306), "纸上牢笼 · 魔搭创空间可玩", 19, SONG, MUTED, tracking=3)
    save(im, "xhs-2.jpg")

def card3():
    im = paper(37)
    d = ImageDraw.Draw(im)
    txt(d, (540, 120), "判 决 书", 24, SONG, MUTED, tracking=12)
    d.line([84*S, 176*S, 996*S, 176*S], fill=INK2, width=1)
    txt(d, (540, 330), "空 规 矩", 92, KAI, RED, tracking=14)
    txt(d, (540, 412), "你写了六条，没人打算执行。", 28, SONG, INK2, tracking=1)
    d.line([84*S, 486*S, 996*S, 486*S], fill=(190, 176, 148), width=1)
    txt(d, (540, 576), "「走廊的通风口，任何时候都不许碰」", 30, KAI, INK, tracking=1)
    txt(d, (540, 636), "漏了 1 次。他最后还是没走。", 30, KAI, INK, tracking=1)
    txt(d, (540, 780), "狱警服从度 29      囚犯敌意 72", 22, SONG, MUTED, tracking=1)
    txt(d, (540, 838), "AI ‖ 挑路 7/7 夜 · 开口 7/7 次", 21, SONG, MUT2, tracking=2)
    d.line([84*S, 912*S, 996*S, 912*S], fill=(190, 176, 148), width=1)
    txt(d, (540, 1002), "判定不是 AI 写的。", 30, KAI, INK2, tracking=2)
    txt(d, (540, 1060), "引擎算完七天，只留一句话。", 30, KAI, INK2, tracking=2)
    txt(d, (540, 1170), "AI 只负责：他今晚试哪条缝，以及他此刻的样子。", 18, SONG, MUTED, tracking=1)
    seal(im, 862, 1030, 132, "查 讫")
    txt(d, (540, 1306), "纸上牢笼 · 魔搭创空间可玩", 19, SONG, MUTED, tracking=3)
    save(im, "xhs-3.jpg")

card1()
card2()
card3()
print("ok")