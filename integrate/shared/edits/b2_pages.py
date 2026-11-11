import pathlib, sys
p = pathlib.Path('/home/user/Knightwebstudio/assets/css/styles.css'); s = p.read_text()
def rep(old, new, count=1):
    global s
    if s.count(old) != count: sys.exit(f'expected {count} of: {old[:90]!r}, found {s.count(old)}')
    s = s.replace(old, new)

# ================= 19 Home
rep('[data-page="home"] .hero-grid { grid-template-columns: minmax(0, 1fr); align-items: start; }', '[data-page="home"] .hero-grid { align-items: start; }')
rep('''/* SHARED-CANDIDATE: the facts shelf. Its labels break evenly, and because five across is too tight until 1100px
   (one fact ran to four lines at 1024px) it is three and two between 980 and 1099px. */
[data-page="home"] .points span { text-wrap: balance; }
''', '''/* The facts shelf: five across is too tight until 1100px (one fact ran to four lines at 1024px),
   so it is three and two between 980 and 1099px. */
''')
rep('''/* Services: the name with its price under it and what it is; beside them, what you get.
   SHARED-CANDIDATE: a .pricelist row whose price is too long for the name's line (the leader is left dangling) */
[data-page="home"] .offer { max-width: none; }
[data-page="home"] .offer .pl-row { display: grid; gap: var(--s-1); }
[data-page="home"] .offer .pl-name { font-size: var(--fs-title); }
[data-page="home"] .offer .pl-price { margin: 0; font-size: var(--fs-h4); }
[data-page="home"] .offer .dots { display: none; }
''', '''/* Services: the name with its price under it and what it is; beside them, what you get. The rows have no leader. */
[data-page="home"] .offer { max-width: none; }
[data-page="home"] .offer .pl-row { display: grid; gap: var(--s-1); }
[data-page="home"] .offer .pl-name { font-size: var(--fs-title); }
[data-page="home"] .offer .pl-price { margin: 0; font-size: var(--fs-h4); }
''')
rep('''/* SHARED-CANDIDATE: one-word last lines. On the price board ("pay.", "months", "month", "plans"), and in a section
   intro or the closing band's paragraph ("yourself.") */
[data-page="home"] .board :is(.board-head p, .tier-plan, dd, .btn) { text-wrap: balance; }
[data-page="home"] :is(.section-sub, .cta-copy p) { text-wrap: pretty; }

''', '')

# ================= 20 Services
rep(' border-radius: var(--r-sm); scroll-margin-bottom: var(--s-3); color: var(--ink); line-height: 1.25;', ' border-radius: var(--r-sm); color: var(--ink); line-height: 1.25;')
rep('''/* A price in words or in parts is set no larger than its name. A phone has no leaders: a long price sits under its name. */
[data-page="services"] .pl-terms { font-size: var(--fs-h4); }
@media (max-width: 759.98px) { [data-page="services"] .menu-price { font-size: var(--fs-body); } }
@media (max-width: 1099.98px) { [data-page="services"] .pl-terms { font-size: var(--fs-body); } }
@media (max-width: 599.98px) {
  [data-page="services"] .dots { display: none; }
  [data-page="services"] .pl-row { justify-content: space-between; }
  [data-page="services"] .pl-price { margin-left: 0; }
}
''', '''@media (max-width: 759.98px) { [data-page="services"] .menu-price { font-size: var(--fs-body); } }
''')
rep('''/* SHARED-CANDIDATE: a price-list row that opens. Markup: .faq.pricelist, each summary holding an h3.pl-row.
   The row's id is on its .faq-body, so a link to it opens the row. */''',
'''/* A price-list row that opens. Markup: .faq.pricelist, each summary holding an h3.pl-row.
   The row's id is on its .faq-body, so a link to it opens the row (main.js does it where the browser does not). */''')
