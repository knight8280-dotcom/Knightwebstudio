#!/usr/bin/env python3
"""Second pass: rewrite gallery/components.py from the first-pass list plus the changes below.

    python3 work/make_components.py

Reads work/pass1-backup/components.py (the first-pass components) and pages/pricing/main.html
(the reference page, so the handbook's page head, spec table, care table and bundle are the
very markup that ships), applies the edits, and writes gallery/components.py.
"""
import importlib.util, pathlib, re, sys, textwrap
sys.dont_write_bytecode = True
R = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('old', R / 'work/pass1-backup/components.py')
old = importlib.util.module_from_spec(spec); spec.loader.exec_module(old)
C = {c['id']: dict(c) for c in old.COMPONENTS}
ARROW, PHONE, TICK, PIN, MAIL, CLOCK, TAGI, KEY, LOOP, MISSED = old.ARROW, old.PHONE, old.TICK, old.PIN, old.MAIL, old.CLOCK, old.TAGI, old.KEY, old.LOOP, old.MISSED
pricing = (R / 'pages/pricing/main.html').read_text()


def cut(start, end, src=pricing):
    """The block of the reference page from `start` up to and including `end`, dedented."""
    a = src.index(start); b = src.index(end, a) + len(end)
    line = src.rfind('\n', 0, a) + 1
    return textwrap.dedent(src[line:b]).strip('\n')


def sub(cid, field, a, b, count=1):
    assert C[cid][field].count(a) == count, (cid, field, a[:60], C[cid][field].count(a))
    C[cid][field] = C[cid][field].replace(a, b)


def use(cid, text):
    C[cid]['use'] = '\n' + textwrap.dedent(text).strip('\n')


def new(cid, title, usetext, html, **extra):
    C[cid] = dict(id=cid, title=title, use='\n' + textwrap.dedent(usetext).strip('\n'), html=html.strip('\n'), **extra)


# ---------------------------------------------------------------- type
use('type', '''
    One `<h1>` a page. Wrap each idea of the headline in `<span class="l">` so it sits on its own line from 600px.
    `.mark` is the brush underline: at most one a page, on the two or three words that matter.
    `.eyebrow` goes above a heading and is brick ("notice this"). `.lede` is the one intro paragraph under an `h1`.
    `.fine` is small print in 15px; it is never smaller. `.label` is a small uppercase caption.
    `.title` sets any element at the size between `h2` and `h3`: the name on a card or object ("Launch bundle").
    A card title under an `h1` is `<h2 class="h3">`: `h2` for the outline, sized like an `h3`. Never skip a level.
    Headings have no margin of their own. A paragraph or list that directly follows an `h2`, `h3` or `h4` gets a 12px gap; everything else is spaced by its container (`.stack`, `.section-head`, `.prose`).
    Text inside a filled part (a button, bubble, pill, flag or chip) keeps that part's colour, so `<strong>` is safe there.''')
sub('type', 'html', '<h3>Missed-call text-back</h3>', '<p class="title">Launch bundle</p>\n<h3>Missed-call text-back</h3>')

# ---------------------------------------------------------------- page head
head_split = cut('<section class="page-head">', '</section>')
new('page-head', 'Page head', '''
    Every page except the home page opens with `<section class="page-head">`, always with a container inside it (`.container`; legal pages use `.container-text`, the column their text uses). There are three forms and no others.
    **1. Commercial** (services, consulting, process, work, the city pages): eyebrow, `h1`, lede, one `.btn-row` whose first button is the page's main action, then the `.price-strip` with that page's fixed prices. On a phone this puts what the page is, a price and one button on the first screen. A page with no prices of its own (process, work, about, contact) leaves the strip out.
    **2. Reading** (FAQ, privacy, terms, checkout, checkout success): eyebrow, `h1`, lede. Nothing else.
    **3. Split** (pricing, about, contact, `/start/`): the commercial head with `.page-head-split` on the container and one `.page-head-aside` beside it from 980px, under it on a phone. The aside holds exactly one object: the seal on pricing, the business card on about and contact, the street scene on `/start/`. No other page has an aside. (The 404 page has its own block, below.) Add `wide-only` to hide a purely decorative aside (the seal) below 980px.
    The price strip is a link to the section that holds those prices; use a `<p class="price-strip">` when there is nowhere to send people. Fixed prices only, four at most.
    The "On this page" list is not part of the head: it is the first block of the `.section-first` that follows.
    The home page's hero is its own (`pages/home.css`) and is not a model for any other page.''', '''
<!-- 1. Commercial -->
<section class="page-head">
  <div class="container">
    <p class="eyebrow">Consulting &amp; automation</p>
    <h1><span class="l">More customers,</span> <span class="l">less busywork</span></h1>
    <p class="lede">A website is one piece. We also set up the systems behind it: Google reviews, missed-call text-back, online booking and automatic follow-up. Fixed prices, like everything else we do.</p>
    <div class="btn-row">
      <a class="btn btn-primary btn-lg" href="/contact/?package=audit">Book a Growth Audit, $350</a>
      <a class="btn btn-lg" href="#calculator">Estimate what it's worth</a>
    </div>
    <a class="price-strip" href="#services">
      <span class="price-strip-label">Setups</span>
      <span class="price-strip-nums"><b>$500</b><b>$750</b><b>$1,500</b></span>
      <span class="price-strip-note">Fixed, published prices</span>
    </a>
  </div>
</section>

<!-- 2. Reading -->
<section class="page-head">
  <div class="container">
    <p class="eyebrow">FAQ</p>
    <h1>Questions we get asked</h1>
    <p class="lede">The things people ask before they hire us, about websites, consulting and automation.</p>
  </div>
</section>

<!-- 3. Split: one object beside the head from 980px -->
''' + head_split, wrap='full')

