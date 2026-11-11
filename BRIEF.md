# KnightWebstudio full refresh: the brief

The owner, Christian Knight, asked for "a full refresh of the website: a top-notch
$100,000 website". Read this whole file before you touch anything.

## 1. What the business is

KnightWebstudio (knightwebstudio.com) is a one-person web studio and small-business
consultancy in Baton Rouge, Louisiana. It sells, at fixed published prices:

- Websites: One-page $1,000, Starter $2,000, Business $4,000, Commerce $8,000.
  Brand identity $1,500. Website add-ons $750 each. Care plans $125, $300, $600 or
  $1,000 a month.
- Consulting and automation: free online check, Growth Audit $350, strategy session
  $150, Google profile & reviews $500, missed-call text-back $750, online booking &
  reminders $750, lead follow-up system $1,500, custom automation workflow $1,500,
  Advisor plan $500/mo, Partner plan $1,000/mo, Launch bundle $3,000.

The site says "we"; the About page says "I".

## 2. Who visits

Owners of local service businesses: plumbers, HVAC and electrical contractors,
roofers, salons, restaurants, auto shops. Most arrive on a phone from a cold email
or a Google search. They are not technical, they distrust jargon, and they decide
within seconds whether this is a real, local, competent person.

What we want them to do, in order: book the free 30-minute call, send an enquiry,
book a Growth Audit, or pay a deposit.

So "a $100,000 website" here does NOT mean an abstract agency showpiece. It means
the craft, clarity and confidence of a top-tier studio build, aimed at a roofer on
an iPhone: instantly clear, obviously trustworthy, a pleasure to use, fast.

## 3. The quality bar

Judge your own work against these. A reviewer will.

1. **Art direction with a point of view.** One coherent idea carried through type,
   colour, layout, imagery and motion. Not a template, not "generic SaaS dark mode".
2. **Typography that carries the design.** A real type scale, tight headline
   setting, comfortable reading measure (45 to 75 characters), deliberate weights.
3. **Layout rhythm.** Sections differ in structure and density. No wall of
   identical card grids. Generous but purposeful whitespace. A strong grid.
4. **Signature moments.** At least two or three things a visitor remembers: for
   example a hero that shows what the product does, an illustrated view of a missed
   call turning into a booked job, a considered pricing layout.
5. **Show, don't tell.** Where the old site describes automation in words, show it:
   a phone with the text-back conversation, a calendar filling in, a quote getting
   its follow-up. Built in HTML/CSS/SVG, not screenshots.
6. **Motion with restraint.** Purposeful, smooth (transform and opacity only), never
   blocking content, fully disabled under `prefers-reduced-motion`.
7. **Detail polish.** Hover, focus and active states on everything interactive.
   Considered form fields. Consistent radii, shadows and spacing from tokens.
   Nothing misaligned at any width.
8. **Phone first.** The 360 to 430px experience is designed, not shrunk. Thumb-sized
   targets (44px minimum), no horizontal scroll, sticky call to action.
9. **Both themes.** Light and dark are each finished designs with AA contrast.
10. **Speed.** No frameworks, no web-font or script CDNs. First view renders with
    one CSS file and self-hosted fonts.

## 4. Hard rules (breaking one of these fails the work)

**Honesty**
- No invented testimonials, reviews, star ratings, client logos, client counts,
  awards, results or statistics. The business is young; do not make it look bigger
  than it is. The three real projects are Risen Health, Corbel Books and Smilys
  Softwash, and nothing may be claimed about their results.
- Illustrative interface mock-ups are welcome, but they must read as illustrations:
  use "[your business]", "Your Business" or a plainly generic label, never a
  realistic made-up company or customer review. Keep any numbers in them to the
  examples already on the site (the consulting page's example week and the
  calculator defaults).
- The time and revenue figures are estimates. Keep every "example", "estimate" and
  "not a guarantee" qualifier that is on the site today, right next to the numbers.
- Never write the word "AI" or "artificial intelligence", "chatbot", "GPT" or
  "machine learning" anywhere: not in copy, alt text, class names, comments or
  file names. The owner's customers react badly to it.

