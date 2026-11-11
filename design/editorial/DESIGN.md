# The Consultant's Almanac — design direction for knightwebstudio.com

## Concept

KnightWebstudio set like a well-made almanac: the annual report of a serious
consultancy, written for a tradesman. Warm paper, deep ink and one confident
blue; numbered chapters, hairline rules, big serif numerals and dot-leader price
lists carry the page, and every claim about automation is paired with a small
figure that shows the product doing it.

The guard rail: it must never read as a magazine. Every screen has a price, a
plain sentence, a figure of the product or a button. Type is the decoration;
nothing is decorative that is not also information.

Default theme is **light** ("day edition"). A visitor whose device asks for dark,
or who presses the toggle, gets the **night edition**, which is a finished design
of its own, not an inversion.

## What changed outside the two pages

| File | Change |
| --- | --- |
| `assets/css/styles.css` | Rewritten (70 KB). Sections: fonts, tokens, base, layout, chrome, components, home, pricing, motion, artwork, phone rhythm. |
| `assets/js/main.js` | Four small edits: theme-color values, default-theme rule (light unless the device prefers dark), reveal stagger 50 ms capped at 200 ms, and the closing-band crest no longer waits for scroll to build (it rests finished; hover replays). Everything else, including `SITE_CONFIG`, is untouched. |
| `assets/fonts/` | `fraunces.woff2` (67 KB), `fraunces-italic.woff2` (81 KB), `libre-franklin.woff2` (29 KB). Bricolage and Manrope removed. Three files, all SIL OFL, Latin, variable. |
| `tools/art/emblems.py` | One line: the crest ribbon's lettering now uses Libre Franklin. `PALETTE` is unchanged, so favicon, app icons and crest need no re-render. |
| Head of each page | Via `assemble.py`: `data-theme="light"`, `theme-color #f5f0e6`, preloads for `fraunces.woff2` and `libre-franklin.woff2`, and the first-paint script flipped to "light unless dark is preferred". That script change is the checker's two WARNs. |
| Other 15 pages with the shared chrome | Header and footer swapped mechanically by `work/sync_chrome.py` so the chrome is identical site-wide (the checker requires it), and each `<head>` brought in step (light default, theme colour, font preloads, first-paint snippet; checkout pages keep their inline scripts byte for byte). Their bodies are untouched and unstyled. `/start/` and `404.html` have their own chrome; only their heads were synced. The whole-site check is at 0 FAIL, with one WARN per page for the first-paint snippet. |

Rebuild: `work/build_pages.sh` (partials in `work/` → `assemble.py` → `tools/art/build.py` → `sync_chrome.py`).

## Tokens

All tokens live at the top of `styles.css`; components never use raw values.

### Colour

| Token | Day | Night | Use |
| --- | --- | --- | --- |
| `--paper` | `#f5f0e6` | `#0e1222` | Page |
| `--paper-sunk` | `#ebe4d5` | `#0a0d1a` | Alternate chapters, footer |
| `--paper-raised` | `#fcfaf5` | `#171c31` | Figures, phone screen, row hover, featured tier |
| `--ink` | `#14182b` | `#efe9dc` | Headings, strong rules (15.5:1) |
| `--ink-2` | `#41465a` | `#c3bfb5` | Body copy (8.2:1) |
| `--ink-3` | `#5a5e72` | `#9a988f` | Captions, meta (5.6:1 on paper, 5.1:1 on sunk) |
| `--rule`, `--rule-soft` | `#d6cfbf`, `#e3dccd` | `#2a3049`, `#1f2439` | Hairlines |
| `--blue` | `#2b44c7` | `#9db0ff` | The one accent: numerals, links, marks, bars (6.7:1) |
| `--blue-deep`, `--blue-wash` | `#1f329b`, `#e1e3f2` | `#c0ccff`, `#1c2447` | Hover; quiet tint |
| `--btn`, `--btn-hover`, `--on-btn` | `#2b44c7`, `#1f329b`, `#fff` | `#8ea4ff`, `#adbdff`, `#0e1222` | Primary button (7.6:1 / 7.9:1) |
| `--green`, `--green-wash` | `#1d6b5b`, `#dbe9e1` | `#5fd3ba`, `#12332f` | The quiet secondary, only for "done / booked / sent" inside figures |
| `--plate`, `--on-plate`, `--on-plate-2` | `#2b44c7`, `#f7f3ea`, `#cfd6f7` | `#2a3fb5`, `#f3eee2`, `#cdd5fa` | The blue plate behind Fig. 1 |
| `--night`, `--on-night`, `--on-night-2` | `#10142a`, `#f1ece0`, `#b9b6c0` | `#171c31`, `#efe9dc`, `#b3b1b4` | Closing band |
| `--topline` | `#14182b` | `#8ea4ff` | 3px rule across the top of every page |

