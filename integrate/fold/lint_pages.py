#!/usr/bin/env python3
"""Pre-fold checks on the page stylesheets: balanced, closed, every style rule scoped, global at-rules listed."""
import pathlib, re, sys
PAGES = pathlib.Path(sys.argv[1])
SHARED = pathlib.Path(sys.argv[2])

def strip_comments(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.S)

def walk(css, slug):
    """Yield ('rule', selector) / ('at', prelude) for every block, with nesting depth."""
    out, stack, prelude, i = [], [], '', 0
    while i < len(css):
        ch = css[i]
        if ch in '"\'':
            j = css.index(ch, i + 1)
            prelude += css[i:j + 1]; i = j + 1; continue
        if ch == '{':
            head = ' '.join(prelude.split()); prelude = ''
            if head.startswith('@keyframes') or head.startswith('@font-face') or head.startswith('@property') or head.startswith('@counter-style'):
                depth, j = 1, i + 1
                while j < len(css) and depth:
                    depth += {'{': 1, '}': -1}.get(css[j], 0); j += 1
                out.append(('global', head, css[i:j], len(stack)))
                i = j; continue
            if head.startswith('@'):
                stack.append(head); out.append(('at', head, None, len(stack)))
            else:
                stack.append(None); out.append(('rule', head, None, len(stack)))
        elif ch == '}':
            if not stack:
                out.append(('ERROR', 'unmatched }', None, 0))
            else:
                stack.pop()
            prelude = ''
        elif ch == ';' and not (stack and stack[-1] is None):
            if prelude.strip().startswith('@'):
                out.append(('global', ' '.join(prelude.split()), None, len(stack)))
            prelude = ''
        else:
            prelude += ch
        i += 1
    if stack:
        out.append(('ERROR', f'{len(stack)} block(s) left open at end of file', None, 0))
    if prelude.strip():
        out.append(('ERROR', f'text left over at end of file: {prelude.strip()[:60]!r}', None, 0))
    return out

bad = 0
names = {}
for f in sorted(PAGES.glob('*.css')):
    slug = f.stem
    raw = f.read_text()
    if raw.count('/*') != raw.count('*/'):
        print(f'{slug}: comment open/close counts differ'); bad += 1
    css = strip_comments(raw)
    if '/*' in css or '*/' in css:
        print(f'{slug}: stray comment marker'); bad += 1
    scope = f'[data-page="{slug}"]'
    nrules = 0
    for kind, head, body, depth in walk(css, slug):
        if kind == 'ERROR':
            print(f'{slug}: {head}'); bad += 1
        elif kind == 'global':
            names.setdefault(head, []).append((slug, re.sub(r'\s+', '', body or '')))
        elif kind == 'rule':
            nrules += 1
            for sel in re.split(r',(?![^()]*\))', head):
                sel = sel.strip()
                if not (sel.startswith(scope + ' ') or sel == scope or sel.startswith(scope + ':') or sel.startswith('.js ' + scope + ' ') or sel.startswith('html:not(.js) ' + scope + ' ')):
                    print(f'{slug}: selector not scoped to {scope}: {sel[:90]}'); bad += 1
                if re.search(r'\[data-page="(?!%s")' % re.escape(slug), sel):
                    print(f'{slug}: selector names another page: {sel[:90]}'); bad += 1
    for tok in ('!important', '@import', '@charset', '@namespace', '@layer', '@font-face', '@property'):
        if tok in css:
            print(f'{slug}: contains {tok}'); bad += 1
    print(f'{slug:18s} {len(raw):6d} bytes  {nrules:3d} style rules  ends with newline: {raw.endswith(chr(10))}  CR: {chr(13) in raw}  BOM: {raw.startswith(chr(0xfeff))}  non-ascii: {sum(ord(c) > 127 for c in raw)}')

shared = strip_comments(SHARED.read_text())
shared_kf = {m.group(1): re.sub(r'\s+', '', m.group(0)) for m in re.finditer(r'@keyframes\s+([\w-]+)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}', shared)}
print('\nglobal at-rules in page sheets:')
for head, where in sorted(names.items()):
    bodies = {b for _, b in where}
    clash = ''
    nm = head.split()[1] if head.startswith('@keyframes') else None
    if nm in shared_kf:
        clash = '   <-- ALSO IN styles.css' + ('' if {shared_kf[nm].split('{', 1)[1]} == {b[1:] for b in bodies} else ' WITH A DIFFERENT BODY')
    print(f'  {head:28s} in {", ".join(s for s, _ in where)}' + ('' if len(bodies) == 1 else '   <-- DIFFERENT BODIES') + clash)
    if len(bodies) != 1: bad += 1
print('shared keyframes:', ', '.join(shared_kf))
print(f'\n{bad} problem(s)')
sys.exit(1 if bad else 0)