**Prices and facts**
- Every price is fixed. Never "from", "starting at", "as low as $", a range or
  "ballpark". Every price figure on a page today must still be on that page.
- Do not change any fact: prices, payment terms, timelines (7 days, 7 to 10 days,
  2 to 4 weeks, 4 to 6 weeks), support periods (14 days, 30 days, 90 days, six
  months), what each package includes, phone (225) 255-0837, email
  knightwebstudio1@gmail.com, "Based in Baton Rouge, Louisiana", the towns served.
- You MAY rewrite headlines, intros and microcopy to be sharper, and reorder or
  restructure sections, as long as no fact is lost or added. FAQ answers, the
  privacy page and the terms page keep their wording exactly.

**SEO and structured data**
- Leave every page's `<title>`, meta description, canonical URL, Open Graph tags and
  JSON-LD `<script>` blocks exactly as they are. (`theme-color` may change.)
- URLs do not change. No page is removed. Internal links stay root-absolute
  (`/pricing/`, `/assets/...`).

**Behaviour that must keep working**
- `assets/js/main.js`: theme toggle (`#theme-toggle`), mobile menu (`#nav-toggle`,
  `#nav`), header scroll state (`#site-header`), booking buttons (`[data-booking]`,
  `.booking-only`), mobile sticky CTA (`#mobile-cta`), contact form with validation,
  draft saving, Web3Forms post, lazy hCaptcha (`#hcaptcha-slot`) and mailto fallback,
  Plausible analytics, the `?package=` preselect, `#year`. You may extend or
  restructure main.js, but every one of those behaviours must still work, and the
  `SITE_CONFIG` block stays as it is.
- Contact form: same `action`, hidden inputs, field `name`s, select option values
  and checkbox values.
- `/checkout/` and `/checkout/success/`: their inline scripts and every `id` they use
  stay byte for byte. Restyle around them only.
- Consulting calculator: input ids `c-job c-rate c-calls c-callwin c-quotes
  c-quotewin c-hours c-auto`, result ids `r-month r-year r-jobs r-calls r-quotes
  r-hours r-timeval r-payback`, and `assets/js/calculator.js`. The results printed in
  the HTML must equal what the default inputs compute.
- The page must be fully readable with JavaScript off (content is never hidden
  behind a script; reveal effects are scoped to a `.js` class on `<html>`).

**Engineering**
- Plain HTML, CSS and vanilla JS. No build step, no frameworks, no npm packages in
  the shipped site, no CDNs. One stylesheet, `assets/css/styles.css`.
- Fonts are self-hosted WOFF2 in `assets/fonts/`. Today: Bricolage Grotesque
  (display, variable) and Manrope (text, variable). You may add or swap a typeface
  if it is open-licensed (SIL OFL), self-hosted, subset to Latin and under 140 KB
  per file, with at most four font files in total. Google Fonts and Fontsource are
  reachable from this machine for downloading files.
- The shared header and footer are duplicated in every page (there is no include
  system). They must be identical on every page that has them.
- Images need `width`, `height` and `alt`. Lazy-load below the fold.
- Budgets: CSS under 140 KB unminified, each script under 60 KB, no layout shift
  from fonts or images, no horizontal scroll from 360px to 1920px.
- Accessibility: WCAG 2.2 AA. One `<h1>` per page, no skipped heading levels,
  visible focus rings, skip link, labels on every field, `aria-current` in the
  menu, contrast 4.5:1 for text and 3:1 for large text and controls, targets at
  least 44px on touch.

## 5. Brand

- The name "KnightWebstudio" (one word) and the knight crest stay. The crest and the
  chess-piece drawings are generated by `tools/art/emblems.py` and written into the
  pages by `python3 tools/art/build.py` between `<!-- art:NAME -->` markers. Never
  hand-edit between markers. You may add new drawings to `emblems.py`, add new
  marker names in `build.py`, change where and how the art is used, or retire the
  drifting "shards" and per-page chess pieces if your direction does not want them.
