# Motion kit: animated backgrounds, the pause button, folder cards, bookmark cards

Hand-built for knightwebstudio.com and for client sites built from the KnightWebstudio template.
Nothing here is copied from a library or another site, and there is no third-party code in it:
the noise function the first version borrowed (MIT) has been replaced with our own, so there is
no licence text to ship.

| File | What it is | Size |
| --- | --- | --- |
| `motion.js` | The pause button for everything that moves by itself. **Every page loads it** | 4,492 bytes (budget 8,000) |
| `motion.css` | The pause button's styles. Every page | 1,669 bytes |
| `shader.js` | The three animated backgrounds | 15,971 bytes (budget 16,000) |
| `shader.css` | Their still pictures, the grain, the band's glints | 4,004 bytes |
| `cards.css` | Folder cards, the folder stack, bookmark cards | 11,678 bytes: shared 3,266, folder cards 3,060, stack 3,499, bookmark cards 1,853 |
| `cards.js` | The folder stack's tabs. Nothing else in `cards.css` needs script | 5,830 bytes (budget 8,000) |
| `demo.html` | The components on a page built like the site, plus the same kit in another brand | |
| `portable.html` | The kit on a bare page: no site stylesheet, a third brand, a gradient block | |
| `shots/` | Screenshots at 390 and 1440, both themes, several moments | |

Load order on a page: stylesheets in the head; scripts with `defer`, in any order, after the
site's own. None of them needs `main.js` or any site class.

```html
<!-- in the head, only on pages with a folder stack: see section 5 -->
<script>(function (d) { d.classList.add('kws-js'); function ok() { if (!(window.KWS && KWS.folders)) d.classList.remove('kws-js'); } addEventListener('load', ok); setTimeout(ok, 4000); })(document.documentElement);</script>
<link rel="stylesheet" href="/assets/kit/motion.css">   <!-- every page -->
<link rel="stylesheet" href="/assets/kit/shader.css">   <!-- pages with a background -->
<link rel="stylesheet" href="/assets/kit/cards.css">    <!-- pages with cards -->
...
<script src="/assets/kit/motion.js" defer></script>     <!-- every page -->
<script src="/assets/kit/shader.js" defer></script>
<script src="/assets/kit/cards.js" defer></script>      <!-- only pages with a folder stack -->
```

Everything hangs off one namespace, `window.KWS`: `KWS.motion`, `KWS.shader`, `KWS.folders`.
`shader.js` is written in the same modern syntax as the other kit scripts (arrow functions,
template strings); `motion.js` and `cards.js` are plain ES5.

## 0. What changed in the fix pass (read this if you used the first version)

- **The pause button moved out of `shader.js` into `motion.js` and `motion.css`.** Any page that
  shows the button, or any moving background, must load both. `kit/closing/demo.html` and its
  three test pages load only `../light/shader.js` and `shader.css`: they need the two new tags, or
  their footer button stays hidden. Without `motion.js` the backgrounds still obey
  `prefers-reduced-motion`, but nobody can pause them.
- **The band's gold flecks are no longer drawn by the shader.** They are small DOM glints the
  script places (crisp at any screen density). `data-glints="0"` on the layer turns them off.
- **A host painted only with a gradient or a picture gets no moving background.** The script
  cannot know the colour behind the text there, so the CSS still stays. (A band accepts a
  gradient laid over a solid `background-color`, which is how the closing group's four bands
  are built: those run as before.) This does change the closing group's skyline sky, whose host
  draws its stars with `radial-gradient` and has no colour of its own: either move the stars to
  a pseudo-element, or tell the layer its ground with `--kit-shader-ground` (section 2). With
  the shader running the kit's glints are the stars; `data-glints="0"` keeps the CSS ones.
- **The guard reads the real text.** `wash` and `band` now look at the text actually inside
  their host (its colours, and where it sits), not at four kit variables.
