import pathlib, sys
p = pathlib.Path('/home/user/Knightwebstudio/assets/css/styles.css'); s = p.read_text()
def rep(old, new, count=1):
    global s
    if s.count(old) != count: sys.exit(f'expected {count} of: {old[:90]!r}, found {s.count(old)}')
    s = s.replace(old, new)

# ---------------- 02 Tokens
# B1: night sand is darker than the paper, as it is by day, so a card or a well shows on it
rep('--paper-2: var(--L, #EEE6D5) var(--D, #1C2233);', '--paper-2: var(--L, #EEE6D5) var(--D, #0F131D);')
# B2: about 65 characters
rep('--measure: 34em;', '--measure: 31em;')

# ---------------- 03 Base
# B5: a focused thing keeps clear of the window's bottom edge at every width
rep('scroll-behavior: smooth; scroll-padding-top: calc(var(--header-h) + var(--s-5)); }',
    'scroll-behavior: smooth; scroll-padding: calc(var(--header-h) + var(--s-5)) 0 var(--s-5); }')
# B3: a long word wraps, it is not cut off
rep('  margin: 0; min-height: 100vh; overflow-x: hidden; overflow-x: clip;\n', '  margin: 0; min-height: 100vh; overflow-x: hidden; overflow-x: clip; overflow-wrap: break-word;\n')

# ---------------- 04 Type
# P-2: one-word last lines
rep('''.fine, .help, .form-fine, .print-kind, .fig-credit { font-size: var(--fs-sm); line-height: 1.5; color: var(--ink-3); }
''', '''.fine, .help, .form-fine, .print-kind, .fig-credit { font-size: var(--fs-sm); line-height: 1.5; color: var(--ink-3); }
/* Short lines break evenly; running text does not end on one word */
.btn, .faq-item summary, .tier-plan, .board-head > p, .board-extras dd, .points span, .spec-price small { text-wrap: balance; }
.lede, .section-sub, .cta-copy p, .faq-body, .prose p, .steps p { text-wrap: pretty; }
''')
# P-16: the brush sits behind the letters, and can be painted in (kws-brush, under Motion)
rep('''  .mark { text-decoration: none; }
  .mark::after { content: ""; position: absolute; inset: auto 0 -.1em; height: .26em; background: var(--brick); -webkit-mask: var(--brush) 0 0 / 100% 100%; mask: var(--brush) 0 0 / 100% 100%; }''',
'''  .mark { isolation: isolate; text-decoration: none; }
  .mark::after { content: ""; position: absolute; inset: auto 0 -.1em; z-index: -1; height: .26em; background: var(--brick); -webkit-mask: var(--brush) 0 0 / 100% 100%; mask: var(--brush) 0 0 / 100% 100%; transform-origin: 0 50%; }''')

# ---------------- 05 Layout
# B4: a one-column grid may shrink under a long word or enlarged text
rep('.page-head-split { display: grid; gap: var(--stack) var(--gap-lg); align-items: center; }',
    '/* One column until its breakpoint: minmax(0, 1fr), so a long word or enlarged text cannot widen it past the screen */\n.page-head-split { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--stack) var(--gap-lg); align-items: center; }')
# B7: stacked, the intro's own margin is the gap, as under a plain head
rep('.section-head-split { display: grid; gap: var(--s-4) var(--gap-lg); max-width: none; }',
    '.section-head-split { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 var(--gap-lg); max-width: none; }')
rep('.grid { display: grid; gap: var(--gap); }', '.grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--gap); }')
rep('.split { display: grid; gap: var(--gap-lg); align-items: start; }', '.split { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--gap-lg); align-items: start; }')
# B6: .wide-only moves to the end of the shared part
rep('@media (max-width: 979.98px) { .wide-only { display: none; } .points li:nth-child(odd):last-child { grid-column: 1 / -1; } }',
    '@media (max-width: 979.98px) { .points li:nth-child(odd):last-child { grid-column: 1 / -1; } }')
