# -*- coding: utf-8 -*-
import random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W, H, S = 1080, 1440, 2
PAPER=(232,220,192); INK=(34,29,25); INK2=(64,55,45); MUTED=(126,111,92); MUT2=(156,142,120)
RED=(136,46,31); WARM=(128,96,60)
KAI="C:/Windows/Fonts/simkai.ttf"; SONG="C:/Windows/Fonts/simsun.ttc"; OUT="C:/Users/lcj/Desktop/tap/six-rules/tools/"

def paper(seed=7):
    rnd=random.Random(seed)
    base=Image.new("RGB",(W*S,H*S),PAPER); ov=Image.new("RGB",(W*S,H*S),PAPER); d=ImageDraw.Draw(ov)
    for i in range(52):
        cx,cy=rnd.uniform(0,W*S),rnd.uniform(0,H*S); r=rnd.uniform(160,680)
        col=(223,209,179) if rnd.random()<0.6 else (241,232,208)
        d.ellipse([cx-r,cy-r*0.62,cx+r,cy+r*0.62],fill=col)
    ov=ov.filter(ImageFilter.GaussianBlur(30*S)); im=Image.blend(base,ov,0.55); d=ImageDraw.Draw(im)
    for _ in range(90):
        x,y=rnd.uniform(0,W*S),rnd.uniform(0,H*S); r=rnd.uniform(1.2,3.6)
        c=(196,168,122) if rnd.random()<0.5 else (205,182,140); d.ellipse([x-r,y-r,x+r,y+r],fill=c)
    px=im.load()
    for _ in range(30000):
        x,y=rnd.randrange(W*S),rnd.randrange(H*S); r,g,b=px[x,y]; k=rnd.uniform(-12,12)
        px[x,y]=(max(0,min(255,int(r+k))),max(0,min(255,int(g+k))),max(0,min(255,int(b+k))))
    for _ in range(800):
        x,y=rnd.uniform(0,W*S),rnd.uniform(0,H*S); ln=rnd.uniform(4,24); ang=rnd.uniform(-0.3,0.3)
        d.line([x,y,x+ln*math.cos(ang),y+ln*math.sin(ang)],fill=(216,202,172),width=1)
    vig=Image.new("L",(W*S,H*S),0); dv=ImageDraw.Draw(vig)
    dv.ellipse([-W*S*0.16,-H*S*0.2,W*S*1.16,H*S*1.2],fill=255); vig=vig.filter(ImageFilter.GaussianBlur(110*S))
    return Image.composite(im,Image.new("RGB",(W*S,H*S),(212,199,168)),vig)

def txt(d,xy,s,size,font=SONG,fill=INK,anchor="mm",tracking=0):
    f=ImageFont.truetype(font,size*S)
    if tracking==0:
        d.text((xy[0]*S,xy[1]*S),s,font=f,fill=fill,anchor=anchor); return
    widths=[d.textlength(ch,font=f) for ch in s]; total=sum(widths)+tracking*S*(len(s)-1)
    if anchor[0]=="m": x=xy[0]*S-total/2
    elif anchor[0]=="r": x=xy[0]*S-total
    else: x=xy[0]*S
    for ch,w in zip(s,widths):
        d.text((x,xy[1]*S),ch,font=f,fill=fill,anchor="l"+anchor[1]); x+=w+tracking*S

