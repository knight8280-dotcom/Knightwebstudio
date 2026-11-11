# Motion kit: arc focus carousel and spotlight carousel

Two carousels that move in the plane. Hand-written for knightwebstudio.com; nothing here is copied
from a library or another site. Both are ordinary lists first and carousels second.

| File | What it is | Size |
| --- | --- | --- |
| `arc.css` | The service wheel: styles | 3,374 bytes (budget 3,500) |
| `arc.js` | The service wheel: behaviour | 7,992 bytes (budget 8,000) |
| `spotlight.css` | The project spotlight: styles | 3,499 bytes (budget 3,500) |
| `spotlight.js` | The project spotlight: behaviour | 7,988 bytes (budget 8,000) |
| `demo.html` | Both on a page built from the real stylesheet, with a client palette band | `http://localhost:8730/kit/flat/demo.html` |
| `test/bare.html` | Both on a page with no site stylesheet and no site script | proof that the kit stands alone |
| `test/` | The checks behind every number in this file | `sh test/run-all.sh` runs them all and writes `test/results.txt` |
| `shots/` | Screenshots that were taken and looked at | `node test/shots.js` retakes them |

The four component files are plain source with no build step. `arc.js`, `spotlight.js` and
`spotlight.css` are within 15 bytes of their budgets, so a change to any of them means taking
something out first. The two scripts are the same engine line for line (mounting, controls, spring,
drag, keyboard, clean-up); they differ only in `measure` and `render`, the flick limit, and the
spotlight's two lines that prepare its layers. A fix to one almost always belongs in the other.

## Before you place them: three things the page has to do

