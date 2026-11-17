
# -*- coding: utf-8 -*-
import os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

S = 2
W, H = 1600 * S, 1000 * S
FONTS = {'song': [r'C:\Windows\Fonts\simsun.ttc', r'C:\Windows\Fonts\msyh.ttc'],
         'kai':  [r'C:\Windows\Fonts\simkai.ttf', r'C:\Windows\Fonts\simsun.ttc'],
         'mono': [r'C:\Windows\Fonts\consola.ttf']}
def font(kind, size):
    for p in FONTS[kind]:
        if os.path.exists(p):
            return ImageFont.truetype(p, int(round(size * S)))
    raise SystemExit('font missing ' + kind)

INK=(34,29,25); INK2=(64,55,45); MUTED=(126,111,92); MUT2=(156,142,120)
RED=(136,46,31); REDD=(156,54,38); PAPER=(231,219,193); WARM=(128,96,60)
BRASS=(84,74,60); STEEL=(48,58,70); PENCIL=(92,88,80)
def mix(a,b,t): return tuple(int(round(x*(1-t)+y*t)) for x,y in zip(a,b))
def P(v): return v*S
rng = np.random.default_rng(20261116)

# ---------- desk ----------
yy, xx = np.mgrid[0:H,0:W].astype(np.float32)
cx, cy = 0.16*W, 0.04*H
dist = np.sqrt((xx-cx)**2+(yy-cy)**2); maxd = math.hypot(W,H)
t = np.clip(dist/(0.72*maxd),0,1)**0.85
c1=np.array([84,69,50],np.float32); c2=np.array([9,8,7],np.float32)
arr = c1*(1-t[:,:,None])+c2*t[:,:,None]
arr = np.clip(arr+np.exp(-(dist/(0.28*maxd))**2)[:,:,None]*np.array([58,42,20],np.float32),0,255).astype(np.uint8)
base = Image.fromarray(arr,'RGB').convert('RGBA')

SX0,SY0,SX1,SY1 = 92,50,1508,950
sh = Image.new('RGBA',(W,H),(0,0,0,0)); ds=ImageDraw.Draw(sh)
ds.rectangle([P(SX0+10),P(SY0+30),P(SX1+12),P(SY1+38)],fill=(0,0,0,220))
sh = sh.filter(ImageFilter.GaussianBlur(P(30)))
base = Image.alpha_composite(base, sh)

img = Image.new('RGBA',(W,H),(0,0,0,0)); d = ImageDraw.Draw(img)
d.rectangle([P(SX0),P(SY0),P(SX1),P(SY1)], fill=PAPER)

def txt(x,y,s,f,fill,tracking=0,align='l'):
    total = sum(d.textlength(c,font=f) for c in s)/S + tracking*max(0,len(s)-1)
    if align=='m': x -= total/2
    elif align=='r': x -= total
    if tracking:
        for ch in s:
            d.text((x*S,y*S),ch,font=f,fill=fill); x += d.textlength(ch,font=f)/S + tracking
    else:
        d.text((x*S,y*S),s,font=f,fill=fill)
    return total

# ---------- header ----------
txt(132,84,'案 卷 No.07 / 19',font('song',13),INK2,tracking=2)
txt(132,112,'脱逃事件调查报告 · 内部资料',font('song',12),MUTED,tracking=2)
fd=font('song',26); fk=font('kai',31)
w1=d.textlength('第',font=fd)/S; w2=d.textlength('三',font=fk)/S; w3=d.textlength('天',font=fd)/S
gap=10; bx=800-(w1+w2+w3+gap*2)/2
txt(bx,80,'第',fd,INK); txt(bx+w1+gap,76,'三',fk,RED); txt(bx+w1+gap+w2+gap,80,'天',fd,INK)
txt(800,128,'共 七 日',font('song',11),MUTED,tracking=5,align='m')
txt(1468,84,'剩余行动力',font('song',11),MUTED,tracking=3,align='r')
for i in range(3):
    cxx = 1468-7-(2-i)*20
    d.ellipse([P(cxx-6.5),P(118-6.5),P(cxx+6.5),P(118+6.5)],fill=(RED if i<2 else PAPER),outline=INK,width=int(1.5*S))
d.line([P(132),P(170),P(1468),P(170)],fill=mix(PAPER,INK,0.42),width=max(1,int(S)))
d.line([P(1132),P(182),P(1132),P(738)],fill=mix(PAPER,INK,0.26),width=max(1,int(S)))

# ---------- map ----------
MX,MY = 204,182; MS = 558/520.0
def mx(v): return (MX+v*MS)*S
def my(v): return (MY+v*MS)*S
def ml(v): return max(1,int(round(v*MS*S)))
def dx(v): return MX+v*MS
def dy(v): return MY+v*MS
def mtxt(vx,vy,s,f,fill,tracking=0,align='m'):
    txt(dx(vx),dy(vy),s,f,fill,tracking=tracking,align=align)

MAPPAPER=(237,227,205)
CELL=(239,229,207); HALL=(233,222,199); WK=(238,227,203); MED=(241,230,209)
DINE=(237,227,203); LAUN=(232,222,200); YARD=(231,219,196); STORE=(236,225,202)

FU  = mix(INK,PAPER,0.44)
FU2 = mix(INK,PAPER,0.70)
FU3 = mix(INK,PAPER,0.88)
WALLC = mix(INK,PAPER,0.63)
WALLB = mix(INK,PAPER,0.24)