rep('''[data-page="services"] .fig { gap: var(--s-4); }
[data-page="services"] :is(.fig, .fig-art) { grid-template-columns: minmax(0, 1fr); }
''', '''[data-page="services"] .fig { gap: var(--s-4); }
''')

# ================= 21 Consulting
# the first .calc-inputs column rule was replaced by the later one at the same width: one rule now
rep('''@media (min-width: 600px) { [data-page="consulting"] .calc-inputs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 980px) {''', '''@media (min-width: 980px) {''')
rep('/* SHARED-CANDIDATE: focus ring round the box and its unit */', '/* The focus ring goes round the box and its unit */')
rep('''/* SHARED-CANDIDATE: a narrow phone wraps the total */
@media (max-width: 759.98px) {
  [data-page="consulting"] .ledger tfoot tr { grid-template-columns: auto minmax(0, 1fr); }
  [data-page="consulting"] .ledger tfoot .num { white-space: normal; text-align: right; text-wrap: balance; }
}
''', '')
rep('''/* Shrinkable columns, for enlarged text */
[data-page="consulting"] .auto :is(.fig, .fig-art) { grid-template-columns: minmax(0, 1fr); }
''', '')
rep('''/* SHARED-CANDIDATE: a marker pins to a thread note */
[data-page="consulting"] .thread-note { position: relative; }
''', '')
rep('[data-page="consulting"] .path > li > div > p { margin: 0; }', '[data-page="consulting"] .path > li > div > :is(p, .ticks) { margin: 0; }')
rep('''[data-page="consulting"] .path .ticks { color: var(--ink); }
''', '')
rep('''  [data-page="consulting"] .path > li > div { display: contents; }
''', '')

# ================= 22 Work
rep('[data-page="work"] .case .ticks { gap: var(--s-2); margin-top: var(--s-3); color: var(--ink); font-size: var(--fs-sm); }', '[data-page="work"] .case .ticks { gap: var(--s-2); }')
rep('''/* SHARED-CANDIDATE: a browser frame that is a link to the live site (the print already is one).
   It keeps the paper well on a sand band, where the sand's darker well drops the address under AA (4.1:1) */
[data-page="work"] a.browser { --well: var(--paper-2); display: block; color: var(--ink-3); text-decoration: none; transition: var(--move); }''',
'''/* The browser frame as a link to the live site (the print already is one) */
[data-page="work"] a.browser { display: block; color: var(--ink-3); text-decoration: none; transition: var(--move); }''')
rep('''/* The write-up starts on the frame's top edge.
   SHARED-CANDIDATE: a flipped row swaps its tracks too, so the picture is the same size in every row */
@media (min-width: 980px) {
  [data-page="work"] .case { align-items: start; }
  [data-page="work"] .case-flip { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); }
}''', '''/* The write-up starts on the frame's top edge */
@media (min-width: 980px) { [data-page="work"] .case { align-items: start; } }''')

# ================= 23 Process
rep('''[data-page="process"] .steps p { text-wrap: pretty; }
''', '')
rep('/* SHARED-CANDIDATE: the appointment card\'s leader lines (.appt-lines) as a terms list on any paper object */', '/* The appointment card\'s leader lines (.appt-lines) as a terms list on the ticket */')
rep('''/* The stamp lands once, at the end of the ticket: a beat late, to clear the phone bar. Screen only */
@media screen and (prefers-reduced-motion: no-preference) {
  .js [data-page="process"] .stamp.reveal { transform: scale(1.4); transition-duration: var(--t); transition-delay: var(--t-slow); }''',
'''/* The stamp lands once, at the end of the ticket (main.js reveals it clear of the phone bar). Screen only */
@media screen and (prefers-reduced-motion: no-preference) {
  .js [data-page="process"] .stamp.reveal { transform: scale(1.4); transition-duration: var(--t); }''')

