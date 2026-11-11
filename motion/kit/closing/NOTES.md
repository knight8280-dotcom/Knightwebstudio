# Motion kit: the closing band and the footer

The end of every page. Hand-written for knightwebstudio.com; nothing here is copied from a library or
another site. Five small stylesheets, no script of their own, and four proposed chrome partials.

| File | What it is | Size |
| --- | --- | --- |
| `btn.css` | The button the band, the card and the footer share (`kws-btn`) | 1,383 bytes |
| `closing.css` | The closing band, three layouts (`kws-close`) | 3,495 bytes (budget 3,500) |
| `appt.css` | The appointment card with the booking button on it (`kws-appt`) | 1,840 bytes |
| `footer.css` | The footer and its slim form (`kws-foot`) | 3,495 bytes |
| `skyline.css` | The town at night that ends the footer (`kws-skyline`) | 3,373 bytes |
| `footer.inc`, `footer-start.inc`, `footer-bare.inc`, `skyline.inc` | Proposed replacements for the partials of the same names in `tools/chrome/` | 3,821, 1,205, 892, 2,318 bytes |
| `demo.html` | Every part in the site's own stylesheet, in both themes, with a client palette | `http://localhost:8730/kit/closing/demo.html` |
| `portable.html` | The five files on a page with no site stylesheet and no script, another brand | proof that the kit stands alone |
| `test/pricing-with-kit.html`, `start-with-kit.html`, `notfound-with-kit.html` | Copies of three real pages with the new band and partials in place | proof inside the site |
| `test/main.patched.js` | The repository's `main.js` with the one line changed that section 6 asks for; the test pages load it | built, never edited by hand |
| `test/` | The checks behind every number here; `sh test/run-all.sh` writes `test/results.txt` | |
| `shots/` | Screenshots that were taken and looked at (`node test/final-shots.js` retakes them) | section 10 |

`demo.html`, `portable.html` and the test pages are assembled by `motion/work-closing/build_demo.py` and
`build_test_pages.py` from the partials in this folder (the same way `tools/sync_chrome.py` would), so what you
see is the partials, not a hand copy. Run both after editing a partial.

**No script.** Nothing in this folder needs JavaScript, so there is no `closing.js`. The band carries an empty
layer marked `data-shader="band"`; the kit's `shader.js` (in `../light/`) fills it with the moving background
when it is on the page. Without it, the CSS here is the whole picture. The pause button in the footer partials
belongs to the kit's `motion.js` and `motion.css` (also in `../light/`), which every page loads.

**Why five stylesheets.** The brief names `closing.css`. The band with its card and the footer with its scene
each come to well over the 3.5 KB a component may weigh, and the card, the scene and the button are objects in
their own right (the card also sits on paper; the scene is what `skyline.inc` draws; the button is one drawing
used three times). Each has its own file and every file is inside the budget.

## 0. What changed in the fix pass (read this if you used the first version)

- **`btn.css` is new, and the button classes changed.** `kws-close-btn`, `kws-appt-btn` and `kws-foot-go` are
  gone: all three are `kws-btn` now (`kws-btn kws-btn--main` for the filled one). Hover tone, a press that
  sinks under the pointer, a 3px focus ring and reduced motion are in that one file.