def rr(x,y,w,h,r=0,outl=FU,fill=None,wid=1.0):
    d.rounded_rectangle([mx(x),my(y),mx(x+w),my(y+h)], radius=ml(r), outline=outl, fill=fill, width=ml(wid))
def el(x,y,w,h,outl=FU,fill=None,wid=1.0):
    d.ellipse([mx(x),my(y),mx(x+w),my(y+h)], outline=outl, fill=fill, width=ml(wid))
def ln(x1,y1,x2,y2,col=FU,wid=1.0):
    d.line([mx(x1),my(y1),mx(x2),my(y2)], fill=col, width=ml(wid))
def PX(pts): return [(mx(p[0]),my(p[1])) for p in pts]
def poly(pts,outl=FU,fill=None,wid=1.0):
    if fill: d.polygon(PX(pts), fill=fill)
    if outl: d.line(PX(pts)+[PX(pts)[0]], fill=outl, width=ml(wid), joint='curve')

ROOMS = [(16,16,234,124,CELL),(16,140,234,124,CELL),(16,264,234,124,CELL),(16,388,234,120,STORE),
         (250,16,220,492,HALL),
         (470,16,294,96,WK),(470,112,294,96,MED),(470,208,294,96,DINE),(470,304,294,96,LAUN),(470,400,294,108,YARD)]
d.rectangle([mx(16),my(16),mx(764),my(508)], fill=MAPPAPER)
for x,y,w,h,f in ROOMS: d.rectangle([mx(x),my(y),mx(x+w),my(y+h)], fill=f)

# graph-paper grid
gc=mix(MAPPAPER,INK,0.055)
for gx in range(16,765,26): ln(gx,16,gx,508,gc,0.7)
for gy in range(16,509,26): ln(16,gy,764,gy,gc,0.7)

# ---------- floor textures ----------
def tiles(x0,y0,x1,y1,step,col=FU3,wid=0.7):
    for gx in range(int(x0),int(x1),step): ln(gx,y0,gx,y1,col,wid)
    for gy in range(int(y0),int(y1),step): ln(x0,gy,x1,gy,col,wid)
tiles(253,19,467,505,34)
tiles(473,211,761,301,26)
tiles(473,307,761,397,23)
tiles(473,115,761,205,30)
for gy in range(19,109,15): ln(473,gy,761,gy,FU3,0.6)

# yard hatch
hl = img.copy(); hd = ImageDraw.Draw(hl)
hc = mix(YARD, INK, 0.14)
for k in range(-90,90):
    x0 = 470-140+k*19
    hd.line([mx(x0),my(398),mx(x0+150),my(520)],fill=hc,width=ml(0.7))
mask = Image.new('L',(W,H),0)
ImageDraw.Draw(mask).rectangle([mx(474.5),my(404.5),mx(759.5),my(503.5)],fill=255)
img.paste(hl,(0,0),mask); d = ImageDraw.Draw(img)

# ---------- walls ----------
WW = 8
def wall_v(x,y1,y2):
    d.rectangle([mx(x-WW/2),my(y1),mx(x+WW/2),my(y2)], fill=WALLC, outline=WALLB, width=ml(0.7))
def wall_h(y,x1,x2):
    d.rectangle([mx(x1),my(y-WW/2),mx(x2),my(y+WW/2)], fill=WALLC, outline=WALLB, width=ml(0.7))
wall_v(250,16,508); wall_v(470,16,508)
for yy in (140,264,388): wall_h(yy,16,250)
for yy in (112,208,304,400): wall_h(yy,470,764)
d.rectangle([mx(16),my(16),mx(764),my(508)], outline=WALLC, width=ml(9))
d.rectangle([mx(16),my(16),mx(764),my(508)], outline=WALLB, width=ml(0.8))
d.rectangle([mx(25),my(25),mx(755),my(499)], outline=WALLB, width=ml(0.8))

# ---------- doors ----------
def door_v(x,y0,side,floor,w=26):
    d.rectangle([mx(x-WW/2-0.6),my(y0),mx(x+WW/2+0.6),my(y0+w)], fill=floor)
    ln(x,y0,x+side*w,y0,FU,1.1)
    bb=[mx(x-w),my(y0-w),mx(x+w),my(y0+w)]
    d.arc(bb,(0 if side>0 else 90),(90 if side>0 else 180),fill=FU2,width=ml(0.9))
def door_h(y,x0,side,floor,w=26):
    d.rectangle([mx(x0),my(y-WW/2-0.6),mx(x0+w),my(y+WW/2+0.6)], fill=floor)
    ln(x0,y,x0,y+side*w,FU,1.1)
    bb=[mx(x0-w),my(y-w),mx(x0+w),my(y+w)]
    d.arc(bb,(0 if side>0 else 270),(90 if side>0 else 360),fill=FU2,width=ml(0.9))
for y0 in (88,206,332,444): door_v(250,y0,+1,HALL)
for y0 in (36,132,228,324,424): door_v(470,y0,-1,{36:WK,132:MED,228:DINE,324:LAUN,424:YARD}[y0])

