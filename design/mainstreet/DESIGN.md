# Main Street — design direction for knightwebstudio.com

## Concept

**The well-run shop.** Everything on the page is an object you would find in a
good local business: the painted sign, the price board, the job ticket, the time
sheet, the appointment card, the phone on the workbench. It is drawn on warm
paper in ink, sign-painter's blue and Red Stick brick, so a roofer on a phone
reads it as local, plain-spoken and carefully made rather than as tech.

Light first ("open for business"). The dark theme is the same street after
closing: the sky goes navy, the shop windows and the street lamp light up, and the
paper turns to night ink. Both are finished designs.

Built on two pages: `/` and `/pricing/`. The shared header and footer are already
copied into every page that used the old ones (`work/sync-chrome.py`).

## Tokens

All tokens sit at the top of `site/assets/css/styles.css` (`:root` for day,
`[data-theme="dark"]` for night).

### Colour

| Token | Day | Night | Used for |
| --- | --- | --- | --- |
| `--paper` | `#F6F0E4` | `#131722` | Page |
| `--paper-2` | `#EEE6D5` | `#191E2C` | Sand bands (`.section-sand`) |
| `--paper-3` | `#E4D9C3` | `#2A3249` | Wells, calendar blocks, the customer's text bubble |
| `--card` | `#FFFCF5` | `#1D2333` | Raised surfaces |
| `--ink` | `#1A2238` | `#F3ECDD` | Headings, strong lines (13.9:1 / 15.2:1 on paper) |
| `--ink-2` | `#454C61` | `#C3BEB2` | Body copy (7.5:1 / 9.7:1) |
| `--ink-3` | `#5F6678` | `#9E9A90` | Captions, meta (4.6:1 worst case, on sand) |
| `--line`, `--line-2`, `--ctl` | `#DED3BD` `#C8BBA0` `#85785C` | `#2A3144` `#3A4259` `#6C7692` | Hairlines, dashes, control outlines |
| `--blue` | `#2C46C4` | `#9DB0FF` | Brand: buttons, links, ticks (6.7:1 / 8.6:1) |
| `--blue-deep`, `--blue-tint`, `--on-blue` | `#1E3299` `#E1E7F9` `#FFFBF2` | `#B9C7FF` `#232C4A` `#0E1322` | Hover, tint surfaces, text on blue |
| `--brick` | `#A83C26` | `#F0907A` | The one secondary: eyebrows, stamps, numerals, the missed call (5.5:1 / 7.7:1) |
| `--brick-tint` | `#F5DDD2` | `#3A2320` | Missed-call and "New" pills |
| `--gold` | `#F0C369` | same | Gold leaf. Only ever on blue or on the footer (5.9:1 on `--board`) |
| `--board`, `--board-2` | `#24389F` `#1B2C84` | `#1B2A78` `#14205E` | The price board, the bundle, the closing band |
| `--footer` | `#161B2C` | `#0C0F18` | Footer and the skyline |
| `--focus` | `#2C46C4` | `#F0C369` | Focus ring (gold on any blue or dark surface) |

Brick is a deliberate local nod (Baton Rouge is "red stick") and it doubles as
the colour of a missed call. Rule: blue is for things you can press, brick is for
things you should notice, gold appears only on blue.

The drawings have their own `--il-*` palette (sky, brick, trim, glass, awning,
van, leaf, lamp…) with day and night values, so every illustration changes with
the theme without a second SVG.

### Shape, depth, space

- Radius: `--r-sm 8`, `--r-md 14`, `--r-lg 22`, `--r-xl 32`, `--r-pill`.
- Shadow: `--shadow-1` resting card, `--shadow-2` lifted card, `--shadow-3`
  objects that sit on top (phone, board, business card). Warm brown in the day,
  black at night. `--press` is the 2px bottom edge that makes buttons feel
  pressable.
- Space: 4px base, `--s-1`…`--s-9` (4, 8, 12, 16, 24, 32, 48, 64, 96).
  Section rhythm is `--sec: clamp(64px, 9vw, 128px)`.

### Motion

`--ease: cubic-bezier(.2,.7,.2,1)`, `--spring: cubic-bezier(.3,1.4,.5,1)`,
`--t-fast .16s`, `--t .28s`, `--t-slow .6s`.

## Type

Two families, two files, 82 KB in total (the old pair was 156 KB). Both SIL OFL,
self-hosted, Latin subset, variable, `font-display: swap`, both preloaded.
Metric-matched fallback faces (`Fraunces Fallback` on Georgia, `Figtree Fallback`
on Arial) keep the swap from moving the page.

