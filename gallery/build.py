#!/usr/bin/env python3
"""Build the component gallery (index.html) and the component chapter of DESIGN.md (components.md).

    python3 gallery/build.py

The gallery is served by gallery/serve.py on http://localhost:8721/ , which hands out this
folder at / and everything else (/assets/...) from the repository, so the page loads the
repository's real stylesheet, fonts and main.js.
"""
import importlib.util, pathlib, re, sys
sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
REPO = pathlib.Path('/home/user/Knightwebstudio')

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod
chrome = load('sync_chrome', REPO / 'tools/sync_chrome.py')
art = load('build', REPO / 'tools/art/build.py')
comps = load('components', HERE / 'components.py').COMPONENTS

page = 'services/index.html'   # borrow a standard page's chrome
sections, toc = [], []
for c in comps:
    inner = c['html'] if c.get('wrap') == 'full' else f'<div class="container">\n{c["html"]}\n</div>'
    if c.get('scope'):   # its rules live in that page's stylesheet, scoped with [data-page]
        inner = f'<div data-page="{c["scope"]}">\n{inner}\n</div>'
    head = f'<div class="container"><p class="label gal-id">.{c["id"]}</p><h2 class="h3 gal-title" id="{c["id"]}">{c["title"]}</h2></div>'
    sections.append(f'<section class="gal" data-comp="{c["id"]}">\n{head}\n{inner}\n</section>')
    toc.append(f'<li><a href="#{c["id"]}"><span class="toc-name">{c["title"]}</span></a></li>')

html = f'''<!DOCTYPE html>
<html lang="en" data-theme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Component gallery — KnightWebstudio design system</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#F6F0E4">
<script>
{(REPO / 'tools/chrome/head-script.inc').read_text().rstrip()}
</script>
<link rel="preload" href="/assets/fonts/fraunces-soft.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/figtree.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/styles.css">
{chr(10).join(f'<link rel="stylesheet" href="/assets/css/pages/{x}.css">' for x in sorted({c["scope"] for c in comps if c.get("scope")}))}
<link rel="stylesheet" href="/gallery.css">
</head>
<body data-page="gallery">
{chrome.header(page)}

<main id="main">
<section class="page-head">
  <div class="container">
    <p class="eyebrow">Design system</p>
    <h1><span class="l">Every shared component,</span> <span class="l">once</span></h1>
    <p class="lede">The kitchen sink for the KnightWebstudio system. Each block below is the canonical markup from DESIGN.md, drawn by the repository's own stylesheet. Use the moon button to see it after dark.</p>
  </div>
</section>
<section class="section section-first">
  <div class="container">
    <nav class="toc" aria-labelledby="gal-toc">
      <p class="label" id="gal-toc">On this page</p>
      <ol>
        {chr(10).join(toc)}
      </ol>
    </nav>
  </div>
</section>
{chr(10).join(sections)}
</main>

{chrome.phone_bar(page)}

{chrome.footer(page)}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
'''
(HERE / 'index.html').write_text(art.fill(html, 'gallery'))

md = []
for c in comps:
    use = '\n'.join(l.strip() for l in c['use'].strip().splitlines())
    snippet = c.get('doc', c['html']).strip()
    md.append(f'### {c["title"]}\n\n{use}\n' + (f'\n```html\n{snippet}\n```\n' if snippet else ''))
(HERE / 'components.md').write_text('\n'.join(md))
print(f'gallery: {len(comps)} components, index.html {len(html)} bytes, components.md {sum(map(len, md))} bytes')