- **The footer is one grid and much shorter.** 701px at 1440 (it was 1,071px) and 1,099px at
  390 (it was 1,378px; today's is 1,138px). Its markup changed: `kws-foot-who`, `kws-foot-call`,
  `kws-foot-places`, the sign-off as the grid's last item, no name beside the crest. Copy `footer.inc` again.
- **The pause button is last in the legal row and has its words.** It is the labelled pill of the kit's
  `motion.js`; the footer's rules no longer touch it.
- **The card layout of the band** has no kicker, puts the card beside the copy from 760px, and lets the card fill
  the column from 600 to 759px.
- **The marked words in the title take an inner span**, and the punctuation after them goes inside the mark:
  `<span class="kws-close-mark"><span>free call</span>.</span>`. The stroke is the site's brush, in gold.
- **The scene**: the name is gilt at its top edge and fades at the rooftops; a warm band of light shows between
  the buildings; phones get their own composition of the drawing; the sky has a slow glow of its own, in CSS,
  and **no shader layer** (section 5 says why).
- **A 2px gilt hairline** closes the band where it meets the footer.
- **`main.js` needs one line changed** at integration, or the phone bar covers the band's number (section 6).
- Everything was run in WebKit 26.6 (Safari's engine) as well as Chromium and Firefox. That found a fault in
  the kit's `shader.js`, not in these files: see section 9.

## 1. What every part shares

**Theme contract.** No hex colours and no site tokens used bare: every colour, font, radius and shadow is a
`--kit-*` variable with this site's token as its fallback. On knightwebstudio.com nothing needs setting, as
long as the band carries `on-blue`, the footer carries `on-ink` and the card carries `on-paper` (the tone
scopes re-point the fallbacks, so both themes come free). On a client site there are no tone scopes, so set
the variables on each block: a colour block and a paper object on it are two palettes (see `portable.html`).

| Variable | Fallback on this site | Band | Card | Footer and scene |
| --- | --- | --- | --- | --- |
| `--kit-bg` | band `--board`, footer `--footer` | the block's colour; its folds are tones of it | | ground; the skyline's silhouette |
| `--kit-surface` | `--card` | the second button's fill | the card | "Start a project" fill |
| `--kit-ink` | `--ink` | title, kicker, phone number, second button | title, values | links, phone number, sign-off, the lower part of the name in the sky |
| `--kit-muted` | `--ink-2` (`--ink-3` for places without a page) | the sentence | labels | body text |
| `--kit-line` | `--line-2`, footer `--line` | | dotted leaders | hairlines |
| `--kit-accent` | `--blue` (rings: `--focus`) | main button's fill; button focus ring | booking button's fill and ring | focus ring |
| `--kit-accent-ink` | `--on-blue` | main button's text | booking button's text | |
| `--kit-notice` | `--brick` | | the first value ("Free") | |
| `--kit-gilt` | `--gold` | the kicker's two rules, the brush under the marked words, the line under the number and its focus ring, the hairline at the band's foot | | column titles, the line under a link on hover, lit windows, stars, the warm horizon, the top of the name |
| `--kit-radius` | `--r-md` (14px) | buttons | card and its button | "Start a project" |
| `--kit-font-display` | `--font-display` | title, phone number | title | phone number, the two display lines, the name in the sky |
| `--kit-font-body` | `--font-text` | everything else | everything else | everything else |
| `--kit-shadow` | `--shadow-3` | | the card | |
| `--kit-shader-1` | `--board` | | | the blue hour in the footer sky |

Not used here: `--kit-shader-2`, `--kit-shader-3` (the band's folds come from its own ground, as `shader.js`
does it). Two extra knobs, each for one part: `--kws-mark` (the band's brush, section 2) and `--kws-fit` (the
name in the scene, section 5).

Spacing and type follow the site's scale where a token exists (`--sec`, `--gutter`, `--maxw`, `--fs-h3`,
`--fs-lede`, `--fs-title`, `--fs-sm`, `--fs-body`, `--fs-cap`, `--r-md`, `--t-fast`), each with a plain
fallback. The kit assumes nothing from a site's base layer: it measures the same with no reset at all (section 7).

**Colour rule.** On this site: cream on blue is pressable; gold is only on blue and on the footer; on the cream
card the button is the site's blue and "Free" is brick. Nothing decorative looks pressable. The kicker's words
are cream and only its rules are gold: small gold capitals over the moving background passed AA by a hair in
review, so no small text on the band is gold now.

**The button (`btn.css`).** One drawing, three places.

```html
<a class="kws-btn kws-btn--main" href="/contact/" data-booking>Book a free 30-minute call</a>
<a class="kws-btn" href="/contact/">Send an enquiry</a>
```

| Class | What it is |
| --- | --- |
| `kws-btn` | Outlined: `--kit-ink` text and edge on a `--kit-surface` fill. 56px tall, 1.5px edge, the site's radius, a 2px shaded bottom edge |
| `kws-btn--main` | Filled with `--kit-accent`, text `--kit-accent-ink`. Its transparent edge is drawn in forced colours |

States: hover lifts 2px and a main button's fill deepens (8% black mixed in); pressed sinks 1px and loses its
bottom edge, under the pointer too; `:focus-visible` is a 3px ring, 3px off, in `--kit-accent` (on this site
`--focus`: gold on blue and on the footer, blue on the card). The lift's 0.16s transition exists only where the
device allows motion. A long word breaks rather than widen the page. On the card the button is full width; in
the footer it is 48px tall. The classes mean nothing to the site's `.btn`: if `.btn` changes, change this file
to match.

**Motion.** The bands do not move (their moving background is `shader.js`'s). Two things in these files move:

- The **name in the footer sky** rises 40% of its height as the scene scrolls into view: scroll-linked (it goes
  exactly as far as the finger does), transform only, complete at the end of the page. Still, and in its final
  place, where the browser has no scroll-linked animation (Firefox today), under `prefers-reduced-motion`, and
  when `html[data-motion="off"]`.
- The **sky's glow** drifts sideways by 6% and dims to 65% and back over 16 seconds: transform and opacity
  only. It runs **only on a page that is showing the kit's pause button** (the rule asks for
  `.kws-motion:not([hidden])`), so it can never move without a control to stop it: not with script off, not on
  the not-found page, not on a client page without `motion.js`. The pause button holds it where it is; under
  `prefers-reduced-motion` it does not run at all.

**Script off / reduced motion / paused.**

| State | Band | Card | Footer | Scene |
| --- | --- | --- | --- | --- |
| Script off | Complete. Booking button goes to `/contact/` | Complete | Complete. No pause button (it carries `hidden`) | Still sky with stars and dusk, name in place |
| Reduced motion | Still folds (or one still shader frame) | | | Name in place, glow still |
| Motion paused | Still | | The button reads "Play motion" | Name in place, glow held |

**Keyboard and screen readers.** Everything is a real link in reading order; there is nothing to operate but
links and the pause button. Measured on the pricing page: 25 stops from the band to the end of the page, each
scrolled into view with a 3px ring; the pause button is the last. The band is a `<section>` named by its
`<h2>`. The card is a description list. The footer has **no headings** (column titles are `<p>`, as now) and
four `<nav>` regions, each named with `aria-label` and holding a list. The crest link is named
"KnightWebstudio home". The footer's blocks are laid out in source order at every width. The scene, the shader
layer and the arrow in "Start a project" are `aria-hidden`; the scene holds nothing focusable.

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
same call. The pause button mounts the same way: `useEffect(() => window.KWS?.motion?.mount(ref.current), [])`.
Import `btn.css` with whichever of the other four you use.

## 2. The closing band (`closing.css`, with `btn.css`)

**What it is for.** The last section of a page: the painted-sign blue block with one big line in Fraunces,
one honest sentence, the two actions and the number to call. Its scalloped top edge is the awning the site
already uses; it rises over whatever section is above. A 2px gilt hairline finishes its foot, where it meets
the footer. Behind the words, slow folds in tones of the block's own colour: by CSS when still, by
`shader.js` when moving.

**Suits.** Any business whose page should end by asking for one thing: a call, a booking, a quote. It needs
a strong colour block; on a pale block see "Limits".

**Three layouts, the same two actions in each.**

| Class | Layout | Use on this site |
| --- | --- | --- |
| `kws-close` | The statement: centred, title up to 76px, a gold rule either side of the kicker, the brush under two words | Home, Work |
| `kws-close kws-close--card` | Copy on the left, the appointment card on the right **from 760px**; from 600 to 759px the card fills the column; on a phone the card sits between the sentence and the second button. The booking button is on the card. No kicker: the card names itself | Pricing, Services, Consulting, Start |
| `kws-close kws-close--strip` | Compact: less padding, title at section-heading size; from 980px the actions sit beside the copy, centred against it as one block | FAQ, About, Process, the city pages |

Legal pages, checkout and the 404 page still get none. One closing band a page.

Heights, for choosing (today's band is 503px at 390 and 612px at 1440):

| Width | Strip | Statement | Card layout |
| --- | --- | --- | --- |
| 360 | 481 | 582 | 798 |
| 390 | 455 | 557 | 772 |
| 820 | 348 | 534 | 503 |
| 1440 | 333 | 597 | 615 |

(The card layout is measured on the pricing copy, whose sentence is a line longer than the demo's.)

**Canonical markup** (the statement). On this site add `on-blue`; add `kws-shader-host` and the layer for the
moving background. The booking button's attributes are the site's own: `href="/contact/" data-booking`.

```html
<section class="kws-close on-blue kws-shader-host" aria-labelledby="close-title">
  <div class="kws-shader" data-kws="shader" data-shader="band" aria-hidden="true"></div>
  <div class="kws-close-in">
    <div class="kws-close-copy">
      <p class="kws-close-kicker">Free · 30 minutes · No pitch</p>
      <h2 class="kws-close-title" id="close-title">Still deciding? Book the <span class="kws-close-mark"><span>free call</span>.</span></h2>
      <p class="kws-close-text">You'll get a clear view of what your website and your systems need, and what it should cost — even if you do it yourself.</p>
    </div>
    <div class="kws-close-acts">
      <a class="kws-btn kws-btn--main" href="/contact/" data-booking>Book a free 30-minute call</a>
      <a class="kws-btn" href="/contact/">Send an enquiry</a>
    </div>
    <p class="kws-close-tel">Or call <a href="tel:+12252550837">(225) 255-0837</a></p>
  </div>
</section>
```

The strip is the same with `kws-close--strip` on the section (leave the kicker and the mark out).
With the card, the booking button moves onto it and the order is copy, card, second action, number:

```html
<section class="kws-close kws-close--card on-blue kws-shader-host" aria-labelledby="close-title">
  <div class="kws-shader" data-kws="shader" data-shader="band" aria-hidden="true"></div>
  <div class="kws-close-in">
    <div class="kws-close-copy">
      <h2 class="kws-close-title" id="close-title">Still deciding? Book the free call.</h2>
      <p class="kws-close-text">You'll get a clear view of what your website and your systems need, and what it should cost — even if you do it yourself.</p>
    </div>
    <div class="kws-appt on-paper"> ... section 3 ... </div>
    <div class="kws-close-acts">
      <a class="kws-btn" href="/contact/">Send an enquiry</a>
    </div>
    <p class="kws-close-tel">Or call <a href="tel:+12252550837">(225) 255-0837</a></p>
  </div>
</section>
```

**Every class.**

| Class | On | What it does |
| --- | --- | --- |
| `kws-close` | `section` | The block, its still folds, its scalloped top edge, the gilt hairline at its foot. Centred unless a layout class is added. Hidden in print |
| `kws-close--card`, `kws-close--strip` | `section` | The other two layouts |
| `kws-close-in` | `div` | The page column (the site's gutter and 1240px) |
| `kws-close-copy` | `div` | Kicker, title, sentence. Required: the layouts place it |
| `kws-close-kicker` | `p` | Optional, for the statement. Cream capitals between two short gold rules. If it wraps, the lines are balanced and the rules stay with the words |
| `kws-close-title` | `h2` | The line. `text-wrap: balance` |
| `kws-close-mark` | `span` in the title | Optional, once. It holds an inner `<span>` around the two or three words to underline, **and the punctuation that follows them**, so a full stop can never be left alone on the next line. The inner span gets the brush |
| `kws-close-text` | `p` | The sentence, at most 34em wide |
| `kws-close-acts` | `div` | The buttons (`kws-btn`): stacked and full width on a phone, a row from 600px (from 760px in the card layout) |
| `kws-close-tel` | `p` holding one `a` | "Or call" and the number, 44px tall, in the display face with a 2px gold line that drops a little on hover; its focus ring is gold |

**The brush** is a mask, so it takes the gilt colour. It looks for `--kws-mark`, then the site's `--brush`
(so on this site it is the very stroke under the words of a page's headline), then draws a plain tapered
stroke. A client site sets its own, for example:

```css
.kws-close { --kws-mark: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 14' preserveAspectRatio='none'%3E%3Cpath d='M2 11C52 3 140 1 238 4c-76 0-168 3-236 9z'/%3E%3C/svg%3E"); }
```

A plain `<p>` after the number is fine print (the city pages have one). The site's `reveal` may go on
`kws-close-in`, as today. No options, no data attributes of its own.

**Copy.** Only what the site already says: free, 30 minutes, no pitch, fixed prices, a call or in person, a
reply within one business day. The titles and sentences in the demo are the ones on the pages today, and so is
the button label, "Book a free 30-minute call".

**Limits.**
- The folds only ever darken the block (28% at the two side edges, 13% in one soft fold right of centre), so
  light text gains contrast and never loses it. On a **pale** block with dark text, check the text at the right
  edge, or drop the folds: `.kws-close[class] { background-image: none; }`.
- The still is flat for its top fifth, where the scallops meet it. The scallops are 16px; the section above
  needs no extra padding for them.
- The folds need `color-mix()` (Chrome 111, Safari 16.2, Firefox 113). Older browsers get the flat colour.
- `kws-close[class]` is deliberate: it lets the folds outrank a tone scope's `background` shorthand wherever
  the file is loaded.
- A marked phrase too long for one line of a phone wraps inside the mark, and the brush is drawn under its
  last line. It is readable and nothing scrolls sideways, but two or three short words is what looks right.
- A very long single word in a title or on a button is broken to fit (`overflow-wrap: anywhere`).
- The gilt hairline is the band's own, so a band placed mid-page (as in the demo) carries it too.

## 3. The appointment card (`appt.css`, with `btn.css`)

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
  <a class="kws-btn kws-btn--main" href="/contact/" data-booking>Book a free 30-minute call</a>
</div>
```

- `on-paper` keeps it cream after dark and on blue (the site's rule for a paper object in a tone scope). On a
  client site set the card's own palette on `.kws-appt`.
- The first value of the list takes the notice colour ("Free"). The button is optional: without it the card
  is the old decorative one, and should then be `aria-hidden` if the text beside it says the same.
- At most 23rem wide by itself. In the band it is as wide as the column below 760px and 20rem from 760px.
  It sits straight: it is not the page's tilted object.
- It has a transparent 1px edge, and so has its button: in forced colours (Windows High Contrast) both are
  drawn.
- A label never wraps; a long value does, and a very long word in it is broken.
- By itself on paper (demo, "The appointment card by itself"): beside the contact form, in a page head's aside.
- The site's `.appt` rules stay while any page still uses that markup (the process page borrows `.appt-lines`).

## 4. The footer (`footer.css`, with `btn.css` and `skyline.css`)

**What it is for.** The last thing on every page, in ink, and now short enough to be seen whole: at 1440 by
900 the contact block, the link columns, the legal row and the town at night are on one screen.

**The composition.** One grid; the source order is the reading order at every width.

| Width | Layout |
| --- | --- |
| From 1100px | One row. Left, five parts in twelve: where we are (crest, "Based in Baton Rouge, Louisiana. Working with clients anywhere." in the display face, the sentence) above the contact block (the number at up to 52px, the hours, the email, "Start a project"). Right: Services, Company, Areas we serve (two-up), and under them the sign-off in the display face, its foot level with the foot of "Start a project". With a mouse the link rows are 32px apart; on touch they are 44px |
| 760 to 1099px | Four columns: where we are beside contact, a hairline, Services, Company, Areas we serve two-up, the sign-off across |
| Below 760px | Where we are; contact (the number at 36 to 52px); a hairline; Services beside Company, their rows level; Areas we serve as one wrapping row of places; the sign-off. Below 600px the sentence is left out (the crest line says where, the header says what) |

Then the legal row at every width: the copyright line, and Privacy, Terms, Back to top and the pause button.
Then the town at night.

**The links are exactly the current footer's**: five under Services, five under Company, four towns with pages
and three without (plain text, grey) under Areas we serve, and phone, email and "Start a project" under
Contact. Changed: the phone comes before the email; "Back to top" is no longer the last link, the pause
button is; the name is no longer printed beside the crest (it is in the header above and in the scene below),
so the crest link carries `aria-label="KnightWebstudio home"`.

**Added text, both already on the site:** the hours under the number ("Mon–Fri, 9am–6pm Central Time", from
the contact page) and the sign-off ("Thanks for stopping by. We reply within one business day.", the reply
time from the contact, start and city pages). Drop either line if the owner prefers.

**Suits.** Any local business. The contact block wants a phone number people actually ring.

**Canonical markup**: `footer.inc` in this folder (it is the real partial; do not retype it). Its skeleton:

```html
<footer class="site-footer on-ink kws-foot">
  <div class="kws-foot-in">
    <div class="kws-foot-grid">
      <div class="kws-foot-who"> a.kws-foot-logo (the crest marker), p.kws-foot-bye, p.kws-foot-what </div>
      <nav class="kws-foot-call" aria-label="Contact"> p.kws-foot-title, ul: a.kws-foot-tel, plain text (hours), a.kws-foot-mail, a.kws-btn </nav>
      <nav aria-label="Services"> p.kws-foot-title, ul </nav>
      <nav aria-label="Company"> p.kws-foot-title, ul </nav>
      <nav class="kws-foot-wide" aria-label="Areas we serve"> p.kws-foot-title, ul.kws-foot-places </nav>
      <p class="kws-foot-bye"> the sign-off </p>
    </div>
    <div class="kws-foot-end"> p (© and #year), p.kws-foot-links (Privacy, Terms, Back to top, the pause button) </div>
  </div>
  <div class="kws-skyline" aria-hidden="true"> ... section 5 ... </div>
</footer>
```

| Class | What it does |
| --- | --- |
| `kws-foot` | Ground, text colour, link colour (links are the ink colour; on hover a 2px gold line), focus ring |
| `kws-foot--slim` | The landing-page footer: one block, tighter top |
| `kws-foot-in` | The page column |
| `kws-foot-grid` | The grid described above. Its hairline between the contact block and the link groups is drawn by the grid itself and goes away from 1100px. A `<p>` directly inside it is the sign-off |
| `kws-foot-who` | Crest beside the display line; the sentence under both |
| `kws-foot-logo` | The link home. An inline `svg` or an `img` inside it is 3rem square; a name beside or instead of it is set in the display face on one line |
| `kws-foot-bye` | A line in the display face: where we are, the sign-off, the slim footer's first line |
| `kws-foot-what` | The sentence. Not shown below 600px |
| `kws-foot-call` | The contact block |
| `kws-foot-wide` | A link group that spans two columns below 1100px |
| `kws-foot-places` | A list set as one wrapping row below 760px and in two columns from 760px (it fills the left one first) |
| `kws-foot-title` | Column title: gold capitals, 12px. A `<p>`, never a heading |
| `kws-foot-tel`, `kws-foot-mail` | The big number (56px target); the email, and the slim footer's two contact links, at 17px semibold |
| `kws-btn` | "Start a project", 48px tall here |
| `kws-foot-end` | The legal block: a hairline, then the copyright line on the left and the links on the right from 760px |
| `kws-foot-links` | A wrapping row of links (and the pause button) |

Every link, and every plain place name, is at least 44px tall on touch; a `<span>` in a list is a place
without a page; text directly in an `<li>` (the hours) is a plain line with no target's height.

**It keeps `class="site-footer"`** because `main.js` looks for it twice (the phone bar gets out of the way over
the footer; the open phone menu takes the footer out of reach). Both still work (measured). `#year` is filled
as before. The crest marker `<!-- art:crest-footer -->` is unchanged, so `tools/art/build.py` fills it.

**The pause button** is the kit's labelled pill, markup from `../light/NOTES.md` section 3, last in the legal
row: `motion.js` shows it and writes "Pause motion" or "Play motion". It is in `footer.inc` and
`footer-start.inc`, not in the script-less 404 footer. The light group's notes also ask for one in the top
strip and one in the phone menu, so that nobody has to scroll to the footer to stop the band's background:
that is the chrome owner's to add; there is none inside the band (it would sit beside the page's main button).

**The slim footers.** `footer-start.inc` (the landing page: no site map, on purpose) and `footer-bare.inc` (the
not-found page, which loads no script: no `#year`, no pause button). They lead with "KnightWebstudio · Based
in Baton Rouge, Louisiana" in the display face (on a phone the name and the place are two lines, without the
dot), then the number and the email together at body size, then the legal links (on the landing page with
"© 2026" and the pause button), then the skyline with its lit windows, stars and dusk, without the big name.
The number is no longer printed large there: the band just above ends with it.

**Limits.**
- With a mouse the rows are 32px apart from 980px, so a link that wrapped to two lines there would stand 7px
  taller than its neighbours. The column widths are set so that none of this site's links wraps from 980px
  (looked at 1100 and 1280). On touch the rows are 44px and a two-line link fits.
- Three plain place names do not line up row for row with the four linked towns in the two-up list; that is
  the list filling its left half first, and it keeps the links together.
- A very long email address or link is broken to fit (`overflow-wrap: anywhere`).
- Heights: 1,099px at 390 and 1,096px at 360 (today's: 1,138px); 862px at 820;
  678px at 1280; 701px at 1440 (today's: 538px, with no scene); 769px
  at 1920. At 1280 by 720 it is 30px taller than the screen under the sticky header. The slim footer
  is 359px at 390 and 272px at 1440.

## 5. The town at night (`skyline.css`, `skyline.inc`)

**What it is.** The site's Baton Rouge skyline (Capitol, downtown, the river bridge) standing on the bottom of
the page. Behind it, dusk: a band of last warm light low between the buildings and under the bridge, the blue
hour above it, a few gold stars, and the name set across the full width as the shop's sign, gilt where the
light catches its top edge, fading out at the rooftops, rising behind them as you arrive. Windows and bridge
lamps are lit in both themes (the footer is night either way). It is the page's one piece of place, and its
last word.

```html
<div class="kws-skyline" aria-hidden="true">
  <div class="kws-skyline-sky"></div>
  <p class="kws-skyline-name">KnightWebstudio</p>
  <svg class="kws-skyline-art" viewBox="0 0 1440 120" preserveAspectRatio="xMinYMax slice" focusable="false">
    <g> ... <g class="kws-skyline-far"> ... </g> <g class="kws-skyline-span"> ... </g> ... </g>
  </svg>
</div>
```

| Part | Notes |
| --- | --- |
| `kws-skyline` | Sizes itself from its own width (container units; `vw` where a browser has none), so it also fits a column narrower than the screen. Hidden in print |
| `kws-skyline-sky` | Stars and dusk. Required: it gives the scene its height when there is no name. Its glow drifts only on a page that shows the pause button (section 1) |
| `kws-skyline-name` | Optional. Real text, never CSS content. Set `--kws-fit` to the name's width in em in the display face (KnightWebstudio in Fraunces: 8.1; the default 8.3 leaves a hair of margin). Capped at 256px type |
| `kws-skyline-art` | Any silhouette drawn bottom-up in a 12:1 box, inside one `<g>`: fills take the ground colour, strokes too |
| `kws-skyline-far`, `kws-skyline-span` | For a narrow scene (below 600px of its own width): the first group is left out and the second is moved 190 units left, so the drawing closes up. Here: the far end of downtown steps out and the bridge moves up beside the rest |
| `kws-skyline-lit` | Windows and lamps, in the gilt colour |

**On a phone** the scene is 90px tall and the drawing is recomposed: the Capitol stands 69px in from the left
edge with its wings, four downtown buildings follow, and the bridge starts beside them, so one whole bridge
tower is always in the frame (80px in from the right at 390) and the far span leaves the picture on
the rise. The name is lifted so that 95% of its letters' height stands clear of the usual roofline.

**No shader layer in the sky, on purpose.** The first version put a `data-shader="band"` layer there. In
WebKit, when two shader layers are on screen at once, each shows the other's picture (section 9): with the
band above it, the sky turned blue in a hard-edged block and the band turned ink. The sky's stars, dusk and
glow are therefore CSS alone, which also means they are the same in every browser, with or without WebGL. Do
not add a layer here until `shader.js` is right in Safari.

**For a client.** Draw their town (or leave the `svg` out: sky, stars and name still make an ending), set
`--kws-fit`, and set `--kit-shader-1` to the sky's glow. To measure the fit, in the console:
`s=document.querySelector('.kws-skyline-name');r=document.createRange();r.selectNodeContents(s);r.getBoundingClientRect().width/parseFloat(getComputedStyle(s).fontSize)`.

**Limits.**
- `--kws-fit` is measured for one typeface. Where a fallback face is drawn instead (the web font failed, or a
  font stack differs between machines, as `portable.html`'s does between engines here), the name is narrower
  or is cropped by the edges. It is decoration and it is clipped, so nothing scrolls.
- The skyline is 54px tall below 643px wide; above that it is 8.4% of the width, up to 180px, so the Capitol's
  spire is whole to 2,140px wide.
- The name is at 68% and fades toward the rooftops: decoration, not signage.
- `view(0px)` is deliberate: the page sets `scroll-padding` for its sticky bars, and a view timeline honours
  it by default, which left the name 90% unrisen on phones.
- The glow needs `:has()` (Safari 15.4, Chrome 105, Firefox 121): older browsers keep the sky still. The warm
  band and the blue hour need `color-mix()`; the phone composition needs container queries (Safari 16); the
  gilt on the name needs `background-clip: text`, without which the name is plain cream.

## 6. Dropping the partials in

Copy the four `.inc` files over the ones in `tools/chrome/` (`phone-bar.inc` is unchanged), load the five
stylesheets (below), and run `tools/sync_chrome.py`. The first line of each footer partial and `{{skyline}}` on
a line of its own are kept, so the sync and the crest build work as they do now.

**One line of `assets/js/main.js` must change, or the phone bar covers the band.** The bar hides over
`.cta-band`; the new band is `.kws-close`. In the block "Mobile sticky CTA":

```js
var avoid = [document.getElementById('contact'), document.querySelector('.cta-band, .kws-close'), document.querySelector('.site-footer')]
```

and name `.kws-close` in the comment above it. `test/main.patched.js` is the repository's file with exactly
that change, and the test pages run it: with it the bar is hidden with the band 15%, 50% and 100% of the way up
a phone screen; without it the bar sits on "Or call (225) 255-0837". Do **not** add class `cta-band` to the new
section instead: while the old `.cta-band` rules exist their negative margin and padding would apply. Add a
"bar hidden while the band is on screen" check to `tools/behaviour.js` (`test/checks.js` section 6 has one to
copy).

**Shared rules these replace in `assets/css/styles.css`**, by selector (the file moves too often for line
numbers):

| Rule | Where | What happens to it |
| --- | --- | --- |
| `--skyline` | the token block | Unused: delete |
| `main { padding-bottom: var(--skyline); }` | base | Delete that declaration (keep `img, svg` on the same line). The skyline no longer overlaps the end of `main` |
| `.footer-title` | the list of small capitals that starts `.eyebrow, .label, ...` | Take it out of the list |
| `.cta-copy p` | the `text-wrap: pretty` list | Take it out of the list |
| `.cta-band`, `.cta-band::before`, `.cta-inner`, `.cta-band h2`, `.cta-copy p`, and the 980px rule for `.cta-inner` | section "15 Closing band" | Replaced by `closing.css` |
| `.site-footer`, `.footer-skyline`, `.sky-lit`, `.footer-grid`, `.footer-brand` (and `p`), `.footer-loc`, `.footer-col` (and `a`), `.footer-title`, `.footer-place`, `.footer-bottom` (and `p`), `.footer-links` (and `a`), the three media blocks for them, `.site-footer a:hover` | section "16 Footer and the phone's sticky bar", its footer half | Replaced by `footer.css` and `skyline.css` |
| `.cta-band, .footer-skyline` | the print rule | Take both out: the band and the scene hide themselves in print |
| `[data-page="city"] .cta-copy .fine` (two rules: its margin and size, and `text-wrap: balance`) | the city page block | That line becomes a plain `<p>` after the number; retarget both to `[data-page="city"] .kws-close-in > p:last-child` |

About 3.4 KB goes. Not replaced: the phone bar's rules, the tone scopes, and the `.appt` rules (section 3).

**Where the five files go: the budget.** `styles.css` is 128.7 KB today against the brief's 140 KB. These five
files are 13.6 KB; with the 3.4 KB above gone, folding them in would bring it to about 138.9 KB, and
`motion.css` (1.7 KB, which the light group asks to have folded in) would put it over. The whole motion kit is
about 37 KB of CSS and cannot go into the one stylesheet. So, the recommendation: keep these five as one extra
file, `assets/kit/closing.css` (the five concatenated: `btn`, `closing`, `appt`, `footer`, `skyline`), linked on
every page **in the body, just before the closing band or the footer**, where it cannot hold up the first
screen. That is a decision for whoever owns the brief's "one stylesheet" rule; record it there either way.

Elsewhere:
- **Pages**: each `<section class="cta-band on-blue"> ... </section>` becomes one of the three bands above.
  On `/start/` the band is also `id="contact"`: keep the id.
- `DESIGN.md` says `main` leaves room for the skyline and that the band's foot runs under it: neither is true
  any more. Pages that end on paper simply end; the footer starts with a straight edge.
- `tools/sync_chrome.py`'s docstring calls `skyline.inc` "the skyline that tops every footer": it now ends it.
- `shader.css` and `shader.js` from `../light/`: needed only for the band's moving background. `motion.css`
  and `motion.js` from `../light/`: every page, for the pause button.
- The site's `tools/widths.js` counts anything that pokes past the right edge: the scene's drawing is exactly
  as wide as the scene, so it reports nothing.

## 7. Measurements

All from `test/results.txt` (`sh test/run-all.sh`): 77 PASS lines, no FAIL. Chromium unless a row says otherwise.

| What | How | Result |
| --- | --- | --- |
| Sizes | `wc -c` | `btn.css` 1,383, `closing.css` 3,495, `appt.css` 1,840, `footer.css` 3,495, `skyline.css` 3,373 bytes (13,586 together). No script |
| House rules | `grep` | No hex colour, no `!important`, no site token used bare in any of the five. Media queries: 600, 760, 980 and 1100 only (and 600 from the other side), `hover: hover`, `prefers-reduced-motion`; one container query, at 600 |
| Sideways scroll | the site's `tools/widths.js`, every 20px from 360 to 1920, on the demo, the bare page and the three real-page copies | None at any width, and nothing pokes past the right edge |
| Type and targets | `tools/smalltext.js` at 390; `test/checks.js` at 360 | Smallest text 12px (capital labels only); every link and button at least 44 by 44px on touch |
| Console and requests | five pages, both themes, scrolled to the end | No errors, no failed requests |
| Script off | demo and two real pages at 390 | Everything present; booking links go to `/contact/`; no dead button |
| The name's rise | 390 and 1440 | Driven by a view timeline; 26.8px (phone) and 73.0px (desktop) from rest while entering, unchanged after 1.2s without scrolling; at rest at the end of the page (progress 1.000 and 0.998) |
| The sky's glow | pricing copy, not-found copy, bare page | Runs with the pause button showing (12.3px, then 31.6px a second later); pressed, it holds (33.5px twice) and the button reads "Play motion"; pressed again it runs. Not-found page (no button), reduced motion, bare client page: no animation |
| Paused, and reduced motion | `data-motion="off"`; Playwright `reducedMotion` | Name: no animation, at 0px. Shader layer: one still frame |
| Keyboard | Tab from the band to the end of the pricing page | 25 stops in reading order, each with a 3px ring and scrolled into view, the pause button last; nothing focusable in the scene |
| Structure | pricing copy; 390, 820, 1440 | Band named by its `h2`; footer without headings, four labelled navs (4, 5, 5 and 7 items), 21 links; crest link named; blocks laid out in source order at all three widths |
| The site's own behaviour | `main.js` with the one line of section 6, pricing copy at 390 | `#year` filled; the card's booking button points at the calendar in a new tab with `rel="noopener"`; the phone bar shows mid-page, is hidden with the band 15%, 50% and 100% of the way up the screen, and over the footer; the theme button re-colours band and footer; the open phone menu still makes the footer inert |
| Layout shift | `layout-shift` entries, demo and pricing copy, 390 and 1440, load to page end | 0 from any kit element; page score 0.0000 |
| Taken out of the page | every band and footer removed from the demo | 0 animation frames asked for in 2s afterwards, 0 errors |
| Put in late, twice | a band cloned twice into the bare page after load | Three copies, identical heights |
| No base layer needed | the bare page with its `box-sizing` and margin reset taken out, 390 and 1440 | Card band, strip, card and footer measure exactly the same (713/371/317/944px and 575/266/317/734px) |
| The pause button | demo, page end | Round (demo header): icon 0.5px from the button's centre. Pill (three footers): 44px tall, icon on the centre line, 12.5px before the icon and 17px after the words, last in its row |
| Button states, bare page | hover, mouse down while hovering, keyboard focus | All four: lift 2px, sink 1px under the pointer, 3px solid ring; the two filled ones also deepen. The band's number: underline moves from 4.5px to 7.6px on hover, 3px ring. Reduced motion: transition 0s on all seven |
| Long words | 320, 360, 390: a 30-letter word in each title, a 34-letter word on each button and in a card value, two long marked phrases, a 38-letter footer link and a 53-letter email | 27 cases, none wider than the screen |
| The full stop after the marked words | 320 to 620px every 10px, a short and a long phrase | 62 widths: never on a line of its own, brush always drawn. Same sweep in Firefox and WebKit: never |
| A logo that is only a name | crest removed, name added, 390 and 1440 | One line, 185 by 28px |
| Forced colours | emulated | Card, its button, the band's second button and "Start a project" each have a solid border to draw |
| Text at 200% | root font size doubled; 390, 760, 1280 | No kit element runs off the screen; the bare page does not scroll sideways (the site's own header and tables do, on the real-page copies: not this folder's) |
| Heights | pricing copy | Footer 701px at 1440 by 900 (828px under the sticky header), 678px at 1280 by 720 (648px), 1,099px at 390, 1,096px at 360. Card band 772px at 390, 798px at 360, 503px at 820 in two columns; no empty block right of the card from 600 to 979px |
| Alignment | 360, 390, 820; strip at 1440 | Services and Company row centres within 0.5px; strip: buttons and number centred against the copy to the pixel |
| Gold details | computed | Line under the band's number 2px in the gilt colour; hairline at the band's foot 2px; no kicker in the card layout |
| The scene on a phone | 360, 390, 430, page end | 90px tall; Capitol tower 69px in from the left; a bridge tower 50, 80 and 120px in from the right; 95% of the letters' height clear of the usual roofline (74 to 78% at the tallest building). At 1440: 203px tall, name at 173px |
| Touch | 390, real touch events on the pricing copy | A swipe that starts on the title, the card's button, the band's button, the footer number, a footer link or the pause button scrolls the page (245 to 339px for a 260px swipe with its fling); a sideways swipe moves the page 0px; a tap follows its link |
| Contrast | `test/contrast.js`: text hidden, the page screenshotted, every line of text compared with the worst 4px block behind it; both themes, 390 and 1440 | Still: lowest 6.14:1 ("Free", brick on the card). Shader live, 6 frames each: lowest 4.77:1 (the small "Or call" on the band, light theme; that floor is `shader.js`'s guard, 4.6). All 77 to 79 texts pass AA. Bare page, brick-red brand: lowest 5.26:1 |
| Firefox 155 | `test/other-browsers.js`: pricing copy, bare page, demo; 390 and 1440 | Pass. No scroll-linked animation there, so the name rests in place; no WebGL on this machine, so the stills show |
| WebKit 26.6 (Safari's engine) | the same | Pass: gold line under the number, brush, masks, name sized from container units and clipped to its gradient, two-up list, scallops, folds; the name's rise runs and ends at rest |

**Frame times.** A finger scrolls the last 2,600px of the pricing page to its very end at 390 by 844, three
passes each, the three pages taken in turn (the page as it stands today is the yardstick). Times in ms.

| 4x CPU throttle | Frames | Median | p95 | p99 | Over 34ms | Worst, each pass |
| --- | --- | --- | --- | --- | --- | --- |
| Today (old band and footer) | 1,837 | 16.7 | 16.7 | 16.8 | 1 (0.05%) | 50/17/33 |
| Kit, CSS only | 1,850 | 16.7 | 16.7 | 16.8 | 0 | 33/33/33 |
| Kit with the shader live in the band | 1,885 | 16.7 | 16.7 | 16.8 | 0 | 33/33/33 |

| No throttle | Frames | Median | p95 | p99 | Over 34ms | Worst, each pass |
| --- | --- | --- | --- | --- | --- | --- |
| Today | 1,835 | 16.7 | 16.7 | 16.8 | 2 (0.11%) | 67/17/83 |
| Kit, CSS only | 1,843 | 16.7 | 16.7 | 16.8 | 0 | 17/17/33 |
| Kit with the shader live in the band | 1,865 | 16.7 | 16.8 | 16.8 | 0 | 33/17/17 |

Nothing in this folder asks for an animation frame: 0 in 6s of idling on each page. The sky's glow is a CSS
animation of transform and opacity on one layer. An earlier run the same day, on a busier machine, had 2 frames
of 1,857 over 34ms with the kit's CSS and none of 1,851 on today's page: the differences are noise.

**Page length.** The pricing page at 390 wide goes from 10,378px to 10,608px with the card layout and the new
footer (band +269px, footer -39px). With the strip instead it would be 87px shorter than today.

## 8. Decisions

1. **The skyline stands at the foot of the footer, with the name behind it.** One composition that every
   page ends on, with or without a band above. The band meets the footer on a straight edge, finished with a
   2px gilt hairline on the band.
2. **The contact block is the Contact column**, stacked under "where we are" from 1100px. The brief asks for
   four link groups and a clear contact block; making the Contact group the block avoids printing the number
   twice in one footer.
3. **The sign-off is the grid's last item.** From 1100px it sits under the link columns, level with the foot of
   the contact block, which fills the space the shorter rows leave and gives the line some presence. The
   copyright line is then alone with the links, on one row.
4. **The name is not printed beside the footer crest.** At the end of a page it would be the third
   "KnightWebstudio" on one screen. The crest link is named for screen readers.
5. **The booking button sits on the card** in the card layout, and that layout has no kicker.
6. **Windows are lit in both themes.** The footer is dark in both; the kit may not read the site's day and
   night switches bare, and a lit town reads right at dusk too.
7. **No script.** Nothing here needs one. The rise is CSS scroll-linked animation behind `@supports`; the glow
   is a CSS animation that asks for a visible pause button.
8. **No shader in the footer sky** (section 5), so the end of a page shows one shader layer at most.
9. **The kicker's words are cream; its rules are gold.** With the shader live the gold words measured 4.56:1,
   and `shader.js` has no bytes left for a stricter guard.
10. **The marked words take an inner span and hold their punctuation.** The reviewer's fix (an inline-block
    below 600px) dropped the full stop onto a line of its own in Firefox at 350px, and at any width once the
    marked words filled a line. With the punctuation inside the mark it cannot happen (62 widths, three
    engines).
11. **The brush's last fallback is a drawn taper, not an embedded image.** `closing.css` has no room for a
    second brush; `--kws-mark` takes one (section 2 has ours ready to paste).
12. **Hover deepens a filled button by 8% black**, whatever the palette. On this site's blue band the site's own
    primary button turns gold instead; the kit cannot know a client's gold is safe behind their button text.
13. **`overflow-wrap: anywhere`, not `break-word`,** on the band, the card and the footer: inside a flex or
    grid item only `anywhere` lets a long word give way.
14. **Five stylesheets, not one** (top of this file), and they should not be folded into `styles.css`
    (section 6).
15. **Hours and a sign-off in the footer**, both facts already on the site (section 4).
16. **From 1100px with a mouse, footer rows are 32px.** Touch keeps 44px at every width.
17. **The slim footers stack the name and the place on a phone** and drop the dot between them there.

## 9. Not right yet

- **`shader.js` is wrong in WebKit when two layers share the screen** (the light group's file; nothing here can
  fix it). Each layer shows another layer's picture. Seen in Playwright's WebKit 26.6 on the light kit's own
  demo (a ribbon in the wash panel, the green client band painted blue and the blue band green:
  `shots/webkit-shader-fault-light-demo.png`, Chromium above, WebKit below) and on the first version of this
  footer (`shots/webkit-shader-fault-this-kit.png`: left still, right live). One layer alone on screen is right.
  What was done here: the footer sky has no layer any more, so the end of a page shows the band's layer only.
  What is left: any page where the closing band shares a screen with another layer (a "band" panel, ribbon
  cards or a wash just above it) will show the fault in Safari, if Safari on a phone behaves as this build of
  WebKit does. Until `shader.js` is fixed and seen on an iPhone, the safe placement is one live layer per
  screen; leaving the layer out of a band costs nothing (its still is this folder's CSS).
- **Not run on a real iPhone, or in a Safari older than 26.** WebKit 26.6 (Playwright's build of Safari's
  engine, on Linux) passes at 390 and 1440 on the pricing copy, the demo and the bare page. Older Safari lacks
  some things, each with a plain result: the name's rise (Safari 26: the name rests in place), the sky's glow
  (`:has()`, 15.4), the phone composition of the skyline (container queries, 16: the drawing keeps its desktop
  composition, cropped from the right), the folds and the dusk (`color-mix()`, 16.2: flat block, plain sky),
  balanced lines (17.5). The gold line under the number is written as longhands, which every Safari takes.
- **No screen reader was run.** Roles, names, order and states were checked by script.
- **At 1280 by 720 the footer is 30px taller than the screen under the sticky header** (678px against 648px).
  At 1440 by 900 it fits with 127px to spare.
- **The card layout is still the long band on a phone**: 772px at 390 (today's band: 503px). The pricing page
  is 230px longer than today's there (10,608px against 10,378px); with the strip it would be 87px shorter.
- **Frame times were taken on a shared machine with software rendering, never on a phone.** At 4x throttle no
  frame of 1,850 ran over 34ms on the kit's page in the last run, and 2 of 1,857 in the run before (today's
  page: 1 of 1,837, and 0 of 1,851). Medians and p95 are 16.7 to 16.8ms throughout (section 7).
- **Over the live shader the lowest text is 4.77:1** (the small "Or call" in the band's grey-blue, light
  theme). It passes AA, and the floor is `shader.js`'s guard (4.6), which holds whatever colours the text has.
- **The kit's button is drawn to match `.btn`**, not built from it. If `.btn` changes, `btn.css` needs the same
  change. Its hover tone on the blue band is a shade of cream; the site's own primary button turns gold there.
- **Descenders cross the brush.** With "free call" nothing does. With "your quote" the tails of y and q pass
  in front of the gold stroke.
- **The pause button is far from the band's moving background on its own** (the band is the last section, the
  button is in the legal row under the footer's columns). The light group's notes ask the chrome owner to put
  the same pill in the top strip and the phone menu; that is not part of these partials.
- **Integration is not done.** Every page's `.cta-band` section must be rewritten to the new markup, the shared
  rules in section 6 removed, the one line of `main.js` changed, and a check added to `tools/behaviour.js`.
  `tools/sync_chrome.py` itself was not run; its footer pattern takes each partial whole.
- **Where the CSS lives is undecided** (section 6): folded into `styles.css` it fits the 140 KB limit only
  until anything else is added.
- Nothing in the repository was changed.

## 10. The screenshots

In `shots/` (all retaken after the fix pass; the first version's are gone).

- **The end of a real page on one screen**: `screen-end-1440x900-light` and `-dark`, `screen-end-1280x720-light`,
  `screen-end-390x844-light` and `-dark`.
- **Real pages with the kit in place**, band and footer whole: `pricing-end-` at 360, 390, 700, 820, 1100, 1440
  and 1920 (light, and dark at 390, 820, 1440), plus `-script-off` and `-reduced-motion`; `start-end-` (slim
  footer with script); `notfound-` (slim footer, no script).
- **The three bands by themselves**: `band-strip-`, `band-card-`, `band-statement-`, each `-still` (CSS only)
  and `-live`; `band-card-820-` and `band-card-700-` (the tablet layouts); `band-statement-360-`.
- `card-alone-`: the card on paper. `slim-start-`, `slim-bare-`: the slim footers. `client-brand-`: the green and
  cream palette inside the site; `portable-end-`: the brick-red brand on the bare page.
- **The scene**: `scene-1440-light`, `scene-1440-dark`, `scene-1440-dark-glow-far` (the glow at its far point),
  `scene-phone-360`, `-390`, `-430` (the phone composition), `rise-390-1` to `-3` (the name coming up behind
  the rooftops as the last 100px scroll in).
- **States**: `states-light.png` (rest, hover, pressed, focus for each pressable thing, one row each),
  `focus-` crops of the rings.
- **Other engines**: `other-webkit-` and `other-firefox-`, each `-pricing-`, `-bare-` and `-demo-` at 390 and
  1440 (`-band` and `-end`); `mark-three-engines.png` (the brush and the full stop at phone widths, a short
  phrase and two long ones; Chromium, WebKit, Firefox).
- **The fault found in the kit's shader**: `webkit-shader-fault-light-demo.png`, `webkit-shader-fault-this-kit.png`
  (section 9).

## 11. The review, issue by issue

What each reviewer asked for, and what was done. "Fixed" means changed, looked at and measured (section 7).

| # | Issue | Outcome |
| --- | --- | --- |
| 1 | **Major.** The footer never fits one screen | **Fixed.** One row from 1100px, 32px rows with a mouse, 32px gaps, 48px top; the scene is 203px at 1440. 701px at 1440 by 900 (asked: 800 or less), 1,099px at 390 (asked: 1,150 or less). The hours have no target's height, the sentence is left out below 600px, Areas is one wrapping row on a phone, the name is gone from the lockup. Not taken: capping the name at 12rem (it does not bind at 1440, and at 1920 the full-width name is the point; the footer is 769px there) |
| 2 | **Major.** Card layout, 600 to 979px, not designed | **Fixed.** Card beside the copy from 760px (`minmax(0,1fr) 20rem`), filling the column from 600 to 759px with the second button full width under it. 503px tall at 820 |
| 3 | **Major.** Pause icon off centre; no visible word | **Fixed.** The button is the kit's labelled pill now ("Pause motion" / "Play motion"), last in the row after Back to top; the footer's 44px rule only matches links and spans. Checked: icon within 1px vertically, pill padding even, and the round one in the demo header within 1px both ways |
| 4 | **Major.** Nothing run in WebKit; thickness in the `text-decoration` shorthand | **Fixed, as far as this machine allows.** Longhands everywhere. WebKit 26.6 now launches here: band, card, footer, scene, masks, container units, the two-up list and the scallops pass at 390 and 1440. A real iPhone and older Safari remain to be looked at (section 9) |
| 5 | Minor. Kit buttons are not the site's: no tone on hover, no sink under the pointer, no focus rule | **Fixed.** `btn.css`: one button for band, card and footer, with a deeper fill on hover, `:active` after `:hover`, and a 3px ring |
| 6 | Minor. The name behind the skyline is timid; no warm horizon | **Fixed.** Gilt at the top edge running to cream, 68% at the top, fading at the rooftops; lifted on phones (95% of the letters' height clear of the usual roofline); a warm band low between the buildings |
| 7 | Minor. "Consulting & automation" pushes the Services rows off the Company rows | **Fixed.** Link line-height 1.3: two lines fit the 44px row. Largest difference between row centres 0.5px at 360, 390 and 820 |
| 8 | Minor. Number hover: none on the band, a 4px slab in the footer | **Fixed.** A 2px gold line at .2em on every footer link on hover; the band's line (always there) drops to .34em |
| 9 | Minor. The stroke should be the site's brush | **Fixed.** A gilt-coloured mask: `--kws-mark`, then the site's `--brush`, then a plain taper |
| 10 | Minor. Card band too long on a phone; says "discovery call" three times | **Fixed.** No kicker in the card layout; 772px at 390 (asked: 780 or less). The phone bar hides over the band once `main.js` has its one line (issue 13) |
| 11 | Minor. Slim footers repeat the big number | **Fixed.** They lead with the name and place in the display face; number and email at body size |
| 12 | Minor. Strip: right column pinned to the top | **Fixed.** Centred against the copy as one block |
| 13 | Minor. Phone crop of the skyline; the flat join between band and footer | **Fixed.** A phone composition of the drawing (Capitol 69px in, one whole bridge tower in frame); a 2px gilt hairline at the band's foot |
| 14 | **Major** (engineer). The phone bar no longer hides over the band | **Cannot be fixed in this folder; made exact.** It is one line of `main.js` (section 6). The test pages run a copy of `main.js` with that line, and a check proves the bar hidden at three band positions. `tools/behaviour.js` is outside this folder: the check to add is described there |
| 15 | Minor. No focus rule on band and card | **Fixed** (`btn.css`, and the band's number has its own gold ring) |
| 16 | Minor. Buttons animate under reduced motion on a client page | **Fixed.** The transition is inside `prefers-reduced-motion: no-preference`; 0s measured on the bare page |
| 17 | Minor. Long words and long marked phrases widen the page | **Fixed, differently.** `overflow-wrap: anywhere` (inside flex and grid items `break-word` does not let a word give way). For the mark, the reviewer's inline-block below 600px was tried and dropped the full stop onto its own line in Firefox at 350px; the mark now holds an inner span and its punctuation instead. 27 long-word cases at 320, 360 and 390 and 62 widths of full-stop checks pass, in three engines |
| 18 | Minor. A text-only logo is squeezed to 48px | **Fixed** (`.kws-foot-logo > :is(svg, img)`); a name alone is one line, 185px wide |
| 19 | Minor. Forced colours: card and its button lose their edges | **Fixed.** Transparent borders on both |
| 20 | Minor. Logo cannot wrap with text at 200% | **Fixed.** No kit element runs off the screen with text at 200% at 390, 760 and 1280 (the lockup has no name now; a client's name wraps) |
| 21 | Minor. Gold kicker passes AA by a hair over the live shader | **Fixed on this side.** The kicker's words are cream; only its rules are gold, so no small gold text sits on the band. The lowest text over the live band is now the small "Or call" at 4.77:1: that floor is the shader's guard, which this folder cannot move |
| 22 | Minor. Safari: the shorthand; the rise has no duration | **Fixed.** Longhands; `1ms` nominal duration. The rise runs in WebKit 26.6 |
| 23 | Minor. One pause control, far from the band | **Skipped here, on purpose.** A second button inside the band would sit beside the page's main button. The light group's placement (top strip and phone menu as well as the footer) answers it and belongs to the chrome owner. Hiding the button when nothing moves was declined by the light group (their notes) |
| 24 | Minor. "Shared rules replaced" stale; test copies log 404s | **Fixed.** Named by selector; `.cta-copy p`, the city rules and `main.js` added; test pages rebuilt from today's repository (no failed requests) |
| 25 | Minor. Kicker wraps and strands its rules | **Fixed.** `text-wrap: balance`, and the rules are inline, so they stay with the words |
| 26 | Minor. The whole kit does not fit the 140 KB stylesheet | **Not this folder's to decide; costed.** Section 6 gives the numbers and a recommendation |
| 27 | Minor. Raw values | **Partly.** The three durations are `var(--t-fast, .16s)` now (one, in `btn.css`). The black mixes and plain sizes stay, as the reviewer allows |