# P-7: a pinned column lets go in a window too short to show it
rep('''@media (min-width: 1100px) { .grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
''', '''/* A pinned column lets go in a window too short to show all of it */
@media (min-width: 980px) and (max-height: 620px) { .split-sticky > :first-child { position: static; } }
@media (min-width: 1100px) { .grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
''')

# ---------------- 07 Buttons and small parts
# C1: a button pressed under the pointer sinks
rep('''  .btn-quiet:hover { color: var(--blue-deep); transform: none; }
''', '''  .btn-quiet:hover { color: var(--blue-deep); transform: none; }
  .btn:hover:active { transform: translateY(var(--hair)); }
''')
# P-14: flat labels flow as text, so their rows balance and no label is left alone
rep('''.pills { list-style: none; display: flex; flex-wrap: wrap; gap: var(--s-2); }
.pills li { padding: var(--s-1) var(--s-3); border-radius: var(--r-xs); background: var(--well); color: var(--ink); font-size: var(--fs-sm); font-weight: 600; }''',
'''/* Flat labels flow as text, so the rows balance and no label is left alone on the last one */
.pills { list-style: none; display: block; text-wrap: balance; }
.pills, .stack > .pills { margin-bottom: calc(-1 * var(--s-2)); }
.pills li { display: inline-flex; align-items: center; gap: var(--s-1); margin: 0 var(--s-2) var(--s-2) 0; padding: var(--s-1) var(--s-3); border-radius: var(--r-xs); background: var(--well); color: var(--ink); font-size: var(--fs-sm); font-weight: 600; vertical-align: top; }''')

# ---------------- 08 Text blocks
# P-13
rep('''.prose > :is(h2, h3) { margin-top: var(--s-7); }
''', '''.prose > :is(h2, h3) { margin-top: var(--s-7); }
.prose > :first-child { margin-top: 0; }
''')
# P-6: a contents list with names only
rep('''@media (hover: hover) { .toc a:hover .toc-name, .faq-item summary:hover { color: var(--blue); } }
''', '''/* Names only (legal pages): tighter rows, two columns on a tablet */
.toc-plain a { min-height: var(--tap); padding-block: var(--s-2); font-size: var(--fs-sm); }
@media (min-width: 600px) and (max-width: 979.98px) { .toc-plain ol { columns: 2; column-gap: var(--gap); } .toc-plain li { break-inside: avoid; } }
@media (hover: hover) { .toc a:hover .toc-name, .faq-item summary:hover { color: var(--blue); } }
''')

# ---------------- 09 Prices
# P-1: a row never wraps: a long name wraps under itself and the price stays on the first line.
#      A price that is a phrase (.pl-long on the row) sits under its name where the list is narrow.
rep('''.pl-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--s-3); }
.pl-name { flex: 0 1 auto; font-size: var(--fs-h4); }
.pl-price { margin-left: auto; font-size: var(--fs-h3); color: var(--ink); }
.pricelist p { max-width: var(--measure); margin: var(--s-2) 0 0; font-size: var(--fs-sm); line-height: 1.5; }
.pricelist .ticks { margin-top: var(--s-3); color: var(--ink); font-size: var(--fs-sm); }''',
'''/* A long name wraps under itself; the price stays on the first line */
.pl-row { display: flex; align-items: baseline; gap: 0 var(--s-3); }
.pl-name { flex: 0 1 auto; min-width: 0; font-size: var(--fs-h4); }
.pl-price { flex: none; margin-left: auto; font-size: var(--fs-h3); color: var(--ink); }
/* A price that is a phrase (.pl-row.pl-long) is set no larger than its name. Where the list is narrow, on a phone
   and in a two-column grid until 1280px, it sits under the name, with no leader left pointing at nothing */
.pl-long .pl-price { font-size: var(--fs-h4); }
@media (max-width: 599.98px) {
  .pl-long { flex-wrap: wrap; }
  .pl-long .dots { display: none; }
  .pl-long .pl-price { flex: 1 1 100%; margin-left: 0; }
}
@media (min-width: 600px) and (max-width: 1279.98px) {
  .grid-2 .pl-long { flex-wrap: wrap; }
  .grid-2 .pl-long .dots { display: none; }
  .grid-2 .pl-long .pl-price { flex: 1 1 100%; margin-left: 0; }
}
.pricelist p { max-width: var(--measure); margin: var(--s-2) 0 0; font-size: var(--fs-sm); line-height: 1.5; }
:is(.pricelist, .steps, .case) .ticks { margin-top: var(--s-3); color: var(--ink); font-size: var(--fs-sm); }''')