- **Fraunces** (`fraunces-soft.woff2`, 62 KB; axes `wght` 100–900 and `SOFT`
  0–100). Display. Always set with `font-variation-settings: "SOFT" 100` at
  weight 600: a sturdy, soft old-style serif in the Cooper tradition, the voice
  of a hand-painted shop sign. Used for headings, every price, numerals and the
  brand name. No italic is loaded; emphasis is the brick brush stroke (`.mark`).
- **Figtree** (`figtree.woff2`, 20 KB; `wght` 300–900). Text and interface.
  Friendly, plain, very legible at 15–17px. Labels are Figtree 800, uppercase,
  tracked .12–.14em.

| Token | Size | Use |
| --- | --- | --- |
| `--fs-h1` | 38→60px on phones (10.6vw), 52→76px from 980px | Page headline, line-height 1, tracking -.022em |
| `--fs-h2` | 30→50px | Section titles, line-height 1.06 |
| `--fs-h3` | 21→25px | Card titles |
| `--fs-lede` | 18→21px | Intros, measure capped at 28–36em |
| `--fs-body` | 17px / 1.6 | Body. Larger than usual on purpose: the reader is on a job site |
| `--fs-sm`, `--fs-xs`, `--fs-cap` | 15, 13, 12px | Card copy, labels, captions |

Headline rules: one idea per line where the width allows (`.l` spans become
blocks from 600px), `text-wrap: balance` everywhere else, and at most one
`.mark` per page. Body measure stays between 45 and 75 characters.

## Grid and spacing

- `.container`: `min(100% - 2 × gutter, 1240px)`, gutter `clamp(20px, 5vw, 48px)`.
- Breakpoints: 600 (headline lines, button rows), 760 (two-column cards), 900/980
  (split sections, hero side by side), 1100 (desktop menu, four-up grids).
  Everything below 1100px uses the phone menu and the sticky bar.
- Sections alternate between `--paper` and `.section-sand`; the two blue objects
  (board, closing band) are the only full-colour moments. No two neighbouring
  sections share a structure: split hero, banner card + two cards, rail timeline,
  staggered prints, ticket beside a sticky heading, board, note + card, band.
- Headers are left-aligned. `.section-head-split` puts the title left and the
  intro right from 900px; `.section-head-row` is the compact one-line variant
  used above dense grids.
- Touch targets are 44px or more; primary buttons are 50–56px tall.

## Component inventory

Shared
- `.topbar` plain-text location strip above the header (no links, so the skip
  link stays the first keyboard stop); `.header-tel` tap-to-call, part of the
  header but drawn over the right end of the strip
- `.site-header#site-header`, `.brand`, `.nav#nav`, `.nav-links`, `.nav-foot`,
  `.icon-btn#theme-toggle`, `.nav-toggle#nav-toggle`, `.header-cta`,
  `.scroll-progress#scroll-progress` (thin brick reading line)
- `.btn` + `.btn-primary`, `.btn-ghost`, `.btn-light`, `.btn-onblue`, `.btn-lg`,
  `.btn-sm`, `.btn-block`; `.more-link`; `.icon-btn`; `.ico` (line icons)
- `.eyebrow`, `.mark` (brush underline), `.lede`, `.fine`, `.h2`, `.h3`
- `.ticks` tick list; `.tag` price tag with punched hole; `.stamp` rubber stamp;
  `.seal` round "Fixed prices" seal (SVG); `.awning` striped, scalloped awning;
  `.pill` (+ `.pill-new`, `.pill-go`)
- `.section`, `.section-sand`, `.section-tight`, `.section-first`,
  `.section-head` (+ `-split`, `-row`), `.section-sub`, `.section-more`
- `.cta-band` closing band with scalloped top edge, `.appt` appointment card
- `.site-footer`, `.footer-skyline` (Capitol tower, downtown, the river bridge),
  `.footer-grid`, `.footer-col`, `.footer-bottom`
- `.mobile-cta#mobile-cta` sticky bar: Call + book the free call

Home
- `.hero`, `.hero-grid`, `.hero-copy`, `.hero-cta`, `.price-strip`, `.hero-art`,
  `.hero-scene` + `.scene-street` (shop front, van, skyline), `.hero-phone`,
  `.hero-seal`, `.points` (five facts on a shelf)
- `.phone`, `.phone-frame`, `.phone-bar`, `.thread`, `.thread-note`,
  `.bubble-biz`, `.bubble-cust`, `.bubble-typing` — the text-message mock