# ---------------------------------------------------------------- section head
use('section-head', '''
    Every band of a page is a `<section class="section">` holding a `.container`. Alternate plain paper with `.section-sand`.
    Never put two bands of the same colour together. If it cannot be avoided, the second one drops its top padding by itself, so the gap is not doubled.
    `.section-tight` is a shorter band, for a short aside between two full ones. `.section-first` is the first band under a `.page-head`.
    The header is left aligned: eyebrow, `h2`, optional `.section-sub`. `.section-head-split` puts the title left and the intro right from 980px.
    An eyebrow is optional: use it when it adds something the title does not say ("Add to any project"), never to repeat the title.
    In the narrow column of a `.split`, a title of more than five words takes `class="h3"`, or it wraps to four lines.
    The header carries the gap to the first block under it. Every further block in the same container takes `space-above`; `.section-more`, the link that closes a section, has that gap built in.
    A page that does not end in the closing band ends on plain paper, never on sand: the footer skyline stands in the room `main` leaves under the last section.''')
sub('section-head', 'html', '''<header class="section-head section-head-row">
  <p class="eyebrow">Websites</p>
  <h2 class="h3">Four packages. Pick the one that fits.</h2>
</header>
''', '''<div class="grid grid-3">
  <div class="card">One block</div><div class="card">under the header</div><div class="card">needs no class</div>
</div>
<div class="card space-above">A second block in the same section takes <code>space-above</code>.</div>
''')

# ---------------------------------------------------------------- buttons
use('buttons', '''
    Blue means pressable, so one `.btn-primary` per view: the thing we most want pressed. Plain `.btn` is the secondary button. `.btn-quiet` is a text button for the third choice.
    `.btn-lg` (56px) for a page head and the closing band, default 52px, `.btn-sm` (44px) for the header and table rows. `.btn-block` fills its column.
    Put two or more buttons in `.btn-row`: stacked full width on a phone, in a row from 600px.
    An icon is an inline `<svg class="ico">` before the words. The call button is always a real `tel:` link with the number or the word Call as text.
    A booking button carries `data-booking`; `main.js` points it at the calendar and opens a new tab. Its `href` stays `/contact/` for when scripts are off.
    Keep an amount on one line with a non-breaking space, not a `span`: `Pay 50% deposit —&nbsp;$1,000`.
    A disabled button is dimmed with a not-allowed cursor; add `aria-busy="true"` while it is sending.
    `.more-link` is the arrow link that ends a section.''')
sub('buttons', 'html', '<a class="btn btn-primary btn-sm" href="/contact/">Get a quote</a>', '<a class="btn btn-primary btn-sm" href="/contact/" data-booking>Book a free call</a>')

# ---------------------------------------------------------------- tone scopes
use('tones', '''
    A tone scope re-points the colour tokens for everything inside it, so the same classes work there with no extra rules: text, links, buttons, pills, flags, ticks, notes, the payment plan, figure markers and focus rings all follow it.
    `.on-blue` is painted-sign blue: text turns cream, eyebrows and prices turn gold, `.btn-primary` turns cream and plain `.btn` becomes a cream outline. The focus ring turns gold.
    `.on-ink` is the footer and top strip. `.on-paper` puts the day palette back, whatever the theme.
    **A paper object inside a tone scope carries `.on-paper`**: a receipt, ticket, time sheet, vignette, phone, business card or appointment card on a blue panel is still a piece of paper. Without the class it turns into a tinted patch of blue.
    Gold only ever appears inside `.on-blue` or `.on-ink`. One blue panel (the board or a `.panel.on-blue`) and one closing band a page at most. No form fields on blue.''')

new('on-blue-all', 'Everything inside .on-blue', '''
    Not a component: the proof that the scope holds. Every small part sits on blue here and `contrast.js` measures it in both themes.
    If you need something on blue that is not shown here, add it to this block first and run the contrast check.''', '''
<div class="panel on-blue stack">
  <p class="eyebrow">On blue</p>
  <h3>Every small part, on the painted sign</h3>
  <p>Body copy, <strong>strong text</strong> and <a href="/pricing/">a link</a>. <span class="flag">Example</span> <span class="popular">Most popular</span> <span class="pill">Quote sent</span> <span class="pill pill-new">New</span> <span class="pill pill-go">Follow-up sent · 2 days</span></p>
  <p class="tag">$750 or $1,500 per setup</p>
  <ul class="ticks">
    <li>Custom design, built for you</li>
    <li>Built mobile-first</li>
  </ul>
  <ul class="pills" aria-label="Towns where we meet in person">
    <li>Baton Rouge</li><li>Gonzales</li><li>Prairieville</li>
  </ul>
  <p class="note"><span class="flag">Example</span>These are example numbers to show the arithmetic, not a measurement of your business.</p>
  <figure class="payplan" role="img" aria-label="The Launch bundle payment plan: $1,500 down, then $500 a month for 3 months">
    <p class="label" aria-hidden="true">Payment plan</p>
    <div class="payplan-bar" aria-hidden="true"><span class="payplan-seg payplan-dep" style="--w:50"><b>$1,500</b>down</span><span class="payplan-seg" style="--w:16.67"><b>$500</b>month 1</span><span class="payplan-seg" style="--w:16.67"><b>$500</b>month 2</span><span class="payplan-seg" style="--w:16.67"><b>$500</b>month 3</span></div>
  </figure>
  <div class="fig-art">
    <ul class="thread" aria-hidden="true">
      <li class="bubble bubble-biz"><b class="fig-n">1</b>Sorry we missed your call, this is [your business]. What can we help with?</li>
      <li class="bubble bubble-cust">The kitchen sink is leaking under the cabinet.</li>
    </ul>
  </div>
  <div class="browser">
    <div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>yourbusiness.com</span></div>
  </div>
  <div class="vig on-paper">
    <span class="flag">Example</span>
    <ul class="thread" aria-hidden="true">
      <li class="thread-note thread-done">''' + TICK + '''Job marked done</li>
      <li class="bubble bubble-biz">Thanks for choosing [your business].</li>
    </ul>
  </div>
  <div class="btn-row">
    <a class="btn btn-primary" href="/contact/" data-booking>Book a discovery call</a>
    <a class="btn" href="/contact/">Send an enquiry</a>
    <a class="btn btn-quiet" href="/pricing/">See the prices</a>
  </div>
</div>''', doc='')

