# Motion kit: cylinder slider and carousel ring

Two carousels with depth, built with CSS 3D transforms (no WebGL, no library). Hand-written for
knightwebstudio.com; nothing here is copied from another site or a component library. Both are ordinary
HTML first: the cylinder is a list of cards, the ring is four short lists.

| File | What it is | Size |
| --- | --- | --- |
| `cylinder.css` | The drum of story cards: styles | 3,491 bytes (budget 3,500) |
| `cylinder.js` | The drum: behaviour | 7,816 bytes (budget 8,000) |
| `ring.css` | The rotary card file and its lists: styles | 3,495 bytes (budget 3,500) |
| `ring.js` | The card file: behaviour | 7,424 bytes (budget 8,000) |
| `demo.html` | Both in realistic sections on the real stylesheet, then again in a client palette | `http://localhost:8730/kit/depth/demo.html` |
| `test/bare.html` | Both on a page with no site stylesheet, no site script and a third palette | proof that the kit stands alone |
| `test/one-ring.html` | One ring on a page with the site stylesheet | used for the frame-time measurements |
| `test/` | The checks behind every claim in this file | `sh test/run-all.sh` runs them all and writes `test/results.txt` |
| `shots/` | Screenshots that were taken and looked at | |

`demo.html` and `test/bare.html` are written by `python3 test/build-demo.py` from the two `*.template.html`
files, so the five story cards and the thirty list lines are typed once. The four component files are
plain source with no build step. The two stylesheets are within a few bytes of their budget: to add a rule,
take one out first.

## What the page must provide

- **`html.js` before first paint.** The site's head snippet adds class `js` to `<html>`. The kit uses it to
  hold each component's space before its script runs, so nothing moves when the script upgrades the markup
  (measured: layout shift 0.0000). On a page without that class both components still work, but the page
  shifts once when they start. A client site needs one line in the head:
  `<script>document.documentElement.classList.add('js')</script>`.
- **`box-sizing: border-box`** on everything (the site's reset, or a utility framework's base layer).
- **The pause switch** is `html[data-motion="off"]`. Both scripts read it every time they are about to move,
  so there is nothing to register. `prefers-reduced-motion: reduce` is treated the same way.
- Neither script needs `main.js` or any class the site defines. The only global is `window.KWS`.

## Theme: the kit variables

Neither stylesheet contains a colour, and neither names a site token without a kit variable in front of it.
On knightwebstudio.com nothing needs setting; day, night and the tone scopes (`.on-blue`, `.on-ink`,
`.on-paper`) work because the fallbacks are the site's own tokens.

| Kit variable | Falls back to | Used for |
| --- | --- | --- |
| `--kit-bg` | `--paper` | The well behind a story card's picture; the blank backs of ring cards |
| `--kit-surface` | `--card` | Story cards, arrow buttons, index cards, the four list cards |
| `--kit-ink` | `--ink` | Titles, prices, card words, the arrows |
| `--kit-muted` | `--ink-2` (text), `--ink-3` (dots) | Body text, the label line, list lines, resting dots |
| `--kit-line` | `--line-2` (edges), `--line` (ruled lines), `--paper-3` (the Example flag) | Hairlines, ruled lines, the flag's fill |
| `--kit-accent` | `--blue` (the current dot), `--focus` (the focus ring) | The only blue: things you press |
| `--kit-notice` | `--brick` | The step numeral; the red rule on every index card |
| `--kit-radius` | `--r-md` (story cards); index cards use at most 0.3rem of it | Corners |
| `--kit-font-display` | `--font-display` | Titles, numerals, prices, card words |
| `--kit-font-body` | `--font-text` | Everything else |
| `--kit-shadow` | `--shadow-2` (story cards, the card stood up), `--shadow-1` (list cards) | Shadows |

Not read by these two components: `--kit-accent-ink`, `--kit-gilt`, `--kit-shader-1` to `-3` (nothing here
is a filled accent surface, gold, or a shader).

Layout tokens with plain fallbacks: `--gap`, `--gutter`, `--maxw`. Two knobs of the kit's own:
`--w` (card width; set it on `.kws-cyl` or `.kws-ring-stage`) and `--kws-top` (how far below the top of the
window the ring sticks from 980px; default `5.5rem`, set it to the height of the sticky header).

