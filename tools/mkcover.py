from PIL import Image
src = Image.open(r'C:\Users\lcj\Desktop\tap\six-rules\tools\card-title.jpg').convert('RGB')
W,H = 1600,900
im = src.copy()
im.thumbnail((W,H), Image.LANCZOS)
canvas = Image.new('RGB',(W,H),(232,220,192))
canvas.paste(im, ((W-im.width)//2,(H-im.height)//2))
canvas.save(r'C:\Users\lcj\Desktop\tap\six-rules\tools\card-cover.jpg', quality=90)
print(canvas.size)