- `.svc-grid`, `.svc`, `.svc-feature`, `.svc-art`, `.mock-browser`,
  `.mock-mobile` (a little website drawn in CSS)
- `.route`, `.stop`, `.stop-rail`, `.stop-pin`, `.stop-copy`, `.stop-tag`,
  `.stop-art` — the story timeline; `.vig` vignette frame with `.vig-flag`
  ("Example"); `.scene-bench` (phone on the workbench), `.notice` (lock-screen
  notification), `.cal` (week calendar), `.leads` (enquiry list), `.thread-open`
- `.tally`, `.sheet`, `.sheet-table` — the example week as a time sheet
- `.prints`, `.print` — the three projects as prints laid on the counter
- `.process-grid`, `.ticket`, `.ticket-steps`, `.ticket-no`, `.ticket-stamp`
- `.board`, `.board-tiers`, `.tier`, `.board-extras` — the price board
- `.who`, `.who-note`, `.places`, `.bizcard`

Pricing
- `.page-head`, `.page-head-grid`, `.page-seal`, `.jump` (in-page chips)
- `.plans`, `.plan`, `.plan-featured` (with `.awning` and `.plan-flag`),
  `.plan-price`, `.plan-split`, `.plan-note`, `.plan-ask`
- `.pay`, `.pay-art`, `.pay-bar` — how the two ways to pay split up
- `.split`, `.ledger`, `.ledger-row`, `.ledger-dots`, `.ledger-price` — printed
  price list with dotted leaders; `.menu`, `.menu-col`, `.menu-title`,
  `.menu-actions`; `.bundle`
- `.care-top`, `.includes`, `.care-tiers`, `.care`, `.care-mid`

### A note on the header's words

