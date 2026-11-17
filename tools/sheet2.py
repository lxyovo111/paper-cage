from PIL import Image
import os
base = r'C:\Users\lcj\Desktop\tap\six-rules\tools'
names = ['live-06-night','live-07-after-night']
tiles = [Image.open(os.path.join(base,n+'.png')).convert('RGB').resize((1200,750), Image.LANCZOS) for n in names]
sheet = Image.new('RGB',(1200,1500),(20,18,16))
for i,t in enumerate(tiles): sheet.paste(t,(0,i*750))
sheet.save(os.path.join(base,'live-night.png'))
print('ok')