# ---------------------------------------------------------------- small parts
use('small-parts', '''
    `.ticks` is the tick list for what is included. `.tag` is a price tag: use it for a price that sits beside a title.
    `.pill` is a small status inside a mock: plain, `.pill-new` (brick: notice this) or `.pill-go` (ink: done). A pill is never a control and is never blue.
    `.pills` is a row of flat labels, used for the towns. They are square-cornered and filled so that they cannot be mistaken for the form's checkbox chips.
    `.flag` marks a mock as an example. `.popular` is the one "Most popular" marker; it belongs to the Business package only.
    `.note` is the qualifier that sits right beside a number: example, estimate, not a guarantee. Start it with a `.flag`. Never move it away from the figure it qualifies.''')

use('stamp', '''
    One stamp a page, counting the seal. Both are decorative (`aria-hidden`): the same words are always in the page text.
    `.stamp` is a rubber stamp for two or three words. The seal is drawn by `tools/art` from the marker shown; set its size with `--seal` on a wrapper in your page stylesheet.
    One tilted object a page as well: add `.tilt` to a single card (business card, print or receipt). Everything else sits straight.
    Both are turned with the `rotate` property, so `reveal` on a stamp or a tilted card is safe.''')

# ---------------------------------------------------------------- layout, panel, points
use('layout', '''
    `.card` is the plain raised surface. Reach for it only when no shop object (ticket, receipt, sheet, board) fits, and never build a wall of identical cards.
    `.grid` with `.grid-2`, `.grid-3` or `.grid-4` lays children out in equal columns (one column on a phone; `.grid-4` is two columns from 760px and four from 1100px).
    `.stack` spaces its children evenly top to bottom; set `--stack-gap` in your page stylesheet to change the step.
    `.cluster` is a wrapping row of small things. `.split` is the two-column section layout from 980px (4 to 7); add `.split-even` for halves and `.split-sticky` to pin the first column while the second scrolls.
    `.space-above` adds the section gap above a block that follows another block. `.wide-only` hides a decorative object below 980px.''')

bundle = cut('<aside class="panel on-blue', '</aside>')
new('panel', 'Panel and the bundle', '''
    `.panel` is the big rounded surface for the one thing a page is built around. Plain, it is raised paper (the calculator sits on one). `.panel.on-blue` is the painted-sign panel with the gold inner line; a page has one blue panel at most, counting the price board.
    The bundle is the canonical blue panel: `.panel.on-blue.split.split-even`. On the left a `.stack` with the eyebrow, the name as `.title`, one sentence, the payment plan drawn to scale and one button. On the right the itemised `.receipt.on-paper`.
    Every figure on it is a published price, and the receipt adds up: $2,000 + $500 + $750 is $3,250, struck through, above $3,000.''', bundle)

new('points', 'Facts shelf', '''
    Up to five short facts on a shelf: a brick line icon and a few words each. Two columns on a phone (an odd last one takes the whole row), five across from 980px.
    Used under the home hero and under a city page's head. Facts only: no claims, no counts, nothing that is not already on the site.''', '''
<ul class="points">
  <li>''' + CLOCK + '''<span>Websites live in as little as <span class="nowrap">7–10 days</span></span></li>
  <li>''' + LOOP + '''<span>Automations that run while you work</span></li>
  <li>''' + TAGI + '''<span>Fixed, published prices</span></li>
  <li>''' + KEY + '''<span>You own everything</span></li>
  <li>''' + PIN + '''<span>Meet in person anywhere in Greater Baton Rouge</span></li>
</ul>''')

# ---------------------------------------------------------------- prose, toc
use('prose', '''
    For long text: privacy, terms, the About page. It holds the line to about 65 characters and spaces headings, paragraphs and lists.
    Inside `.prose`, `h2` is sized like an `h3`. Use it inside `.container-text` (a 46rem column) on legal pages. Legal wording is never edited.
    A bare `<ul>` or `<ol>` has no indent and its markers hang in the gutter. Every list is inside `.prose`, or is a `.ticks`, `.steps`, `.pricelist` or `.pills`.
    A plain `<p>` directly inside a `.container` is capped at the same measure for you.''')

use('toc', '''
    At the top of a long commercial page (pricing, services, consulting). Each entry can show that section's prices on the right, joined by a dotted leader from 600px; on a phone the prices sit under the name.
    It is the first block of the `.section-first` that follows the page head; the section header after it takes `space-above`.
    List fixed prices only: never a range, never "from". The title is a plain `.label`.
    Pages off the menu (checkout, city pages) that need a way back use a `.btn-quiet` link: `<a class="btn btn-quiet" href="/pricing/">Back to pricing</a>`.''')
C['toc']['html'] = cut('<nav class="toc"', '</nav>')

# ---------------------------------------------------------------- board, price list
use('board', '''
    The four website prices in gold leaf on painted blue. Each tier is one link. Used on the home page, `/start/` and the city pages; one board a page, and it counts as the page's blue panel.
    Always `class="board on-blue"`. The button inside is `.btn-primary` (it turns cream on blue).
    Rows on a phone (name and price on the first line, the payment plan under them), two by two from 760px, four across from 1100px.''')

