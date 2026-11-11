# Motion kit: arc focus carousel and spotlight carousel

Two carousels that move in the plane. Hand-written for knightwebstudio.com; nothing here is copied
from a library or another site. Both are ordinary lists first and carousels second.

| File | What it is | Size |
| --- | --- | --- |
| `arc.css` | The service wheel: styles | 3,490 bytes (budget 3,500) |
| `arc.js` | The service wheel: behaviour | 7,992 bytes (budget 8,000) |
| `spotlight.css` | The project spotlight: styles | 3,496 bytes (budget 3,500) |
| `spotlight.js` | The project spotlight: behaviour | 7,951 bytes (budget 8,000) |
| `demo.html` | Both on a page built from the real stylesheet, with a client palette band | open `http://localhost:8730/kit/flat/demo.html` |
| `test/bare.html` | Both on a page with no site stylesheet and no site script | proof that the kit stands alone |
| `test/` | The checks behind every number in this file | `sh test/run-all.sh` runs them all and writes `test/results.txt` |
| `shots/` | Screenshots that were taken and looked at | |

The four component files are plain, unminified source with no build step. They are within a few bytes of
their budgets, so a change usually means taking something out first.

## What the two share

**How they are built.** A labelled `<section>` holding a `<ul>`. Each `<li>` has a picture part (a sign, or a
framed screenshot) and a caption (heading, text, one link). With no script that is all there is: a tidy list.
The script adds class `is-live` to the root, lays the picture parts out, stacks the captions in one place and
shows the caption of the item in focus. It adds a row of controls (previous, one dot per item, next) and a
polite live region. It never moves by itself.

**Getting about.**
- Drag with a mouse or pen, swipe with a finger. The item under the finger follows it; let go and it settles
  on the nearest item with a soft spring. A quick flick carries on a little (the wheel up to about two more
  signs, the spotlight one card).
- Previous and next arrows; one dot per item; left and right arrow keys whenever focus is inside.
- Click a sign or card at the side and it comes to the centre. Click the one in the centre and its link opens.
- Tab goes through every item's link in order. Tabbing to an item that is off to the side brings it to the
  centre, so focus is never on something you cannot see.
- Only a clearly sideways drag is taken (8px of travel, and at least 1.4 times more sideways than up or down).
  `touch-action: pan-y pinch-zoom` leaves vertical scrolling and pinch zoom to the browser. There is no wheel
  listener. A click that ends a drag follows no link.

**Three states before and after script.**

| State | What the visitor gets |
| --- | --- |
| Script off | The plain list: every item, every price, every link. Nothing hidden, no dead controls. |
| `html.js` set, script not yet run | The space the carousel will take is held, showing the first item where it will sit, so nothing shifts when the script arrives (measured: layout shift 0). If the script never arrives, the full list returns after 4 seconds (a CSS-only fallback: it does not need `main.js`). |
| Live | The carousel. |

**Reduced motion and paused motion.** With `prefers-reduced-motion: reduce`, or `data-motion="off"` on
`<html>`, nothing animates: arrows, dots and keys change item at once, and a drag does not follow the
pointer but steps one item on release. No animation frame is requested at all. Both settings are read at the
moment of each move, so the site's pause control takes effect straight away with no event to wire up. The
stylesheets contain no transitions. (One exception to note: on knightwebstudio.com reduced motion switches
all CSS animation off, which also switches off the 4-second holding trick above. Those visitors see the
plain list for the instant before the script runs.)

**Screen readers.** The root is a labelled region with `aria-roledescription="carousel"`. The list stays a
real list; each item gets `aria-roledescription="slide"` and `aria-label="3 of 9"`. Every item stays in the
reading order, centred or not, so nothing is hidden from a screen reader. The controls are a `role="group"`
named "Choose a service" holding real `<button type="button">`s: "Previous service", one per item named
"SEO & performance, 5 of 9" (the current one carries `aria-current="true"`), and "Next service". After a move
made with the arrows, dots, keys or a drag, a polite live region says the item, for example "Care &
maintenance, 6 of 9". The signs, and the browser bar on a screenshot, are `aria-hidden`: they repeat what
the caption says.