# ================= 24 Pricing
rep('/* Pricing. SHARED-CANDIDATE rules belong in styles.css. */', '/* Pricing: shared parts (the spec table, the stacked care table, the payment plan) with the page\'s own layout round them. */')
a = s.index('/* SHARED-CANDIDATE: spec table below 1100px, one tight card per package */')
b = s.index('/* How you pay. SHARED-CANDIDATE: the deposit is exactly half the bar */')
s = s[:a] + s[b:]
rep('''/* How you pay. SHARED-CANDIDATE: the deposit is exactly half the bar */
[data-page="pricing"] #payment ul{max-width:var(--measure)}
[data-page="pricing"] .payplan{margin-top:var(--s-5)}
@media (min-width:600px){
[data-page="pricing"] .payplan-dep{flex:0 0 calc(50% - var(--s-0))}
}
''', '''/* How you pay */
[data-page="pricing"] #payment ul{max-width:var(--measure)}
[data-page="pricing"] .payplan{margin-top:var(--s-5)}
''')
rep('''/* SHARED-CANDIDATE: a long name wraps under itself; the price stays on the first line */
[data-page="pricing"] .pl-row{flex-wrap:nowrap}
''', '')
rep('''[data-page="pricing"] .card :is(.ticks,.btn-row){justify-self:stretch;column-gap:var(--gap)}
[data-page="pricing"] .table td:last-child{padding-right:0}
/* SHARED-CANDIDATE: a stacked table row reads like a package card */
@media (max-width:759.98px){
[data-page="pricing"] .table-stack tr{padding-block:var(--s-4)}
[data-page="pricing"] .table-stack td{padding-left:0}
[data-page="pricing"] .table-stack .cell-label{display:none}
[data-page="pricing"] .table-stack th+td{color:var(--ink-3)}
[data-page="pricing"] .table-stack .btn{min-height:var(--btn-h);font-size:var(--fs-md)}
}
''', '''[data-page="pricing"] .card :is(.ticks,.btn-row){justify-self:stretch;column-gap:var(--gap)}
''')
rep('''[data-page="pricing"] .card .ticks{grid-template-columns:repeat(2,minmax(0,1fr))}
[data-page="pricing"] .table .btn{white-space:nowrap}
''', '''[data-page="pricing"] .card .ticks{grid-template-columns:repeat(2,minmax(0,1fr))}
''')

# ================= 25 FAQ
rep('/* FAQ. Shared parts do the work: the contents list, the FAQ list, the closing band. SHARED-CANDIDATE rules belong in styles.css. */', '/* FAQ. Shared parts do the work: the contents list, the FAQ list, the closing band. */')
rep('''/* SHARED-CANDIDATE: a question breaks evenly, with no single word left on its last line; an answer holds a reading measure */
[data-page="faq"] .faq-item summary{text-wrap:balance}
[data-page="faq"] .faq-body{max-width:31em;text-wrap:pretty}
''', '')
rep('''/* SHARED-CANDIDATE: a short contents list. Below 980px the links sit two by two, then in one row,''', '''/* A short contents list. Below 980px the links sit two by two, then in one row,''')

