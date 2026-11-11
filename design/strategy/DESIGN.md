# Your next move: the knight as a system

Direction key: `strategy`. Built pages: `/` and `/pricing/`. Stylesheet: `site/assets/css/styles.css` (71 KB, rewritten). Server: `http://localhost:8714`.

## 1. Concept

The brand already has a knight, so the whole site becomes its board: an 8-file grid lays out every section, the knight's L-shaped move is the only motion signature, and one signal colour (coral) always means "the next move to make": the square the knight stands on, the primary button, "Your move." in the headline.
The idea is never allowed to hide the offer: the hero says "More customers. Fewer missed calls." and "Websites, automation and consulting for local businesses" in plain words, and the board beside it shows the product working (missed call, text back, booked, review) rather than decorating it.

## 2. Tokens

All tokens sit at the top of `styles.css` (section 02).

**Palette**

| Token | Value | Use |
| --- | --- | --- |
| `--ink-950 / 900 / 850 / 800 / 700 / 600` | `#050818 #0a1030 #0e163c #131d4b #1c2863 #2a3884` | Ink navy. 900 is the header, hero and dark page; 850 and 700 are the board's dark and light squares |
| `--ivory-50 / 100 / 200 / 300` | `#fdfaf3 #f6f0e2 #ece4d0 #ddd1b7` | Paper. 100 is the light page, 50 is cards, 200 the alternate band |
| `--blue-200 … 700` | `#c9d4ff #a5b8ff #7f97ff #4f6ef7 #3350e6 #2639bd` | The brand blue. 600 on ivory, 400 on ink; also the crest's facets |
| `--coral-300 … 700` | `#ffa58c #ff7d5c #ff5c35 #e0421b #b3330f` | The one accent. 500 as a fill (ink text on it, 6.0:1), 700 as text on ivory (5.4:1), 400 as text on ink (7.4:1) |

**Semantic tokens** (components use only these): `--bg --bg-alt --surface --text --text-2 --text-3 --line --line-strong --brand --brand-ink --on-brand --accent --accent-text --on-accent --sq-light --sq-dark --focus`.

They are defined three times, by scope rather than by component:

- `:root, [data-theme="light"]`: ivory page, ink text.
- `[data-theme="dark"], .on-ink`: ink page, ivory text. `.on-ink` is how a band (header, hero, automation, footer, the featured price card) goes dark inside the light theme. Nothing needs its own dark variant.
- `.on-blue`: the brand-blue call-to-action band.

Every text pair was measured: the lowest in use is 4.7:1 (`--text-3` on `--ivory-200`).

**Space**: 4px base, `--s-1` to `--s-9` (4, 8, 12, 16, 24, 32, 48, 64, 96). `--section` (72 to 136px) is the vertical padding of a section, `--gutter` (16 to 64px) the page margin, `--gap` (12 to 24px) the gutter between files. `--container` is 1312px.

**Shape**: `--radius: 2px`. Board squares are square, so cards, buttons, inputs and tags are too. The only rounded things are device mock-ups (`--radius-device: 26px`) and chat bubbles inside them. `--rule: 2px` is the heavy rule that opens a list.

**Shadow**: flat by default. `--shadow-lift` under illustrations and work images, `--shadow-float` reserved for floating layers.

**Motion**: `--ease`, `--ease-hop`, `--t-fast .16s`, `--t-med .28s`, `--t-slow .36s`, and the two legs of a knight's move, `--t-leg-long .42s` then `--t-leg-short .3s`.

**Default theme**: light (ivory pages with an ink header, hero and footer). A visitor whose device prefers dark gets the dark theme; the toggle still remembers a choice. `theme-color` is ink in both themes because the header bar is.

## 3. Type

| Role | Face | Setting |
| --- | --- | --- |
| Display, labels, prices, buttons | **Jost** variable (OFL, 26 KB Latin, `assets/fonts/jost.woff2`) | 800 for headings and prices, 700 for small headings, 600 for buttons and uppercase labels |
| Reading text | **Manrope** variable (already on the site, 24 KB) | 400 to 500 body, 600 to 700 emphasis |

Jost is a Futura-style geometric: circles and straight strokes, which is the same geometry as a board. It replaces Bricolage Grotesque (131 KB), so the two preloaded fonts now weigh 50 KB together. Both have metric-matched local fallbacks (`Jost Fallback`, `Manrope Fallback`, measured in the browser) so the swap moves nothing.

Scale (fluid, `clamp()`):