Checked on a palette: the Example flag is ink on the line colour, and a neighbouring story card is shown at
78% strength. With this site's tokens both stay above 4.5:1. With a client palette, check those two.

Proof: the last band of `demo.html` sets the eleven variables above (plus the two unused ones) to a dark
green and cream brand with a book serif and Trebuchet, square corners and a harder shadow. `test/bare.html`
is a third brand (cream and brown, slab serif, 18px corners) with no site stylesheet at all.

---

## 1. Cylinder slider (`cylinder.css`, `cylinder.js`)

**What it is.** Cards standing on the outside of a wide, shallow drum. The card in the middle faces you,
flat and sharp (at rest it carries no transform at all); the cards to each side turn away by 17 degrees a
step and fade to 78%, then 56%. It turns by drag, swipe, the two arrows, the dots and the arrow keys, and
settles with a soft spring. It never turns by itself.

**On knightwebstudio.com.** One missed call followed through to the review, as five moments: the story the
home page tells as a route, in a form that fits the Consulting page (the placement plan puts it there).
Each card is a paper card: a brick step numeral, the service and its fixed setup price, the moment as a
heading, a small drawing marked "Example", and one or two plain sentences.

**Which businesses it suits.** Anything that is a short sequence a customer goes through: how a job runs
(call, quote, visit, invoice), how an order is made (a bakery's custom cake, a print shop's proof), a
before-and-after sequence for a cleaner or a landscaper, the stages of a kitchen fit. Three to seven cards.
It does not suit a set of unrelated things (use a grid) or more than about seven (use a list).

### Markup to copy

```html
<!-- Outside the .container on purpose: the drum runs the full width of the page -->
<section class="kws-cyl" data-kws="cylinder" data-noun="step" aria-label="One missed call, followed through to the review">
  <ol class="kws-cyl-track">
    <li class="kws-cyl-card">
      <p class="kws-cyl-tag"><b aria-hidden="true">1</b>Missed-call text-back · $750 setup</p>
      <h3 class="kws-cyl-title">You can't pick up.</h3>
      <div class="kws-cyl-art">
        <span class="kws-cyl-eg">Example</span>
        <!-- any drawing or picture; on this site, the shared mock parts: .notice, .thread, .cal, .leads -->
      </div>
      <p class="kws-cyl-text">You're on a job, up a ladder or with a customer. The phone rings out.</p>
    </li>
    <!-- more cards -->
  </ol>
</section>
```

- The root is a `<section>` with an `aria-label` (or `aria-labelledby`). The list may be `<ol>` or `<ul>`.
- The heading in each card (`h2`, `h3` or `h4`) names its dot: "Step 2 of 5: Within a minute, they get a text."
- `.kws-cyl-tag`, `.kws-cyl-art`, `.kws-cyl-eg` and `.kws-cyl-text` are all optional. A card can hold a
  link; it takes the page's own link style.
- Every card takes the height of the tallest one, so keep them alike. In the demo the drawings are 151 to
  237px tall and the texts two to five lines; the card is 558px tall on a 390px phone, 534px at 1440.
- Put it straight inside the section, not inside the container, so the side cards run to the edges of the
  window. With no script the list holds itself to `--maxw` with `--gutter` at the sides.

### Attributes and options

| On the root | From code | Default | What it does |
| --- | --- | --- | --- |
| `data-noun="step"` | `noun: 'step'` | `slide` | The word in the names: "Next step", "Step 2 of 5: ..." |
| `data-start="2"` | `start: 2` | `0` | Which card starts in the middle (counted from 0) |
| `data-loop="false"` | `loop: false` | loops when there are 3 or more cards | Stop at the first and last card; the arrow at the end is marked `aria-disabled` |
| `style="--w: 20rem"` | | `min(78vw, 21.5rem)` | Card width |

The script adds `.kws-cyl-ctl` (holding `.kws-cyl-nav`, `.kws-cyl-dot` buttons) and `.kws-cyl-sr` (the live
region), and classes `is-live`, `is-moving`, `is-held` on the root and `is-on` on the middle card.

### The states

| | What a visitor gets |
| --- | --- |
| Script off | A grid of all the cards: one column on a phone, two from 700px, three from 1070px. Nothing hidden, no dead buttons. |
| Before the script arrives (`html.js`) | The first card where it will stay, with the height of the tallest card and the row for the controls already held. If the script has not come after 4 seconds the rest appear below it as a column. |
| Running | The drum. |
| Under 380px wide, or no 3D transforms | The same carousel as a flat sliding row: no rotation, same controls. |
| Reduced motion, or motion paused | Arrows, dots and keys land on the card at once. A swipe steps one card when the finger lifts; nothing follows the finger. |