- The crest's colours are fixed in `emblems.py` (`PALETTE`); if you change the
  brand palette, update `PALETTE` so the crest matches, then re-run the build and
  `node tools/art/render.js` (favicon, app icons, link-preview image).
- Blue is the brand's anchor colour today (`#6d8bff` on dark, a deeper blue on
  light) with a teal accent. You may evolve the palette. Keep the knight.

## 6. The site today (19 pages)

| Path | What it is |
| --- | --- |
| `/` | Home: hero, services, automation teaser, three projects, process, prices |
| `/services/` | Nine services as cards |
| `/consulting/` | Example week table, how each automation works, revenue and time calculator, setup prices, monthly plans, steps, four questions |
| `/work/` | Three projects as case rows |
| `/process/` | Four steps |
| `/pricing/` | Four website tiers, add-ons, consulting panel, care plans |
| `/faq/` | Fourteen questions |
| `/contact/` | Enquiry form, contact details, booking box |
| `/about/` | First-person About page |
| `/start/` | Landing page for emails and ads; no menu on purpose |
| `/web-design-baton-rouge/` and three more city pages | Local landing pages |
| `/privacy/`, `/terms/` | Plain-English legal pages |
| `/checkout/`, `/checkout/success/` | Stripe checkout |
| `/404.html` | Not-found page |

README.md in the repository explains the conventions in detail. Read it.

## 7. Tools

Paths below use `$R` for
`/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh`.

**Serve** a site folder (root-absolute paths need a server):
`(nohup python3 -m http.server PORT --directory SITE_DIR >/dev/null 2>&1 &)`

**Screenshots:** `node $R/tools/shoot.js --base http://localhost:PORT --paths /,/consulting/ --out DIR --modes desktop-dark,desktop-light,mobile-dark,mobile-light`
- It scrolls each page a viewport at a time and saves what a visitor sees at each
  stop. Desktop: one PNG per stop. Mobile: four stops side by side per "sheet".
- Other devices for `--modes`: `laptop` (1280), `tablet` (820), `small` (360),
  `wide` (1920), each with `-dark` or `-light`.
- It writes `DIR/report.json` with console errors, failed requests and horizontal
  overflow per page. Fix anything it reports.
- LOOK at the images (use the Read tool on the PNG files). Designing without
  looking at the result is not acceptable.

**Integrity check:** `python3 $R/tools/check_site.py --root SITE_DIR --baseline $R/baseline`
- `--pages index.html,consulting/index.html` limits it to the pages you worked on.
- `--show-missing` lists old sentences no longer on the page, so you can confirm no
  fact was dropped. `--show-new-numbers` lists new sentences containing figures.
- Zero FAIL lines is required. Explain any WARN you leave.

**Baseline:** `$R/baseline/` is an untouched copy of the live site. Screenshots of
it are in `$R/shots/baseline/`. Never edit the baseline.

**Art:** `python3 tools/art/build.py` (run from the site folder) refills the art
markers after you change `emblems.py` or add markers.

Screenshots, notes and scratch files go under `$R/`, never inside the site folder
(everything in the site folder ships).

## 8. Working with the page files (saves you a lot of reading)

- Each page's `<head>` is about 250 lines of metadata and JSON-LD that must not
  change. Do not retype it. Write only the new `<body>...</body>` to a scratch file
  and splice it under the untouched head:
  `python3 $R/tools/assemble.py --site SITE_DIR --page pricing/index.html --body $R/.../pricing.body.html`
  (run it with `--help` for the options: `--theme-color`, `--default-theme`,
  `--preload`, `--head-script`, `--extra-head`).
- The crest and chess art sit inline as very long single lines between
  `<!-- art:NAME -->` markers. To read a page without them:
  `sed -E 's/(<!-- art:[a-z0-9-]+ -->).*(<!-- \/art:[a-z0-9-]+ -->)/\1\2/' PAGE | sed -n '/<body/,$p'`
- In the body you write, leave art markers EMPTY, for example
  `<!-- art:crest-header --><!-- /art:crest-header -->`, then run
  `python3 tools/art/build.py` in the site folder to fill them in.
