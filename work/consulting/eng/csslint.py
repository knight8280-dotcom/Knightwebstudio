import re, sys, importlib.util
R='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
spec=importlib.util.spec_from_file_location('kws', R+'/tools/kws_page.py')
css_path='/home/user/Knightwebstudio/assets/css/pages/consulting.css'
css=open(css_path,encoding='utf-8').read()
print('bytes', len(css.encode()))
try:
    kws=importlib.util.module_from_spec(spec)
    import io, contextlib
    # only load functions, do not run main
    src=open(R+'/tools/kws_page.py').read()
    ns={'__name__':'kws_lint'}
    exec(compile(src, 'kws_page.py', 'exec'), ns)
    from pathlib import Path
    print('build-tool lint:', ns['lint_sheet'](Path(css_path), 'consulting'))
except SystemExit as e: print('exit', e)
except Exception as e: print('could not import lint', repr(e))
nc=re.sub(r'/\*.*?\*/','',css,flags=re.S)
print('comment bytes', len(css)-len(nc))
# raw values
print('\nraw lengths (px/rem/em/s/ms/%) outside var():')
for m in re.finditer(r'([a-z-]+)\s*:\s*([^;{}]+);', nc):
    prop,val=m.group(1),m.group(2)
    raws=re.findall(r'(?<![\w.-])(\d*\.?\d+)(px|rem|em|ms|s|vh|vw|%)\b', val)
    nums=re.findall(r'(?<![\w.#-])(\d*\.?\d+)(?![\w.%])', re.sub(r'var\([^)]*\)','',val))
    if raws or (prop in ('line-height','opacity','z-index','font-weight','flex','order') and nums):
        print(f'  {prop}: {val.strip()}')
print('\nmedia queries:', sorted(set(re.findall(r'@media[^{]+', nc))))
print('supports:', re.findall(r'@supports[^{]+', nc))
print('features needing fallback:', {k: len(re.findall(k, nc)) for k in ['color-mix','backdrop-filter',':has\\(','subgrid',':is\\(',':where\\(','display: contents','aspect-ratio','inset','gap','clamp\\(','min\\(','focus-within','focus-visible','text-wrap']})
print('colour keywords:', re.findall(r'\b(?:rgb|hsl|rgba|hsla)\([^)]*\)|\b(?:white|black|red|transparent|currentColor)\b', nc))
print('font-family:', re.findall(r'font-family[^;]+', nc))
print('data-theme:', re.findall(r'data-theme[^{]*', nc))
sels=[]
for m in re.finditer(r'([^{}@;]+)\{([^{}]*)\}', nc):
    for s in m.group(1).split(','):
        s=s.strip()
        if s and not s.startswith('@'): sels.append(s)
bad=[s for s in sels if not (s.startswith('[data-page="consulting"]') or s.startswith('.js [data-page="consulting"]'))]
print('unscoped selectors:', bad)
open('selectors.txt','w').write('\n'.join(sorted(set(sels))))
print(len(set(sels)),'distinct selectors')
