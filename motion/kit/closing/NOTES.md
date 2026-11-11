# Motion kit: the closing band and the footer

The end of every page. Hand-written for knightwebstudio.com; nothing here is copied from a library or
another site. Four small stylesheets, no script of their own, and four proposed chrome partials.

| File | What it is | Size |
| --- | --- | --- |
| `closing.css` | The closing band, three layouts (`kws-close`) | 3,485 bytes (budget 3,500) |
| `appt.css` | The appointment card with the booking button on it (`kws-appt`) | 2,218 bytes |
| `footer.css` | The footer and its slim form (`kws-foot`) | 3,103 bytes |
| `skyline.css` | The town at night that ends the footer (`kws-skyline`) | 2,849 bytes |
| `footer.inc`, `footer-start.inc`, `footer-bare.inc`, `skyline.inc` | Proposed replacements for the partials of the same names in `tools/chrome/` | 3,791, 1,185, 825, 1,840 bytes |
| `demo.html` | Every part in the site's own stylesheet, in both themes, with a client palette | `http://localhost:8730/kit/closing/demo.html` |
| `portable.html` | The four files on a page with no site stylesheet and no script, another brand | proof that the kit stands alone |
| `test/pricing-with-kit.html`, `start-with-kit.html`, `notfound-with-kit.html` | Copies of three real pages with the new band and partials in place, running the real `main.js` | proof inside the site |
| `test/` | The checks behind every number here; `sh test/run-all.sh` writes `test/results.txt` | |
| `shots/` | Screenshots that were taken and looked at (`node test/final-shots.js` retakes them) | see the end of this file |

`demo.html`, `portable.html` and the three test pages are assembled by `motion/work-closing/build_demo.py` and
`build_test_pages.py` from the partials in this folder (the same way `tools/sync_chrome.py` would), so what you
see is the partials, not a hand copy. Rebuild after editing a partial.

**No script.** Nothing in this folder needs JavaScript, so there is no `closing.js`. Each band and the footer
sky carry an empty layer marked `data-shader="band"`; the kit's `shader.js` (in `../light/`) fills it with the
moving background when it is on the page. Without it, the CSS in these files is the whole picture.

**Why four stylesheets.** The brief names `closing.css`. The band with its card comes to 5.7 KB and the footer
with its scene to 6.0 KB, over the 3.5 KB a component may weigh. The card and the scene are objects in their
own right (the card also sits on paper; the scene is what `skyline.inc` draws), so each has its own file and
every file is inside the budget. On knightwebstudio.com all four are folded into the one stylesheet.

## 1. What every part shares

**Theme contract.** No hex colours and no site tokens used bare: every colour, font, radius and shadow is a
`--kit-*` variable with this site's token as its fallback. On knightwebstudio.com nothing needs setting, as
long as the band carries `on-blue`, the footer carries `on-ink` and the card carries `on-paper` (the tone
scopes re-point the fallbacks, so both themes come free). On a client site there are no tone scopes, so set
the variables on each block: a colour block and a paper object on it are two palettes (see `portable.html`).

| Variable | Fallback on this site | Band | Card | Footer and scene |
| --- | --- | --- | --- | --- |
| `--kit-bg` | band `--board`, footer `--footer` | the block's colour; its folds are tones of it | | ground; the skyline's silhouette |
| `--kit-surface` | `--card` | second button's fill | the card | |
| `--kit-ink` | `--ink` | title, second button, phone number | title, values | links, phone number, sign-off, the name in the sky |
| `--kit-muted` | `--ink-2` (`--ink-3` for places without a page) | the sentence | labels | body text |
| `--kit-line` | `--line-2`, footer `--line` | | dotted leaders | hairlines |
| `--kit-accent` | `--blue` | main button's fill | booking button's fill | focus ring (`--focus` on this site) |
| `--kit-accent-ink` | `--on-blue` | main button's text | booking button's text | |
| `--kit-notice` | `--brick` | | the first value ("Free") | |
| `--kit-gilt` | `--gold` | kicker, the stroke under two words, the line under the number | | column titles, lit windows, stars, the warm horizon |
| `--kit-radius` | `--r-md` (14px) | buttons | card and its button | "Start a project" |
| `--kit-font-display` | `--font-display` | title, phone number | title | name, phone number, sign-off, the name in the sky |
| `--kit-font-body` | `--font-text` | everything else | everything else | everything else |
| `--kit-shadow` | `--shadow-3` | | the card | |
| `--kit-shader-1` | `--board` | | | the blue hour in the footer sky |