# ================= 26 About
rep('/* SHARED-CANDIDATE: a 15-letter word fits a 320px phone (--fs-h1 stops at 38px) */', '/* A 15-letter word fits a 320px phone (--fs-h1 stops at 38px) */')
rep('''/* Arriving, once: the name is underlined and the card is put down.
   SHARED-CANDIDATE: a brush mark on a first line is lifted clear of the next */
[data-page="about"] .mark::after{bottom:.01em;right:.05em;height:.2em;transform-origin:0;animation:about-sign var(--t-slow) var(--ease) var(--t-slow) both}
[data-page="about"] .bizcard{animation:about-card var(--t-slow) var(--ease) var(--t-fast) both}
@keyframes about-sign{from{transform:scaleX(0)}}
@keyframes about-card{from{opacity:0;transform:translateY(var(--s-4)) rotate(-4deg)}}
/* SHARED-CANDIDATE: a narrow card tightens its top row; the tagline stays on one line */''',
'''/* Arriving, once: the name is underlined and the card is put down.
   The brush is on the headline's first line, so it is lifted clear of the next */
[data-page="about"] .mark::after{bottom:.01em;right:.05em;height:.2em;animation:kws-brush var(--t-slow) var(--ease) var(--t-slow) both}
[data-page="about"] .bizcard{animation:about-card var(--t-slow) var(--ease) var(--t-fast) both}
@keyframes about-card{from{opacity:0;transform:translateY(var(--s-4)) rotate(-4deg)}}
/* Beside the headline at 980 to 1100px the card is as narrow as a phone's: the same tight top row */''')
rep('''[data-page="about"] .opening{max-width:calc(var(--measure)*.7);font-weight:400;line-height:1.36}
[data-page="about"] :is(.lede,.opening){text-wrap:pretty}
/* SHARED-CANDIDATE: a heading that opens a .prose block has no gap above it */
[data-page="about"] .prose>:first-child{margin-top:0}
''', '''[data-page="about"] .opening{max-width:calc(var(--measure)*.7);font-weight:400;line-height:1.36;text-wrap:pretty}
''')

# ================= 27 City
rep('''[data-page="city"] .city-name .mark { display: inline-block; white-space: normal; overflow-wrap: anywhere; isolation: isolate; }
[data-page="city"] .city-name .mark::after { bottom: -.22em; z-index: -1; transform-origin: 0; animation: kws-city-brush var(--t-slow) var(--ease) var(--t) both; }
@keyframes kws-city-brush { from { transform: scaleX(0); } }
''', '''[data-page="city"] .city-name .mark { display: inline-block; white-space: normal; overflow-wrap: anywhere; }
[data-page="city"] .city-name .mark::after { bottom: -.22em; animation: kws-brush var(--t-slow) var(--ease) var(--t) both; }
''')
rep('''/* The in-person card: a stamp on its corner, as on the job ticket, and a brick pin on this town.
   SHARED-CANDIDATE: .card does not re-point --well (a flat label on a card has no fill at night);
   .pills wraps greedily and strands its last label, so here the rows are balanced. */
[data-page="city"] .city-meet { --well: var(--paper-3); position: relative; padding-bottom: calc(var(--fs-cap) * 4); }
[data-page="city"] .city-meet .stamp { position: absolute; right: var(--pad); bottom: calc(-1 * var(--s-5)); background: var(--card); }
[data-page="city"] .pills { display: block; margin-bottom: calc(-1 * var(--s-2)); text-wrap: balance; }
[data-page="city"] .pills li { display: inline-flex; align-items: center; gap: var(--s-1); margin: 0 var(--s-2) var(--s-2) 0; vertical-align: top; }
[data-page="city"] .pills .ico { color: var(--brick); }

/* SHARED-CANDIDATE: .steps has no spacing for a .ticks list. On a phone the numeral sits beside the title. */
[data-page="city"] .steps .ticks { margin-top: var(--s-3); color: var(--ink); font-size: var(--fs-sm); }
@media (max-width: 599.98px) {
  [data-page="city"] .steps > li > div { display: contents; }
  [data-page="city"] .steps p, [data-page="city"] .steps .ticks { grid-column: 1 / -1; }
}
''', '''/* The in-person card: a stamp on its corner, as on the job ticket, and a brick pin on this town */
[data-page="city"] .city-meet { position: relative; padding-bottom: calc(var(--fs-cap) * 4); }
[data-page="city"] .city-meet .stamp { position: absolute; right: var(--pad); bottom: calc(-1 * var(--s-5)); background: var(--card); }
[data-page="city"] .pills .ico { color: var(--brick); }
''')
rep('''/* Short lines never end on a single word */
[data-page="city"] :is(.board-head p, .tier-plan, .board-extras div, .board-foot .btn, .faq-item summary, .cta-copy .fine) { text-wrap: balance; }''',
'''/* These two short lines never end on a single word */
[data-page="city"] :is(.board-extras div, .cta-copy .fine) { text-wrap: balance; }''')