use('pricelist', '''
    For any list of more than three priced things: name, dotted leader, price, one or two sentences. `.pl-group` labels a group.
    The name is a heading (`h3` or `h4`, whichever keeps the outline in order) with class `pl-name`. The price is always in the display face, never in a pill. A long price ("$750 or $1,500 per setup") drops under the name by itself on a phone.
    **The service row**: a row may add a `.ticks` list and a closing `.more-link`. Use it wherever a service is listed with its price, two sentences, ticks and a link (services, `/start/`, the city pages) instead of a grid of cards.
    The list is capped at 46rem. Put it beside a heading in a `.split`, or two lists side by side in a `.grid.grid-2`; never let one run the full width of the page.''')
C['pricelist']['html'] += '''

<ul class="pricelist">
  <li>
    <div class="pl-row"><h3 class="pl-name">Automation</h3><span class="dots" aria-hidden="true"></span><span class="pl-price">$750 or $1,500 per setup</span></div>
    <p>The busywork, handled: missed calls texted back, bookings and reminders, quotes followed up and reviews requested, all on their own. In a typical example that's about 4 hours a week back.</p>
    <ul class="ticks">
      <li>Missed-call text-back or online booking, $750</li>
      <li>Lead follow-up system, $1,500</li>
      <li>Custom automation workflow, $1,500</li>
    </ul>
    <a class="more-link" href="/consulting/">How consulting and automation work''' + ARROW + '''</a>
  </li>
</ul>'''

# ---------------------------------------------------------------- spec table, data table
use('spec', '''
    The website packages as one ruled table, so every row lines up across all four. It is on the pricing page; this is that page's table.
    Markup: one row per package; the header row names the columns. A card per package on a phone, two by two from 760px; from 1100px each row stands up as a column.
    Because the layout is not `display: table`, the roles are written out: keep every `role` attribute exactly as shown.
    Each value cell starts with a `.cell-label` (hidden on desktop, shown in the cards, `aria-hidden` because the column header already names it for a screen reader). A cell may hold a short `<ul>`.
    Set `style="--rows:9"` to the number of cells in a row and `--cols` to the number of packages (default 4). `.is-popular` marks one row; put the `.popular` marker in its name cell.
    The last cell (`.spec-act`) holds the package's button and, under it, one `.btn-quiet` link.''')
C['spec']['html'] = cut('<table class="spec"', '</table>')
C['spec'].pop('wrap', None)

use('table', '''
    `.table` is the plain ruled table. With two or three short columns it stays a real table at every width.
    With more, add `.table-stack`: under 760px each row becomes an entry, with the name on the first line and the price (the `.num` cell) beside it in the display face, then the labelled lines, then the button.
    A stacked table needs the roles written out and a `.cell-label` at the start of each value cell, exactly as shown. The price cell and the button cell take no label: write the unit into the price ("$125/mo").
    `.num` right-aligns a column of figures and sets them in the display face. Always give a table a `<caption>` (or `aria-label`).''')
C['table']['html'] = re.sub(r' space-above reveal"', '"', cut('<table class="table table-stack', '</table>'))

# ---------------------------------------------------------------- ledger, receipt, payment plan
sub('ledger', 'use', 'The bar cell is `aria-hidden`.', 'The bar is decoration: `aria-hidden` goes on the `span`, never on the cell, so every row keeps four cells under four headers.')
sub('ledger', 'use', 'Under 600px each row becomes a small block', 'Under 760px each row becomes a small block')
sub('ledger', 'html', '<td role="cell" class="ledger-bar" aria-hidden="true"><span style="', '<td role="cell" class="ledger-bar"><span aria-hidden="true" style="', 5)

use('receipt', '''
    The Launch bundle, or any "these things together cost this" sum: lines with dotted leaders, the separate total struck through, then the final total.
    Every figure on it must already be a published price. The receipt is narrow on purpose (26rem). On a blue panel it carries `.on-paper`.
    The checkout order summary is the same receipt with one `.receipt-total` line: the plan name in a `span`, the price in `b`. A long name wraps above the price. On `/checkout/` those two carry the ids the script fills (`checkout-plan-name`, `checkout-plan-price`), and the receipt itself keeps `id="checkout-plan"` and `hidden`.
    Status lines that scripts write to (`#checkout-status`, `#success-status`) take class `status` and sit under the receipt, never inside it; the script adds `.error`.''')
sub('receipt', 'html', '''    <p class="receipt-total"><span>Starter website — 50% deposit</span><b>$1,000</b></p>
    <p class="status">Loading secure checkout…</p>
  </div>
</div>''', '''    <p class="receipt-total"><span>Starter website — 50% deposit</span><b>$1,000</b></p>
  </div>
</div>
<p class="status" role="status">Loading secure checkout…</p>''')

use('payplan', '''
    Shows how a price splits up. Each segment's width is its share of the total: `style="--w:50"` for half, `--w:16.67` for a sixth.
    The deposit is the dark `.payplan-dep` block. Keep the amount in `<b>` and one or two words under it.
    On a phone the deposit takes its own row and the months sit under it as equal parts, so each row is half the price and every label stays on one line at 13px with a 17px amount.
    The bar is a picture: give the wrapper `role="img"` and an `aria-label` that says the same thing in a sentence, and say "about" wherever a monthly amount is rounded.
    Add `.card` when it stands alone; leave it off inside a panel.''')