- `--fs-hero` 32 to 80px on phone and tablet, 56 to 88px on desktop. The hero headline is three set lines; the size is tied to the viewport so the longest line always fits.
- `--fs-h1` 40 to 72px, `--fs-h2` 32 to 56px, `--fs-h3` 22 to 28px, `--fs-h4` 18px.
- `--fs-price` 44 to 64px (tier prices), `--fs-lede` 17 to 20px, body 16px, `--fs-sm` 15px, `--fs-xs` 13px, `--fs-label` 12px uppercase with .14 to .16em tracking.
- Headlines: line-height .93 to 1, tracking -.022 to -.035em, `text-wrap: balance`. Paragraphs are capped at 31 to 44em and use `text-wrap: pretty`.

## 4. Grid and spacing rules

- **Eight files.** `.container` is 1312px wide. From 900px every layout is `repeat(8, minmax(0, 1fr))` with `--gap`; components place themselves by file ("1 / span 5", "6 / -1"). On a phone the same content stacks in one column inside 16px margins.
- **Recurring splits**: 5 + 3 (section heading and intro, hero copy and board, big project and two small), 3 + 5 (sticky heading and price list), 1 + 3 + 2 + 2 (a service row: piece, description, ticks, price), 2 + 2 + 2 + 2 (process squares, price columns).
- **The board is visible only where it means something**: the hero board (files e to h), the `.file-ruler` over the services list, the checker under illustrations and work images, the 2 by 2 corner in a page header, the four process squares. Everywhere else the grid is felt, not drawn.
- **Tone rhythm**, home in the light theme: ink hero, ivory services, ink automation, ivory work, deeper ivory process, ivory pricing, blue call to action, ink footer. No two neighbouring sections share a layout: score-sheet rows, a bento of illustrations, an asymmetric tile grid, a checker rank, ruled price columns.
- Section heading block: eyebrow, then `h2` on files a to e and the intro on f to h, both starting at the top. Lists open with a 2px ink rule and separate rows with 1px rules.
- Breakpoints: 640 (two-up lists), 900 (the 8-file grid), 1000 (hero side by side), 1100 (desktop menu, four-across rows), 1180 and 1400 (fine tuning). Checked at 320, 360, 390, 640, 820, 900, 1000, 1101, 1280, 1440 and 1920 with no horizontal scroll.

## 5. Component inventory

