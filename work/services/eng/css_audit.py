import re,sys
p='/home/user/Knightwebstudio/assets/css/pages/services.css'
raw=open(p).read()
print('bytes',len(raw.encode()), 'budget 5000, headroom', 5000-len(raw.encode()))
css=re.sub(r'/\*.*?\*/','',raw,flags=re.S)
print('comment bytes', len(raw)-len(css))
# flatten media
rules=[]
i=0
def parse(block,media=None):
    pos=0
    while True:
        m=re.compile(r'\s*([^{}]+)\{').match(block,pos)
        if not m: break
        sel=m.group(1).strip(); start=m.end(); depth=1; j=start
        while depth:
            if block[j]=='{': depth+=1
            elif block[j]=='}': depth-=1
            j+=1
        body=block[start:j-1]
        if sel.startswith('@media'): parse(body,sel)
        else: rules.append((media,sel,body.strip()))
        pos=j
parse(css)
print(len(rules),'rules')
bad=0
for media,sel,body in rules:
    for s in [x.strip() for x in re.split(r',(?![^()]*\))',sel)]:
        if not (s.startswith('[data-page="services"]') or s.startswith('.js [data-page="services"]')):
            print('UNSCOPED',s); bad+=1
    if ':hover' in sel and not (media and 'hover: hover' in media): print('HOVER OUTSIDE',sel); bad+=1
    if '!important' in body: print('IMPORTANT',sel); bad+=1
    if re.search(r'#[0-9a-fA-F]{3,8}\b',body): print('HEX',sel,body); bad+=1
    if re.search(r'rgba?\(|hsla?\(',body): print('RAW COLOUR FN',sel); bad+=1
    for decl in body.split(';'):
        d=decl.strip()
        if not d: continue
        vals=re.sub(r'var\([^()]*(\([^()]*\))?[^()]*\)','VAR',d.split(':',1)[1]) if ':' in d else ''
        rawnums=re.findall(r'(?<![\w.-])(\d*\.?\d+)(px|rem|em|s|ms|vw|vh|%|deg|fr)?\b',vals)
        rawnums=[(n,u) for n,u in rawnums if not (n in('0','1') and u in('','fr')) ]
        if rawnums: print(f'  RAW {sel[23:70]!r:52} {d}')
    if media:
        for w in re.findall(r'(\d+(?:\.\d+)?)px',media):
            if float(w) not in (380,379.98,600,599.98,760,759.98,980,979.98,1100,1099.98,1280,1279.98): print('BAD BREAKPOINT',media); bad+=1
print('hard-rule problems:',bad)
print('\nmedia queries used:'); 
for m in sorted(set(r[0] for r in rules if r[0])): print('  ',m)
for w in ['color-mix','backdrop-filter',':has(','@supports','subgrid','text-wrap','[data-theme','font-family','transition','animation']:
    if w in css: print('uses',w, [ (s[23:60]) for m,s,b in rules if w in b or w in s][:4])