Every text/background pair on both pages was measured in the browser in both
themes at 1440 and 390 (`work/contrast.js`): no pair is under AA.

The crest keeps its own fixed palette, like a printed badge.

### Type

- **Display and numerals: Fraunces** (variable, weight and optical size; roman
  and italic). Warm, sturdy old-style serif with handsome figures. Optical sizing
  is automatic, so 88px headlines are crisp and 19px sub-heads are sturdy.
  Headlines are weight 480; the italic (weight 400, blue) marks the one phrase
  that matters in a headline, at most once per headline.
- **Text and labels: Libre Franklin** (variable weight). A Franklin Gothic: the
  plain-spoken American workhorse. Body 400, emphasis 650, buttons 600.
- Fallbacks are metric-matched with `size-adjust` (measured, see
  `work/metrics.js`) so the swap does not move the layout.

| Token | Size | Use |
| --- | --- | --- |
| `--t-display` | 42 → 88px (hero h1 caps at 76px, one phrase per line from 1181px) | h1 |
| `--t-h2` | 32 → 56px, line-height 1.04, tracking -0.018em | Chapter headlines |
| `--t-h3` | 22 → 28px | Row and item titles, price-list names |
| `--t-h4` | 19px | Small serif statements (glance strip, ledger rows) |
| `--t-lede` | 18 → 21px, line-height 1.5 | Ledes and chapter intros (max 58ch) |
| `--t-body` | 17px, line-height 1.6 | Copy (measure 46 to 62ch) |
| `--t-small` | 15px | Dense copy, table cells |
| `--t-note` | 13px | Margin notes, captions, legends |
| `--t-label` | 12px caps, tracking 0.12em, weight 600 | Kickers, chapter labels, table heads |

Big numerals: chapter numbers 32 → 52px blue; tier prices 44 → 62px; the ledger's
"200" up to 140px. At 1700px and wider the root font steps up to 18px and the
container to 1400px, so the page scales rather than floating in the middle.

### Space, shape, motion

- Space scale (4px base): `--s-1` 4, 8, 12, 16, 24, 32, 48, 64, 96, `--s-10` 128.
  `--gutter` 20 → 56px, `--gap` 16 → 32px, `--chapter` 64 → 116px (52px on phones).
- Shape: print is square. `--r-1` 3px for anything you press, `--r-2` 6px for
  figures, `--r-pill` for chips. Colour blocks and images have no radius.
- Shadow: two only. `--lift-1` under figures, `--lift-2` under the phone.
- Motion: `--ease` cubic-bezier(.2,.7,.2,1); `--dur-1` 160ms (hover), `--dur-2`
  320ms (menus, arrows), reveals 420ms.

## Grid and spacing rules

1. Twelve columns, max 1240px (1400px from 1700px up), `--gap` between columns.
2. **The rail.** Columns 1 to 3 are the left rail: chapter number and label,
   margin notes, small caps labels. Headlines and intros hang on column 4. This
   is the asymmetry that makes it read as edited, not templated; do not centre
   section heads.
3. **Every chapter opens with a 1px ink rule** across the full container
   (`.chapter-head::before`), then number + label in the rail, h2 on column 4
   (max 17ch), intro under it (max 58ch).
4. Hairlines (`--rule`) separate items; ink rules open and close a table or list.
   No card boxes for content. Boxes with a 1px ink border are reserved for
   figures (things that depict the product) and the bundle receipt.
