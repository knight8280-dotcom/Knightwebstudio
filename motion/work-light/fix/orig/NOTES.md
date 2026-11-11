# Motion kit: animated backgrounds, folder cards, bookmark cards

Hand-built for knightwebstudio.com and for client sites built from the KnightWebstudio template.
Nothing here is copied from a library or another site; the one borrowed snippet is the 2D simplex
noise function by Ian McEwan (Ashima Arts, MIT licence), noted where it sits in `shader.js`.

| File | What it is | Size |
| --- | --- | --- |
| `shader.js` | The three animated backgrounds and the motion pause button | 15,993 bytes (budget 16,000) |
| `shader.css` | Their still states, the grain, the pause button | 4,193 bytes: backgrounds 3,360, pause button 833 |
| `cards.css` | Folder cards, the folder stack, bookmark cards | 6,992 bytes: shared 2,190, folder cards 2,070, stack 1,689, bookmark cards 1,043 |
| `cards.js` | The folder stack's tabs. Nothing else in `cards.css` needs script | 4,884 bytes (budget 8,000) |
| `demo.html` | The components on a page built like the site, plus the same kit in another brand | |
| `portable.html` | The kit on a bare page: no site stylesheet, a third brand | |
| `shots/` | Screenshots at 390 and 1440, both themes, several moments | |

Load order on a page: the two stylesheets in the head; the scripts with `defer`, in any order,
after the site's own. Neither script needs `main.js` or any site class.

```html
<link rel="stylesheet" href="/assets/kit/shader.css">
<link rel="stylesheet" href="/assets/kit/cards.css">
...
<script src="/assets/kit/shader.js" defer></script>
<script src="/assets/kit/cards.js" defer></script>   <!-- only on pages with a folder stack -->
```

Everything hangs off one namespace, `window.KWS`: `KWS.shader`, `KWS.motion`, `KWS.folders`.

## 1. The theme contract

Kit CSS never uses a site token directly and never a hex colour. It reads these variables, each
with a fallback to this site's token, so on knightwebstudio.com nothing needs setting and both
themes and the tone scopes (`.on-blue`, `.on-ink`, `.on-paper`) come free.

| Variable | Falls back to | Used for |
| --- | --- | --- |
| `--kit-bg` | `--paper` | The ground of the ribbon art, the back leaf of a folder, unselected tabs |
| `--kit-surface` | `--card` | Card, folder and tab fill; the pause button; the arrow chip |
| `--kit-ink` | `--ink` | Titles, prices, tab names, the grain's colour, the selected tab's strip |
| `--kit-muted` | `--ink-3` | Card copy, labels |
| `--kit-line` | `--line-2` | Hairlines |
| `--kit-accent` | `--blue` (focus ring: `--focus`) | The arrow on a card that is a link, the focus ring, a ribbon colour |
| `--kit-accent-ink` | `--on-blue` | Not used by these components (reserved for buttons in other groups) |
| `--kit-notice` | `--brick` | Folder numerals, the ribbon bookmark, a ribbon colour |
| `--kit-gilt` | `--gold` | The band's flecks, the thread in the first ribbon colourway |
| `--kit-radius` | `--r-lg` | Card and folder corners; tabs and art windows use 55% of it |
| `--kit-font-display` | `--font-display` | Titles, numerals, prices |
| `--kit-font-body` | `--font-text` | Everything else |
| `--kit-shadow` | `--shadow-1` | Cards and folders |
| `--kit-shader-1`, `-2`, `-3` | accent, gilt, surface (on this site: brick tint by day and board blue by night; card by day and `--paper-3` by night; `--paper-3`) | The three lights of the **wash** only |

Spacing and type sizes use the site's scale with a plain fallback: `--gap` (24px), `--pad` (24px),
`--fs-sm`, `--fs-label`, `--fs-h4`, `--fs-h3`, `--fs-title`, `--fs-price`.

On a client site, set the thirteen variables once (on `:root`, or on a wrapper to theme one
block). `portable.html` is the proof with no site stylesheet at all; the "For client builds"
section of `demo.html` is the proof inside the site. A dark block inside a light page (the band)
re-points the text variables on that block, as `.on-blue` does on this site:

```css
.closing { background: #1E3A2B; --kit-ink: #FFFDF6; --kit-muted: #D3DCCB; --kit-accent: #FFFDF6; --kit-notice: #E8B84A; }
```

## 2. Animated backgrounds

Three presets, chosen with `data-shader`. Each is a layer: an empty element that the script
fills with a canvas. The layer's CSS (in `shader.css`) is the still picture: what shows with
script off, without WebGL, with Save-Data, and until the canvas has drawn its first frame.

### wash: light behind a first screen

What it is for: the first screen of a page. By day slow morning light crosses the paper, with
slanted shafts as through a shop window; at night it is the blue hour. Barely there by design.
It suits any business; it takes its mood entirely from the palette.

```html
<section class="page-head kws-shader-host">
  <div class="kws-shader" data-kws="shader" data-shader="wash" aria-hidden="true"></div>
  <div class="container"> ... eyebrow, h1, lede, buttons ... </div>
</section>
```

The host needs class `kws-shader-host` (it sets `position: relative; isolation: isolate`). The
layer is its first child and sits behind everything in the host. The wash fades out over the
bottom 40% and the top 14% of the layer, so it meets the page with no edge.

### band: slow folds in a colour block

What it is for: the deep-blue closing band, and any blue panel. Slow folds in a lit and a deep
tone of the block's own colour, with sparse gold-leaf flecks. Above the footer skyline it reads
as the evening sky over Baton Rouge. On a client site it works on any strong colour block.

```html
<section class="cta-band on-blue kws-shader-host">
  <div class="kws-shader" data-kws="shader" data-shader="band" aria-hidden="true"></div>
  <div class="container cta-inner"> ... </div>
</section>
```

- The folds are computed from the colour actually painted behind the layer, so there is nothing
  to configure: put it on a green block and the folds are greens.
- The flecks take `--kit-gilt`. Before drawing, the script measures every line of text in the
  host and keeps the flecks at least 22px away from it. It measures again when the host
  changes size or the theme changes; call `KWS.shader.refresh()` if you change the text some
  other way.
- It fades to the plain block colour over the top 12%, so the scalloped edge of `.cta-band`
  still meets a flat blue.

### ribbon: silk ribbons as the art in a card

What it is for: the picture inside a bookmark card or along the top of one folder. Three silk
ribbons laid on the page colour: one wide ribbon with a thread, two narrow ones. Each twists
slowly and shows a darker back face. It is art only: **never put text on it** (it has no
contrast guard).

```html
<div class="kws-mark-art"><span class="kws-shader" data-kws="shader" data-shader="ribbon" data-tone="2" aria-hidden="true"></span></div>
```

| `data-tone` | Wide ribbon | Thread | Narrow ribbons |
| --- | --- | --- | --- |
| `1` (default) | accent (blue) | gilt (gold, on the blue ribbon only) | notice (brick) |
| `2` | notice (brick) | surface (cream) | ink |
| `3` | ink | notice (brick) | accent (blue) |

The tone also changes the shapes, so three cards side by side differ. The parent only has to be
`position: relative` with a size (an aspect ratio or a height) and `overflow: hidden`.

### Attributes and options

| Attribute on the layer | Meaning |
| --- | --- |
| `data-kws="shader"` | Auto-start when the page has loaded and gone quiet |
| `data-shader="wash" \| "band" \| "ribbon"` | The preset. Without it: wash |
| `data-tone="1" \| "2" \| "3"` | Ribbon colourway and shape |
| `data-shader-speed="0.5"` | Speed, 1 by default |

`KWS.shader.mount(element, options)` returns a function that removes the canvas, the
observers and the `is-live` class. Options: `speed` (number), `seed` (number: another shape),
`contrast` (the ratio the text must keep, 4.8 by default). Mounting the same element twice
returns the same remover. `KWS.shader.refresh()` re-reads colours and text positions.

From React (leave `data-kws` off so that only the effect mounts it):