# ---------- furniture ----------
SURF = mix(PAPER,INK,0.035)
def bed(x,y,w,h,bare=False):
    d.rectangle([mx(x),my(y),mx(x+w),my(y+h)], outline=FU, fill=mix(PAPER,INK,0.03), width=ml(1.1))
    ln(x+1.8,y+1,x+1.8,y+h-1,FU,2.4)
    rr(x+7,y+8,24,h-16,4,FU2,fill=mix(PAPER,INK,0.02),wid=0.9)
    if bare:
        for i in range(9):
            ln(x+36+i*11,y+4,x+30+i*11,y+h-4,FU3,0.7)
        ln(x+w-3.5,y+2,x+w-3.5,y+h-2,FU2,0.8)
    else:
        bx0,be = x+38,x+w-3
        d.polygon(PX([(bx0,y+3),(be,y+3),(be,y+h-3),(bx0,y+h-3)]), fill=mix(PAPER,INK,0.085))
        ln(bx0,y+3,bx0,y+h-3,FU2,0.9)
        d.polygon(PX([(bx0,y+3),(bx0+13,y+3),(bx0+18,y+h-3),(bx0+5,y+h-3)]), fill=mix(PAPER,INK,0.02))
        ln(bx0+13,y+3,bx0+18,y+h-3,FU3,0.7)
        for cx2 in (bx0+34,bx0+58,bx0+82): ln(cx2,y+5,cx2+6,y+h-5,FU3,0.65)
        ln(be,y+3,be,y+h-3,FU2,0.8)

def chair(cx,cy,r=8,back='top'):
    d.rounded_rectangle([mx(cx-r),my(cy-r),mx(cx+r),my(cy+r)], radius=ml(3), outline=FU2, fill=SURF, width=ml(0.9))
    if back=='top': ln(cx-r+1,cy-r,cx+r-1,cy-r,FU,1.6)
    if back=='left': ln(cx-r,cy-r+1,cx-r,cy+r-1,FU,1.6)
def table(x,y,w,h):
    d.rectangle([mx(x),my(y),mx(x+w),my(y+h)], outline=FU, fill=SURF, width=ml(1.1))
    d.rectangle([mx(x+2),my(y+2),mx(x+w-2),my(y+h-2)], outline=FU3, width=ml(0.6))
def shelf(x,y,w,h,n=3):
    d.rectangle([mx(x),my(y),mx(x+w),my(y+h)], outline=FU, fill=SURF, width=ml(1.1))
    for i in range(1,n): ln(x+1,y+h*i/n,x+w-1,y+h*i/n,FU3,0.8)
def boxes(x,y,items):
    for bx,by,bw,bh in items:
        d.rectangle([mx(x+bx),my(y+by),mx(x+bx+bw),my(y+by+bh)], outline=FU2, fill=SURF, width=ml(0.9))
def barrel(cx,cy,r=12):
    el(cx-r,cy-r,2*r,2*r,FU,fill=SURF)
    el(cx-r*0.55,cy-r*0.55,r*1.1,r*1.1,FU3)

# --- cell 1 ---
bed(30,50,132,52)
el(196,42,26,32,FU,fill=SURF); rr(196,34,26,9,2,FU2,fill=SURF,wid=0.9)
el(198,90,22,16,FU2,fill=SURF); ln(219,96,228,96,FU2,1.2)
el(176,116,18,18,FU2,fill=SURF)
for wy0 in (58,182,306):
    wy1 = wy0+38
    d.rectangle([mx(16),my(wy0),mx(26),my(wy1)], fill=mix(PAPER,INK,0.02), outline=FU2, width=ml(0.9))
    for wy in range(int(wy0+10), int(wy1)-4, 9): ln(17,wy,25,wy,FU3,0.8)
# --- cell 2 ---
bed(30,172,132,52)
table(188,166,56,42); chair(216,220,9)
el(200,174,9,9,FU3); d.rectangle([mx(214),my(172),mx(228),my(186)], outline=FU3, fill=SURF, width=ml(0.7))
ln(198,200,236,200,FU3,0.8)
shelf(188,236,56,14,2); boxes(188,236,[(3,3,11,8),(19,3,13,8),(37,3,15,8)])
# --- cell 3 ---
bed(30,296,132,52,bare=True)
d.polygon(PX([(168,330),(184,324),(196,332),(192,344),(200,350),(188,356),(172,352),(162,342)]),
          fill=mix(PAPER,INK,0.06)); poly([(168,330),(184,324),(196,332),(192,344),(200,350),(188,356),(172,352),(162,342)],FU2,wid=0.8)
ln(170,336,186,336,FU3,0.65); ln(174,344,192,340,FU3,0.65); ln(180,350,196,346,FU3,0.65)
d.polygon(PX([(196,332),(214,326),(222,332),(210,338)]), fill=mix(PAPER,INK,0.05)); poly([(196,332),(214,326),(222,332),(210,338)],FU3,wid=0.6)
el(196,290,18,18,FU2,fill=SURF); ln(205,299,222,314,FU3,1.0)
ln(120,368,142,382,FU3,0.9); ln(130,364,152,378,FU3,0.9)
# --- storage ---
shelf(30,420,110,28,2); boxes(30,422,[(4,4,16,9),(24,4,12,9),(40,4,20,9),(66,4,14,9),(86,4,16,9)])
shelf(30,454,110,26,2); boxes(30,456,[(5,4,14,8),(23,4,18,8),(45,4,12,8),(61,4,22,8),(87,4,14,8)])
d.rectangle([mx(154),my(416),mx(206),my(468)], outline=FU, fill=SURF, width=ml(1.1))
ln(154,416,206,468,FU2,0.9); ln(206,416,154,468,FU2,0.9)
d.rectangle([mx(154),my(474),mx(192),my(502)], outline=FU2, fill=SURF, width=ml(0.9))
barrel(222,470,13); barrel(222,446,10)
ln(96,478,120,502,FU2,1.2)
d.polygon(PX([(88,470),(104,478),(96,490),(80,482)]), fill=SURF); poly([(88,470),(104,478),(96,490),(80,482)],FU2,wid=0.8)