# ================= 28 Contact
rep('/* Contact. SHARED-CANDIDATE rules belong in styles.css. */', '/* Contact: the phone line, the enquiry ticket and what happens next. */')
rep('''/* SHARED-CANDIDATE: the longest option fits beside the arrow */
[data-page="contact"] .field select{padding-right:calc(var(--s-6) + var(--s-1));text-overflow:ellipsis}
@media (max-width:379.98px){[data-page="contact"] .field select{padding-right:var(--s-6);font-size:var(--fs-md)}}

/* SHARED-CANDIDATE: what main.js says back (.ok, .error), boxed */
[data-page="contact"] .form-status{padding:var(--s-3) var(--s-4);border-left:var(--focus-w) solid var(--brick);border-radius:var(--r-xs);background:var(--brick-tint);animation:kws-fade var(--t-slow) var(--ease) both}
[data-page="contact"] .form-status.ok{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--s-3);border-color:var(--ink);background:var(--paper-3);font-size:var(--fs-body)}
[data-page="contact"] .form-status.ok::before{content:"";width:var(--s-3);height:var(--s-5);margin:0 var(--s-1) 0 var(--s-2);border:solid var(--ink);border-width:0 var(--focus-w) var(--focus-w) 0;transform:rotate(40deg) scale(.7)}

/* SHARED-CANDIDATE: hCaptcha's 303x78px box: room held, scaled on the smallest phones */''',
'''/* On the smallest phones the longest option still fits beside the arrow */
@media (max-width:379.98px){[data-page="contact"] .field select{padding-right:var(--s-6);font-size:var(--fs-md)}}

/* hCaptcha's 303x78px box: room held, scaled on the smallest phones */''')

# ================= 29 Privacy and 30 Terms
rep('''/* Privacy page only: shared parts, with the contents list beside the prose from 980px (.split-sticky).
   SHARED-CANDIDATE, the same in privacy.css and terms.css: a names-only contents list (.toc-plain) in
   tighter rows, two columns on a tablet; a pinned column lets go in a window too short to show it all;
   a .split column may shrink under a long word. */
[data-page="privacy"] .toc a { min-height: var(--tap); padding-block: var(--s-2); font-size: var(--fs-sm); }
@media (min-width: 600px) and (max-width: 979.98px) {
  [data-page="privacy"] .toc ol { columns: 2; column-gap: var(--gap); }
  [data-page="privacy"] .toc li { break-inside: avoid; }
}
@media (min-width: 980px) and (max-height: 620px) { [data-page="privacy"] .toc { position: static; } }
[data-page="privacy"] .split > * { min-width: 0; }
[data-page="privacy"] .prose { overflow-wrap: break-word; }
/* The dateline sits on the first heading */''',
'''/* Privacy page only: shared parts (.toc-plain beside the prose from 980px, .split-sticky) and one rule.
   The dateline sits on the first heading */''')
rep('''/* Terms page only: shared parts, with the contents list beside the prose from 980px (.split-sticky).
   SHARED-CANDIDATE, the same in privacy.css and terms.css: a names-only contents list (.toc-plain) in
   tighter rows, two columns on a tablet; a pinned column lets go in a window too short to show it all;
   a .split column may shrink under a long word. */
[data-page="terms"] .toc a { min-height: var(--tap); padding-block: var(--s-2); font-size: var(--fs-sm); }
@media (min-width: 600px) and (max-width: 979.98px) {
  [data-page="terms"] .toc ol { columns: 2; column-gap: var(--gap); }
  [data-page="terms"] .toc li { break-inside: avoid; }
}
@media (min-width: 980px) and (max-height: 620px) { [data-page="terms"] .toc { position: static; } }
[data-page="terms"] .split > * { min-width: 0; }
[data-page="terms"] .prose { overflow-wrap: break-word; }
/* SHARED-CANDIDATE: a display-face figure in a sentence keeps the line spacing */''',
'''/* Terms page only: shared parts (.toc-plain beside the prose from 980px, .split-sticky) and one rule.
   A display-face figure in a sentence keeps the line spacing */''')

