#!/bin/sh
# Runs every check for this kit folder and writes test/results.txt. Needs the kit server on :8730:
#   (nohup python3 ../../serve.py >/dev/null 2>&1 &)   from this folder's parent's parent, if it is not running
# About six minutes. Firefox and WebKit are Playwright's Linux builds in motion/.browsers-flat.
cd "$(dirname "$0")/.." || exit 1
T=../../../tools
{
  echo "run on: $(date -u +%Y-%m-%dT%H:%MZ); machine load: $(uptime | sed 's/.*load average/load average/') (frame times below move with it)"; echo
  echo "== sizes (bytes; budgets: css 3,500, js 8,000) =="; wc -c cylinder.css cylinder.js ring.css ring.js
  echo; echo "== rules: hex colours, !important, the banned words, class names not starting kws-, widths in media queries =="
  echo "hex colours: $(cat cylinder.css ring.css | grep -c '#[0-9A-Fa-f]\{3,8\}'); !important: $(cat cylinder.css ring.css | grep -c 'important'); banned words in the four files, demo and notes: $(cat cylinder.css cylinder.js ring.css ring.js demo.html NOTES.md test/bare.html | grep -c -i -w -E 'AI|artificial intelligence|chatbot|GPT|machine learning')"
  echo "classes in the two stylesheets that are not kws- or a state (is-*): $(cat cylinder.css ring.css | grep -o '\.[a-zA-Z][a-zA-Z0-9_-]*' | grep -v -E '^\.(kws-|is-)' | grep -v -E '^\.[0-9]|^\.(rem|em)' | sort -u | tr '\n' ' ')"
  cat cylinder.css ring.css | grep -o '@media ([a-z-]*:[^)]*)' | sort | uniq -c
  echo; echo "== cylinder slider: the contract =="; node test/cylinder.js
  echo; echo "== carousel ring: the contract =="; node test/ring.js
  echo; echo "== sideways scroll, 360 to 1920 in 20px steps, scripts on and off =="; node test/widths.js
  echo; echo "== layout shift with the scripts arriving late, and heights held against live =="; node test/cls.js
  echo; echo "== scripts that never arrive, or arrive after the four seconds =="; node test/held.js; node test/held.js firefox; node test/held.js webkit
  echo; echo "== text sizes and targets at 390px (site tool) =="; node $T/smalltext.js --urls http://localhost:8730/kit/depth/demo.html | tail -1
  echo; echo "== contrast: painted pixels at rest, both themes, 1440 and 390 (site tool) =="; node $T/contrast.js --base http://localhost:8730 --paths /kit/depth/demo.html
  echo; echo "== contrast on the drum: every card in view, each step and every frame of a turn, strength and light counted =="; node test/contrast.js
  echo; echo "== leaks =="; node test/leak.js
  echo; echo "== WebKit (Playwright's Linux build: Safari's engine, not Safari on an iPhone) =="; node test/engines.js webkit
  echo; echo "== Firefox =="; node test/engines.js firefox
  echo; echo "== frame times, 390x844, CPU throttled 4x: demo page (two drums and two rings mounted, the site script running), three rounds =="; node test/perf.js http://localhost:8730/kit/depth/demo.html 4 3
  echo; echo "== the same on a page with one ring and the site stylesheet (test/one-ring.html) =="; node test/perf.js http://localhost:8730/kit/depth/test/one-ring.html 4 3
  echo; echo "== the same on the bare client page (one drum, one ring) =="; node test/perf.js http://localhost:8730/kit/depth/test/bare.html 4 2
  echo; echo "== unthrottled, demo page, for reference =="; node test/perf.js http://localhost:8730/kit/depth/demo.html 1 1
  echo; echo "machine load at the end: $(uptime | sed 's/.*load average/load average/')"
} > test/results.txt 2>&1
echo "PASS lines: $(grep -c '^PASS' test/results.txt); FAIL lines: $(grep -c '^FAIL' test/results.txt)"; grep '^FAIL' test/results.txt; echo "written: test/results.txt"