# --- workshop ---
d.rectangle([mx(482),my(38),mx(690),my(70)], outline=FU, fill=SURF, width=ml(1.1))
d.rectangle([mx(486),my(42),mx(686),my(66)], outline=FU3, width=ml(0.6))
ln(496,54,516,54,FU2,1.3); d.rectangle([mx(514),my(49),mx(522),my(59)], outline=FU2, fill=SURF, width=ml(0.8))
ln(532,46,538,62,FU2,1.1); ln(548,46,554,62,FU2,1.1); ln(566,50,572,60,FU2,1.1)
d.rectangle([mx(584),my(44),mx(626),my(64)], outline=FU2, fill=SURF, width=ml(0.9)); ln(605,44,605,52,FU2,1.2)
d.rectangle([mx(584),my(44),mx(626),my(64)], outline=FU2, width=ml(0.8))
el(500,80,20,20,FU,fill=SURF); el(505,85,10,10,FU3); ln(510,100,510,106,FU3,1.0)
shelf(700,40,52,62,3)
for cy2 in (48,68,88): el(706,cy2,12,12,FU3)
ln(636,44,650,44,FU2,1.0); ln(636,50,650,50,FU3,0.9)
d.rectangle([mx(640),my(78),mx(684),my(96)], outline=FU2, fill=SURF, width=ml(0.9))
ln(640,87,684,87,FU3,0.8); el(647,99,7,7,FU3); el(673,99,7,7,FU3)

# --- medical ---
d.rectangle([mx(482),my(132),mx(616),my(178)], outline=FU, fill=mix(PAPER,INK,0.03), width=ml(1.1))
ln(483.8,133,483.8,177,FU,2.2)
rr(487,138,24,32,4,FU2,fill=mix(PAPER,INK,0.02),wid=0.9)
d.polygon(PX([(516,135),(613,135),(613,175),(516,175)]), fill=mix(PAPER,INK,0.075))
ln(516,135,516,175,FU2,0.9)
for cx2 in (540,564,588): ln(cx2,137,cx2+4,173,FU3,0.65)
ln(624,124,624,186,FU2,1.3); el(618,124,13,17,FU2,fill=SURF); ln(624,186,618,190,FU3,1.0)
shelf(700,130,54,48,3); el(706,134,12,9,FU3); el(722,134,12,9,FU3); el(738,134,12,9,FU3)
table(482,190,58,20); chair(510,220,8)
ln(660,190,678,190,RED,1.7); ln(669,181,669,199,RED,1.7)

# --- dining ---
def table_set(y):
    d.rectangle([mx(486),my(y),mx(636),my(y+22)], outline=FU, fill=SURF, width=ml(1.1))
    ln(486,y+4,636,y+4,FU3,0.7)
    d.rectangle([mx(490),my(y-9),mx(632),my(y-3)], outline=FU2, fill=SURF, width=ml(0.8))
    d.rectangle([mx(490),my(y+25),mx(632),my(y+31)], outline=FU2, fill=SURF, width=ml(0.8))
    for i in range(4): el(494+i*36,y+6,11,11,FU3)
table_set(230); table_set(276)
d.rectangle([mx(662),my(226),mx(756),my(252)], outline=FU, fill=SURF, width=ml(1.1))
el(674,230,18,18,FU2,fill=SURF); el(700,232,13,13,FU3)
el(724,286,16,16,FU2,fill=SURF); ln(728,290,736,298,FU3,0.9)

# --- laundry ---
def washer(x,y,s=42):
    d.rectangle([mx(x),my(y),mx(x+s),my(y+s)], outline=FU, fill=SURF, width=ml(1.1))
    el(x+s*0.18,y+s*0.22,s*0.62,s*0.62,FU2); el(x+s*0.40,y+s*0.44,s*0.18,s*0.18,FU3)
    el(x+s-13,y+6,7,7,FU3)
washer(482,326); washer(532,326); washer(582,326)
d.polygon(PX([(700,336),(752,336),(746,386),(706,386)]), fill=SURF); poly([(700,336),(752,336),(746,386),(706,386)],FU2,wid=1.0)
ln(704,344,748,344,FU3,0.8); ln(703,352,749,352,FU3,0.8)
ln(478,392,758,392,FU2,1.3); ln(478,397,758,397,FU3,0.9)
for jx in (500,560,620,680,740): ln(jx,386,jx,398,FU2,0.9)

# --- yard ---
el(516,436,7,7,FU); el(596,436,7,7,FU); ln(516,436,596,436,FU,1.4)
ln(516,436,516,448,FU3,0.9); ln(596,436,596,448,FU3,0.9)
el(656,466,12,12,FU2)
d.ellipse([mx(560),my(450),mx(624),my(500)], outline=FU3, width=ml(0.9))
d.rectangle([mx(716),my(478),mx(752),my(492)], outline=FU2, fill=SURF, width=ml(0.8))
for gy2 in range(482,491,3): ln(718,gy2,750,gy2,FU3,0.7)

# --- corridor props ---
d.rectangle([mx(258),my(398),mx(322),my(412)], outline=FU2, fill=SURF, width=ml(0.9))
el(430,462,20,20,FU2,fill=SURF); ln(430,472,414,486,FU3,1.1)
el(350,300,14,14,FU3); ln(347,307,353,307,FU3,0.8); ln(350,304,350,310,FU3,0.8)

# --- extra yard detail ---
d.rectangle([mx(536),my(408),mx(566),my(414)], outline=FU2, fill=SURF, width=ml(0.8))
el(551,420,13,13,FU2); ln(545,426,557,432,FU3,0.8)
d.rectangle([mx(690),my(418),mx(742),my(432)], outline=FU2, fill=SURF, width=ml(0.9))
ln(696,418,696,432,FU3,0.7); ln(736,418,736,432,FU3,0.7)