# ---------------- 10 Tables
# P-3: the spec table, with the pricing page's five blocks merged in
old_spec_start = '/* Spec table: a card per package; one table from 1100px */'
old_spec_end = '''    .spec .is-popular { border: 0; border-left: var(--edge); background: var(--card); box-shadow: inset 0 var(--focus-w) 0 var(--brick), var(--shadow-2); }
  }
}
'''
a, b = s.index(old_spec_start), s.index(old_spec_end) + len(old_spec_end)
s = s[:a] + '''/* Spec table. A card per package: name and price on one line, what it is, then labelled lines.
   Two by two from 760px, in shared rows. From 1100px one table: a column per package, the popular one a raised sheet */
.spec, .spec th, .spec td { display: block; padding: 0; text-align: left; }
.spec tbody { display: grid; gap: var(--gap); }
.spec tr { position: relative; display: grid; align-content: start; padding-bottom: var(--s-3); }
.spec td { --lab: 5.75rem; display: flow-root; padding: var(--s-1) 0 var(--s-1) var(--lab); color: var(--ink); font-size: var(--fs-sm); line-height: 1.4; }
.spec :is(.spec-name, .spec-price) { grid-area: 1 / 1; align-self: baseline; }
.spec .spec-name { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s-2); color: var(--ink); letter-spacing: .14em; }
.spec .spec-price { padding: 0 0 var(--s-3); font-size: var(--fs-price); line-height: 1; letter-spacing: -.025em; text-align: right; }
.spec-price small, .receipt-total small { display: block; margin-top: var(--s-2); font: 600 var(--fs-sm)/1.4 var(--font-text); letter-spacing: 0; color: var(--ink-2); text-align: left; }
.spec .spec-what { padding: 0 0 var(--s-3); font-size: var(--fs-md); }
.spec .spec-what + td { padding-top: var(--s-3); border-top: var(--dash); }
.spec .spec-act { display: grid; gap: var(--s-1); justify-items: center; padding: var(--s-3) 0 var(--s-1); }
.spec-act .btn { padding-inline: var(--s-3); }
:is(.spec, .table) td ul { list-style: none; display: grid; gap: var(--s-1); }
.spec .cell-label { display: block; }
.spec .spec-what .cell-label { display: none; }
.spec .is-popular { border: var(--frame); box-shadow: var(--shadow-3); }
/* "Most popular" is a tab on the top edge */
.spec .popular { position: absolute; left: var(--tab-x, var(--pad)); top: var(--tab-y, 0); translate: 0 -50%; }
@media (min-width: 760px) { .spec tbody { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@supports (grid-template-rows: subgrid) {
  /* Two cards in a row share their eight rows */
  @media (min-width: 760px) and (max-width: 1099.98px) {
    .spec tbody { row-gap: 0; }
    .spec tr { grid-row: span 8; grid-template-rows: subgrid; margin-bottom: var(--gap); }
  }
  @media (min-width: 1100px) {
    .spec { display: grid; grid-template-columns: max-content minmax(0, 1fr); grid-template-rows: repeat(var(--rows, 7), auto); border-block: var(--frame); }
    .spec thead, .spec tbody, .spec tr { display: grid; grid-row: 1 / -1; grid-template-rows: subgrid; gap: 0; width: auto; height: auto; margin: 0; overflow: visible; clip: auto; white-space: normal; }
    .spec thead { position: static; }
    .spec tbody { grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); }
    .spec tr { grid-template-columns: minmax(0, 1fr); padding: 0; border: 0; border-left: var(--edge); border-radius: 0; background: none; box-shadow: none; }
    .spec th, .spec td, .spec .spec-price, .spec .spec-what, .spec .spec-what + td, .spec .spec-act { display: block; padding: var(--s-3) var(--s-4); border-top: var(--edge); }
    .spec :is(.spec-name, .spec-price) { grid-area: auto; align-self: auto; }
    .spec .spec-price { text-align: left; overflow-wrap: anywhere; }
    .spec .spec-what { font-size: var(--fs-sm); }
    .spec thead tr { border: 0; }
    .spec thead th { padding-left: 0; color: var(--ink-3); }
    .spec tr > :first-child { padding-top: var(--s-5); border-top: 0; }
    .spec tr > :nth-child(2) { border-top: 0; }
    .spec .spec-act { display: grid; padding-block: var(--s-4) var(--s-3); }
    .spec .cell-label { display: none; }
    .spec .is-popular { --tab-x: var(--s-4); --tab-y: calc(-1 * var(--s-4)); z-index: 0; border: 0; box-shadow: none; }
    .spec .is-popular + tr { border-left: 0; }
    .spec .is-popular::before { content: ""; position: absolute; inset: calc(-1 * var(--s-4)) 0; z-index: -1; border: var(--frame); border-radius: var(--r-md); background: var(--card); box-shadow: inset 0 var(--s-1) 0 var(--brick), var(--shadow-3); }
  }
  /* The buttons stay on one line in the narrowest columns */
  @media (min-width: 1100px) and (max-width: 1279.98px) {
    .spec .spec-act { padding-inline: var(--s-2); }
    .spec-act .btn { padding-inline: var(--s-2); font-size: var(--fs-sm); }
  }
}
''' + s[b:]

