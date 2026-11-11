import json, collections
from PIL import Image
def lin(c):
    c/=255
    return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def L(rgb): return 0.2126*lin(rgb[0])+0.7152*lin(rgb[1])+0.0722*lin(rgb[2])
def cr(a,b):
    la,lb=L(a),L(b)
    if la<lb: la,lb=lb,la
    return (la+0.05)/(lb+0.05)
idx=json.load(open('contrast/index.json'))
worst=collections.defaultdict(lambda:(99,None))
rows=[]
for fr in idx:
    im=Image.open(fr['file']).convert('RGB'); S=2
    for r in fr['rects']:
        x0,y0,x1,y1=[int(v*S) for v in (r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])]
        x0=max(0,x0);y0=max(0,y0);x1=min(im.width,x1);y1=min(im.height,y1)
        if x1-x0<3 or y1-y0<3: continue
        px=list(im.crop((x0,y0,x1,y1)).getdata())
        cnt=collections.Counter(px); bg=cnt.most_common(1)[0][0]
        # foreground: the colour farthest in contrast from bg that occurs at least 3 times (solid glyph cores)
        cands=[c for c,nn in cnt.items() if nn>=3]
        fg=max(cands,key=lambda c:cr(c,bg))
        ratio=cr(fg,bg)
        key=(fr['W'],fr['theme'],'client' if fr['client'] else 'site',r['kind'], 'dim' if r['op']<1 else 'full')
        rows.append((ratio,key,r['text'],r['op'],r['effPx'],bg,fg,fr['file']))
        if ratio<worst[key][0]: worst[key]=(ratio,(r['text'],r['op'],r['effPx'],'bg #%02x%02x%02x'%bg,'fg #%02x%02x%02x'%fg,fr['file']))
print('frames analysed:',len(idx),' text samples:',len(rows))
for k in sorted(worst):
    ratio,info=worst[k]
    print(f"{ratio:5.2f}:1  {k}  {info}")
print('\n== smallest effective text sizes (font-size x transform scale) ==')
seen=set()
for ratio,key,text,op,eff,bg,fg,f in sorted(rows,key=lambda r:r[4]):
    if eff==0: continue
    k=(key[0],key[3],eff,op)
    if k in seen: continue
    seen.add(k)
    if eff<13: print(f"  {eff}px  opacity {op}  {key[0]}px {key[3]} '{text}'  contrast {ratio:.2f}:1")