# ---------- scale & gate ----------
ln(276,486,344,486,FU2,1.2)
for sxx in (276,310,344): ln(sxx,481,sxx,491,FU2,1.0)
mtxt(278,470,'0',font('song',8),MUTED,align='l'); mtxt(336,470,'10',font('song',8),MUTED,align='l')
d.rectangle([mx(556),my(499),mx(646),my(510)], fill=MAPPAPER, outline=INK, width=ml(1.2))
for gx in (569,582,595,608,621,634): ln(gx,499,gx,510,INK,0.9)
mtxt(601,464,'闸 门',font('song',9),INK2)

# ---------- portraits ----------

CARD=(250,243,227)
def portrait(vcx,vcy,kind):
    w,h = 50,62
    x0,y0 = vcx-w/2, vcy-h/2
    d.rectangle([mx(x0),my(y0),mx(x0+w),my(y0+h)],fill=CARD,outline=mix(INK,PAPER,0.16),width=ml(1.4))
    d.rectangle([mx(x0+2.4),my(y0+2.4),mx(x0+w-2.4),my(y0+h-2.4)],outline=mix(CARD,INK,0.20),width=ml(0.6))
    hx,hy = vcx, y0+23
    rx,ry = 10.0,11.2
    line = mix(INK,PAPER,0.16)
    d.ellipse([mx(hx-rx),my(hy-ry),mx(hx+rx),my(hy+ry*0.95)],outline=line,width=ml(1.3))
    if kind=='prisoner':
        d.pieslice([mx(hx-rx),my(hy-ry),mx(hx+rx),my(hy+ry*0.28)],180,360,fill=mix(INK,PAPER,0.48))
        for sxx in (-7,-4.5,-2,0.5,3,5.5,8):
            d.line([mx(hx+sxx),my(hy-ry+1.5),mx(hx+sxx+0.8),my(hy-ry+8)],fill=CARD,width=ml(0.55))
        d.line([mx(hx-rx-1.2),my(hy+2),mx(hx-rx+1.2),my(hy+4)],fill=line,width=ml(0.9))
        d.line([mx(hx+rx-1.2),my(hy+2),mx(hx+rx+1.2),my(hy+4)],fill=line,width=ml(0.9))
        for sxx in (-4.5,-2.2,0,2.2,4.5):
            d.line([mx(hx+sxx),my(hy+9.2),mx(hx+sxx),my(hy+10.6)],fill=mix(INK,PAPER,0.55),width=ml(0.5))
    else:
        d.rectangle([mx(hx-rx-2),my(hy-ry-3.2),mx(hx+rx+2),my(hy-ry*0.32)],fill=mix(INK,PAPER,0.44),outline=line,width=ml(1.0))
        d.line([mx(hx-rx-4),my(hy-ry*0.32),mx(hx+rx+4),my(hy-ry*0.32)],fill=line,width=ml(1.6))
        d.line([mx(hx-rx-2),my(hy-ry-3.2),mx(hx+rx+2),my(hy-ry-3.2)],fill=line,width=ml(0.9))
        d.ellipse([mx(hx-2.2),my(hy-ry+1.2),mx(hx+2.2),my(hy-ry+5.6)],outline=CARD,width=ml(0.8))
    d.line([mx(hx-4.6),my(hy+1.4),mx(hx-2.0),my(hy+1.4)],fill=line,width=ml(1.1))
    d.line([mx(hx+2.0),my(hy+1.4),mx(hx+4.6),my(hy+1.4)],fill=line,width=ml(1.1))
    d.line([mx(hx-1.8),my(hy+6.2),mx(hx+1.8),my(hy+6.2)],fill=line,width=ml(0.8))
    d.line([mx(hx-3.6),my(hy+ry*0.95),mx(hx-4.6),my(y0+h-14)],fill=line,width=ml(1.0))
    d.line([mx(hx+3.6),my(hy+ry*0.95),mx(hx+4.6),my(y0+h-14)],fill=line,width=ml(1.0))
    d.arc([mx(x0+4),my(y0+h-24),mx(x0+w-4),my(y0+h+14)],203,337,fill=line,width=ml(1.2))
    if kind=='prisoner':
        d.line([mx(hx-6),my(y0+h-13),mx(hx),my(y0+h-6)],fill=line,width=ml(0.9))
        d.line([mx(hx+6),my(y0+h-13),mx(hx),my(y0+h-6)],fill=line,width=ml(0.9))

# pasted-photo shadow
psh = Image.new('RGBA',(W,H),(0,0,0,0)); pdr = ImageDraw.Draw(psh)
for vcx,vcy in ((345,250),(405,394)):
    pdr.rectangle([mx(vcx-25+2),my(vcy-31+2.5),mx(vcx+25+2),my(vcy+31+2.5)],fill=(60,44,26,52))
psh = psh.filter(ImageFilter.GaussianBlur(4*S))
img.alpha_composite(psh); d = ImageDraw.Draw(img)
portrait(345,250,'prisoner')
mtxt(345,292,'他',font('song',9.5),RED)
portrait(405,394,'guard')
mtxt(405,436,'狱警',font('song',9.5),STEEL)