1. **Add the holding class in the head.** One line next to the one that adds `js`, in
   `tools/chrome/head-script.inc` (the demo's head shows it in place):

   ```js
   d.classList.add('kws-hold'); setTimeout(function () { d.classList.remove('kws-hold'); }, 4000);
   ```

   While `html` has `kws-hold` and a carousel's script has not run yet, the stylesheet shows only the
   first item, in the space the live carousel will take, so nothing shifts when the script arrives.
   It is a class and a timer, not a CSS animation, so it works for visitors with reduced motion too.
   If the script never arrives, the timer ends and the plain list comes back in its script-off layout.
   A page with no kit component is unaffected. On a client site the same line goes in the head
   (`test/bare.html` has it as a stand-alone snippet). Without it everything still works; the page
   just shifts once when the script upgrades the list.
2. **Tell the spotlight the band's colour if it sits on a sand band.** The veil over the side cards
   is `--kit-bg`, which falls back to `--paper`. On `.section-sand` add one rule to the page's own
   block of the stylesheet, as the demo does: `--kit-bg: var(--paper-2);`.
3. **Keep the page's other props straight.** The wheel tilts eight signs, so the page it is on
   carries no other tilted object and no stamp.

## Where they go on knightwebstudio.com

- **The wheel: the home page's services section, or `/start/`.** Not `/services/`. On a phone the
  wheel shows one price at a time; the service menu on `/services/` shows all nine on one screen with
  every row a link, and that page keeps it. The wheel belongs where no at-a-glance list exists, with
  each caption linking to `/services/#…` (all nine ids are on that page today: `website-design`,
  `redesigns`, `ecommerce`, `brand`, `seo`, `care`, `automation`, `growth-consulting`,
  `google-reviews`). Do not place it inside `.on-blue` or on the blue board: the signs are that blue.
- **The spotlight: the home page's projects section, or above the three case rows on `/work/`.** Each
  card's button goes to its own case row: `/work/#smilys-softwash`, `/work/#risen-health`,
  `/work/#corbel-books`. That needs an `id` on each of the three `<article class="case">` elements on
  `/work/` (they have none today; until they do, the links still land on `/work/`). On the Work page
  itself the links are the same-page anchors. Do not add a "See the work in detail" link under it:
  the three buttons already go there.
- The names are `h3` under a section's `h2` (as in the demo), or `h2` directly under a page's `h1`.

## What the two share

**How they are built.** A labelled `<section>` holding a `<ul>`. Each `<li>` has a picture part (a
sign, or a framed screenshot) and a caption (heading, text, one link). With no script that is all
there is: a tidy grid of centred cards, three across on a desktop and one on a phone. The script adds
class `is-live` to the root, lays the picture parts out, stacks the captions in one place and shows
the caption of the item in focus. It adds a row of controls and a status region for screen readers.
It never moves by itself.

**Getting about.**
- Drag with a mouse or pen, swipe with a finger. The sign or card under the finger follows it. Let go
  and it settles on an item with a soft spring.
- A drag of more than 40px always moves at least one item on, however slowly it was made; a shorter
  one springs back. Reduced motion uses the same 40px.
- A quick flick carries on a little: the wheel by no more than one sign beyond those showing on one
  side (two on a phone), the spotlight by one card.
- Previous and next arrows. One dot per item where the dots fit at 44px each with 8px between them;
  where they do not (the wheel's nine below about 640px wide, any carousel with many items) a plain
  count, "3 of 9", sits between the arrows instead. Either way the controls are one row, so the held
  space is always right.
- Left and right arrow keys whenever focus is inside.
- Click a sign or card at the side and it comes to the centre. Click the one in the centre and its
  link opens; with Ctrl or Cmd held it opens in a new tab, as a link would.
- Tab goes through every item's link in order. Tabbing to an item that is off to the side brings it
  to the centre, so focus is never on something you cannot see.

**What is left to the page.** A drag is taken once it has gone 12px, and only if it has gone at least
as far sideways as up or down. `touch-action: pan-y pinch-zoom` hands every steeper swipe to the
browser, which scrolls the page; the two rules meet at 45 degrees, so no swipe does nothing. There is
no wheel listener. A click that ends a drag follows no link; a click with up to 11px of wobble is
still a click. A press whose release never reaches the carousel (let go over a button, or in another
window) is dropped at the next pointer move, so the carousel never follows a mouse with no button
down.

**Three states before and after script.**

| State | What the visitor gets |
| --- | --- |
| Script off | The plain list: every item, every price, every link. Nothing hidden, no dead controls. |
| `html.kws-hold` set, script not yet run | The first item, in exactly the space the carousel will take (measured: layout shift 0, with and without reduced motion). After 4 seconds without the script, the plain list. |
| Live | The carousel. |

**Reduced motion and paused motion.** With `prefers-reduced-motion: reduce`, or `data-motion="off"`
on `<html>`, nothing animates: arrows, dots and keys change item at once, and a drag does not follow
the pointer but steps one item on release. No animation frame is requested. Both settings are read at
every frame as well as at the start of a move, so a move already under way ends on the next frame
when either is switched on. The same goes for a carousel that is scrolled off screen in mid-move. The
stylesheets contain no transitions and no animations.

**Screen readers.** The root is a labelled region with `aria-roledescription="carousel"`. The list
stays a real list; each item gets `aria-roledescription="slide"` and `aria-label="3 of 9"`. Every
item stays in the reading order, centred or not. The controls are a `role="group"` named "Choose a
service" holding real `<button type="button">`s: "Previous service", one per item named "SEO &
performance, 5 of 9" (the current one carries `aria-current="true"`), and "Next service". After a
move made with the arrows, dots, keys or a drag, an `<output>` element (a polite status region) says
the item, for example "Care & maintenance, 6 of 9"; a move caused by tabbing to a link says nothing,
because the link itself is being read. The signs, and the browser bar on a screenshot, are
`aria-hidden`: they repeat what the caption says.

**Keyboard, in full.** Tab: each item's link (the item centres as it is focused), then previous, then
the dots as a single stop (the current dot; no stop where the count shows instead), then next, then
out. Left and right arrows: previous and next, from anywhere inside; if focus was on a link or a dot
it moves to the same thing on the new item. Enter or Space on any button. Alt, Ctrl and Cmd
combinations are left alone. Focus is never trapped. Each stylesheet draws its own focus ring, 3px in
`--kit-ink` with a 3px offset, so it is visible on any palette; on knightwebstudio.com, where
`--kit-ink` is not set, it falls back to the site's `--focus` and matches every other ring.

**Pointer states.** A sign or card, the caption link, the arrows and the dots all show a pointer,
lift 2px on hover and sink 1px when pressed, as the site's buttons do; a sign's gold keyline also
thickens on hover. The rest of the stage shows a grab hand, and a closed hand during a drag.

**Performance.** Animation frames are requested only while a spring is running and the carousel is
on screen (an IntersectionObserver keeps track). During a drag the pointer event itself writes the
new positions, so no frame is requested then either. Sizes are measured at mount and again only when
a ResizeObserver reports a change; the moving code only writes `transform`, `opacity` and
`visibility` (the spotlight also writes `z-index` and one custom property, `--v`, for the veil).
`will-change` is set only while moving (class `is-moving`). The spotlight's cards are large pictures,
so it also sets it on them while a pointer is over the carousel or focus is inside it (from the
moment a finger lands, on a phone), and takes it off when the pointer or focus leaves: the layers are
then ready before the first frame of a move rather than made during it. All listeners are passive
except the three that must cancel something (click, dragstart, keydown).

## Theme: the kit variables

Component CSS never names a brand colour and never uses a site token on its own. It reads these, each
falling back to a knightwebstudio.com token, so both site themes work with nothing set:

| Variable | Falls back to | Used for |
| --- | --- | --- |
| `--kit-bg` | `--paper` | The veil over the spotlight's side cards; the well behind the address in a browser bar |
| `--kit-surface` | `--card` | Price tag, link button, arrow buttons, the browser frame |
| `--kit-ink` | `--ink`; `--focus` for the focus ring | Names, prices, the count, button text and outlines, the browser frame's line; the focus ring |
| `--kit-muted` | `--ink-2` | Caption text, the dots, the address in a browser bar |
| `--kit-line` | `--line-2` | The three dots in a browser bar |
| `--kit-accent` | `--board` (the signs), `--blue` (the current dot) | The enamel of the signs; the current dot |
| `--kit-accent-ink` | `--cream` | Pictogram and lettering on a sign, and the thin light edge along its top |
| `--kit-gilt` | `--gold` | The keyline on a sign; the light behind the object in focus |
| `--kit-notice` | `--brick` | The kind-of-business label over a project's name |
| `--kit-radius` | `--r-md` | Signs, link buttons, the browser frame (capped at 1.25rem there, so a pill radius cannot crop a screenshot) |
| `--kit-font-display` | `--font-display` | Names, prices, sign lettering |
| `--kit-font-body` | `--font-text` | Everything else |
| `--kit-shadow` | `--shadow-2` | Signs and frames |

Type sizes use the site's scale tokens with the scale's own values as fallbacks (`--fs-sm`,
`--fs-body`, `--fs-title`), or the scale's values written out (13px label, 16px button, 12px address).
The spotlight's stylesheet writes several lengths in px where the wheel's has rem: that is where its
last bytes went.
Two neutral shades are written as black at low strength, because no kit variable is dark in every
theme: the edge under a link button (`rgb(0 0 0/.22)`, the site's own `--press` value) and the deeper
lower edge of a sign.

On a client site set the variables once on `:root` (or on any wrapper); see `demo.html` (dark green
and cream, squared corners, Palatino) and `test/bare.html` (brick and cream, fully round, Rockwell, no
site CSS at all).

Component knobs, when a page needs them:

| Knob | Where | Default | What it does |
| --- | --- | --- | --- |
| `--cap` | on `.kws-arc` or `.kws-spot` | wheel `13.5rem`; spotlight `max(13.5rem, 23.25rem - 32.5vw)` (255px at 360px wide down to 216px from 480px) | The height held for a caption. Every caption must fit in it, or the carousel grows when the script runs. Raise it if you write longer lines; `node test/heights.js` prints what each caption needs. |
| `--t` | on `.kws-arc` | `min(clamp(6.5rem, 36vw - 1.6rem, 9.5rem), 30vw)`: 104px at 360px wide, 115px at 390px, 152px from 500px | Size of the sign in focus. The lettering, the pictogram and the service name under it scale with it. |
| `--w` | on `.kws-spot` | `min(86%, 12rem + 30%)` | Width of the card in focus, as a share of the stage. |
| `--glow` | on `.kws-arc` or `.kws-spot` | `--kit-gilt` | Colour of the light behind the object in focus. It is added to what is behind it (`mix-blend-mode: screen`), so it glows at night and all but vanishes on daytime paper. A palette whose gilt is dark has no glow until this is set to a light colour; the demo's client band sets it to that brand's gold. |
| `--gutter` | site token, read by `.kws-spot-list` | `0px` where the page has none | The spotlight's stage runs out into the page's side gutter by this much, so a card sliding off on a phone leaves at the screen edge, not at the text column. It must not be larger than the real space beside the carousel. |

## 1. Arc focus carousel (`arc.css`, `arc.js`)

**What it is.** Enamel shop signs along the top of a wheel. The sign at the top is in focus: largest,
with a heavier gold keyline and a pool of light behind it. Its neighbours step down in size and turn
with the wheel. Under it: the name, the fixed price on a tag, one line and a link. With three or more
items the wheel is endless.

**How many signs show** is worked out from the room there is, each time the size changes. A sign is
shown only if it fits the stage, and, if it hangs lower than the top sign, only if its inner edge
clears the widest caption line by at least 16px. On knightwebstudio.com that gives three signs up to
724px wide, five from 728px, seven from 912px and all nine from 1032px. A sign is either fully there
or gone: at rest none is faded. Signs are never scaled so small that their lettering drops under
12px, which is why the neighbours on a phone are nearly as big as the sign in focus and the focus
sign is told apart by its light and keyline. While the wheel turns, the sign entering or leaving at
the end of the row fades in or out in place over the last quarter of a step.

**Suits.** Any business with five to nine named services or menu sections at fixed prices: a salon's
service menu, an auto shop's standard jobs, a cleaning company's packages, a restaurant's menu
sections, a contractor's trades. It works with any number from three up (the dots give way to the
count wherever the stage is narrower than 110px plus 52px per item), but past nine the list is
getting long for one-at-a-time reading. Not for long text, not for photographs (use the spotlight),
not for fewer than three items (use a plain row of cards), and not where the visitor needs to compare
all the prices at once (use a list).

**Markup to copy** (one item shown; repeat the `<li>`):

```html
<section class="kws-arc" data-kws="arc" data-noun="service" aria-labelledby="services-title">
  <ul class="kws-arc-list">
    <li class="kws-arc-item">
      <div class="kws-arc-tile" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/></svg>SEO</div>
      <div class="kws-arc-cap">
        <h3 class="kws-arc-name">SEO &amp; performance</h3>
        <p class="kws-arc-price">in every build</p>
        <p class="kws-arc-line">Get found and stay fast, with analytics you can actually read.</p>
        <a class="kws-arc-link" href="/services/#seo" aria-label="See what's included in SEO &amp; performance">See what's included</a>
      </div>
    </li>
  </ul>
</section>
```

- The root needs a name: `aria-labelledby` pointing at the section's heading, or `aria-label`. Use a
  `<section>` (or give another element `role="group"`).
- Every item needs all of: `.kws-arc-item`, `.kws-arc-tile`, `.kws-arc-cap`. If one is missing the
  script leaves the whole list alone (it does not throw).
- The sign holds one line pictogram (a 24 by 24 `viewBox`, strokes only, no fill; the stylesheet sets
  stroke, caps and size) and a short name of at most ten letters. It is decoration and stays
  `aria-hidden`.
- The name must be an `h2`, `h3` or `h4`: the script reads it for the dots and the announcements.
- Price wording is copied from the site, never rounded or shortened. No "from", no ranges.
- Keep the line to about 75 characters so that every caption fits the held height.
- Give each link its own accessible name (the `aria-label` above starts with the visible words).
- The nine services are in the order of `/services/` today: Website design & build, Redesigns &
  rescues, E-commerce stores, Brand & identity, SEO & performance, Care & maintenance, Automation,
  Growth consulting, Google profile & reviews. Their pictograms (browser window, loop, bag, pencil,
  magnifier, shield with a tick, speech bubble, compass, map pin) are in `demo.html`. They were drawn
  for this kit in the site's icon style. Growth is a compass, not a rising arrow, so it cannot read
  as a claim about results; Google is the map pin, with no stars.

**Attributes and options.**

| Attribute on the root | Option to `mount` | Default | Meaning |
| --- | --- | --- | --- |
| `data-kws="arc"` | | | Start automatically when the page has loaded. Leave it off when you mount from code. |
| `data-noun="service"` | `noun` | `"item"` | The word in the control names: "Previous service", "Choose a service". |
| `data-start="2"` | `start` | `0` | Item in focus at first (counting from 0). |
| `data-loop="false"` | `loop: false` | loops when there are 3 or more items | Without the loop the wheel has two ends: a drag stops at them, and the arrows go round from the last item to the first. |

An option passed to `mount` wins over the attribute. One item gets no controls. The held state
before the script runs always shows the first item, so with `data-start` the picture changes (but
nothing moves) when the script arrives.

## 2. Spotlight carousel (`spotlight.css`, `spotlight.js`)

**What it is.** A row of real screenshots in browser-window frames. The card in the middle is full
size and lit: a soft light glows behind it, strongest at night. Under it are the kind of business,
the name, what was built and a link. Its neighbours are smaller and veiled in the band's own colour,
so they read as standing out of the light while staying solid objects with a crisp ink edge (they
are not made see-through). Where there is room a neighbour stands beside the middle card; where
there is not (a phone) it tucks behind it and shows as a sliver.

**How it moves.** Two cards changing places part before they cross, like a deck being cut: the card
under the finger slides away with it, the next one swings out the other side, and they swap which is
on top at the moment they overlap least, then close up again. So there is never a frame where one
picture flips into another. On a phone the card follows the finger one for one at first (measured: 57
of the first 60px); a full exchange is longer than the screen is wide, which is why a 40px drag is
enough to carry it through. On a desktop the same rule gives an almost straight slide. The stage is
clipped at its sides (and runs out into the page gutter, see `--gutter`), so a card on its way out
cannot widen the page.

**Three is the truth.** With exactly three projects the row is always full: one in the middle, one
each side, whichever is in focus. There are no clones: when you move on, the card that leaves on one
side fades out as it shrinks and fades back in on the other. More items work the same way (three
show at a time). Two items show as a pair with no loop; a single item shows with no controls at all.

**On knightwebstudio.com.** Smilys Softwash first (the local one), Risen Health, Corbel Books, with
the screenshots, `alt` text, sizes and labels the Work page has today ("Bookkeeping software ·
Product site & app screens" for Corbel Books). Nothing is said about results.

**Suits.** A handful of real pieces of work with a real picture each: a roofer's or landscaper's
finished jobs, a remodeller's before-and-after pairs, a baker's cakes, a studio's sites. Use it for 3
to 8 items. The frame is a browser window, so it suits screenshots best; for photographs leave the
`.kws-spot-bar` out and the frame becomes a plain bordered picture. Never fill it with stock photos
or invented clients.

**Markup to copy** (one item shown; repeat the `<li>`):

```html
<section class="kws-spot" data-kws="spotlight" data-noun="project" aria-labelledby="work-title">
  <ul class="kws-spot-list">
    <li class="kws-spot-item">
      <div class="kws-spot-frame">
        <div class="kws-spot-bar" aria-hidden="true"><i></i><i></i><i></i><span>smilyssoftwash.com</span></div>
        <img src="/assets/img/work-smilyssoftwash.jpg" alt="Smilys Softwash — before and after of a soft-washed roof and house exterior" width="1200" height="600" loading="lazy" decoding="async">
      </div>
      <div class="kws-spot-cap">
        <p class="kws-spot-kind">Exterior cleaning ·&nbsp;Local&nbsp;service&nbsp;&amp;&nbsp;SEO</p>
        <h3 class="kws-spot-name">Smilys Softwash</h3>
        <p class="kws-spot-text">Roof and house soft washing across Greater Baton Rouge: a service page per treatment, a before-and-after gallery and online quote requests.</p>
        <a class="kws-spot-link" href="/work/#smilys-softwash" aria-label="See the project: Smilys Softwash">See the project</a>
      </div>
    </li>
  </ul>
</section>
```

- Every item needs all of: `.kws-spot-item`, `.kws-spot-frame`, `.kws-spot-cap`; the name must be an
  `h2`, `h3` or `h4`.
- In the kind label, join the dot and every word after it with non-breaking spaces, as above. On a
  narrow phone the label then breaks before the dot, never leaving it hanging at the end of a line.
- Images keep their real `width`, `height` and `alt`. The frame shows them at 1.9 to 1 with
  `object-fit: cover`, so a 1200 by 600 image loses a sliver at each side and a 1200 by 630 one
  nothing you can see.
- The address sits in a small well, as in the site's own browser object. A very long address is cut
  off inside the well (no ellipsis) and cannot squash the three dots.
- Nothing in the frame is blue: it is a drawing of a browser, not a control.
- The attributes and options are the same four as the wheel's (`data-kws="spotlight"`, `data-noun`,
  `data-start`, `data-loop`; `KWS.spotlight.mount(el, { noun, start, loop })`).

## Mounting from code, and from React

```js
const off = KWS.arc.mount(element, { noun: 'service', start: 0, loop: true });   // KWS.spotlight.mount is the same
off();   // removes every listener, observer, control, class, attribute and inline style it added
```

`mount` works after load, any number of times on a page, and on an element it has already mounted (it
hands back the same remover instead of mounting twice). If the element is simply removed from the
page while mounted, nothing holds on to it (tested: it is garbage-collected).

```jsx
import { useLayoutEffect, useRef } from 'react';
import './kit/arc.css';
import './kit/arc.js';                      // registers window.KWS.arc; needs a browser, so load it client-side

export function ServiceWheel({ services }) {
  const root = useRef(null);
  // useLayoutEffect: mounted before the first paint, so the plain list never flashes. mount returns the cleanup.
  useLayoutEffect(() => window.KWS.arc.mount(root.current, { noun: 'service' }), [services.length]);
  return (
    <section ref={root} className="kws-arc" aria-label="Services and prices">
      <ul className="kws-arc-list">
        {services.map(s => (
          <li className="kws-arc-item" key={s.id}>
            <div className="kws-arc-tile" aria-hidden="true">{s.icon}{s.short}</div>
            <div className="kws-arc-cap">
              <h3 className="kws-arc-name">{s.name}</h3>
              <p className="kws-arc-price">{s.price}</p>
              <p className="kws-arc-line">{s.line}</p>
              <a className="kws-arc-link" href={s.href} aria-label={`See what's included in ${s.name}`}>See what's included</a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

React notes: do not put `data-kws` on a React-rendered root (the effect mounts it). Keep `className`
on the root and the items constant, because the script adds `is-live`, `is-moving` and `is-on` to
them. Do not give `style` props to `.kws-arc-tile`, `.kws-spot-frame` or the captions: the script
owns those `style` attributes while mounted and removes them on cleanup. When the list of items
changes, let the effect run again (the dependency above). With server rendering, import the script
inside the effect, and put the one-line holding snippet in the document head.

## What was measured

All on `demo.html` (two wheels and two spotlights on one page), headless Chromium unless it says
otherwise. `sh test/run-all.sh` reruns everything; the last run is `test/results.txt` (178 checks
passed, none failed). The same checks that do not need Chromium's DevTools protocol were also run in
WebKit and Firefox: `test/results-other-browsers.txt`.

| Check | Result |
| --- | --- |
| Signs against the caption (`test/overlap.js`): every width from 360 to 1920px in 4px steps, every item in focus, both wheels on the page: 7,038 states | No sign that shows touches any line of the caption. The nearest a sign beside the caption comes to a line of it is 22.5px. No sign is left part faded at rest. Smallest lettering on any sign after scaling: 12.07px. |
| Sideways scroll, 360 to 1920px in 20px steps (`tools/widths.js`), demo and bare page | None. No element pokes past the window edge at any width. |
| Text and targets at 390px (`tools/smalltext.js`) | Nothing under 12px; no target under 44px. Arrows and dots are 44 by 44. |
| Contrast (`tools/contrast.js`), light and dark, 1440 and 390 | All text passes AA, including the client band. |
| Layout shift when the script upgrades (`test/cls.js`: script held back 700ms after first paint; 390, 768 and 1440; with and without reduced motion) | 0 in all twelve cases. |
| Held height against live height, 27 widths from 360 to 1920 (`test/heights.js`) | The same at every width. The wheel's captions need 192 to 203px of the 216px held. The spotlight's need at most 246px of 251 to 255px below 376px wide, 224px of 229 to 249px up to 440px, and 184 to 206px of 216px above that. |
| Script never arrives (`test/held.js`), 390 and 1440, with and without reduced motion | One item held (wheel 428px, spotlight 514px at 390px wide); after 4 seconds all nine and all three are back, three across at 1440 exactly as with script off. The remover, called after the hold has ended, gives the whole list back at once. |
| Frame times, 390 by 844 at 2x, a fresh page each run (`test/perf.js`): one run unthrottled, four with the CPU throttled 4x. Details in `test/perf-notes.txt`. | The last run (`results.txt`, the finished files): every throttled run had mean 16.7 to 17.4ms, median 16.7ms and 95th centile 16.7 to 16.8ms. The first move after load had no frame over 16.8ms in any of the four throttled pages, for either carousel. The four throttled drag-and-settle runs (about 115 frames each) had two late frames for the wheel and one for the spotlight, each 66.6ms. Two earlier full runs on a quiet machine gave the same picture (3 late frames in about 2,400). Runs made while the machine was busy with other jobs (load 7 to 22 on 4 cores) showed scattered late frames of 33 to 117ms, and a few longer, in both carousels, throttled or not; an A/B of the spotlight with and without its early layers under that load showed no difference (9 v 10 and 27 v 33 late frames in eight drags). Software rendering in headless Chromium, not a real phone. |
| Animation frames requested while idle; `will-change` while idle | 0 before use and 0 after; `auto`. |
| Motion switched off in mid-move (`test/still.js`) | With `data-motion="off"` set, or the device's reduced-motion setting turned on, 90ms into a move, it ends on the next frame on the item it was heading for. Scrolled off screen in mid-move, it asks for no more frames. A move made while off screen is applied at once. |
| Touch, real touch events at 390px (`test/touch.js`) | A vertical swipe that starts on a sign, a card or a caption scrolls the page (about 260px for a 220px swipe) and does not turn the carousel. Swipes at 20, 30, 34, 37, 40, 42 and 44 degrees off horizontal turn it; at 47, 50, 60 and 70 degrees they scroll the page; none does nothing. A slow 60px swipe moves exactly one item on and the same swipe back returns; a 22px nudge springs back. Fast flicks of 120, 200 and 250px move the wheel two signs, never more; a 250px flick moves the spotlight one card. The sign travels 61px, and the card 57px, for 60px of finger travel. |
| Mouse (`test/input.js`) | A press released outside the stage, or never released, leaves nothing following the mouse, and the next arrow click works. A click on the caption link with 10px of wobble follows it. Ctrl+click on the centred sign or card opens a new tab and never moves the page itself (in Chromium, Firefox and WebKit). Cursors: pointer on sign, card, link and arrows; grab on the rest of the stage; grabbing during a drag. Hover lifts 2px, a press sinks 1px. |
| Mouse wheel over a carousel; left alone for 6.5 seconds | The page scrolls as usual and the carousel does not move. No inline style changes: nothing moves by itself. |
| Keyboard walk (`test/contract.js`) | Tab reaches all 9 (and 3) links, each centred and fully visible when focused; then previous, the current dot, next; then leaves. Arrow keys move the item and keep focus on what shows. The focus ring is 3px and solid on every stop. |
| Script off | Nine services with their nine prices in the order of `/services/`, and three projects, all visible, each in its own place, no buttons. |
| Reduced motion; `data-motion="off"` | Arrows change item in the same task with no animation frame; a drag steps once on release. |
| Click after a drag | A drag that ends over a link does not follow it; a plain click on the same link does. |
| Unmount | The markup afterwards is byte for byte what it was before, even when unmounted in the middle of a move. 200 mount and unmount cycles: listeners 58 to 58, DOM nodes 920 to 920. |
| Element removed while mounted and moving (`test/leak.js`) | Garbage-collected. |
| Other counts (`test/edge.js`, 390 and 1280) | Spotlight with 1, 2, 4 and 6 cards; wheel with 1, 2, 4 and 14 signs; `data-loop="false"`; `data-start`. All step correctly and stay inside the window; one item has no controls. |
| What a client site might do (`test/robust.js`) | 50 to 80 letter words and an 80 letter address: no sideways scroll at 360, 390 or 1280; the browser dots keep their size. A default font size of 20, 24 or 32px: no sign past the window edge, controls on one row. Wheels of 12 and 30 signs and spotlights of 5 and 12 cards at 360, 390 and 1280: the controls stay one 44px row (dots where they fit, a count where they do not) and the held height equals the live height. An item missing its sign, frame or caption: `mount` does nothing and throws nothing. |
| Theme and pause (`test/theme.js`) | The site's theme button flips every kit colour with no script involved. With `data-motion="off"` set, the very next move is instant. |
| WebKit 26.6 and Firefox 155 (Playwright's builds, on Linux), at 390 and 1280 (`test/other-browsers.js`, and `BROWSER=webkit` or `BROWSER=firefox` with `contract`, `input`, `still`, `robust`, `held`, `edge` and `theme`) | Everything passes in both: mounting, arrows, dots, keys, the Tab walk, drag, click-after-drag, Ctrl+click, cursors, hover and press, reduced and paused motion (also in mid-move), script off, unmount, the held space and its fallback, other counts, long words and large default fonts. The light, the enamel edges and the nested hover rules all render (`shots/webkit-*.png`, `shots/firefox-*.png`). Touch gestures, frame times and leaks were measured in Chromium only (they need its protocol). |
| Console errors | None, on load or in use. |

## Decisions

- **Blue enamel signs with a gold keyline.** They sit on the painted-sign blue (`--board`) with cream
  lettering, like the price board, so gold only appears on blue and every blue thing is pressable: a
  sign at the side comes to the top, the sign at the top opens its service. Each sign has a thin
  light edge along its top and a deeper one along its bottom, the way thick enamel catches light.
- **The light is behind the object, and it is light.** One fixed pool behind the place in focus;
  signs and cards move into it and out of it. It is added to the page (`screen` blending), so the
  same rule gives a lit sign on the street after closing and next to nothing on daytime paper, where
  the shadow and the keyline do the work instead. Gold is never painted on paper.
- **Side cards are veiled, not see-through.** A veil in the band's colour at 45% keeps a side card a
  solid object: at night it darkens, by day it steps back.
- **One big wheel at every width.** The wheel's radius is always 2.9 times the sign, so a phone shows
  the top three signs of the same wheel a desktop shows nine of, and how many show is decided by
  measuring, not by a list of widths.
- **The spotlight is a ring of three, and the cards are cut like a deck.** Both carousels are endless
  without clones. That is what makes three projects look complete.
- **Captions cross-fade in one place** instead of travelling with their card, so the name and the
  link never move under the thumb. The outgoing one reaches nothing exactly as the incoming one
  starts, so there is no moment with an empty caption. The price sits on a tag drawn by the kit (the
  site's `.tag` is not used, so that client sites get the same thing).
- **Dots are one tab stop**, and each is a full 44px target with 8px between it and the next, so a
  focus ring never touches the neighbouring control. Nine dots do not fit a phone at that size, so
  the phone gets the count; that also keeps the controls to one row for any number of items.
- **Arrows are drawn chevrons** in the site's icon weight with round caps, not text characters.
- **The plain list is centred cards**, the same shape as the live carousel, three across where there
  is room. That is what lets one small rule hold the space, and it is why the fallback after a failed
  script is the same tidy grid as script off.
- **No transitions in the stylesheets and no auto-play, ever.** All movement is the spring in the
  script, and only after input. Hover and press are instant 2px and 1px moves.
- **The status region is hidden by the script, not the stylesheet**, so it stays hidden even if the
  stylesheet fails to load.

## Left out, and why

- **Print.** A printed page shows the item in focus and the controls. Fixing it properly means
  handing the plain list back while printing (about 130 bytes of script and 40 of stylesheet for
  each carousel); `arc.js` and `spotlight.css` have no room, and a printed carousel on a marketing
  page is rare. To print the list, call the remover first.
- **Making the wheel's layers early.** The spotlight now does (see Performance); the wheel's signs
  are small flat shapes, `arc.js` has no bytes left, and its first move measured no worse than its
  later ones.
- **An ellipsis on a long address.** It is cut off inside its well instead; the three dots no longer
  squash. The ellipsis is 23 bytes the spotlight's stylesheet does not have.
- **The address on a side card** is 12px text scaled to about 9px and veiled. It is part of a
  picture that has deliberately stepped back, like the text inside the screenshot under it; it is
  `aria-hidden` and repeats nothing the visitor needs.
- **A second hover cue on a card.** A card lifts 2px on hover and sinks 1px when pressed, like the
  site's buttons. Its border is already ink, and a deeper shadow on hover (as the browser links on
  the Work page have) would need a second shadow variable in the theme contract.
- **Shift+click** on the centred sign or card is a plain click (Ctrl and Cmd open a new tab). The
  caption link itself behaves as any link does.
- **A change event, Home and End keys, a rim drawn behind the wheel.** Not asked for; no bytes.

## Known limits

- Left to right only. In a right-to-left page the layout mirrors badly.
- While live, text inside the carousel cannot be selected with the mouse (the whole stage is the drag
  surface). It can be in the plain list.
- There is no change event. To follow along from outside, watch for class `is-on` on the items.
- The pool of light is added to whatever is painted behind it. Inside a wrapper that is its own
  layer with no background of its own (an element with `opacity` under 1, a `transform`, a `filter`),
  it is painted as plain colour instead, which by day is a faint gold tint on paper. Do not wrap a
  carousel in an element that stays transformed or part transparent. The site's `.reveal` is fine
  once it has finished.
- Longer captions than the ones here need a larger `--cap`, or the carousel grows by the difference
  at the moment the script runs.
- If the script takes longer than 4 seconds to arrive, the list has already come back and the upgrade
  then shifts the page. That is the price of never leaving content hidden.
- Written for the browsers of 2023 and later: Chrome 112, Safari 16.5, Firefox 117 (CSS nesting for
  the hover and pressed states, `color-mix` for the light edge of a sign, `overflow: clip`,
  independent `translate` and `scale`). In Safari 15 and 16.0 to 16.4 it still works, without those
  touches; in Safari 15 a spotlight card on its way out is clipped with `overflow: hidden`, which
  also trims the light above the cards.
- Everything above was checked in headless Chromium, and most of it again in Playwright's WebKit
  and Firefox builds on Linux. That WebKit is Safari's engine but **not Safari on an iPhone**: touch
  in WebKit, a real phone and a real screen reader have not been tried; the roles, names and focus
  order were checked by script. Restoring the page from the back-forward cache and behaviour in a
  background tab were not exercised either; the kit's only timer is one 60ms timeout, and it
  otherwise relies on the browser pausing animation frames. Try both carousels on an iPhone in
  Safari, with Reduce Motion on and off and with VoiceOver, before they go live.
- The state classes are `is-live`, `is-moving` and `is-on`, as the kit contract names them. A carousel
  placed inside another kit component that is itself `is-live` takes its carousel layout a moment
  early.
