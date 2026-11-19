# -*- coding: utf-8 -*-
import random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H,S = 1080,1440,2
PAPER=(232,220,192); INK=(34,29,25); INK2=(64,55,45); MUTED=(126,111,92); MUT2=(156,142,120); RED=(136,46,31)
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
        d.ellipse([x-r,y-r,x+r,y+r],fill=(196,168,122) if rnd.random()<0.5 else (205,182,140))
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
    ws=[d.textlength(ch,font=f) for ch in s]; total=sum(ws)+tracking*S*(len(s)-1)
    if anchor[0]=="m": x=xy[0]*S-total/2
    elif anchor[0]=="r": x=xy[0]*S-total
    else: x=xy[0]*S
    for ch,w in zip(s,ws):
        d.text((x,xy[1]*S),ch,font=f,fill=fill,anchor="l"+anchor[1]); x+=w+tracking*S

def header(d):
    txt(d,(84,96),"案 卷      No.07 / 19",16,SONG,MUTED,anchor="lm",tracking=4)
    d.line([84*S,132*S,996*S,132*S],fill=INK2,width=1)
    txt(d,(996,96),"纸上牢笼",16,SONG,MUTED,anchor="rm")

def card4():
    im=paper(83); d=ImageDraw.Draw(im); header(d)
    txt(d,(540,186),"手机上长这样",72,KAI,INK,tracking=6)
    txt(d,(540,258),"一屏就是一整局",30,KAI,RED,tracking=2)
    phone=Image.open(OUT+"x2-day2-live-clean.png").convert("RGB")
    pw=410; ph=int(phone.size[1]*pw/phone.size[0])
    phone=phone.resize((pw*S,ph*S),Image.LANCZOS)
    # shadow
    sh=Image.new("RGBA",(phone.size[0]+40*S,phone.size[1]+40*S),(0,0,0,0)); sd=ImageDraw.Draw(sh)
    sd.rounded_rectangle([20*S,24*S,sh.size[0]-20*S,sh.size[1]-20*S],radius=18*S,fill=(40,31,24,70))
    sh=sh.filter(ImageFilter.GaussianBlur(14*S))
    x=(1080-pw)//2; y=326
    im.paste(sh,(x*S-20*S,y*S-24*S),sh)
    mask=Image.new("L",phone.size,0); md=ImageDraw.Draw(mask); md.rounded_rectangle([0,0,phone.size[0]-1,phone.size[1]-1],radius=12*S,fill=255)
    im.paste(phone,(x*S,y*S),mask)
    d.rounded_rectangle([x*S,y*S,x*S+phone.size[0],y*S+phone.size[1]],radius=12*S,outline=(120,104,82),width=2*S)
    ty=y+ph+54
    txt(d,(540,ty),"地图、六条规矩、服从度、巡查报告，全在这一屏。",24,SONG,MUTED)
    txt(d,(540,ty+44),"点右下角红章入夜。他走一步，你看一眼。",24,SONG,MUTED)
    
    txt(d,(540,ty+112),"手机竖屏 · 不用注册 · 8 分钟一局",24,KAI,RED)
    
    im.resize((W,H),Image.LANCZOS).save(OUT+"x2-card4.jpg",quality=92); print("wrote x2-card4.jpg")

card4()