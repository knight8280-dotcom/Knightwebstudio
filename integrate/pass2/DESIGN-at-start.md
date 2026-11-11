# KnightWebstudio design handbook

For everyone building a page of the redesigned site. Read BRIEF.md and ROLLOUT.md
first; this file tells you how to build. `$R` is
`/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh`.

- The one stylesheet: `/home/user/Knightwebstudio/assets/css/styles.css`. Sections 01 to 18 are the shared system;
  sections 19 to 34 are the page-only rules, one block a page, every selector scoped with `[data-page="<slug>"]`.
- **Since the integration (10 November 2026) there are no page stylesheets**: `/assets/css/pages/` is gone, and a
  page rule goes in that page's block of `styles.css`. Read "0. What the integration changed" below first; where it
  and a later section disagree, it is the newer.
- Your page content: `$R/pages/<slug>/main.html` (it holds the page's current `<main>`; replace it with yours).
- Every component, live, in both themes: <http://localhost:8721/> (source: `$R/gallery/`).
- The site: <http://localhost:8720/>.
- **The reference page: <http://localhost:8720/pricing/>.** It is built from shared parts only and is what "done"
  looks like: its main is `$R/pages/pricing/main.html`, its page stylesheet is three lines, and its screenshots at
  390 and 1440 in both themes are in `$R/shots/reference/`. Look at them before you design. The home page is
  **not** a model yet: its hero, its three tilted prints and its length are still to be reworked.

## 0. What the integration changed

The shared layer was fixed once the 19 pages were built. What is different from the sections below:

- **Tokens.** `--paper-2` at night is `#0F131D`: sand is darker than the paper after dark, as it is by day, so a card,
  a ticket or a mock shows on a sand band. `--measure` is `31em` (about 65 characters). `.card` re-points `--well`
  to `--paper-3`, as `.section-sand` does, so a flat label on a card has a fill in both themes.
- **Price list.** A row never wraps: a long name wraps under itself and the price stays on the first line. A price
  that is a phrase ("$750 or $1,500 per setup") takes `pl-long` **on the row**: `<div class="pl-row pl-long">`.
  It is then set at the name's size and, on a phone and in a `.grid-2` until 1280px, sits under the name with no leader.
- **Steps.** Below 600px the numeral sits beside the title and the rest of the step runs the full width, on every page.
  A `.ticks` list inside a step, a price-list row or a case row has its spacing built in.
- **Contents list.** `class="toc toc-plain"` is the names-only list (legal pages): tighter rows, two columns on a tablet.
- **Layout.** `.page-head-split`, `.section-head-split`, `.grid`, `.split`, `.fig`, `.fig-art` and `.cta-inner` are one
  shrinkable column (`minmax(0, 1fr)`) until their breakpoint. `.fig` no longer sits side by side by itself from
  760px: a page sets that. A stacked split section head has 16px between title and intro, like a plain head. A pinned
  column (`.split-sticky`) lets go in a window under 620px tall. `.container-text` is gone (no page used it).
- **Lists.** Every list drawn without markers carries `role="list"`. `.pills` flows as text so its rows balance.
- **Text.** `body` has `overflow-wrap: break-word`. Buttons, FAQ questions and the board's short lines are balanced;
  ledes, section intros, prose, FAQ answers and step text avoid a one-word last line.
- **Tables.** The spec table and the stacked care table are complete in the shared sheet (the pricing page adds
  nothing to them). A stacked `.table-stack` row shows no cell labels; the `.cell-label` spans may stay in the markup.
- **Motion.** A scroll reveal owns `transform`. Anything revealed that also moves under the pointer uses the
  `translate` property (`.print` does). `@keyframes kws-brush` paints the brush under a `.mark`: a page opts in with
  `animation: kws-brush var(--t-slow) var(--ease) var(--t) both` on `.mark::after`. The brush sits behind the letters.
- **Behaviour (`main.js`).** The sticky phone bar also steps aside over `.cta-band` (keep that class on the closing
  band). On phones a `.reveal` block is shown once it clears the bar. A link to an id inside a closed `<details>` opens
  it. The phone menu fades only after it has been opened once (`.nav-anim`). The reading line is hidden on checkout pages.
- **Header.** The row may wrap (enlarged or spaced text drops the actions to a second row); "Book a free call" never wraps.
- **Tools.** `tools/sync_chrome.py` stops on an unknown flag. The workbench drawing (`scene-bench`) is retired.
- **Not changed:** the closing band's appointment card is still about 259px wide beside the copy (its `min(100%, 21rem)`
  cannot resolve in an `auto` track). At a full 21rem it took 78px from the copy and re-wrapped headlines from 980 to
  1440px, so it was left for whoever rebuilds the band to size card and copy together.

**After that, the consistency pass (same day) unified these across the 19 pages:**

- **Booking label.** The booking button in every closing band reads "Book a free 30-minute call", as in the page heads
  (it was "Book a discovery call" on twelve pages). The appointment card still says "Discovery call".
- **Closing band.** No band carries `reveal` on `.cta-inner` any more (nine did, the four city pages did not): the
  handbook says never on a wrapper that holds a whole section. If the new band animates in, animate its parts.
- **Monthly prices.** In a price list, a contents list, a table or an option the unit is `/mo`; in a sentence it is
  "a month". FAQ answers keep "/month" (they mirror the structured data).
- **Link out to a live site.** `.case-facts a[target]` is shared: bold, with the external arrow and "(opens in a new tab)".
- **Project prints in a row** (home, `/start/`). The caption is two halves around `<span class="sep"> · </span>`;
  `.print-cap` is a size container, and until it has room for the longest caption on one line the halves stand on two
  lines with no dot. Under 980px three prints in a `.grid-3` take the smaller name and the flush caption on both pages.
- **Pricing head.** Its copy starts level with every other page head (`align-items: start`), not centred on the contents card.
- **Labels.** "Start the Launch bundle" on both pages that have the button; "Back to the homepage" on both pages that have it.
- **Tools.** `tools/sync_chrome.py` now also keeps the first-paint `<script>` in each `<head>` in step with
  `tools/chrome/head-script.inc`. `assets/img/crest.svg` is gone (no page used it); `tools/art/build.py` writes only `logo.svg`.

## 1. The idea

**The well-run shop.** Everything on a page is an object you would find in a good
local business: the painted sign, the price board, the job ticket, the receipt, the
appointment card. It is drawn on warm paper in ink, sign-painter's blue and Red
Stick brick, so a roofer on a phone reads it as local, plain-spoken and carefully
made. Light is "open for business"; the dark theme is the same street after closing.

## 2. The colour rule

1. **Blue means pressable.** Buttons, links, a checked chip, the plus on an FAQ question. The one thing that is blue
   and not pressable is the tick in a tick list. The painted-sign panels (the price board, the bundle, the closing band)
   are the brand's blue ground, and what sits on them is pressable. **Nothing inside a mock is blue**: the business's
   text bubble is ink, a "done" pill is ink on sand, a new booking is brick. A town label is a flat grey label, not a chip.
2. **Brick means "notice this".** Eyebrows, numerals, the bars in a ledger, the stamp, the missed call, a new booking,
   errors. Not group labels, package names or the heads of tickets and receipts: those are grey or ink, so that an
   error still stands out.
3. **Gold only on blue or on the footer.** It appears by itself when you use `.on-blue` or `.on-ink`. Never write gold
   on paper. The single exception is built in: the focus ring is gold on the night theme's paper.

Never write a hex colour in a page stylesheet. Use the tokens. If a colour is missing, report it.

## 3. Tokens

All tokens are at the top of `styles.css`. Every spacing, type size, radius, shadow and
duration in your page stylesheet comes from one too.

### Colour

One line per colour holds both themes: `--paper: var(--L, #F6F0E4) var(--D, #131722);`.
`--L` and `--D` are switches set by the theme. You never write a rule per theme. If a
page-only value must differ at night, use the same form in your own rule:
`opacity: var(--L, 0) var(--D, 1);`.

| Token | Day | Night | Use |
| --- | --- | --- | --- |
| `--paper` | `#F6F0E4` | `#131722` | The page |
| `--paper-2` | `#EEE6D5` | `#0F131D` | Sand bands (`.section-sand`) |
| `--paper-3` | `#E4D9C3` | `#2A3249` | Wells: the caller's text bubble, payment-plan months, the Example flag, the "done" pill |
| `--card` | `#FFFCF5` | `#1D2333` | Raised paper: cards, tickets, receipts, form fields |
| `--ink` | `#1A2238` | `#F3ECDD` | Headings, strong lines, secondary button outline |
| `--ink-2` | `#454C61` | `#C3BEB2` | Body copy |
| `--ink-3` | `#5F6678` | `#9E9A90` | Captions, labels, help text |
| `--line` | `#DED3BD` | `#2A3144` | Hairlines (`--seam`) |
| `--line-2` | `#C8BBA0` | `#3A4259` | Stronger hairlines and dashes (`--edge`, `--dash`) |
| `--ctl` | `#85785C` | `#6C7692` | Form field outlines (3:1 or better) |
| `--blue` | `#2C46C4` | `#9DB0FF` | Pressable: primary button, links, ticks |
| `--blue-deep` | `#1E3299` | `#B9C7FF` | Hover on blue |
| `--blue-tint` | `#E1E7F9` | `#232C4A` | The quiet blue circle behind a tick |
| `--on-blue` | `#FFFBF2` | `#0E1322` | Text on a blue button |
| `--brick` | `#A83C26` | `#F0907A` | Notice this: eyebrows, numerals, bars, stamps, errors |
| `--brick-tint` | `#F5DDD2` | `#3A2320` | `.pill-new`, the flag inside a note |
| `--board` | `#24389F` | `#1B2A78` | Painted-sign blue behind `.on-blue` panels |
| `--footer` | `#161B2C` | `#0C0F18` | Footer and top strip (`.on-ink`) |
| `--focus` | `#2C46C4` | `#F0C369` | Focus ring |
| `--bezel` | `#1A2238` | `#05070C` | Phone bezel |
| `--gold` | `#F0C369` | same | Gold leaf: eyebrows and prices on blue, footer headings |
| `--cream` | `#FFFBF2` | same | Text on blue and on the footer; the appointment card |
| `--well` | `--paper-2` | `--paper-2` | The quiet fill behind a pill or a flat label. Sand bands and tone scopes re-point it |

Line tokens, built from the colours: `--edge` (card edge, strong hairline), `--dash` (dashed
divider), `--seam` (soft hairline), `--frame` (1.5px ink line). Write `border-top: var(--dash);`.

Shadows: `--shadow-1` a resting card, `--shadow-2` a lifted card, `--shadow-3` an object that
sits on top (phone, board, business card). `--press` is the edge under a button.

### Tone scopes

A class that re-points the colour tokens for everything inside it: text, lines, wells, even `--paper`.
The small parts (buttons, pills, flags, ticks, notes, the payment plan, markers) work inside a scope with
no extra rules, and each scope has its own focus-ring colour. **A paper object inside a scope carries
`.on-paper`**: a receipt, ticket, time sheet, vignette, phone or card on blue is still a piece of paper.