### Getting about

- Drag with a mouse or pen, swipe with a finger. Only a clearly sideways move is taken (6px of travel and
  more sideways than up or down); `touch-action: pan-y` leaves vertical scrolling to the browser. A flick
  carries at most to the next card. There is no wheel listener.
- A click that ends a drag follows no link. A click on a card at the side brings it to the middle and does
  not follow its link; the same click on the middle card does.
- Left and right arrows, Home and End whenever focus is inside (not while typing in a field). Up and down
  are left to the page.
- Tab order: any links in the cards, then previous, a dot per card, next. Tabbing to a link on a card at
  the side brings that card to the middle. Focus is never trapped; the ring is 3px in the accent colour
  (on this site the `--focus` token, so gold on blue grounds and at night).
- Every control is a real `<button type="button">`, 44 by 44px, with a name.

**Screen readers.** The section gets `aria-roledescription="carousel"`; it stays a list, and each item gets
`aria-roledescription="slide"` and `aria-label="2 of 5"`. All cards stay in the reading order, so the whole
story can be read straight through without operating anything. A polite live region says the card in
focus ("Step 2 of 5: Within a minute, they get a text.") after the visitor moves it with a button, a dot, a
key, a drag or a click; it is silent on load and when focus alone moves the drum (the focused link is
already announced). The script removes all of this again when it is unmounted.

### Honest content on this site

- The five headings are the brief's. The label line is the service the moment belongs to and its fixed
  setup price exactly as published ($750, $750, $1,500).
- The drawings are the site's shared mock parts and follow the mock rules: "[your business]", everyday
  trade wording, no names, no stars, nothing blue. Each sits under an "Example" flag (`.kws-cyl-eg`, the
  kit's own, so the flag also exists on a client site).
- Under the drum, keep the credit line: "... Illustrations, not real conversations."
- Card 1's sentence is new microcopy and states no fact. Every other sentence is the home page's.
- In a narrow card the calendar's new slot says "New" and "Booked online" sits in the log line beneath:
  the two-word label is wider than a day column at this size.

---

## 2. Carousel ring (`ring.css`, `ring.js`)

**What it is.** A rotary card file seen from above at an angle. Every line of the lists beside it becomes a
small paper index card with a red rule and a tab, standing on a tilted ring. The ring turns slowly as the
page scrolls past it (0.1 degree a pixel: one card about every 120px) and by a sideways drag, with a little
coast. The card at the front stands up out of the file, squares up to the reader and takes a shadow; the
cards on the far side show blank backs. From 980px the ring sits beside the lists and stays in view while
they scroll past.

It is decoration that tells the truth. The stage is `aria-hidden` and holds nothing focusable; the lists are
the content, for everyone. Each card is filed under the list it came from (the tab says which).

**On knightwebstudio.com.** "Everything a build includes": the four website packages, each as an index card
(name on the tab, fixed price, its lines on ruled paper), and the same thirty lines on the ring. The lines
are the rows of the package table on `/pricing/`: size, design, what is included, support.

**Which businesses it suits.** Anyone whose offer is a long list of small true things: what a service visit
covers, what is on the van, the makes a garage works on, the treatments a salon offers, what is in each
cleaning package. Eighteen to forty items; under a dozen it looks thin. It does not suit things people must
choose between by reading (the list does that job) or anything with pictures.

### Markup to copy

```html
<div class="kws-ring" data-kws="ring">
  <div class="kws-ring-stage" aria-hidden="true"></div>   <!-- stays empty: the script fills it -->
  <div class="kws-ring-lists">
    <div class="kws-ring-group">
      <h3 class="kws-ring-name">Starter</h3>              <!-- also the words on the cards' tabs -->
      <p class="kws-ring-price">$2,000</p>                 <!-- optional -->
      <ul>
        <li>Up to 5 pages</li>
        <li data-short="Copy editing and polish">Copy editing and polish (you supply the text)</li>
        <!-- more lines -->
      </ul>
    </div>
    <!-- more groups -->
  </div>
</div>
```

- Every `<li>` inside the root becomes a card, in order. Groups are optional: a single plain `<ul>` works,
  and so does a root with no `.kws-ring-stage` (the script makes one, but then the space is not held).
- Tabs sit at four positions, one per group in turn, so each package reads as a section of the file.
- The lists are two columns on a phone, four from 760px, and two beside the ring from 980px.

### Attributes and options

| In the markup | From code | Default | What it does |
| --- | --- | --- | --- |
| `data-speed=".1"` on the root | `speed: .1` | `.1` | Degrees turned per pixel scrolled |
| `data-tilt="24"` on the root | `tilt: 24` | `24` | How far the ring is tipped towards you, in degrees |
| `data-short="..."` on an `<li>` | | the line's own words | Shorter words for the small card; the list keeps the full line |
| `data-tab="..."` on a group | | the text of `.kws-ring-name` | The words on that group's tabs |
| `style="--w: 9rem"` on the stage | | `7.6rem`, `11rem` from 760px | Width of the card that stands up |
| `--kws-top` | | `5.5rem` | Where the stage sticks from 980px |

The script adds `.kws-ring-hub` holding `.kws-ring-card` (each with a `.kws-ring-tab`), classes `is-live`
and `is-moving` on the root, and `is-front`, `is-right`, `is-back` on cards.

### The states

| | What a visitor gets |
| --- | --- |
| Script off | The lists as index cards. No stage, no gap. |
| Before the script arrives (`html.js`) | The lists, with the stage's space held empty. |
| Running | The ring. It only works while it is on screen: off screen no frames are asked for and its cards are not kept as layers. |
| Under 380px wide, or no 3D transforms | The lists only. |
| Reduced motion, or motion paused | A still ring with one card stood up. No scroll link, no drag, no transitions, and the cursor is the ordinary one. When motion is switched back on it carries on from where it stood. |

Screen readers and keyboards get the lists and nothing else; there is nothing in the ring to reach.

### Honest content on this site

- All thirty lines are in the package table of `pricing/main.html`, under the package named on the tab. A
  line that two packages share appears under both, as it does in the table.
- Wording is the table's, with four things to know: "Custom design, 1 revision round" and "Up to 3 design
  rounds, plus a final tweaks round" are each two lines ("Plus a final tweaks round" keeps the table's
  words); support reads "14 days of support" as on `/start/` (the table says "Support: 14 days"); and two
  cards use the short forms "Copy editing and polish" and "Copywriting" while the lists keep "(you supply
  the text)" and ": we draft, you edit".