# ---------------------------------------------------------------- calculator
new('calc', 'Calculator', '''
    The consulting page's calculator. Its styles are already written, in `/assets/css/pages/consulting.css`: copy this markup, keep every id, and do not restyle it.
    Inputs on the left: four `fieldset.calc-group` groups, each with a `legend.label` and two `.field`s. A number field with a unit is wrapped in `.field-unit`; the unit `span` goes before the input for $ and after it for %.
    Keep `type="number"`, `inputmode`, `min`, `max`, `step` and each default `value` exactly as they are: the results printed in the HTML are what those defaults compute, and `calculator.js` rewrites them as the visitor types.
    Results on the right as a `.receipt` with `aria-live="polite"`: `#r-month` is the total at price size; the disclaimer is a `.note` directly under it and never moves; `#r-year` and `#r-jobs` are the line under that; the four results are dot-leader lines; `#r-payback` is the note line; then one button. From 980px the receipt stays in view while the inputs scroll.
    The calculator sits on a plain `.panel` in a paper section. It never sits on blue: the bundle is the consulting page's one blue panel.''', '''
<form class="calc panel" id="growth-calc" novalidate onsubmit="return false">
  <div class="calc-inputs">
    <fieldset class="calc-group">
      <legend class="label">Your business</legend>
      <div class="field">
        <label for="c-job">Average value of a new job or customer ($)</label>
        <div class="field-unit"><span aria-hidden="true">$</span><input type="number" id="c-job" inputmode="decimal" min="0" step="1" value="400"></div>
      </div>
      <div class="field">
        <label for="c-rate">What an hour of your time is worth ($)</label>
        <div class="field-unit"><span aria-hidden="true">$</span><input type="number" id="c-rate" inputmode="decimal" min="0" step="1" value="50"></div>
      </div>
    </fieldset>
    <fieldset class="calc-group">
      <legend class="label">Missed calls</legend>
      <div class="field">
        <label for="c-calls">Calls you miss in a typical week</label>
        <input type="number" id="c-calls" inputmode="decimal" min="0" step="1" value="5">
      </div>
      <div class="field">
        <label for="c-callwin">Share of those callers an instant text would win back (%)</label>
        <div class="field-unit"><input type="number" id="c-callwin" inputmode="decimal" min="0" max="100" step="1" value="20"><span aria-hidden="true">%</span></div>
      </div>
    </fieldset>
    <fieldset class="calc-group">
      <legend class="label">Follow-up</legend>
      <div class="field">
        <label for="c-quotes">Quotes or enquiries that go cold each month</label>
        <input type="number" id="c-quotes" inputmode="decimal" min="0" step="1" value="4">
      </div>
      <div class="field">
        <label for="c-quotewin">Share of those a timely follow-up would win (%)</label>
        <div class="field-unit"><input type="number" id="c-quotewin" inputmode="decimal" min="0" max="100" step="1" value="25"><span aria-hidden="true">%</span></div>
      </div>
    </fieldset>
    <fieldset class="calc-group">
      <legend class="label">Your time</legend>
      <div class="field">
        <label for="c-hours">Hours a week on callbacks, booking, chasing, email and invoices</label>
        <input type="number" id="c-hours" inputmode="decimal" min="0" step="0.5" value="5">
      </div>
      <div class="field">
        <label for="c-auto">Share of that time automation takes over (%)</label>
        <div class="field-unit"><input type="number" id="c-auto" inputmode="decimal" min="0" max="100" step="1" value="50"><span aria-hidden="true">%</span></div>
      </div>
    </fieldset>
  </div>

  <div class="receipt" aria-live="polite">
    <p class="receipt-head"><span>Your estimate</span><span>Your numbers</span></p>
    <p class="receipt-total"><span>Estimated extra revenue</span><b><span id="r-month">$2,133</span><small>/month</small></b></p>
    <p class="note"><span class="flag">Estimate</span>An estimate from the numbers you enter, not a promise or a guarantee of results. Real results depend on your market, your prices and how quickly you answer the leads it brings in. Software and texting fees are paid to the provider and are extra.</p>
    <p class="receipt-note"><span id="r-year">$25,600</span> a year, from about <span id="r-jobs">5.3</span> extra jobs a month</p>
    <ul class="receipt-lines">
      <li><span>From missed calls won back</span><span class="dots" aria-hidden="true"></span><b id="r-calls">$1,733/mo</b></li>
      <li><span>From quotes followed up</span><span class="dots" aria-hidden="true"></span><b id="r-quotes">$400/mo</b></li>
      <li><span>Time back</span><span class="dots" aria-hidden="true"></span><b id="r-hours">11 hours/mo</b></li>
      <li><span>Value of that time</span><span class="dots" aria-hidden="true"></span><b id="r-timeval">$6,500/yr</b></li>
    </ul>
    <p class="receipt-note" id="r-payback">At these numbers, the $750 missed-call setup would pay for itself in about 2 weeks.</p>
    <a class="btn btn-primary btn-block" href="/contact/?package=audit">Check my real numbers in a Growth Audit</a>
  </div>
</form>''', scope='consulting')

# ---------------------------------------------------------------- steps and ticket
use('ticket', '''
    `.steps` is the numbered process: a brick numeral, a title, a sentence or two. Use it on its own for any ordered process (process, consulting, contact, `/start/`). The numeral lines up with the first line of the title, and the list is capped at 46rem: put it beside its heading in a `.split`.
    Wrap it in `.ticket` to make the job ticket (home and process pages). On desktop the ticket prints a small brick tick beside each step; they are printed marks, not checkboxes, and nothing on the ticket is pressable.
    A `.stamp` inside the ticket pins itself to the bottom right corner; it counts as the page's one stamp.''')
C['ticket']['html'] = '''<ol class="steps">
  <li>
    <span class="steps-no" aria-hidden="true">01</span>
    <div><h3>Free check</h3>
    <p>We look at your website, Google profile and reviews, and email you the top three fixes.</p></div>
  </li>
  <li>
    <span class="steps-no" aria-hidden="true">02</span>
    <div><h3>Growth Audit</h3>
    <p>A 60-minute session and a written plan, ranked by impact, with a fixed price on each step.</p></div>
  </li>
  <li>
    <span class="steps-no" aria-hidden="true">03</span>
    <div><h3>Setup</h3>
    <p>We build what you choose on your own accounts and test it with you. Most setups are live within 2 weeks.</p></div>
  </li>
</ol>

''' + C['ticket']['html']

