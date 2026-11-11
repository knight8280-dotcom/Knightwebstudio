# Direction: Show the machine working

**Concept.** The site demonstrates the service instead of describing it: a phone
takes a missed call, a text goes back, the job lands on a calendar, a review
request goes out, all built from HTML and CSS and playing in front of the
visitor. Everything around those small working screens is kept plain and warm
(paper, ink, one blue, a highlighter stroke) so a contractor reads it as a tidy
work order, not as software marketing.

Built so far: the design system (`assets/css/styles.css`), the home page and the
pricing page. The other 17 pages carry the new header and footer but still have
their old page markup; they are restyled at rollout.

---

## 1. Theme

Light is the default ("daylight"); dark ("after hours") is a finished second
theme. Light was chosen on merit: most visitors are on a phone, often outdoors;
message bubbles and calendars read most naturally on a light screen; and it
moves the brand away from the generic dark look it had. A saved choice wins,
otherwise the visitor's system setting decides, otherwise light.

Light tokens sit on `:root`, dark overrides on `[data-theme="dark"]`. The
first-paint snippet in each `<head>` and `main.js` were changed to match (this
is the one WARN the integrity check reports per page).

## 2. Tokens

All in the first block of `styles.css`.

### Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#f7f4ee` | `#0e1015` | Page: warm paper / after hours |
| `--bg-alt` | `#f0ebe1` | `#12151c` | Alternate band (`.section-alt`) |
| `--surface` | `#ffffff` | `#171b24` | Cards, mock interfaces |
| `--surface-2` | `#fbf9f5` | `#1c212c` | Demo wells, browser bars, receipt |
| `--sunken` | `#ebe6db` | `#0a0c11` | Empty calendar slots, chips, icon wells |
| `--ink` | `#141824` | `#f3f1ec` | Headings, primary text (16:1) |
| `--ink-2` | `#3a4050` | `#c8ccd6` | Body text (9.4:1 / 11.8:1) |
| `--muted` | `#5a6072` | `#9aa0b0` | Labels, captions (5.7:1 on paper, 5.3:1 on the alt band) |
| `--faint` | `#8d919d` | `#6d7383` | Decoration only, never body text |
| `--line`, `--line-2` | ink at 10% / 18% | white at 9% / 16% | Hairlines |
| `--brand` | `#2f4fdb` | `#7f9aff` | Buttons, sent bubble, new booking |
| `--brand-ink` | `#2643c6` | `#9fb2ff` | Brand as text and links |
| `--on-brand` | `#ffffff` (6.4:1) | `#0b1020` (7.2:1) | Text on brand fills |
| `--ok` / `-solid` / `-tint` | `#0c7a54` … | `#4fd6a4` … | Booked, sent, done |
| `--warm` / `-solid` / `-tint` | `#8a5300` … | `#f6c065` … | Follow-up, review, "within a minute" |
| `--miss` / `-solid` / `-tint` | `#b3232d` … | `#ff8f8f` … | Missed call |
| `--marker` | `#ffd27a` | amber at 50% | Highlighter behind headline words |
| `--band`, `--band-2` | `#101731`, `#1a2550` | `#141b38`, `#1e2a5c` | Closing panel (dark in both themes) |

The three status colours only ever mean what they mean in the demos: red is a
missed call, amber is a nudge, green is handled. They are not decoration.
The crest keeps its fixed palette in `tools/art/emblems.py`; blue stays the
brand's anchor, so nothing there needed to change.

### Type

| Role | Family | Size | Setting |
| --- | --- | --- | --- |
| Display `h1` | Bricolage Grotesque 700 | `--t-display` 32 → 72px; 44 → 66px in the two-column hero | line-height 1, tracking -0.038em |
| `h2` | Bricolage Grotesque 700 | `--t-h2` 30 → 48px | 1.06, -0.032em |
| `h3` | Bricolage Grotesque 650 | `--t-h3` 20 → 23px | 1.2, -0.02em |
| Lede | Geist 400 | `--t-lede` 17 → 20px | 1.55, measure 54 to 56ch |
| Body | Geist 400 | `--t-body` 16px | 1.6 |
| Small | Geist | `--t-sm` 15px, `--t-xs` 13px | 1.5 |
| Label | Geist Mono 500 | `--t-label` 12px, uppercase | tracking 0.08em |
| Prices | Bricolage 700 (large) or Geist 600 (inline) | 40 → 56px / 17px | `tabular-nums` |