# ---------- yesterday's path ----------
path=[(196,326),(250,326),(300,326),(300,161),(470,161),(566,161)]
dash_c = mix(MAPPAPER,RED,0.46)
for i in range(len(path)-1):
    x1,y1 = path[i]; x2,y2 = path[i+1]
    seg = math.hypot(x2-x1,y2-y1); n = max(1,int(seg/13))
    for k in range(n):
        if k%2: continue
        t0,t1 = k/n,(k+1)/n
        d.line([mx(x1+(x2-x1)*t0),my(y1+(y2-y1)*t0),mx(x1+(x2-x1)*t1),my(y1+(y2-y1)*t1)],fill=dash_c,width=ml(1.5))
mtxt(448,139,'21:59',font('song',8.5),mix(MAPPAPER,RED,0.66))

fl = font('song',11)
HALO = [(-1.3,0),(1.3,0),(0,-1.3),(0,1.3),(-1.3,-1.3),(1.3,-1.3),(-1.3,1.3),(1.3,1.3)]
def room_label(lx,ly,lab,col,hcol,tracking=1):
    for ox,oy in HALO: mtxt(lx+ox,ly+oy,lab,fl,hcol,tracking=tracking,align='l')
    mtxt(lx,ly,lab,fl,col,tracking=tracking,align='l')
room_label(32,28,'一 号 牢 房',INK2,CELL)
room_label(32,152,'二 号 牢 房',INK2,CELL)
room_label(32,276,'三 号 牢 房',RED,CELL)
room_label(32,400,'储 藏 室',INK2,STORE)
room_label(486,24,'工 具 间',INK2,WK)
room_label(486,120,'医 务 室',INK2,MED)
room_label(486,216,'食 堂',INK2,DINE)
room_label(486,312,'洗 衣 房',INK2,LAUN)
room_label(488,408,'放 风 区',INK2,YARD)
for ox,oy in HALO: mtxt(360+ox,196+oy,'走 廊',font('song',11),HALL,tracking=6)
mtxt(360,196,'走 廊',font('song',11),MUTED,tracking=6)

d.line([mx(30),my(492),mx(110),my(492)],fill=mix(INK,PAPER,0.45),width=ml(1.1))
for sxx in (30,70,110): d.line([mx(sxx),my(488),mx(sxx),my(496)],fill=mix(INK,PAPER,0.45),width=ml(1))
mtxt(34,478,'0',font('song',8),MUTED,align='l'); mtxt(102,478,'10',font('song',8),MUTED,align='l')

d.rectangle([mx(556),my(499),mx(646),my(510)],fill=MAPPAPER,outline=INK,width=ml(1.2))
for gx in (569,582,595,608,621,634): d.line([mx(gx),my(499),mx(gx),my(510)],fill=INK,width=ml(0.9))
mtxt(601,464,'闸 门',font('song',9),INK2)

# ---------- pencil note ----------

pl = Image.new('RGBA',(W,H),(0,0,0,0)); pd = ImageDraw.Draw(pl)
for i in range(2):
    pts=[]
    for k in range(56):
        a = 2*math.pi*k/56
        rr = 1.0+0.06*random.uniform(-1,1)
        pts.append((mx(74+44*rr*math.cos(a)), my(278+15*rr*math.sin(a))))
    pd.line(pts+[pts[0]], fill=PENCIL+(115,), width=max(1,int(1.4*S)), joint='curve')
pd.line([(mx(122),my(276)),(mx(140),my(292))],fill=PENCIL+(90,),width=max(1,int(1.1*S)))
pd.line([(mx(310),my(808)),(mx(548),my(806))],fill=PENCIL+(85,),width=max(1,int(1.3*S)))
pd.line([(mx(310),my(816)),(mx(470),my(814))],fill=PENCIL+(55,),width=max(1,int(1.0*S)))
pl = pl.rotate(-1.4, resample=Image.BICUBIC, center=(P(800),P(500)))
img.alpha_composite(pl)
note = Image.new('RGBA',(P(150),P(44)),(0,0,0,0)); nd=ImageDraw.Draw(note)
nd.text((0,0),'床单？',font=font('kai',14),fill=PENCIL+(150,))
note = note.rotate(4, resample=Image.BICUBIC, expand=False)
img.alpha_composite(note,(int(mx(128)),int(my(272))))

# ---------- rules ----------
PX=1158
txt(PX,186,'狱 规',font('song',15),INK2,tracking=8)
txt(1468,190,'至多六条',font('song',10),MUT2,align='r')
def bullet(x,y,col): d.polygon([(P(x),P(y+1.5)),(P(x+4.5),P(y+5)),(P(x),P(y+8.5))],fill=col)
for (num,body,comp),y in zip([('①','入夜后，任何人不得离开自己的房门。','22:00–05:00 · 全区域 · 禁止位移 · 无例外'),
                              ('②','医务室须两人同行方可进入。','全时段 · 医务室 · 需 2 人 · 无例外'),
                              ('③','工具间铁器，任何人不得触碰。','全时段 · 工具间 · 禁止取物 · 无例外')],[238,300,362]):
    txt(PX,y+2,num,font('song',11.5),MUTED)
    txt(PX+24,y,body,font('kai',17),INK)
    bullet(PX+26,y+33,mix(PAPER,WARM,0.85))
    txt(PX+36,y+30,comp,font('song',10.5),WARM,tracking=0.3)
for num,y in [('④',428),('⑤',466),('⑥',504)]:
    txt(PX,y+2,num,font('song',11.5),MUT2)
    d.line([P(PX+26),P(y+24),P(1468),P(y+24)],fill=mix(PAPER,INK,0.24),width=max(1,int(S)))
