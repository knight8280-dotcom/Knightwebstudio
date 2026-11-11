import sys
def L(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda x: x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=L(a),L(b); return (max(la,lb)+0.05)/(min(la,lb)+0.05)
pairs=sys.argv[1:]
for i in range(0,len(pairs),3):
    print(f"{pairs[i]:38s} {pairs[i+1]} on {pairs[i+2]}: {cr(pairs[i+1],pairs[i+2]):.2f}")
