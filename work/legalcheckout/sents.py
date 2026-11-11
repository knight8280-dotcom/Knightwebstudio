import re, html, sys, pathlib
def norm(s):
    s = s.replace(' ', ' ').replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    s = s.replace('–', '-').replace('—', '-').replace('‑', '-')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s+([.,;:!?)\]])', r'\1', s)
    s = re.sub(r'([(\[])\s+', r'\1', s)
    return s.strip()
def visible(t):
    t = re.sub(r'<!--.*?-->', ' ', t, flags=re.S)
    t = re.sub(r'<(script|style|svg|template|noscript)\b.*?</\1>', ' ', t, flags=re.S | re.I)
    m = re.search(r'<body\b.*?>(.*)</body>', t, flags=re.S | re.I)
    t = m.group(1) if m else t
    t = re.sub(r'<[^>]+>', ' ', t)
    return norm(html.unescape(t))
def sentences(text):
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'$(])', text)
    return [p.strip() for p in parts if len(p.split()) >= 6]
def main_only(tt):
    mm = re.search(r'<main\b.*?</main>', tt, flags=re.S | re.I)
    return visible('<body>' + (mm.group(0) if mm else tt) + '</body>')
for f in sys.argv[1:]:
    print('=====', f)
    for s in sentences(main_only(pathlib.Path(f).read_text())):
        print(' -', s)