Not used here: `--kit-shader-2`, `--kit-shader-3` (the band's folds come from its own ground, as `shader.js`
does it). One extra knob, for the scene only: `--kws-fit` (section 5).

Spacing and type follow the site's scale where it is fluid (`--sec`, `--gutter`, `--maxw`, `--gap-lg`,
`--fs-h2`, `--fs-h3`, `--fs-title`, `--fs-lede`, `--fs-sm`, `--fs-body`, `--s-5` to `--s-7`), each with a plain
fallback. The kit assumes what any site's base layer gives: `box-sizing: border-box`.

**Colour rule.** On this site: cream on blue is pressable; gold is only on blue and on the footer (kicker,
the stroke, the line under the number, column titles, windows, stars); on the cream card the button is the
site's blue and "Free" is brick. Nothing decorative looks pressable.

**Motion.** The bands do not move. The one moving thing in these files is the name in the footer sky, which
rises 40% of its height as the scene scrolls into view: scroll-linked (it goes exactly as far as the finger
does, and stops when the finger stops), transform only, and complete at the end of the page. It is still, and
in its final place, where the browser has no scroll-linked animation (Firefox today), under
`prefers-reduced-motion`, and when `html[data-motion="off"]` (the kit's pause button, which the footer
partials carry). The moving backgrounds belong to `shader.js` and obey the same switch.

**Script off / reduced motion / paused.**

| State | Band | Card | Footer | Scene |
| --- | --- | --- | --- | --- |
| Script off | Complete. Booking button goes to `/contact/` | Complete | Complete. No pause button (it carries `hidden`) | Still sky with stars, name in place |
| Reduced motion | Still folds (or one still shader frame) | | | Name in place, no animation |
| Motion paused | Still | | Pause button shows "Play" | Name in place, no animation |

**Keyboard and screen readers.** Everything is a real link in reading order; there is nothing to operate
but links and the pause button. Measured on the pricing page: 25 stops from the band to the end of the
page, each scrolled into view with a 3px ring (gold on blue and on the footer, blue on the card). The band is
a `<section>` named by its `<h2>`. The card is a description list. The footer has **no headings** (column
titles are `<p>`, as now) and four `<nav>` regions, each named with `aria-label` and holding a list. The
scene, the shader layers and the arrow in "Start a project" are `aria-hidden`; the scene holds nothing
focusable.

**React.** There is nothing to mount: write the markup as JSX (`class` becomes `className`). Only the moving
background has a script, and it is optional:

```jsx
function ClosingBand({ id = 'close-title', title, children }) {
  const layer = useRef(null);
  useEffect(() => window.KWS?.shader?.mount(layer.current), []);   // returns its own clean-up
  return (
    <section className="kws-close kws-shader-host" aria-labelledby={id}>
      <div ref={layer} className="kws-shader" data-shader="band" aria-hidden="true" />
      <div className="kws-close-in">
        <div className="kws-close-copy"><h2 className="kws-close-title" id={id}>{title}</h2></div>
        {children}
      </div>
    </section>
  );
}
```

Leave `data-kws="shader"` off in React (it is the marker for the auto-start at page load); `mount` is the
same call. The footer sky takes the same two lines.

## 2. The closing band (`closing.css`)

**What it is for.** The last section of a page: the painted-sign blue block with one big line in Fraunces,
one honest sentence, the two actions and the number to call. Its scalloped top edge is the awning the site
already uses; it rises over whatever section is above. Behind the words, slow folds in tones of the block's
own colour: by CSS when still, by `shader.js` when moving.

**Suits.** Any business whose page should end by asking for one thing: a call, a booking, a quote. It needs
a strong colour block; on a pale block see "Limits".

**Three layouts, the same two actions in each.**

| Class | Layout | Use on this site |
| --- | --- | --- |
| `kws-close` | The statement: centred, title up to 76px, gold rules either side of the kicker | Home, Work |
| `kws-close kws-close--card` | Copy on the left, the appointment card on the right from 980px; on a phone the card sits between the sentence and the second button. The booking button is on the card | Pricing, Services, Consulting, Start |
| `kws-close kws-close--strip` | Compact: half the padding, title at section-heading size, actions beside the copy from 980px | FAQ, About, Process, the city pages |