5. Chapters alternate `--paper` and `--paper-sunk`. One blue plate (hero) and one
   night band (closing call to action) per page, never more.
6. Below 860px the rail folds into an inline "01 LABEL" line above the headline.
   Below 980px the header becomes the contents-page menu.
7. Prices are always set in Fraunces (`.price-num`), never in a pill or badge.

## Component inventory

**Chrome**
- `.site-header` (sticky, 3px `--topline`, frosted paper), `.brand`, `.brand-name`,
  `.nav` / `.nav-links` (underline grows on hover, stays on `aria-current`),
  `.header-tel` (from 1380px), `.icon-btn`, `#theme-toggle`, `.header-cta`,
  `.nav-toggle` + `.burger`, `.scroll-progress`.
- Phone menu: `.nav.open` is a full-screen **Contents** page: a generated
  "Contents" label, numbered serif links (CSS counter), `.nav-foot` with the
  button, email and phone. Without JavaScript the links wrap under the bar instead.
- `.tel`: the phone number in the header and menu is printed from `data-tel`
  (with an `aria-label`), so the header's text stays word for word what the
  legal and checkout pages had and their wording check still passes.
- `.mobile-cta` (sticky bar on phones: label, `.mobile-cta-call` tap-to-call, button).
- `.site-footer`: `.footer-grid` under a double rule, `.footer-brand`,
  `.footer-col`, `.footer-place`, `.footer-bottom`.
- `.cta-band`: `.cta-crest` (full crest), `.cta-copy`, `.cta-actions`, `.cta-alt`.

**Type and layout**
- `.chapter`, `.chapter-sunk`, `.chapter-head`, `.chapter-no` (`<b>` numeral +
  label), `.chapter-sub`, `.chapter-more`.
- `.kicker` (caps line with a short blue rule), `.lede`, `.label`, `.note`
  (margin note), `.prose` (linked body copy for long-form pages), `.vh`.
- `.split` / `.split-head` / `.split-side` / `.split-body`: a rail of 4 columns
  beside a list of 7.

**Controls**
- `.btn` + `.btn-primary`, `.btn-ghost`, `.btn-light`, `.btn-line-light`,
  `.btn-sm` (44px), default (48px), `.btn-lg` (56px), `.btn-block`; `svg.arr`
  nudges 4px on hover.
- `.more-link` (underlined sentence + arrow), `.index-link`, `.work-visit`.
- `.field` (label + input/select/textarea, underlined like a printed form),
  `.invalid`, `.field-error`.
- `.ticks` (drawn tick, no icon font), `.chip`, `.chip-ok`, `.chip-blue`.

**Prices**
- `.price-num` (Fraunces figures; `<small>` for "/mo").
- `.dots` (the dot leader) inside `.pl-line`, `.leaders li`, `.slip-lines li`, `.toc a`.
- `.pricelist` > `li` > `.pl-line` (`.pl-name` … `.dots` … `.price-num`) + `.pl-desc`;
  `.pl-group` label above a group.
- `.rate` / `.rate-head` / `.rate-row` (whole row is the link: name, note, plan,
  `.rate-amt`, `.rate-go`), `.rate-also` + `.leaders`.
- `.tiers` / `.tier` (subgrid, so price, plan, facts and buttons line up across
  columns), `.tier.featured`, `.tier-flag`, `.tier-name`, `.tier-price`,
  `.tier-plan`, `.tier-note`, `.tier-facts` (`dl`), `.tier-list`.
- `.slip` (the bundle receipt: `.slip-title`, `.slip-lines`, `.slip-sum`,
  `.slip-total`, `.slip-plan`); sticky beside the list on desktop.
- `table.care` (real table; stacks to labelled entries under 900px via
  `data-th`), `.care-includes`, `.care-list`.
- `.pay-list` with three small figures: `.pay-big` (50/50), `.schedule` /
  `.sch-seg` / `.sch-dep` (the Starter payment plan drawn to scale), `.pay-ways`.
- `.toc` (page contents with leaders: `.toc-n`, `.toc-t`, `.toc-p`), `.crumbs`.