```jsx
import { useEffect, useRef } from 'react';

export function Shader({ preset = 'wash', tone, speed }) {
  const ref = useRef(null);
  useEffect(() => window.KWS.shader.mount(ref.current, { speed }), [preset, tone, speed]);
  return <div ref={ref} className="kws-shader" data-shader={preset} data-tone={tone} aria-hidden="true" />;
}
// <section className="hero kws-shader-host"><Shader /> ... </section>
```

Import the files once in the app's entry (`import './kit/shader.css'; import './kit/shader.js';`):
the script is a plain IIFE that attaches `window.KWS`.

### Colours and the theme

At the first draw, and again whenever `data-theme` on `<html>` changes or the device switches
between light and dark, the script reads the layer's computed variables and the background
colours of the layer and its ancestors (composited, so a translucent panel works). Any CSS
colour the browser can parse is fine. There is nothing to wire to the theme button.

### Text stays readable

- **wash** and **band** cap every pixel: the script works out the darkest and lightest the
  ground may get while `--kit-ink`, `--kit-muted`, `--kit-accent` and `--kit-notice` keep
  4.8:1 against it, and the shader holds each pixel inside that range. The wash also softens
  any colour it is given to a tint that is safe by itself, so a strong brand colour becomes a
  faint one instead of a flat patch.
- **band**'s flecks are brighter than that range on purpose; they are kept out of every text
  box instead.
- The still states are safe too: the wash's still is two pools of the surface colour, which
  text already sits on.
- Measured, not assumed: see section 7.

### Script off, reduced motion, paused

| State | What shows |
| --- | --- |
| Script off, no WebGL, Save-Data, Safari before 17 | The CSS still: soft light (wash), the plain block with a faint light (band), three arcs in the ribbon colours (ribbon). Fine grain on all three |
| `prefers-reduced-motion`, or `html[data-motion="off"]` at load | One still frame of the real picture, drawn once when the layer comes on screen; no animation loop |
| Paused with the button | The canvas holds its current frame. A theme change while paused repaints each visible layer once |
| Off screen, or in a background tab | Nothing is drawn |

### How it stays light

- One WebGL context for the whole page, on an offscreen canvas. Each layer owns a small canvas
  and is handed finished frames (`transferToImageBitmap`), so nothing is read back or copied.
- Low resolution: wash and band at half a CSS pixel or less (at most 80,000 and 100,000
  pixels), ribbon at up to 1.5 device pixels (at most 50,000). The grain is a CSS layer on
  top, so the picture can be soft and the grain still fine.
- 30 frames a second at most, on a budget of 100,000 pixels a frame: when several layers are
  on screen they take turns (three ribbon cards get about 20 frames a second each, which is
  plenty for motion this slow). If frames arrive late the budget shrinks (to 30,000 at the
  least) and grows back when the machine keeps up.
- The shared canvas only ever grows and each layer shows one corner of it, so the browser
  reuses its buffers instead of allocating new ones as layers of different sizes take turns.
- No layout work in the frame loop: sizes come from a ResizeObserver, visibility from an
  IntersectionObserver. Nothing starts until the page is idle.
- The last layer to be removed releases the context and every observer and listener.

### Accessibility

The layer is `aria-hidden="true"` and has `pointer-events: none`. It holds no text and takes
no focus. Motion is slow (nothing flashes) and can be paused with one site-wide button.

### Limits

- Needs WebGL on an OffscreenCanvas (Chrome 69, Firefox 105, Safari 17). Older browsers keep
  the still. That is deliberate: there is one code path, and old phones are spared the work.
- `--kit-shader-1/2/3` colour the wash only. The band always takes its folds from its ground
  and its flecks from `--kit-gilt`; the ribbon takes accent, gilt, notice, ink and surface.
