#!/bin/sh
# Copies the built page into scratch with every row open, for the tools that cannot see inside closed details.
D=/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/work/services/fix/site-open
sed 's/<details class="faq-item">/<details class="faq-item" open>/g' /home/user/Knightwebstudio/services/index.html > $D/services/index.html
grep -c '<details class="faq-item" open>' $D/services/index.html