# P-4: the stacked table; P-17: the ledger total on a narrow phone
rep('''.table tbody .num { color: var(--ink); font-size: var(--fs-h4); }
''', '''.table tbody .num { color: var(--ink); font-size: var(--fs-h4); }
.table td:last-child { padding-right: 0; }
.table .btn { white-space: nowrap; }
''')
rep('''  /* Stacked: the name with its price beside it, then labelled lines */
  :is(.table-stack, .ledger) tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: var(--s-1) var(--s-3); padding-block: var(--s-3); border-top: var(--dash); }
  :is(.table-stack, .ledger) :is(th, td), .ledger tfoot :is(th, td) { width: auto; padding: 0; border: 0; text-align: left; }
  .table-stack td { --lab: 7rem; grid-column: 1 / -1; display: flow-root; padding-left: var(--lab); }
  .table-stack tbody th { font-size: var(--fs-h4); }
  .table-stack tbody .num { grid-area: 1 / 2; padding: 0; font-size: var(--fs-h3); }
  .table-stack .cell-label { display: block; }
  .table-stack td > .btn { margin-top: var(--s-2); }
  .ledger tfoot tr { border-top: var(--bold) solid var(--ink); }
  .ledger :is(th, td) { grid-column: 1 / -1; }
  .ledger tr > :first-child { grid-column: 1; }
  .ledger .num { grid-area: 1 / 2; }
}''', '''  /* Stacked: the name with its price beside it, then the other cells under them */
  :is(.table-stack, .ledger) tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: var(--s-1) var(--s-3); padding-block: var(--s-3); border-top: var(--dash); }
  :is(.table-stack, .ledger) :is(th, td), .ledger tfoot :is(th, td) { width: auto; padding: 0; border: 0; text-align: left; }
  /* A stacked row reads like a package card: who it fits in grey, what you get, a full-size button */
  .table-stack tr { padding-block: var(--s-4); }
  .table-stack td { grid-column: 1 / -1; }
  .table-stack tbody th { font-size: var(--fs-h4); }
  .table-stack th + td { color: var(--ink-3); }
  .table-stack tbody .num { grid-area: 1 / 2; font-size: var(--fs-h3); }
  .table-stack .btn { min-height: var(--btn-h); margin-top: var(--s-2); font-size: var(--fs-md); }
  /* The ledger's total may wrap on a narrow phone */
  .ledger tfoot tr { grid-template-columns: auto minmax(0, 1fr); border-top: var(--bold) solid var(--ink); }
  .ledger :is(th, td) { grid-column: 1 / -1; }
  .ledger tr > :first-child { grid-column: 1; }
  .ledger .num { grid-area: 1 / 2; }
  .ledger tfoot .num { white-space: normal; text-align: right; text-wrap: balance; }
}''')