- The band measures text when it first draws, on resize and on theme change. Text that moves
  for another reason (a late web font that does not change the block's height, say) needs
  `KWS.shader.refresh()`.
- With software rendering and four layers on screen at once, each layer updates about 7 to
  10 times a second instead of 20 to 30. The page itself stays at 60.

## 3. The motion pause button

One quiet, round, 44px button that pauses and resumes all ambient motion on the site
(WCAG 2.2.2). Put it once per page; the demo has it in the footer's last row.

```html
<button class="kws-motion" data-kws="motion" type="button" hidden>
  <svg class="kws-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>
  <svg class="kws-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
</button>
```

- It carries `hidden` in the markup, so with script off there is no dead button. The script
  shows it and gives it its name: "Pause background motion" or "Play background motion"
  (`aria-label` and `title`). The two icons swap in CSS from `html[data-motion]`.
- Pressing it sets `data-motion="off"` on `<html>` (or removes it) and stores `off` or `on` in
  `localStorage` under `kws-motion`. Several buttons on one page stay in step.
- The starting state: the stored choice if there is one; otherwise off when the device asks
  for reduced motion, on when it does not. A visitor with reduced motion who presses Play has
  made a choice, and the backgrounds then move.
- For other scripts in the kit: read `document.documentElement.dataset.motion === 'off'`, or
  `KWS.motion.off()`; listen for `kws:motion` on `document` (`event.detail.off`); set it with
  `KWS.motion.set(true)`. In CSS: `html[data-motion="off"] .thing { animation: none; }`.
- `KWS.motion.mount(button)` returns a function that removes the listener and hides the
  button again. React: `useEffect(() => window.KWS.motion.mount(ref.current), [])`.
- Keyboard: it is a real `<button>`: Tab reaches it, Enter and Space press it. It uses the
  page's own focus ring.

## 4. Folder cards

What it is for: a short numbered sequence. Manila job folders from the shop's filing drawer:
a real tab with the number in Fraunces, a curved shoulder, a back leaf showing behind the
front one. It suits process steps, "how it works", a set of plans, anything in a fixed order:
trades, studios, clinics, a restaurant's catering steps. No script.

```html
<ol class="kws-folders">
  <li class="kws-folder kws-link">                       <!-- kws-link only when the card is a link -->
    <p class="kws-folder-tab" aria-hidden="true"><span class="kws-folder-no">01</span></p>
    <div class="kws-folder-body">
      <!-- optional, on one folder only: the ribbon art along the top -->
      <div class="kws-folder-art"><span class="kws-shader" data-kws="shader" data-shader="ribbon" aria-hidden="true"></span></div>
      <p class="kws-label">Free · 30 minutes</p>
      <h3><a href="/contact/">Discovery call<svg class="kws-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></a></h3>
      <p>A call about your business, your customers and what the site needs to achieve.</p>
    </div>
  </li>
  <li class="kws-folder">
    <p class="kws-folder-tab" aria-hidden="true"><span class="kws-folder-no">02</span></p>
    <div class="kws-folder-body">
      <p class="kws-label">Fixed quote</p>
      <h3>Proposal &amp; design</h3>
      <p>A fixed quote and timeline, then design concepts for your key pages.</p>
    </div>
  </li>
</ol>
```

- One column on a phone, two from 760px, four from 1100px.
- The number tab is `aria-hidden` because an `<ol>` already numbers the steps.
- A card that is a link: put the link inside the heading, add the arrow `<svg class="kws-go">`
  inside the link, and add `kws-link` to the card. The link then covers the whole folder body;
  its name for a screen reader is just the heading. The focus ring is drawn round the whole
  body (3px, accent colour, or `--focus` on this site). The card lifts 3px under a pointer and
  sinks 1px when pressed. A folder with no link has no arrow and does not lift.
- Use the heading level that fits the page (the styles apply to `h3`; add the site's class
  `h3` to an `h2` if the outline needs it).
- At most one folder in a set carries the ribbon strip. The rest stay paper.
- Colour rule on this site: numerals are brick, labels grey, the arrow blue because it is
  pressable. Nothing else is coloured.

## 5. The folder stack

What it is for: choosing one of a few things that are each too long to show at once on a
phone. A stack of folders with a tab for each; choosing a tab brings that folder to the
front. Built for the four website packages, where the tabs themselves show all four fixed
prices. It suits packages, plans, locations, menus by course: two to five folders.

```html
<div class="kws-folders kws-folders--stack" data-kws="folders" data-label="Website packages">
  <article class="kws-folder" id="pkg-starter">
    <h3 class="kws-folder-tab">Starter <b>$2,000</b></h3>
    <div class="kws-folder-body">
      <p class="kws-folder-price">$2,000</p>
      <p>Or $1,000 down, then about $333/mo for 3 months</p>
      <dl>
        <div><dt class="kws-label">Live in</dt><dd>As little as 7–10 days</dd></div>
        <div><dt class="kws-label">Included</dt><dd>Copy editing and polish (you supply the text)</dd><dd>Contact form</dd><dd>Mobile &amp; SEO basics</dd></div>
      </dl>
      <div class="btn-row"> ... the site's own buttons ... </div>
    </div>
  </article>
  ... one article per folder ...
</div>
```

| On the root | Meaning |
| --- | --- |
| `class="kws-folders kws-folders--stack"` | A stack at every width |
| add `kws-folders--phone` | A stack below 760px only; from 760px the same folders sit in a row (two across, four from 1100px) and no tabs are built |
| `data-kws="folders"` | Auto-start |
| `data-label="..."` | The accessible name of the tab list. Always set it |
| `data-start="3"` | Open on the third folder. Default: the first |

`KWS.folders.mount(element, { start, label })` returns a function that puts the list back
exactly as it was. React: `useEffect(() => window.KWS.folders.mount(ref.current), [])`.

What the script does: it builds a `role="tablist"` of real `<button role="tab">`s from each
folder's tab (same words, same class), makes each folder a `role="tabpanel"` named by its
tab, and hides the folders' own tab headings. Folders that are not in front are
`visibility: hidden`, so they are out of the tab order and unread; all folders share one grid
cell, so the stack keeps the height of the tallest and nothing below it moves when you switch.

- Keyboard: Tab reaches the selected tab; Left and Right move and open (they wrap); Home and
  End jump; Tab again goes to the open folder, then to its links, then out. Tabs are at least
  44px tall (58px with a price line).
- Screen readers: "Website packages, tab list; Starter $2,000, tab, selected, 2 of 4", then
  the panel, named by its tab.
- A `#hash` that names a folder (or anything inside one) opens that folder, on load and when
  the hash changes, so the page's own links such as `/pricing/#pkg-business` work.
- Motion: the newly chosen folder's contents rise 8px and fade in over 0.28s (transform and
  opacity). Not on first paint, not under reduced motion, not when `data-motion="off"`: then
  the swap is instant.