Two voices: **Bricolage Grotesque** is the studio speaking (headlines, prices,
names); **Geist** is the interface (body, buttons, every mock screen);
**Geist Mono** is the machine's small print (eyebrows, step numbers, table
heads, timestamps). Three WOFF2 files, Latin, variable, 94 KB in total
(Bricolage 41 KB, Geist 29 KB, Geist Mono 23 KB); Manrope is retired and the
old 131 KB Bricolage file is replaced by the weight-only cut. Bricolage and
Geist are preloaded; fallback faces are metric-matched (`size-adjust`,
`ascent-override`) so text does not jump when the fonts arrive.

### Space, radius, shadow, motion

- **Space.** `--sp-N` is N × 4px (`--sp-1` 4px … `--sp-16` 64px). Layout gaps,
  padding and margins use it; the small mock interfaces also use the 2px steps
  in between. `--gutter` clamp(20px, 4vw, 32px), `--container` 1200px,
  `--section-y` clamp(64px, 9vw, 132px), `--header-h` 68px.
- **Radius.** `--r-1` 8 (chips, small controls), `--r-2` 12 (buttons, inputs),
  `--r-3` 16 (cards inside cards), `--r-4` 24 (cards, panels), `--r-5` 32,
  `--r-pill`.
- **Shadow.** `--shadow-1` resting, `--shadow-2` cards, `--shadow-3` floating,
  `--shadow-phone`. Light falls from above and is slightly warm in light theme;
  in dark theme depth comes from a 1px inner highlight plus a deeper drop.
- **Motion.** `--ease` cubic-bezier(.22,.8,.24,1), `--ease-spring` for things
  that land (a booking dropping into its slot), `--d-1` .16s (hover),
  `--d-2` .28s, `--d-3` .45s.

## 3. Grid and spacing rules

- One container, 1200px plus gutters. Sections are `.section` with
  `--section-y` above and below; `.section-alt` is the deeper paper band with
  hairlines top and bottom. Bands alternate, never two alt bands in a row.
- Section heads (`.section-head`) are left-aligned: eyebrow and `h2` on the left
  six columns, the supporting sentence on the right five, baselines aligned.
  Nothing is centred except the phone.
- Consecutive sections must differ in structure. Home runs: split hero with the
  stage → ruled facts strip → three ruled rows (services) → bento of four
  different tiles → three browser frames → a four-stop rail → one four-column
  price sheet → a dark panel.
- Hairlines do the dividing; boxes are reserved for things that are objects
  (a card, a phone, a receipt). Fixed prices are always set in tabular figures.
- Breakpoints: 600 (phone stage layout), 640/680/760 (two columns), 900–1000
  (section heads, split sections), 1100 (desktop menu), 1120 (two-column hero,
  four-column tiers). Designed at 360 and 390 first; checked at 820, 1280,
  1440 and 1920.
- Touch targets are 44px or taller; menu rows are 56px.

## 4. Component inventory

**Chrome**
- `.site-header` (`#site-header`, `.scrolled` adds the frosted bar), `.brand`,
  `.nav` / `.nav-links` / `.nav-foot` / `.nav-call`, `.icon-btn`,
  `#theme-toggle`, `#nav-toggle`.
- `.site-footer`, `.footer-grid`, `.footer-col`, `.footer-bottom`.
- `.mobile-cta` (`#mobile-cta`): floating bar with tap-to-call, on small screens.
- `.skip-link`.

**Type and layout**
- `.eyebrow` (+ `.eyebrow-dot` live dot), `.lede`, `.fine`, `.mark`
  (highlighter), `h1 .line`.
- `.container`, `.section`, `.section-alt`, `.section-rule`, `.section-first`,
  `.section-head`, `.section-sub`, `.section-more`.
- `.split` / `.split-head` (sticky intro beside a long list).

**Controls**
- `.btn` with `.btn-primary`, `.btn-secondary`, `.btn-light`, `.btn-lg`,
  `.btn-sm`, `.btn-block`; `.more-link` (arrow slides), `.text-link`.
- `.ticks` (checked list), `.chip` (+ `-ok`, `-warm`, `-miss`, `-brand`),
  `.price-tag`, `.step-chip`.

**Interface kit** (`.ui` sets the mock-screen type)
- `.phone` / `.phone-screen` / `.thread` / `.msg.msg-in|msg-out` / `.msg-meta` /
  `.call` (incoming-call overlay) / `.phone-input`.
- `.float` system cards (`.float-call`, `.float-cal`, `.float-review`,
  `.float-ic.is-miss|is-ok|is-warm|is-brand`, `.float-line`).