# ================= 31 Checkout and 32 Checkout success
a = s.index('/* == 31 Checkout: [data-page="checkout"], /checkout/ == */')
b = s.index('/* == 33 Start: [data-page="start"], /start/, the landing page == */')
s = s[:a] + '''/* == 31 Checkout: [data-page="checkout"], /checkout/ == */
/* The till. On a phone: the order slip, the payment sheet, then help. From 980px the sheet takes the wide column
   and the slip and help stand beside it. The first rules are shared with /checkout/success/ ([data-page^="checkout"]). */
[data-page^="checkout"] .till { gap: var(--s-6) var(--gap-lg); }
/* Two-screen pages where brick is the colour of an error: no reading line */
[data-page^="checkout"] .scroll-progress { display: none; }
/* The order slip: a receipt as wide as its column. It arrives once, when the script shows it; its bottom margin is the torn edge */
[data-page^="checkout"] .receipt { max-width: none; margin-bottom: var(--s-2); animation: kws-slip var(--t-slow) var(--ease) both; }
/* The price shrinks to fit a narrow slip ("$1,000/month"), and wraps before it would overflow */
[data-page^="checkout"] .receipt-total { container-type: inline-size; }
[data-page^="checkout"] .receipt-total b { max-width: 100%; font-size: calc(var(--fs-title) * 1.25); font-size: min(calc(var(--fs-title) * 1.25), 12cqi); text-align: right; overflow-wrap: anywhere; }
@keyframes kws-slip { from { opacity: 0; transform: translateY(calc(-1 * var(--s-3))); } }

[data-page="checkout"] .till-pay .label { margin-bottom: var(--s-4); }
[data-page="checkout"] .till-pay .status { max-width: var(--measure); margin: 0; }
/* An error that is the page's main message is larger than a form field's error */
[data-page="checkout"] .till-pay .status.error { padding-left: var(--s-4); border-left: var(--focus-w) solid var(--brick); font-size: var(--fs-body); font-weight: 600; line-height: 1.5; }
[data-page="checkout"] .till-side .btn-row { justify-self: stretch; }

/* With scripts off, the plain message in <noscript> stands in for "Loading" */
@media (scripting: none) { [data-page="checkout"] #checkout-status { display: none; } }
@supports selector(:has(a)) {
  [data-page="checkout"] .till-pay:has(noscript > p) #checkout-status { display: none; }
  /* While Stripe loads, the sheet holds room for its form, so less jumps under a thumb when it arrives */
  [data-page="checkout"] .till-pay:not(:has(noscript > p)):has(#checkout-status:not([hidden], .error)) { min-height: var(--maxw-card); }
}

@media (min-width: 980px) {
  [data-page="checkout"] .till { grid-template: auto 1fr / minmax(0, 7fr) minmax(0, 5fr); }
  [data-page="checkout"] .till-pay { grid-area: 1 / 1 / span 2; }
  [data-page="checkout"] .till-side { grid-column: 2; }
  [data-page="checkout"] .till-side .btn-row { display: grid; }
}

/* == 32 Checkout success: [data-page="checkout-success"], /checkout/success/ == */
/* Checkout success only; the till and the order slip are in block 31. */
/* Script-written titles: one line on a desktop, two below it */
[data-page="checkout-success"] .page-head h1{max-width:none}
@media (max-width:979.98px){[data-page="checkout-success"] .page-head h1{font-size:calc(var(--fs-h1)*.85)}}
@supports selector(:has(a)){
/* No receipt under "No payment was taken" */
[data-page="checkout-success"] .till:has(#success-retry:not([hidden])) .receipt{display:none}
@media (min-width:600px) and (max-width:979.98px){[data-page="checkout-success"]:not(:has(#success-retry:not([hidden]))) .page-head h1{text-wrap:pretty}}
}
[data-page="checkout-success"] :is(.status,h2.eyebrow){margin:0}
[data-page="checkout-success"] .steps{counter-reset:step}
[data-page="checkout-success"] .steps-no::before{counter-increment:step;content:counter(step,decimal-leading-zero)}
[data-page="checkout-success"] #success-next:not([hidden])+.btn-row{margin-top:var(--s-5)}
@media (min-width:980px){
[data-page="checkout-success"] .till{grid-template:auto auto 1fr/minmax(0,7fr) minmax(0,5fr)}
[data-page="checkout-success"] .till-next{grid-area:1/1/span 3}
[data-page="checkout-success"] .till-side{grid-column:2}
}
@media (min-width:980px) and (max-width:1099.98px){[data-page="checkout-success"] .btn-row{display:grid}}

''' + s[b:]