Legal pages, checkout and the 404 page still get none. One closing band a page.

Heights, for choosing: at 390 wide the strip is 461px, the statement 563px and the card layout 865px (today's
band is 503px there); at 1440 they are 331px, 603px and 627px (today's: 612px). The card layout is the long
one on a phone because the card is shown there now; keep it for pages where the call is the point.

**Canonical markup** (the statement). On this site add `on-blue`; add `kws-shader-host` and the layer for the
moving background. The booking button's attributes are the site's own: `href="/contact/" data-booking`.

```html
<section class="kws-close on-blue kws-shader-host" aria-labelledby="close-title">
  <div class="kws-shader" data-kws="shader" data-shader="band" aria-hidden="true"></div>
  <div class="kws-close-in">
    <div class="kws-close-copy">
      <p class="kws-close-kicker">Free · 30 minutes · No pitch</p>
      <h2 class="kws-close-title" id="close-title">Still deciding? Book the <span class="kws-close-mark">free call</span>.</h2>
      <p class="kws-close-text">You'll get a clear view of what your website and your systems need, and what it should cost — even if you do it yourself.</p>
    </div>
    <div class="kws-close-acts">
      <a class="kws-close-btn kws-close-btn--main" href="/contact/" data-booking>Book a free 30-minute call</a>
      <a class="kws-close-btn" href="/contact/">Send an enquiry</a>
    </div>
    <p class="kws-close-tel">Or call <a href="tel:+12252550837">(225) 255-0837</a></p>
  </div>
</section>
```

The strip is the same with `kws-close--strip` on the section (leave the kicker and the `kws-close-mark` out).
With the card, the booking button moves onto it and the order is copy, card, second action, number:

```html
<section class="kws-close kws-close--card on-blue kws-shader-host" aria-labelledby="close-title">
  <div class="kws-shader" data-kws="shader" data-shader="band" aria-hidden="true"></div>
  <div class="kws-close-in">
    <div class="kws-close-copy">
      <p class="kws-close-kicker">The discovery call</p>
      <h2 class="kws-close-title" id="close-title">Tell us about your business.</h2>
      <p class="kws-close-text">You leave with a plan for your website and your systems, and the fixed price for it, whether or not you hire us.</p>
    </div>
    <div class="kws-appt on-paper"> ... section 3 ... </div>
    <div class="kws-close-acts">
      <a class="kws-close-btn" href="/contact/">Send an enquiry</a>
    </div>
    <p class="kws-close-tel">Or call <a href="tel:+12252550837">(225) 255-0837</a></p>
  </div>
</section>
```

**Every class.**

| Class | On | What it does |
| --- | --- | --- |
| `kws-close` | `section` | The block, its still folds, its scalloped top edge. Centred unless a layout class is added |
| `kws-close--card`, `kws-close--strip` | `section` | The other two layouts |
| `kws-close-in` | `div` | The page column (the site's gutter and 1240px) |
| `kws-close-copy` | `div` | Kicker, title, sentence. Required: the layouts place it |
| `kws-close-kicker` | `p` | Optional. Gold capitals with a short rule (two when centred). Keep it to about 28 characters: "Free · 30 minutes · No pitch" fits one line from 360px |
| `kws-close-title` | `h2` | The line. `text-wrap: balance` |
| `kws-close-mark` | `span` in the title | Optional, once: a tapered gold stroke under two or three words. It echoes the brick brush under the words in a page's headline. Keeps its words on one line, so keep it short, and put it where it lands in the title's last line: the stroke hangs under the words |
| `kws-close-text` | `p` | The sentence, at most 34em wide |
| `kws-close-acts` | `div` | The buttons: stacked and full width on a phone, a row from 600px |
| `kws-close-btn`, `kws-close-btn--main` | `a` | 56px buttons. Main: filled. Plain: outlined. They lift 2px on hover and sink 1px when pressed |
| `kws-close-tel` | `p` holding one `a` | "Or call" and the number, 44px tall, in the display face with a gold line |

A plain `<p>` after the number is fine print (the city pages have one). The site's `reveal` may go on
`kws-close-in`, as today. No options, no data attributes of its own.

**Copy.** Only what the site already says: free, 30 minutes, no pitch, fixed prices, a call or in person, a
reply within one business day. The titles in the demo are the ones on the pages today. The button label is
"Book a free 30-minute call" everywhere (pages say "Book a discovery call" today; the brief asks for this
wording).

**Limits.**
- The folds only ever darken the block (28% at the two side edges, 13% in one soft fold right of centre), so
  light text gains contrast and never loses it. On a **pale** block with dark text, check the text at the right
  edge, or drop the folds: `.kws-close[class] { background-image: none; }`.
- The still is flat for its top fifth, where the scallops meet it. The scallops are 16px; the section above
  needs no extra padding for them.
- The folds need `color-mix()` (Chrome 111, Safari 16.2, Firefox 113). Older browsers get the flat colour.
- The band has no focus rule of its own (no room), nor has the card: they use the page's. On this site that is
  the 3px ring.
- `kws-close[class]` is deliberate: it lets the folds outrank a tone scope's `background` shorthand wherever
  the file is folded into `styles.css`.
- Print: add `.kws-close` to the site's print rule in place of `.cta-band`.

## 3. The appointment card (`appt.css`)

**What it is for.** What the free call is, as a card from the pad on the counter: cost, length, sales pitch,
where, and the booking button on the card itself. The two faint edges under it are the next cards of the pad.
It replaces the decorative `.appt` in the band: this one is real content (a description list and a link), so
it is **not** `aria-hidden` and it shows on phones.

**Suits.** Anyone who books time: trades (the free estimate visit), salons, clinics, restaurants (a table),
consultants. Three or four plain facts and one button.

```html
<div class="kws-appt on-paper">
  <p class="kws-appt-head"><span>Appointment card</span><span>No. 01</span></p>
  <p class="kws-appt-title">Discovery call</p>
  <dl>
    <div><dt>Cost</dt><dd>Free</dd></div>
    <div><dt>Length</dt><dd>30 minutes</dd></div>
    <div><dt>Sales pitch</dt><dd>None</dd></div>
    <div><dt>Where</dt><dd>A call, or in person</dd></div>
  </dl>
  <a class="kws-appt-btn" href="/contact/" data-booking>Book a free 30-minute call</a>
</div>
```

- `on-paper` keeps it cream after dark and on blue (the site's rule for a paper object in a tone scope). On a
  client site set the card's own palette on `.kws-appt`.
- The first value of the list takes the notice colour ("Free"). The button is optional: without it the card
  is the old decorative one, and should then be `aria-hidden` if the text beside it says the same.
- At most 23rem wide; in the band, 21rem from 980px. It sits straight: it is not the page's tilted object.
- By itself on paper (demo, "The appointment card by itself"): beside the contact form, in a page head's aside.
- The site's `.appt` rules stay while any page still uses that markup (`process.css` borrows `.appt-lines`).

## 4. The footer (`footer.css`)

**What it is for.** The last thing on every page, in ink. Top row: who we are (crest, name, the sentence, the
"Based in Baton Rouge" line) beside the contact block, which is the main event: the phone number at up to
52px in Fraunces, the hours, the email, "Start a project". Second row: Services, Company and Areas we serve.
Then a sign-off like a shop's door sign, the legal row, and the town at night.

**The grid.** Four equal columns from 760px, two below it. Who-we-are and Contact each span two; Services and
Company take one each; Areas we serve spans two and sets its list two-up, so its two halves sit on the grid's
third and fourth columns and Contact's left edge lines up with Areas'. On a phone the same blocks fold to:
who we are, contact, Services beside Company, Areas two-up. Source order is reading order at every width.

**The links are exactly the current footer's**: five under Services, five under Company, four towns with pages
and three without (plain text, grey) under Areas we serve, and phone, email and "Start a project" under
Contact. Changed: phone now comes before email; the linked towns fill the left half and the three plain ones
the right; "Back to top" is still the last link.

**Added text, both already on the site:** the hours under the number ("Mon–Fri, 9am–6pm Central Time", from
the contact page) and the sign-off ("Thanks for stopping by. We reply within one business day.", the reply
time from the contact, start and city pages). Drop either line if the owner prefers.

**Suits.** Any local business. The contact block wants a phone number people actually ring.

**Canonical markup**: `footer.inc` in this folder (it is the real partial; do not retype it). Its skeleton:

```html
<footer class="site-footer on-ink kws-foot">
  <div class="kws-foot-in">
    <div class="kws-foot-grid">
      <div class="kws-foot-wide"> a.kws-foot-logo (crest marker + name), p, p > strong </div>
      <nav class="kws-foot-wide" aria-label="Contact"> p.kws-foot-title, ul: a.kws-foot-tel, span (hours), a.kws-foot-mail, a.kws-foot-go </nav>
    </div>
    <div class="kws-foot-grid">
      <nav aria-label="Services"> p.kws-foot-title, ul </nav>
      <nav aria-label="Company"> p.kws-foot-title, ul </nav>
      <nav class="kws-foot-wide" aria-label="Areas we serve"> p.kws-foot-title, ul.kws-foot-two </nav>
    </div>
    <div class="kws-foot-end"> p.kws-foot-bye, p (© and #year), p.kws-foot-links (pause button, Privacy, Terms, Back to top) </div>
  </div>
  <div class="kws-skyline" aria-hidden="true"> ... section 5 ... </div>
</footer>
```

| Class | What it does |
| --- | --- |
| `kws-foot` | Ground, text colour, link colour (links are the ink colour, underlined on hover), focus ring |
| `kws-foot--slim` | The landing-page footer: one block, smaller number, tighter top |
| `kws-foot-in` | The page column |
| `kws-foot-grid` | Two columns, four from 760px. A second grid, or `kws-foot-end`, straight after one gets a hairline and the section gap |
| `kws-foot-wide` | Spans two columns; a class-less `<p>` directly inside it is capped at 26em |
| `kws-foot-logo` | Crest (first child, 3rem: an inline `svg` or an `img`) and name |
| `kws-foot-title` | Column title: gold capitals, 12px. A `<p>`, never a heading |
| `kws-foot-two` | A list in two columns (it fills the left one first) |
| `kws-foot-tel`, `kws-foot-mail`, `kws-foot-go` | The big number (56px target), the email, the outlined "Start a project" (48px) |
| `kws-foot-end` | The last block: sign-off and legal line on the left, links on the right from 760px (its last child goes right) |
| `kws-foot-bye` | The sign-off, in the display face |
| `kws-foot-links` | A wrapping row of links (and the pause button) |

Every link, and every plain place name, is at least 44px tall; a `<span>` in a list is a place without a page.
A `[hidden]` child stays hidden (the pause button before `shader.js` shows it).

**It keeps `class="site-footer"`** because `main.js` looks for it twice (the phone bar gets out of the way over
the footer; the open phone menu takes the footer out of reach). Both still work (measured). `#year` is filled
as before. The crest marker `<!-- art:crest-footer -->` is unchanged, so `tools/art/build.py` fills it.

**The slim footers.** `footer-start.inc` (the landing page: no site map, on purpose) and `footer-bare.inc` (the
not-found page, which loads no script: no `#year`, no pause button, no shader layer). Same care at their size:
the number in Fraunces at 28px with the email beside it, the legal line, three links, then the skyline with
its lit windows, stars and dusk, without the big name (the name is in the legal line, and the 404 page has its
own street scene above).

**Limits.**
- Three plain place names do not line up row for row with the four linked towns; that is the two-column list
  filling its left half first, and it keeps links together.
- A very long email address wraps inside its column (`overflow-wrap: anywhere`).
- It is taller than today's. At 390 wide: 1,378px against 1,138px (the scene is 102px of that; the rest is the
  bigger number, the hours and the sign-off). At 1440: 1,071px against 538px (the contact row is its own row
  now, and the scene is 249px). The slim footer is 356px at 390 and 290px at 1440.

## 5. The town at night (`skyline.css`, `skyline.inc`)

**What it is.** The site's Baton Rouge skyline (Capitol, downtown, the river bridge) moved from the top edge
of the footer to its foot, standing on the bottom of the page. Behind it, dusk: a last warm light on the
horizon under the blue hour, a few gold stars, and the name set across the full width, rising behind the
rooftops as you arrive. Windows and bridge lamps are lit in both themes (the footer is night either way; the
night theme deepens the sky through the tokens). It is the page's one piece of place, and its last word.

```html
<div class="kws-skyline" aria-hidden="true">
  <div class="kws-skyline-sky kws-shader-host"><div class="kws-shader" data-kws="shader" data-shader="band"></div></div>
  <p class="kws-skyline-name">KnightWebstudio</p>
  <svg class="kws-skyline-art" viewBox="0 0 1440 120" preserveAspectRatio="xMidYMax slice" focusable="false"> ... <path class="kws-skyline-lit" d="..."/> </svg>
</div>
```

| Part | Notes |
| --- | --- |
| `kws-skyline` | Sizes itself from its own width (container units; `vw` where a browser has none), so it also fits a column narrower than the screen. Hidden in print |
| `kws-skyline-sky` | Stars and dusk. Required even with no shader: it gives the scene its height when there is no name. Add `kws-shader-host` and the layer for the moving sky: the shader's slow folds and twinkling flecks show under the dusk, and cover the CSS stars |
| `kws-skyline-name` | Optional. Real text, never CSS content. Set `--kws-fit` to the name's width in em in the display face (KnightWebstudio in Fraunces: 8.1; the default 8.3 leaves a hair of margin). Capped at 256px type |
| `kws-skyline-art` | Any silhouette drawn bottom-up in a 12:1 box: fills take the ground colour, strokes too |
| `kws-skyline-lit` | Windows and lamps, in the gilt colour |

**For a client.** Draw their town (or leave the `svg` out: sky, stars and name still make an ending), set
`--kws-fit`, and set `--kit-shader-1` to the sky's glow. To measure the fit, in the console:
`s=document.querySelector('.kws-skyline-name');r=document.createRange();r.selectNodeContents(s);r.getBoundingClientRect().width/parseFloat(getComputedStyle(s).fontSize)`.

**Limits.**
- The skyline is 54px tall below 643px wide and shows the middle 60% of the drawing there (Capitol at the left
  edge, half the bridge at the right); it is 8.4% of the width above that, up to 170px, so the Capitol's spire
  is whole at 1920 (today's is cropped above 1430px).
- The name is at 34% and fades toward the rooftops: decoration, not signage. The real name is in the lockup.
- `view(0px)` is deliberate: the page sets `scroll-padding` for its sticky bars, and a view timeline honours
  it by default, which left the name 90% unrisen on phones.
- WebKit could not be launched on the build machine: Safari is untested. Everything used is in Safari 16.2 or
  later except the rise (Safari 26), which is behind `@supports`.

## 6. Dropping the partials in

Copy the four `.inc` files over the ones in `tools/chrome/` (`phone-bar.inc` is unchanged), add the four
stylesheets, and run `tools/sync_chrome.py`. The first line of each footer partial and `{{skyline}}` on a line
of its own are kept, so the sync and the crest build work as they do now.

**Shared rules these replace in `assets/css/styles.css`** (line numbers as of this build):

| Lines | Rule | What happens to it |
| --- | --- | --- |
| 76 | `--skyline` token | Unused: delete |
| 120 | `main { padding-bottom: var(--skyline); }` | Delete that declaration (keep `img, svg` on the same line). The skyline no longer overlaps the end of `main` |
| 154 | `.footer-title` in the list of small capitals | Take it out of the list |
| 706 to 713 | Section 15, "Closing band": `.cta-band`, `.cta-band::before`, `.cta-inner`, `.cta-band h2`, `.cta-copy p`, the 980px rule | Replaced by `closing.css` |
| 716 to 740 | Section 16, the footer half: `.site-footer`, `.footer-skyline`, `.sky-lit`, `.footer-grid`, `.footer-brand` (and `p`), `.footer-loc`, `.footer-col` (and `a`), `.footer-title`, `.footer-place`, `.footer-bottom` (and `p`), `.footer-links` (and `a`), the three media blocks, `.site-footer a:hover` | Replaced by `footer.css` and `skyline.css` |
| 802 | print: `.cta-band, .footer-skyline` | Write `.kws-close` (the scene hides itself in print) |

About 3.0 KB goes and 11.7 KB comes: 8.7 KB net (the site's stylesheets total 124.6 KB today against a 140 KB limit). Not replaced: the phone bar's rules (742 to 756), the tone
scopes, and the `.appt` rules (see section 3).

Elsewhere:
- **Pages**: each `<section class="cta-band on-blue"> ... </section>` becomes one of the three bands above.
- `assets/css/pages/city.css` lines 44 and 47 style `.cta-copy .fine`: that line becomes a plain `<p>` after
  the number (or retarget the rule to `.kws-close-in > p:last-child`).
- `DESIGN.md` says `main` leaves room for the skyline and that the band's foot runs under it: neither is true
  any more. Pages that end on paper simply end; the footer starts with a straight edge.
- `tools/sync_chrome.py`'s docstring calls `skyline.inc` "the skyline that tops every footer": it now ends it.
- Folding into `styles.css`: anywhere works (the band's folds outrank `.on-blue`'s background by design).
- `shader.css` and `shader.js` from `../light/`: needed only for the moving backgrounds and the pause button.

## 7. Measurements

All from `test/results.txt` (`sh test/run-all.sh`), Chromium, on the build machine.

| What | How | Result |
| --- | --- | --- |
| Sizes | `wc -c` | `closing.css` 3,485, `appt.css` 2,218, `footer.css` 3,103, `skyline.css` 2,849 bytes. No script |
| House rules | `grep` | No hex colour, no `!important`, no site token used bare in any of the four. Media queries: 600, 760 and 980 only, `hover: hover`, `prefers-reduced-motion` |
| Sideways scroll | `tools/widths.js`, every 20px from 360 to 1920, on the demo, the bare page and the three real pages | None at any width |
| Type and targets | `tools/smalltext.js` at 390; `test/checks.js` at 360 | Smallest text 12px (capital labels only); every link and button at least 44 by 44px |
| Console | five pages, both themes, scrolled to the end | No errors |
| Script off | demo and two real pages at 390 | Everything present; booking links go to `/contact/`; no dead button |
| The name's rise | 390 and 1440 | Driven by a view timeline; 32.7px (phone) and 91.6px (desktop) from rest while entering, unchanged after 1.2s without scrolling; 0.00px and progress 1.000 at the end of the page |
| Paused, and reduced motion | `data-motion="off"`; Playwright `reducedMotion` | No animation at all; name at 0px; shader layers hold one still frame |
| Keyboard | Tab from the band to the end of the pricing page | 25 stops in reading order, each with a 3px ring and scrolled into view; nothing focusable in the scene |
| The site's own behaviour | real `main.js` on the pricing copy | `#year` filled; the card's booking button points at the calendar in a new tab with `rel="noopener"`; the phone bar shows mid-page and hides over the footer; the theme button re-colours band and footer; the open phone menu still makes the footer inert |
| Layout shift | `layout-shift` entries, demo and pricing copy, 390 and 1440, load to page end | 0 from any kit element; page score 0.0000 |
| Taken out of the page | every band and footer removed from the demo | 0 animation frames asked for in 2s afterwards, 0 errors |
| Put in late, twice | a band cloned twice into the bare page after load | Three copies, identical heights |
| Touch | 390, real touch events on the pricing copy | A swipe that starts on the title, the card's button, the band's button, the footer number or a footer link scrolls the page (245 to 388px for a 260px swipe with its fling); a sideways swipe moves the page 0px; a tap follows its link |
| Contrast | `test/contrast.js`: text hidden, the page screenshotted, every line of text compared with the worst 4px block behind it; both themes, 390 and 1440 | Still: lowest 4.91:1. Shader live (6 frames each): lowest 4.55:1. Both are the gold kicker on blue; all 77 texts pass AA. Bare page, brick-red brand: lowest 5.26:1 |
| Firefox 155 | `test/other-browsers.js`, 390 and 1440 | Pass: same layout; no scroll-linked animation there, so the name simply rests in place |
| WebKit | | Could not be launched on this machine: untested |

40 PASS lines, no FAIL.

**Frame times.** A finger scrolls the last 2,600px of the pricing page to its very end at 390 by 844, three
passes each, the three pages taken in turn (the machine was shared with other work, so the page as it stands
today is the yardstick). Times in ms.

| 4x CPU throttle | Frames | Median | p95 | p99 | Over 34ms | Worst, each pass |
| --- | --- | --- | --- | --- | --- | --- |
| Today (old band and footer) | 1,850 | 16.7 | 16.7 | 16.8 | 1 (0.05%) | 33/133/33 |
| Kit, CSS only | 2,121 | 16.7 | 16.8 | 16.8 | 3 (0.14%) | 33/33/117 |
| Kit with the shader live | 1,898 | 16.7 | 16.8 | 33.3 | 6 (0.32%) | 100/100/67 |

| No throttle | Frames | Median | p95 | p99 | Over 34ms | Worst, each pass |
| --- | --- | --- | --- | --- | --- | --- |
| Today | 1,845 | 16.7 | 16.7 | 16.8 | 1 (0.05%) | 100/17/17 |
| Kit, CSS only | 2,167 | 16.7 | 16.7 | 16.8 | 0 (0.00%) | 17/17/17 |
| Kit with the shader live | 1,880 | 16.7 | 16.8 | 16.8 | 0 (0.00%) | 33/33/33 |

Nothing in the kit asks for an animation frame: 0 in 6s of idling on each page, shader included while it is
off screen.

**Page length.** The pricing page at 390 wide goes from 10,410px to 11,012px with the card layout and the new
footer (band +362px, footer +240px). With the strip instead it would be about 200px longer than today.

## 8. Decisions

1. **The skyline moved to the foot of the footer, and the name went behind it.** One composition that every
   page ends on, with or without a band above, instead of a skyline at the join and a wordmark somewhere
   else. The cost: two shared rules go (section 6) and the band no longer runs under the skyline.
2. **The contact block is the Contact column.** The brief asks for four link groups and a clear contact block;
   making the Contact group the block avoids printing the number twice in one footer.
3. **The booking button sits on the card** in the card layout. The card is the thing you take; a decorative
   card beside a button said everything twice and was hidden on phones.
4. **Windows are lit in both themes.** The footer is dark in both; the kit may not read the site's day and
   night switches bare, and a lit town reads right at dusk too.
5. **No script.** Nothing here needs one. The rise is CSS scroll-linked animation behind `@supports`.
6. **The still's folds only darken.** A lit fold under the gold kicker measured 4.2:1 together with
   `shader.css`'s own still; darkening only keeps every text at 4.9:1 or better.
7. **Four stylesheets, not one** (top of this file).
8. **Hours and a sign-off in the footer**, both facts already on the site (section 4).
9. **Button label**: "Book a free 30-minute call", as the brief words it.

## 9. Not right yet

- Safari is untested (no WebKit here).
- The band's two buttons and the card's button are the kit's own classes, drawn to match `.btn` on blue and
  on paper. If `.btn` changes, these need the same change.
- With `shader.js` live the gold kicker's lowest measured contrast is the shader's to keep (it guards 4.8:1
  before grain; measured 4.55:1 after grain).
- The footer's first row leaves the right of the contact block empty above 1280px. It is quiet on purpose,
  but a client with a street address could put it there.
- The footer is twice as tall as today's on a desktop (1,071px against 538px at 1440) and 240px taller on a
  phone; the card layout of the band is 362px taller than today's band on a phone (section 2, "Heights").
- With the CPU throttled 4x, 3 frames of 2,121 ran over 34ms with the kit's CSS alone and 6 of 1,898 with the
  shader live (1 of 1,850 on today's page). Medians and p95 are 16.7 to 16.8ms throughout.
- The band and the card have no focus rule of their own (the footer does): on a client site they show the
  browser's default ring unless the site styles `:focus-visible`.
- Nothing in the repository was changed. `main.js` ran against copies of three pages; `tools/sync_chrome.py`
  itself was not run, only its footer pattern checked against the three partials (it takes each one whole).

## 10. The screenshots

In `shots/`. Real pages with the kit in place (the band's background is live in these): `pricing-end-` at 360,
390, 820, 1440 and 1920 in light and dark, plus `-script-off` and `-reduced-motion`; `start-end-` (slim footer
with script); `notfound-` (slim footer, no script). The three bands by themselves: `band-strip-`,
`band-card-`, `band-statement-`, each `-still` (CSS only) and `-live`. `card-alone-`: the card on paper.
`slim-start-`, `slim-bare-`: the slim footers. `client-brand-`: the green and cream palette inside the site;
`portable-end-`: the brick-red brand on the bare page. `scene-still-` against `scene-live-`: the sky without
and with the shader. `rise-390-1` to `-3`: the name coming up behind the rooftops as the last 100px scroll in.
`focus-`: the rings. `other-firefox-`: Firefox at the page end.
