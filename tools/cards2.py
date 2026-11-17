# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, "C:/Users/lcj/Desktop/tap/six-rules/tools")
from PIL import Image
from cards import paper, txt, W, H, S, INK, INK2, MUTED, RED, KAI, SONG, ImageDraw

AI_ROUTE = sys.argv[1] if len(sys.argv) > 1 else "放风区的墙"
AI_LINE = sys.argv[2] if len(sys.argv) > 2 else "他停在医务室窗下，指甲抠进砖缝。"
OFF_LINE = sys.argv[3] if len(sys.argv) > 3 else "灯挪开了。他站在原地没动。"


def ab_card():
    im = paper()
    d = ImageDraw.Draw(im)
    d.line([110*S, 108*S, 1490*S, 108*S], fill=INK2, width=1)
    txt(d, (800, 176), "同 一 夜 · 两 个 版 本", 34, SONG, MUTED, tracking=8)
    # 左列：AI 开
    txt(d, (430, 268), "A I  开  着", 30, KAI, INK, tracking=6)
    d.line([250*S, 306*S, 610*S, 306*S], fill=(160, 143, 116), width=1)
    txt(d, (430, 366), "他走的是「" + AI_ROUTE + "」", 21, SONG, INK2)
    txt(d, (430, 424), AI_LINE[:12], 24, KAI, RED)
    txt(d, (430, 466), AI_LINE[12:24], 24, KAI, RED)
    txt(d, (430, 534), "这条路线是他自己在漏洞清单里挑的，", 15, SONG, MUTED)
    txt(d, (430, 562), "这句话是他自己写的。", 15, SONG, MUTED)
    # 右列：AI 关
    txt(d, (1170, 268), "A I  关 掉  ? l l m = 0", 30, KAI, INK, tracking=4)
    d.line([990*S, 306*S, 1350*S, 306*S], fill=(160, 143, 116), width=1)
    txt(d, (1170, 366), "他走的是「第一条最松的路」", 21, SONG, INK2)
    txt(d, (1170, 424), OFF_LINE, 22, KAI, MUTED)
    txt(d, (1170, 534), "这条路是按顺序试的第一条，", 15, SONG, MUTED)
    txt(d, (1170, 562), "这句话是模板。", 15, SONG, MUTED)
    d.line([760*S, 306*S, 760*S, 610*S], fill=(190, 175, 148), width=1)
    d.line([250*S, 660*S, 1350*S, 660*S], fill=INK2, width=1)
    txt(d, (800, 730), "判定一次都没变：规矩还是那六条，输赢还是引擎算的。", 22, SONG, INK2)
    txt(d, (800, 786), "变的只是 —— 他像不像一个人。", 30, KAI, RED, tracking=2)
    txt(d, (800, 900), "第七夜 · AI 与同名对照组", 14, SONG, MUTED, tracking=2)
    im = im.resize((W, H), Image.LANCZOS)
    im.save("C:/Users/lcj/Desktop/tap/six-rules/tools/card-ab.jpg", quality=92)

ab_card()
print("ok")