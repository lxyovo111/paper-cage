
from PIL import Image
import os
base = r'C:\Users\lcj\Desktop\tap\six-rules\tools'
names = ['live-02-write','live-03-verdict','live-05-predict','live-06-night']
tiles = [Image.open(os.path.join(base,n+'.png')).convert('RGB').resize((800,500), Image.LANCZOS) for n in names]
sheet = Image.new('RGB',(1600,1000),(20,18,16))
for i,t in enumerate(tiles):
    sheet.paste(t, ((i%2)*800, (i//2)*500))
sheet.save(os.path.join(base,'live-sheet1.png'))
names2 = ['live-01-day','live-04-rule-written','live-07-after-night','live-08-settle']
tiles = [Image.open(os.path.join(base,n+'.png')).convert('RGB').resize((800,500), Image.LANCZOS) for n in names2]
sheet = Image.new('RGB',(1600,1000),(20,18,16))
for i,t in enumerate(tiles):
    sheet.paste(t, ((i%2)*800, (i//2)*500))
sheet.save(os.path.join(base,'live-sheet2.png'))
print('ok')

