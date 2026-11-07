from PIL import Image, ImageOps
from pathlib import Path
p=Path("assets"); p.mkdir(exist_ok=True)
im=Image.open(p/"logo.webp").convert("RGBA")
# Preserve original club crest; remove only white pixels connected to the outer edge.
from collections import deque
pix=im.load(); w,h=im.size; seen=set(); q=deque()
for x in range(w): q.append((x,0));q.append((x,h-1))
for y in range(h): q.append((0,y));q.append((w-1,y))
while q:
 x,y=q.popleft()
 if x<0 or y<0 or x>=w or y>=h or (x,y) in seen: continue
 r,g,b,a=pix[x,y]
 if min(r,g,b)<238 or max(r,g,b)-min(r,g,b)>16: continue
 seen.add((x,y));pix[x,y]=(r,g,b,0)
 q.extend(((x-1,y),(x+1,y),(x,y-1),(x,y+1)))
bbox=im.getbbox()
if bbox: im=im.crop(bbox)
def square(size,background=None,pad=0.08):
 bg=Image.new("RGBA",(size,size),background or (0,0,0,0))
 limit=int(size*(1-2*pad)); subject=im.copy();subject.thumbnail((limit,limit),Image.Resampling.LANCZOS)
 bg.alpha_composite(subject,((size-subject.width)//2,(size-subject.height)//2))
 return bg
square(48).save(p/"favicon-48.png",optimize=True)
square(192).save(p/"favicon-192.png",optimize=True)
square(512).save(p/"favicon-512.png",optimize=True)
square(1200,"white",0.12).convert("RGB").save(p/"volla-google-logo-1200.png",optimize=True)