The integrity check compares the legal and checkout pages word for word, and
the header's text is part of each page's first "sentence". So the header keeps
exactly the words it had (menu, "Start your project", the email address, "Get a
quote"), and anything new in it carries no text of its own: the phone number in
the strip and the "Call (225) 255-0837" button in the phone menu are drawn by CSS
from `data-tel` / `data-label`, with the full label in `aria-label`. The whole
site passes the check with zero FAIL in this state. If the labels are ever
reworded, the baseline for that check has to move with them.

## Motion principles

1. Motion explains, it does not decorate. The phone rises and the seal is stamped
   on load; inside each story vignette the messages, the booking and the follow-ups
   arrive one after another (`.seq`, 70ms apart) when that vignette scrolls in;
   the phone on the bench rings; the caller's typing dots pulse.
2. Transform and opacity only for anything that runs while scrolling. The one
   exception is the theme switch, where the street scene cross-fades its fills
   from day to night.
3. Things you press move: buttons lift 2px on hover and sink 1px on press, prints
   and the business card straighten when hovered.
4. Nothing is ever hidden without JavaScript: reveals are scoped to `.js`, and
   under `prefers-reduced-motion` every animation and transition is off and all
   content is in its finished state.
5. Short. Reveals are .6s, sequences finish inside .5s, nothing loops except the
   ring and the typing dots.

## How the other pages should look

- **Services (`/services/`)**: `.page-head` with a one-line promise, then the nine
  services as a `.ledger` grouped under three `.menu-title` headings (Websites,
  Automation, Consulting) rather than nine identical cards; each row keeps its
  `.tag` price and three ticks. One `.svc-feature` banner per group carries a
  drawing (the little website, the phone thread, the action plan).
- **Consulting (`/consulting/`)**: the page that owns the story. The example week
  becomes the full `.sheet` time sheet (all four columns, the survey small print
  as `.fine` under it). The four "how it works" flows reuse `.route` with their
  full four steps and vignettes. The calculator sits on a `.board`-blue panel:
  inputs as large paper fields on the left in four `fieldset` groups, results on
  the right as a receipt (`.sheet` styling, `#r-month` in 60px Fraunces, the
  disclaimer directly under the total). Setup prices as `.ledger`, Advisor and
  Partner as `.plan` cards, Launch bundle as `.bundle`.
- **Work (`/work/`)**: three full-width case rows, each a large `.print` (image in
  a cream mat, slight rotation alternating left and right) beside the write-up,
  with facts as a small `.ledger` (type, what was built, link). No result claims.
- **Process (`/process/`)**: the `.ticket` grown to a full page: one long job
  ticket with the four steps, each with its "you get" line and the support period
  per plan as `.pill`s, and the "You own everything" stamp at the foot.
- **FAQ (`/faq/`)**: a single 46rem column of `details`/`summary` rows styled like
  `.ledger` rows (question in Fraunces, a plus that turns, hairline between), with
  a sticky `.jump` of topics on wide screens. Answer text untouched.
- **Contact (`/contact/`)**: split layout. Left: the form as a paper job sheet
  (`.ticket` frame, 52px fields with 1.5px `--ctl` outlines, labels above, brick
  error text, the package select prefilled). Right: the `.bizcard` with phone,
  email and location, then the booking box as the `.appt` card. No sticky bar.
- **About (`/about/`)**: first person, set like a letter: 62-character column,
  `.who-note` pull quotes, the `.bizcard` pinned beside the opening paragraph, the
  towns as `.places`, "How I work" as a tick list with prices in `.tag`s, and the
  three projects as small `.print`s.
- **Landing page (`/start/`)**: no menu, as today. The home hero with the street
  scene, then one screen each for the three services (`.svc`), the story reduced
  to three stops, the `.board`, and the closing band. One call to action
  throughout.
- **City pages**: `.page-head` whose scene swaps the sign for the town name, a
  `.points` shelf with the local facts, the Smilys Softwash `.print` as local
  work, the `.board` for prices and the short city FAQ in the FAQ style.
- **Privacy and terms**: plain paper, one 68-character column, Fraunces h2s with a
  brick `.eyebrow` number, generous line height, a `.jump` list of sections at the
  top. Wording untouched.
- **Checkout and success**: a narrow centred `.sheet` receipt holding the plan
  name, price and the Stripe element, with the fixed-price `.seal` beside it; every
  id and inline script unchanged. Success is the same receipt with a blue check
  pin from the story.
- **404**: the street scene at night with the shop sign reading "Page not found",
  one line of copy and two buttons (home, contact).

## Working files

- `work/partials/` holds the header, footer and the two page bodies;
  `work/build.sh` assembles them under the untouched heads, copies the header and
  footer into every page that shares them (`work/sync-chrome.py`) and refills the
  art markers.
- `work/interact.js` clicks the theme toggle and the phone menu, checks the
  sticky bar, the booking links, touch-target sizes and the no-JavaScript view.
- `site/tools/art/build.py` has one new marker, `crest-card` (the business card).
- `site/assets/js/main.js`: the theme now defaults to light (a saved choice wins,
  then a device set to dark), the browser-chrome colours match the new palette,
  the menu breakpoint is 1100px, and the header gets a `stuck` class once the top
  strip has scrolled away. `SITE_CONFIG` and every other behaviour are untouched.
  The inline first-paint script in each head was changed to match the new default.

## Honest gaps

- Only `/` and `/pricing/` are redesigned. Fifteen of the other pages carry the
  new header and footer (`/start/` and the 404 page keep their own on purpose),
  but their old page markup is unstyled under this stylesheet.
- No form styles exist yet (inputs, select, checkboxes, error and success states),
  nor the calculator, FAQ accordion, legal prose or checkout layouts described above.
- The illustrations were drawn by hand in SVG and checked by eye at five widths;
  they have not been tested on real Safari or older Android browsers. The awning
  uses CSS masks and the header uses `color-mix()`; both degrade to a plain look.
- The crest keeps its original palette (navy field, teal inner line). It sits well
  on paper, but the teal is not part of this palette; `PALETTE['--accent']` in
  `tools/art/emblems.py` should move to gold and the icons and link-preview image
  be re-rendered. The chess pieces, shards and full crest are no longer used on
  these two pages, and the animation rules for the full crest are kept only for
  pages that still show it.
- The link-preview image and favicons still show the old dark look.
- Without JavaScript the page is fully readable and the phone menu falls back to
  in-page links, but the theme stays light even on a device set to dark.
- The old Bricolage Grotesque and Manrope files are still in `assets/fonts/`
  because the untouched pages preload them; delete them at rollout.
- The home page is long on a phone (about 18 screens). The story section is the
  longest part and is the first thing to trim if scroll depth is poor.
- The example messages in the vignettes ("The kitchen sink is leaking…") are
  written for illustration and marked "Example"; the owner should approve them.
- The home page's "Who you work with" note is in the first person, quoted from
  the About page, on a site that otherwise says "we". That is a choice to confirm.
- README.md still describes the old colours, fonts and chess artwork.
- Font fallback metrics were measured in headless Chromium against Liberation
  fonts, not against real Georgia and Arial, so a small shift may remain.
