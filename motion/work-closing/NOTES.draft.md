# Motion kit: the closing band and the footer

The end of every page. Hand-written for knightwebstudio.com; nothing here is copied from a library or
another site. Five small stylesheets, no script of their own, and four proposed chrome partials.

| File | What it is | Size |
| --- | --- | --- |
| `btn.css` | The button the band, the card and the footer share (`kws-btn`) | @@btn@@ bytes |
| `closing.css` | The closing band, three layouts (`kws-close`) | @@closing@@ bytes (budget 3,500) |
| `appt.css` | The appointment card with the booking button on it (`kws-appt`) | @@appt@@ bytes |
| `footer.css` | The footer and its slim form (`kws-foot`) | @@footer@@ bytes |
| `skyline.css` | The town at night that ends the footer (`kws-skyline`) | @@skyline@@ bytes |
| `footer.inc`, `footer-start.inc`, `footer-bare.inc`, `skyline.inc` | Proposed replacements for the partials of the same names in `tools/chrome/` | @@inc@@ bytes |
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
- **The footer is one grid and much shorter.** @@foot1440@@px at 1440 (it was 1,071px) and @@foot390@@px at
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

Heights, for choosing (today's band is @@old390@@px at 390 and @@old1440@@px at 1440):

| Width | Strip | Statement | Card layout |
| --- | --- | --- | --- |
| 360 | @@strip360@@ | @@state360@@ | @@card360@@ |
| 390 | @@strip390@@ | @@state390@@ | @@card390@@ |
| 820 | @@strip820@@ | @@state820@@ | @@card820@@ |
| 1440 | @@strip1440@@ | @@state1440@@ | @@card1440@@ |

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
- Heights: @@foot390@@px at 390 and @@foot360@@px at 360 (today's: @@oldfoot390@@px); @@foot820@@px at 820;
  @@foot1280@@px at 1280; @@foot1440@@px at 1440 (today's: @@oldfoot1440@@px, with no scene); @@foot1920@@px
  at 1920. At 1280 by 720 it is @@over1280@@px taller than the screen under the sticky header. The slim footer
  is @@slim390@@px at 390 and @@slim1440@@px at 1440.

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
tower is always in the frame (@@tower390@@px in from the right at 390) and the far span leaves the picture on
the rise. The name is lifted so that @@clear390@@% of its letters' height stands clear of the usual roofline.

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

and name `.kws-close` in the comment above it. The pages load `main.js?v=2`: raise that number when the file
changes. `test/main.patched.js` is the repository's file with exactly that change (rebuilt from the repository
each time the test pages are built), and the test pages run it: with it the bar is hidden with the band 15%, 50% and 100% of the way up
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

**Where the five files go: the budget.** `styles.css` is @@site@@ KB as this is written (it is still growing) against the brief's 140 KB. These five
files are @@total@@ KB; with the 3.4 KB above gone, folding them in would bring it to about @@folded@@ KB, and
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

@@MEASUREMENTS@@

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

@@NOTRIGHT@@

## 10. The screenshots

@@SHOTS@@

## 11. The review, issue by issue

@@LEDGER@@