- The four prices are the fixed prices. No add-ons and no care-plan lines are on the ring: they are not
  part of a build.

---

## Mounting from code, and from React

Both scripts start themselves on `[data-kws="cylinder"]` and `[data-kws="ring"]` when the page has loaded.
For anything added later:

```js
const off = KWS.cylinder.mount(element, { noun: 'step', start: 0, loop: true });
const off2 = KWS.ring.mount(element, { speed: .1, tilt: 24 });
off(); off2();   // each takes away everything it added: listeners, observers, buttons, cards, classes, attributes
```

Mounting the same element twice returns the same remover. Any number can be on one page. If an element is
simply removed from the page, nothing is left behind (tested: 40 made and removed, 0 alive after garbage
collection, no extra listeners on the window).

```jsx
import { useEffect, useRef } from 'react';
import './kit/cylinder.css';
import './kit/cylinder.js';   // sets window.KWS.cylinder; importing it twice is harmless

export function Steps({ steps }) {
  const ref = useRef(null);
  useEffect(() => window.KWS.cylinder.mount(ref.current, { noun: 'step' }), [steps.length]);
  return (
    <section ref={ref} className="kws-cyl" aria-label="How an order goes">
      <ol className="kws-cyl-track">
        {steps.map((s, i) => (
          <li className="kws-cyl-card" key={s.title}>
            <p className="kws-cyl-tag"><b aria-hidden="true">{i + 1}</b>{s.label}</p>
            <h3 className="kws-cyl-title">{s.title}</h3>
            <div className="kws-cyl-art">{s.picture}</div>
            <p className="kws-cyl-text">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

The ring is the same with `window.KWS.ring.mount(ref.current)` on the `.kws-ring` root. Two things to keep
in mind in React: leave `data-kws` off (you are mounting it yourself), and let the script own what it adds.
It appends the controls and the live region inside the cylinder's root, puts `is-on`, `aria-label` and
inline styles on the cards, and fills the ring's empty stage; so render the stage with no children, and
remount (the effect's dependency) when the number of cards or lines changes. The effect's cleanup is the
remover, so strict mode's double run is fine.

## What was measured

Everything below is in `test/results.txt`; `sh test/run-all.sh` writes it again. Chromium 153 (Playwright's
build), plus Firefox 155 where noted. 77 checks pass, none fail; WebKit could not be run.

- **Contract** (`test/contract.js`, 65 checks): structure and names; arrows, dots, keys, Home and End; Tab
  walks out in seven presses; focus on a side card's link centres it (offset 0px); click and drag rules for
  links; reduced motion and paused motion (0 animation frames asked for in the whole run; the ring's
  transforms unchanged through scrolling and dragging; it resumes without a jump); touch (a vertical swipe
  on either component scrolls the page 185 to 307px; a sideways swipe turns it and the page moves 0px); no
  frames while idle or off screen; no wheel listener; mount, remount and remove; 360px and no-3D fallbacks;
  script off; heights equal before and after the upgrade at 390, 820 and 1440.
- **Sideways scroll** (`test/widths.js`): none from 360 to 1920px in 20px steps, with scripts on and off,
  on the demo and the bare page.
- **Layout shift** (`test/cls.js`): 0.0000 at 390, 820 and 1440 with the kit scripts held back 1.2 seconds
  so the page paints before they upgrade it.
- **Contrast** (the site's `tools/contrast.js`): all text passes AA in both themes at 1440 and 390,
  including the client band. **Small text and targets** (`tools/smalltext.js`): nothing under 12px, no
  target under 44px.
- **Leaks** (`test/leak.js`): 40 components made, used and removed; 0 alive after garbage collection;
  scroll listeners on the window 3 before, 3 after.
- **Firefox 155** (`test/other-browsers.js`): mounts, arrows, drag, keys, scroll-linked turning and drag on
  the ring all pass at 390 and 1280. The held state and the 4 second fallback match Chromium to the pixel.
- **Frame times at 390x844, CPU throttled 4x** (`test/perf.js`, `test/perf-page.js`; a frame at full rate
  is 16.7ms). The figures first are the run in `test/results.txt`; the ranges are every run of the day. The
  machine was shared with other jobs (load average 1.4 to 7), and the ring's figures move with that.
  - Cylinder, next button: 44 frames, mean 16.7ms, 95th 16.8ms, worst 16.8ms, none over 33ms. The same in
    every run.
  - Cylinder, touch drag and settle: 118 frames, mean 16.7ms, 95th 16.7ms, worst 16.8ms. Across runs the
    mean was 16.7 to 16.9ms; one run in six had a single frame of 33 to 50ms. Script per frame: 0.2 to 0.4ms.
  - Ring, sideways drag and coast: 166 frames, mean 18.7ms, median 16.7ms, 95th 33.4ms, five over 33ms.
    Across runs: mean 16.7 to 18.7ms, 95th 16.7 to 33.4ms.
  - Ring, two finger swipes that scroll the page past it: the median frame is 16.7ms in every run. Mean on
    a page with one ring: 17.8 to 21.4ms in the results file (95th 33ms, two to ten frames over 33ms in
    about 115); 16.8 to 19.1ms in the quietest runs (95th 16.8ms, none to four over 33ms); 22.6ms at the
    worst. On the demo page, which has two rings and two cylinders mounted: 18.2 to 20.2ms in the results
    file, 17.5 to 28.4ms across runs. Unthrottled: mean 16.7 to 17.6ms, 95th 16.8ms.
  - So the cylinder is smooth at a 4x throttle; the ring keeps a full-rate median but drops some frames.
    Its own script is small (0.1ms a frame unthrottled, 0.3 to 0.45ms throttled) and the main thread has
    room (`test/trace.js`: 5.5ms of work per frame on the one-ring page, 8 to 12ms on the demo page,
    against 16.7ms). The frames that slip are spent waiting on the compositor, which in this headless
    browser draws thirty turning cards in software; a phone's graphics chip does that part.
  - `will-change` is set only while the cylinder is moving and is `auto` at rest. The ring sets none, and
    keeps its thirty cards as layers only while it is on screen.

## Decisions

- **The ring is one write a frame.** The cards ride inside one element that turns; a card is touched only
  when it changes sides, turns its back or stands at the front. The first version gave every card its own
  transform each frame (30 writes): it measured slower (mean 17.9 to 19.4ms against 16.9 to 17.9ms on the
  same page in the same session) and was replaced.
- **Cards are laid out at twice their size and scaled down.** Chrome draws text softly inside a nested 3D
  scene at high pixel densities; at double size the cards are sharp on 2x screens. Firefox does not need
  it and is unaffected.
- **Nothing sticks out of a ring card's box.** The tab is inside the card's own box and the paper is drawn
  under it, because Chrome clipped anything above a 3D card's top edge.
- **The card at the front is lifted clear** (0.38 of its width outwards) so the leaning tops of its
  neighbours cannot cut through it; and it is turned exactly to face the reader, wherever the ring stopped.
- **Backs are blank by taking the words off**, not by hiding them: no see-through text for a contrast audit
  to trip on, and nothing mirrored.
- **The far side of the ring uses one twist** so cards never cut through each other; as a card rounds the
  right-hand corner it swings over in 0.4s.
- **The drum loops.** Five moments read as a wheel (the review brings the next call) and the drum looks
  complete with cards on both sides of step 1. `data-loop="false"` gives a strip with two ends.
- **A neighbouring card is 78% strong, not fainter**, so its text is still readable (measured on the sand band: 4.77:1 by
  day, 5.71:1 at night for body text; titles 7.9:1 and 8.6:1). The depth comes from the turn.
- **A click on a side card never follows a link.** Links on a turned, faded card are easy to hit by
  accident; the first click brings the card round.
- **Reduced motion: a swipe steps on release.** Nothing follows the finger, because following is movement.
- **Before the script, the other cards are held out of sight for at most 4 seconds** by a CSS animation
  that needs no script to end, so the drum's space is exact and a failed script still leaves every card
  readable.
- **Under 380px** the drum is flat and the ring gives way to its lists, as the brief asks.
- **Ring content.** Thirty cards, the package table line by line, repeats included: a card file has a card
  in each section it belongs to. Prices are on the list cards because every price here is fixed.
- **No rim line, no reflections, no auto-turn.** The ring moves only with the page or a hand.

## Known limits

- **Safari is untested here**: WebKit cannot be launched on this machine (system libraries missing). The
  features used are ordinary (`perspective()`, `preserve-3d`, `aspect-ratio`, `inset`, `:is()`, `min()`,
  `overflow: clip` with `hidden` before it, pointer events, `ResizeObserver`, `AbortSignal` on listeners:
  Safari 15 or later). Look at both on an iPhone before launch; depth sorting of the ring's cards is the
  part to check.
- **The site's `tools/widths.js` reports the drum** ("element +N ... kws-cyl-card"): it flags anything past
  the right edge and does not know the side cards are clipped by `.kws-cyl-track` (`overflow: clip`). The
  page itself is `+0` at every width. `test/widths.js` here makes the same sweep with that rule added.
- **Ring frame times under a 4x throttle are not perfect** in this environment: see the numbers above. The
  median is a full frame rate, but between 2 and 10 frames in about 115 double on a page with one ring,
  more when the machine is busy. It has not been timed on a real phone.
- **On a 3x phone in Chrome the ring's small side cards are slightly soft** (they are drawn at 2x). The
  front card reads cleanly. Laying cards out at 3x would fix it at 2.25 times the memory.
- **Firefox orders the far cards slightly differently** from Chrome (it sorts whole cards, Chrome splits
  them where they would cross). Both look right; they are not pixel-identical.
- **Equal heights.** The drum is as tall as its tallest card. One long card makes every card long.
- **Without `html.js`** the page shifts when the components start.
- **The ring needs 3 or more lines**, and looks its best with 18 to 40. Tab positions repeat after four
  groups. Very long lines need `data-short`: a card holds about three short lines.
- **The sticky ring** (980px and up) assumes a header about 5.5rem tall; set `--kws-top` otherwise.
- **The client band in `demo.html` re-points a few site tokens** for the drawings inside the story cards,
  because those drawings are the site's parts, not the kit's. On a client site that slot holds the
  client's own picture; `test/bare.html` shows it with a plain placeholder.
- **Text in a card cannot be selected** while the drum is live (`user-select: none`, so a drag does not
  paint a selection).
