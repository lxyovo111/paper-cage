from PIL import Image
import os
base = r"C:\Users\lcj\Desktop\tap\six-rules"
os.makedirs(os.path.join(base, "docs", "img"), exist_ok=True)
for src, dst in [("tools/cover-d.png","docs/img/cover-desktop.jpg"), ("tools/cover-m.png","docs/img/cover-mobile.jpg")]:
    im = Image.open(os.path.join(base, src)).convert("RGB")
    im.save(os.path.join(base, dst), quality=88)
    print(dst, im.size)