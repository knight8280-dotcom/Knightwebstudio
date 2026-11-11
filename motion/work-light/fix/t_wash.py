import json, numpy as np
from PIL import Image, ImageFilter
def lum(a): return 0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]
def load(f): return np.asarray(Image.open(f).convert('RGB').filter(ImageFilter.BoxBlur(4))).astype(float)   # averaged over 9px, so the grain does not count as light
for theme in ('light','dark'):
    for w in (1440,390):
        info=json.load(open(f'wash-{w}-{theme}.json')); clip=info['clip']
        fr=[load(f'wash-{w}-{theme}-{i}.png') for i in range(5)]; plain=load(f'wash-{w}-{theme}-plain.png')
        H,W=fr[0].shape[:2]; near=np.zeros((H,W),bool)
        for x,y,ww,hh in info['rects']:
            x0=int(max(0,x-22)); y0=int(max(0,y-clip['y']-22)); x1=int(min(W,x+ww+22)); y1=int(min(H,y-clip['y']+hh+22)); near[y0:y1,x0:x1]=True
        def stat(a,m): v=lum(a)[m]; return np.percentile(v,1), np.percentile(v,99)
        f=fr[0]; d=np.abs(f-plain).max(axis=2)
        lo,hi=stat(f,np.ones((H,W),bool)); ln,hn=stat(f,near); la,ha=stat(f,~near); pl=np.median(lum(plain))
        t=np.abs(fr[4]-fr[0]).max(axis=2)
        print(f'{theme} {w}: plain ground {pl:.1f}/255 | whole field {lo:.1f} to {hi:.1f} (span {100*(hi-lo)/255:.1f}%) | within 22px of text {ln:.1f} to {hn:.1f} ({100*(hn-ln)/255:.1f}%) | in the clear {la:.1f} to {ha:.1f} ({100*(ha-la)/255:.1f}%) | largest colour difference from the plain ground: near text {d[near].max():.0f}/255, in the clear {d[~near].max():.0f}/255 (99th pct {np.percentile(d,99):.0f}) | change over 160 shader-seconds: max {t.max():.0f}/255, 99th pct {np.percentile(t,99):.0f}, mean {t.mean():.1f}')