# ---------------- 11 Receipt and payment plan
# P-5: the deposit is its share of the whole bar, less half a gap
rep('.payplan-dep { flex-basis: 0; } }', '.payplan-dep { flex: 0 0 calc(var(--w) * 1% - var(--s-0)); } }')

# ---------------- 12 Paper objects
# P-15: on a phone the numeral sits beside the title and the rest of the step runs the full width
rep('''.steps p { max-width: var(--measure); margin: var(--s-2) 0 0; }
''', '''.steps p { max-width: var(--measure); margin: var(--s-2) 0 0; }
/* Phone: the numeral sits beside the title; the rest of the step runs the full width */
@media (max-width: 599.98px) {
  .steps-no + div { display: contents; }
  .steps-no + div > :not(:first-child) { grid-column: 1 / -1; }
}
''')
# F1: the appointment card keeps its width beside the closing band's copy
rep('.appt { width: min(100%, 21rem); padding:', '.appt { --appt-w: 21rem; width: min(100%, var(--appt-w)); padding:')
# P-12: a narrow business card tightens its top row, so the tagline stays on one line
rep('''@media (hover: hover) { .bizcard-lines a:hover { color: var(--blue); text-decoration: underline; } }
''', '''/* A phone's card tightens its top row; the tagline stays on one line */
@media (max-width: 599.98px) { .bizcard { --crest: 2rem; } .bizcard-top { gap: var(--s-2); } .bizcard-top span { letter-spacing: 0; word-spacing: -.1em; } }
@media (hover: hover) { .bizcard-lines a:hover { color: var(--blue); text-decoration: underline; } }
''')

# ---------------- 13 Mocks and figures
# B4 and F11: the figure is one shrinkable column; a page sets its own side-by-side form
rep('''.fig { display: grid; gap: var(--s-5); }
.fig-art { position: relative; display: grid; justify-items: center; }''',
'''.fig { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--s-5); }
.fig-art { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; }''')
rep('''@media (min-width: 760px) { .fig { grid-template-columns: fit-content(50%) minmax(0, 1fr); align-items: center; gap: var(--gap-lg); } }
''', '')
# P-18: a figure marker can pin to a thread note
rep('.thread-note { align-self: center; display: inline-flex;', '.thread-note { position: relative; align-self: center; display: inline-flex;')
# P-10: the address keeps the paper well on a sand band (4.6:1; the sand's own well would drop it to 4.1:1)
rep('.browser { border: var(--frame);', '.browser { --well: var(--paper-2); border: var(--frame);')

# ---------------- 14 Work, FAQ, forms
# C2: a print lifts with translate, which a scroll reveal (it owns transform) cannot cancel
rep('border-radius: var(--r-md); color: var(--ink); text-decoration: none; transition: var(--move); }\n.print-img',
    'border-radius: var(--r-md); color: var(--ink); text-decoration: none; transition: translate var(--t) var(--ease); }\n.print-img')
rep('  .print:hover { color: var(--ink); transform: translateY(calc(-1 * var(--s-1))); box-shadow: var(--shadow-3); }',
    '  .print:hover { color: var(--ink); translate: 0 calc(-1 * var(--s-1)); box-shadow: var(--shadow-3); }   /* translate: a scroll reveal owns transform */')
