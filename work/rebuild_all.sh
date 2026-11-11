#!/bin/bash
# Rebuild all 19 pages from their main files (system pass: lint failures are notes, not refusals).
R=/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh
export KWS_SYSTEM_PASS=1
build() { python3 $R/tools/kws_page.py "$1" --main "$2" --no-check 2>&1 | grep -v "^wrote " ; }
build index.html $R/pages/home/main.html
for s in services consulting work process pricing faq about contact privacy terms start checkout; do build $s/index.html $R/pages/$s/main.html; done
build checkout/success/index.html $R/pages/checkout-success/main.html
build 404.html $R/pages/notfound/main.html
for t in baton-rouge gonzales prairieville denham-springs; do build web-design-$t/index.html $R/pages/city/web-design-$t.main.html; done