# ---------------------------------------------------------------- cards and booking box
C['cards']['title'] = 'Appointment card, business card, booking box'
use('cards', '''
    The appointment card states the terms of the free call as a list. It is decorative (`aria-hidden`) because the paragraph beside it says the same; it always carries `.on-paper` so it stays cream at night.
    The business card holds the founder's real contact details. Both sit straight unless one of them is the page's single `.tilt`.
    The booking box on `/contact/` is a plain `.card.stack` with the class `booking-only` and the `hidden` attribute: `main.js` shows it when a booking link is set, so it never shows a dead button.''')
C['cards']['html'] += '''

<div class="card stack booking-only" hidden>
  <h2 class="h4">Rather talk it through first?</h2>
  <p>Skip the form and pick a time.</p>
  <a class="btn" href="/contact/" data-booking>Book a 30-minute call</a>
</div>'''

# ---------------------------------------------------------------- figures and vignettes
use('fig', '''
    How we show automation instead of describing it. A mock on top, numbered markers on its parts, and an ordered list in the caption that explains each number.
    The markers are real text (`<b class="fig-n">1</b>`) inside the part they point at; the legend numbers itself. A marker pins to the top left corner of a `.bubble`, a calendar slot (`.cal-day i`), an enquiry row (`.leads li`) or the `.notice`; in a calendar log line (`.cal-log li`) it takes the tick's place at the start of the line.
    Honest-mock rules: the business is always "[your business]"; messages use everyday trade wording with no names, no star ratings and no figures that are not on the site; the caption ends with the service, its fixed price and "An illustration, not a real conversation." For a mock that is not a conversation, end with "…not a real booking.", "…not a real list." or "…not a real screen."
    Nothing in a mock is blue: the business's bubble is ink, the caller's is sand, a new booking is brick. Blue is for things a visitor can press.
    A link inside a bubble is `<span class="bubble-link">`. The phone is 15rem wide; set `--phone-w` on a wrapper to change it.
    `.bubble-typing` hops three times when it is seen and then rests. Add `.seq` with `style="--n:1"` (2, 3…) to make parts arrive in order when a `.reveal` parent scrolls in.''')
C['fig']['html'] += '''

<figure class="fig">
  <div class="fig-art">
    <div class="cal" role="img" aria-label="Example week on a calendar: a new online booking drops into a free slot on Thursday">
      <p class="cal-head"><b>Your calendar</b><span>This week</span></p>
      <div class="cal-grid" aria-hidden="true">
        <div class="cal-day"><span>Mon</span><i class="busy"></i><i class="busy"></i><i></i><i class="busy"></i></div>
        <div class="cal-day"><span>Tue</span><i class="busy"></i><i></i><i class="busy"></i><i class="busy"></i></div>
        <div class="cal-day"><span>Wed</span><i></i><i class="busy"></i><i class="busy"></i><i></i></div>
        <div class="cal-day cal-today"><span>Thu</span><i class="busy"></i><i class="new"><b class="fig-n">1</b>Booked online</i><i></i><i class="busy"></i></div>
        <div class="cal-day"><span>Fri</span><i class="busy"></i><i class="busy"></i><i></i><i></i></div>
      </div>
      <ul class="cal-log" aria-hidden="true">
        <li><b class="fig-n">2</b>Confirmation sent</li>
        <li>''' + TICK + '''Reminder set for the day before</li>
      </ul>
    </div>
  </div>
  <figcaption>
    <ol class="fig-legend">
      <li>A customer picks a time on your website or Google profile, day or night. It goes straight onto your calendar, with no double bookings.</li>
      <li>They get a confirmation right away and a reminder the day before.</li>
    </ol>
    <p class="fig-credit">Online booking &amp; reminders, $750 to set up. An illustration, not a real booking.</p>
  </figcaption>
</figure>'''

C['browser']['title'] = 'Browser mock, vignette, and what goes in one'
use('browser', '''
    `.browser` frames a real screenshot of a project (with `alt`, `width`, `height`), or a drawn page.
    `.vig` is the frame for a small drawn scene that shows one step; it always carries a `.flag` reading "Example" (the build tool refuses a vignette without one), and leaves room at its top for that flag. Keep what is inside generic.
    Three ready-made things go in a vignette or a figure, besides the phone thread: `.notice` (a lock-screen notification), `.cal` (a week calendar with one new booking) and `.leads` (a list of enquiries with a status pill each). Give each a `role="img"` and an `aria-label` that says what it shows, and hide its inner parts with `aria-hidden`.''')
C['browser']['html'] += '''

<div class="grid grid-3">
  <div class="vig">
    <span class="flag">Example</span>
    <div class="notice" role="img" aria-label="Example notification on your phone: a new reply from a missed caller, with their number saved">
      <p class="notice-top" aria-hidden="true">Your phone<span class="notice-when">now</span></p>
      <p class="notice-title" aria-hidden="true">New reply from a missed caller</p>
      <p class="notice-body" aria-hidden="true">“The kitchen sink is leaking under the cabinet…”</p>
      <p class="notice-meta" aria-hidden="true">''' + TICK + '''Number saved</p>
    </div>
  </div>
  <div class="vig">
    <span class="flag">Example</span>
    <div class="cal" role="img" aria-label="Example week on a calendar: a new online booking drops into a free slot on Thursday">
      <p class="cal-head"><b>Your calendar</b><span>This week</span></p>
      <div class="cal-grid" aria-hidden="true">
        <div class="cal-day"><span>Mon</span><i class="busy"></i><i class="busy"></i><i></i><i class="busy"></i></div>
        <div class="cal-day"><span>Tue</span><i class="busy"></i><i></i><i class="busy"></i><i class="busy"></i></div>
        <div class="cal-day"><span>Wed</span><i></i><i class="busy"></i><i class="busy"></i><i></i></div>
        <div class="cal-day cal-today"><span>Thu</span><i class="busy"></i><i class="new">Booked online</i><i></i><i class="busy"></i></div>
        <div class="cal-day"><span>Fri</span><i class="busy"></i><i class="busy"></i><i></i><i></i></div>
      </div>
      <ul class="cal-log" aria-hidden="true">
        <li>''' + TICK + '''Confirmation sent</li>
        <li>''' + TICK + '''Reminder set for the day before</li>
      </ul>
    </div>
  </div>
  <div class="vig">
    <span class="flag">Example</span>
    <div class="leads" role="img" aria-label="Example list of enquiries from a website form, a missed call and Google, each showing whether a follow-up has gone out">
      <p class="cal-head"><b>Enquiries</b><span>One list</span></p>
      <ul aria-hidden="true">
        <li><span class="lead-src">Website form</span><span class="lead-what">New roof estimate</span><span class="pill pill-new">New</span></li>
        <li><span class="lead-src">Missed call</span><span class="lead-what">Leaking kitchen sink</span><span class="pill">Quote sent</span></li>
        <li><span class="lead-src">Google</span><span class="lead-what">Fence repair quote</span><span class="pill pill-go">Follow-up sent · 2 days</span></li>
      </ul>
    </div>
  </div>
</div>'''