| Class | What it is | Inside it |
| --- | --- | --- |
| `.on-blue` | Painted-sign blue: price board, bundle panel, closing band | Text cream, eyebrows and prices gold, `.btn-primary` cream, plain `.btn` a cream outline, focus ring gold |
| `.on-ink` | Top strip and footer | Text cream, headings gold, focus ring gold |
| `.on-paper` | A printed object that stays cream paper: the appointment card always, and any paper object on blue | The day palette, whatever the theme |

### Type

Two families, two files. **Fraunces** (soft, weight 600) for headings, every price and
numerals; **Figtree** for text and labels. No italic is loaded: do not use `<em>` or
`<i>` for emphasis; use `<strong>`.

| Token | Value | Use |
| --- | --- | --- |
| `--fs-figure` | `clamp(5rem, 2rem + 13vw, 8.75rem)` | The one very large number a page (`.bigfig`), the 404 |
| `--fs-price` | `clamp(2.5rem, 2rem + 2vw, 3.5rem)` | A headline price: tier prices, receipt total |
| `--fs-h1` | `clamp(2.375rem, 10.6vw, 3.75rem)` | Page headline. One a page |
| `--fs-h2` | `clamp(1.875rem, 1.2rem + 2.9vw, 3.125rem)` | Section titles |
| `--fs-title` | `clamp(1.5rem, 1.3rem + 1vw, 2rem)` | The name on a card or object: appointment card, business card, a feature card title |
| `--fs-h3` | `clamp(1.3125rem, 1.15rem + .6vw, 1.5625rem)` | Card titles, price-list prices, the phone menu |
| `--fs-h4` | `1.1875rem` | Small headings: price-list names, FAQ questions, table totals, the brand name |
| `--fs-lede` | `clamp(1.125rem, 1.05rem + .35vw, 1.3125rem)` | The intro paragraph under a heading (`.lede`, `.section-sub`) |
| `--fs-body` | `1.0625rem` | Body copy, form field text. 17px |
| `--fs-md` | `1rem` | Buttons. 16px |
| `--fs-sm` | `.9375rem` | Card copy, table cells, notes, fine print, message bubbles. 15px: nothing a customer must read is smaller |
| `--fs-label` | `.8125rem` | Uppercase labels: eyebrows, table heads. 13px |
| `--fs-cap` | `.75rem` | The floor, 12px: pills, flags, and labels inside mocks only |
| `--measure` | `31em` | Line length for running text: about 65 characters |

- To set something in the display face, add class `display` (or use a heading). Do not write `font-family` yourself.
- `.title` sets an element at `--fs-title`: the name on a card, a panel or an object.
- To make a small uppercase label, add class `label` (grey) or `eyebrow` (brick, with a rule).
- `h1` 38 to 60px on phones and 52 to 76px from 980px; `h2` 30 to 50px; `h3` 21 to 25px; `h4` 19px.
- One `<h1>` a page. Do not skip levels. A card title directly under the `h1` is `<h2 class="h3">`.
- Body measure stays between 45 and 75 characters: `.lede`, `.section-sub`, `.prose`, `.note` and paragraphs
  inside components are already capped with `--measure`, and so is a plain `<p>` directly inside a `.container`.
- Headings have no margin. A `p`, `ul` or `ol` directly after an `h2`, `h3` or `h4` gets 12px; otherwise the
  container does the spacing (`.stack`, `.section-head`, `.prose`). A bare `ul` or `ol` has no indent: every list
  is in `.prose` or is a `.ticks`, `.steps`, `.pricelist` or `.pills`.

### Space, size, shape

4px base. Use the scale for every margin, padding and gap; use the fluid tokens for layout.

| Token | Value | Use |
| --- | --- | --- |
| `--s-0` | `2px` | hairline gaps |
| `--s-1` | `4px` |  |
| `--s-2` | `8px` |  |
| `--s-3` | `12px` |  |
| `--s-4` | `16px` |  |
| `--s-5` | `24px` |  |
| `--s-6` | `32px` |  |
| `--s-7` | `48px` |  |
| `--s-8` | `64px` |  |
| `--s-9` | `96px` |  |
| `--gutter` | `clamp(20px, 5vw, 48px)` | page side margin |
| `--gap` | `clamp(16px, 2.6vw, 32px)` | between cards and columns |
| `--gap-lg` | `clamp(32px, 6vw, 80px)` | between the two halves of a split |
| `--pad` | `clamp(20px, 3vw, 32px)` | inside a card |
| `--pad-lg` | `clamp(24px, 4.6vw, 60px)` | inside a big panel (board, bundle) |
| `--stack` | `clamp(32px, 5vw, 56px)` | section heading to its content; top of a page head |
| `--sec` | `clamp(64px, 9vw, 128px)` | top and bottom of every section |

