# Rollout decisions (read after BRIEF.md)

Four directions were built and judged by a creative director, a local business
owner on a phone and an engineer. Result: **"Main Street premium" wins** (239), with
the editorial direction two points behind (237). The final site is Main Street's
art direction built with the editorial direction's rigour.

- Main Street copy (the base): `$R/design/mainstreet/site`, notes `$R/design/mainstreet/DESIGN.md`,
  screenshots `$R/design/mainstreet/shots/`, working files `$R/design/mainstreet/work/`
- Editorial copy (borrow from it): `$R/design/editorial/site`, `$R/design/editorial/DESIGN.md`,
  `$R/design/editorial/shots/`
- Also worth a look for single ideas: `$R/design/product/` (the full-loop phone
  sequence with a step rail and pause button; receipt component; scaled payment
  bars) and `$R/design/strategy/` (tone scopes that re-scope tokens, e.g. `.on-ink`,
  `.on-blue`, each with its own `--focus`; `(hover: hover)` guards).
- Full judge notes: `$R/w1_result.json` (`verdicts[].evaluations[]`).

`$R` = `/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh`

## What stays from Main Street

"The well-run shop": warm paper, ink, sign-painter's blue, Red Stick brick, gold
leaf only on blue. Fraunces (soft, heavy) for headings and prices, Figtree for
text. Light first; the dark theme is the same street after closing. Objects from a
good local business stand in for generic cards: the shop front, the price board,
the job ticket, the time sheet, the appointment card, the business card, the
skyline footer. The top strip with the city and a tap-to-call number. The sticky
phone bar with a labelled Call button beside the booking button. 17px body text
and 50 to 56px primary buttons on phones. The colour rule: blue means pressable,
brick means "notice this", gold only on blue.

## What comes from the editorial direction

- **Engineering discipline.** One token-driven system: spacing, type sizes, radii,
  shadows and motion all come from the scale; at most six breakpoints; no inline
  `style=""` attributes except CSS custom properties that carry data (for example a
  bar's width); no `!important` outside reduced-motion and utility resets; every
  enhancement (`color-mix()`, masks, subgrid, `backdrop-filter`) has a plain
  declaration first or sits in `@supports`.
- **No-JavaScript fallbacks** in an `html:not(.js)` block: the phone menu shows as
  plain links, dead buttons are hidden, nothing is invisible.
- **The figure-plus-legend pattern**: numbered markers on a mock tied to an ordered
  list in the `figcaption`, with the honest caption format ("Missed-call text-back,
  $750 to set up. An illustration, not a real conversation.").
- **Dot-leader price lists** (name ........ $price) for long price lists.
- **Tiers as a ruled spec table** (Live in / Size / Design / After launch rows that
  line up across the four packages), not four stacked cards with tick lists.
- **An "On this page" contents list that shows each section's prices** at the top of
  long commercial pages.
- **The example week as a ledger**: a real `<table>` with single-hue bars, the
  arithmetic per row, and a very large "200" (hours a year, in this example) beside
  it with the "not a measurement" note right there.
- **The Launch bundle as an itemised receipt** ($2,000 + $500 + $750, $3,250 struck
  through, $3,000).
- **Care plans as a table on desktop.**
- **The payment plan drawn to scale** (a deposit block and three "about $333" months).
- **The phone number as real text in the desktop header.**
- **One-shot CSS motion that needs no pause control.** Nothing loops forever.

## Must fix (from all three judges)

1. Desktop hero: the phone, the "EXAMPLE" caption pill, the shop sign and the stamp
   collide. Recompose so nothing overlaps awkwardly. The price strip under the
   buttons must be visible without scrolling at 1280x800.
2. Phone hero: the "Fixed prices" stamp crowds the phone mock.
3. Phone "Website design & build" card: the phone mock cuts through the browser
   mock's title, leaving a stray "usiness".
4. The home page is too long: about 15,400px at 390px wide. Target 12,500px or
   less. Automation is told twice (timeline, then time sheet); merge or shorten.
5. Restraint with props: at most ONE tilted object and ONE stamp per page;
   straighten the rest. No bespoke illustrated scene per page: the shop-front scene
   belongs to the home page (and may be reused small on /start/ and 404). Legal
   pages, FAQ and checkout get none.
6. Between 900px and 1040px the time-sheet table overflows its card and the page
   scrolls sideways; between 980px and 1040px the hero phone covers the secondary
   button. Test every 20px from 360 to 1920.
7. Sticky header and sticky phone bar need a solid background fallback before
   `color-mix()`.
8. Typing dots and the ringing phone loop forever: cap them to a few iterations.
9. Job-ticket checkboxes look tappable but do nothing: make them plainly
   decorative or remove them.
10. Reveal stagger is slow enough that late cards are still faded when you reach
    them: shorten it.
11. The header phone number and menu "Call" label were drawn with CSS
    `content: attr(...)` to satisfy the old checker. The checker is fixed: put them
    in the DOM as real text. Header button labels may be reworded too.
12. Delete `bricolage-grotesque.woff2` and `manrope.woff2` once nothing uses them.
13. The crest keeps a teal inner line from the old palette: update `PALETTE` in
    `tools/art/emblems.py` so the crest belongs to the new palette, rebuild, and
    regenerate the favicon, app icons and link-preview image
    (`node tools/art/render.js`); update `site.webmanifest` colours and the
    README's description of colours, fonts and artwork.
14. Example messages inside vignettes are fine when each vignette is marked
    "Example". Use only everyday trade wording; no business names, no people's
    names, no star ratings.
15. Tables that switch to block or grid layout on phones lose their semantics for
    screen readers: keep table roles explicit (`role="table"`, `role="row"`,
    `role="cell"` and so on) or use a layout that keeps `display: table`.
16. Form fields need a real focus ring (2 to 3px, at least 3:1), not just a border
    colour change.
17. On phones, nothing a customer must read is under 15px; labels at least 12px.

## Decisions already made

- Light is the default theme. Dark applies when the visitor chose it or the device
  prefers it. The first-paint snippet in each page head changes to match (use
  `assemble.py --head-script`); on `/checkout/` pages the body scripts stay byte for
  byte.
- The home page keeps the short first-person "Who you work with" note and the
  business card. The projects may be ordered with Smilys Softwash first (it is the
  local one).
- "Most popular" stays on the Business package (it is on the live site today).
- Each page gets `<body data-page="SLUG">` (home, services, consulting, work,
  process, pricing, faq, contact, about, start, city, privacy, terms, checkout,
  checkout-success, notfound).
