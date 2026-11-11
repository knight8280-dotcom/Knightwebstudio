import re, html, sys, pathlib, difflib
def vis(t, drop_toc=True):
    m = re.search(r'<main\b.*?</main>', t, flags=re.S | re.I); t = m.group(0)
    t = re.sub(r'<!--.*?-->', ' ', t, flags=re.S)
    t = re.sub(r'<(script|style|svg|template|noscript)\b.*?</\1>', ' ', t, flags=re.S | re.I)
    if drop_toc: t = re.sub(r'<nav class="toc".*?</nav>', ' ', t, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t))
    t = re.sub(r'\s+([.,;:!?)\]])', r'\1', re.sub(r'\s+', ' ', t)); t = re.sub(r'([(\[])\s+', r'\1', t)
    return t.strip().split(' ')
for page in sys.argv[3:]:
    a = vis(pathlib.Path(sys.argv[1], page).read_text()); b = vis(pathlib.Path(sys.argv[2], page).read_text())
    print('==', page, len(a), 'words before,', len(b), 'after', '(identical)' if a == b else '')
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op != 'equal': print('  ', op, '| was:', ' '.join(a[i1:i2])[:160], '| now:', ' '.join(b[j1:j2])[:160])