def seal(im,cx,cy,size,text):
    n=size*2*S; box=Image.new("RGBA",(n,n),(0,0,0,0)); bd=ImageDraw.Draw(box)
    bd.rectangle([8*S,8*S,n-8*S,n-8*S],outline=(154,54,38,215),width=4*S)
    bd.rectangle([26*S,26*S,n-26*S,n-26*S],outline=(154,54,38,145),width=2*S)
    f=ImageFont.truetype(KAI,int(size*0.46)*S); bd.text((n//2,n//2),text,font=f,fill=(154,54,38,210),anchor="mm")
    box=box.rotate(-9,resample=Image.BICUBIC,expand=True)
    im.paste(box,(int(cx*S-box.size[0]/2),int(cy*S-box.size[1]/2)),box)

def panel(d,box,fill=(238,228,204)):
    d.rectangle([box[0]*S,box[1]*S,box[2]*S,box[3]*S],fill=fill,outline=(190,174,146),width=1)

def aitag(im,x,y):
    d=ImageDraw.Draw(im); b=[x*S,y*S,(x+94)*S,(y+30)*S]
    d.rectangle(b,outline=(150,74,58),width=1*S)
    txt(d,(x+47,y+15),"AI 校准",13,KAI,RED)

def header(d,right="纸上牢笼"):
    txt(d,(84,96),"案 卷      No.07 / 19",16,SONG,MUTED,anchor="lm",tracking=4)
    d.line([84*S,132*S,996*S,132*S],fill=INK2,width=1)
    txt(d,(996,96),right,16,SONG,MUTED,anchor="rm")

def save(im,name):
    im.resize((W,H),Image.LANCZOS).save(OUT+name,quality=92); print("wrote",name)

def card1():
    im=paper(23); d=ImageDraw.Draw(im); header(d)
    txt(d,(540,300),"第 二 晚",118,KAI,INK,tracking=20)
    txt(d,(540,430),"他 绕 开 了 我 的 规 矩",55,KAI,RED,tracking=6)
    d.line([300*S,500*S,780*S,500*S],fill=(160,143,116),width=1)
    for i,ln in enumerate(["你是监狱长。七天，最多写六条规矩，","关住一个每天夜里都在找漏洞的囚犯。"]):
        txt(d,(540,570+i*58),ln,31,SONG,INK2)
    for i,ln in enumerate(["第一晚他只做一件事：摸清这间屋子。","第二天早上的巡查报告，会告诉你他走到了哪。","第七夜之后，是一张判决书。"]):
        txt(d,(540,710+i*58),ln,31,SONG,INK2)
    txt(d,(540,1010),"手机点开就能玩 · 一局 8 分钟 · 不用注册",26,SONG,MUTED)
    txt(d,(540,1062),"链接在评论区",24,KAI,RED)
    seal(im,892,1210,92,"牢 笼")
    txt(d,(84,1350),"魔搭创空间 · AI+∞ 开发者创作大赛",18,SONG,MUT2,anchor="lm",tracking=2)
    save(im,"x2-card1.jpg")

def card2():
    im=paper(41); d=ImageDraw.Draw(im); header(d)
    txt(d,(540,240),"我写一句人话",84,KAI,INK,tracking=8)
    txt(d,(540,330),"它被译成一条能执行的条件",36,KAI,RED,tracking=2)
    panel(d,(90,410,990,540))
    txt(d,(540,475),"夜里任何人不得进入医务室",42,KAI,INK,tracking=2)
    txt(d,(540,586),"↓",30,SONG,MUTED)
    panel(d,(90,620,990,700))
    txt(d,(118,660),"22:00–05:00 · 医务室 · 禁止位移 · 无例外",26,SONG,INK2,anchor="lm")
    aitag(im,876,642)
    txt(d,(540,780),"AI 校准过时间窗；判定条由引擎执行。",26,SONG,MUTED)
    d.line([200*S,846*S,880*S,846*S],fill=(190,174,146),width=1)
    txt(d,(540,908),"写得越宽，狱警越不服从",36,KAI,INK,tracking=2)
    txt(d,(540,972),"一个狱警守不住整座监狱。",28,SONG,MUTED)
    txt(d,(540,1080),"写窄了才拦得住——但房间有十个，规矩只有六条。",25,SONG,INK2)
    seal(im,890,1210,86,"校 准")
    txt(d,(84,1350),"纸 上 牢 笼 · 魔搭创空间可玩",18,SONG,MUT2,anchor="lm",tracking=2)
    save(im,"x2-card2.jpg")

def card3():
    im=paper(57); d=ImageDraw.Draw(im); header(d)
    txt(d,(540,240),"第二天早上",84,KAI,INK,tracking=8)
    txt(d,(540,330),"巡查报告告诉我他昨晚走到了哪",36,KAI,RED,tracking=1)
    panel(d,(84,410,996,780))
    txt(d,(116,458),"巡 查 报 告",20,SONG,MUTED,anchor="lm",tracking=4)
    d.line([116*S,492*S,964*S,492*S],fill=(190,174,146),width=1)
    rows=[("昨夜","他进了工具间。",INK2),
          ("","档案更新：他走的是",INK2),
          ("","「医务室的窗」。",RED),
          ("","第 二 天。他今天话少。",INK2)]
    y=540
    for t,s,c in rows:
        if t: txt(d,(150,y),t,18,SONG,MUTED,anchor="mm",tracking=1)
        txt(d,(214,y),s,30,KAI,c,anchor="lm")
        y+=62
    txt(d,(540,860),"我明明堵的是医务室。",30,KAI,INK2,tracking=1)
    txt(d,(540,916),"他绕开了，还顺手拿走一根铁条。",30,KAI,INK2,tracking=1)
    d.line([200*S,1000*S,880*S,1000*S],fill=(190,174,146),width=1)
    txt(d,(540,1064),"他每晚只走一步。",28,SONG,MUTED)
    txt(d,(540,1114),"但每天都换一条缝。",28,SONG,MUTED)
    seal(im,890,1230,84,"查 讫")
    txt(d,(84,1350),"纸 上 牢 笼 · 手机可玩 · 8 分钟一局",18,SONG,MUT2,anchor="lm",tracking=2)
    save(im,"x2-card3.jpg")

card1(); card2(); card3()
