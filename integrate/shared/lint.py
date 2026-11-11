"""lint.py : the stylesheet's own rules, checked over the whole file (shared part and page blocks)."""
import re, pathlib, sys
src = pathlib.Path('/home/user/Knightwebstudio/assets/css/styles.css').read_text()
css = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), src, flags=re.S)
line = lambda i: css[:i].count('\n') + 1
tok_end = src.index('/* == 03 Base == */')
probs = []
for m in re.finditer(r'#[0-9a-fA-F]{3,8}\b', css):
    if m.start() > tok_end and not re.search(r'@media print', css[max(0, m.start() - 400):m.start()]): probs.append(f'L{line(m.start())} hex colour outside the token block: {m.group(0)}')
for m in re.finditer(r'rgba?\(', css):
    if m.start() > tok_end: probs.append(f'L{line(m.start())} rgb() colour outside the token block')
for m in re.finditer(r'(min|max)-width:\s*([\d.]+)px', css):
    w = float(m.group(2))
    if w not in (380, 600, 760, 980, 1100, 1280) and round(w + .02, 2) not in (380, 600, 760, 980, 1100, 1280): probs.append(f'L{line(m.start())} media width {w}px is not one of the six')
for m in re.finditer(r'!important', css):
    ctx = css[max(0, m.start() - 300):m.start()]
    if 'prefers-reduced-motion' not in ctx and '[hidden]' not in css[css.rfind('\n', 0, m.start()):m.start()]: probs.append(f'L{line(m.start())} !important outside reduced motion and [hidden]')
# :hover outside @media (hover: hover)
depth = []; i = 0; pre = 0
while i < len(css):
    ch = css[i]
    if ch == '{':
        head = ' '.join(css[pre:i].split()); depth.append(head)
        if not head.startswith('@') and ':hover' in head and not any('hover: hover' in h for h in depth): probs.append(f'L{line(pre)} :hover outside (hover: hover): {head[:70]}')
        pre = i + 1
    elif ch == '}':
        depth.pop(); pre = i + 1
    elif ch == ';': pre = i + 1
    i += 1
# raw durations and raw px sizes in declarations after the token block (custom properties and media queries excepted)
body = css[tok_end:]
for m in re.finditer(r'([a-z-]+)\s*:\s*([^;{}]+)[;}]', body):
    prop, val = m.group(1), m.group(2)
    if prop.startswith('--') or prop in ('content',): continue
    if re.search(r'(?<![\w.-])\d*\.?\d+m?s\b', val) and 'var(' not in val.split('s')[0][-12:] and not re.search(r'calc\(var\(--t', val): 
        if re.search(r'(?<![\w.(-])\d*\.?\d+m?s\b', re.sub(r'var\([^)]*\)', '', val)) and '0s' not in re.sub(r'var\([^)]*\)', '', val).split(): probs.append(f'L{line(tok_end + m.start())} raw duration: {prop}: {val[:60]}')
    for px in re.findall(r'(?<![\w.-])(\d*\.?\d+)px', re.sub(r'var\([^)]*\)', '', val)):
        if float(px) not in (0, 1): probs.append(f'L{line(tok_end + m.start())} raw px: {prop}: {val[:70]}')
for rx, label in ((r'\bAI\b', 'AI'), (r'(?i)artificial intelligence', 'artificial intelligence'), (r'(?i)chat\s?bot', 'chatbot'), (r'\bGPT\b', 'GPT'), (r'(?i)machine learning', 'machine learning'), (r'SHARED-CANDIDATE', 'marker')):
    for m in re.finditer(rx, src): probs.append(f'L{src[:m.start()].count(chr(10)) + 1} banned: {label}')
non_ascii = sorted({c for c in src if ord(c) > 127})
print('\n'.join(probs) or 'no problems'); print('bytes', len(src.encode()), '| non-ASCII characters:', non_ascii, '| braces', src.count('{'), src.count('}'))