| Component | Classes | Notes |
| --- | --- | --- |
| Tone scopes | `.on-ink`, `.on-blue`, `.section`, `.section-alt` | Re-scope the semantic tokens |
| Layout | `.container`, `.files`, `.section-head`, `.section-sub`, `.section-more`, `.split` + `.split-head` + `.split-body` | `.split` gives a sticky heading beside a long list |
| Type helpers | `.eyebrow` (with its lit square), `.lede`, `.label`, `.num`, `.nw`, `.ticks`, `.tag` | |
| Buttons | `.btn`, `.btn-primary` (coral, the next move), `.btn-ghost`, `.btn-light`, `.btn-sm`, `.btn-block`, default `.btn` (ink) | 52px tall, 44px small; hover, focus-visible and active states. On ivory the coral button has an ink edge |
| Links | `.more-link` with `.arrow` (the knight-move arrow), `.text-link` | The arrow hops in an L on hover |
| Header | `.site-header`, `.brand`, `.brand-crest`, `.brand-name`, `.nav`, `.nav-links`, `.nav-indicator`, `.nav-foot`, `.nav-mail`, `.icon-btn`, `.burger`, `.header-cta`, `.scroll-progress` | Ink bar in both themes. Under 1101px the menu is a full-height numbered sheet |
| Hero | `.hero`, `.hero-grid`, `.hero-copy`, `.hero-cta`, `.hero-note`, `.hero-points` | |
| The board | `.hero-board`, `.board[data-step]`, `.trk` + `.trk-h/.trk-v`, `.board-stops`, `.stop` + `.stop-tile`, `.board-knight`, `.board-files`, `.board-ranks`, `.board-foot`, `.board-cap`, `.board-toggle` | Signature piece; see Motion |
| File ruler | `.file-ruler` | The letters a to h over a layout that uses all eight files |
| Services as moves | `.moves`, `.move`, `.move-piece`, `.move-n`, `.move-head`, `.move-kicker`, `.move-desc`, `.move-ticks`, `.move-price`, `.price-tag`, `.price-cap` | A score sheet, one row per service, each with a chess piece |
| Automation | `.auto-grid`, `.auto` + `.auto-a/.auto-b/.auto-c`, `.auto-body`, `.flow-steps` | L-shaped bento |
| Vignettes | `.vig`, `.vig-tag`, `.ui`, `.ui-head`, `.ui-notes`, `.phone`, `.msgs`, `.msg` + `.msg-out/.msg-in/.msg-sys/.msg-missed`, `.msg-meta`, `.cal`, `.cal-grid`, `.cal-day`, `.slot` + `.slot-busy/.slot-new`, `.leads`, `.src`, `.lead-what`, `.st` + `.st-go/.st-ok` | HTML and CSS only, labelled "Illustration", generic "[your business]" wording |
| Example week | `.tally`, `.tally-copy`, `.tally-data`, `.tally-table`, `.tally-row`, `.tally-eg`, `.tally-total`, `.tally-sum`, `.tally-note` | The consulting page's worked example as a real table; label and arithmetic stack on a phone |
| Work | `.work-grid`, `.work-tile`, `.work-tile-lg`, `.work-mat`, `.work-cap`, `.work-kind`, `.work-go` | Images matted, never cropped |
| Process | `.rank`, `.rank-sq`, `.rank-n`, `.rank-text`, `.assure`, `.assure-item` | Alternates like a board at every width |
| Pricing at a glance | `.glance`, `.glance-item`, `.glance-name`, `.glance-amt`, `.glance-plan`, `.glance-note`, `.glance-go`, `.also`, `.also-row` | Column fills ink on hover |
| Call to action | `.cta-band`, `.cta-inner`, `.cta-copy`, `.cta-actions`, `.cta-tel`, `.cta-who`, `.cta-crest` | |
| Footer, sticky bar | `.site-footer`, `.footer-grid`, `.footer-brand`, `.footer-col`, `.footer-place`, `.footer-bottom`, `.footer-links`, `.mobile-cta` | |
| Sub-page header | `.page-head`, `.page-head-grid`, `.page-head-copy`, `.page-art`, `.jump` | The page's chess piece stands on a 2 by 2 corner of the board |
| Price tiers | `.tiers`, `.tier`, `.tier.featured.on-ink`, `.tier-flag`, `.tier-name`, `.tier-price`, `.tier-plan`, `.tier-note` | Subgrid keeps the four cards' rows aligned |
| Price lists | `.price-list`, `.price-group`, `.price-row`, `.addon-name`, `.addon-desc`, `.addon-price` | |
| Care plans | `.care-grid`, `.care-tier`, `.care-price`, `.tier-fit`, `.tier-terms`, `.care-includes`, `.care-list` | Ruled columns, not cards |
| Payment | `.pay`, `.pay-bars`, `.pay-bar-2`, `.pay-bar-4`, `.pay-seg`, `.pricing-foot` | The 50/50 split and the Starter plan drawn to scale |
| Forms, FAQ, prose (styled, not yet used on a rebuilt page) | `.field`, `.field-row`, `.chips`, `.chip`, `.error`, `.hp`, `.form-status`, `.form-fine`, `.faq-list`, `.faq-item`, `.faq-body`, `.prose`, `.prose-updated` | Same class names the contact, FAQ and legal pages use today |
| Artwork | `.crest`, `.crest-full`, `.piece`, markers `crest-header`, `crest-footer`, `full-crest`, `piece-*`, new `knight-board` | Crest palette updated in `emblems.py` (coral inner line, new navy); icons and link preview re-rendered |

## 6. Motion principles

1. **One signature: the L.** The knight crosses two squares, then one (`.board-knight` slides on X, its child on Y after a delay, so it is two transforms and no layout). The same shape is reused small: link arrows hop up-and-across on hover, a chess piece makes its move when its row is hovered, status chips in the illustrations arrive by an L (`.hop`).
2. **Transform and opacity only.** Track segments grow with `scale`, tiles change colour by cross-fading two layers, reveals rise 16px.
3. **Nothing waits on a script.** The board's markup rests on its finished state (`data-step="3"`); reveals are scoped to `.js`. With scripts off the page is complete and still.
4. **The loop is polite.** It holds the finished picture first, then replays; it pauses off screen and under the pointer, and has a Pause button (WCAG 2.2.2). Reveals finish within half a second.
5. **Reduced motion** removes every animation and transition, and the board stays on its finished state with no Pause button.

## 7. How the remaining pages should look

**Services (`/services/`).** Ink `.page-head` with the rook on its 2 by 2 corner. The nine services become three groups of `.moves` rows under `.file-ruler` (websites, automation, consulting), each row carrying its price in a `.move-price` block. No card grid.

**Consulting (`/consulting/`).** Page head with the knight and the two existing buttons. "Where the week goes" uses the full four-column version of `.tally-table` (the fourth column, "Once it's automated", returns at 900px and folds under each row on a phone), with the note and the survey sources kept beside it. "How it works" reuses the `.auto` bento, adding the custom-automation card. The calculator is a `.split`: inputs on the left as `.field` groups, the result in a sticky ink panel with `#r-month` set in `--fs-price` and the four lines as a `.price-list`; the disclaimer stays directly under the figures. Setup prices are a `.price-list`, the monthly plans three `.tier` cards, steps a `.rank`, questions a `.faq-list`.