# ---------------------------------------------------------------- scene, work, faq, forms, band, 404
use('scene', '''
    The shop front belongs to the home page hero. It may be reused small on `/start/` (in the page head's aside, as shown) and on the 404 page (`scene-notfound`, where the sign reads PAGE NOT FOUND, inside the 404 block). No other page gets a scene, and no new scenes are drawn: the build tool refuses a scene marker anywhere else.
    It is generated by `tools/art` from the marker shown, and turns from day to night with the theme on its own.''')
C['scene']['html'] = '''<div class="page-head-aside">
  <!-- art:scene-street --><!-- /art:scene-street -->
</div>'''

use('work', '''
    `.print` is a project as a print in a cream mat: the whole print is one link to the live site (`target="_blank" rel="noopener"`).
    `.case` is the full row for the work page: the print (or a `.browser`) beside the write-up and a short `dl` of facts. Add `.case-flip` to every second row to put the picture on the right.
    In a case row the project's name is the `h2` of the write-up; the name inside the print is a `<p class="h3">`, so the outline does not read each name twice or skip a level. On the home page, where three prints stand alone under an `h2`, the name in the print is an `<h3>`.
    Only the three real projects. Describe what was built; never claim a result.''')
sub('work', 'html', '<div class="print-name"><h3>Smilys Softwash</h3>', '<div class="print-name"><p class="h3">Smilys Softwash</p>')

use('faq', '''
    Plain `details` and `summary`, so it opens without any script. Each question is a 56px target with a visible focus ring; it turns blue under the pointer and the plus turns when open.
    FAQ answers keep their wording exactly: they mirror the structured data in the page head.''')

use('forms', '''
    Label above, 52px field, 17px text. Every field has a real `<label for>`. Help text is `.help`; the error line is `<p class="error" id="FIELD-error" role="alert">` and the field points at it with `aria-describedby`.
    `main.js` adds `.invalid` and `aria-invalid="true"` to a bad field and writes the message into its error line. The error is a sentence that says what to fix, in bold brick, and the field's outline thickens and stays brick while it has focus.
    A field's outline darkens under the pointer and shows a 3px ring on focus; a `disabled` field is dimmed.
    A checkbox group is a `fieldset.field` with a `legend` and `.chips`; each chip is a `label.chip` holding the checkbox and a `span`. `.field-row` sets two fields side by side from 600px.
    The status line is `.form-status`; `main.js` adds `.ok` or `.error`. The captcha sits in `.captcha-wrap`, and the spam trap keeps its class `hp` (it is moved off screen). On `/contact/` keep the form `action`, the hidden inputs, every `name`, the option values, the checkbox values and all ids exactly as they are.
    Forms sit on paper or on a card, never on blue.''')

use('cta', '''
    The last section of a page before the footer: one sentence, one paragraph, the booking button and the enquiry button, with the appointment card beside them from 980px.
    Always `class="cta-band on-blue"`. Its scalloped top edge rises over the section above, whatever colour that is, and its foot runs under the footer skyline.
    Legal pages, checkout and the 404 page do not get one.''')
C['cta']['wrap'] = 'full'

C['notfound']['scope'] = 'notfound'
use('notfound', '''
    The whole content of `404.html`: the street scene with its PAGE NOT FOUND sign, the big brick 404, the page's one `h1`, one sentence, two buttons.
    Its few rules are already written, in `/assets/css/pages/notfound.css`. The 404 page loads no script, so nothing in it may need one: no `reveal`, no `seq` (the build tool refuses them there).''')
C['notfound']['html'] = textwrap.dedent(re.search(r'<main id="main">\n(.*)</main>', (R / 'pages/notfound/main.html').read_text(), re.S).group(1)).strip('\n')

