from PIL import Image
im = Image.open(r'C:\Users\lcj\Desktop\tap\six-rules\tools\m2-day.png')
print(im.size)
im.crop((0, im.size[1]-320, im.size[0], im.size[1])).save(r'C:\Users\lcj\Desktop\tap\six-rules\tools\m-bottom.png')
px = im.load()
for y in [1600, 1680, 1720, 1745, 1755, 1765, 1775, 1785, 1790]:
    print(y, px[400, y])