- **Software WebGL counts as no WebGL** (`failIfMajorPerformanceCaveat`): the stills stay.
- Options: `seed` and the `data-shader-speed` attribute are gone (`speed` remains as an option).
- **The folder stack** needs the head snippet above (class `kws-js`, not the site's `js`), lays
  itself out by its own width, and its tab list is now class `kws-tabs`.
- **Bookmark cards** go three across from 980px (was 760px) and are a row card between 600 and 979.
- Lists carry `role="list"`; prices use `<span class="kws-nw">` for the phrases that stay whole.

## 1. The theme contract

Kit CSS never uses a site token directly and never a hex colour. It reads these variables, each
with a fallback to this site's token, so on knightwebstudio.com nothing needs setting and both
themes and the tone scopes (`.on-blue`, `.on-ink`, `.on-paper`) come free.

| Variable | Falls back to | Used for |
| --- | --- | --- |
| `--kit-bg` | `--paper` | The ground of the ribbon art, the back leaf of a folder, unselected tabs, the plain strip on a folder |
| `--kit-surface` | `--card` (folders at night: `--paper-3`) | Card, folder and tab fill; the pause button; the arrow chip |
| `--kit-ink` | `--ink` | Titles, prices, tab names, the grain's colour, the selected tab's strip |
| `--kit-muted` | `--ink-3` (folders at night: `--ink-2`) | Card copy, labels |
| `--kit-line` | `--line-2` | Hairlines |
| `--kit-accent` | `--blue` (focus rings: `--focus`) | The arrow on a card that is a link, every focus ring, a ribbon colour |
| `--kit-accent-ink` | `--on-blue` | Text on something filled with the accent. Not used by these files, but **a pair with `--kit-accent`: re-point both or neither** |
| `--kit-notice` | `--brick` | Folder numerals, the bookmark, a ribbon colour |
| `--kit-gilt` | `--gold` | The band's glints, the thread in the first ribbon colourway |
| `--kit-radius` | `--r-lg` for bookmark cards, `--r-md` for folders | Corners; tabs and art windows use 55% of it |
| `--kit-font-display` | `--font-display` | Titles, numerals, prices |
| `--kit-font-body` | `--font-text` | Everything else |
| `--kit-shadow` | `--shadow-1` (cards), `--shadow-2` (folders), `--shadow-3` (the lift on hover) | Cards and folders |
| `--kit-shader-1`, `-2`, `-3` | accent, surface, surface (on this site: brick tint by day and board blue by night; card by day and `--paper-3` by night; `--paper-3`) | The **wash** only: its warm pool, its light, its shade |
| `--kit-shader-ground` | not set | Optional: the colour behind a layer, when the script cannot read it (section 2) |

`--kit-shader-2` falls back to the surface, not to the gilt as the digest sketched: it is the
wash's light, and a gold light on paper would break "gold only on blue".

Spacing, sizes and timing use the site's scale with a plain fallback: `--gap` (24px), `--pad`
(24px), `--tap` (44px), `--t` (.28s), `--t-fast` (.16s), `--ease`, `--fs-sm`, `--fs-label`,
`--fs-h4`, `--fs-h3`, `--fs-title`, `--fs-price`. The drawn objects keep their own few
measurements (a 12px shoulder, a 6px leaf, an 84px strip) as plain numbers in their own rules.

On a client site, set the thirteen variables once (on `:root`, or on a wrapper to theme one
block). `portable.html` is the proof with no site stylesheet at all; the "For client builds"
section of `demo.html` is the proof inside the site. A dark block inside a light page (the band)
re-points the text variables on that block, as `.on-blue` does on this site. **Re-point
`--kit-accent-ink` whenever you re-point `--kit-accent`**, or a button there is cream on cream:

```css
.closing { background: #1E3A2B; --kit-ink: #FFFDF6; --kit-muted: #D3DCCB; --kit-accent: #FFFDF6; --kit-accent-ink: #1E3A2B; --kit-notice: #E8B84A; }
```

The fold on the bookmark and nothing else uses `light-dark()`, so a client page should set
`color-scheme` with its theme (this site does). Without it the bookmark is simply flat.

## 2. Animated backgrounds

Three presets, chosen with `data-shader`. Each is a layer: an empty element that the script
fills with a canvas. The layer's CSS (in `shader.css`) is the still picture: what shows with
script off, without WebGL, with software WebGL, with Save-Data, on a gradient host, and until
the canvas has drawn its first frame.

### wash: light behind a first screen

What it is for: the first screen of a page. By day it is window light on paper: slanted shafts
of the lightest colour slide slowly across, with a warm pool to one side and soft shade
between. At night it is the blue hour. It suits any business; it takes its mood entirely from
the palette.

```html
<section class="page-head kws-shader-host">
  <div class="kws-shader" data-kws="shader" data-shader="wash" aria-hidden="true"></div>
  <div class="container"> ... eyebrow, h1, lede, buttons ... </div>
</section>
```

The host needs class `kws-shader-host` (it sets `position: relative; isolation: isolate`). The
layer is its first child and sits behind everything in the host. The wash fades out over the
bottom 35% and the top 10% of the layer, so it meets the page with no edge.

It shows at two strengths. Within 22px of any text it only lightens the paper and shifts its
hue (the colours are moved towards white until the text is safe on them, so a brick tint
becomes a peach of the paper's own lightness). In the clear, further from text, the colours
show as given. The change from one to the other is a long soft fall, about 120px.

### band: slow folds in a colour block

What it is for: the deep-blue closing band, and any blue panel. Slow folds in a lit and a deep
tone of the block's own colour, with a few gold-leaf glints. Above the footer skyline it reads
as the evening sky over Baton Rouge. On a client site it works on any dark block with light
text, as long as the block is one flat colour.

```html
<section class="cta-band on-blue kws-shader-host">
  <div class="kws-shader" data-kws="shader" data-shader="band" aria-hidden="true"></div>
  <div class="container cta-inner"> ... </div>
</section>
```

- The folds are computed from the colour actually painted behind the layer: put it on a green
  block and the folds are greens. **The block needs a solid `background-color`.** The band is
  opaque, so a gradient or picture laid over that colour on the same element is fine: the band
  covers it and takes its tones from the colour (this is how the closing group's bands are
  built). A block painted by a gradient or picture alone, with no solid colour of its own, gives
  the script nothing to read: it draws nothing and the block stays as the page painted it. If
  you know the colour, say so on the layer: `style="--kit-shader-ground: #1E3A2B"` (a custom
  property, so it is allowed inline) or in CSS. The **wash** is translucent, so it never draws
  over a gradient or picture at all.
- The glints take `--kit-gilt`. They are four-pointed, 7 to 20px, at most 18, placed by the
  script 22px or more from every line of text and from every link and button, and 12px or more
  from the layer's edges; if fewer than three places are free there are none. They twinkle
  (opacity only, all on one shared beat of five steps a second, so the screen is redrawn five
  times a second for them rather than sixty) while the band is on screen and motion is on, and
  rest at their own brightness otherwise. `data-glints="0"` on the layer leaves them out.
- The band re-measures its text when its size changes, when the theme changes and when the web
  fonts arrive; call `KWS.shader.refresh()` if you change the text some other way.
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

The tone also changes the shapes, so three cards side by side differ. On a dark ground the
colours are deepened and saturated (the night theme's text colours are pastels, and silk should
not be chalk), the edges catch a little light, and the thread is always kept lighter than its
ribbon. The parent only has to be `position: relative` with a size and `overflow: hidden`.

### Attributes and options

| On the layer | Meaning |
| --- | --- |
| `data-kws="shader"` | Auto-start when the page has loaded and gone quiet |
| `data-shader="wash" \| "band" \| "ribbon"` | The preset. Without it: wash |
| `data-tone="1" \| "2" \| "3"` | Ribbon colourway and shape |
| `data-glints="0"` | Band: no glints |
| `--kit-shader-ground: <colour>` | The colour behind the layer, when it cannot be read |

`KWS.shader.mount(element, options)` returns a function that removes the canvas, the glints,
the observers and the classes. Options: `speed` (number, 1 by default), `contrast` (the ratio the
text must keep, 4.6 by default; 7 for AAA). Mounting the same element twice returns the same
remover. `KWS.shader.refresh()` re-reads the text, the colours and the ground of every layer.

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

Import the files once in the app's entry (`import './kit/motion.css'; import './kit/shader.css';
import './kit/motion.js'; import './kit/shader.js';`): the scripts are plain IIFEs that attach
`window.KWS`.

### Colours and the theme

At the first draw, and again whenever `data-theme` on `<html>` changes, the device switches
between light and dark, the layer changes size or the fonts arrive, the script reads the
layer's computed variables, the colours of the text in the host, and the background colours of
the layer and its ancestors (composited, so a translucent panel works). Any CSS colour the
browser can parse is fine. There is nothing to wire to the theme button.

### Text stays readable

- **What is guarded.** For wash and band the script walks the text inside the host. Text that
  lies on the layer itself counts; text on a surface of its own (a button, a card: any ancestor
  inside the host with a background picture or a background colour more than half opaque) does
  not. From those colours it works out the darkest and lightest the ground may get while each
  keeps 4.6:1.
- **The grain is counted.** The fine grain is a CSS layer on top of the canvas, so the shader
  is told its colour and strength and checks every pixel twice: bare, and with a full grain of
  it. On a band the grain is the text colour inverted, so on a dark block it can only darken.
- **Each pixel is held inside that range** (the wash only where text is near; the band
  everywhere).
- **If the text is already closer than that to the plain ground, nothing is drawn** and the
  still stays (for example grey text at 4.3:1): the background cannot make it worse.
- The glints are brighter than the range on purpose, and are kept 22px away from text instead.
- Measured, not assumed: section 7. The lowest pixel photographed behind any text was 4.58:1.

### Script off, reduced motion, paused

| State | What shows |
| --- | --- |
| Script off, no WebGL, software WebGL, Save-Data, a host with no colour the script can read, Safari before 17 | The CSS still: soft light (wash), the plain block with a faint light (band), three arcs in the ribbon colours (ribbon). Fine grain on all three. No glints |
| `prefers-reduced-motion`, or `html[data-motion="off"]` at load | One still frame of the real picture on every layer, drawn once when the page is quiet; glints placed and still; no animation loop |
| Paused with the button | The canvas holds its current frame, the glints rest. A theme change while paused repaints each layer once |
| Off screen, or in a background tab | Nothing is drawn; glints do not animate |

A visitor with reduced motion who presses Play has made a choice: the canvases then move. The
glints and the folder stack's swap (CSS) stay still under `prefers-reduced-motion` whatever
the button says.

### How it stays light

- One WebGL context for the whole page, on an offscreen canvas. Each layer owns a small canvas
  and is handed finished frames (`transferToImageBitmap`), so nothing is read back or copied.
- Low resolution: wash at a quarter to half a CSS pixel (at most 80,000 pixels), band the same
  (100,000), ribbon at up to two device pixels (120,000). The grain and the glints are CSS, so
  the picture can be soft and the detail still fine.
- Each preset has its own pace: the wash about 10 frames a second, the band 15, a ribbon 30.
  On top of that a budget of 240,000 pixels a frame is shared by the layers on screen, which
  take turns; if frames arrive late the budget shrinks (to 30,000 at the least) and grows back.
- Every layer draws one still frame when the page is quiet, on screen or not, so the picture is
  in place before a card scrolls into view. After that only layers on screen are drawn.
- No layout work in a frame: sizes come from a ResizeObserver, visibility from an
  IntersectionObserver, and the text is measured in the ResizeObserver's callback.
- The last layer to be removed releases the context and every observer and listener.

### How `shader.js` is laid out (the file itself is commented tersely to fit its budget)

| Part | What it does |
| --- | --- |
| `HEAD`, `FRAG` | The GLSL. `HEAD`: hash, smooth noise, WCAG luminance, and the guard: `ok()` is true when text reads on a pixel bare and grained, `gd()` finds the most opacity that keeps it so. `FRAG.wash`, `.band`, `.ribbon`: the three pictures |
| `P` | Per preset: pixels per CSS pixel, pixel-ratio cap, most pixels, least milliseconds between frames |
| `rgb`, `lum`, `mix`, `ground` | Colour helpers: any CSS colour through the browser's own parser; the flat colour behind a layer, or null |
| `measure` | Text rectangles and on-layer text colours; then `glints` for a band |
| `colours` | The allowed luminance range, the grain, the preset's colours and their text-safe versions (`K`) |
| `context`, `program`, `mask`, `draw` | The shared context, a program per preset, the wash's blurred text mask (a 128px texture), one frame |
| `frame`, `kick`, `restyle` | The loop: pace, budget, turns; started by observers, stopped when nothing is due |
| `mount`, `unmount` | Per layer; the first mount creates the observers, the last unmount lets go of everything |

### Accessibility

The layer is `aria-hidden="true"` and has `pointer-events: none`. It holds no text and takes
no focus. Motion is slow (nothing flashes) and can be paused with one site-wide button.

### Limits

- Needs WebGL on an OffscreenCanvas with a real GPU (Chrome 69, Firefox 105, Safari 17).
  Older browsers and software renderers keep the still. That is deliberate.
- A wash needs a flat `background-color` behind it, a band a solid one on or behind its host
  (or `--kit-shader-ground`).
- `--kit-shader-1/2/3` colour the wash only. The band always takes its folds from its ground
  and its glints from `--kit-gilt`; the ribbon takes accent, gilt, notice, ink and surface.
- The guard reads text colours as the browser computes them when it measures. Text that changes
  colour later (a hover colour, a script) is not re-read until `KWS.shader.refresh()`. Text
  hidden with `visibility: hidden` is still counted (safe, if a little cautious).
- Text on a translucent surface (less than half opaque) inside the host is treated as text on
  the layer.
- The first frame of each preset compiles its shader on the main thread (once per page).

## 3. The motion pause button

One quiet button that pauses and resumes all ambient motion on the site (WCAG 2.2.2). It is in
`motion.js` and `motion.css`, which every page loads whether or not it has a background.

```html
<button class="kws-motion" data-kws="motion" type="button" hidden>
  <svg class="kws-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>
  <svg class="kws-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
  <span class="kws-motion-label"></span>
</button>
```

- With the `<span class="kws-motion-label">` it is a pill, 44px tall, with its words visible:
  "Pause motion" or "Play motion" (15px). Without the span it is a round 44px icon button and
  the same words are its `aria-label` and `title`.
- It carries `hidden` in the markup, so with script off there is no dead button.
- Pressing it sets `data-motion="off"` on `<html>` (or removes it) and stores `off` or `on` in
  `localStorage` under `kws-motion`. Any number of buttons on a page stay in step; a button
  mounted twice has one listener.
- The starting state: the stored choice if there is one; otherwise off when the device asks
  for reduced motion, on when it does not. The choice is read again when another tab changes it
  (`storage`), when a page comes back from the back-forward cache (`pageshow`), and when the
  device setting changes.
- Screen readers: the button's name says what pressing it will do, and changes when pressed;
  a visually hidden `role="status"` then says "Motion paused" or "Motion playing".
- The four phrases can be replaced, in any language, with `data-pause`, `data-play`,
  `data-paused` and `data-playing` on the button.
- Keyboard: a real `<button>`. Its focus ring is the kit's own: 3px, `--kit-accent` (on this
  site `--focus`, which the tone scopes re-point, so it is gold on the footer).
- For other scripts in the kit: `document.documentElement.dataset.motion === 'off'`, or
  `KWS.motion.off()`; listen for `kws:motion` on `document` (`event.detail.off`); set it with
  `KWS.motion.set(true)`. In CSS: `html[data-motion="off"] .thing { animation: none; }`.
- `KWS.motion.mount(button)` returns a function that removes the listener and hides the
  button again. React: `useEffect(() => window.KWS.motion.mount(ref.current), [])`.

**Where to put it.** Somebody bothered by the motion at the top of a page must not have to
scroll to the bottom to stop it. `demo.html` shows the placement recommended for this site: the
labelled pill in the footer's last row, the same again in the top strip from 1100px, and the
same in the phone menu's sheet. The three lines of chrome CSS it uses are in the demo's own
`<style>` block (`.topbar .kws-motion`, `.nav-foot .kws-motion`, `.footer-links .kws-motion`):
they belong to whoever owns the chrome.

## 4. Folder cards

What it is for: a short numbered sequence. Manila job folders from the shop's filing drawer:
a real tab with the number in Fraunces, a curved shoulder, a back leaf showing behind the
front one. It suits process steps, "how it works", a set of plans, anything in a fixed order:
trades, studios, clinics, a restaurant's catering steps. No script.

```html
<ol class="kws-folders" role="list">
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
- `role="list"` on the list: `list-style: none` makes Safari with VoiceOver forget it is one.
  The number tab is `aria-hidden` because the list already numbers the steps.
- From 760px every folder keeps an 84px strip at the top, so labels and headings line up
  across the row: the folder with art shows the ribbon there, the others plain paper with two
  ruled lines, like the label strip on a file. On a phone only the folder with art has a strip.
- A card that is a link: put the link inside the heading, add the arrow `<svg class="kws-go">`
  inside the link, and add `kws-link` to the card. The link covers the whole folder body; its
  name for a screen reader is just the heading. The focus ring is drawn round tab and body
  together (3px, accent colour, or `--focus` on this site). The card lifts 3px under a pointer
  while a deeper, lower shadow fades in, and sinks 1px when pressed. A folder with no link has
  no arrow and does not lift.
- Use the heading level that fits the page (the styles apply to `h3`; add the site's class
  `h3` to an `h2` if the outline needs it).
- At most one folder in a set carries the ribbon strip. The rest stay paper.
- Colour rule on this site: numerals are brick, labels grey, the arrow blue because it is
  pressable. Nothing else is coloured.
- Paper objects take `--r-md` (14px) and `--shadow-2` on this site. At night the folder's
  paper is one step lighter than a card (`--paper-3`, with `--ink-2` for its copy), so it
  still reads as an object on a sand band.
- Long words wrap (`overflow-wrap: anywhere`); nothing can push the page sideways.

## 5. The folder stack

What it is for: choosing one of a few things that are each too long to show at once on a
phone. A stack of folders; choosing a tab brings that folder to the front. Built for the four
website packages, where the tabs themselves show all four fixed prices. It suits packages,
plans, locations, menus by course: two to six folders (two to five where it sits in one row).

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
        <div><dt class="kws-label">Support</dt><dd>30 days</dd></div>
      </dl>
      <div class="btn-row"> ... the site's own buttons ... </div>
    </div>
  </article>
  ... one article per folder, all the same element ...
</div>
```

| On the root | Meaning |
| --- | --- |
| `class="kws-folders kws-folders--stack"` | A stack at every width |
| add `kws-folders--phone` | A stack below 760px only; from 760px the same folders sit in a row (two across, four from 1100px) and no tabs are built |
| `data-kws="folders"` | Auto-start |
| `data-label="..."` | The accessible name of the tab list. Always set it (the default is the English "Choose one") |
| `data-start="3"` | Open on the third folder. Default: the first. Out of range: the nearest |

`KWS.folders.mount(element, { start, label })` returns a function that puts the list back
exactly as it was; calling it on a stack that is already mounted returns that stack's remover.
React: `useEffect(() => window.KWS.folders.mount(ref.current), [])`.

**Two layouts, chosen by the stack's own width** (a container query, so it is right in a
narrow column on a wide screen too):

- **Narrower than 600px: an index, then the folder.** The tabs are an index two across (name
  at 15px over the price at 19px, each 62px tall). Under it the chosen folder is a whole folder,
  with its own tab carrying its name, the curved shoulder and the leaf behind.
- **600px and wider: one row of tabs joined to the folder.** Tabs are as wide as their words,
  with their text in line with the folder's text. The chosen tab is the front folder's tab
  (ink strip on top, curved shoulders, no line under it); beside the tabs the top edges of the
  two folders behind show. Up to five short names fit one row.

What the script does: it builds a `role="tablist"` of real `<button role="tab">`s from each
folder's tab (same words), makes each folder a `role="tabpanel"` named by its tab, and marks
the chosen one `is-front`. Folders that are not in front are `visibility: hidden`, so they are
out of the tab order and unread; all folders share one grid cell, so the stack keeps the
height of the tallest and nothing below it moves when you switch.

- Keyboard: Tab reaches the selected tab; Left and Right move and open (they wrap); Home and
  End jump; with Alt, Ctrl, Shift or Meta held the keys are left to the browser. Tab again goes
  to the open folder's first link (a folder with nothing to focus inside takes focus itself).
  The focus ring on a tab is the kit's own, 3px.
- Screen readers: "Website packages, tab list; Starter $2,000, tab, selected, 2 of 4", then
  the panel, named by its tab.
- A `#hash` that names a folder (or anything inside one) opens that folder, on load and when
  the hash changes, so the page's own links such as `/pricing/#pkg-business` work.
- Pointer and touch: unselected tabs keep ink text on a paper ground (only the ground recedes),
  lighten under a pointer and sink 1px when pressed; there is no tap flash.
- Forced colours: the chosen tab keeps a 3px top border in the system highlight colour.
- Motion: the chosen folder comes forward as one piece (it rises 6px and fades in over 0.28s:
  transform and opacity). Not on first paint, not under `prefers-reduced-motion`, not when
  `html[data-motion="off"]`: then the swap is instant. The conditions are on the animating
  rule itself, so they hold on a page with no site stylesheet too.
- Script off: every folder shows, one under the other (or in the row, for the phone variant),
  each with its own tab as its heading ("Starter $2,000", 19px).

**No layout shift, and no hidden content if the script never arrives.** The head snippet at
the top of these notes sets class `kws-js` on `<html>` before first paint. With it, CSS alone
lays the stack out in its final form (first folder showing, the place of the tab list kept
free), so when `cards.js` runs nothing moves. The same snippet takes the class away again if
`KWS.folders` does not exist once the page has loaded, or after four seconds, whichever comes
first: then the plain list shows, every folder and every link. There is no inline event
handler. Without the snippet the stack still works; it just starts as the plain list and
changes shape when the script runs.

The kept place is worked out in CSS from the number of folders (`:has()`): one row of index for
one or two folders, two rows for three or four, three for five or six. In a browser without
`:has()` (Firefox before 121) it assumes two rows, which is right for three or four folders.
A tab whose name wraps to a second line is taller than the kept place; keep names to a word or
two.

## 6. Bookmark cards

What it is for: three or so things of equal weight, each one link. A paper card with a
ribbon bookmark folded over its top edge, a small label, the ribbon art in a window, then the
name large with its fixed price beneath. Built for the three service families. It suits
services, collections, menus, classes: anything with a name, one honest line and a price.
No script (the art is a shader layer, but the card is complete without it).

```html
<ul class="kws-marks" role="list">
  <li class="kws-mark kws-link">
    <p class="kws-label">Built for you</p>
    <div class="kws-mark-art"><span class="kws-shader" data-kws="shader" data-shader="ribbon" data-tone="1" aria-hidden="true"></span></div>
    <h3><a href="/services/">Website design &amp; build<svg class="kws-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></a></h3>
    <p class="kws-mark-price"><span class="kws-nw">$1,000, $2,000</span> <span class="kws-nw">or $4,000</span></p>
    <p>A custom-designed marketing site built from scratch.</p>
  </li>
  ...
</ul>
```

- **Exactly these five children in this order** (label, art, heading, price, line): the row
  layout and the shared rows depend on it.
- Below 600px: a stack, with a 16:7 art window. From 600px to 979px: a row card, art on the
  left (38%), words on the right. From 980px: three across with a 4:3 window, sharing their
  rows (`subgrid`), so names, prices and lines align even when one name wraps.
- Wrap each phrase of the price that should stay whole in `<span class="kws-nw">`, so it
  breaks only between phrases ("$350 audit ·" / "$500 or $1,000/mo"). At very large text
  sizes a phrase wider than the card wraps inside itself instead of sticking out.
- The whole card is one link (the heading's link covers it), named by the heading alone; the
  price and line are read after it as ordinary text. Its focus ring goes round the whole card,
  7px out, clear of the bookmark. Under a pointer the card lifts 3px while a deeper shadow
  fades in; the pointer can rest on the card's bottom edge without it flickering.
- Honest words only: the name, and the fixed prices exactly as the site states them. Never a
  statistic, never a range, never "from".
- The bookmark is drawn in CSS in the notice colour (brick), with a darker fold where it turns
  over the card's edge. It is decoration.
- This site does not allow sideways scrollers, so there is no swipe row. A client site that
  wants one can add it in its own stylesheet:

```css
@media (max-width: 599.98px) {
  .kws-marks { grid-auto-flow: column; grid-auto-columns: 84%; overflow-x: auto; padding: 8px 0 12px; scroll-snap-type: x mandatory; }
  .kws-marks > * { scroll-snap-align: center; }
}
```

## 7. What was measured

All in headless Chromium with software WebGL (`--enable-unsafe-swiftshader --use-angle=swiftshader`).
The machine was shared with other jobs throughout (load average between 3 and 24 on 4 cores),
which shows in the frame figures and nowhere else. The scripts and their output are in
`motion/work-light/fix/`: `t_behave.js` (104 checks), `t_gl.js` (5), `t_contrast.js` with
`t_contrast.py`, `t_wash.js` with `t_wash.py`, `t_focus.js`, `t_perf.js`, `t_perf_band.js`,
`sizes.py`, `final_shots.js`; results in the `res-*.txt` files beside them. The engineer
reviewer's own `eng/t5c_ab.js` was also run unchanged.

**Sizes** (bytes on disk, 1 KB = 1,000). Scripts: `shader.js` 15,971 of 16,000; `motion.js`
4,492 and `cards.js` 5,830 of 8,000. CSS, per component against the 3.5 KB line:
pause button 1,669; folder cards 3,060; folder stack 3,499; bookmark cards
1,853; the base the three card components share 3,266 (counted once);
**backgrounds 4,004, which is over** (section 9).

**No sideways scroll**: `tools/widths.js` on `demo.html` and on `portable.html` in both themes,
every 20px from 360 to 1920: no overflow, nothing past the right edge, no sideways scroller.
Long words, a 50-letter price and seven long tab names on the bare page at 360px: still none.

**Contrast, computed** (`tools/contrast.js`, 390 and 1440, both themes): `demo.html` all text
passes AA; `portable.html` passes in the dark theme and in the light theme everywhere except
three lines the tool cannot judge, the text on the gradient block (it reads `background-color`
only). Photographed, that block's lowest pixel is 5.39:1.

**Contrast, photographed over the moving backgrounds.** Shaders run 25 times faster; the words
are made invisible with text-fill only (so their computed colour, which the guard reads, is
untouched); the area behind every line of text is photographed 24 times, about ten seconds of
shader time apart, and each pixel is compared with that text's colour. 28 cases (this site, the
second brand and the bare page's third brand; wash and band; 390 and 1440; both themes), 672
frames, 99.7 million pixels behind text: **none below AA**. (Taken before the last change, to
the glints' timing; glints are DOM, hidden for this test and never over text.)

| Case | Lowest pixel seen (4.5 needed), day / night theme |
| --- | --- |
| This site, wash behind the first screen | 4.93:1 (the grey "Websites" label, 5.03:1 on plain paper) / 6.04:1 |
| This site, band behind the closing call to action, **with a gold eyebrow** | 4.58:1 / 4.59:1 (the gold eyebrow; it was 4.21:1 before the fix) |
| Second brand, wash | 4.60:1 / 5.25:1 |
| Second brand, band | 5.04:1 / 5.04:1 |
| Bare page, wash | 4.81:1 / 5.36:1 |
| Bare page, band | 4.58:1 / 4.58:1 |
| Bare page, gradient block (still only) | 5.39:1 / 5.39:1 |

The guard aims at 4.6:1; rounding to 8 bits and the stretch from a small canvas leave the
lowest pixel at 4.58:1.

**Is the day wash visible now?** (`t_wash.js`: the first screen with its words hidden, averaged
over 9px so the grain does not count.)

| | Lightness across the field | Within 22px of text | In the clear | Largest colour difference from plain paper | Change over 160 seconds of shader time |
| --- | --- | --- | --- | --- | --- |
| Day, 1440 | 7.3% of the range (was about 2%) | 3.2% | 8.0% | 20 of 255 in the clear, 9 near text | up to 27 of 255 (was 8) |
| Day, 390 | 4.6% | 4.6% | 3.8% | 12 to 13 of 255 | up to 14 |
| Night, 1440 | 9.4% | 6.1% | 9.4% | 47 to 50 of 255 | up to 32 |
| Night, 390 | 6.3% | 6.3% | 6.3% | 33 to 51 of 255 | up to 19 |

**Frame times with the CPU throttled 4x** (`Emulation.setCPUThrottlingRate`), gap between the
page's animation frames (16.7ms is a steady 60 a second), backgrounds running against paused,
passes alternated so that machine noise falls on both.

390x844 at 3x, the contract's measurement:

| Section on screen | Running: median / p95 / worst (frames over 50ms) | Paused | Kit's own frame callback p95 / worst |
| --- | --- | --- | --- |
| First screen (wash, 10 draws a second) | 16.7 / 16.8 / 16.8 (0 of 540) | 16.7 / 16.7 / 16.8 | 1.0 / 10.3ms |
| Bookmark cards (two ribbons, 30 each) | 16.7 / 16.8 / 16.8 (0 of 540) | 16.7 / 16.7 / 33.4 | 3.3 / 17.3ms |
| Step folders (one ribbon strip) | 16.7 / 16.8 / 33.4 (0 of 540) | 16.7 / 16.8 / 33.4 | 1.2 / 8.5ms |
| Folder stack (no canvas) | 16.7 / 16.7 / 16.8 (0 of 543) | 16.7 / 16.8 / 33.3 | none |
| Second brand (wash, ribbons and a band at once) | 16.7 / 16.8 / 66.7 (2 of 524) | 16.7 / 16.7 / 33.4 | 4.7 / 19.1ms |
| Closing band (band and glints) | 16.7 / 16.8 / 33.4 (0 of 538) | 16.7 / 16.8 / 16.8 | 1.9 / 14.6ms |

That pass was taken at load 6 to 8, before the last small change (the glints' shared beat).
Two more for honesty: the reviewer's `t5c_ab.js`, run earlier in the pass at load 3 to 5, gave
16.7 / 16.8 / 16.8 with no frame over 33ms in the second-brand, band and cards sections, running
and paused alike, and a scroll of the whole page at p95 16.8 (4 frames of 3,794 over 50ms on one
pass, none on the other; paused: none). A pass on the final files at load 8 to 14 was worse for
both sides (running: p95 16.8 everywhere except the second-brand block at 50.0, 32 frames of
about 3,000 over 50ms; paused: 6 of about 3,200). The figures move with the machine more than
with the kit; they want repeating on a quiet one.

1440x900, same throttle, software WebGL (load 7 to 10):

| Section on screen | Running: median / p95 / worst (frames over 50ms) | Paused |
| --- | --- | --- |
| First screen (wash) | 16.7 / 16.7 / 16.8 (0 of 541) | 16.7 / 16.8 / 33.3 |
| Three bookmark cards (three ribbons) | 16.7 / **33.4** / 116.7 (13 of 464) | 16.7 / 16.8 / 83.3 (1) |
| Step folders | 16.7 / 16.7 / 250.1 (3 of 508) | 16.7 / 16.8 / 33.3 |
| Folder stack | 16.7 / 16.7 / 16.8 | 16.7 / 16.7 / 33.3 |
| Second brand (five layers) | 16.7 / **49.9** / 283.4 (11 of 401) | 16.7 / 16.7 / 33.3 |
| Closing band | 16.7 / 16.8 / 33.4 (0 of 535) | 16.7 / 16.8 / 49.9 |

So at desktop size, under software rendering, three ribbons at once still cost frames, as the
engineer found. Nobody should meet that path now: without the test's command-line flags the same
build creates no context (`failIfMajorPerformanceCaveat`), and the stills stay. A real GPU has
not been measured (section 9).

**Only what is on screen moves**: every layer draws one still frame when the page is quiet
(11 of 11 on the demo, before any is scrolled to); after that only layers on screen are drawn.
Paused: 0 draws and 0 animation frames asked for. A theme change while paused repaints each
layer once. Layers removed from the page without their remover: the loop stops.

**Behaviour** (`t_behave.js`, 104 checks, all pass). Script off: four folders with their tabs,
headings 19px, three cards, four steps, no canvas, no button, no sideways scroll. Upgrade:
layout shift 0.0000 at 390, 820 and 1440 through a scroll of the whole page, and the stack's
height and its body's position are the same to the pixel before and after `cards.js` runs.
`cards.js` blocked: every folder, tab and link shows once the page has loaded (both pages, 390
and 1440); `cards.js` stalled: after four seconds. Tabs at 360, 390 and 1440: roles, names and
wiring; names 15px and prices 19px; 62px tall; 13px or more to spare beside the longest name at
360px; one line each with the web fonts blocked; they follow a 200% text size; Right, Left, Home
and End with wrapping; modifier keys left alone; Tab goes on into the folder's first link; the
kit's 3px ring; ink text on unselected tabs; no tap flash; forced colours. `#hash`, `data-start`
out of range and not a number, no folders, one folder, mounting twice, the remover, the
phone-only variant across 760px and a hash after it was torn down. The pause button: labels,
state, storage, reload, another tab, two mounts of one button, data-attribute labels. Paused and
reduced motion, on the site page and on the bare page: no animation on the folder swap, glints
still, one still frame a layer. Gradient host, gradient over a solid colour, `--kit-shader-ground`,
unreadable text, Save-Data, no GPU. Cards at 390, 820, 1000 and 1440: columns, one link each,
prices breaking only between phrases, the arrow 20px in, focus rings, the hover lift with the
pointer on the bottom pixel. Touch: a 300px swipe starting on the art, the tabs, the open folder,
the band or a step folder scrolls the page 285 to 446px; a tap on a tab opens it. No console
errors anywhere.

**Context loss and leaks** (`t_gl.js`, 5 checks, all pass): the shared context lost while
running and while paused: stills at once, then all eleven layers redrawn on a new context, no
error. Lost for good: stills, and no frames asked for. Twelve rounds of a stack, a pause button,
a band and four ribbons added, mounted and taken off the page without their removers: DOM nodes
473 before and after, listeners 13 before and after.

**Keyboard focus on a phone** (`t_focus.js`, 390x844): each of the seven whole-card links, when
it takes focus, has its card and ring 100% on screen between the sticky header and the phone bar
(the first build left a quarter to a third under the bar).

**Glints**: 18 on the desktop band, 8 or 9 on a phone; the nearest is 40px from text and 18px
from an edge; none inside a button.

## 8. Decisions

1. **The grain is still and the light moves.** The grain is a CSS layer over both the still
   and the canvas, so it is the paper's grain, the canvas can be drawn at low resolution, and
   the no-script state has it too. Because it is on top, the guard counts it.
2. **The day wash is window light, not a tint.** Near text the only things that can change
   without costing contrast are lightness upwards and hue, so the picture is built from those:
   shafts of the lightest colour, a peach pool at the paper's own lightness. Away from text the
   shade between the shafts and the pool show at full strength.
3. **Night wash is all blue.** A warm "shop window" glow was tried twice in the first build;
   capped for contrast it turns to a muddy brown, and gold on night paper breaks the gold rule.
4. **The band's folds are guarded everywhere; its glints are kept out of the text instead.**
   Gold capped to stay readable is no longer gold. The glints are DOM, so they are crisp on a
   3x phone, cost nothing, and stop with the pause button through CSS alone.
5. **The band's grain is the text colour inverted.** On a dark block that is near black: it
   can only darken the ground, so it can never take light text below the guard.
6. **A background that cannot know its ground does not start.** Gradient and picture hosts
   keep the still; `--kit-shader-ground` is the way to tell it.
7. **Software WebGL is treated as none.** The reviewers measured dropped frames on a desktop
   under software rendering; nobody should get that path by accident.
8. **Ribbons are silk on paper, not neon on black.** Gold appears only as a thread on the blue
   ribbon, so "gold only on blue" holds inside the art too. At night the silk is deepened
   rather than taking the pastel text colours.
9. **One WebGL context, frames handed over without copying, a pixel budget per frame.**
   Browsers without WebGL on an OffscreenCanvas keep the still rather than getting a second,
   slower code path.
10. **Pause freezes the frame; reduced motion shows one real frame; Play overrides the default
    for the canvases only.**
11. **The pause control is its own small script**, so a page with no showpiece does not load
    16 KB to get a button, and the other motion groups can rely on `KWS.motion`.
12. **A folder is one paper colour with hairlines**: tab, curved shoulder, back leaf. Numerals
    brick, labels grey, the arrow blue. The one folder that is a link also carries the ribbon.
13. **The stack has two layouts and asks its own width, not the screen's.** Four names at 15px
    do not fit one row on a phone, and the same is true of a narrow column on a laptop (the
    demo's split layout is 430px wide at 1000px). 600 is the site's own breakpoint number.
14. **On a phone the chosen folder keeps its own tab.** The index above it is where you choose;
    the folder below is a whole folder with its name on it, which is also the heading a screen
    reader finds inside the panel.
15. **The stack fails open through the head snippet, not through CSS.** A CSS-only timer would
    have to animate grid placement, which older browsers do not do: there the folders would
    come back on top of one another. The snippet covers a blocked script (at `load`) and a
    stalled one (after four seconds).
16. **No swipe on the tabs and no swipe row for the cards.** Taps and keys are enough, vertical
    scrolling is never at risk, and this site allows no sideways scrollers.
17. **Each card is one link named by its heading** (the link's `::after` covers the card), so a
    screen reader hears "Automation, link", then the price and the line as text.
18. **The cards' small labels are phrases already on the site** ("Built for you", "Runs while you
    work", "A clear plan"); prices are written exactly as the site states them.
19. **The stack's last row is labelled "Support"**, with "14 days", "30 days", "90 days" and
    "6 months": that is what the spec table on `/pricing/` says today (a reviewer remembered
    "After launch", which is the eyebrow of the care-plans section). If the pricing page's
    label changes, change it here to match.
20. **Lists inside a folder are several `<dd>`s under one `<dt>`**, not a nested list.

## 9. Not right yet, and things for whoever places these

**Skipped from the review, and why**

- **A CSS-only safety net for the stack** (creative director). It would have to animate grid
  placement after a delay; browsers that cannot do that would bring the hidden folders back on
  top of one another. The head snippet covers both failures instead (script blocked: at `load`;
  script stalled: after four seconds), with no inline handler. Decision 15.
- **"After launch" as the stack's last row label** (creative director). Checked: the spec table
  on `/pricing/` says "Support" today. The values were changed to match it ("14 days", not
  "14 days support"). Decision 19.
- **Hiding the pause button when nothing can move** (engineer). `motion.js` cannot know what
  other scripts will animate, and it is the site-wide switch the other motion groups read; a
  remembered choice is still worth offering. It stays visible whenever script runs.
- **Compiling shaders without blocking** (engineer). Written and working with
  `KHR_parallel_shader_compile`, then taken out: 230 bytes that `shader.js` did not have. The
  first frame of each preset still compiles on the main thread, once a page.
- **A bitmap per layer sized to its own region** (engineer). Each drawn layer still holds a
  bitmap the size of the shared canvas (about 0.6 MB each with the larger ribbons; eleven on
  the demo, five or six on a real page). Changing it means giving up the zero-copy hand-over.
- **Reading the GPU's name to refuse known software renderers** (engineer, optional).
  `failIfMajorPerformanceCaveat` does the job without it.
- **Every raw length as a token** (engineer). Durations, the tap size, spacing that maps to the
  site's scale and all colours are variables. The drawn objects' own measurements (a 12px
  shoulder, a 6px leaf, an 84px strip, a 26px bookmark) stay as plain numbers in their own rules:
  the handbook allows a drawn object its own geometry, and each `var()` with a fallback costs
  bytes the 3.5 KB line does not have.

**Not right yet**

- **`shader.css` is 4,004 bytes, over the 3.5 KB line.** About 600 of them are the band's
  glints and their animation, which the review moved out of WebGL into CSS; the rest was 3,360
  before. `shader.js` is 15,971 of 16,000 with nothing to spare: its comments are terse
  for that reason, and section 2 has the map of the file instead. `cards.css` is 11,678
  bytes as a file; each of its three components is under 3.5 KB with the shared base counted once.
- **Never seen on a real GPU, a real phone, Safari or Firefox.** Everything was measured in
  Chromium with software WebGL forced on. That matters more than before: real visitors on
  software rendering now get the stills, so the moving pictures have only ever been watched on
  a renderer no visitor will use. Look at it on an iPhone and a mid-range Android before placing.
- **No screen reader was run.** Roles, names, states and focus order were checked by script.
- **Frame times were taken on a busy machine** and vary between passes (section 7). At desktop
  size under software rendering three ribbons at once still drop frames.
- **The closing group's files need two small changes** (theirs to make; nothing of theirs was
  edited). (1) Their demo and test pages load only `shader.js` and `shader.css`: add
  `motion.js` and `motion.css`, or the pause button never appears. (2) Their footer sky draws
  its stars with `radial-gradient` on the host, so the band no longer starts there (the sky
  keeps its own still picture, which their notes call complete): give the layer
  `--kit-shader-ground` or move the stars to a pseudo-element. Their four closing bands run as
  before (gradient folds over a solid colour are accepted), now with the DOM glints. Their notes
  still say `shader.js` shows the pause button and that the guard is 4.8:1.
- **Under reduced motion, Play moves the canvases but not the glints or the folder swap**: those
  are CSS and obey the device setting whatever the button says.
- **The pause button's place in the real chrome is still to do**: the footer partials, the top
  strip and the phone menu need the markup from section 3 and the three rules from the demo's
  `<style>` block.
- **The stack and the pricing page.** The stack is its own markup. Beside the spec table on
  `/pricing/` it would repeat the package facts. It fits the home page's packages section; on
  `/pricing/` keep the table. Step folders and the job ticket tell the same four steps: a page
  should use one of them.
- **The joined-row layout needs container queries** (Chrome 105, Safari 16, Firefox 110).
  Older browsers get the index layout at every width, which works. The kept place for the index
  needs `:has()` for anything but three or four folders (section 5).
- **A tab name that wraps** makes its tab taller than the place kept for it, and the page moves
  by a line when the script runs. Keep names to a word or two.
- **The hover lift keeps its transition when motion is paused.** It answers the pointer and is
  not ambient; under `prefers-reduced-motion` it is off.
- **The day wash is now clearly there.** If Christian wants it quieter, give it paler
  `--kit-shader-1/2/3` values on the first screen; there is no strength option.
- **The site's 140 KB stylesheet budget.** Do not fold these files into `styles.css`
  (`motion.css` excepted, at 1,669 bytes): link them on the pages that use them.
- `demo.html` is assembled by `motion/work-light/build_demo.py` from `demo.main.html`,
  `demo.style.css` and the chrome of the built pricing page; rebuild it if the chrome changes.