d.line([P(PX),P(654),P(1468),P(654)],fill=mix(PAPER,INK,0.20),width=max(1,int(S)))
txt(PX,666,'状 态',font('song',10),MUT2,tracking=4)
def gauge(y,name,val,color):
    txt(PX,y,name,font('song',11),MUTED,tracking=1)
    bx0,bx1 = PX+100,1436
    d.rectangle([P(bx0),P(y+5),P(bx1),P(y+10)],fill=mix(PAPER,INK,0.12))
    d.rectangle([P(bx0),P(y+5),P(bx0+(bx1-bx0)*val/100.0),P(y+10)],fill=color)
    txt(1468,y-1,str(val),font('song',10.5),INK2,align='r')
gauge(690,'狱警服从度',70,BRASS); gauge(716,'囚犯敌意',42,RED)

# ---------- report ----------
d.line([P(132),P(752),P(1468),P(752)],fill=mix(PAPER,INK,0.42),width=max(1,int(S)))
txt(132,762,'巡 查 报 告',font('song',13),INK2,tracking=4)
txt(132,796,'DAY 03 / 07',font('song',10),MUT2,tracking=1)
for tm,body,y in [('21:47','三号牢房的灯还亮着。他没有离开牢房区。',760),('21:52','值夜记录多了一行：床单少了一条。',794)]:
    txt(256,y+2,tm,font('song',12.5),MUTED,tracking=0.5)
    txt(310,y,body,font('song',16),(44,39,33),tracking=0.6)

SS=92
seal = Image.new('RGBA',(P(SS+26),P(SS+26)),(0,0,0,0)); sd=ImageDraw.Draw(seal)
pad=P(13); e=P(SS)
sd.rectangle([pad,pad,pad+e,pad+e],outline=REDD+(205,),width=int(2.8*S))
sd.rectangle([pad+P(7),pad+P(7),pad+e-P(7),pad+e-P(7)],outline=REDD+(185,),width=int(1.0*S))
sf=font('kai',20); tw=sd.textlength('查 讫',font=sf)
sd.text((pad+(e-tw)/2,pad+e/2-sf.size*0.62),'查 讫',font=sf,fill=REDD+(200,))
seal = seal.rotate(-9,resample=Image.BICUBIC,expand=False)
img.alpha_composite(seal,(int(P(1418-(SS+26)/2)),int(P(802-(SS+26)/2))))

txt(132,890,'值班人',font('song',11),MUTED,tracking=2)
txt(194,883,'李',font('kai',15),INK2,tracking=3)
d.line([P(216),P(903),P(368),P(903)],fill=mix(PAPER,INK,0.32),width=max(1,int(S)))
txt(1468,890,'第 三 页 / 共 七 页',font('song',11),MUTED,tracking=2,align='r')

# ---------- secondary filing stamp ----------
fst = Image.new('RGBA',(P(120),P(120)),(0,0,0,0)); fsd=ImageDraw.Draw(fst)
fc=(74,82,92)
fsd.ellipse([P(22),P(22),P(98),P(98)],outline=fc+(52,),width=max(1,int(1.8*S)))
fsd.ellipse([P(30),P(30),P(90),P(90)],outline=fc+(34,),width=max(1,int(0.9*S)))
fsd.text((P(43),P(48)),'已核',font=font('kai',13),fill=fc+(58,))
fsd.text((P(40),P(68)),'11.16',font=font('song',8.5),fill=fc+(46,))
fst = fst.rotate(-7,resample=Image.BICUBIC,expand=False)
img.alpha_composite(fst,(int(P(960)),int(P(830))))

# ---------- punch holes ----------

for hy in (196, 764):
    d.ellipse([P(SX0+19),P(hy-6.2),P(SX0+31.4),P(hy+6.2)],fill=(58,47,35))
    d.arc([P(SX0+18),P(hy-7.2),P(SX0+32.4),P(hy+7.2)],185,325,fill=(120,102,78),width=max(1,int(1.6*S)))

# ---------- aging ----------
base.alpha_composite(img)
region = base.crop((P(SX0),P(SY0),P(SX1),P(SY1)))
a = np.array(region.convert('RGB')).astype(np.float32)
h2,w2 = a.shape[:2]

small = rng.normal(0,1,(14,10)).astype(np.float32)
small = (small-small.min())/(small.max()-small.min())
m = np.array(Image.fromarray((small*255).astype(np.uint8)).resize((w2,h2),Image.BICUBIC)).astype(np.float32)/255.0
a = a*(0.928+0.105*m)[:,:,None]
a = a + np.stack([rng.normal(0,6.2,a.shape[:2]),rng.normal(0,5.8,a.shape[:2]),rng.normal(0,5.2,a.shape[:2])],-1)

fib = Image.new('RGBA',(w2,h2),(0,0,0,0)); fdr=ImageDraw.Draw(fib)
for _ in range(2100):
    fx,fy = rng.uniform(0,w2), rng.uniform(0,h2)
    ln = rng.uniform(3,16); an = rng.uniform(0,math.pi)
    fdr.line([(fx,fy),(fx+ln*math.cos(an),fy+ln*math.sin(an))],
             fill=mix(PAPER,(146,114,72),0.60)+(int(rng.uniform(14,34)),), width=1)
a = np.array(Image.alpha_composite(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).convert('RGBA'), fib).convert('RGB')).astype(np.float32)

fox = Image.new('RGBA',(w2,h2),(0,0,0,0)); fdx=ImageDraw.Draw(fox)
for _ in range(150):
    fx,fy = rng.uniform(0,w2), rng.uniform(0,h2)
    r = rng.uniform(1,9)*S
    fdx.ellipse([fx-r,fy-r,fx+r,fy+r], fill=(143,108,62,int(rng.uniform(10,30))))
