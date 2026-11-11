# Motion kit: cylinder slider and carousel ring

Two carousels with depth, built with CSS 3D transforms (no WebGL, no library). Hand-written for
knightwebstudio.com; nothing here is copied from another site or a component library. Both are ordinary
HTML first: the cylinder is a list of cards, the ring is four short lists.

| File | What it is | Size |
| --- | --- | --- |
| `cylinder.css` | The drum of story cards: styles | 3,485 bytes (budget 3,500) |
| `cylinder.js` | The drum: behaviour | 7,995 bytes (budget 8,000) |
| `ring.css` | The rotary card file and its lists: styles | 3,493 bytes (budget 3,500) |
| `ring.js` | The card file: behaviour | 7,991 bytes (budget 8,000) |
| `demo.html` | Both in realistic sections on the real stylesheet, then again in a client palette | `http://localhost:8730/kit/depth/demo.html` |
| `test/bare.html` | Both on a page with no site stylesheet, no site script and a third palette | proof that the kit stands alone |
| `test/one-ring.html` | One ring on a page with the site stylesheet | used for frame times |
| `test/` | The checks behind every claim in this file | `sh test/run-all.sh` runs them all and writes `test/results.txt` |
| `shots/` | 87 screenshots that were taken and looked at | `node test/shots.js` (then `webkit`, `firefox`) retakes them |

`demo.html` and `test/bare.html` are written by `python3 test/build-demo.py` from the two `*.template.html`
files, so the five story cards and the thirty list lines are typed once. The four component files are
plain source with no build step. All four are within 15 bytes of their budgets: to add a rule or a line,
take one out first.

## Before you place them: what the page has to do

1. **Add the holding class in the head.** It is the same line the wheel and the spotlight (`kit/flat`)
   need, so a page gets it once. Next to the line that adds `js`, in `tools/chrome/head-script.inc`:

   ```js
   d.classList.add('kws-hold'); setTimeout(function () { d.classList.remove('kws-hold'); }, 4000);
   ```

   While `html` has `kws-hold` and a component's script has not run, the stylesheet shows the first story
   card alone in the space the drum will take, and keeps the ring's stage empty at its full size, so
   nothing shifts when the scripts arrive (measured: layout shift 0.0000, with and without reduced
   motion). It is a class and a timer, not a CSS animation, so the site's reduced-motion rule cannot switch
   it off. If a script never arrives the timer ends and the plain cards and lists come back. Without the
   line everything still works; the page shifts once when the components start. On a client site:
   `<script>document.documentElement.classList.add('kws-hold'); setTimeout(function () { document.documentElement.classList.remove('kws-hold'); }, 4000);</script>`
   (`test/bare.html` has it).
2. **`box-sizing: border-box`** on everything (the site's reset, or a utility framework's base layer).
3. **The pause switch** is `html[data-motion="off"]`. Both scripts read it every time they are about to
   move, so there is nothing to register. `prefers-reduced-motion: reduce` is treated the same way.