**Work (`/work/`).** One full-width row per project: `.work-mat` image on files a to e, the case text on f to h, alternating sides, newest first. Facts only, exactly as today.

**Process (`/process/`).** The pawn in the header. The four steps as a vertical `.rank` (number, title and the longer copy in one wide square each), with a coral track down the left margin that fills as you scroll past, the board's route turned on its side.

**FAQ (`/faq/`).** The bishop in the header, then one `.faq-list` in a 5-file column with a sticky "Still have a question?" card on files g to h. Answers keep their wording word for word, since the FAQ structured data mirrors them.

**Contact (`/contact/`).** The queen in the header. A `.split`: contact details and the "Book a 30-minute call" box (`.booking-only`) on the left files, the form on the right in a panel on `--surface` using `.field`, `.chips` and the coral submit button. Same action, names, values and ids; no sticky bar.

**About (`/about/`).** A single reading column (`.prose`, 44em) on files b to f with the full crest on g to h, first person kept. "How I work" becomes five `.assure-item` rows.

**Landing page (`/start/`).** No menu, as today: the ink bar holds only the crest and one coral booking button. A shorter hero with the same board, the services as `.moves`, `.glance` prices, the three `.work-tile`s, a `.rank` and the blue band. One call to action throughout.

**City pages.** Page head with the city in the `h1` and a 2 by 2 corner. Copy in `.prose`, Smilys Softwash as a single wide `.work-tile`, prices as `.glance`, the city FAQ as `.faq-list`, then the blue band.

**Legal (`/privacy/`, `/terms/`).** Ink page head without art, then `.prose` in one 44em column on ivory with the "last updated" label. Wording untouched.

**Checkout and success.** Restyled around the untouched markup and inline scripts: an ink page head, the order summary as a `.price-list` on the left files and the Stripe embed in a panel on `--surface` on the right. Every id stays.

**404.** An ink page with the board filling the screen and the knight toppled on one square, a single line of copy and two buttons (home, contact).

## 8. Notes for the roll-out

- `tools/assemble.py` options used: `--theme-color '#0a1030' --default-theme light --preload jost.woff2,manrope.woff2 --head-script work/parts/head-script.js`. The first-paint script now defaults to light and honours a dark device.
- The shared header and footer are in `work/parts/header.html` and `footer.html`. They are already copied into the other 15 pages that share them (`work/sync_chrome.py`), so the site-wide check passes; those pages' bodies are untouched and still need rebuilding.
- **The header's visible text must not change.** The checker treats the menu text as part of the first sentence of the legal and checkout pages, so adding anything to the menu sheet (I tried a phone link) fails four pages.
- `main.js`: desktop menu breakpoint moved from 981 to 1101px; theme default flipped; reveal stagger shortened; the board stepper added. Everything in the brief's behaviour list still works (tested with Playwright: theme toggle, menu open and Escape, booking link, sticky bar, reduced motion, scripts off).
- `bricolage-grotesque.woff2` is still in `assets/fonts/` only because the heads of the pages not yet rebuilt preload it. Delete it when those heads are reassembled.
- Integrity check: 0 FAIL on the two pages and across all 19. Two WARN, both the first-paint script (the theme default changed on purpose).

## 9. Honest gaps

- Only two pages are designed. Forms, FAQ and prose have styles in the system but have not been seen on a rebuilt page; the consulting table and calculator are specified above, not built.
- The projects are shown with the images the site has: two link-preview cards and one before-and-after photo. Matting helps, but real page screenshots would do the work more justice.
- The chess pieces and crest are the existing drawings, recoloured. A redrawn, heavier knight for the hero board would sharpen the signature piece.
- On a phone the board's squares show titles only; the one-line notes appear from tablet width up.
- The board loop is driven by `main.js` timers rather than scroll. It is deliberate (it has a Pause button and pauses off screen), but a scroll-linked version was not explored.
- Coral as a fill is 2.7:1 against ivory, so on light backgrounds the primary button carries a 2px ink edge (`--accent-edge`) and coral is never used for text there (`--accent-text` is the darker coral-700). Small decorative squares in coral on ivory are below 3:1 and carry no meaning on their own.
- No performance run (Lighthouse) was possible here; budgets were checked by file size only. CSS is 71 KB of a 140 KB budget, `main.js` 23 KB.
- The site README's colour and type section is rewritten for the new tokens; its artwork table (pieces per page, shards) and breakpoint notes still describe the old layout and need a pass at roll-out.
- `subgrid` and container query units are used for alignment and for sizing the board's tiles. Both degrade to an unaligned but usable layout in browsers before 2023.
