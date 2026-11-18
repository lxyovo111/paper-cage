# -*- coding: utf-8 -*-
import random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, S = 1600, 1000, 2
PAPER = (232, 220, 192)
INK = (34, 29, 25)
INK2 = (64, 55, 45)
MUTED = (126, 111, 92)
RED = (136, 46, 31)
KAI = "C:/Windows/Fonts/simkai.ttf"
SONG = "C:/Windows/Fonts/simsun.ttc"

def paper():
    rnd = random.Random(7)
    base_im = Image.new("RGB", (W*S, H*S), PAPER)
    ov = Image.new("RGB", (W*S, H*S), PAPER)
    d = ImageDraw.Draw(ov)
    # 低频斑驳：同色系深浅，先画后模糊，再低比例混合
    for i in range(46):
        cx, cy = rnd.uniform(0, W*S), rnd.uniform(0, H*S)
        r = rnd.uniform(150, 620)
        col = (223, 209, 179) if rnd.random() < 0.6 else (240, 231, 206)
        d.ellipse([cx-r, cy-r*0.62, cx+r, cy+r*0.62], fill=col)
    ov = ov.filter(ImageFilter.GaussianBlur(30*S))
    im = Image.blend(base_im, ov, 0.55)
    # 霉点 foxing
    d = ImageDraw.Draw(im)
    for _ in range(70):
        x, y = rnd.uniform(0, W*S), rnd.uniform(0, H*S)
        r = rnd.uniform(1.2, 3.4)
        c = (196, 168, 122) if rnd.random() < 0.5 else (205, 182, 140)
        d.ellipse([x-r, y-r, x+r, y+r], fill=c)
    # 纤维 + 噪点
    px = im.load()
    for _ in range(26000):
        x, y = rnd.randrange(W*S), rnd.randrange(H*S)
        r, g, b = px[x, y]
        k = rnd.uniform(-12, 12)
        px[x, y] = (max(0, min(255, int(r+k))), max(0, min(255, int(g+k))), max(0, min(255, int(b+k))))
    for _ in range(700):
        x, y = rnd.uniform(0, W*S), rnd.uniform(0, H*S)
        ln = rnd.uniform(4, 22)
        ang = rnd.uniform(-0.3, 0.3)
        d.line([x, y, x+ln*math.cos(ang), y+ln*math.sin(ang)], fill=(216, 202, 172), width=1)
    # 暗角
    vig = Image.new("L", (W*S, H*S), 0)
    dv = ImageDraw.Draw(vig)
    dv.ellipse([-W*S*0.16, -H*S*0.2, W*S*1.16, H*S*1.2], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(110*S))
    dark = Image.new("RGB", (W*S, H*S), (210, 197, 166))
    return Image.composite(im, dark, vig)

def txt(d, xy, s, size, font=SONG, fill=INK, anchor="mm", tracking=0, bold=False):
    f = ImageFont.truetype(font, size*S)
    if tracking == 0:
        d.text((xy[0]*S, xy[1]*S), s, font=f, fill=fill, anchor=anchor)
        return
    # 手动 tracking
    widths = [d.textlength(ch, font=f) for ch in s]
    total = sum(widths) + tracking*S*(len(s)-1)
    x = xy[0]*S - total/2 if anchor[0] == "m" else xy[0]*S
    for ch, w in zip(s, widths):
        d.text((x, xy[1]*S), ch, font=f, fill=fill, anchor="l" + anchor[1])
        x += w + tracking*S

def title_card():
    im = paper()
    d = ImageDraw.Draw(im)
    txt(d, (110, 96), "案 卷      No.07 / 19", 15, SONG, MUTED, anchor="lm", tracking=4)
    d.line([110*S, 132*S, 1490*S, 132*S], fill=INK2, width=1)
    txt(d, (800, 330), "纸 上 牢 笼", 96, KAI, INK, tracking=14)
    d.line([560*S, 420*S, 1040*S, 420*S], fill=(160, 143, 116), width=1)
    txt(d, (800, 492), "你是监狱长。七天，最多六条规矩，", 27, SONG, INK2, tracking=2)
    txt(d, (800, 545), "关住一个每天都在找漏洞的人。", 27, SONG, INK2, tracking=2)
    txt(d, (800, 660), "他说的话、走的路，由 AI 决定；你能不能关住他，由规矩决定。", 19, KAI, MUTED)
    # 红章
    box = Image.new("RGBA", (200*S, 200*S), (0,0,0,0))
    bd = ImageDraw.Draw(box)
    bd.rectangle([6*S, 6*S, 194*S, 194*S], outline=(154, 54, 38, 220), width=4*S)
    bd.rectangle([20*S, 20*S, 180*S, 180*S], outline=(154, 54, 38, 150), width=2*S)
    f = ImageFont.truetype(KAI, 44*S)
    bd.text((100*S, 100*S), "六 条", font=f, fill=(154, 54, 38, 215), anchor="mm")
    box = box.rotate(-9, resample=Image.BICUBIC, expand=True)
    im.paste(box, (1300*S, 620*S), box)
    txt(d, (800, 900), "魔搭创空间 · AI+∞ 开发者创作大赛 · AI 造游戏", 15, SONG, MUTED, tracking=2)
    im = im.resize((W, H), Image.LANCZOS)
    im.save("C:/Users/lcj/Desktop/tap/six-rules/tools/card-title.jpg", quality=92)

def end_card():
    im = paper()
    d = ImageDraw.Draw(im)
    d.line([110*S, 132*S, 1490*S, 132*S], fill=INK2, width=1)
    txt(d, (800, 236), "它 不 是 更 聪 明 的 N P C", 30, SONG, MUTED, tracking=6)
    txt(d, (800, 330), "它是一个会记错、会被自己的规矩堵住的囚犯。", 44, KAI, INK, tracking=2)
    d.line([520*S, 420*S, 1080*S, 420*S], fill=(160, 143, 116), width=1)
    lines = [
        ("夜里他走哪条路、说哪句话，由 AI 挑；", INK2, 24),
        ("但 AI 只能从引擎算出的漏洞清单里挑一条 —— 不合法的动作，引擎当场驳回。", MUTED, 20),
    ]
    y = 494
    for s, c, sz in lines:
        txt(d, (800, y), s, sz, KAI if sz > 21 else SONG, c, tracking=2)
        y += 54
    txt(d, (800, 706), "试试关掉 AI：在链接后面加  ?llm=0", 30, KAI, RED, tracking=3)
    txt(d, (800, 764), "同一局里，他会从「挑最像人的那条路」变成「按顺序试第一条」，夜里那句话变成模板。", 16, SONG, MUTED)
    txt(d, (800, 900), "modelscope.cn/studios/lxyovo/six-rules", 18, SONG, MUTED, tracking=1)
    im = im.resize((W, H), Image.LANCZOS)
    im.save("C:/Users/lcj/Desktop/tap/six-rules/tools/card-end.jpg", quality=92)

title_card(); end_card()
print("ok")