# ---------------------------------------------------------------- reference inner page
new('reference', 'Reference inner page', '''
    How the parts compose. This is the skeleton of an inner page: the page head, the contents list, a split section on paper, a sand section, the closing band.
    The finished reference is `/pricing/`: it is built from shared parts only. Open it at 390 and 1440 in both themes before you design (screenshots in `$R/shots/reference/`), and match its rhythm, heading sizes and density.
    The home page is **not** a model until its own pass is done: its hero, its three tilted prints and its length are being reworked.''', '''
<section class="page-head">
  <div class="container">
    <p class="eyebrow">Consulting &amp; automation</p>
    <h1><span class="l">More customers,</span> <span class="l">less busywork</span></h1>
    <p class="lede">A website is one piece. We also set up the systems behind it: Google reviews, missed-call text-back, online booking and automatic follow-up. Fixed prices, like everything else we do.</p>
    <div class="btn-row">
      <a class="btn btn-primary btn-lg" href="/contact/?package=audit">Book a Growth Audit, $350</a>
      <a class="btn btn-lg" href="/contact/" data-booking>Book a free 30-minute call</a>
    </div>
    <a class="price-strip" href="#ref-setups">
      <span class="price-strip-label">Setups</span>
      <span class="price-strip-nums"><b>$500</b><b>$750</b><b>$1,500</b></span>
      <span class="price-strip-note">Fixed, published prices</span>
    </a>
  </div>
</section>

<section class="section section-first">
  <div class="container">
    <nav class="toc" aria-labelledby="ref-toc">
      <p class="label" id="ref-toc">On this page</p>
      <ol>
        <li><a href="#ref-setups"><span class="toc-name">One-time setups</span><span class="dots" aria-hidden="true"></span><span class="toc-price">$500, $750 or $1,500</span></a></li>
        <li><a href="#ref-steps"><span class="toc-name">How we work together</span><span class="dots" aria-hidden="true"></span><span class="toc-price">Four steps</span></a></li>
      </ol>
    </nav>
  </div>
</section>

<section class="section" id="ref-setups">
  <div class="container split">
    <header class="section-head">
      <p class="eyebrow">What we offer</p>
      <h2 class="h3">Consulting and setup, at fixed prices</h2>
      <p class="section-sub">Start with the free check or the Growth Audit, then pick only the pieces your business needs.</p>
    </header>
    <ul class="pricelist">
      <li>
        <div class="pl-row"><h3 class="pl-name">Google profile &amp; reviews</h3><span class="dots" aria-hidden="true"></span><span class="pl-price">$500</span></div>
        <p>Profile completed, listings made consistent, review link, QR code and reply templates.</p>
      </li>
      <li>
        <div class="pl-row"><h3 class="pl-name">Missed-call text-back</h3><span class="dots" aria-hidden="true"></span><span class="pl-price">$750</span></div>
        <p>Every missed call gets a text back from your business number within a minute.</p>
      </li>
      <li>
        <div class="pl-row"><h3 class="pl-name">Lead follow-up system</h3><span class="dots" aria-hidden="true"></span><span class="pl-price">$1,500</span></div>
        <p>Every enquiry in one list, automatic follow-ups on quiet quotes, review requests after each job.</p>
      </li>
    </ul>
  </div>
</section>

<section class="section section-sand" id="ref-steps">
  <div class="container split">
    <header class="section-head">
      <p class="eyebrow">How we work together</p>
      <h2 class="h3">Four steps, no surprises</h2>
    </header>
    <ol class="steps">
      <li>
        <span class="steps-no" aria-hidden="true">01</span>
        <div><h3>Free check</h3>
        <p>We look at your website, Google profile and reviews, and email you the top three fixes.</p></div>
      </li>
      <li>
        <span class="steps-no" aria-hidden="true">02</span>
        <div><h3>Growth Audit</h3>
        <p>A 60-minute session and a written plan, ranked by impact, with a fixed price on each step.</p></div>
      </li>
    </ol>
  </div>
</section>

''' + C['cta']['html'], wrap='full', doc='''<main id="main">
  <section class="page-head">            <!-- eyebrow, h1, lede, .btn-row, .price-strip -->
    <div class="container"> ... </div>
  </section>
  <section class="section section-first"> <!-- the "On this page" list, then the first block -->
    <div class="container"> <nav class="toc"> ... </nav> ... </div>
  </section>
  <section class="section" id="...">      <!-- paper: a .split, its heading beside a price list -->
    <div class="container split"> <header class="section-head"> ... </header> <ul class="pricelist"> ... </ul> </div>
  </section>
  <section class="section section-sand" id="..."> <!-- sand: a different structure from the band before -->
    <div class="container split"> <header class="section-head"> ... </header> <ol class="steps"> ... </ol> </div>
  </section>
  <section class="cta-band on-blue"> ... </section>
</main>''')

ORDER = ['type', 'page-head', 'section-head', 'buttons', 'tones', 'on-blue-all', 'small-parts', 'stamp', 'layout', 'panel', 'points', 'prose', 'toc', 'board', 'pricelist',
         'spec', 'table', 'ledger', 'receipt', 'payplan', 'calc', 'ticket', 'cards', 'fig', 'browser', 'scene', 'work', 'faq', 'forms', 'cta', 'notfound', 'reference']
assert set(ORDER) == set(C), set(C) ^ set(ORDER)

out = ['"""Every shared component, once: its canonical markup and when to use it.',
       '',
       'gallery/build.py turns this list into the gallery page (so every snippet is',
       'looked at in both themes) and into the component chapter of DESIGN.md (so the',
       'handbook can never drift from what was tested).',
       '',
       "Each entry: id, title, use (plain sentences), html, and optionally",
       "wrap='full' (the specimen brings its own sections and containers) or",
       "scope='<slug>' (its styles are in that page's stylesheet, so the gallery wraps",
       "it in an element with that data-page), doc (what the handbook prints in place",
       "of html: a shorter outline, or '' for no snippet).",
       '',
       'Written by work/make_components.py in the second pass; edit this file from now on.',
       '"""',
       '',
       'COMPONENTS = [']
for cid in ORDER:
    c = C[cid]
    for f in ('use', 'html'):
        assert "'''" not in c[f] and '\\' not in c[f], (cid, f)
    extra = ''.join(f', {k}={c[k]!r}' for k in ('wrap', 'scope') if c.get(k))
    doc = f",\ndoc='''{c['doc']}'''" if 'doc' in c else ''
    out.append(f"dict(id={c['id']!r}, title={c['title']!r}{extra}, use='''{c['use']}''',\nhtml='''{c['html']}'''{doc}),\n")
out.append(']')
(R / 'gallery/components.py').write_text('\n'.join(out) + '\n')
print('wrote gallery/components.py:', len(ORDER), 'components')