**Keyboard, in full.** Tab: each item's link (the item centres as it is focused), then previous, then the
dots as a single stop (the current dot), then next, then out. Left and right arrows: previous and next, from
anywhere inside; if focus was on a link or a dot it moves to the same thing on the new item. Enter or Space
on any button. Alt, Ctrl and Cmd combinations are left alone. Focus is never trapped. Focus rings come from
the page (3px on knightwebstudio.com, the browser's own elsewhere); the kit never removes an outline.

**Performance.** Animation frames are requested only while the carousel is moving; when it is off screen (an
IntersectionObserver keeps track) a move is applied at once with no frames. Sizes are measured at mount and
again only when a ResizeObserver reports a change; the frame loop only writes `transform`, `opacity` and
`visibility`. `will-change` is set only while moving (class `is-moving`). All listeners are passive except
the three that must cancel something (click, dragstart, keydown).

## Theme: the kit variables

Component CSS never names a colour and never uses a site token on its own. It reads these, each falling back
to a knightwebstudio.com token, so both site themes work with nothing set:

| Variable | Falls back to | Used for |
| --- | --- | --- |
| `--kit-surface` | `--card` | Price tag, link button, arrow buttons, the browser frame, the pool of light |
| `--kit-ink` | `--ink` | Names, prices, button text and outlines, the browser frame's line |
| `--kit-muted` | `--ink-2` (text), `--ink-3` (dots, browser bar) | Caption text, the rings of the dots |
| `--kit-line` | `--line-2` | Arrow button outline, the three dots in a browser bar |
| `--kit-accent` | `--board` (the signs), `--blue` (the current dot) | The enamel of the signs; the current dot |
| `--kit-accent-ink` | `--cream` | Pictogram and lettering on a sign |
| `--kit-gilt` | `--gold` | The keyline on a sign (gold only ever sits on the blue) |
| `--kit-notice` | `--brick` | The kind-of-business label over a project's name |
| `--kit-radius` | `--r-md` | Signs, link buttons, the browser frame (capped at 1.25rem there, so a pill radius cannot crop a screenshot) |
| `--kit-font-display` | `--font-display` | Names, prices, sign lettering |
| `--kit-font-body` | `--font-text` | Everything else |
| `--kit-shadow` | `--shadow-2` | Signs and frames |

`--kit-bg` is not read by these two. On a client site set the variables once on `:root` (or on any wrapper);
see `demo.html` (dark green and cream, squared corners, Palatino) and `test/bare.html` (brick and cream,
fully round, Rockwell, no site CSS at all).

Component knobs, when a page needs them:

| Knob | Where | Default | What it does |
| --- | --- | --- | --- |
| `--cap` | on `.kws-arc` or `.kws-spot` | arc `12.5rem`; spotlight `14.75rem`, `12.5rem` from 600px | The height held for a caption. Every caption must fit in it, or the carousel grows when the script runs. Raise it if you write longer lines. |
| `--t` | on `.kws-arc-list` | `clamp(6.5rem, 22vw, 9.5rem)` while live, `5.5rem` in the plain list | Size of the sign in focus. Everything on a sign scales with it. |
| `--w` | on `.kws-spot-list` | `min(86%, 12rem + 30%)` while live | Width of the card in focus. |

To change `--t` or `--w`, use a selector at least as strong as the kit's, for example `.is-live .kws-arc-list { --t: 8rem; }`.

## 1. Arc focus carousel (`arc.css`, `arc.js`)

**What it is.** Enamel shop signs along the top of a wheel. The sign at the top is largest and in focus; its
neighbours step down in size, tilt with the wheel and fade as they go over the edge. Under it: the name, the
fixed price on a tag, one line and a link. How many signs show follows from the room there is: three on a
phone, five around 768px, seven around 1000px, all nine from about 1100px. With three or more items the
wheel is endless.

**On knightwebstudio.com.** The nine services with their prices exactly as the Services page words them, in
that page's order. Proposed place: the opening of `/services/`, in place of the blue "service menu" panel
(the wheel and the menu say the same nine things, and blue signs beside a blue panel fight). On that page
each link is a same-page anchor (`#website-design`, `#ecommerce`, `#redesigns`, `#brand`, `#seo`, `#care`,
`#automation`, `#google-reviews`, `#growth-consulting`); anywhere else use `/services/#…` as the demo does.
Directly under the page's `h1` the names are `h2`; under an `h2` they are `h3`.

**Suits.** Any business with five to twelve named services or menu sections at fixed prices: a salon's
service menu, an auto shop's standard jobs, a cleaning company's packages, a restaurant's menu sections,
a contractor's trades. Not for long text, not for photographs (use the spotlight), not for fewer than three
items (use a plain row of cards).

**Markup to copy** (one item shown; repeat the `<li>`):

```html
<section class="kws-arc" data-kws="arc" data-noun="service" aria-label="Our services and their prices">
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

- The root needs a name: `aria-label`, or `aria-labelledby` pointing at a heading. Use a `<section>` (or give
  another element `role="group"`).
- The sign holds one line pictogram (a 24 by 24 `viewBox`, strokes only, no fill; the stylesheet sets stroke,
  caps and size) and a short name of at most ten letters. It is decoration and stays `aria-hidden`.
- The name must be an `h2`, `h3` or `h4`: the script reads it for the dots and the announcements.
- Price wording is copied from the site, never rounded or shortened. No "from", no ranges.
- Keep the line to about 75 characters so that every caption fits the held height.
- Give each link its own accessible name (the `aria-label` above starts with the visible words).
- The nine pictograms used on this site (browser window, bag, loop, pencil, magnifier, shield with a tick,
  speech bubble, map pin, compass) are in `demo.html`. They were drawn for this kit in the site's icon style;
  the loop and the pin are the site's own icons.

**Attributes and options.**

| Attribute on the root | Option to `mount` | Default | Meaning |
| --- | --- | --- | --- |
| `data-kws="arc"` | | | Start automatically when the page has loaded. Leave it off when you mount from code. |
| `data-noun="service"` | `noun` | `"item"` | The word in the control names: "Previous service", "Choose a service". |
| `data-start="2"` | `start` | `0` | Item in focus at first (counting from 0). |
| `data-loop="false"` | `loop: false` | loops when there are 3 or more items | Without the loop the wheel has two ends: a drag stops at them, and the arrows go round from the last item to the first. |

## 2. Spotlight carousel (`spotlight.css`, `spotlight.js`)

**What it is.** A row of real screenshots in browser-window frames. The card in the middle is full size,
sharp and lit, standing in a soft pool of light, with the kind of business, the name, what was built and a
link under it. Its neighbours are smaller and dimmed to half. Where there is room a neighbour stands beside
the middle card; where there is not (a phone) it tucks behind it and shows as a sliver. Nothing ever sticks
out past the stage, so it cannot cause sideways scrolling.

**Three is the truth.** With exactly three projects the row is always full: one in the middle, one each side,
whichever is in focus. There are no clones: when you move on, the card that leaves on one side fades out as
it shrinks and fades back in on the other. More items work the same way (three show at a time). Two items
show as a pair with no loop; a single item shows with no controls at all.

**On knightwebstudio.com.** Smilys Softwash first (the local one), Risen Health, Corbel Books, with the
screenshots, `alt` text, sizes and descriptions the Work page already has. Nothing is said about results.
Proposed places: the home page's projects section, and above the three case rows on `/work/`. On the home
page each link goes to `/work/`. On the Work page it would be better to give each case row an `id` and link
to it (`/work/#smilys-softwash`), which needs a one-word change to that page's markup.

**Suits.** A handful of real pieces of work with a real picture each: a roofer's or landscaper's finished
jobs, a remodeller's before-and-after pairs, a baker's cakes, a studio's sites. Use it for 3 to 8 items. The
frame is a browser window, so it suits screenshots best; for photographs leave the `.kws-spot-bar` out and
the frame becomes a plain bordered picture. Never fill it with stock photos or invented clients.

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
        <p class="kws-spot-kind">Exterior cleaning · Local service &amp; SEO</p>
        <h3 class="kws-spot-name">Smilys Softwash</h3>
        <p class="kws-spot-text">Roof and house soft washing across Greater Baton Rouge: a service page per treatment, a before-and-after gallery and online quote requests.</p>
        <a class="kws-spot-link" href="/work/" aria-label="See the project: Smilys Softwash">See the project</a>
      </div>
    </li>
  </ul>
</section>
```

- Images keep their real `width`, `height` and `alt`. The frame shows them at 40:21 (1200 by 630) with
  `object-fit: cover`, so a 1200 by 600 image loses a sliver at each side and nothing else.
- Nothing in the frame is blue: it is a drawing of a browser, not a control.
- The attributes and options are the same four as the wheel's (`data-kws="spotlight"`, `data-noun`,
  `data-start`, `data-loop`; `KWS.spotlight.mount(el, { noun, start, loop })`).

## Mounting from code, and from React

```js
const off = KWS.arc.mount(element, { noun: 'service', start: 0, loop: true });   // KWS.spotlight.mount is the same
off();   // removes every listener, observer, control, class, attribute and inline style it added
```

`mount` works after load, any number of times on a page, and on an element it has already mounted (it hands
back the same remover instead of mounting twice). If the element is simply removed from the page while
mounted, nothing holds on to it (tested: it is garbage-collected).

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

React notes: do not put `data-kws` on a React-rendered root (the effect mounts it). Keep `className` on the
root and the items constant, because the script adds `is-live`, `is-moving` and `is-on` to them. Do not give
`style` props to `.kws-arc-tile`, `.kws-spot-frame` or the captions: the script owns those `style`
attributes while mounted and removes them on cleanup. When the list of items changes, let the effect run
again (the dependency above). With server rendering, import the script inside the effect. On a static client
page, put `class="js"` on `<html>` from a one-line script in the head, as this site does, to get the held
space before the script runs.

## What was measured

All on `demo.html` (two wheels and two spotlights on one page), headless Chromium unless it says otherwise, scripts in `test/`.

| Check | Result |
| --- | --- |
| Sideways scroll, 360 to 1920px in 20px steps (`tools/widths.js`) | None. No element pokes past the window edge at any width, and no box scrolls sideways. |
| Text and targets at 390px (`tools/smalltext.js`) | Nothing under 12px; no target under 44px high. Arrows 44 by 44; dots 24 by 44 (the site's rule: 44 one way, at least 24 the other). |
| Contrast (`tools/contrast.js`), light and dark, 1440 and 390 | All text passes AA. |
| Layout shift when the script upgrades (`test/cls.js`: script held back 700ms after first paint; 390, 768, 1440) | 0 in every case. |
| Held height against live height, 21 widths from 360 to 1920 (`test/heights.js`) | The same at every width. The wheel's captions need 165 to 195px of the 200px held; the spotlight's need 187 to 231px of 236px on phones and 188 to 194px of 200px from 600px. One exception: at 360px the Smilys caption needs 251px. It is the first item, so nothing moves; if the order changes, raise `--cap` to `15.75rem` below 380px. |
| Frame times, 390 by 844 at 2x, CPU throttled 4x (`test/perf.js`, four runs; the last is in `test/results.txt`) | Wheel: mean 16.7 to 17.1ms, median 16.7ms, 95th centile 16.8ms, for the arrow spring (about 36 frames) and for a touch drag with its settle (about 112 frames); worst frame 16.8ms in two runs and 33.3ms in two. Spotlight: mean 16.7 to 17.6ms, median 16.7ms, 95th centile 16.8ms; each run had one or two late frames (33 to 50ms) at the very start of a move, when its three framed screenshots become layers, and none after that. Unthrottled the numbers are the same, with that first frame once measuring 83ms. This is headless Chromium with software rendering; it has not been timed on a real phone. |
| Animation frames requested while idle | 0 before use and 0 after. `will-change` is `auto` when idle. |
| Touch (`test/touch.js`, real touch events at 390px) | A vertical swipe that starts on a sign, a card or a caption scrolls the page (about 260px for a 220px swipe) and does not turn the carousel. A slanted, mostly vertical swipe still scrolls. A sideways swipe turns it and the page does not move. |
| Mouse wheel over a carousel | Scrolls the page as usual; the carousel does not move (no wheel listener exists). |
| Left alone for 6.5 seconds | No inline style changes: nothing moves by itself. |
| Keyboard walk (`test/contract.js`) | Tab reaches all 9 (and 3) links, each centred and fully visible when focused; then previous, the current dot, next; then leaves. Arrow keys move the item and keep focus on what shows. |
| Script off | Nine services with their nine prices and three projects, all visible, each in its own place, no buttons. |
| Reduced motion; `data-motion="off"` | Arrows change item in the same task with no animation frame; a drag steps once on release. |
| Click after a drag | A drag that ends over a link does not follow it; a plain click on the same link does. |
| Unmount | The markup afterwards is byte for byte what it was before, even when unmounted in the middle of a move. 200 mount and unmount cycles: listeners 48 to 48, DOM nodes 948 to 948. |
| Element removed while mounted and moving (`test/leak.js`) | Garbage-collected. |
| Script never arrives, `html.js` set (`test/held.js`) | First item shown in the held space for 4 seconds, then all nine (and three) return as a list. |
| Other counts (`test/edge.js`, 390 and 1280) | Spotlight with 1, 2, 4 and 6 cards; wheel with 2, 4 and 14 signs; `data-loop="false"`; `data-start`. All step correctly and stay inside the window. |
| Theme and pause (`test/theme.js`) | The site's theme button flips every kit colour with no script involved. With `data-motion="off"` set, the very next move is instant. |
| Firefox 155, at 390 and 1280 (`test/other-browsers.js`) | Mounts, arrows, drag and focus-to-centre all work; nothing past the window edge; the same heights as Chromium to the pixel. Screenshots `shots/firefox-*.png`. WebKit could not be launched on this machine. |
| Console errors | None, on load or in use. |

## Decisions

- **Blue enamel signs with a gold keyline.** They sit on the painted-sign blue (`--board`) with cream
  lettering, like the price board, so gold only appears on blue and every blue thing is pressable: a sign at
  the side comes to the top, the sign at the top opens its service.
- **The wheel loops; the spotlight is a ring of three.** Both are endless without clones, by fading an item
  out at one side and in at the other. That is what makes three projects look complete.
- **Neighbours never leave the stage.** On a phone they tuck behind the middle card rather than run off the
  screen edge, so the site's overflow check passes and nothing is half cut by the window.
- **Captions cross-fade in one place** instead of travelling with their card, so the name and the link never
  move under the thumb. The price sits on a tag drawn by the kit (the site's `.tag` is not used, so that
  client sites get the same thing).
- **Dots are one tab stop.** Nine extra stops would make the wheel slower by keyboard than the plain list.
- **Arrows are the characters ‹ and ›** set in the body font rather than drawn icons. That saved the bytes
  that pay for the held space and the 4-second fallback. The site's text face has both; a client face
  without them falls back to the system font for those two characters.
- **No transitions in the stylesheets and no auto-play, ever.** All movement is the spring in the script, and
  only after input.
- **Budgets were met by leaving things out:** no change event, no rim drawn behind the wheel, no gloss on the
  enamel, no Home and End keys.

## Known limits

- Left to right only. In a right-to-left page the layout mirrors badly.
- While live, text inside the carousel cannot be selected with the mouse (the whole stage is the drag
  surface). It can be in the plain list.
- Print shows the item in focus only, not the whole list.
- The wheel with a single item still shows its controls. It is meant for three or more.
- There is no change event. To follow along from outside, watch for class `is-on` on the items.
- Do not place the wheel on the blue board or inside `.on-blue`: the signs are that blue. On a client site
  the same goes for any band in the accent colour.
- Longer captions than the ones here need a larger `--cap`, or the carousel grows by the difference at the
  moment the script runs.
- If the script takes longer than 4 seconds to arrive, the list has already come back and the upgrade then
  shifts the page. That is the price of never leaving content hidden.
- Written for Chrome 88, Safari 15 and Firefox 86 or later (`:is()`, `aspect-ratio`, listener signals,
  `ResizeObserver`). Older browsers are not handled.
- Everything above was checked in headless Chromium, with a smoke test in Firefox. **Safari has not been
  tried** (WebKit would not launch here), nor a real phone, nor a real screen reader; the roles, names and
  focus order were checked by script. Try it on an iPhone before it goes live.
- The state classes are `is-live`, `is-moving` and `is-on`, as the kit contract names them. A carousel
  placed inside another kit component that is itself `is-live` takes its carousel layout a moment early.
