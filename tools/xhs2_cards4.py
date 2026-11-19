# -*- coding: utf-8 -*-
import random, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H,S = 1080,1440,2
PAPER=(232,220,192); INK=(34,29,25); INK2=(64,55,45); MUTED=(126,111,92); RED=(136,46,31)
KAI='C:/Windows/Fonts/simkai.ttf'; SONG='C:/Windows/Fonts/simsun.ttc'; OUT='C:/Users/lcj/Desktop/tap/six-rules/tools/'
def paper(seed=7):
    rnd=random.Random(seed)
    base=Image.new('RGB',(W*S,H*S),PAPER); ov=Image.new('RGB',(W*S,H*S),PAPER); d=ImageDraw.Draw(ov)
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
    vig=Image.new('L',(W*S,H*S),0); dv=ImageDraw.Draw(vig)
    dv.ellipse([-W*S*0.16,-H*S*0.2,W*S*1.16,H*S*1.2],fill=255); vig=vig.filter(ImageFilter.GaussianBlur(110*S))
    return Image.composite(im,Image.new('RGB',(W*S,H*S),(212,199,168)),vig)
def txt(d,xy,s,size,font=SONG,fill=INK,anchor='mm',tracking=0):
    f=ImageFont.truetype(font,size*S)
    if tracking==0:
        d.text((xy[0]*S,xy[1]*S),s,font=f,fill=fill,anchor=anchor); return
    ws=[d.textlength(ch,font=f) for ch in s]; total=sum(ws)+tracking*S*(len(s)-1)
    if anchor[0]=='m': x=xy[0]*S-total/2
    elif anchor[0]=='r': x=xy[0]*S-total
    else: x=xy[0]*S
    for ch,w in zip(s,ws):
        d.text((x,xy[1]*S),ch,font=f,fill=fill,anchor='l'+anchor[1]); x+=w+tracking*S
def header(d):
    txt(d,(84,96),'案 卷      No.07 / 19',16,SONG,MUTED,anchor='lm',tracking=4)
    d.line([84*S,132*S,996*S,132*S],fill=INK2,width=1)
    txt(d,(996,96),'纸上牢笼',16,SONG,MUTED,anchor='rm')

# 1) 裁掉两侧黑边，得到纸张区域
src=Image.open(OUT+'x2-day2-desktop.png').convert('RGB')
w,h=src.size; px=src.load()
cols=[]
for x in range(w):
    tot=0; n=0
    for y in range(200,h-200,40):
        r,g,b=px[x,y]; tot+= (r+g+b)/3; n+=1
    cols.append(tot/n)
lo=next(i for i,v in enumerate(cols) if v>170)
hi=len(cols)-1-next(i for i,v in enumerate(reversed(cols)) if v>170)
crop=src.crop((lo,0,hi+1,h))
crop.save(OUT+'x2-day2-desktop-crop.png')
print('crop', crop.size, 'x', lo, hi)

# 2) 卡片
im=paper(83); d=ImageDraw.Draw(im); header(d)
def seal(im,cx,cy,size,text):
    n=size*2*S; box=Image.new('RGBA',(n,n),(0,0,0,0)); bd=ImageDraw.Draw(box)
    bd.rectangle([8*S,8*S,n-8*S,n-8*S],outline=(154,54,38,215),width=4*S)
    bd.rectangle([26*S,26*S,n-26*S,n-26*S],outline=(154,54,38,145),width=2*S)
    fnt=ImageFont.truetype(KAI,int(size*0.46)*S); bd.text((n//2,n//2),text,font=fnt,fill=(154,54,38,210),anchor='mm')
    box=box.rotate(-9,resample=Image.BICUBIC,expand=True)
    im.paste(box,(int(cx*S-box.size[0]/2),int(cy*S-box.size[1]/2)),box)

txt(d,(540,192),'电脑上长这样',70,KAI,INK,tracking=6)
txt(d,(540,264),'一屏就是一整局',30,KAI,RED,tracking=2)
pw=944; ph=int(crop.size[1]*pw/crop.size[0])
shot=crop.resize((pw*S,ph*S),Image.LANCZOS)
x=(1080-pw)//2; y=330
sh=Image.new('RGBA',(shot.size[0]+44*S,shot.size[1]+44*S),(0,0,0,0)); sd=ImageDraw.Draw(sh)
sd.rectangle([22*S,26*S,sh.size[0]-22*S,sh.size[1]-22*S],fill=(40,31,24,80))
sh=sh.filter(ImageFilter.GaussianBlur(16*S))
im.paste(sh,(x*S-22*S,y*S-26*S),sh)
im.paste(shot,(x*S,y*S))
d.rectangle([x*S,y*S,x*S+shot.size[0]-1,y*S+shot.size[1]-1],outline=(112,96,76),width=2*S)
ty=y+ph+62
txt(d,(540,ty),'地图、六条规矩、服从度、巡查报告，全摊在一屏。',24,SONG,MUTED)
txt(d,(540,ty+44),'点右下角红章入夜。他走一步，你看一眼。',24,SONG,MUTED)
txt(d,(540,ty+116),'电脑 · 不用注册 · 8 分钟一局',24,KAI,RED)
seal(im,890,1256,86,'查 讫')
txt(d,(84,1352),'纸 上 牢 笼 · 魔搭创空间可玩',18,SONG,(156,142,120),anchor='lm',tracking=2)
im.resize((W,H),Image.LANCZOS).save(OUT+'x2-card4.jpg',quality=92); print('wrote x2-card4.jpg')