# P-11: a flipped row swaps its tracks too, so the picture is the same size in every row
rep('  .case-flip > :first-child { order: 2; }', '  .case-flip { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); }\n  .case-flip > :first-child { order: 2; }')
# P-9: the longest option fits beside the arrow; what main.js says back is boxed
rep('appearance: none; padding-right: var(--s-7); background-image:', 'appearance: none; padding-right: calc(var(--s-6) + var(--s-1)); text-overflow: ellipsis; background-image:')
rep('''.form-status, .status { margin: var(--s-4) 0 0; color: var(--ink); font-weight: 600; }
:is(.form-status, .status).error { color: var(--brick); }
.form-status.ok { padding: var(--s-3) var(--s-4); border-left: var(--focus-w) solid var(--ink); border-radius: var(--r-xs); background: var(--well); }''',
'''.form-status, .status { margin: var(--s-4) 0 0; color: var(--ink); font-weight: 600; }
:is(.form-status, .status).error { color: var(--brick); }
/* What main.js says back under the form, boxed: a problem in brick, the thank-you in ink with a tick */
.form-status { padding: var(--s-3) var(--s-4); border-left: var(--focus-w) solid var(--brick); border-radius: var(--r-xs); background: var(--brick-tint); animation: kws-fade var(--t-slow) var(--ease) both; }
.form-status.ok { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--s-3); border-color: var(--ink); background: var(--paper-3); font-size: var(--fs-body); }
.form-status.ok::before { content: ""; width: var(--s-3); height: var(--s-5); margin: 0 var(--s-1) 0 var(--s-2); border: solid var(--ink); border-width: 0 var(--focus-w) var(--focus-w) 0; transform: rotate(40deg) scale(.7); }''')

# ---------------- 15 Closing band
rep('.cta-inner { display: grid; gap: var(--s-7); justify-items: start; }', '.cta-inner { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--s-7); justify-items: start; }')
rep('@media (min-width: 980px) { .cta-inner { grid-template-columns: minmax(0, 1fr) auto; gap: var(--gap-lg); align-items: center; } }',
    '@media (min-width: 980px) { .cta-inner { grid-template-columns: minmax(0, 1fr) auto; gap: var(--gap-lg); align-items: center; } .cta-inner > .appt { width: var(--appt-w); } }')

# ---------------- 16: utilities at the end
rep('''.space-above { margin-top: var(--stack); }
''', '''.space-above { margin-top: var(--stack); }
/* Last of the layout rules, so no component's own display can show a decorative object below 980px */
@media (max-width: 979.98px) { .wide-only { display: none; } }
''')

# ---------------- 17 Motion
rep('.js .reveal { opacity: 0; transform: translateY(var(--s-3)); transition: opacity var(--t-slow) var(--ease), transform var(--t-slow) var(--ease); }',
    '/* A reveal owns transform. Anything revealed that also moves under the pointer (a print) uses translate */\n.js .reveal { opacity: 0; transform: translateY(var(--s-3)); transition: opacity var(--t-slow) var(--ease), transform var(--t-slow) var(--ease), translate var(--t) var(--ease); }')
rep('''@keyframes kws-fade { from { opacity: 0; } }
''', '''@keyframes kws-fade { from { opacity: 0; } }
/* Paints the brush under a .mark, once: a page opts in with animation: kws-brush on .mark::after */
@keyframes kws-brush { from { transform: scaleX(0); } }
''')

# ---------------- 18 No script, reduced motion, forced colours, print
rep('''@media print {''', '''/* Forced colours (Windows High Contrast): drawn marks keep a system colour */
@media (forced-colors: active) {
  .burger, .burger::before, .burger::after, .faq-item summary::after { forced-color-adjust: none; }
  .burger, .burger::before, .burger::after { background: CanvasText; }
  [aria-expanded="true"] > .burger { background: none; }
  .faq-item summary::after { background: linear-gradient(CanvasText, CanvasText) 50% / 100% var(--bold) no-repeat, linear-gradient(CanvasText, CanvasText) 50% / var(--bold) 100% no-repeat; }
  .chip :checked + span { outline: var(--bold) solid Highlight; }
}

@media print {''')
rep('/* == 18 No script, reduced motion, print == */', '/* == 18 No script, reduced motion, forced colours, print == */')
rep('16 Footer and the phone\'s sticky bar   17 Motion                              18 No script, reduced motion, print',
    '16 Footer and the phone\'s sticky bar   17 Motion                              18 No script, reduced motion, forced colours, print')
p.write_text(s)
print('shared part edited:', len(s.encode()), 'bytes')
