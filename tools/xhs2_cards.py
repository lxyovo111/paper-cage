# -*- coding: utf-8 -*-
import random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W, H, S = 1080, 1440, 2
PAPER = (232, 220, 192); INK = (34, 29, 25); INK2 = (64, 55, 45)
MUTED = (126, 111, 92); MUT2 = (156, 142, 120); RED = (136, 46, 31); WARM = (128, 96, 60)
KAI = "C:/Windows/Fonts/simkai.ttf"; SONG = "C:/Windows/Fonts/simsun.ttc"
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
        ln = rnd.uniform(4, 24); ang = rnd.uniform(-0.3, 0.3)
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
        d.text((xy[0]*S, xy[1]*S), s, font=f, fill=fill, anchor=anchor); return
    widths = [d.textlength(ch, font=f) for ch in s]
    total = sum(widths) + tracking*S*(len(s)-1)
    x = xy[0]*S - total/2 if anchor[0] == "m" else xy[0]*S
    for ch, w in zip(s, widths):
        d.text((x, xy[1]*S), ch, font=f, fill=fill, anchor="l" + anchor[1])
        x += w + tracking*S

def seal(im, cx, cy, size, text):
    n = size*2*S
    box = Image.new("RGBA", (n, n), (0,0,0,0)); bd = ImageDraw.Draw(box)
    bd.rectangle([8*S, 8*S, n-8*S, n-8*S], outline=(154,54,38,215), width=4*S)
    bd.rectangle([26*S, 26*S, n-26*S, n-26*S], outline=(154,54,38,145), width=2*S)
    f = ImageFont.truetype(KAI, int(size*0.46)*S)
    bd.text((n//2, n//2), text, font=f, fill=(154,54,38,210), anchor="mm")
    box = box.rotate(-9, resample=Image.BICUBIC, expand=True)
    im.paste(box, (int(cx*S - box.size[0]/2), int(cy*S - box.size[1]/2)), box)

def stamp(im, src, box, x, y, w, caption=None):
    # box: (l,t,r,b) in source pixels; x,y in 1080-space (top-left); w target width
    crop = Image.open(src).convert("RGB").crop(box)
    h = int(crop.size[1] * w / crop.size[0])
    crop = crop.resize((w*S, h*S), Image.LANCZOS)
    # shadow
    sh = Image.new("RGBA", (crop.size[0]+24*S, crop.size[1]+24*S), (0,0,0,0))
    sd = ImageDraw.Draw(sh)
    sd.rectangle([12*S, 14*S, sh.size[0]-12*S, sh.size[1]-12*S], fill=(40,31,24,60))
    sh = sh.filter(ImageFilter.GaussianBlur(9*S))
    im.paste(sh, (int(x*S)-12*S, int(y*S)-12*S), sh)
    # border + image
    bd = 2
    frame = Image.new("RGB", (crop.size[0]+bd*2*S, crop.size[1]+bd*2*S), (210,196,166))
    frame.paste(crop, (bd*S, bd*S))
    im.paste(frame, (int(x*S)-bd*S, int(y*S)-bd*S))
    return h

def save(im, name):
    im.resize((W, H), Image.LANCZOS).save(OUT+name, quality=92)
    print("wrote", name)

def header(d):
    txt(d, (84, 96), "案 卷      No.07 / 19", 16, SONG, MUTED, anchor="lm", tracking=4)
    d.line([84*S, 132*S, 996*S, 132*S], fill=INK2, width=1)
    txt(d, (996, 96), "纸 上 牢 笼", 16, SONG, MUTED, anchor="rm", tracking=4)

def card1():
    im = paper(23); d = ImageDraw.Draw(im); header(d)
    txt(d, (540, 300), "第 二 晚", 118, KAI, INK, tracking=20)
    txt(d, (540, 430), "他 绕 开 了 我 的 规 矩", 55, KAI, RED, tracking=6)
    d.line([300*S, 500*S, 780*S, 500*S], fill=(160,143,116), width=1)
    lines = [
        "你是监狱长。七天，最多写六条规矩，",
        "关住一个每天夜里都在找漏洞的囚犯。",
        "",
        "第一晚他只做一件事：摸清这间屋子。",
        "第二天早上的巡查报告，会告诉你他走到了哪。",
        "第七夜之后，是一张判决书。",
    ]
    y = 570
    for ln in lines:
        if ln: txt(d, (540, y), ln, 31, SONG, INK2)
        y += 58
    txt(d, (540, 1010), "手机点开就能玩 · 一局 8 分钟 · 不用注册", 26, SONG, MUTED)
    txt(d, (540, 1062), "链接在评论区", 24, KAI, RED)
    seal(im, 892, 1210, 92, "牢 笼")
    txt(d, (84, 1350), "魔搭创空间 · AI+∞ 开发者创作大赛", 18, SONG, MUT2, anchor="lm", tracking=2)
    save(im, "x2-card1.jpg")

def card2():
    im = paper(41); d = ImageDraw.Draw(im); header(d)
    txt(d, (540, 250), "我写一句人话", 86, KAI, INK, tracking=10)
    txt(d, (540, 344), "它被译成一条能执行的条件", 38, KAI, RED, tracking=2)
    h = stamp(im, OUT+"x2-compile.png", (26, 560, 754, 1140), 122, 430, 836)
    txt(d, (540, 430 + h + 70), "AI 校准过的时间窗，不是模型说了算", 24, SONG, MUTED)
    txt(d, (540, 430 + h + 128), "写宽了没用：一个狱警守不住整座监狱。", 26, SONG, INK2)
    save(im, "x2-card2.jpg")

def card3():
    im = paper(57); d = ImageDraw.Draw(im); header(d)
    txt(d, (540, 250), "第二天早上", 86, KAI, INK, tracking=10)
    txt(d, (540, 344), "报告告诉我他昨晚走到了哪", 38, KAI, RED, tracking=2)
    h = stamp(im, OUT+"x2-day2.png", (36, 1226, 744, 1470), 122, 430, 836)
    y = 430 + h + 64
    txt(d, (540, y), "他进了工具间。", 34, KAI, INK, tracking=2)
    txt(d, (540, y + 66), "档案更新：他走的是「医务室的窗」。", 34, KAI, INK, tracking=2)
    txt(d, (540, y + 150), "我明明堵的是医务室。", 28, SONG, MUTED)
    txt(d, (540, y + 210), "他每晚只走一步，但每天都换一条缝。", 28, SONG, MUTED)
    save(im, "x2-card3.jpg")

card1(); card2(); card3()