**Figures (all HTML/CSS, `aria-hidden`, captioned as illustrations)**
- Fig. 1 `.hero-fig` > `.hero-plate` (blue), `.plate-label`, `.phone`
  (`.phone-bar`, `.thread`, `.msg-sys`, `.msg-out`, `.msg-in`, `.msg-meta`,
  `.msg-action`), numbered markers from `data-n`, `.fig-legend`, `.fig-credit`.
- `.vg` figure frame with `.vg-cap`; `.vg-lock` (`.vg-stack` notifications),
  `.vg-cal` (`.cal`, `.cal-c.busy`, `.cal-c.new`, `.vg-chips`), `.vg-list` (`.leads`).
- `.plates` / `.plate-col` / `.plate-fig` / `.flow-steps`: three ruled columns.
- `table.ledger` (the example week with single-hue bars, `--v` sets the length),
  `.ledger-note`, `.ledger-big`.

**Home-only**
- `.hero`, `.hero-grid`, `.hero-copy`, `.hero-cta`, `.hero-alt`, `.glance`.
- `.index` / `.index-row` (`.index-no`, `.index-title`, `.index-body`,
  `.index-aside`, `.index-price`).
- `.work-spread` / `.work-item` / `.work-lead` / `.work-media` / `.work-cap`.
- `.letter` (the founder's note, quoted from the About page), `.letter-side`, `.letter-sign`.
- `.timeline` (`.t-no`).

## Motion principles

1. **Quiet and short.** Transform and opacity only. Reveals are a 10px rise and
   fade over 420ms; a chapter's rule draws left to right in 500ms; ledger bars
   grow from the left with a 45ms stagger. Nothing loops.
2. **The product moves once.** Fig. 1's conversation arrives in order in the
   first 1.25 seconds, then rests. The header crest builds on the first page of
   a visit and on hover, as before.
3. **Never in the way.** Content is visible without JavaScript (`.reveal` only
   hides under `html.js`); `prefers-reduced-motion` removes every animation and
   transition; no scroll-jacking, no parallax.
4. **Hover is a small confirmation**: arrows lean 4 to 5px, rows lift to raised
   paper, links turn blue, images scale 2.5%.

## How the remaining pages should look

- **Services** (`/services/`). Page head like Pricing (crumbs, kicker, h1 with one
  italic phrase, lede, a contents list of the nine services with their prices on
  dot leaders). Then the nine services as `.index-row`s in three lettered groups
  (Websites; Automation; Consulting), each row: name, two sentences, ticks, price
  and link in the right column. No icon tiles.
- **Consulting** (`/consulting/`). The flagship long read. Hero with the audit
  button and Fig. 1 on the blue plate. "The hours that disappear" uses the full
  `table.ledger` with its fourth column ("Once it's automated") and the survey
  sources as a `.note` in the rail. "How it works" is four `.plate-col`s (two by
  two) each with its own `.vg` figure and the four-step `.flow-steps`. The
  calculator is a two-column `.split`: `.field` inputs grouped under small caps
  legends on the left; on the right a sticky result set like the bundle receipt
  (`.slip` pattern) with `#r-month` as a 100px+ Fraunces numeral, the four result
  lines on dot leaders, and the disclaimer as a `.note` touching the number. Setup
  prices as a `.pricelist`; Advisor, Partner and Launch bundle as a three-column
  `.tiers`; four steps as `.timeline`; the four questions as the FAQ pattern.
- **Work** (`/work/`). Each project is a full-width spread: image on eight columns
  with a 1px ink border, caption column of four with number, name at h2 size,
  the factual description as body copy, the stack/scope as a `dl` like
  `.tier-facts`, and the visit link. Alternate image left and right. No results
  claimed, so no metric tiles.
- **Process** (`/process/`). The four steps as tall chapters, each with its big
  numeral in the rail, what happens, what you do and what you get as three short
  ruled columns, and the support periods (14, 30, 90 days, six months) as a
  dot-leader list at the end.
- **FAQ** (`/faq/`). Single column on columns 4 to 10 with the rail holding a
  sticky group index. Each `details` is a ruled row: question in Fraunces h3 size,
  a plus that turns 45°, answer at body size and 62ch. Answers keep their wording
  exactly (they mirror the FAQPage schema).
- **Contact** (`/contact/`). `.split`: on the left the "what happens next" steps
  as a short `.flow-steps` list, contact details on dot leaders and the booking
  box as a `.slip`; on the right the form with `.field`s, checkboxes as ruled
  rows with 44px targets, the hCaptcha slot given a reserved height, and a
  full-width primary button. Status messages sit in a ruled strip, green for sent.
- **About** (`/about/`). The `.letter` pattern at full size: first paragraph as a
  large Fraunces quote, the rest as `.prose` on columns 4 to 9, margin notes in the
  rail for the facts ("Based in Baton Rouge", prices, timelines), signature at the
  end. A photo, when there is one, goes in the rail with an ink border.
- **/start/** (landing page, no menu). Minimal masthead (crest, name, phone,
  one button). Hero as on Home with Fig. 1. Then one screen each: the three
  services as index rows with prices, the `.rate` price list, the three projects
  as a row of three, four steps as `.timeline`, the closing band. One button
  label throughout.
- **City pages**. Page head with the city in the italic phrase, the local copy as
  `.prose`, Smilys Softwash as a single work spread, the `.rate` price list, the
  short FAQ, and the closing band with "in person anywhere in Greater Baton
  Rouge". A hairline list of the towns served sits in the rail.
- **Privacy and Terms**. Plain `.prose` at 62ch on columns 4 to 10, section
  numbers in the rail, a contents list at the top, "last updated" as a `.note`.
  No figures, no colour blocks. Wording untouched.
- **Checkout and success**. Narrow two-column `.split`: order summary as a `.slip`
  receipt (plan, price, what happens next) beside the Stripe embed in a
  paper-raised frame with an ink border. Inline scripts and ids stay byte for
  byte; only wrappers and classes around them change. Success page: a large
  Fraunces "Thank you", the receipt, next steps as `.flow-steps`.
- **404**. Keep the toppled knight. Big Fraunces "404" numeral in blue, one
  sentence, and the contents list (same as the phone menu) so the page is useful.

The chess pieces and drifting shards are retired from page heads in this
direction (the knight stays in the crest, on 404 and in the closing band).

## Honest gaps

- Only Home and Pricing are designed. The other pages carry the new header and
  footer but their bodies still use the old class names and are unstyled.
- Phone pages are long: Home is about 12,400px at 390px wide (16 screens;
  the old one was 10,200px) because it now shows four figures, the ledger and the
  founder's note. The screenshot tool's default limit of 14 stops cuts off the
  end; the shots here were taken with `--max 22`.
- The serif fallback is matched for headline sizes; Fraunces changes width with
  optical size, so small serif text (h3, price-list names) can still reflow by a
  few pixels on a slow first load. The italic file (81 KB) is not preloaded, so
  the blue italic phrase can swap a beat after the rest of the headline.
- `og-image.png`, `site.webmanifest` colours and the repository `README.md` still
  describe the old dark look and old fonts. `tools/art/render.js` was not re-run.
- The hero conversation is CSS-only and plays once; there is no replay control.
- The header phone number is CSS-generated text (see `.tel`): it is a working
  `tel:` link with an accessible name, but it cannot be selected or found with
  in-page search. The number is plain text in the hero, the closing band and the footer.
- On the two checkout pages the first-paint snippet is the old one (it cannot
  change), so a dark-preference visitor sees the day edition for an instant
  there before `main.js` applies the night edition.
- `table.ledger` and `table.care` switch to `display: block/grid` on phones, which
  some screen readers stop announcing as tables. Row headers and `data-th`
  labels keep the content readable in order, but it is not tested with a screen
  reader. No real-device or Safari testing was possible here (Chromium only).
- `subgrid` aligns the tier columns; on browsers before 2023 the tiers still
  read correctly but rows do not line up across columns.
- The "Most popular" flag on Business is carried over from the current site; it
  is the owner's claim, not something this redesign verified.
- Lighthouse was not run. Budgets by inspection: CSS 70 KB, main.js 20 KB, three
  fonts 178 KB, no layout-shifting images above the fold.