# ================= 33 Start
rep('''/* Head. Below 980px three facts stand beside the small shop front; from 980px the shop is the aside, the facts a shelf.
   SHARED-CANDIDATE: nothing re-wraps when the fonts arrive. Headline and lede are set lines''', '''/* Head. Below 980px three facts stand beside the small shop front; from 980px the shop is the aside, the facts a shelf.
   Nothing re-wraps when the fonts arrive: headline and lede are set lines''')
rep('''[data-page="start"] .mark::after { transform-origin: 0 50%; animation: kws-start-brush var(--t-slow) var(--ease) var(--t) both; }
@keyframes kws-start-brush { from { transform: scaleX(0); } }
''', '''[data-page="start"] .mark::after { animation: kws-brush var(--t-slow) var(--ease) var(--t) both; }
''')
rep('''[data-page="start"] .section-head-split { row-gap: 0; }
''', '')
rep('''/* SHARED-CANDIDATE: a price that is a phrase sits under its name, with no leader left pointing at nothing */
@media (max-width: 1279.98px) {
  [data-page="start"] .pl-long .dots { display: none; }
  [data-page="start"] .pl-long .pl-price { flex-basis: 100%; }
  [data-page="start"] .price-strip-note { flex-basis: 100%; }
}''', '''/* The price note keeps its own row until the head is wide */
@media (max-width: 1279.98px) { [data-page="start"] .price-strip-note { flex-basis: 100%; } }''')
rep('''/* The board. SHARED-CANDIDATE: its extras are a price list with gold prices, two across from 760px;
   its foot holds a sentence beside the button (as in city.css) */''', '''/* The board: its extras are a price list with gold prices, two across from 760px;
   its foot holds a sentence beside the button */''')
rep('''/* The closing band: the written route sits under the two buttons.
   SHARED-CANDIDATE: a way-forward link in a sentence has a 44px hit area; its focus ring stays on the words */''', '''/* The closing band: the written route sits under the two buttons.
   A way-forward link in a sentence has a 44px hit area; its focus ring stays on the words */''')

# ================= 34 Not found
rep('''/* SHARED-CANDIDATE: a page shorter than the window keeps its footer at the bottom */''', '''/* A page shorter than the window keeps its footer at the bottom */''')
rep('''[data-page="notfound"] main { flex: 1 0 auto; display: grid; align-content: center; }
''', '''[data-page="notfound"] main { flex: 1 0 auto; display: grid; align-content: center; }
/* This page loads no script, so the head snippet drops .js after four seconds. Its bare header has no in-flow
   menu to make room for: it stays sticky and keeps its height */
html:not(.js) [data-page="notfound"] .site-header { position: sticky; }
html:not(.js) [data-page="notfound"] .header-inner { padding-bottom: 0; }
''')
p.write_text(s)
import re
print('bytes:', len(s.encode()), '| SHARED-CANDIDATE left:', s.count('SHARED-CANDIDATE'), '| braces', s.count('{'), s.count('}'))
