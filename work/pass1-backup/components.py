"""Every shared component, once: its canonical markup and when to use it.

gallery/build.py turns this list into the gallery page (so every snippet is
looked at in both themes) and into the component chapter of DESIGN.md (so the
handbook can never drift from what was tested).

Each entry: id, title, use (plain sentences), html, and optionally
wrap ('sand' puts it on a sand band, 'bare' gives it the full width).
"""

ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>'
PHONE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>'
TICK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
OUT = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>'
PIN = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
MAIL = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>'
CLOCK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'
TAGI = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5Z"/><circle cx="8" cy="8" r="1.5"/></svg>'
KEY = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16 7l2.5 2.5M13.5 9.5 15 11"/></svg>'
LOOP = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M20 4v4.5h-4.5M4 20v-4.5h4.5"/></svg>'
MISSED = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/><path d="m15 4 5 5m0-5-5 5"/></svg>'

COMPONENTS = [
dict(id='type', title='Headings, eyebrow, lede, fine print', use='''
One `<h1>` a page. Wrap each idea of the headline in `<span class="l">` so it sits on its own line from 600px.
`.mark` is the brush underline: at most one a page, on the two or three words that matter.
`.eyebrow` goes above a heading and is brick ("notice this"). `.lede` is the one intro paragraph under an `h1`.
`.fine` is small print in 15px; it is never smaller. `.label` is a small uppercase caption.
A card title under an `h1` is `<h2 class="h3">`: `h2` for the outline, sized like an `h3`. Never skip a level.''',
html='''<p class="eyebrow">Pricing</p>
<h1><span class="l">Fixed prices,</span> <span class="l"><span class="mark">published</span> up front</span></h1>
<p class="lede">Every price here is fixed, for websites, consulting and automation alike. What you see is what you pay, confirmed in writing before any work begins.</p>
<h2>Systems that win customers and save time</h2>
<h3>Missed-call text-back</h3>
<h4>Growth Audit &amp; action plan</h4>
<p>Body copy is 17px Figtree with a line height of 1.6. <strong>Strong text</strong> turns ink. <a href="/pricing/">Links are blue and underlined</a>.</p>
<p class="label">A small label</p>
<p class="fine">Fine print is 15px, never smaller: an estimate, not a guarantee.</p>'''),

dict(id='section-head', title='Section and section header', use='''
Every band of a page is a `<section class="section">` holding a `.container`. Alternate plain paper with `.section-sand`; never put two sand bands together.
`.section-tight` is a shorter band. `.section-first` is the first band under a `.page-head`.
The header is left aligned: eyebrow, `h2`, optional `.section-sub`. `.section-head-split` puts the title left and the intro right from 980px.
`.section-head-row` is the compact one-line form above a dense grid. `.section-more` holds the link that closes a section.
Inner pages open with `<section class="page-head">` (eyebrow, `h1`, lede) instead of a hero.''',
html='''<header class="section-head">
  <p class="eyebrow">How automation works</p>
  <h2>What happens when a customer calls and you can't pick up</h2>
  <p class="section-sub">Follow one call from the missed ring to the review. Each step runs on its own, on accounts in your name.</p>
</header>

<header class="section-head section-head-split">
  <div>
    <p class="eyebrow">Selected work</p>
    <h2>Recent projects</h2>
  </div>
  <p class="section-sub">Three live sites. Visit them and judge for yourself.</p>
</header>

<header class="section-head section-head-row">
  <p class="eyebrow">Websites</p>
  <h2 class="h3">Four packages. Pick the one that fits.</h2>
</header>
<p class="section-more"><a class="more-link" href="/services/">All services''' + ARROW + '''</a></p>'''),

dict(id='buttons', title='Buttons and links', use='''
Blue means pressable, so one `.btn-primary` per view: the thing we most want pressed. Plain `.btn` is the secondary button. `.btn-quiet` is a text button for the third choice.
`.btn-lg` (56px) for hero and closing band, default 52px, `.btn-sm` (44px) for the header and tight rows. `.btn-block` fills its column.
Put two or more buttons in `.btn-row`: stacked full width on a phone, in a row from 600px.
An icon is an inline `<svg class="ico">` before the words. The call button is always a real `tel:` link with the number or the word Call as text.
A booking button carries `data-booking`; `main.js` points it at the calendar and opens a new tab. Its `href` stays `/contact/` for when scripts are off.
`.more-link` is the arrow link that ends a section.''',
html='''<div class="btn-row">
  <a class="btn btn-primary btn-lg" href="/contact/" data-booking>Book a free 30-minute call</a>
  <a class="btn btn-lg" href="#how">See how it works</a>
</div>
<div class="btn-row">
  <a class="btn btn-primary" href="/contact/?package=audit">Book a Growth Audit, $350</a>
  <a class="btn" href="tel:+12252550837">''' + PHONE + '''Call (225) 255-0837</a>
  <a class="btn btn-quiet" href="/contact/?package=starter">Questions first? Send an enquiry</a>
</div>
<div class="btn-row">
  <a class="btn btn-primary btn-sm" href="/contact/">Get a quote</a>
  <a class="btn btn-sm" href="/pricing/">Request plan</a>
  <button class="btn btn-primary" type="button" disabled>Sending…</button>
</div>
<p><a class="more-link" href="/consulting/">How each automation works, step by step''' + ARROW + '''</a></p>'''),

dict(id='tones', title='Tone scopes: on blue, on ink, on paper', use='''
A tone scope re-points the colour tokens for everything inside it, so the same classes work there with no extra rules.
`.on-blue` is painted-sign blue: text turns cream, eyebrows and prices turn gold, `.btn-primary` turns cream and plain `.btn` becomes a cream outline. The focus ring turns gold.
`.on-ink` is the footer and top strip. `.on-paper` is a printed card that stays cream paper at night (the appointment card).
Gold only ever appears inside `.on-blue` or `.on-ink`. Use one blue panel and one closing band a page at most.''',
html='''<div class="card stack on-blue">
  <p class="eyebrow">On blue</p>
  <h3>Still deciding? Book the free call.</h3>
  <p>Thirty minutes, no pitch. <a href="/pricing/">See the prices</a> first if you like.</p>
  <div class="btn-row">
    <a class="btn btn-primary" href="/contact/" data-booking>Book a discovery call</a>
    <a class="btn" href="/contact/">Send an enquiry</a>
  </div>
</div>

<div class="grid grid-2">
  <div class="card stack on-ink">
    <p class="eyebrow">On ink</p>
    <h3>The footer and the top strip</h3>
    <p>Based in Baton Rouge, Louisiana. <a href="tel:+12252550837">(225) 255-0837</a></p>
  </div>
  <div class="card stack on-paper">
    <p class="eyebrow">On paper</p>
    <h3>A printed card</h3>
    <p>Stays cream paper after dark. <a href="/pricing/">Links stay blue</a>.</p>
  </div>
</div>'''),

dict(id='small-parts', title='Ticks, tags, pills, notes', use='''
`.ticks` is the tick list for what is included. `.tag` is a price tag: use it for a price that sits beside a title.
`.pill` is a small status (`.pill-new` brick, `.pill-go` blue). `.pills` is a row of plain chips, used for the towns.
`.flag` marks a mock as an example. `.popular` is the one "Most popular" marker; it belongs to the Business package only.
`.note` is the qualifier that sits right beside a number: example, estimate, not a guarantee. Start it with a `.flag`. Never move it away from the figure it qualifies.''',
html='''<ul class="ticks">
  <li>Custom design, built for you</li>
  <li>Copywriting support on Business and Commerce</li>
  <li>Built mobile-first</li>
</ul>

<p class="tag">$750 or $1,500 per setup</p>

<p class="cluster"><span class="pill">Quote sent</span> <span class="pill pill-new">New</span> <span class="pill pill-go">Follow-up sent · 2 days</span> <span class="flag">Example</span> <span class="popular">Most popular</span></p>

<ul class="pills" aria-label="Towns where we meet in person">
  <li>Baton Rouge</li><li>Gonzales</li><li>Prairieville</li><li>Denham Springs</li><li>Zachary</li><li>Central</li><li>Baker</li>
</ul>

<p class="note"><span class="flag">Example</span>These are example numbers to show the arithmetic, not a measurement of your business. An estimate, not a guarantee.</p>'''),

dict(id='stamp', title='Stamp and seal', use='''
One stamp a page, counting the seal. Both are decorative (`aria-hidden`): the same words are always in the page text.
`.stamp` is a rubber stamp for two or three words. The seal is drawn by `tools/art` from the marker shown; set its size with `--seal` on a wrapper in your page stylesheet.
One tilted object a page as well: add `.tilt` to a single card (business card, print or receipt). Everything else sits straight.''',
html='''<div class="cluster">
  <p class="stamp" aria-hidden="true">You own<br>everything</p>
  <!-- art:seal --><!-- /art:seal -->
</div>'''),

dict(id='layout', title='Card, grid, stack, cluster, split', use='''
`.card` is the plain raised surface. Reach for it only when no shop object (ticket, receipt, sheet, board) fits, and never build a wall of identical cards.
`.grid` with `.grid-2`, `.grid-3` or `.grid-4` lays children out in equal columns (one column on a phone; `.grid-4` is two columns from 760px and four from 1100px).
`.stack` spaces its children evenly top to bottom; set `--stack-gap` in your page stylesheet to change the step.
`.cluster` is a wrapping row of small things. `.split` is the two-column section layout from 980px (4 to 7); add `.split-even` for halves and `.split-sticky` to pin the first column while the second scrolls.''',
html='''<div class="grid grid-3">
  <article class="card stack">
    <h3>Website design &amp; build</h3>
    <p class="tag">$1,000, $2,000 or $4,000</p>
    <p>A custom-designed marketing site built from scratch.</p>
  </article>
  <article class="card stack">
    <h3>Automation</h3>
    <p class="tag">$750 or $1,500 per setup</p>
    <p>Missed calls get a text back, customers book themselves, quotes follow up on their own.</p>
  </article>
  <article class="card stack">
    <h3>Growth consulting</h3>
    <p class="tag">$350 audit · $500 or $1,000/mo</p>
    <p>A clear plan for getting more customers online.</p>
  </article>
</div>'''),

dict(id='prose', title='Prose block', use='''
For long text: privacy, terms, the About page. It holds the line to about 65 characters and spaces headings, paragraphs and lists.
Inside `.prose`, `h2` is sized like an `h3`. Use it inside `.container-text` (a 46rem column) on legal pages. Legal wording is never edited.''',
html='''<div class="prose">
  <h2>Payment</h2>
  <p>Standard is 50% to start and 50% at launch. Payment plans are available on all projects: 50% up front, then the rest in up to 3 equal monthly payments, the first due one month after the deposit.</p>
  <ul>
    <li>Pay by card or ACH bank transfer through Stripe.</li>
    <li>Or by check on request.</li>
  </ul>
  <h3>Care plans</h3>
  <p>No long-term contract or minimum term. Cancel or change with <a href="/terms/">10 days' written notice</a>, no fee.</p>
</div>'''),

dict(id='toc', title='"On this page" contents list', use='''
At the top of a long commercial page (pricing, services, consulting). Each entry can show that section's prices on the right, joined by a dotted leader from 600px; on a phone the prices sit under the name.
List fixed prices only: never a range, never "from". The title is a plain `.label`.
Pages off the menu (checkout, city pages) that need a way back use a `.btn-quiet` link: `<a class="btn btn-quiet" href="/pricing/">Back to pricing</a>`.''',
html='''<nav class="toc" aria-labelledby="toc-title">
  <p class="label" id="toc-title">On this page</p>
  <ol>
    <li><a href="#pricing"><span class="toc-name">Website packages</span><span class="dots" aria-hidden="true"></span><span class="toc-price">$1,000 · $2,000 · $4,000 · $8,000</span></a></li>
    <li><a href="#addons"><span class="toc-name">Add-ons</span><span class="dots" aria-hidden="true"></span><span class="toc-price">$750 or $1,500</span></a></li>
    <li><a href="#care"><span class="toc-name">Care plans</span><span class="dots" aria-hidden="true"></span><span class="toc-price">$125, $300, $600 or $1,000 a month</span></a></li>
    <li><a href="#payment"><span class="toc-name">How you pay</span><span class="dots" aria-hidden="true"></span><span class="toc-price">50% to start, 50% at launch</span></a></li>
  </ol>
</nav>'''),

dict(id='board', title='Price board', use='''
The four website prices in gold leaf on painted blue. Each tier is one link. Used on the home page, `/start/` and the city pages; one board a page.
Always `class="board on-blue"`. The button inside is `.btn-primary` (it turns cream on blue).''',
html='''<div class="board on-blue">
  <header class="board-head">
    <div>
      <p class="eyebrow">Pricing</p>
      <h2>Fixed prices, published up front</h2>
    </div>
    <p>What you see is what you pay.</p>
  </header>
  <ul class="board-tiers">
    <li><a class="tier" href="/contact/?package=onepage">
      <span class="tier-name">One-page</span>
      <span class="tier-amt">$1,000</span>
      <span class="tier-plan">Or $500 down, then about $167/mo for 3 months</span>
      <span class="tier-note">One polished page: who you are, what you offer and how to reach you. Live in as little as 7 days.</span>
    </a></li>
    <li><a class="tier" href="/checkout/?plan=starter-deposit">
      <span class="tier-name">Starter</span>
      <span class="tier-amt">$2,000</span>
      <span class="tier-plan">Or $1,000 down, then about $333/mo for 3 months</span>
      <span class="tier-note">An information website: who you are, what you offer and how to reach you. Live in as little as 7–10 days.</span>
    </a></li>
    <li><a class="tier" href="/checkout/?plan=business-deposit">
      <span class="tier-name">Business</span>
      <span class="tier-amt">$4,000</span>
      <span class="tier-plan">Or $2,000 down, then about $667/mo for 3 months</span>
      <span class="tier-note">The full marketing site most growing businesses need. Live in 2–4 weeks.</span>
    </a></li>
    <li><a class="tier" href="/checkout/?plan=commerce-deposit">
      <span class="tier-name">Commerce</span>
      <span class="tier-amt">$8,000</span>
      <span class="tier-plan">Or $4,000 down, then about $1,333/mo for 3 months</span>
      <span class="tier-note">Sell online, with the operations side set up properly. Live in 4–6 weeks.</span>
    </a></li>
  </ul>
  <dl class="board-extras">
    <div><dt>Care plans, to keep a site running</dt><dd>$125, $300, $600 or $1,000 a month</dd></div>
    <div><dt>Automation setups</dt><dd>$750 or $1,500</dd></div>
    <div><dt>A Growth Audit</dt><dd>$350</dd></div>
  </dl>
  <p class="board-foot"><a class="btn btn-primary" href="/pricing/">Full pricing, consulting and care plans</a></p>
</div>'''),

dict(id='pricelist', title='Dot-leader price list', use='''
For any list of more than three priced things: name, dotted leader, price, one line of detail. `.pl-group` labels a group.
The name is a heading (`h3` or `h4`, whichever keeps the outline in order) with class `pl-name`. The price is always in the display face, never in a pill.''',
html='''<h3 class="pl-group">One-time setups</h3>
<ul class="pricelist">
  <li>
    <div class="pl-row"><h4 class="pl-name">Google profile &amp; reviews</h4><span class="dots" aria-hidden="true"></span><span class="pl-price">$500</span></div>
    <p>Profile completed, listings made consistent, review link, QR code and reply templates.</p>
  </li>
  <li>
    <div class="pl-row"><h4 class="pl-name">Missed-call text-back</h4><span class="dots" aria-hidden="true"></span><span class="pl-price">$750</span></div>
    <p>Every missed call gets a text back from your business number within a minute.</p>
  </li>
  <li>
    <div class="pl-row"><h4 class="pl-name">Lead follow-up system</h4><span class="dots" aria-hidden="true"></span><span class="pl-price">$1,500</span></div>
    <p>Every enquiry in one list, automatic follow-ups on quiet quotes, review requests after each job.</p>
  </li>
</ul>
<h3 class="pl-group">By the month</h3>
<ul class="pricelist">
  <li>
    <div class="pl-row"><h4 class="pl-name">Advisor plan</h4><span class="dots" aria-hidden="true"></span><span class="pl-price">$500/mo</span></div>
    <p>Monthly strategy call, Google profile managed, review replies and a monthly report.</p>
  </li>
</ul>'''),

dict(id='spec', title='Tier spec table', wrap='bare', use='''
The website packages as one ruled table, so Live in, Size, Design and After launch line up across all four.
Markup: one row per package; the header row names the columns. From 980px each row stands up as a column; below that each row is a card.
Because the layout is not `display: table`, the roles are written out: keep every `role` attribute exactly as shown.
Each value cell starts with a `.cell-label` (hidden on desktop, shown on a phone, `aria-hidden` because the column header already names it for a screen reader).
Set `style="--rows:7"` to the number of cells in a row and `--cols` to the number of packages (default 4). `.is-popular` marks one row; put the `.popular` marker in its name cell.''',
html='''<table class="spec" role="table" aria-label="Website packages compared" style="--rows:7">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" scope="col"><span class="sr-only">Package</span></th>
      <th role="columnheader" scope="col"><span class="sr-only">Price</span></th>
      <th role="columnheader" scope="col">Live in</th>
      <th role="columnheader" scope="col">Size</th>
      <th role="columnheader" scope="col">Design</th>
      <th role="columnheader" scope="col">After launch</th>
      <th role="columnheader" scope="col"><span class="sr-only">Start</span></th>
    </tr>
  </thead>
  <tbody role="rowgroup">
    <tr role="row">
      <th role="rowheader" scope="row" class="spec-name">One-page</th>
      <td role="cell" class="spec-price">$1,000 <small>Or $500 down, then about $167/mo for 3 months</small></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Live in</span>As little as 7 days</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Size</span>1 page</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Design</span>Custom design, 1 revision round</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">After launch</span>14 days support</td>
      <td role="cell" class="spec-act"><a class="btn btn-block" href="/contact/?package=onepage">Start a one-page site</a></td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row" class="spec-name">Starter</th>
      <td role="cell" class="spec-price">$2,000 <small>Or $1,000 down, then about $333/mo for 3 months</small></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Live in</span>As little as 7–10 days</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Size</span>Up to 5 pages</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Design</span>Custom design, 1 revision round</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">After launch</span>30 days support</td>
      <td role="cell" class="spec-act"><a class="btn btn-block" href="/checkout/?plan=starter-deposit">Pay 50% deposit — $1,000</a></td>
    </tr>
    <tr role="row" class="is-popular">
      <th role="rowheader" scope="row" class="spec-name">Business <span class="popular">Most popular</span></th>
      <td role="cell" class="spec-price">$4,000 <small>Or $2,000 down, then about $667/mo for 3 months</small></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Live in</span>2–4 weeks</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Size</span>Up to 10 pages</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Design</span>Up to 3 design rounds, plus a final tweaks round</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">After launch</span>90 days support</td>
      <td role="cell" class="spec-act"><a class="btn btn-primary btn-block" href="/checkout/?plan=business-deposit">Pay 50% deposit — $2,000</a></td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row" class="spec-name">Commerce</th>
      <td role="cell" class="spec-price">$8,000 <small>Or $4,000 down, then about $1,333/mo for 3 months</small></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Live in</span>4–6 weeks</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Size</span>Full store build</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Design</span>Up to 3 design rounds, plus a final tweaks round</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">After launch</span>6 months support</td>
      <td role="cell" class="spec-act"><a class="btn btn-block" href="/checkout/?plan=commerce-deposit">Pay 50% deposit — $4,000</a></td>
    </tr>
  </tbody>
</table>'''),

dict(id='table', title='Data table', use='''
`.table` is the plain ruled table. With two or three short columns it stays a real table at every width.
With more, add `.table-stack`: under 760px each row becomes a labelled entry. A stacked table needs the roles written out and a `.cell-label` at the start of each value cell, exactly as shown.
`.num` right-aligns a column of figures. Always give a table a `<caption>` (or `aria-label`).''',
html='''<table class="table table-stack" role="table">
  <caption>Care plans, by the month</caption>
  <thead role="rowgroup">
    <tr role="row"><th role="columnheader" scope="col">Plan</th><th role="columnheader" scope="col">Fits</th><th role="columnheader" scope="col">Changes</th><th role="columnheader" scope="col" class="num">A month</th></tr>
  </thead>
  <tbody role="rowgroup">
    <tr role="row">
      <th role="rowheader" scope="row">Basic</th>
      <td role="cell"><span class="cell-label" aria-hidden="true">Fits</span>One-page and Starter sites</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Changes</span>1 small change a month, made within 5 business days</td>
      <td role="cell" class="num"><span class="cell-label" aria-hidden="true">A month</span>$125</td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row">Essential</th>
      <td role="cell"><span class="cell-label" aria-hidden="true">Fits</span>Brochure and marketing sites</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Changes</span>Changes made within 4 business days, up to 2 requests a month</td>
      <td role="cell" class="num"><span class="cell-label" aria-hidden="true">A month</span>$300</td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row">Growth</th>
      <td role="cell"><span class="cell-label" aria-hidden="true">Fits</span>Sites with booking or lead flows</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Changes</span>Changes made within 2 business days, up to 5 requests a month</td>
      <td role="cell" class="num"><span class="cell-label" aria-hidden="true">A month</span>$600</td>
    </tr>
  </tbody>
</table>'''),

dict(id='ledger', title='Ledger on a time sheet, with the large figure', use='''
The example week. `.sheet` is the paper frame with a perforated top edge; `.ledger` is the table inside it.
Each row shows its arithmetic, and a single-hue bar whose length is `style="--v:.7"` on the span (the row's share of the longest row, 0 to 1). The bar cell is `aria-hidden`.
Under 600px each row becomes a small block, so the roles are written out: keep them.
`.bigfig` is the one very large number a page. The words around the number say what it is, and the `.note` that it is an example, not a measurement, sits directly under it. Never show the figure without that note.
The only numbers allowed here are the example week already on the site (30, 80, 56, 45 and 24 minutes; 235 minutes, about 4 hours; about 200 hours a year).''',
html='''<div class="split split-even">
  <aside class="bigfig">
    <p class="bigfig-num">About <b>200</b> hours a year, in this example</p>
    <p class="note"><span class="flag">Example</span>These are example numbers to show the arithmetic, not a measurement of your business. An estimate, not a guarantee.</p>
  </aside>
  <div class="sheet">
    <table class="ledger" role="table">
      <caption>An example week for a small service business</caption>
      <thead role="rowgroup">
        <tr role="row"><th role="columnheader" scope="col">Done by hand</th><th role="columnheader" scope="col">Example</th><th role="columnheader" scope="col"><span class="sr-only">Share of the week</span></th><th role="columnheader" scope="col" class="num">Time a week</th></tr>
      </thead>
      <tbody role="rowgroup">
        <tr role="row"><th role="rowheader" scope="row">Returning missed calls and voicemails</th><td role="cell">5 calls × 6 minutes</td><td role="cell" class="ledger-bar" aria-hidden="true"><span style="--v:.375"></span></td><td role="cell" class="num">30 min</td></tr>
        <tr role="row"><th role="rowheader" scope="row">Booking appointments by phone and text</th><td role="cell">10 bookings × 8 minutes</td><td role="cell" class="ledger-bar" aria-hidden="true"><span style="--v:1"></span></td><td role="cell" class="num">80 min</td></tr>
        <tr role="row"><th role="rowheader" scope="row">Chasing quotes that went quiet</th><td role="cell">8 quotes × 7 minutes</td><td role="cell" class="ledger-bar" aria-hidden="true"><span style="--v:.7"></span></td><td role="cell" class="num">56 min</td></tr>
        <tr role="row"><th role="rowheader" scope="row">Copying enquiries into a list or notebook</th><td role="cell">15 enquiries × 3 minutes</td><td role="cell" class="ledger-bar" aria-hidden="true"><span style="--v:.5625"></span></td><td role="cell" class="num">45 min</td></tr>
        <tr role="row"><th role="rowheader" scope="row">Asking for reviews</th><td role="cell">6 jobs × 4 minutes</td><td role="cell" class="ledger-bar" aria-hidden="true"><span style="--v:.3"></span></td><td role="cell" class="num">24 min</td></tr>
      </tbody>
      <tfoot role="rowgroup">
        <tr role="row"><th role="rowheader" scope="row">Total</th><td role="cell" colspan="3" class="num">235 min, about 4 hours</td></tr>
      </tfoot>
    </table>
  </div>
</div>'''),

dict(id='receipt', title='Itemised receipt and checkout summary', use='''
The Launch bundle, or any "these things together cost this" sum: lines with dotted leaders, the separate total struck through, then the final total.
Every figure on it must already be a published price. The receipt is narrow on purpose (26rem).
The checkout order summary is the same receipt with one `.receipt-total` line: the plan name in a `span`, the price in `b`. On `/checkout/` those two carry the ids the script fills (`checkout-plan-name`, `checkout-plan-price`), and the receipt itself keeps `id="checkout-plan"` and `hidden`.
Status lines that scripts write to (`#checkout-status`, `#success-status`) take class `status`; the script adds `.error`.''',
html='''<div class="cluster">
  <div class="receipt">
    <p class="receipt-head"><span>Launch bundle</span><span>Receipt</span></p>
    <ul class="receipt-lines">
      <li><span>Starter website</span><span class="dots" aria-hidden="true"></span><b>$2,000</b></li>
      <li><span>Google profile &amp; reviews</span><span class="dots" aria-hidden="true"></span><b>$500</b></li>
      <li><span>Missed-call text-back</span><span class="dots" aria-hidden="true"></span><b>$750</b></li>
    </ul>
    <p class="receipt-sum"><span>Bought separately</span><s>$3,250</s></p>
    <p class="receipt-total"><span>Launch bundle</span><b>$3,000</b></p>
    <p class="receipt-note">$1,500 down, then $500/mo for 3 months.</p>
  </div>

  <div class="receipt">
    <p class="receipt-head"><span>Your order</span><span>KnightWebstudio</span></p>
    <p class="receipt-total"><span>Starter website — 50% deposit</span><b>$1,000</b></p>
    <p class="status">Loading secure checkout…</p>
  </div>
</div>'''),

dict(id='payplan', title='Payment plan drawn to scale', use='''
Shows how a price splits up. Each segment's width is its share of the total: `style="--w:50"` for half, `--w:16.67` for a sixth.
The deposit is the dark `.payplan-dep` block. Keep the amount in `<b>` and one or two words under it.
The bar is a picture: give the wrapper `role="img"` and an `aria-label` that says the same thing in a sentence, and say "about" wherever a monthly amount is rounded.''',
html='''<figure class="payplan card" role="img" aria-label="Two ways to pay for a Starter site: half to start and half at launch, or $1,000 down and then about $333 a month for 3 months">
  <p class="label" aria-hidden="true">Standard</p>
  <div class="payplan-bar" aria-hidden="true">
    <span class="payplan-seg payplan-dep" style="--w:50"><b>50%</b>to start</span>
    <span class="payplan-seg" style="--w:50"><b>50%</b>at launch</span>
  </div>
  <p class="label" aria-hidden="true">Payment plan, shown on Starter</p>
  <div class="payplan-bar" aria-hidden="true">
    <span class="payplan-seg payplan-dep" style="--w:50"><b>$1,000</b>down</span>
    <span class="payplan-seg" style="--w:16.67"><b>$333</b>month 1</span>
    <span class="payplan-seg" style="--w:16.67"><b>$333</b>month 2</span>
    <span class="payplan-seg" style="--w:16.67"><b>$333</b>month 3</span>
  </div>
  <p class="fine" aria-hidden="true">Monthly amounts are rounded: about $333 a month.</p>
</figure>'''),

dict(id='ticket', title='Step list and job ticket', use='''
`.steps` is the numbered process: a brick numeral, a title, a sentence or two. Use it on its own for any ordered process.
Wrap it in `.ticket` to make the job ticket (home and process pages). On desktop the ticket prints a small brick tick beside each step; they are printed marks, not checkboxes, and nothing on the ticket is pressable.
A `.stamp` inside the ticket pins itself to the bottom right corner; it counts as the page's one stamp.''',
html='''<div class="ticket">
  <p class="ticket-head" aria-hidden="true"><span>Job ticket</span><span>KnightWebstudio</span></p>
  <ol class="steps">
    <li>
      <span class="steps-no" aria-hidden="true">01</span>
      <div><h3>Discovery call</h3>
      <p>A free 30-minute call about your business and what the site needs to achieve.</p></div>
    </li>
    <li>
      <span class="steps-no" aria-hidden="true">02</span>
      <div><h3>Proposal &amp; design</h3>
      <p>A fixed quote and timeline, then design concepts you sign off before any build starts.</p></div>
    </li>
    <li>
      <span class="steps-no" aria-hidden="true">03</span>
      <div><h3>Build &amp; review</h3>
      <p>Built on a private staging link you can check any time, with weekly progress notes.</p></div>
    </li>
  </ol>
  <p class="stamp" aria-hidden="true">You own<br>everything</p>
</div>'''),

dict(id='cards', title='Appointment card and business card', use='''
The appointment card states the terms of the free call as a list. It is decorative (`aria-hidden`) because the paragraph beside it says the same; it always carries `.on-paper` so it stays cream at night.
The business card holds the founder's real contact details. Both sit straight unless one of them is the page's single `.tilt`.''',
html='''<div class="cluster">
  <div class="appt on-paper" aria-hidden="true">
    <p class="appt-head"><span>Appointment card</span><span>No. 01</span></p>
    <p class="appt-title">Discovery call</p>
    <dl class="appt-lines">
      <div><dt>Cost</dt><dd>Free</dd></div>
      <div><dt>Length</dt><dd>30 minutes</dd></div>
      <div><dt>Sales pitch</dt><dd>None</dd></div>
      <div><dt>Where</dt><dd>A call, or in person</dd></div>
    </dl>
  </div>

  <div class="bizcard tilt">
    <div class="bizcard-top">
      <!-- art:crest-card --><!-- /art:crest-card -->
      <p><b>KnightWebstudio</b><span>Websites · Automation · Consulting</span></p>
    </div>
    <p class="bizcard-name">Christian Knight<span>Founder</span></p>
    <ul class="bizcard-lines">
      <li><a href="tel:+12252550837">''' + PHONE + '''(225) 255-0837</a></li>
      <li><a href="mailto:knightwebstudio1@gmail.com">''' + MAIL + '''knightwebstudio1@gmail.com</a></li>
      <li><span>''' + PIN + '''Baton Rouge, Louisiana</span></li>
    </ul>
  </div>
</div>'''),

dict(id='fig', title='Figure with a numbered legend: the phone', use='''
How we show automation instead of describing it. A mock on top, numbered markers on its parts, and an ordered list in the caption that explains each number.
The markers are real text (`<b class="fig-n">1</b>`) inside the thing they point at; the legend numbers itself.
Honest-mock rules: the business is always "[your business]"; messages use everyday trade wording with no names, no star ratings and no figures that are not on the site; the caption ends with the service, its fixed price and "An illustration, not a real conversation."
A link inside a bubble is `<span class="bubble-link">`. The phone is 15rem wide; set `--phone-w` on a wrapper to change it.
`.bubble-typing` hops three times and then rests. Add `.seq` with `style="--n:1"` (2, 3…) to make parts arrive in order when a `.reveal` parent scrolls in.''',
html='''<figure class="fig">
  <div class="fig-art">
    <div class="phone">
      <p class="phone-label">Example: what your caller sees</p>
      <div class="phone-frame">
        <div class="phone-bar">
          <span class="phone-avatar" aria-hidden="true"></span>
          <span class="phone-who">[your business]<small>Text message</small></span>
        </div>
        <ul class="thread">
          <li class="thread-note thread-missed">''' + MISSED + '''Missed call</li>
          <li class="bubble bubble-biz"><b class="fig-n">1</b>Sorry we missed your call, this is [your business]. What can we help with?</li>
          <li class="thread-note">Sent on its own, within a minute</li>
          <li class="bubble bubble-cust"><b class="fig-n">2</b>The kitchen sink is leaking under the cabinet. Can someone take a look this week?</li>
          <li class="bubble bubble-cust bubble-typing"><span class="sr-only">The caller is typing</span><i></i><i></i><i></i></li>
        </ul>
      </div>
    </div>
  </div>
  <figcaption>
    <ol class="fig-legend">
      <li>The caller gets a text from your business number within a minute.</li>
      <li>Their reply lands on your phone, so you call back knowing the job.</li>
    </ol>
    <p class="fig-credit">Missed-call text-back, $750 to set up. An illustration, not a real conversation.</p>
  </figcaption>
</figure>'''),

dict(id='browser', title='Browser mock and vignette', use='''
`.browser` frames a real screenshot of a project (with `alt`, `width`, `height`), or a drawn page.
`.vig` is the frame for a small drawn scene that shows one step; it always carries a `.flag` reading "Example". Keep what is inside generic.''',
html='''<div class="grid grid-2">
  <div class="browser">
    <div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>smilyssoftwash.com</span></div>
    <img src="/assets/img/work-smilyssoftwash.jpg" alt="Smilys Softwash — before and after of a soft-washed roof and house exterior" width="1200" height="600" loading="lazy" decoding="async">
  </div>
  <div class="vig">
    <span class="flag">Example</span>
    <ul class="thread">
      <li class="thread-note thread-done">''' + TICK + '''Job marked done</li>
      <li class="bubble bubble-biz">Thanks for choosing [your business]. If you have a minute, a Google review would mean a lot to us.</li>
      <li class="thread-note">Sent on its own</li>
    </ul>
  </div>
</div>'''),

dict(id='scene', title='The street scene', use='''
The shop front belongs to the home page hero. It may be reused small on `/start/` and the 404 page (`scene-notfound`, where the sign reads PAGE NOT FOUND). No other page gets a scene, and no new scenes are drawn.
It is generated by `tools/art` from the marker shown, and turns from day to night with the theme on its own.''',
html='''<div class="nf">
  <!-- art:scene-street --><!-- /art:scene-street -->
</div>'''),

dict(id='work', title='Project print and case row', use='''
`.print` is a project as a print in a cream mat: the whole print is one link to the live site (`target="_blank" rel="noopener"`).
`.case` is the full row for the work page: the print (or a `.browser`) beside the write-up and a short `dl` of facts. Add `.case-flip` to every second row to put the picture on the right.
Only the three real projects. Describe what was built; never claim a result.''',
html='''<article class="case">
  <a class="print" href="https://smilyssoftwash.com" target="_blank" rel="noopener">
    <div class="print-img"><img src="/assets/img/work-smilyssoftwash.jpg" alt="Smilys Softwash — before and after of a soft-washed roof and house exterior" width="1200" height="600" loading="lazy" decoding="async"></div>
    <div class="print-cap">
      <div class="print-name"><h3>Smilys Softwash</h3>''' + OUT + '''</div>
      <p class="print-kind">Exterior cleaning · Local service &amp; SEO</p>
    </div>
  </a>
  <div class="case-copy">
    <p class="eyebrow">Exterior cleaning · Local service &amp; SEO</p>
    <h2 class="h3">Smilys Softwash</h2>
    <p>“Don't replace it. Renew it.” Roof and house soft washing across Greater Baton Rouge — a service page per treatment, a before-and-after gallery, and online quote requests. Card payments are being set up.</p>
    <dl class="case-facts">
      <div><dt>Status</dt><dd>Live site · Online quotes</dd></div>
      <div><dt>Visit</dt><dd><a href="https://smilyssoftwash.com" target="_blank" rel="noopener">smilyssoftwash.com</a></dd></div>
    </dl>
  </div>
</article>'''),

dict(id='faq', title='FAQ list', use='''
Plain `details` and `summary`, so it opens without any script. Each question is a 56px target with a visible focus ring; the plus turns when open.
FAQ answers keep their wording exactly: they mirror the structured data in the page head.''',
html='''<div class="faq">
  <details class="faq-item" open>
    <summary>Do I own the website?</summary>
    <div class="faq-body"><p>Completely. The domain is registered in your name, the code and design are yours on final payment, and you can move to another provider at any time. We don't hold anything hostage.</p></div>
  </details>
  <details class="faq-item">
    <summary>How long does a website take?</summary>
    <div class="faq-body"><p>A one-page site can be live in as little as 7 days, and an information website in as little as 7–10 days. A full business site runs 2–4 weeks, and stores take 4–6. The biggest variable is how quickly content and photos come back to us — we'll tell you exactly what we need on day one.</p></div>
  </details>
</div>'''),

dict(id='forms', title='Form fields', use='''
Label above, 52px field, 17px text. Every field has a real `<label for>`. Help text is `.help`; the error line is `<p class="error" id="FIELD-error" role="alert">` and the field points at it with `aria-describedby`.
`main.js` adds `.invalid` and `aria-invalid="true"` to a bad field and writes the message into its error line; brick marks the error, and the message says what to fix. Focus shows a 3px ring.
A checkbox group is a `fieldset.field` with a `legend` and `.chips`; each chip is a `label.chip` holding the checkbox and a `span`. `.field-row` sets two fields side by side from 600px.
The status line is `.form-status`; `main.js` adds `.ok` or `.error`. The captcha sits in `.captcha-wrap`, and the spam trap keeps its class `hp` (it is moved off screen). On `/contact/` keep the form `action`, the hidden inputs, every `name`, the option values, the checkbox values and all ids exactly as they are.''',
html='''<form class="card" action="#" method="post" novalidate onsubmit="return false">
  <div class="field">
    <label for="g-name">Your name <span aria-hidden="true">*</span></label>
    <input type="text" id="g-name" name="name" autocomplete="name" required aria-describedby="g-name-error">
    <p class="error" id="g-name-error" role="alert"></p>
  </div>
  <div class="field">
    <label for="g-email">Email <span aria-hidden="true">*</span></label>
    <input class="invalid" type="email" id="g-email" name="email" value="sam@" autocomplete="email" required aria-invalid="true" aria-describedby="g-email-error">
    <p class="error" id="g-email-error" role="alert">Please enter a valid email address.</p>
  </div>
  <div class="field-row">
    <div class="field">
      <label for="g-company">Business name</label>
      <input type="text" id="g-company" name="company" autocomplete="organization" aria-describedby="g-company-help">
      <p class="help" id="g-company-help">Leave it empty if you are just starting out.</p>
    </div>
    <div class="field">
      <label for="g-package">Package</label>
      <select id="g-package" name="package">
        <option value="">Not sure yet</option>
        <option value="starter">Starter information website, $2,000</option>
        <option value="business">Business website, $4,000</option>
      </select>
    </div>
  </div>
  <fieldset class="field">
    <legend>What do you need?</legend>
    <div class="chips">
      <label class="chip"><input type="checkbox" name="services" value="New website" checked><span>New website</span></label>
      <label class="chip"><input type="checkbox" name="services" value="Automation"><span>Automation</span></label>
      <label class="chip"><input type="checkbox" name="services" value="Google reviews"><span>Google reviews</span></label>
    </div>
  </fieldset>
  <div class="field">
    <label for="g-message">Project details <span aria-hidden="true">*</span></label>
    <textarea id="g-message" name="message" rows="5" required placeholder="What does your business do, and what do you want help with?"></textarea>
  </div>
  <button class="btn btn-primary btn-block" type="submit">Send enquiry</button>
  <p class="form-status ok" role="status">Thanks — your enquiry is in. We’ll reply within one business day.</p>
  <p class="form-status error" role="status">Please fix the highlighted fields.</p>
  <p class="form-fine">We reply within one business day. Your details are never shared or sold.</p>
</form>'''),

dict(id='cta', title='Closing band', wrap='bare', use='''
The last section of a page before the footer: one sentence, one paragraph, the booking button and the enquiry button, with the appointment card beside them from 980px.
Always `class="cta-band on-blue"`. Its scalloped top edge takes the colour of the section above on its own.
Legal pages, checkout and the 404 page do not get one.''',
html='''<section class="cta-band on-blue">
  <div class="container cta-inner">
    <div class="cta-copy">
      <h2>Still deciding? Book the free call.</h2>
      <p>Thirty minutes, no pitch. You'll get a clear view of what your website and your systems need, and what it should cost — even if you do it yourself.</p>
      <div class="btn-row">
        <a class="btn btn-primary btn-lg" href="/contact/" data-booking>Book a discovery call</a>
        <a class="btn btn-lg" href="/contact/">Send an enquiry</a>
      </div>
    </div>
    <div class="appt on-paper" aria-hidden="true">
      <p class="appt-head"><span>Appointment card</span><span>No. 01</span></p>
      <p class="appt-title">Discovery call</p>
      <dl class="appt-lines">
        <div><dt>Cost</dt><dd>Free</dd></div>
        <div><dt>Length</dt><dd>30 minutes</dd></div>
        <div><dt>Sales pitch</dt><dd>None</dd></div>
        <div><dt>Where</dt><dd>A call, or in person</dd></div>
      </dl>
    </div>
  </div>
</section>'''),

dict(id='notfound', title='The 404 block', use='''
The whole content of `404.html`: the big brick 404, one `h1`, one sentence, two buttons. The street scene with its PAGE NOT FOUND sign may sit above it, small.
The 404 page loads no script, so nothing in it may need one.''',
html='''<div class="nf">
  <p class="nf-code" aria-hidden="true">404</p>
  <h2 class="h2">This page has moved on</h2>
  <p>The link is broken or the page no longer exists. Head back to the homepage, or tell us what you were looking for and we'll point you at it.</p>
  <div class="btn-row">
    <a class="btn btn-primary" href="/">Back to homepage</a>
    <a class="btn" href="/contact/">Get in touch</a>
  </div>
</div>'''),
]