Sizes: `--tap` 44px (smallest target), `--btn-h` 52px, `--btn-h-lg` 56px, `--header-h` 64px (72px from 1100px),
`--maxw` 1240px (`.container`), `--maxw-text` 46rem (`.container-text`, FAQ, contents list, price list, steps),
`--maxw-card` 26rem (receipt, business card, the page head's aside), `--skyline` (the height of the footer skyline).
Line weights: `--hair` 1px, `--rule` 1.5px, `--bold` 2px. Focus ring: `--focus-w` 3px, `--focus-off` 3px.
Radii: `--r-xs` 4, `--r-sm` 8, `--r-md` 14, `--r-lg` 22, `--r-xl` 32, `--r-pill`.
Layers: `--z-raised` 1, `--z-bar` 50, `--z-header` 60, `--z-skip` 200.

Which radius and shadow go with which kind of object:

| Kind of object | Radius | Shadow |
| --- | --- | --- |
| Torn or printed paper: the receipt, the top of a time sheet, flat labels | `--r-xs` | `--shadow-2` (labels none) |
| Small parts: fields, the square end of a tag, payment-plan blocks | `--r-sm` | none |
| Paper objects: ticket, business card, appointment card, print, browser, bubbles, notification | `--r-md` | `--shadow-2`; `--shadow-3` when it lies on top of something |
| `.card`, a vignette, a package card | `--r-lg` | `--shadow-1` |
| Panels, the price board, the phone | `--r-xl` | `--shadow-3` (a plain panel `--shadow-2`) |
| Pills, flags, chips, round buttons | `--r-pill` | none |

A drawn object in your page stylesheet may set its own geometry once, as custom properties at the
top of its rule (`.route { --pin: var(--tap); }`), and build the rest from those.

### Motion

`--ease`; `--t-fast` .16s (press), `--t` .28s (hover, menu), `--t-slow` .5s (reveal),
`--t-step` 70ms (the gap between steps in a sequence), `--move` (the one transition: `transform var(--t) var(--ease)`),
`--fade` (show and hide: opacity, with `visibility` switched at the end so a hidden thing cannot be focused).

## 4. Breakpoints

Six, and only six, in the whole site. Phone first: write the phone layout, then add `min-width` rules.

| Width | What changes |
| --- | --- |
| 380px | Below this is a small phone: the top strip reads "Baton Rouge", the brand shrinks, the phone bar drops " · no pitch" |
| 600px | Button rows sit side by side; headline lines (`.l`) break; leaders appear in the contents list; the payment plan is one row |
| 760px | Two columns (`.grid-2`, `.grid-3`, the package cards, the price board, the footer); stacked tables become tables |
| 980px | Split layouts and the page head's aside sit side by side; `h1` steps up; the facts shelf is five across |
| 1100px | Desktop menu; the spec table becomes one table; the price board is four across. Below it: the full-sheet phone menu and the sticky phone bar |
| 1280px | The phone number shows in the header once the top strip has scrolled away |

```css
@media (min-width: 760px) { ... }
@media (max-width: 759.98px) { ... }   /* the same breakpoint, from the other side */
```

Use these numbers and no others. Between them, let `clamp()` tokens and `minmax(0, 1fr)` do the work.

## 5. Section rhythm

```html
<main id="main">
  <section class="page-head"> <div class="container"> eyebrow, h1, lede, .btn-row, .price-strip </div> </section>
  <section class="section section-first" id="..."> <div class="container"> the contents list, then the first block </div> </section>
  <section class="section section-sand" id="..."> <div class="container"> ... </div> </section>
  <section class="section" id="..."> <div class="container"> ... </div> </section>
  <section class="cta-band on-blue"> ... </section>
</main>
```

- The page head has three forms and no others: see "Page head" in section 8. It always has a container inside.
- Every band is a `.section` (padding `--sec` top and bottom) holding one `.container`.
- Alternate plain paper and `.section-sand`. Never two bands of one colour in a row; if you cannot avoid it, the
  second drops its top padding by itself. `.section-tight` is for a short aside between two full bands.
- Inside a section the header carries the gap to the first block; each further block takes `space-above`.
- A page ends in the closing band, or else on plain paper (legal, checkout, 404): `main` leaves room for the
  footer skyline under the last section, so never add bottom padding of your own for it.
- At most one blue panel (the board or a `.panel.on-blue`) and one closing band a page.
- No two neighbouring sections share a structure. If the last one was a grid of cards, this one is a
  split, a table, a ticket or a list. Prefer the shop objects to `.card`.
- A section heading is left aligned. Do not centre section heads.
- Add `reveal` to blocks that should rise in as they scroll into view. Never on anything in the first
  screen, and never on a wrapper that holds the whole section.

## 6. Building a page

```bash
python3 $R/tools/kws_page.py services/index.html --main $R/pages/services/main.html
```

You write only `<main id="main"> ... </main>`. The tool supplies everything else for that page and
touches no other file: the untouched baseline `<head>` with the new theme settings and font preloads,
the link to `/assets/css/pages/<slug>.css` when that file exists (`--css other` links one more),
`<body data-page="slug">`, the skip link, top strip, the right header with `aria-current`, the sticky
phone bar where the page has one, the right footer, the page's scripts exactly as the baseline has
them, and the art markers filled in. Then it runs the integrity check for the page and prints it.

It refuses to build, and writes nothing, when:
- the file has no `<main>...</main>`;
- a `style` attribute sets anything other than custom properties (`style="--w:50"` is fine);
- the `<main>` holds a `<style>` or `<script>` element, or a header or footer crest marker;
- a banned word is in the markup;
- on `/checkout/` or `/checkout/success/`, an id the inline script uses is missing;
- **the props rule is broken**: more than one `.tilt`; more than one stamp, counting the seal; any prop on the FAQ,
  legal or checkout pages; a street scene outside home, `/start/` and 404; a `.vig` with no `.flag` in it; a
  `.bigfig` with no `.note` in it; `reveal` or `seq` on the 404 page;
- **your page stylesheet breaks its rules**: a hex colour, `!important`, a selector that does not start with
  `[data-page="<slug>"]`, a media width that is not one of the six, or a `:hover` rule outside `@media (hover: hover)`.

It also prints your page stylesheet's size against its budget. Over budget is a warning you must clear before you finish.

Page paths and the files that hold their content now:

| Page | `data-page` | Main file | Chrome |
| --- | --- | --- | --- |
| `index.html` | `home` | `$R/pages/home/main.html` | standard |
| `services/index.html` | `services` | `$R/pages/services/main.html` | standard |
| `consulting/index.html` | `consulting` | `$R/pages/consulting/main.html` | standard |
| `work/index.html` | `work` | `$R/pages/work/main.html` | standard |
| `process/index.html` | `process` | `$R/pages/process/main.html` | standard |
| `pricing/index.html` | `pricing` | `$R/pages/pricing/main.html` | standard |
| `faq/index.html` | `faq` | `$R/pages/faq/main.html` | standard |
| `about/index.html` | `about` | `$R/pages/about/main.html` | standard |
| `web-design-baton-rouge/index.html` and the three other city pages | `city` | `$R/pages/city/web-design-<town>.main.html` | standard |
| `contact/index.html` | `contact` | `$R/pages/contact/main.html` | standard, no phone bar |
| `privacy/index.html`, `terms/index.html` | `privacy`, `terms` | `$R/pages/privacy/main.html`, `$R/pages/terms/main.html` | standard, no phone bar |
| `checkout/index.html` | `checkout` | `$R/pages/checkout/main.html` | standard, no phone bar |
| `checkout/success/index.html` | `checkout-success` | `$R/pages/checkout-success/main.html` | standard, no phone bar |
| `start/index.html` | `start` | `$R/pages/start/main.html` | start: no menu, one booking button, slim footer, phone bar |
| `404.html` | `notfound` | `$R/pages/notfound/main.html` | bare: brand only, slim footer, no script |

The four city pages share one stylesheet, `pages/city.css`.

**The chrome is not yours.** The header, footer and phone bar live once in
`/home/user/Knightwebstudio/tools/chrome/` and are copied into pages by the build tool. Do not paste
them into your main file, do not restyle them from a page stylesheet, and do not run
`tools/sync_chrome.py` or `tools/art/build.py` without a page name (they would touch other agents' pages).

Check your work, for your page only:

```bash
node $R/tools/shoot.js --base http://localhost:8720 --paths /services/ --out $R/shots/services --modes desktop-light,desktop-dark,mobile-light,mobile-dark,small-light,tablet-light,laptop-light
node $R/tools/widths.js --urls http://localhost:8720/services/          # no sideways scroll, 360 to 1920 in 20px steps
node $R/tools/contrast.js --base http://localhost:8720 --paths /services/   # measured AA contrast, both themes
node $R/tools/smalltext.js --urls http://localhost:8720/services/       # nothing under 12px, no target under 44px, lists text under 15px
python3 $R/tools/check_site.py --root /home/user/Knightwebstudio --baseline $R/baseline --pages services/index.html --show-missing
```

Open the screenshots and look at them. `node $R/tools/behaviour.js` re-tests the theme toggle, menu,
phone bar, contact form, calculator and checkout wiring across the site.

## 7. Page stylesheets

- One file per page: `/home/user/Knightwebstudio/assets/css/pages/<slug>.css`. Create it only if you need it.
- **Every selector starts with `[data-page="<slug>"]`** (reveal rules start `.js [data-page="<slug>"]`).
  An integrator folds these files into the one stylesheet at the end; an unscoped rule would leak.
- Tokens only: no hex colours, no raw px for spacing, type, radius or duration, no `!important`,
  no `[data-theme]` selectors, no `color-mix()`, `backdrop-filter` or `:has()` without a plain
  declaration first or an `@supports` wrapper.
- The six breakpoints only. Hover rules inside `@media (hover: hover)`.
- Reuse before you write. Most pages need under 3 KB; the reference page needs 0.2. Budgets, in KB (the whole
  site must end under 140 and these add up to 131: the shared sheet is 62, the page sheets 69): home 15,
  consulting 9, start 6, pricing 5, services 5, city 4, contact 4, about 4, work 3, process 3, checkout 3, faq 2,
  checkout-success 2, notfound 2, privacy 1, terms 1. The build tool prints your size against your line.
- Two page stylesheets already exist because they hold a canonical part: `consulting.css` (the calculator) and
  `notfound.css` (the 404 block). Keep what is there and add your rules under it.
- Name page classes after the thing, not the look, and do not reuse a shared class name for something else.
- **Do not edit `styles.css`, `main.js`, the chrome partials, `tools/` or another page's files.** If a
  shared component is wrong or missing, work around it in your page file with a scoped rule and
  report it in your final message under "Shared problems".

## 8. Components

Canonical markup for every shared component. Copy it; change the words, not the structure.
Each one is drawn at <http://localhost:8721/> in both themes.

### Icons

An inline `<svg viewBox="0 0 24 24" aria-hidden="true">` with **no class** (or class `ico`) is a
line icon: 1.15em, drawn in the current text colour. Use these paths so icons match site-wide:

| Icon | Paths |
| --- | --- |
| phone | `<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>` |
| missed call | the phone path, then `<path d="m15 4 5 5m0-5-5 5"/>` |
| pin | `<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>` |
| mail | `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>` |
| clock | `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>` |
| tick | `<path d="m5 12.5 4.5 4.5L19 7.5"/>` |
| arrow | `<path d="M5 12h13M12 5l7 7-7 7"/>` |
| external | `<path d="M7 17 17 7M9 7h8v8"/>` |
| price tag | `<path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5Z"/><circle cx="8" cy="8" r="1.5"/>` |
| key | `<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16 7l2.5 2.5M13.5 9.5 15 11"/>` |
| loop | `<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M20 4v4.5h-4.5M4 20v-4.5h4.5"/>` |

No icon fonts, no emoji, no icon tiles.

### Utilities

| Class | What it does |
| --- | --- |
| `container`, `container-text` | Page column (1240px) and text column (46rem), with the gutter |
| `display` | Sets the element in Fraunces, soft, 600 |
| `h2`, `h3`, `h4`, `title` | Size an element like that heading level (or the title size between `h2` and `h3`) without changing the outline |
| `label`, `eyebrow`, `lede`, `fine` | Small grey caption; brick kicker with a rule; intro paragraph; 15px fine print |
| `stack`, `cluster`, `grid` + `grid-2/3/4`, `split` (+ `split-even`, `split-sticky`), `btn-row` | Layout primitives (see below) |
| `sr-only` | For screen readers only |
| `nowrap` | Keeps a phrase such as "7–10 days" on one line |
| `space-above` | The section gap above a block that follows another block in the same container |
| `wide-only` | Hides a decorative object below 980px |
| `panel` | The big rounded surface: plain, or `panel on-blue` for the page's one blue panel |
| `tilt` | The page's one tilted object |
| `reveal`, `seq` | Scroll reveal; one step of a sequence inside a reveal |
| `on-blue`, `on-ink`, `on-paper` | Tone scopes |

### Headings, eyebrow, lede, fine print

One `<h1>` a page. Wrap each idea of the headline in `<span class="l">` so it sits on its own line from 600px.
`.mark` is the brush underline: at most one a page, on the two or three words that matter.
`.eyebrow` goes above a heading and is brick ("notice this"). `.lede` is the one intro paragraph under an `h1`.
`.fine` is small print in 15px; it is never smaller. `.label` is a small uppercase caption.
`.title` sets any element at the size between `h2` and `h3`: the name on a card or object ("Launch bundle").
A card title under an `h1` is `<h2 class="h3">`: `h2` for the outline, sized like an `h3`. Never skip a level.
Headings have no margin of their own. A paragraph or list that directly follows an `h2`, `h3` or `h4` gets a 12px gap; everything else is spaced by its container (`.stack`, `.section-head`, `.prose`).
Text inside a filled part (a button, bubble, pill, flag or chip) keeps that part's colour, so `<strong>` is safe there.

```html
<p class="eyebrow">Pricing</p>
<h1><span class="l">Fixed prices,</span> <span class="l"><span class="mark">published</span> up front</span></h1>
<p class="lede">Every price here is fixed, for websites, consulting and automation alike. What you see is what you pay, confirmed in writing before any work begins.</p>
<h2>Systems that win customers and save time</h2>
<p class="title">Launch bundle</p>
<h3>Missed-call text-back</h3>
<h4>Growth Audit &amp; action plan</h4>
<p>Body copy is 17px Figtree with a line height of 1.6. <strong>Strong text</strong> turns ink. <a href="/pricing/">Links are blue and underlined</a>.</p>
<p class="label">A small label</p>
<p class="fine">Fine print is 15px, never smaller: an estimate, not a guarantee.</p>
```

### Page head

Every page except the home page opens with `<section class="page-head">`, always with a container inside it (`.container`; legal pages use `.container-text`, the column their text uses). There are three forms and no others.
**1. Commercial** (services, consulting, process, work, the city pages): eyebrow, `h1`, lede, one `.btn-row` whose first button is the page's main action, then the `.price-strip` with that page's fixed prices. On a phone this puts what the page is, a price and one button on the first screen. A page with no prices of its own (process, work, about, contact) leaves the strip out.
**2. Reading** (FAQ, privacy, terms, checkout, checkout success): eyebrow, `h1`, lede. Nothing else.
**3. Split** (pricing, about, contact, `/start/`): the commercial head with `.page-head-split` on the container and one `.page-head-aside` beside it from 980px, under it on a phone. The aside holds exactly one object: the seal on pricing, the business card on about and contact, the street scene on `/start/`. No other page has an aside. (The 404 page has its own block, below.) Add `wide-only` to hide a purely decorative aside (the seal) below 980px.
The price strip is a link to the section that holds those prices; use a `<p class="price-strip">` when there is nowhere to send people. Fixed prices only, four at most.
The "On this page" list is not part of the head: it is the first block of the `.section-first` that follows.
The home page's hero is its own (`pages/home.css`) and is not a model for any other page.

```html
<!-- 1. Commercial -->
<section class="page-head">
  <div class="container">
    <p class="eyebrow">Consulting &amp; automation</p>
    <h1><span class="l">More customers,</span> <span class="l">less busywork</span></h1>
    <p class="lede">A website is one piece. We also set up the systems behind it: Google reviews, missed-call text-back, online booking and automatic follow-up. Fixed prices, like everything else we do.</p>
    <div class="btn-row">
      <a class="btn btn-primary btn-lg" href="/contact/?package=audit">Book a Growth Audit, $350</a>
      <a class="btn btn-lg" href="#calculator">Estimate what it's worth</a>
    </div>
    <a class="price-strip" href="#services">
      <span class="price-strip-label">Setups</span>
      <span class="price-strip-nums"><b>$500</b><b>$750</b><b>$1,500</b></span>
      <span class="price-strip-note">Fixed, published prices</span>
    </a>
  </div>
</section>

<!-- 2. Reading -->
<section class="page-head">
  <div class="container">
    <p class="eyebrow">FAQ</p>
    <h1>Questions we get asked</h1>
    <p class="lede">The things people ask before they hire us, about websites, consulting and automation.</p>
  </div>
</section>

<!-- 3. Split: one object beside the head from 980px -->
<section class="page-head">
  <div class="container page-head-split">
    <div>
      <p class="eyebrow">Pricing</p>
      <h1><span class="l">Fixed prices,</span> <span class="l"><span class="mark">published</span> up front</span></h1>
      <p class="lede">Every price here is fixed, for websites, consulting and automation alike. What you see is what you pay, confirmed in writing before any work begins.</p>
      <div class="btn-row">
        <a class="btn btn-primary btn-lg" href="/contact/" data-booking>Book a free 30-minute call</a>
        <a class="btn btn-lg" href="/contact/">Send an enquiry</a>
      </div>
      <a class="price-strip" href="#pricing">
        <span class="price-strip-label">Websites</span>
        <span class="price-strip-nums"><b>$1,000</b><b>$2,000</b><b>$4,000</b><b>$8,000</b></span>
        <span class="price-strip-note">Four fixed packages</span>
      </a>
    </div>
    <div class="page-head-aside wide-only"><!-- art:seal --><!-- /art:seal --></div>
  </div>
</section>
```

### Section and section header

Every band of a page is a `<section class="section">` holding a `.container`. Alternate plain paper with `.section-sand`.
Never put two bands of the same colour together. If it cannot be avoided, the second one drops its top padding by itself, so the gap is not doubled.
`.section-tight` is a shorter band, for a short aside between two full ones. `.section-first` is the first band under a `.page-head`.
The header is left aligned: eyebrow, `h2`, optional `.section-sub`. `.section-head-split` puts the title left and the intro right from 980px.
An eyebrow is optional: use it when it adds something the title does not say ("Add to any project"), never to repeat the title.
In the narrow column of a `.split`, a title of more than five words takes `class="h3"`, or it wraps to four lines.
The header carries the gap to the first block under it. Every further block in the same container takes `space-above`; `.section-more`, the link that closes a section, has that gap built in.
A page that does not end in the closing band ends on plain paper, never on sand: the footer skyline stands in the room `main` leaves under the last section.

```html
<header class="section-head">
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

<div class="grid grid-3">
  <div class="card">One block</div><div class="card">under the header</div><div class="card">needs no class</div>
</div>
<div class="card space-above">A second block in the same section takes <code>space-above</code>.</div>
<p class="section-more"><a class="more-link" href="/services/">All services<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></a></p>
```

### Buttons and links

Blue means pressable, so one `.btn-primary` per view: the thing we most want pressed. Plain `.btn` is the secondary button. `.btn-quiet` is a text button for the third choice.
`.btn-lg` (56px) for a page head and the closing band, default 52px, `.btn-sm` (44px) for the header and table rows. `.btn-block` fills its column.
Put two or more buttons in `.btn-row`: stacked full width on a phone, in a row from 600px.
An icon is an inline `<svg class="ico">` before the words. The call button is always a real `tel:` link with the number or the word Call as text.
A booking button carries `data-booking`; `main.js` points it at the calendar and opens a new tab. Its `href` stays `/contact/` for when scripts are off.
Keep an amount on one line with a non-breaking space, not a `span`: `Pay 50% deposit —&nbsp;$1,000`.
A disabled button is dimmed with a not-allowed cursor; add `aria-busy="true"` while it is sending.
`.more-link` is the arrow link that ends a section.

```html
<div class="btn-row">
  <a class="btn btn-primary btn-lg" href="/contact/" data-booking>Book a free 30-minute call</a>
  <a class="btn btn-lg" href="#how">See how it works</a>
</div>
<div class="btn-row">
  <a class="btn btn-primary" href="/contact/?package=audit">Book a Growth Audit, $350</a>
  <a class="btn" href="tel:+12252550837"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>Call (225) 255-0837</a>
  <a class="btn btn-quiet" href="/contact/?package=starter">Questions first? Send an enquiry</a>
</div>
<div class="btn-row">
  <a class="btn btn-primary btn-sm" href="/contact/" data-booking>Book a free call</a>
  <a class="btn btn-sm" href="/pricing/">Request plan</a>
  <button class="btn btn-primary" type="button" disabled>Sending…</button>
</div>
<p><a class="more-link" href="/consulting/">How each automation works, step by step<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></a></p>
```

### Tone scopes: on blue, on ink, on paper

A tone scope re-points the colour tokens for everything inside it, so the same classes work there with no extra rules: text, links, buttons, pills, flags, ticks, notes, the payment plan, figure markers and focus rings all follow it.
`.on-blue` is painted-sign blue: text turns cream, eyebrows and prices turn gold, `.btn-primary` turns cream and plain `.btn` becomes a cream outline. The focus ring turns gold.
`.on-ink` is the footer and top strip. `.on-paper` puts the day palette back, whatever the theme.
**A paper object inside a tone scope carries `.on-paper`**: a receipt, ticket, time sheet, vignette, phone, business card or appointment card on a blue panel is still a piece of paper. Without the class it turns into a tinted patch of blue.
Gold only ever appears inside `.on-blue` or `.on-ink`. One blue panel (the board or a `.panel.on-blue`) and one closing band a page at most. No form fields on blue.

```html
<div class="card stack on-blue">
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
</div>
```

### Everything inside .on-blue

Not a component: the proof that the scope holds. Every small part sits on blue here and `contrast.js` measures it in both themes.
If you need something on blue that is not shown here, add it to this block first and run the contrast check.

### Ticks, tags, pills, notes

`.ticks` is the tick list for what is included. `.tag` is a price tag: use it for a price that sits beside a title.
`.pill` is a small status inside a mock: plain, `.pill-new` (brick: notice this) or `.pill-go` (ink: done). A pill is never a control and is never blue.
`.pills` is a row of flat labels, used for the towns. They are square-cornered and filled so that they cannot be mistaken for the form's checkbox chips.
`.flag` marks a mock as an example. `.popular` is the one "Most popular" marker; it belongs to the Business package only.
`.note` is the qualifier that sits right beside a number: example, estimate, not a guarantee. Start it with a `.flag`. Never move it away from the figure it qualifies.

```html
<ul class="ticks">
  <li>Custom design, built for you</li>
  <li>Copywriting support on Business and Commerce</li>
  <li>Built mobile-first</li>
</ul>

<p class="tag">$750 or $1,500 per setup</p>

<p class="cluster"><span class="pill">Quote sent</span> <span class="pill pill-new">New</span> <span class="pill pill-go">Follow-up sent · 2 days</span> <span class="flag">Example</span> <span class="popular">Most popular</span></p>

<ul class="pills" aria-label="Towns where we meet in person">
  <li>Baton Rouge</li><li>Gonzales</li><li>Prairieville</li><li>Denham Springs</li><li>Zachary</li><li>Central</li><li>Baker</li>
</ul>

<p class="note"><span class="flag">Example</span>These are example numbers to show the arithmetic, not a measurement of your business. An estimate, not a guarantee.</p>
```

### Stamp and seal

One stamp a page, counting the seal. Both are decorative (`aria-hidden`): the same words are always in the page text.
`.stamp` is a rubber stamp for two or three words. The seal is drawn by `tools/art` from the marker shown; set its size with `--seal` on a wrapper in your page stylesheet.
One tilted object a page as well: add `.tilt` to a single card (business card, print or receipt). Everything else sits straight.
Both are turned with the `rotate` property, so `reveal` on a stamp or a tilted card is safe.

```html
<div class="cluster">
  <p class="stamp" aria-hidden="true">You own<br>everything</p>
  <!-- art:seal --><!-- /art:seal -->
</div>
```

### Card, grid, stack, cluster, split

`.card` is the plain raised surface. Reach for it only when no shop object (ticket, receipt, sheet, board) fits, and never build a wall of identical cards.
`.grid` with `.grid-2`, `.grid-3` or `.grid-4` lays children out in equal columns (one column on a phone; `.grid-4` is two columns from 760px and four from 1100px).
`.stack` spaces its children evenly top to bottom; set `--stack-gap` in your page stylesheet to change the step.
`.cluster` is a wrapping row of small things. `.split` is the two-column section layout from 980px (4 to 7); add `.split-even` for halves and `.split-sticky` to pin the first column while the second scrolls.
`.space-above` adds the section gap above a block that follows another block. `.wide-only` hides a decorative object below 980px.

```html
<div class="grid grid-3">
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
</div>
```

### Panel and the bundle

`.panel` is the big rounded surface for the one thing a page is built around. Plain, it is raised paper (the calculator sits on one). `.panel.on-blue` is the painted-sign panel with the gold inner line; a page has one blue panel at most, counting the price board.
The bundle is the canonical blue panel: `.panel.on-blue.split.split-even`. On the left a `.stack` with the eyebrow, the name as `.title`, one sentence, the payment plan drawn to scale and one button. On the right the itemised `.receipt.on-paper`.
Every figure on it is a published price, and the receipt adds up: $2,000 + $500 + $750 is $3,250, struck through, above $3,000.

```html
<aside class="panel on-blue split split-even space-above reveal" aria-labelledby="bundle-title">
  <div class="stack">
    <p class="eyebrow">Bundle</p>
    <h3 class="title" id="bundle-title">Launch bundle</h3>
    <p>Starter website, Google profile &amp; reviews and missed-call text-back. $3,250 bought separately.</p>
    <figure class="payplan" role="img" aria-label="The Launch bundle payment plan: $1,500 down, then $500 a month for 3 months">
      <p class="label" aria-hidden="true">Payment plan</p>
      <div class="payplan-bar" aria-hidden="true"><span class="payplan-seg payplan-dep" style="--w:50"><b>$1,500</b>down</span><span class="payplan-seg" style="--w:16.67"><b>$500</b>month 1</span><span class="payplan-seg" style="--w:16.67"><b>$500</b>month 2</span><span class="payplan-seg" style="--w:16.67"><b>$500</b>month 3</span></div>
    </figure>
    <a class="btn btn-primary" href="/contact/?package=bundle">Ask about the bundle</a>
  </div>
  <div class="receipt on-paper">
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
</aside>
```

### Facts shelf

Up to five short facts on a shelf: a brick line icon and a few words each. Two columns on a phone (an odd last one takes the whole row), five across from 980px.
Used under the home hero and under a city page's head. Facts only: no claims, no counts, nothing that is not already on the site.

```html
<ul class="points">
  <li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg><span>Websites live in as little as <span class="nowrap">7–10 days</span></span></li>
  <li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M20 4v4.5h-4.5M4 20v-4.5h4.5"/></svg><span>Automations that run while you work</span></li>
  <li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5Z"/><circle cx="8" cy="8" r="1.5"/></svg><span>Fixed, published prices</span></li>
  <li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16 7l2.5 2.5M13.5 9.5 15 11"/></svg><span>You own everything</span></li>
  <li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>Meet in person anywhere in Greater Baton Rouge</span></li>
</ul>
```

### Prose block

For long text: privacy, terms, the About page. It holds the line to about 65 characters and spaces headings, paragraphs and lists.
Inside `.prose`, `h2` is sized like an `h3`. Use it inside `.container-text` (a 46rem column) on legal pages. Legal wording is never edited.
A bare `<ul>` or `<ol>` has no indent and its markers hang in the gutter. Every list is inside `.prose`, or is a `.ticks`, `.steps`, `.pricelist` or `.pills`.
A plain `<p>` directly inside a `.container` is capped at the same measure for you.

```html
<div class="prose">
  <h2>Payment</h2>
  <p>Standard is 50% to start and 50% at launch. Payment plans are available on all projects: 50% up front, then the rest in up to 3 equal monthly payments, the first due one month after the deposit.</p>
  <ul>
    <li>Pay by card or ACH bank transfer through Stripe.</li>
    <li>Or by check on request.</li>
  </ul>
  <h3>Care plans</h3>
  <p>No long-term contract or minimum term. Cancel or change with <a href="/terms/">10 days' written notice</a>, no fee.</p>
</div>
```

### "On this page" contents list

At the top of a long commercial page (pricing, services, consulting). Each entry can show that section's prices on the right, joined by a dotted leader from 600px; on a phone the prices sit under the name.
It is the first block of the `.section-first` that follows the page head; the section header after it takes `space-above`.
List fixed prices only: never a range, never "from". The title is a plain `.label`.
Pages off the menu (checkout, city pages) that need a way back use a `.btn-quiet` link: `<a class="btn btn-quiet" href="/pricing/">Back to pricing</a>`.

```html
<nav class="toc" aria-labelledby="toc-title">
  <p class="label" id="toc-title">On this page</p>
  <ol>
    <li><a href="#packages"><span class="toc-name">Website packages</span><span class="dots" aria-hidden="true"></span><span class="toc-price">$1,000 · $2,000 · $4,000 · $8,000</span></a></li>
    <li><a href="#payment"><span class="toc-name">How you pay</span><span class="dots" aria-hidden="true"></span><span class="toc-price">50% to start, 50% at launch</span></a></li>
    <li><a href="#addons"><span class="toc-name">Add-ons</span><span class="dots" aria-hidden="true"></span><span class="toc-price">$750 or $1,500</span></a></li>
    <li><a href="#consulting"><span class="toc-name">Consulting &amp; automation</span><span class="dots" aria-hidden="true"></span><span class="toc-price">$350 audit · $500 or $1,000 a month</span></a></li>
    <li><a href="#care"><span class="toc-name">Care plans</span><span class="dots" aria-hidden="true"></span><span class="toc-price">$125, $300, $600 or $1,000 a month</span></a></li>
  </ol>
</nav>
```

### Price board

The four website prices in gold leaf on painted blue. Each tier is one link. Used on the home page, `/start/` and the city pages; one board a page, and it counts as the page's blue panel.
Always `class="board on-blue"`. The button inside is `.btn-primary` (it turns cream on blue).
Rows on a phone (name and price on the first line, the payment plan under them), two by two from 760px, four across from 1100px.

```html
<div class="board on-blue">
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
</div>
```

### Dot-leader price list

For any list of more than three priced things: name, dotted leader, price, one or two sentences. `.pl-group` labels a group.
The name is a heading (`h3` or `h4`, whichever keeps the outline in order) with class `pl-name`. The price is always in the display face, never in a pill. A long price ("$750 or $1,500 per setup") drops under the name by itself on a phone.
**The service row**: a row may add a `.ticks` list and a closing `.more-link`. Use it wherever a service is listed with its price, two sentences, ticks and a link (services, `/start/`, the city pages) instead of a grid of cards.
The list is capped at 46rem. Put it beside a heading in a `.split`, or two lists side by side in a `.grid.grid-2`; never let one run the full width of the page.

```html
<h3 class="pl-group">One-time setups</h3>
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
</ul>

<ul class="pricelist">
  <li>
    <div class="pl-row"><h3 class="pl-name">Automation</h3><span class="dots" aria-hidden="true"></span><span class="pl-price">$750 or $1,500 per setup</span></div>
    <p>The busywork, handled: missed calls texted back, bookings and reminders, quotes followed up and reviews requested, all on their own. In a typical example that's about 4 hours a week back.</p>
    <ul class="ticks">
      <li>Missed-call text-back or online booking, $750</li>
      <li>Lead follow-up system, $1,500</li>
      <li>Custom automation workflow, $1,500</li>
    </ul>
    <a class="more-link" href="/consulting/">How consulting and automation work<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></a>
  </li>
</ul>
```

### Tier spec table

The website packages as one ruled table, so every row lines up across all four. It is on the pricing page; this is that page's table.
Markup: one row per package; the header row names the columns. A card per package on a phone, two by two from 760px; from 1100px each row stands up as a column.
Because the layout is not `display: table`, the roles are written out: keep every `role` attribute exactly as shown.
Each value cell starts with a `.cell-label` (hidden on desktop, shown in the cards, `aria-hidden` because the column header already names it for a screen reader). A cell may hold a short `<ul>`.
Set `style="--rows:9"` to the number of cells in a row and `--cols` to the number of packages (default 4). `.is-popular` marks one row; put the `.popular` marker in its name cell.
The last cell (`.spec-act`) holds the package's button and, under it, one `.btn-quiet` link.

```html
<table class="spec" role="table" aria-label="Website packages compared" style="--rows:9">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" scope="col"><span class="sr-only">Package</span></th>
      <th role="columnheader" scope="col"><span class="sr-only">Price</span></th>
      <th role="columnheader" scope="col">What it is</th>
      <th role="columnheader" scope="col">Live in</th>
      <th role="columnheader" scope="col">Size</th>
      <th role="columnheader" scope="col">Design</th>
      <th role="columnheader" scope="col">Included</th>
      <th role="columnheader" scope="col">After launch</th>
      <th role="columnheader" scope="col"><span class="sr-only">Start</span></th>
    </tr>
  </thead>
  <tbody role="rowgroup">
    <tr role="row">
      <th role="rowheader" scope="row" class="spec-name">One-page</th>
      <td role="cell" class="spec-price">$1,000 <small>Or $500 down, then about $167/mo for 3 months</small></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">What it is</span>One polished page: who you are, what you offer and how to reach you.</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Live in</span>As little as 7 days</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Size</span>1 page</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Design</span>Custom design, 1 revision round</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Included</span><ul><li>Copy editing and polish (you supply the text)</li><li>Contact form</li><li>Mobile &amp; SEO basics</li></ul></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">After launch</span>14 days support</td>
      <td role="cell" class="spec-act"><a class="btn btn-block" href="/contact/?package=onepage">Start a one-page site</a><a class="btn btn-quiet" href="/contact/" data-booking>Or book the free call first</a></td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row" class="spec-name">Starter</th>
      <td role="cell" class="spec-price">$2,000 <small>Or $1,000 down, then about $333/mo for 3 months</small></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">What it is</span>An information website: who you are, what you offer and how to reach you.</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Live in</span>As little as <span class="nowrap">7–10 days</span></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Size</span>Up to 5 pages</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Design</span>Custom design, 1 revision round</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Included</span><ul><li>Copy editing and polish (you supply the text)</li><li>Contact form</li><li>Mobile &amp; SEO basics</li></ul></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">After launch</span>30 days support</td>
      <td role="cell" class="spec-act"><a class="btn btn-block" href="/checkout/?plan=starter-deposit">Pay 50% deposit —&nbsp;$1,000</a><a class="btn btn-quiet" href="/contact/?package=starter">Questions first? Send an enquiry</a></td>
    </tr>
    <tr role="row" class="is-popular">
      <th role="rowheader" scope="row" class="spec-name">Business <span class="popular">Most popular</span></th>
      <td role="cell" class="spec-price">$4,000 <small>Or $2,000 down, then about $667/mo for 3 months</small></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">What it is</span>The full marketing site most growing businesses need.</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Live in</span>2–4 weeks</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Size</span>Up to 10 pages</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Design</span>Up to 3 design rounds, plus a final tweaks round</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Included</span><ul><li>Copywriting: we draft, you edit</li><li>Blog or news section</li><li>Analytics &amp; tracking setup</li><li>Local SEO configuration</li></ul></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">After launch</span>90 days support</td>
      <td role="cell" class="spec-act"><a class="btn btn-primary btn-block" href="/checkout/?plan=business-deposit">Pay 50% deposit —&nbsp;$2,000</a><a class="btn btn-quiet" href="/contact/?package=business">Questions first? Send an enquiry</a></td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row" class="spec-name">Commerce</th>
      <td role="cell" class="spec-price">$8,000 <small>Or $4,000 down, then about $1,333/mo for 3 months</small></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">What it is</span>Sell online, with the operations side set up properly.</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Live in</span>4–6 weeks</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Size</span>Full store build</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Design</span>Up to 3 design rounds, plus a final tweaks round</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">Included</span><ul><li>Payments, shipping &amp; tax</li><li>Product import</li><li>Email &amp; abandoned cart flows</li><li>Team training session</li></ul></td>
      <td role="cell"><span class="cell-label" aria-hidden="true">After launch</span>6 months support</td>
      <td role="cell" class="spec-act"><a class="btn btn-block" href="/checkout/?plan=commerce-deposit">Pay 50% deposit —&nbsp;$4,000</a><a class="btn btn-quiet" href="/contact/?package=commerce">Questions first? Send an enquiry</a></td>
    </tr>
  </tbody>
</table>
```

### Data table

`.table` is the plain ruled table. With two or three short columns it stays a real table at every width.
With more, add `.table-stack`: under 760px each row becomes an entry, with the name on the first line and the price (the `.num` cell) beside it in the display face, then the labelled lines, then the button.
A stacked table needs the roles written out and a `.cell-label` at the start of each value cell, exactly as shown. The price cell and the button cell take no label: write the unit into the price ("$125/mo").
`.num` right-aligns a column of figures and sets them in the display face. Always give a table a `<caption>` (or `aria-label`).

```html
<table class="table table-stack" role="table">
  <caption>Care plans, by the month</caption>
  <thead role="rowgroup">
    <tr role="row"><th role="columnheader" scope="col">Plan</th><th role="columnheader" scope="col">Fits</th><th role="columnheader" scope="col">What you get</th><th role="columnheader" scope="col" class="num">Price</th><th role="columnheader" scope="col"><span class="sr-only">Start</span></th></tr>
  </thead>
  <tbody role="rowgroup">
    <tr role="row">
      <th role="rowheader" scope="row">Basic</th>
      <td role="cell"><span class="cell-label" aria-hidden="true">Fits</span>One-page and Starter sites</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">What you get</span><ul><li>1 small change a month, made within 5 business days</li><li>You keep your own domain and hosting renewals current</li></ul></td>
      <td role="cell" class="num">$125<small>/mo</small></td>
      <td role="cell"><a class="btn btn-sm" href="/contact/?package=care" aria-label="Request the Basic care plan">Request plan</a></td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row">Essential</th>
      <td role="cell"><span class="cell-label" aria-hidden="true">Fits</span>Brochure and marketing sites</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">What you get</span><ul><li>Changes made within 4 business days, up to 2 requests a month</li><li>You keep your own domain and hosting renewals current</li></ul></td>
      <td role="cell" class="num">$300<small>/mo</small></td>
      <td role="cell"><a class="btn btn-sm" href="/checkout/?plan=essential-care" aria-label="Start the Essential care plan">Start plan</a></td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row">Growth</th>
      <td role="cell"><span class="cell-label" aria-hidden="true">Fits</span>Sites with booking or lead flows</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">What you get</span><ul><li>Changes made within 2 business days, up to 5 requests a month</li><li>Your Netlify hosting, SSL and IONOS domain renewals looked after (domain and hosting costs billed at cost on top)</li></ul></td>
      <td role="cell" class="num">$600<small>/mo</small></td>
      <td role="cell"><a class="btn btn-sm" href="/checkout/?plan=growth-care" aria-label="Start the Growth care plan">Start plan</a></td>
    </tr>
    <tr role="row">
      <th role="rowheader" scope="row">Commerce</th>
      <td role="cell"><span class="cell-label" aria-hidden="true">Fits</span>Stores and integrations</td>
      <td role="cell"><span class="cell-label" aria-hidden="true">What you get</span><ul><li>Same-day response for urgent issues, unlimited small requests and a direct text line</li><li>Your Netlify hosting, SSL and IONOS domain renewals looked after (domain and hosting costs billed at cost on top)</li></ul></td>
      <td role="cell" class="num">$1,000<small>/mo</small></td>
      <td role="cell"><a class="btn btn-sm" href="/checkout/?plan=commerce-care" aria-label="Start the Commerce care plan">Start plan</a></td>
    </tr>
  </tbody>
</table>
```

### Ledger on a time sheet, with the large figure

The example week. `.sheet` is the paper frame with a perforated top edge; `.ledger` is the table inside it.
Each row shows its arithmetic, and a single-hue bar whose length is `style="--v:.7"` on the span (the row's share of the longest row, 0 to 1). The bar is decoration: `aria-hidden` goes on the `span`, never on the cell, so every row keeps four cells under four headers.
Under 760px each row becomes a small block, so the roles are written out: keep them.
`.bigfig` is the one very large number a page. The words around the number say what it is, and the `.note` that it is an example, not a measurement, sits directly under it. Never show the figure without that note.
The only numbers allowed here are the example week already on the site (30, 80, 56, 45 and 24 minutes; 235 minutes, about 4 hours; about 200 hours a year).

```html
<div class="split split-even">
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
        <tr role="row"><th role="rowheader" scope="row">Returning missed calls and voicemails</th><td role="cell">5 calls × 6 minutes</td><td role="cell" class="ledger-bar"><span aria-hidden="true" style="--v:.375"></span></td><td role="cell" class="num">30 min</td></tr>
        <tr role="row"><th role="rowheader" scope="row">Booking appointments by phone and text</th><td role="cell">10 bookings × 8 minutes</td><td role="cell" class="ledger-bar"><span aria-hidden="true" style="--v:1"></span></td><td role="cell" class="num">80 min</td></tr>
        <tr role="row"><th role="rowheader" scope="row">Chasing quotes that went quiet</th><td role="cell">8 quotes × 7 minutes</td><td role="cell" class="ledger-bar"><span aria-hidden="true" style="--v:.7"></span></td><td role="cell" class="num">56 min</td></tr>
        <tr role="row"><th role="rowheader" scope="row">Copying enquiries into a list or notebook</th><td role="cell">15 enquiries × 3 minutes</td><td role="cell" class="ledger-bar"><span aria-hidden="true" style="--v:.5625"></span></td><td role="cell" class="num">45 min</td></tr>
        <tr role="row"><th role="rowheader" scope="row">Asking for reviews</th><td role="cell">6 jobs × 4 minutes</td><td role="cell" class="ledger-bar"><span aria-hidden="true" style="--v:.3"></span></td><td role="cell" class="num">24 min</td></tr>
      </tbody>
      <tfoot role="rowgroup">
        <tr role="row"><th role="rowheader" scope="row">Total</th><td role="cell" colspan="3" class="num">235 min, about 4 hours</td></tr>
      </tfoot>
    </table>
  </div>
</div>
```

### Itemised receipt and checkout summary

The Launch bundle, or any "these things together cost this" sum: lines with dotted leaders, the separate total struck through, then the final total.
Every figure on it must already be a published price. The receipt is narrow on purpose (26rem). On a blue panel it carries `.on-paper`.
The checkout order summary is the same receipt with one `.receipt-total` line: the plan name in a `span`, the price in `b`. A long name wraps above the price. On `/checkout/` those two carry the ids the script fills (`checkout-plan-name`, `checkout-plan-price`), and the receipt itself keeps `id="checkout-plan"` and `hidden`.
Status lines that scripts write to (`#checkout-status`, `#success-status`) take class `status` and sit under the receipt, never inside it; the script adds `.error`.

```html
<div class="cluster">
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
  </div>
</div>
<p class="status" role="status">Loading secure checkout…</p>
```

### Payment plan drawn to scale

Shows how a price splits up. Each segment's width is its share of the total: `style="--w:50"` for half, `--w:16.67` for a sixth.
The deposit is the dark `.payplan-dep` block. Keep the amount in `<b>` and one or two words under it.
On a phone the deposit takes its own row and the months sit under it as equal parts, so each row is half the price and every label stays on one line at 13px with a 17px amount.
The bar is a picture: give the wrapper `role="img"` and an `aria-label` that says the same thing in a sentence, and say "about" wherever a monthly amount is rounded.
Add `.card` when it stands alone; leave it off inside a panel.

```html
<figure class="payplan card" role="img" aria-label="Two ways to pay for a Starter site: half to start and half at launch, or $1,000 down and then about $333 a month for 3 months">
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
</figure>
```

### Calculator

The consulting page's calculator. Its styles are already written, in `/assets/css/pages/consulting.css`: copy this markup, keep every id, and do not restyle it.
Inputs on the left: four `fieldset.calc-group` groups, each with a `legend.label` and two `.field`s. A number field with a unit is wrapped in `.field-unit`; the unit `span` goes before the input for $ and after it for %.
Keep `type="number"`, `inputmode`, `min`, `max`, `step` and each default `value` exactly as they are: the results printed in the HTML are what those defaults compute, and `calculator.js` rewrites them as the visitor types.
Results on the right as a `.receipt` with `aria-live="polite"`: `#r-month` is the total at price size; the disclaimer is a `.note` directly under it and never moves; `#r-year` and `#r-jobs` are the line under that; the four results are dot-leader lines; `#r-payback` is the note line; then one button. From 980px the receipt stays in view while the inputs scroll.
The calculator sits on a plain `.panel` in a paper section. It never sits on blue: the bundle is the consulting page's one blue panel.

```html
<form class="calc panel" id="growth-calc" novalidate onsubmit="return false">
  <div class="calc-inputs">
    <fieldset class="calc-group">
      <legend class="label">Your business</legend>
      <div class="field">
        <label for="c-job">Average value of a new job or customer ($)</label>
        <div class="field-unit"><span aria-hidden="true">$</span><input type="number" id="c-job" inputmode="decimal" min="0" step="1" value="400"></div>
      </div>
      <div class="field">
        <label for="c-rate">What an hour of your time is worth ($)</label>
        <div class="field-unit"><span aria-hidden="true">$</span><input type="number" id="c-rate" inputmode="decimal" min="0" step="1" value="50"></div>
      </div>
    </fieldset>
    <fieldset class="calc-group">
      <legend class="label">Missed calls</legend>
      <div class="field">
        <label for="c-calls">Calls you miss in a typical week</label>
        <input type="number" id="c-calls" inputmode="decimal" min="0" step="1" value="5">
      </div>
      <div class="field">
        <label for="c-callwin">Share of those callers an instant text would win back (%)</label>
        <div class="field-unit"><input type="number" id="c-callwin" inputmode="decimal" min="0" max="100" step="1" value="20"><span aria-hidden="true">%</span></div>
      </div>
    </fieldset>
    <fieldset class="calc-group">
      <legend class="label">Follow-up</legend>
      <div class="field">
        <label for="c-quotes">Quotes or enquiries that go cold each month</label>
        <input type="number" id="c-quotes" inputmode="decimal" min="0" step="1" value="4">
      </div>
      <div class="field">
        <label for="c-quotewin">Share of those a timely follow-up would win (%)</label>
        <div class="field-unit"><input type="number" id="c-quotewin" inputmode="decimal" min="0" max="100" step="1" value="25"><span aria-hidden="true">%</span></div>
      </div>
    </fieldset>
    <fieldset class="calc-group">
      <legend class="label">Your time</legend>
      <div class="field">
        <label for="c-hours">Hours a week on callbacks, booking, chasing, email and invoices</label>
        <input type="number" id="c-hours" inputmode="decimal" min="0" step="0.5" value="5">
      </div>
      <div class="field">
        <label for="c-auto">Share of that time automation takes over (%)</label>
        <div class="field-unit"><input type="number" id="c-auto" inputmode="decimal" min="0" max="100" step="1" value="50"><span aria-hidden="true">%</span></div>
      </div>
    </fieldset>
  </div>

  <div class="receipt" aria-live="polite">
    <p class="receipt-head"><span>Your estimate</span><span>Your numbers</span></p>
    <p class="receipt-total"><span>Estimated extra revenue</span><b><span id="r-month">$2,133</span><small>/month</small></b></p>
    <p class="note"><span class="flag">Estimate</span>An estimate from the numbers you enter, not a promise or a guarantee of results. Real results depend on your market, your prices and how quickly you answer the leads it brings in. Software and texting fees are paid to the provider and are extra.</p>
    <p class="receipt-note"><span id="r-year">$25,600</span> a year, from about <span id="r-jobs">5.3</span> extra jobs a month</p>
    <ul class="receipt-lines">
      <li><span>From missed calls won back</span><span class="dots" aria-hidden="true"></span><b id="r-calls">$1,733/mo</b></li>
      <li><span>From quotes followed up</span><span class="dots" aria-hidden="true"></span><b id="r-quotes">$400/mo</b></li>
      <li><span>Time back</span><span class="dots" aria-hidden="true"></span><b id="r-hours">11 hours/mo</b></li>
      <li><span>Value of that time</span><span class="dots" aria-hidden="true"></span><b id="r-timeval">$6,500/yr</b></li>
    </ul>
    <p class="receipt-note" id="r-payback">At these numbers, the $750 missed-call setup would pay for itself in about 2 weeks.</p>
    <a class="btn btn-primary btn-block" href="/contact/?package=audit">Check my real numbers in a Growth Audit</a>
  </div>
</form>
```

### Step list and job ticket

`.steps` is the numbered process: a brick numeral, a title, a sentence or two. Use it on its own for any ordered process (process, consulting, contact, `/start/`). The numeral lines up with the first line of the title, and the list is capped at 46rem: put it beside its heading in a `.split`.
Wrap it in `.ticket` to make the job ticket (home and process pages). On desktop the ticket prints a small brick tick beside each step; they are printed marks, not checkboxes, and nothing on the ticket is pressable.
A `.stamp` inside the ticket pins itself to the bottom right corner; it counts as the page's one stamp.

```html
<ol class="steps">
  <li>
    <span class="steps-no" aria-hidden="true">01</span>
    <div><h3>Free check</h3>
    <p>We look at your website, Google profile and reviews, and email you the top three fixes.</p></div>
  </li>
  <li>
    <span class="steps-no" aria-hidden="true">02</span>
    <div><h3>Growth Audit</h3>
    <p>A 60-minute session and a written plan, ranked by impact, with a fixed price on each step.</p></div>
  </li>
  <li>
    <span class="steps-no" aria-hidden="true">03</span>
    <div><h3>Setup</h3>
    <p>We build what you choose on your own accounts and test it with you. Most setups are live within 2 weeks.</p></div>
  </li>
</ol>

<div class="ticket">
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
</div>
```

### Appointment card, business card, booking box

The appointment card states the terms of the free call as a list. It is decorative (`aria-hidden`) because the paragraph beside it says the same; it always carries `.on-paper` so it stays cream at night.
The business card holds the founder's real contact details. Both sit straight unless one of them is the page's single `.tilt`.
The booking box on `/contact/` is a plain `.card.stack` with the class `booking-only` and the `hidden` attribute: `main.js` shows it when a booking link is set, so it never shows a dead button.

```html
<div class="cluster">
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
      <li><a href="tel:+12252550837"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>(225) 255-0837</a></li>
      <li><a href="mailto:knightwebstudio1@gmail.com"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>knightwebstudio1@gmail.com</a></li>
      <li><span><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Baton Rouge, Louisiana</span></li>
    </ul>
  </div>
</div>

<div class="card stack booking-only" hidden>
  <h2 class="h4">Rather talk it through first?</h2>
  <p>Skip the form and pick a time.</p>
  <a class="btn" href="/contact/" data-booking>Book a 30-minute call</a>
</div>
```

### Figure with a numbered legend: the phone

How we show automation instead of describing it. A mock on top, numbered markers on its parts, and an ordered list in the caption that explains each number.
The markers are real text (`<b class="fig-n">1</b>`) inside the part they point at; the legend numbers itself. A marker pins to the top left corner of a `.bubble`, a calendar slot (`.cal-day i`), an enquiry row (`.leads li`) or the `.notice`; in a calendar log line (`.cal-log li`) it takes the tick's place at the start of the line.
Honest-mock rules: the business is always "[your business]"; messages use everyday trade wording with no names, no star ratings and no figures that are not on the site; the caption ends with the service, its fixed price and "An illustration, not a real conversation." For a mock that is not a conversation, end with "…not a real booking.", "…not a real list." or "…not a real screen."
Nothing in a mock is blue: the business's bubble is ink, the caller's is sand, a new booking is brick. Blue is for things a visitor can press.
A link inside a bubble is `<span class="bubble-link">`. The phone is 15rem wide; set `--phone-w` on a wrapper to change it.
`.bubble-typing` hops three times when it is seen and then rests. Add `.seq` with `style="--n:1"` (2, 3…) to make parts arrive in order when a `.reveal` parent scrolls in.

```html
<figure class="fig">
  <div class="fig-art">
    <div class="phone">
      <p class="phone-label">Example: what your caller sees</p>
      <div class="phone-frame">
        <div class="phone-bar">
          <span class="phone-avatar" aria-hidden="true"></span>
          <span class="phone-who">[your business]<small>Text message</small></span>
        </div>
        <ul class="thread">
          <li class="thread-note thread-missed"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/><path d="m15 4 5 5m0-5-5 5"/></svg>Missed call</li>
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
</figure>

<figure class="fig">
  <div class="fig-art">
    <div class="cal" role="img" aria-label="Example week on a calendar: a new online booking drops into a free slot on Thursday">
      <p class="cal-head"><b>Your calendar</b><span>This week</span></p>
      <div class="cal-grid" aria-hidden="true">
        <div class="cal-day"><span>Mon</span><i class="busy"></i><i class="busy"></i><i></i><i class="busy"></i></div>
        <div class="cal-day"><span>Tue</span><i class="busy"></i><i></i><i class="busy"></i><i class="busy"></i></div>
        <div class="cal-day"><span>Wed</span><i></i><i class="busy"></i><i class="busy"></i><i></i></div>
        <div class="cal-day cal-today"><span>Thu</span><i class="busy"></i><i class="new"><b class="fig-n">1</b>Booked online</i><i></i><i class="busy"></i></div>
        <div class="cal-day"><span>Fri</span><i class="busy"></i><i class="busy"></i><i></i><i></i></div>
      </div>
      <ul class="cal-log" aria-hidden="true">
        <li><b class="fig-n">2</b>Confirmation sent</li>
        <li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Reminder set for the day before</li>
      </ul>
    </div>
  </div>
  <figcaption>
    <ol class="fig-legend">
      <li>A customer picks a time on your website or Google profile, day or night. It goes straight onto your calendar, with no double bookings.</li>
      <li>They get a confirmation right away and a reminder the day before.</li>
    </ol>
    <p class="fig-credit">Online booking &amp; reminders, $750 to set up. An illustration, not a real booking.</p>
  </figcaption>
</figure>
```

### Browser mock, vignette, and what goes in one

`.browser` frames a real screenshot of a project (with `alt`, `width`, `height`), or a drawn page.
`.vig` is the frame for a small drawn scene that shows one step; it always carries a `.flag` reading "Example" (the build tool refuses a vignette without one), and leaves room at its top for that flag. Keep what is inside generic.
Three ready-made things go in a vignette or a figure, besides the phone thread: `.notice` (a lock-screen notification), `.cal` (a week calendar with one new booking) and `.leads` (a list of enquiries with a status pill each). Give each a `role="img"` and an `aria-label` that says what it shows, and hide its inner parts with `aria-hidden`.

```html
<div class="grid grid-2">
  <div class="browser">
    <div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>smilyssoftwash.com</span></div>
    <img src="/assets/img/work-smilyssoftwash.jpg" alt="Smilys Softwash — before and after of a soft-washed roof and house exterior" width="1200" height="600" loading="lazy" decoding="async">
  </div>
  <div class="vig">
    <span class="flag">Example</span>
    <ul class="thread">
      <li class="thread-note thread-done"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Job marked done</li>
      <li class="bubble bubble-biz">Thanks for choosing [your business]. If you have a minute, a Google review would mean a lot to us.</li>
      <li class="thread-note">Sent on its own</li>
    </ul>
  </div>
</div>

<div class="grid grid-3">
  <div class="vig">
    <span class="flag">Example</span>
    <div class="notice" role="img" aria-label="Example notification on your phone: a new reply from a missed caller, with their number saved">
      <p class="notice-top" aria-hidden="true">Your phone<span class="notice-when">now</span></p>
      <p class="notice-title" aria-hidden="true">New reply from a missed caller</p>
      <p class="notice-body" aria-hidden="true">“The kitchen sink is leaking under the cabinet…”</p>
      <p class="notice-meta" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Number saved</p>
    </div>
  </div>
  <div class="vig">
    <span class="flag">Example</span>
    <div class="cal" role="img" aria-label="Example week on a calendar: a new online booking drops into a free slot on Thursday">
      <p class="cal-head"><b>Your calendar</b><span>This week</span></p>
      <div class="cal-grid" aria-hidden="true">
        <div class="cal-day"><span>Mon</span><i class="busy"></i><i class="busy"></i><i></i><i class="busy"></i></div>
        <div class="cal-day"><span>Tue</span><i class="busy"></i><i></i><i class="busy"></i><i class="busy"></i></div>
        <div class="cal-day"><span>Wed</span><i></i><i class="busy"></i><i class="busy"></i><i></i></div>
        <div class="cal-day cal-today"><span>Thu</span><i class="busy"></i><i class="new">Booked online</i><i></i><i class="busy"></i></div>
        <div class="cal-day"><span>Fri</span><i class="busy"></i><i class="busy"></i><i></i><i></i></div>
      </div>
      <ul class="cal-log" aria-hidden="true">
        <li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Confirmation sent</li>
        <li><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Reminder set for the day before</li>
      </ul>
    </div>
  </div>
  <div class="vig">
    <span class="flag">Example</span>
    <div class="leads" role="img" aria-label="Example list of enquiries from a website form, a missed call and Google, each showing whether a follow-up has gone out">
      <p class="cal-head"><b>Enquiries</b><span>One list</span></p>
      <ul aria-hidden="true">
        <li><span class="lead-src">Website form</span><span class="lead-what">New roof estimate</span><span class="pill pill-new">New</span></li>
        <li><span class="lead-src">Missed call</span><span class="lead-what">Leaking kitchen sink</span><span class="pill">Quote sent</span></li>
        <li><span class="lead-src">Google</span><span class="lead-what">Fence repair quote</span><span class="pill pill-go">Follow-up sent · 2 days</span></li>
      </ul>
    </div>
  </div>
</div>
```

### The street scene

The shop front belongs to the home page hero. It may be reused small on `/start/` (in the page head's aside, as shown) and on the 404 page (`scene-notfound`, where the sign reads PAGE NOT FOUND, inside the 404 block). No other page gets a scene, and no new scenes are drawn: the build tool refuses a scene marker anywhere else.
It is generated by `tools/art` from the marker shown, and turns from day to night with the theme on its own.

```html
<div class="page-head-aside">
  <!-- art:scene-street --><!-- /art:scene-street -->
</div>
```

### Project print and case row

`.print` is a project as a print in a cream mat: the whole print is one link to the live site (`target="_blank" rel="noopener"`).
`.case` is the full row for the work page: the print (or a `.browser`) beside the write-up and a short `dl` of facts. Add `.case-flip` to every second row to put the picture on the right.
In a case row the project's name is the `h2` of the write-up; the name inside the print is a `<p class="h3">`, so the outline does not read each name twice or skip a level. On the home page, where three prints stand alone under an `h2`, the name in the print is an `<h3>`.
Only the three real projects. Describe what was built; never claim a result.

```html
<article class="case">
  <a class="print" href="https://smilyssoftwash.com" target="_blank" rel="noopener">
    <div class="print-img"><img src="/assets/img/work-smilyssoftwash.jpg" alt="Smilys Softwash — before and after of a soft-washed roof and house exterior" width="1200" height="600" loading="lazy" decoding="async"></div>
    <div class="print-cap">
      <div class="print-name"><p class="h3">Smilys Softwash</p><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></div>
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
</article>
```

### FAQ list

Plain `details` and `summary`, so it opens without any script. Each question is a 56px target with a visible focus ring; it turns blue under the pointer and the plus turns when open.
FAQ answers keep their wording exactly: they mirror the structured data in the page head.

```html
<div class="faq">
  <details class="faq-item" open>
    <summary>Do I own the website?</summary>
    <div class="faq-body"><p>Completely. The domain is registered in your name, the code and design are yours on final payment, and you can move to another provider at any time. We don't hold anything hostage.</p></div>
  </details>
  <details class="faq-item">
    <summary>How long does a website take?</summary>
    <div class="faq-body"><p>A one-page site can be live in as little as 7 days, and an information website in as little as 7–10 days. A full business site runs 2–4 weeks, and stores take 4–6. The biggest variable is how quickly content and photos come back to us — we'll tell you exactly what we need on day one.</p></div>
  </details>
</div>
```

### Form fields

Label above, 52px field, 17px text. Every field has a real `<label for>`. Help text is `.help`; the error line is `<p class="error" id="FIELD-error" role="alert">` and the field points at it with `aria-describedby`.
`main.js` adds `.invalid` and `aria-invalid="true"` to a bad field and writes the message into its error line. The error is a sentence that says what to fix, in bold brick, and the field's outline thickens and stays brick while it has focus.
A field's outline darkens under the pointer and shows a 3px ring on focus; a `disabled` field is dimmed.
A checkbox group is a `fieldset.field` with a `legend` and `.chips`; each chip is a `label.chip` holding the checkbox and a `span`. `.field-row` sets two fields side by side from 600px.
The status line is `.form-status`; `main.js` adds `.ok` or `.error`. The captcha sits in `.captcha-wrap`, and the spam trap keeps its class `hp` (it is moved off screen). On `/contact/` keep the form `action`, the hidden inputs, every `name`, the option values, the checkbox values and all ids exactly as they are.
Forms sit on paper or on a card, never on blue.

```html
<form class="card" action="#" method="post" novalidate onsubmit="return false">
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
</form>
```

### Closing band

The last section of a page before the footer: one sentence, one paragraph, the booking button and the enquiry button, with the appointment card beside them from 980px.
Always `class="cta-band on-blue"`. Its scalloped top edge rises over the section above, whatever colour that is, and its foot runs under the footer skyline.
Legal pages, checkout and the 404 page do not get one.

```html
<section class="cta-band on-blue">
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
</section>
```

### The 404 block

The whole content of `404.html`: the street scene with its PAGE NOT FOUND sign, the big brick 404, the page's one `h1`, one sentence, two buttons.
Its few rules are already written, in `/assets/css/pages/notfound.css`. The 404 page loads no script, so nothing in it may need one: no `reveal`, no `seq` (the build tool refuses them there).

```html
<div class="container nf">
  <!-- art:scene-notfound --><!-- /art:scene-notfound -->
  <p class="nf-code display" aria-hidden="true">404</p>
  <h1 class="h2">This page has moved on</h1>
  <p>The link is broken or the page no longer exists. Head back to the homepage, or tell us what you were looking for and we'll point you at it.</p>
  <div class="btn-row">
    <a class="btn btn-primary" href="/">Back to homepage</a>
    <a class="btn" href="/contact/">Get in touch</a>
  </div>
</div>
```

### Reference inner page

How the parts compose. This is the skeleton of an inner page: the page head, the contents list, a split section on paper, a sand section, the closing band.
The finished reference is `/pricing/`: it is built from shared parts only. Open it at 390 and 1440 in both themes before you design (screenshots in `$R/shots/reference/`), and match its rhythm, heading sizes and density.
The home page is **not** a model until its own pass is done: its hero, its three tilted prints and its length are being reworked.

```html
<main id="main">
  <section class="page-head">            <!-- eyebrow, h1, lede, .btn-row, .price-strip -->
    <div class="container"> ... </div>
  </section>
  <section class="section section-first"> <!-- the "On this page" list, then the first block -->
    <div class="container"> <nav class="toc"> ... </nav> ... </div>
  </section>
  <section class="section" id="...">      <!-- paper: a .split, its heading beside a price list -->
    <div class="container split"> <header class="section-head"> ... </header> <ul class="pricelist"> ... </ul> </div>
  </section>
  <section class="section section-sand" id="..."> <!-- sand: a different structure from the band before -->
    <div class="container split"> <header class="section-head"> ... </header> <ol class="steps"> ... </ol> </div>
  </section>
  <section class="cta-band on-blue"> ... </section>
</main>
```

### Site chrome (for reference only)

Supplied by the build tool; do not copy it into your main file.
- **Top strip** (`.topbar.on-ink`): "Based in Baton Rouge, Louisiana" and the tap-to-call number, as real text
  at 15px ("Baton Rouge" alone under 380px).
- **Header** (`.site-header`): crest and name, the menu (eight links), the theme button and "Book a free call"
  (a booking button, like the phone bar's). Sticky, solid paper. From 1280px the phone number fades into the
  header once the top strip has scrolled away, so it is never printed twice. Below 1100px the menu is a full
  sheet that starts under the header: its list scrolls on short screens, focus moves to its first link, and it
  ends with "Start your project", "Call (225) 255-0837" and the email.
- **Sticky phone bar** (`#mobile-cta`): "Call" beside "Free 30-min call · no pitch". Shows after the first
  screen, hides over the footer. Not on contact, legal or checkout pages.
- **Footer** (`.site-footer.on-ink`): the Baton Rouge skyline (its windows and bridge lamps are lit at night),
  four link columns, the legal line. Column titles are `<p class="footer-title">`, not headings, so the footer
  never puts an `h3` under a page that has no `h2`.
- `/start/` has the top strip, crest, theme button and one "Book a free call" button: no menu, on purpose.
- `404.html` has the top strip and the crest only. It loads no script.

Because the phone bar covers the bottom 70px of a phone screen once it shows, never pin your own
element to the bottom of the viewport. Keyboard focus is kept clear of it for you (`scroll-padding-bottom`).

## 9. The props rule

Objects are the point of this design, and too many of them turn it cute. The build tool counts them and
refuses a page that breaks the first four lines. Per page:

- **At most one tilted object** (`.tilt` on one card, print or receipt). Everything else sits straight.
- **At most one stamp**, counting the round seal.
- **No illustrated scene.** The street scene belongs to the home page; it may be reused small on
  `/start/` and on the 404 page (`scene-notfound`). No page draws a new scene.
- FAQ, privacy, terms and both checkout pages get **no props at all**: no stamp, no tilt, no seal, no scene.
- One "object" per section at most. A ticket, a receipt and a business card in one section is two too many.
- Nothing decorative may look pressable. No empty checkboxes, no fake buttons inside mocks, no blue on things that do nothing.

Art markers (leave them empty; the build tool fills them): `<!-- art:seal --><!-- /art:seal -->`,
`crest-card`, `scene-street`, `scene-notfound`, `scene-bench`. The crest, seal and scenes are generated by
`tools/art/emblems.py`; the footer skyline is inline SVG in the footer partial. Retired: the chess
pieces, the full crest and the drifting shards. Do not bring them back.

## 10. Motion

- Transform and opacity only. No animated colour, shadow, width, height or stroke. The one extra is the
  `--fade` pattern, which also flips `visibility` at the end of a fade so that hidden things leave the tab order.
- Every duration and delay is a token or a multiple of one (`calc(var(--t-slow) * 2)`). No raw seconds.
- Everything plays once. Nothing loops for ever: the typing dots hop three times, when they are seen.
- `.tilt` and `.stamp` are turned with `rotate`, not `transform`, so `reveal` and hover lifts do not straighten them.
- If `main.js` has not started within four seconds, every `reveal` block is shown anyway.
- `reveal` rises 12px and fades in over half a second, with at most 120ms of stagger across a row.
  It only applies when scripts run (`html.js`); without them everything is simply there.
- `.seq` with `style="--n:1"`, `--n:2`... inside a `.reveal` makes the parts of a mock arrive in order, 70ms apart. Keep to four steps.
- Things you press move: buttons lift 2px on hover and sink 1px on press. Hover effects go inside `@media (hover: hover)`.
- A page-only animation is allowed if it is one-shot, under 0.6s, uses the duration and easing tokens,
  and its end state is the resting state (`animation-fill-mode: both` with only a `from` or mid keyframe).
  `prefers-reduced-motion` already turns every animation and transition off site-wide.

## 11. Honest mocks and honest numbers

A mock is a drawing of the product, and has to read as one.

- The business is always **[your business]** or **Your Business**. Never a made-up company, never a person's name.
- Every vignette carries a `.flag` reading **Example**. A figure's caption ends with the service, its fixed
  price and "An illustration, not a real conversation." For example:
  *Missed-call text-back, $750 to set up. An illustration, not a real conversation.*
- Messages use everyday trade wording ("The kitchen sink is leaking under the cabinet."). No star ratings,
  no reviews, no testimonials, no client logos, no counts of clients or results.
- The only numbers allowed in mocks and worked examples are the ones already on the site: the example
  week (5 calls × 6 minutes and so on; 235 minutes, about 4 hours; about 200 hours a year) and the
  calculator defaults. `--show-new-numbers` on the checker lists anything new.
- Every time or money estimate keeps its qualifier right beside it, in a `.note` or the sentence itself:
  "example", "estimate", "not a guarantee". Never move the qualifier to a footnote.
- Every price is fixed and written in full. Never "from", "starting at", "as low as", a range or
  "ballpark". Every price that is on a page today stays on that page.
- The three real projects are Smilys Softwash, Risen Health and Corbel Books. Say what was built. Claim no result.
- FAQ answers, the privacy page and the terms page keep their wording exactly.
- Never write the words listed in BRIEF.md section 4 (the owner's customers react badly to them), in
  copy, alt text, class names, comments or file names.

## 12. Phone rules

Most visitors are on a phone. Design the 360 to 430px view first; it is not the desktop page shrunk.

- Body text is 17px. Nothing a customer must read is under 15px. Uppercase labels are 12px at the smallest.
- Primary buttons are 52 to 56px tall and full width (`.btn-row` does this). Every target is at least 44px.
- No sideways scrolling, and no sideways scrollers: no chip rows that slide. Lists wrap or stack.
- The first screen of a commercial page shows what it is, a price and one button: that is what the commercial
  page head gives you.
- Tables with more than three columns stack into labelled entries (`.table-stack`, `.spec`).
- Keep pages short: cut before you shrink. The home page target is 12,500px at 390px wide.
- Test at 360, 390 and 820, and run `widths.js` for every 20px from 360 to 1920.

## 13. Accessibility

- One `<h1>`, no skipped levels, landmarks (`main`, `nav` with `aria-label`, `footer`).
- Every image has `alt`, `width` and `height`; below the first screen add `loading="lazy" decoding="async"`.
- Decorative drawings and mocks are `aria-hidden="true"`, or `role="img"` with an `aria-label` that says
  what they show. If a mock repeats what the text says, hide it; if it adds something, label it.
- Anything a person reads is real text in the page, never CSS `content`.
- Focus rings are built in (3px, at least 3:1 everywhere, gold on blue and on the footer). Never remove an outline.
- Every pressable thing has a hover and a pressed state built in. If you make a new pressable thing, give it both.
- Contrast is AA in both themes when you use the tokens as described. Run `contrast.js` anyway.
- A table that changes layout on a phone keeps its `role` attributes, exactly as in the snippets.
- Links that open a new tab carry `rel="noopener"`. Internal links are root-absolute (`/pricing/`).
- The page must read correctly with scripts off: `details` for disclosure, real links, nothing hidden until a script shows it.

## 14. Do and do not (from the judges)

Do:
- Put the city, a tap-to-call number, a plain headline, one booking button and a price on the first phone screen.
- Show automation with one mock and a numbered legend rather than describing it.
- Use the spec table for packages and a real table for care plans.
- Give every long commercial page an "On this page" list with prices.
- State terms as short lists ("Cost: Free. Length: 30 minutes. Sales pitch: None.").
- Keep each section to one idea and one object. Say a thing once.

Do not:
- Let objects overlap text or each other (the phone over a title, a stamp on a phone, a pill on a sign).
- Stack four rounded cards with tick lists where a table would line the facts up.
- Tell the same story twice on one page (a timeline, then a table of the same steps).
- Tilt more than one thing, or use more than one stamp.
- Draw anything that looks tappable and is not.
- Leave a late card still faded when the reader reaches it (do not add your own stagger).
- Use type under 15px for anything but a label, or labels under 12px.
- Clip a row of chips at the screen edge.
- Add a breakpoint, a hex colour, an inline style or `!important`.
- Write like software: no "solutions", "leverage", "seamless", "unlock". Short sentences. Plain words.
