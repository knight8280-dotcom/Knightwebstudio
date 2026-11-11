import re, html, pathlib, sys, difflib
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
A = R/'prefold'; B = pathlib.Path('/home/user/Knightwebstudio')
pages = ['index.html','services/index.html','consulting/index.html','work/index.html','process/index.html','pricing/index.html','faq/index.html','contact/index.html','about/index.html','start/index.html','web-design-baton-rouge/index.html','web-design-denham-springs/index.html','web-design-gonzales/index.html','web-design-prairieville/index.html','privacy/index.html','terms/index.html','checkout/index.html','checkout/success/index.html','404.html']
def vis(t, part):
    t = re.sub(r'(<!-- art:([a-z0-9-]+) -->).*?(<!-- /art:\2 -->)', r'\1\3', t, flags=re.S)
    if part == 'main':
        m = re.search(r'<main\b.*?</main>', t, flags=re.S); t = m.group(0)
    else:
        m = re.search(r'<body\b.*?</body>', t, flags=re.S); t = m.group(0)
        t = re.sub(r'<main\b.*?</main>', ' [MAIN] ', t, flags=re.S)
    t = re.sub(r'<!--.*?-->', ' ', t, flags=re.S)
    t = re.sub(r'<(script|style|svg|template)\b.*?</\1>', ' ', t, flags=re.S|re.I)
    # keep aria-label / alt / title / placeholder / value text as lines
    extra = re.findall(r'(?:aria-label|alt|placeholder|title)="([^"]*)"', t)
    t = re.sub(r'<wbr>', '', t)
    t = re.sub(r'<(/?)(p|li|h[1-6]|div|section|tr|td|th|dt|dd|option|label|legend|summary|figcaption|button|a|caption|header|footer|nav|ul|ol|dl|table|form|fieldset|article|aside|figure|br)\b[^>]*>', '\n', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = html.unescape(t)
    lines = [re.sub(r'\s+', ' ', l).strip() for l in t.split('\n')]
    lines = [l for l in lines if l]
    return lines, sorted(set(html.unescape(e) for e in extra))
for part in ('main','chrome'):
    for p in pages:
        a, ea = vis((A/p).read_text(), part); b, eb = vis((B/p).read_text(), part)
        d = [l for l in difflib.unified_diff(a, b, lineterm='', n=0) if not l.startswith(('---','+++','@@'))]
        de = [l for l in difflib.unified_diff(ea, eb, lineterm='', n=0) if not l.startswith(('---','+++','@@'))]
        if d or de:
            print('=====', part, p)
            for l in d: print('  ', l)
            if de:
                print('   [attr text]')
                for l in de: print('  ', l)
