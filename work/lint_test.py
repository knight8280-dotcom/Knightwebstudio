#!/usr/bin/env python3
"""Check that kws_page.py refuses what it should. Works on a scratch copy of the repository; touches nothing else.

    python3 work/lint_test.py
"""
import pathlib, shutil, subprocess, sys
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
T = R / 'work' / 'lint-test'
if T.exists():
    shutil.rmtree(T)
shutil.copytree('/home/user/Knightwebstudio', T / 'repo', ignore=shutil.ignore_patterns('.git'))
bad = 0

def run(page, main_html, css=None, slug=None):
    f = T / 'main.html'; f.write_text(main_html)
    sheet = T / 'repo' / 'assets' / 'css' / 'pages' / f'{slug}.css' if slug else None
    if sheet is not None:
        keep = sheet.read_text() if sheet.exists() else None
        sheet.write_text(css)
    r = subprocess.run([sys.executable, str(R / 'tools' / 'kws_page.py'), page, '--main', str(f), '--repo', str(T / 'repo'), '--no-check'], capture_output=True, text=True)
    if sheet is not None:
        sheet.unlink() if keep is None else sheet.write_text(keep)
    return r.returncode, (r.stdout + r.stderr).strip()

def expect(name, refused, page, main_html, **kw):
    global bad
    code, out = run(page, main_html, **kw)
    ok = (code != 0 and 'Nothing was written' in out) if refused else code == 0
    bad += not ok
    print(('PASS  ' if ok else 'FAIL  ') + name + ('' if ok else '\n      ' + out[:300]))
    return out

M = lambda inner: f'<main id="main"><h1>Title</h1>{inner}</main>'
expect('refuses a single-quoted, upper-case style attribute', True, 'faq/index.html', M("<p STYLE='color:red'>x</p>"))
expect('allows a custom property in a style attribute', False, 'services/index.html', M('<span style="--w:50">x</span>'))
expect('refuses a <style> element in the main', True, 'faq/index.html', M('<style>p{}</style>'))
expect('refuses a <script> element in the main', True, 'faq/index.html', M('<script>1</script>'))
expect('refuses two tilted objects', True, 'services/index.html', M('<div class="card tilt">a</div><div class="bizcard tilt">b</div>'))
expect('refuses a stamp plus the seal', True, 'services/index.html', M('<p class="stamp">a</p><!-- art:seal --><!-- /art:seal -->'))
expect('refuses a stamp on the FAQ page', True, 'faq/index.html', M('<p class="stamp">a</p>'))
expect('refuses a vignette with no Example flag', True, 'services/index.html', M('<div class="vig"><ul class="thread"></ul></div>'))
expect('refuses a big figure with no note', True, 'consulting/index.html', M('<aside class="bigfig"><p class="bigfig-num">About <b>200</b></p></aside>'))
expect('refuses a street scene on the services page', True, 'services/index.html', M('<!-- art:scene-street --><!-- /art:scene-street -->'))
expect('refuses reveal on the 404 page', True, '404.html', M('<p class="reveal">x</p>'))
expect('refuses a header crest marker in the main', True, 'about/index.html', M('<!-- art:crest-header --><!-- /art:crest-header -->'))
GOOD = M('<div class="vig"><span class="flag">Example</span></div><p class="stamp">a</p><div class="card tilt">t</div><aside class="bigfig"><p>x</p><p class="note">n</p></aside>')
out = expect('refuses a page stylesheet with a hex colour, !important, an unscoped rule, a stray width and a bare :hover', True, 'services/index.html', GOOD, slug='services',
             css='.x { color: #fff; }\n[data-page="services"] .a { color: red !important; }\n@media (min-width: 900px) { [data-page="services"] .b:hover { color: var(--ink); } }\n')
for needle in ('hex colour', '!important', 'does not start with', '900px', ':hover rule outside'):
    ok = needle in out; bad += not ok; print(('PASS  ' if ok else 'FAIL  ') + f'   ... and says so: {needle}')
out = expect('accepts a clean page and stylesheet, and prints the size against the budget', False, 'services/index.html', GOOD, slug='services',
             css='[data-page="services"] .a { margin: var(--s-2); }\n@media (hover: hover) { [data-page="services"] .b:hover, .js [data-page="services"] .c:hover { color: var(--ink); } }\n'
                 '@media (min-width: 760px) and (max-width: 1099.98px) { [data-page="services"] .a { margin: 0; } }\n@keyframes services-in { from { opacity: 0; } }\n')
ok = 'byte budget' in out; bad += not ok; print(('PASS  ' if ok else 'FAIL  ') + '   ... size line printed')
code, out = run('404.html', (R / 'pages/notfound/main.html').read_text())
ok = code == 0 and (T / 'repo' / '404.html').read_text().count('<meta name="theme-color"') == 1
bad += not ok; print(('PASS  ' if ok else 'FAIL  ') + 'adds the theme-color meta to 404.html, once')
shutil.rmtree(T)
print('\nall lint checks behave' if not bad else f'\n{bad} problem(s)')
sys.exit(1 if bad else 0)
