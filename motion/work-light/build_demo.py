#!/usr/bin/env python3
"""Assemble kit/light/demo.html: the site's real chrome (read from the built pricing page) around demo.main.html."""
import re, pathlib
HERE = pathlib.Path(__file__).resolve().parent
REPO = pathlib.Path('/home/user/Knightwebstudio')
page = (REPO / 'pricing/index.html').read_text()
main = (HERE / 'demo.main.html').read_text()
seal = re.search(r'<!-- art:seal -->(.*?)<!-- /art:seal -->', page, re.S).group(1)
main = main.replace('{{seal}}', seal)
before = page[page.index('<body'):page.index('<main')]
after = page[page.index('</main>') + len('</main>'):page.index('</body>')]
before = re.sub(r'<body[^>]*>', '<body data-page="kit-demo">', before, count=1)
before = before.replace(' aria-current="page"', '')
PAUSE = ('<button class="kws-motion" data-kws="motion" type="button" hidden>'
         '<svg class="kws-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>'
         '<svg class="kws-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'
         '<span class="kws-motion-label"></span></button>')
# The labelled pause button, three times, all in step: the footer's last row, the top strip (shown from 1100px),
# and the phone menu's sheet
n = after.count('<p class="footer-links">'); assert n == 1, n
after = after.replace('<p class="footer-links">', '<p class="footer-links">' + PAUSE, 1)
n = before.count('<a class="topbar-tel"'); assert n == 1, n
before = before.replace('<a class="topbar-tel"', PAUSE + '\n    <a class="topbar-tel"', 1)
n = before.count('<a class="nav-mail"'); assert n == 1, n
before = re.sub(r'(<a class="nav-mail"[^\n]*\n)', lambda m: m.group(1) + '          ' + PAUSE + '\n', before, count=1)
after = re.sub(r'<script[^>]*src="/assets/js/main\.js"[^>]*></script>', '', after)
head_script = (REPO / 'tools/chrome/head-script.inc').read_text()
style = (HERE / 'demo.style.css').read_text()
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Motion kit demo: backgrounds, folder cards, bookmark cards</title>
<script>
{head_script.rstrip()}
</script>
<!-- The folder stack keeps its place before cards.js runs; if that script has not arrived when the page has loaded, or after four seconds, the plain list shows -->
<script>(function (d) {{ d.classList.add('kws-js'); function ok() {{ if (!(window.KWS && KWS.folders)) d.classList.remove('kws-js'); }} addEventListener('load', ok); setTimeout(ok, 4000); }})(document.documentElement);</script>
<link rel="preload" href="/assets/fonts/fraunces-soft.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/figtree.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/styles.css">
<link rel="stylesheet" href="motion.css">
<link rel="stylesheet" href="shader.css">
<link rel="stylesheet" href="cards.css">
<style>
{style.rstrip()}
</style>
</head>
{before.rstrip()}

{main.rstrip()}

{after.strip()}
<script src="/assets/js/main.js" defer></script>
<script src="motion.js" defer></script>
<script src="shader.js" defer></script>
<script src="cards.js" defer></script>
</body>
</html>
'''
(HERE.parent / 'kit/light/demo.html').write_text(html)
print('demo.html', len(html))