- Script off: every folder shows, one under the other (or in the row, for the phone variant),
  each with its own tab as its heading.
- No layout shift on upgrade: when `<html>` has class `js` before first paint (this site's
  head snippet sets it), the stack is laid out in its final form by CSS alone and the script
  only swaps the tab row in. Measured shift: 0. A client page should set the same class early:
  `<script>document.documentElement.classList.add('js')</script>`. If `cards.js` could fail to
  load while that class is set, add `onerror="document.documentElement.classList.remove('js')"`
  to its script tag so the folders are not left hidden.
- So that four tabs fit a small phone, tab names are 12.5px at 360px wide, 13.3px at 390px and
  15px from 442px; the price under each is 15.8px at 360px and 19px from 432px. Measured spare
  room in the tightest tab ("Commerce"): 2.5px at 360px, 5.6px at 390px. Keep each name to one
  short word and one price; with five tabs or longer words, test at 360px.

## 6. Bookmark cards

What it is for: three or so things of equal weight, each one link. A tall paper card with a
ribbon bookmark hanging from its top edge, a small label, the ribbon art in a window, then
the name large with its fixed price beneath. Built for the three service families. It suits
services, collections, menus, classes: anything with a name, one honest line and a price.
No script (the art is a shader layer, but the card is complete without it).

```html
<ul class="kws-marks">
  <li class="kws-mark kws-link">
    <p class="kws-label">Built for you</p>
    <div class="kws-mark-art"><span class="kws-shader" data-kws="shader" data-shader="ribbon" data-tone="1" aria-hidden="true"></span></div>
    <h3><a href="/services/">Website design &amp; build<svg class="kws-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></a></h3>
    <p class="kws-mark-price">$1,000, $2,000 or $4,000</p>
    <p>A custom-designed marketing site built from scratch.</p>
  </li>
  ...
</ul>
```