fox = fox.filter(ImageFilter.GaussianBlur(2))
a = np.array(Image.alpha_composite(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).convert('RGBA'), fox).convert('RGB')).astype(np.float32)

st = Image.new('RGBA',(w2,h2),(0,0,0,0)); sdd=ImageDraw.Draw(st)
for cxr,cyr,rr,al in [(0.26,0.74,165,22),(0.74,0.26,135,19),(0.55,0.88,160,17),(0.92,0.82,120,17),(0.12,0.24,110,15),(0.86,0.10,105,13)]:
    cx0,cy0 = cxr*w2, cyr*h2
    pts=[]
    for k in range(18):
        an=2*math.pi*k/18; rad=rr*S*rng.uniform(0.6,1.25)
        pts.append((cx0+rad*math.cos(an), cy0+rad*math.sin(an)))
    sdd.polygon(pts, fill=(148,116,74,al))
st = st.filter(ImageFilter.GaussianBlur(34*S))
a = np.array(Image.alpha_composite(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).convert('RGBA'), st).convert('RGB')).astype(np.float32)

# tea ring
ring = Image.new('RGBA',(w2,h2),(0,0,0,0)); rd=ImageDraw.Draw(ring)
rcx,rcy,rr = 0.905*w2, 0.605*h2, 52*S
for seg in [(0,60),(80,150),(175,240),(265,330),(345,360)]:
    rd.arc([rcx-rr,rcy-rr,rcx+rr,rcy+rr], seg[0], seg[1], fill=(150,110,62,26), width=int(3.2*S))
ring = ring.filter(ImageFilter.GaussianBlur(3))
a = np.array(Image.alpha_composite(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).convert('RGBA'), ring).convert('RGB')).astype(np.float32)

# crease
cr = np.zeros((h2,w2),np.float32)
cxp = int(0.702*w2)
for i,al in ((-3,0.035),(0,0.055),(3,0.03)):
    xs = np.clip(cxp+i+ (rng.normal(0,1.2,w2)),0,w2-1).astype(np.int32)
    cr[np.arange(h2)[:,None], xs[None,:]] += al
cr = np.array(Image.fromarray((np.clip(cr,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)/255
a = a*(1-cr)[:,:,None]

# fingerprints & scratches
fp = Image.new('RGBA',(w2,h2),(0,0,0,0)); fpp=ImageDraw.Draw(fp)
for _ in range(4):
    fx,fy = rng.uniform(0.55,0.98)*w2, rng.uniform(0.15,0.85)*h2
    r = rng.uniform(26,44)*S
    for k in range(14):
        an=2*math.pi*k/14
        fpp.ellipse([fx+r*0.9*math.cos(an)-r*0.22, fy+r*0.55*math.sin(an)-r*0.10,
                     fx+r*0.9*math.cos(an)+r*0.22, fy+r*0.55*math.sin(an)+r*0.10],
                    fill=(96,86,66,int(rng.uniform(4,9))))
fp = fp.filter(ImageFilter.GaussianBlur(6*S))
a = np.array(Image.alpha_composite(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).convert('RGBA'), fp).convert('RGB')).astype(np.float32)

sc = Image.new('RGBA',(w2,h2),(0,0,0,0)); scd=ImageDraw.Draw(sc)
for _ in range(40):
    sx,sy = rng.uniform(0,w2), rng.uniform(0,h2)
    ln = rng.uniform(20,90); an = rng.uniform(-0.35,0.35)
    scd.line([(sx,sy),(sx+ln*math.cos(an),sy+ln*math.sin(an))], fill=(252,246,232,int(rng.uniform(14,30))), width=1)
sc = sc.filter(ImageFilter.GaussianBlur(0.8*S))
a = np.array(Image.alpha_composite(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).convert('RGBA'), sc).convert('RGB')).astype(np.float32)

# edge wear
vx = np.minimum(np.arange(w2), w2-1-np.arange(w2)).astype(np.float32)[None,:]/ (26*S)
vy = np.minimum(np.arange(h2), h2-1-np.arange(h2)).astype(np.float32)[:,None]/ (26*S)
edge = np.clip(1-np.minimum(vx,vy),0,1)**2
irr = np.array(Image.fromarray((rng.normal(0,1,(40,30))*40+128).clip(0,255).astype(np.uint8)).resize((w2,h2),Image.BICUBIC)).astype(np.float32)/255
a = a*(1-0.20*edge*(0.5+irr))[:,:,None]

vy2,vx2 = np.mgrid[0:h2,0:w2].astype(np.float32)
nx=(vx2/w2-0.5)*2; ny=(vy2/h2-0.5)*2
a = a*(1-0.15*np.clip((nx**2+ny**2)*0.9,0,1))[:,:,None]
gl = np.exp(-(((vx2-w2*0.10)**2+(vy2+h2*0.06)**2)/(2*(w2*0.42)**2)))
a = a + gl[:,:,None]*np.array([10,9,6],np.float32)

a = a*np.array([1.012,0.985,0.948],np.float32)
a = np.clip(a,0,255).astype(np.uint8)
base.paste(Image.fromarray(a,'RGB'),(P(SX0),P(SY0)))
base.convert('RGB').resize((1600,1000),Image.LANCZOS).save(r'C:\Users\lcj\Desktop\tap\six-rules\concept.png','PNG')
print('OK', os.path.getsize(r'C:\Users\lcj\Desktop\tap\six-rules\concept.png'))