- `.week` calendar (`.week-lg`, `.slot`, `.slot.is-busy`, `.slot-new`).
- `.browser` / `.browser-bar` / `.browser-url` / `.browser-live`.
- `.note` notification stack, `.picker` booking widget, `.leads` list,
  `.receipt`, `.mini-site`, `.mini-phone`, `.mini-flow`, `.mini-plan`.
- `.ui-label`, `.var` (the `[your business]` placeholder), `.demo-tag`
  ("Illustration").

**Sequences** (`main.js`, "Demo sequences")
- `[data-seq]` with `data-steps`, optional `data-first`, `data-times`,
  `data-hold`, `data-loop`; children `[data-at]`, `[data-until]`, `[data-go]`,
  `[data-seq-toggle]`. `.seq-ready` is added by the script.
- `.stage`, `.scene`, `.rail` (`.rail-n`, `.rail-k`, `.rail-t`), `.rail-toggle`,
  `.stage-cap`.

**Home**
- `.hero`, `.hero-bg`, `.hero-grid`, `.hero-copy`, `.hero-cta`, `.offer`
  (three services with their prices), `.facts`.
- `.svc-list` / `.svc` (`.svc-title`, `.svc-price`, `.svc-body`, `.svc-art`).
- `.bento` / `.tile` (`.tile-a`…`.tile-d`, `.tile-demo`, `.tile-body`,
  `.tile-head`, `.flow-steps`, `.flow-steps-row`), `.tile-week` with
  `.week-ledger`, `.week-total`.
- `.work-grid` / `.work-card` / `.work-meta` / `.work-go`.
- `.steps` / `.step` (`.step-num`, `.step-chip`).
- `.sheet` / `.sheet-col` (`.sheet-amt`, `.plan-bar`, `.sheet-go`), `.also`.
- `.cta-band` / `.cta-inner` / `.cta-crest` / `.cta-phone`.
- `.quote-grid` / `.quote` (styled for the testimonials block that stays
  commented out until there are real quotes).

**Pricing**
- `.page-head`, `.index-card` (on-this-page list with every price).
- `.tiers` / `.tier` (`.is-featured`, `.tier-flag`, `.tier-price`, `.tier-plan`,
  `.tier-specs`), rows aligned across cards with subgrid.
- `.ledger` (`.ledger-name`, `.ledger-desc`, `.ledger-price`), `.ledger-groups`,
  `.ledger-title`, `.bundle` + `.receipt`.
- `.care` / `.care-plan` (one aligned table on desktop, cards below),
  `.care-includes`.
- `.pay` / `.pay-card` / `.pay-bar` (`.is-plan`).

## 5. Motion principles

1. **Every demo rests finished.** With no JavaScript, with reduced motion, to a
   crawler and in the first second of a visit, each mock screen shows its
   complete end state. Motion only ever replays a picture that is already there.
2. **One loop, with a pause button.** The hero stage holds its finished state
   for about four seconds, then rewinds and plays six beats (ring, missed, text
   back, reply, booked, review). It runs only while on screen and in a visible
   tab, the rail's stops jump to any step, and the pause control satisfies
   WCAG 2.2.2. The bento demos play once when they scroll in and replay on
   hover or tap.
3. **Transform and opacity only.** Nothing animates layout. Swapped states
   (status chips, the open/booked slot) are stacked in one grid cell and
   cross-faded.
4. **Things that land get a spring; everything else eases out** in under half a
   second. Hover feedback is .16s.
5. **Reveals are a courtesy, not a gate.** `.reveal` is scoped to `html.js`,
   moves 12px over .4s, and is switched off under `prefers-reduced-motion`
   along with every keyframe animation.

## 6. The remaining pages in this system

- **Services (`/services/`).** The nine services become ruled `.svc` rows in
  three labelled groups (websites, automation, consulting), each with its fixed
  price in the title column and, on wide screens, one small mock-up per group
  rather than nine icons. Ends with the price sheet's `.also` strip and the
  closing band.
- **Consulting (`/consulting/`).** Page head like pricing, with the hero stage
  reused at a smaller size beside the copy. The example-week table becomes the
  `.tile-week` ledger at full width (a real `<table>`, same ruled style, with
  the "once it's automated" column shown as chips), keeping both notes under it
  word for word. "What happens, step by step" is the bento, one tile per
  automation with four steps. The calculator is a `.split`: inputs as a ruled
  form on the left (fields styled like the booking picker: 48px, 12px radius,
  mono labels), results on the right as a `.receipt` with the monthly figure in
  display type and the disclaimer directly beneath; all ids unchanged. Setup
  prices use `.ledger-groups`; Advisor, Partner and the Launch bundle use
  `.tier` cards and the `.bundle` receipt. The four questions use the FAQ
  pattern below.
