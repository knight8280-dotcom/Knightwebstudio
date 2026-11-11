#!/usr/bin/env python3
"""Build a page from the baseline <head> plus a new <body>.

    python3 assemble.py --site SITE_DIR --page pricing/index.html --body NEW_BODY.html
                        [--baseline BASELINE_DIR] [--theme-color '#0b1020']
                        [--default-theme light|dark] [--preload bricolage-grotesque.woff2,manrope.woff2]
                        [--head-script FILE] [--extra-head FILE]

Why: every page's <title>, meta tags, canonical URL and JSON-LD must stay exactly
as they are, and those blocks are hundreds of lines long. Write only the new
<body>...</body> to a file and let this splice it under the untouched head.

  --body           file holding the new markup from <body ...> to </body> inclusive
  --theme-color    new value for <meta name="theme-color">
  --default-theme  value for data-theme on <html> (the look before any saved choice)
  --preload        comma list of font files in /assets/fonts/ to preload (replaces the current preloads)
  --head-script    file whose contents replace the inline first-paint <script> in the head
  --extra-head     file whose contents are inserted just before </head>

Art markers in the body may be left empty (<!-- art:crest-header --><!-- /art:crest-header -->);
run `python3 tools/art/build.py` in the site folder afterwards to fill them.
"""
import argparse, pathlib, re, sys
ap = argparse.ArgumentParser()
ap.add_argument('--site', required=True); ap.add_argument('--page', required=True); ap.add_argument('--body', required=True)
ap.add_argument('--baseline', default=str(pathlib.Path(__file__).resolve().parents[1] / 'baseline'))
ap.add_argument('--theme-color'); ap.add_argument('--default-theme'); ap.add_argument('--preload')
ap.add_argument('--head-script'); ap.add_argument('--extra-head')
a = ap.parse_args()
src = (pathlib.Path(a.baseline) / a.page).read_text()
m = re.search(r'^(.*?</head>)', src, flags=re.S)
if not m: sys.exit('baseline page has no </head>')
head = m.group(1)
if a.theme_color:
    head, n = re.subn(r'(<meta name="theme-color" content=")[^"]*(")', lambda x: x.group(1) + a.theme_color + x.group(2), head)
    if not n: print('note: no theme-color meta on this page')
if a.default_theme:
    head = re.sub(r'(<html\b[^>]*\bdata-theme=")[^"]*(")', lambda x: x.group(1) + a.default_theme + x.group(2), head, count=1)
if a.preload is not None:
    head = re.sub(r'[ \t]*<link rel="preload"[^>]*as="font"[^>]*>\n', '', head)
    links = ''.join(f'<link rel="preload" href="/assets/fonts/{f.strip()}" as="font" type="font/woff2" crossorigin>\n' for f in a.preload.split(',') if f.strip())
    head = head.replace('<link rel="stylesheet" href="/assets/css/styles.css">', links + '<link rel="stylesheet" href="/assets/css/styles.css">', 1)
if a.head_script:
    new = pathlib.Path(a.head_script).read_text().strip()
    head, n = re.subn(r'<script>\s*//[^\n]*theme.*?</script>', lambda x: '<script>\n' + new + '\n</script>', head, count=1, flags=re.S)
    if not n: print('note: no inline first-paint script found to replace')
if a.extra_head:
    head = head.replace('</head>', pathlib.Path(a.extra_head).read_text().rstrip() + '\n</head>')
body = pathlib.Path(a.body).read_text().strip()
if not body.lower().startswith('<body') or not body.lower().endswith('</body>'):
    sys.exit('--body file must start with <body ...> and end with </body>')
out = pathlib.Path(a.site) / a.page
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(head + '\n\n' + body + '\n</html>\n')
print(f'wrote {out} ({len(head.splitlines())} head lines kept, {len(body.splitlines())} body lines)')