4. **`role="list"`** on the story `<ol>` and on each `<ul>` in the ring's lists, as the site does on its
   other unbulleted lists (Safari's screen reader drops the list otherwise). The markup below has it.
5. **A focus style.** The kit's buttons are real buttons and take the page's own `:focus-visible` style
   (on this site the 3px ring in `--focus`). A client page with no focus style of its own gets the
   browser's ring.

Neither script needs `main.js` or any class the site defines. The only global is `window.KWS`.

## Theme: the kit variables

Neither stylesheet contains a colour, and neither names a site token without a kit variable in front of it.
On knightwebstudio.com nothing needs setting; day, night and the tone scopes work because the fallbacks
are the site's own tokens.

| Kit variable | Falls back to | Used for |
| --- | --- | --- |
| `--kit-bg` | `--paper` | The well behind a story card's picture; the turntable and the backs of ring cards |
| `--kit-surface` | `--card` | The lit face of a story card, arrow buttons, index cards, the four list cards |
| `--kit-ink` | `--ink` | Titles, the price line on a story card, prices, the words on the card that stands up, arrows |
| `--kit-muted` | `--ink-2` (text), `--ink-3` (resting dots) | Body text, the label line, list lines, dots |
| `--kit-line` | `--line-2` (edges, ruled lines, the shade on ring cards), `--paper-3` (the Example flag) | Hairlines and tints |
| `--kit-accent` | `--blue` | The current dot: the only blue |
| `--kit-notice` | `--brick` | The step numeral; the red rule on every index card |
| `--kit-radius` | `--r-md` (story cards); index cards use at most 0.3rem of it | Corners |
| `--kit-font-display` | `--font-display` | Titles, numerals, prices, the words on the standing card |
| `--kit-font-body` | `--font-text` | The cylinder's text. The ring's lists take the page's own font |
| `--kit-shadow` | `--shadow-2` (story cards), `--shadow-1` (list cards), `--shadow-3` (the turntable, the standing card) | Shadows |

Not read by these two components: `--kit-accent-ink`, `--kit-gilt`, `--kit-shader-1` to `-3`.

Layout tokens with plain fallbacks: `--gap`, `--gutter`, `--maxw`. Knobs of the kit's own:

| Knob | Default | What it does |
| --- | --- | --- |
| `--w` on `.kws-cyl` | `min(72vw, 21.5rem)` | Width of a story card |
| `--kws-bleed` on `.kws-ring` or above | `max(var(--gutter), 50vw - var(--maxw) / 2)`: on this site, the distance from the container to the window's edge | How far the ring's stage runs past its column: both sides under 980px, the left side from 980px. Set it to the page's side padding on a client site; `0` keeps the stage inside its column |
| `--kws-top` | `5.5rem` | The least distance from the top of the window to the stuck stage (from 980px). Set it to the sticky header's height plus a little |

What a palette has to satisfy: body text and labels must pass AA on **both** `--kit-surface` and
`--kit-bg`, because a story card that is not in the middle is drawn in a tone between the two (see
"Light, not fade" below). Ink on `--kit-line` must pass too (the Example flag). The site's tokens do.

Proof: the last band of `demo.html` sets the variables to a dark green and cream brand with a book serif
and Trebuchet, square corners and a harder shadow. `test/bare.html` is a third brand (cream and brown,
slab serif, 18px corners) with no site stylesheet at all.

---

## 1. Cylinder slider (`cylinder.css`, `cylinder.js`)

**What it is.** Cards standing on the outside of a wide, shallow drum. The card in the middle faces you,
flat and sharp (at rest it carries no transform at all) and is the lit one: full paper, full shadow. The
cards to each side turn away, 17 degrees a step (21 on a phone, where the drum is tighter so the curve
shows in the 40px there is), and sit in a lower light. It turns by drag, swipe, the two arrows, the dots
and the arrow keys, and settles with a soft spring. It never turns by itself.

**Light, not fade.** No card in view is faded: every one is at full strength, so its words keep the
contrast they have on the page. What dims on a side card is the paper behind the words (its lit face is
drawn at 40% over the band) and its shadow. A card fades out only over the last 0.4 of a step before it
leaves the drum, past the second card from the middle.

**On knightwebstudio.com.** One missed call followed through to the review, as five moments: the story
the home page tells as a route, in the form that fits the Consulting page (the placement plan puts it
there). Each card is a paper card: a brick step numeral, the service, its fixed setup price (once per
service; the service's second card says "Same setup as step 1"), the moment as a heading, a small
drawing with an "Example" flag on its frame, and one or two plain sentences. The story has a first and
a last card, so the drum is placed with `data-loop="false"`: step 1 starts in the middle, blank cards
stand before it and after step 5, and the arrow at each end is dimmed.

**Which businesses it suits.** Anything that is a short sequence a customer goes through: how a job runs
(call, quote, visit, invoice), how an order is made (a bakery's custom cake, a print shop's proof), a
before-and-after sequence for a cleaner or a landscaper, the stages of a kitchen fit. Three to seven
cards. Leave `data-loop` off (it loops) for a set with no first and last, such as five kinds of job. It
does not suit unrelated things (use a grid) or more than about seven (use a list).

### Markup to copy

```html
<!-- Outside the .container on purpose: the drum runs the full width of the page -->
<section class="kws-cyl" data-kws="cylinder" data-noun="step" data-loop="false" aria-label="One missed call, followed through to the review">
  <ol class="kws-cyl-track" role="list">
    <li class="kws-cyl-card">
      <p class="kws-cyl-tag"><b aria-hidden="true">1</b><span>Missed-call text-back <strong>$750 setup</strong></span></p>
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
- `.kws-cyl-tag` is the label: the numeral in `<b aria-hidden="true">`, then one `<span>` holding the
  first line and a `<strong>` that is set as a second line, in ink, never broken ("$750 setup").
- `.kws-cyl-tag`, `.kws-cyl-art`, `.kws-cyl-eg` and `.kws-cyl-text` are all optional. A card can hold a
  link; it takes the page's own link style.
- Every card takes the height of the tallest one, and the picture slot (`.kws-cyl-art`, at least 11rem)
  takes up the slack. Keep the cards alike: on a 390px phone a card should come to 440 to 460px so the
  card and its controls fit between the header and the phone bar. In the demo it is 444px (title up to
  two lines, text up to five at 15px, picture 176px or a little more).
- Put it straight inside the section, not inside the container, so the side cards run to the edges of the
  window. With no script the list holds itself to `--maxw` with `--gutter` at the sides.
- Do not put inline styles on the cards: the script writes there, and removes the attribute when it leaves.

### Attributes and options

| On the root | From code | Default | What it does |
| --- | --- | --- | --- |
| `data-noun="step"` | `noun: 'step'` | `slide` | The word in the names: "Next step", "Step 2 of 5: ..." |
| `data-start="2"` | `start: 2` | `0` | Which card starts in the middle (counted from 0) |
| `data-loop="false"` | `loop: false` | loops when there are 3 or more cards | A drum with two ends: blank cards stand beyond the first and the last, and the arrow at an end is `aria-disabled` |
| `style="--w: 20rem"` | | `min(72vw, 21.5rem)` | Card width |

The script adds `.kws-cyl-ctl` (holding two `.kws-cyl-nav` and the `.kws-cyl-dot` buttons), `.kws-cyl-sr`
(the live region), four blank `li.kws-cyl-card[aria-hidden]` when the drum does not loop, classes
`is-live`, `is-moving`, `is-held` on the root and `is-on` on the middle card. The remover takes all of
it away again.

### The states

| | What a visitor gets |
| --- | --- |
| Script off | A grid of all the cards: one column on a phone, two from about 700px, three from 1070px. Nothing hidden, no dead buttons. |
| Held (`html.kws-hold`, script not yet run) | The first card where it will stay, in exactly the space the drum will take. After four seconds without the script, the grid. |
| Running | The drum. |
| Under 380px wide, no 3D transforms, or `html[data-kws3d="off"]` | The same carousel as a flat sliding row: no rotation, same controls. |
| Reduced motion, or motion paused | Arrows, dots and keys land on the card at once, and the light changes without a fade. A swipe steps one card when the finger lifts; nothing follows the finger. |

### Getting about

- Drag with a mouse or pen, swipe with a finger. Only a clearly sideways move is taken (6px of travel and
  more sideways than up or down); `touch-action: pan-y pinch-zoom` leaves vertical scrolling and
  pinch-zoom to the browser. A flick carries at most to the next card; a drag that has stopped under the
  finger does not fling when it is let go. There is no wheel listener.
- A press on the drum while it is turning does not stop it part-way: only a drag under way holds it.
- A click or tap that ends a drag follows no link. A click or tap on a card at the side brings it to the
  middle and does not follow its link; the same on the middle card does. Mouse, touch and pen alike.
- Left and right arrows, Home and End whenever focus is inside (not while typing in a field). Up and down
  are left to the page. If focus was on a link inside a card, it moves to the dot of the card that has
  come round, so it is never carried off screen with the old card.
- Tab order: any links in the cards, then previous, a dot per card, next. Tabbing to a link on a card at
  the side brings that card to the middle. Focus is never trapped.
- Every control is a real `<button type="button">`, 44 by 44px, with a name. If the dots do not fit
  between the arrows (seven cards on a phone) they wrap to a second row; they never shrink.

**Screen readers.** The section gets `aria-roledescription="carousel"`; it stays a list, and each item gets
`aria-roledescription="slide"` and `aria-label="2 of 5"`. All cards stay in the reading order, so the whole
story can be read straight through without operating anything. The blank end cards are `aria-hidden` and
empty. A polite live region says the card in focus ("Step 2 of 5: Within a minute, they get a text.")
after the visitor moves it with a button, a dot, a key, a drag or a click; it is silent on load, when
focus alone moves the drum, and when an arrow key moves focus to a dot (the dot's own name is read).

### On this site: page rules for the mock parts

The drawings are the site's shared mock parts, not kit parts. Six small rules make them sit in a 176px
picture slot; they are in `demo.html`'s `<style>` and belong in the Consulting page's own block of
`styles.css` (prefix them with the page's `[data-page]` as usual):

```css
.kws-cyl-art .thread { width: 100%; padding: 0; }
.kws-cyl-art :is(.cal, .leads) { width: 100%; padding: var(--s-3); box-shadow: var(--shadow-1); }
.kws-cyl-art .cal-day i { height: var(--s-5); min-height: 0; }
.kws-cyl-art .cal-day .ico { width: var(--s-4); height: var(--s-4); stroke-width: 3; }
.kws-cyl-art .leads li { padding: var(--s-2) 0; }
.kws-cyl-art .notice-title .thread-note { font-size: var(--fs-sm); }
/* on a phone each picture is cut to its one telling part (the Services page does the same to its thread) */
@media (max-width: 599.98px) { .kws-cyl-art :is(.thread li:nth-child(n+3), .cal-log, .leads li + li) { display: none; } }
```

plus the rings behind the first card's notification (`.demo-rings` in the demo: rename it for the page).

### Honest content on this site

- The five headings are the brief's. Each service's fixed setup price is printed once, on that service's
  first card, exactly as published ($750, $750, $1,500); its second card says "Same setup as step 1" (or
  4), so five cards cannot be read as five charges.
- The drawings follow the mock rules: "[your business]", everyday trade wording, no names, no stars,
  nothing blue. Every word inside them is already on the home page: "Your phone", "now", "Missed call",
  the text-back bubble and its note, the caller's reply, "Your calendar", "This week", "Confirmation
  sent", the two follow-up rows, and for the last card the home page's own row "Missed call · job done /
  Leaking sink / Review request sent". The booked slot is a brick slot with a tick, because "Booked
  online" is wider than a day column in a narrow card.
- Each drawing carries an "Example" flag (`.kws-cyl-eg`, the kit's own, so it exists on a client site).
- Under the drum, keep the credit line: the three services with their prices, then "Each drawing is an
  illustration, not a real conversation, booking or list." (the handbook's wording, for a set of three kinds).
- New words, for the owner to accept: card 1's sentence, "You're on a job, up a ladder or with a
  customer. The phone rings out." (scene-setting; it states no fact), and the pointer "Same setup as
  step 1" / "Same setup as step 4". Every other sentence is the home page's; card 3's drops "It lands on
  your calendar", which its heading says.

---

## 2. Carousel ring (`ring.css`, `ring.js`)

**What it is.** A rotary card file seen from above at an angle: a turntable with a soft shadow on the
ground, and standing round its rim one blank paper index card for every line of the lists beside it, each
with a red rule, faint ruled lines and a small tab. The cards lean a little towards the reader, so the
near half of the ring shows faces and the far half shows shaded backs. The ring turns as the page
scrolls past it (0.1 degree a pixel: one card about every 120px) and by a sideways drag with a little
coast, and when it is left alone it eases onto the nearest card. The card at the front is read on a
larger card that lifts out of its place, squares up and comes to rest flat and upright in the middle of
the ring: its package on the tab, its words at 18px or more. Only that card carries words, and only one
card shows words at a time.

It is decoration that tells the truth. The stage is `aria-hidden` and holds nothing focusable; the lists
are the content, for everyone.

**How it sits.** Under 980px the stage runs the full width above the lists, and on a phone the ring is
wider than the screen, so the sides run off both edges and the front arc is large. From 980px the ring
sits beside the lists and stays in the middle of the window while they scroll past; its left side runs
off the edge of the window. If the stage does not reach the window's edge (a client page whose
`--kws-bleed` is smaller than its margin) the ring is kept whole inside its column instead: it is never
cut in mid-air.

**On knightwebstudio.com.** "Everything a build includes": the four website packages, each as an index
card (name on the tab, fixed price, its lines on ruled paper), and the same thirty lines on the ring.
The lines are the rows of the package table on `/pricing/`: size, design, what is included, support.

**Which businesses it suits.** Anyone whose offer is a long list of small true things: what a service
visit covers, what is on the van, the makes a garage works on, the treatments a salon offers, what is in
each cleaning package. Eighteen to forty lines; under a dozen it looks thin. It does not suit things
people must choose between by reading (the list does that job) or anything with pictures.

### Markup to copy

```html
<div class="kws-ring" data-kws="ring">
  <div class="kws-ring-stage" aria-hidden="true"></div>   <!-- stays empty: the script fills it -->
  <div class="kws-ring-lists">
    <div class="kws-ring-group">
      <h3 class="kws-ring-name">Starter</h3>              <!-- also the words on the standing card's tab -->
      <p class="kws-ring-price">$2,000</p>                 <!-- optional -->
      <ul role="list">
        <li>Up to 5 pages</li>
        <li data-short="Copy editing and polish">Copy editing and polish (you supply the text)</li>
        <!-- more lines -->
      </ul>
    </div>
    <!-- more groups -->
  </div>
</div>
```

- Every `<li>` inside the root becomes a card, in order. Groups are optional: a single plain `<ul>` works
  (blank tab). The stage must be in the markup, with `aria-hidden="true"`; without it the lists stay lists.
- Each group's cards share one of four tab places, in turn, so a package reads as a section of the file.
- The lists are two columns on a phone, four from 760px, and two beside the ring from 980px.
- The root goes inside the page's container. Do not put inline styles on the stage.

### Attributes and options

| In the markup | From code | Default | What it does |
| --- | --- | --- | --- |
| `data-speed=".1"` on the root | `speed: .1` | `.1` | Degrees turned per pixel scrolled |
| `data-short="..."` on an `<li>` | | the line's own words | Shorter words for the standing card (three lines at most are shown); the list keeps the full line |
| `data-tab="..."` on a group | | the text of `.kws-ring-name` | The words on that group's tab |
| `--kws-bleed`, `--kws-top` | | see the knobs above | How far the stage runs past its column; where it sticks |

The script adds `.kws-ring-hub` (holding the `.kws-ring-card`s and two `.kws-ring-read` reading cards) to
the stage, a `font-size` on the stage (the ring's radius: inside the stage 1em is one radius) and class
`is-live` on the root; `is-back` comes and goes on cards. The remover takes all of it away.

### The states

| | What a visitor gets |
| --- | --- |
| Script off | The lists as index cards, four across from 760px. No stage, no gap. |
| Held (`html.kws-hold`, script not yet run) | The lists, with the stage's space kept empty. After four seconds without the script, the script-off layout. |
| Running | The ring. Off screen it asks for no frames and its cards are not kept as layers. |
| Under 380px wide, fewer than three lines, no 3D transforms, or `html[data-kws3d="off"]` | The lists only, with no space kept. |
| Reduced motion, or motion paused | A still ring with one card stood up to read. No scroll link, no drag. When motion is switched back on it carries on from where it stood. |

Screen readers and keyboards get the lists and nothing else; there is nothing in the ring to reach.

### Honest content on this site

- All thirty lines are in the package table of `pricing/main.html`, under the package named on the tab. A
  line that two packages share appears under both, as it does in the table.
- Wording is the table's, with four things to know: "Custom design, 1 revision round" and "Up to 3 design
  rounds, plus a final tweaks round" are each two lines ("Plus a final tweaks round" keeps the table's
  words); support reads "14 days of support" as on `/start/` (the table says "Support: 14 days"); and two
  standing cards use the short forms "Copy editing and polish" and "Copywriting" while the lists keep
  "(you supply the text)" and ": we draft, you edit".
- The four prices are the fixed prices. No add-ons and no care-plan lines: they are not part of a build.

---

## Mounting from code, and from React

Both scripts start themselves on `[data-kws="cylinder"]` and `[data-kws="ring"]` when the page has loaded.
For anything added later:

```js
const off = KWS.cylinder.mount(element, { noun: 'step', start: 0, loop: false });
const off2 = KWS.ring.mount(element, { speed: .1 });
off(); off2();   // each takes away everything it added: listeners, observers, buttons, cards, classes, attributes, inline styles
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
  useEffect(() => window.KWS.cylinder.mount(ref.current, { noun: 'step', loop: false }), [steps.length]);
  return (
    <section ref={ref} className="kws-cyl" aria-label="How an order goes">
      <ol className="kws-cyl-track" role="list">
        {steps.map((s, i) => (
          <li className="kws-cyl-card" key={s.title}>
            <p className="kws-cyl-tag"><b aria-hidden="true">{i + 1}</b><span>{s.label} <strong>{s.price}</strong></span></p>
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

The ring is the same with `window.KWS.ring.mount(ref.current)` on the `.kws-ring` root. Things to keep in
mind in React: leave `data-kws` off (you are mounting it yourself); let the script own what it adds (it
appends the controls, the live region and the blank end cards inside the cylinder's root, puts `is-on`,
`aria-label` and inline styles on the cards, and fills the ring's empty stage, so render the stage with no
children and never set `style` on a card or on the stage); and remount, through the effect's dependency,
when the number of cards or lines changes. The effect's cleanup is the remover, so strict mode's double
run is fine. Put the holding line in the document head; inside the four seconds a removed component
shows its first card only, as it did before it started.

## If Safari draws it wrongly: the one-line switch

Neither component asks the browser to sort anything in 3D. Every card carries its own whole transform
and the ring's cards are stacked by the script (`z-index`), so the picture is the same in Chromium,
Firefox and WebKit by construction (the first build nested a `preserve-3d` scene, which engines order
differently, and which Playwright's WebKit flattened into a strip). If a real iPhone still shows
something wrong, one line in the head, before the kit scripts, gives every visitor on that browser the
flat drum and the lists alone:

```html
<script>if (/iP(hone|ad|od)/.test(navigator.userAgent)) document.documentElement.setAttribute('data-kws3d', 'off');</script>
```

(or set the attribute for everyone to switch the depth off entirely). It is read when a component mounts.

## What was measured

Everything below is in `test/results.txt`; `sh test/run-all.sh` writes it again. Chromium 153 (Playwright's
build), plus WebKit 26.6 and Firefox 155 (Playwright's Linux builds) where noted.

MEASURED

## Decisions

- **No 3D sorting is asked of the browser.** Each ring card has its own whole transform (one write a card
  a frame, thirty small blank layers) and an explicit `z-index` that the script changes once a step. The
  first build turned one `preserve-3d` element; that is one write a frame, but it depends on each engine's
  depth sorting, which is exactly what could not be seen in Safari. Measured cost of the change: none
  that shows (ring drag and coast: mean 16.7ms at a 4x throttle; the first build's was 16.7 to 18.7ms).
- **The ring's cards carry no words.** Words on thirty overlapping cards were fragments, and words on a
  card coming round from the back were mirrored for a moment. Now a card is a blank index card, and the
  words are on one reading card that is not part of the turning file at all: it is a separate, larger
  element, laid out at twice its size so its text is sharp, flat at rest, and always painted last.
- **The cards lean towards the reader, most at the sides.** Faces on the near half, backs on the far
  half, one smooth rule with no card flipping over; a card is not drawn for the few degrees it would be
  edge-on. The stacking follows from it: lowest where the cards are edge-on, rising to the front and to
  the back.
- **It rests on a card.** Left alone after a scroll or a drag it eases at most half a step to the
  nearest card, so the resting picture is always composed: one card up, dead centre.
- **Thirty cards, no guide cards.** A guide card for each package (name and price) was built and taken
  out: it made the dullest of the reading cards and cost bytes the budget did not have. The package is
  on the tab of every reading card, and each package's cards share a tab place.
- **The drum has two ends for this story.** A linear story on a looping drum put "Job done" to the left
  of "You can't pick up". With `data-loop="false"` step 1 is in the middle; blank cards stand beyond
  both ends so neither side of the drum is ever bare.
- **Light, not fade, on the drum.** See above: opacity on a whole card took real text under AA.
- **The price once per service.** Five cards, three services, three prices.
- **A phone card is designed, not shrunk**: 72vw wide, a 21 degree step, a picture slot of 176px with
  each drawing cut to its one telling part, the Example flag on the frame instead of inside it, and the
  arrows and dots tucked 8px under the card.
- **A click on a side card never follows a link**, with a mouse or a finger; clicks from the keyboard
  are never held back.
- **Reduced motion: a swipe steps on release.** Nothing follows the finger, because following is movement.
- **The hold is a class and a timer** (`html.kws-hold`), shared with the wheel and the spotlight.
- **Under 380px** the drum is flat and the ring gives way to its lists, as the brief asks.
- **No auto-turn, no wheel listener, no reflections.** The ring moves only with the page or a hand.

## The reviewers' issues: what was done

Every blocker and major was fixed or designed out; `test/` has a check for each one that can be scripted.

| Issue | Outcome |
| --- | --- |
| Ring: mirrored words flash at the right-rear corner | Designed out: ring cards carry no words (checked: 0 text nodes on 30 cards) |
| Ring: word fragments, repeated tabs | Designed out: blank cards with rule, lines and tab; tab place by package |
| Ring: timid; backs vanish; floats | Turntable with a ground shadow; backs in a shaded tone that reads on the page by day and at night; ruled faces |
| Ring: composition from 980px | Radius 485px at 1280 to 1440 (was about 295), runs off the left edge, stage stuck in the middle of the window, rests on a card |
| Ring: phone | Radius 279px at 390 (wider than the screen), standing card 240px wide, words 18px, tab 12px |
| Cylinder: a step never fits a phone screen | Card 444px, controls end at 576px of the 595px visible |
| Cylinder: faded text under AA | No card in view is faded; plate-and-strength-aware contrast check on every step and every frame of a turn |
| Safari unseen | No engine-dependent sorting left; all behaviour checks pass in Playwright's WebKit and Firefox; one-line switch documented. A real iPhone is still to be looked at (see limits) |
| Drum freezes part-way | Only a drag under way holds the spring; extra pointers ignored; `is-held` always cleared (three scripted cases, also in WebKit and Firefox) |
| Reduced motion: page jumps at upgrade | Hold is a class, not an animation: shift 0.0000 with reduced motion, on demo and bare page |
| Arrow keys carry focus off screen | Focus moves to the new card's dot |
| Touch: tap on a side card | Same as a mouse click now; keyboard clicks told apart by `detail` |
| Dots under 44px | Fixed size; they wrap (5, 6, 7 and 12 cards at 320 to 390px checked) |
| Stale fling (both) | Velocity dropped if the pointer had stopped for 80ms |
| Sticky re-measure turns the ring | Position measured from the root, and a re-measure keeps the angle |
| Ring cost | Shadow only on the reading card; `innerHeight` cached; `scrollY` read once a frame; cards are small blank layers (about 100 by 73px each on a phone, was 320 by 241) |
| Empty stage when the ring never comes | Hold timer for a failed script; stage hidden for fewer than three lines |
| Pinch-zoom, long words, leftovers after removal, dot hover, landed state, story order, label breaks, price on every card, phone depth, dimmed arrow, six-card dots, demo console error | All fixed (checks in `test/cylinder.js` and `test/ring.js`) |

Not done, or done differently:

- **"At night lift the face above the backs" and "darker again with distance."** The kit may only use the
  theme variables, and no variable is darker than the page at night, so a back is one tone: `--kit-bg`
  shaded with `--kit-line`. By day that is a step darker than the face; at night a step lighter. Near
  cards are told apart by their rules, ruled lines, tabs and a shade towards the lapped edge, not by fill.
- **A hub or spindle.** The turntable and its shadow make the base. A centre cap was drawn and then
  taken out to stay inside 3,500 bytes; on a phone the reading card hides the centre anyway.
- **`--shadow-3` on the lit story card.** The lit card has the full `--kit-shadow` (`--shadow-2` here)
  and the others 40% of it. A second, deeper shadow did not fit the byte budget.
- **A deeper blue for the current dot under the pointer.** The kit has no deep-accent variable; the
  current dot simply keeps its fill (the bug was that it lost it).
- **A grab cursor on the ring.** Dropped for bytes, together with the two rules that took it away again
  under reduced and paused motion. The drum keeps `grab` and `grabbing`.
- **Changed for whoever read the first notes:** the ring's `tilt` option and `data-tilt` are gone (the
  geometry is tuned to one angle), the ring no longer makes a stage that is missing from the markup, the
  ring has no `is-moving` class, the cylinder no longer sets its own focus ring (the page's applies), the
  held state hangs off `html.kws-hold` instead of `html.js`, and `--w` on the ring's stage is gone (the
  ring sizes itself from its stage).

## Known limits

- **A real iPhone has still not been used on these.** Playwright's WebKit is Safari's engine but not
  Safari on an iPhone; on Linux it paints 3D without perspective (parallel, like a drawing in
  isometric), so layout, stacking and behaviour are proven there and the look of the perspective is not.
  Touch gestures, frame times and leaks were measured in Chromium only. Before launch, open
  `demo.html` on an iPhone and an iPad: the drum before and after its script loads, a swipe against a
  page scroll, a tap on a side card, the ring turning with the page, and the sharpness of the standing
  card.
- **The ring under a 4x CPU throttle while the page scrolls** drops some frames in this headless
  environment (see the numbers). Its drag and coast, with the page still, is clean. It has not been
  timed on a real phone.
- **The site's `tools/widths.js` reports the drum** ("element +N ... kws-cyl-card"): it flags anything
  past the right edge and does not know the side cards are clipped by `.kws-cyl-track`. The page itself
  is `+0` at every width. `test/widths.js` here makes the same sweep with that rule added.
- **Equal heights.** The drum is as tall as its tallest card. One long card makes every card long.
- **Seven cards on a phone** put the seventh dot on a second row (12 dots make two full rows); from the
  second row on, the drum is 44px taller than its held state, so that one case shifts the page once.
- **Without the holding line** the page shifts once when the components start. If a script takes more
  than four seconds, the plain lists have already come back and the upgrade shifts the page once.
- **The ring needs 3 or more lines**, and looks its best with 18 to 40. Tab places repeat after four
  groups. The standing card shows three lines at most: give long lines a `data-short`.
- **`--kws-bleed` on a client site.** The default is this site's container arithmetic. If it is larger
  than the page's real side padding, the stage is wider than the window on a phone; set it.
- **The client band in `demo.html` re-points a few site tokens** for the drawings inside the story cards,
  because those drawings are the site's parts, not the kit's. `test/bare.html` shows the slot with a
  plain placeholder.
- **Text in a card cannot be selected** while the drum is live (so a drag does not paint a selection).
- **A press on the outgoing card in mid-turn** counts as a click on a side card and brings that card
  back. It always lands flat on a card; it may not be the card the arrow was heading for.
