#!/bin/sh
# Runs every check for this kit folder and writes test/results.txt. Needs the kit server on :8730:
#   (nohup python3 ../../serve.py >/dev/null 2>&1 &)    from this folder's parent's parent, if it is not running
# The pages under test are built first by ../../work-closing/build_demo.py and build_test_pages.py (run both after editing a partial).
cd "$(dirname "$0")/.." || exit 1
T=../../../tools
B=http://localhost:8730/kit/closing
export NODE_PATH="${NODE_PATH:-/opt/node-tools/node_modules}"
{
  echo "== sizes (bytes; budget 3,500 per stylesheet) =="; wc -c btn.css closing.css appt.css footer.css skyline.css footer.inc footer-start.inc footer-bare.inc skyline.inc
  echo; echo "== rules: hex colours, !important, site tokens used bare, widths in media queries =="
  for f in btn.css closing.css appt.css footer.css skyline.css; do
    printf '%s: hex %s, important %s, bare site tokens %s, media: ' "$f" "$(grep -c '#[0-9A-Fa-f]\{3,8\}\b' "$f")" "$(grep -c 'important' "$f")" \
      "$(grep -o '[^,(]var(--\(ink\|ink-2\|ink-3\|paper\|card\|blue\|brick\|gold\|board\|footer\|line\|line-2\|focus\|font-display\|font-text\|shadow-[0-9]\|on-blue\)[,)]' "$f" | wc -l)"
    grep -o '@\(media\|container\) ([a-z-]*:[^)]*)\( and ([a-z-]*:[^)]*)\)\?' "$f" | sort | uniq -c | tr -s ' ' | tr '\n' ';'; echo
  done
  echo; echo "== sideways scroll, 360 to 1920 in 20px steps =="
  node $T/widths.js --urls $B/demo.html,$B/portable.html,$B/test/pricing-with-kit.html,$B/test/start-with-kit.html,$B/test/notfound-with-kit.html
  echo; echo "== text sizes and targets at 390px (site tool) =="
  node $T/smalltext.js --urls $B/demo.html,$B/test/pricing-with-kit.html,$B/test/start-with-kit.html,$B/test/notfound-with-kit.html | grep -i 'kws\|fail\|under 12\|no text\|http'
  echo; echo "== contract checks =="; node test/checks.js
  echo; echo "== touch =="; node test/touch.js
  echo; echo "== contrast against the painted pixels: demo page (site palette and the client palette) =="; node test/contrast.js $B/demo.html --frames 6
  echo; echo "== contrast against the painted pixels: bare page, another brand =="; node test/contrast.js $B/portable.html --states still --themes light
  echo; echo "== frame times =="; node test/perf.js
  echo; echo "== other browsers (Firefox, and WebKit: Safari's engine) =="; PLAYWRIGHT_BROWSERS_PATH=../../.browsers-flat node test/other-browsers.js shots
} > test/results.txt 2>&1
grep -c '^PASS' test/results.txt; grep -n 'FAIL\|ERROR\|overflow at\|problem' test/results.txt | head -20
