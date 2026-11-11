import re,sys,difflib
R='/home/user/Knightwebstudio/'
B='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline/'
for p in ['privacy/index.html','terms/index.html','checkout/index.html','checkout/success/index.html']:
    a=open(B+p,encoding='utf-8').read(); b=open(R+p,encoding='utf-8').read()
    ha=a[:a.index('<body')]; hb=b[:b.index('<body')]
    print('=====',p,'HEAD diff')
    for l in difflib.unified_diff(ha.splitlines(),hb.splitlines(),lineterm='',n=0):
        print(l[:400])
    # inline scripts after </main>
    def scripts(s):
        return re.findall(r'<script\b[^>]*>.*?</script>',s[s.index('</main>'):],re.S)
    sa=scripts(a); sb=scripts(b)
    print('body scripts after main: baseline',len(sa),'new',len(sb),'identical' if sa==sb else 'DIFFER')
    if sa!=sb:
        for x,y in zip(sa,sb):
            if x!=y:
                for l in difflib.unified_diff(x.splitlines(),y.splitlines(),lineterm='',n=0): print(l[:300])
    # all scripts in body
    def bscripts(s):
        body=s[s.index('<body'):]
        return re.findall(r'<script\b[^>]*>.*?</script>',body,re.S)
    print('all body scripts baseline',len(bscripts(a)),'new',len(bscripts(b)), [x[:80] for x in bscripts(b)])