- Keep the five children in this order (label, art, heading, price, line): from 760px the
  cards share their rows (`subgrid`), so names, prices and lines align across the three even
  when one name wraps.
- A stack on a phone with a 16:7 art window; three across from 760px with a 4:3 window.
- The whole card is one link (the heading's link covers it), named by the heading alone; the
  price and line are read after it as ordinary text.
- Honest words only: the name, and the fixed prices exactly as the site states them. Never a
  statistic, never a range, never "from".
- The bookmark is drawn in CSS in the notice colour (brick). It is decoration.
- This site does not allow sideways scrollers, so there is no swipe row. A client site that
  wants one can add it in its own stylesheet:

```css
@media (max-width: 759.98px) {
  .kws-marks { grid-auto-flow: column; grid-auto-columns: 84%; overflow-x: auto; padding: 8px 0 12px; scroll-snap-type: x mandatory; }
  .kws-marks > * { scroll-snap-align: center; }
}
```

## 7. What was measured

All in headless Chromium with software WebGL (`--enable-unsafe-swiftshader --use-angle=swiftshader`), on
a machine that other jobs were loading at the time (load average about 7 on 4 cores), so the
frame figures are pessimistic. Test scripts: `motion/work-light/t_basic.js`, `t_motion.js`,
`t_cost.js`, `t_contrast.js` with `contrast.py`, `t_tabs.js`.

**Sizes** (bytes on disk, 1 KB = 1,000): `shader.js` 15,993 of 16,000. `cards.js` 4,884 of 8,000.
`shader.css` 4,193: backgrounds 3,360, pause button 833. `cards.css` 6,992: shared base 2,190,
folder cards 2,070, folder stack 1,689, bookmark cards 1,043. See section 9 on how these read
against the 3.5 KB line.

**No sideways scroll**: `tools/widths.js` on `demo.html` and `portable.html`, every 20px from
360 to 1920: no overflow, no element past the right edge, no sideways scroller.

**Contrast, computed**: `tools/contrast.js` on both pages, 390 and 1440, both themes: all text
passes AA.

**Contrast, measured over the moving backgrounds**: the page is loaded with the shaders running
25 times faster, the words are made transparent, and the region behind every line of text is
photographed frame after frame (about ten seconds of shader time apart) and compared, pixel by
pixel, with that text's colour. Wash and band on this site and in the second brand, phone and
desktop, both themes: 16 cases. Two runs, 672 frames, about 57 million pixels behind text:
**none below AA**.

| Case | Lowest ratio seen (4.5 needed) |
| --- | --- |
| Wash behind the first screen, day | 4.88:1 at 390px, 4.97:1 at 1440px (the grey "Websites" label, which is 5.03:1 on plain paper) |
| Wash behind the first screen, night | 6.01:1 |
| Band behind the closing call to action | 5.52:1 (day 5.56:1) |
| Second brand, wash | 5.01:1 day, 5.16:1 night |
| Second brand, band | 5.33:1 |

**Frame times with the CPU throttled 4x** (`Emulation.setCPUThrottlingRate`), three passes of
three seconds in each section. "Page frame" is the gap between the page's animation frames
(16.7ms is a steady 60 a second); "kit" is the time inside the kit's own frame callback.

| Section on screen | 390x844 at 3x: page frame median / p95 / worst | 1440x900: page frame median / p95 / worst | Kit callback p95 / worst |
| --- | --- | --- | --- |
| First screen (wash) | 16.7 / 16.7 to 16.8 / 16.8 | 16.7 / 16.8 (one pass 33.3) / 66.7 | 10.3 / 27.3 |
| Three bookmark cards (three ribbons) | 16.7 / 16.7 to 16.8 / 66.7 | 16.7 / 16.7 to 16.8 / 66.6 | 7.6 / 32.4 |
| Step folders (one ribbon strip) | 16.7 / 16.7 to 16.8 / 33.4 | 16.7 / 16.7 / 16.8 | 2.0 / 8.9 |
| Package stack (no canvas) | 16.7 / 16.7 / 16.8 | 16.7 / 16.7 to 16.8 / 16.8 | 0 |
| Second brand (wash and two or three ribbons at once) | 16.7 / 16.7 to 16.8 / 50.0 | 16.7 / 16.8 (one pass 49.9) / 150.1 | 5.2 / 20.0 |
| Closing band | 16.7 / 16.7 to 16.8 / 49.9 | 16.7 / 16.7 to 16.8 / 66.6 | 6.1 / 21.9 |

Frames over 50ms: none in 29 of the 36 measurements; at worst 4 of 146. Layers drew at 30 a
second alone, about 20 each for three ribbons, 6 to 13 each when four layers shared the screen.

**Only what is on screen**: eleven layers on the demo page; at the top one is drawn (30 draws a
second); at the cards the three on screen share 55 to 61 draws a second; the rest are idle.
Paused: 0 draws and 0 animation frames asked for; the canvas keeps its frame. Background tab: 0.
A theme change while paused: each on-screen layer repaints once.

**Reduced motion** (Playwright `reducedMotion: 'reduce'`): the page starts with
`data-motion="off"`, each layer draws one still frame when it comes on screen, 0 draws a second
afterwards, and choosing a tab swaps the folder with no animation. Pressing Play starts the motion.

**Script off**: all four package folders and their tabs show, three bookmark cards, four step
folders, the ribbon art as its CSS still, no canvas, the pause button hidden, no sideways scroll.

**No layout shift on upgrade**: cumulative layout shift 0.0000 at 390px and at 1440px, measured
from load through a scroll of the whole page.

**Keyboard and semantics** (24 checks pass): tab list named "Website packages" with four real
buttons wired to four panels; roving tabindex; Right, Left, Home, End (wrapping); Tab goes tab,
panel, the panel's links, out; hidden folders are skipped; a `#hash` opens its folder; a card's
link shows a 3px ring round the whole card; the pause button is 44x44px, sets the attribute,
saves the choice, survives a reload, and keeps two buttons in step; no console errors.

**Touch**: with touch emulated at 390px, a 300px upward swipe that starts on the ribbon art, a
folder, the tab row, the open folder or the band scrolls the page 285 to 395px; a tap on a tab
opens it. Nothing in this group listens for pointer movement.

**Leaks**: 40 mounts and unmounts after load leave the canvas count unchanged and nothing
behind; mounting one element twice gives one instance; removing every layer from the page
without calling its remover stops the loop (0 draws, 0 frames asked for); 24 full start-and-stop
cycles, each with a new WebGL context, all drew with no "too many contexts" warning.

**Tabs at phone widths** (`t_tabs.js`): the widest tab text has 2.5px to spare at 360px, 5.2px
at 375px, 5.6px at 390px.

**Small text and targets** (`tools/smalltext.js`): nothing under 12px. It lists the cards'
heading links as small targets because it measures the link's text box; the link's `::after`
covers the whole card (373x517px on desktop), which is the real target.

## 8. Decisions

1. **The grain is still and the light moves.** The grain is a CSS layer in the ink colour over
   both the still and the canvas, so it is the paper's grain, the canvas can be drawn at low
   resolution, and the no-script state has it too.
2. **Night wash is all blue.** A warm "shop window" glow was tried twice (gold, then the night
   brick tint): once capped for contrast it turns to a muddy brown patch, and gold on night
   paper breaks the gold rule. The lit window is a lighter slate with the same slanted shafts.
3. **The band's flecks are kept out of the text instead of being capped.** Gold capped to
   stay readable is no longer gold. The folds are capped per pixel; the flecks are full gold and
   never within 22px of a line of text. Over the skyline they read as the first stars.
4. **Ribbons are silk on paper, not neon on black.** Gold appears only as a thread on the blue
   ribbon, so "gold only on blue" holds inside the art too.
5. **One WebGL context, frames handed over without copying, a pixel budget per frame.** Copying
   from a shared canvas into 2D canvases cost a read-back per layer and dropped frames with
   three cards on screen; handing over bitmaps does not. Browsers without WebGL on an
   OffscreenCanvas keep the still rather than getting a second, slower code path.
6. **`--kit-shader-1/2/3` belong to the wash only.** A wash wants pale lights and a ribbon wants
   strong colours; one set of three could not serve both.
7. **Pause freezes the frame; reduced motion shows one real frame; Play overrides the default.**
8. **The pause button sits in the footer's last row in the demo.** The header has no room for a
   third round button at 360px and the chrome is not this group's to change.
9. **A folder is one paper colour with hairlines**: tab, curved shoulder, back leaf. Numerals
   brick, labels grey, the arrow blue. The one folder that is a link also carries the ribbon.
10. **The stack is the tabs pattern built by script from plain folders**, laid out early by CSS
    when `html.js` is set so that nothing shifts. It opens on the first folder, not on "Most
    popular": the tabs already show all four prices and the first is the cheapest.
11. **No swipe on the tabs and no swipe row for the cards.** Taps and keys are enough, vertical
    scrolling is never at risk, and this site allows no sideways scrollers. The recipe for a
    client's swipe row is in section 6.
12. **Each card is one link named by its heading** (the link's `::after` covers the card), so a
    screen reader hears "Automation, link", then the price and the line as text.
13. **The cards' small labels are phrases already on the site** ("Built for you", "Runs while you
    work", "A clear plan"); prices are written exactly as the site states them.
14. **Lists inside a folder are several `<dd>`s under one `<dt>`**, not a nested list.

## 9. Not right yet, and things for whoever places these

- **The 3.5 KB line.** Read per component it holds (backgrounds 3,360; pause button 833;
  bookmark cards 1,043 plus the shared base 2,190 = 3,233), except that folder cards and their
  stack together are 3,759 before the shared base and 5,949 with it. Read per file, `shader.css`
  is 693 bytes over and `cards.css` 3,492 over. Getting the folders under would mean dropping the
  phone-only variant, the specs list or the ribbon strip; that seemed the wrong trade, but it is
  a judgement for the integrator.
- **The site's 140 KB stylesheet budget.** The handbook counts 131 KB. Folding these 11.2 KB into
  `styles.css` would pass it. Ship them as separate files linked only on pages that use them.
- **Only Chromium was tested, and only with software WebGL.** Safari and Firefox were not run;
  frame times on a real phone were not measured. The code uses nothing newer than
  OffscreenCanvas, `transferToImageBitmap`, `:is()`, `inset`, `subgrid` (inside `@supports`) and
  `mask-composite` (inside `@supports`).
- **No screen reader was run.** Roles, names and focus order were checked by script only.
- **Tab names are 12.5px on a 360px phone** (13.3px at 390px), below the 15px the handbook asks
  for reading text. They are labels for the price under them, which is 15.8px or more.
- **The day wash is very quiet**, as briefed. For more presence give it stronger
  `--kit-shader-1/2/3` colours; it softens whatever it gets until text is safe.
- **The stack and the pricing page.** The stack is its own markup. Used on `/pricing/` beside
  the spec table it would repeat the package facts in the page. It fits the home page's
  packages section (which today repeats four tier cards); on `/pricing/` keep the table.
- **Step folders and the job ticket** tell the same four steps. Use one of them on a page.
- **One blue panel, one closing band a page** still applies: the band preset is for those.
- **Placing on this site**: add `kws-shader-host` and the layer to the home hero and to every
  `.cta-band`; the layer goes first inside the section. Add the pause button to
  `.footer-links` in the footer partials (the demo gives it `margin-right: auto`).
- **The hover lift keeps its 0.2s transition when motion is paused.** It answers the pointer and
  is not ambient; under `prefers-reduced-motion` it is off.
- **The band re-measures its text on resize and theme change only** (section 2).
- `demo.html` is assembled by `motion/work-light/build_demo.py` from `demo.main.html`,
  `demo.style.css` and the chrome of the built pricing page; rebuild it if the chrome changes.
