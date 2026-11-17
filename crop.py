
from PIL import Image
im = Image.open(r'C:\Users\lcj\Desktop\tap\six-rules\concept.png')
im.crop((180,150,790,600)).resize((1220,900), Image.LANCZOS).save(r'C:\Users\lcj\Desktop\tap\six-rules\crop_map.png')
im.crop((1120,160,1490,760)).resize((740,1200), Image.LANCZOS).save(r'C:\Users\lcj\Desktop\tap\six-rules\crop_panel.png')
print('ok')