- **Work (`/work/`).** Each project is a full-width row: a large `.browser`
  frame with the live-site dot on one side, the factual description and a
  "Visit site" button on the other, alternating sides. No result claims.
- **Process (`/process/`).** The four-stop rail turned vertical and enlarged:
  a sticky numbered rail on the left, each step a block on the right with its
  `.step-chip` artefacts (free call, fixed quote, staging link, your accounts)
  and the support periods as `.tier-specs` cells.
- **FAQ (`/faq/`).** A single 68ch column of `<details>` rows ruled like the
  ledger: question in Bricolage 650, a plus that rotates to a cross, answers in
  body type with wording untouched. A sticky `.index-card` of topics on wide
  screens.
- **Contact (`/contact/`).** A `.split`: on the left the promise and contact
  details as an `.offer`-style list (phone, email, Baton Rouge) plus the
  booking box as a calendar-styled card; on the right the form on a
  `--surface` card. Fields are 52px tall, 12px radius, `--line-2` border, a
  2px brand focus ring, mono labels above, errors in `--miss` with an icon;
  service checkboxes as selectable chips. Same action, names, values,
  hCaptcha slot and status line.
- **About (`/about/`).** First person, one 68ch column, no demos: a large
  Bricolage opening statement with one `.mark`, body in Geist at 18px, then a
  ruled list of facts (where, how to reach, how projects run) and the three
  projects as small browser frames.
- **Start (`/start/`).** The home hero without the menu: headline, the stage,
  the `.offer` list with prices, the price sheet, the three browser frames, the
  four-stop rail, one closing band. The phone bar is on from the first scroll.
- **City pages.** Page head with the city in the `h1` and a `.mark` on it, the
  `.facts` strip localised (meet in person, towns served), the price sheet,
  Smilys Softwash as a single browser-frame feature, the city FAQ in the FAQ
  pattern, closing band.
- **Privacy and terms.** Plain documents: 68ch column, `h2` at `--t-h3` size,
  18px body, generous leading, a sticky contents `.index-card` on wide screens.
  No demos, no bands; wording untouched.
- **Checkout and success.** Header, then a narrow `.split`: the order summary
  as a `.receipt` (plan, amount, what happens next) beside Stripe's embedded
  form on a `--surface` card. Inline scripts and ids untouched; only the
  wrappers are restyled.
- **404.** The toppled knight stays. Centered on paper with a short line, the
  `.offer` list as three ways back in and one primary button.

## 7. Rollout notes

- `work/make.py` composes a page from `_header.html` + a `<main>` partial +
  `_footer.html` under the untouched baseline head (via `tools/assemble.py`),
  then runs `tools/art/build.py`. `work/sync_chrome.py` swaps the shared header,
  footer and phone bar into every page that shared them and fixes the font
  preloads.
- The header's visible text is unchanged from the old site on purpose (the
  legal and checkout pages are checked word for word, header included); the
  menu's call link is an icon with an `aria-label`.
- Each page needs the sprite of icons it uses at the top of `<main>`.
- The crest and the knight stay (header, footer, closing band). The drifting
  shards and the per-page chess pieces are retired in this direction; the
  `shards` and `piece-*` markers simply go unused.

## 8. Honest gaps

- Only the home and pricing pages are designed. The other 17 pages carry the
  new header and footer over their old markup and look unstyled.
- Form fields, the FAQ accordion, the calculator, long-form legal type and the
  checkout wrappers are described above but not yet written in CSS.
- `README.md` still documents the old tokens, fonts and section names.
- `og-image.png`, the favicon and app icons still show the old dark look; they
  need re-rendering (`node tools/art/render.js`) once the direction is chosen.
  `site.webmanifest` colours were updated.
- The demos use relative labels ("Thursday morning", "within a minute") and no
  clock times or phone numbers, to keep every figure to ones already on the
  site. They read slightly less like a real phone because of it.
- The hero story joins three separately priced setups in one scene. The
  caption says so, but a skimming visitor could still take it for one product.
- Subgrid (tiers, care table), `:has()`, `color-mix()` and `overflow: clip`
  are used. Browsers from 2023 on are fine; older ones lose row alignment and
  some tints but nothing breaks.
- Not run: Lighthouse, a screen-reader pass, real-device testing. Contrast was
  computed for the token pairs, not audited element by element.
- The work section is three equal frames; it is honest but the least
  distinctive part of the page.
- No photography and no founder portrait, by the brief; the page's only human
  note is the copy and the highlighter.
