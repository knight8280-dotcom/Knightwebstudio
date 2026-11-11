# Integration worklist

Triage of `$R/rollout-results.json`: 10 page groups, 602 sharedIssues entries and 188 openIssues entries read (the
349 "shared" entries are copies of them), plus the 40 `SHARED-CANDIDATE` markers.
`$R` = `/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh`.
This triage changed nothing in the repository.

## 0. Read this first

**The page stylesheets are already folded.** At 18:10, while this list was being made, a parallel step appended the
16 page sheets to `assets/css/styles.css` as sections 19 to 34 (each rule still scoped `[data-page="…"]`, markers kept),
removed `assets/css/pages/` and the page `<link>`s. The originals are in `$R/prefold/assets/css/pages/`.
- "§NN" is a section of `styles.css`. "L123" is a line of `styles.css` as folded (1,785 lines, 130,035 bytes). Shared
  rules are §01–§18 (L19–L820), page rules §19–§34. `main.js`, `sync_chrome.py` and README line numbers are current.
- CSS is 130.0 KB of the 140 KB budget. Every promotion below deletes more than it adds.
- Keep when pruning: the six `[data-page="home"] .quote` rules (§19) match nothing on purpose (testimonials are
  commented out). In §22 `.case-copy .label` wins over `.case .label` by source order only.

**Health of the site as triaged** (outputs in `$R/integrate/triage/base/`):
`check_site.py` 0 FAIL, 19 WARN (all the first-paint snippet, expected) · `sync_chrome.py --check` in step on 19 pages ·
`behaviour.js` 66 PASS · `contrast.js` AA on 19 pages × 390/1440 × both themes · `widths.js` no overflow 360–1920 on
19 pages · `smalltext.js` nothing under 12px, no target under 44px · fonts folder holds only the two new files · no
`color-mix`/`backdrop-filter`; `!important` only in `[hidden]` and reduced motion; `:has()` only inside `@supports`.

**Priorities.** P1: visible defect, accessibility failure, broken behaviour or a hard rule. P2: clear improvement, cheap.
P3: leave, with the reason. Every P1 and P2 was reproduced against `http://localhost:8720`; "Confirmed" says how.
Probe scripts `p1`…`p10` and screenshots are in `$R/integrate/triage/` (`base/*.txt`, `shots/*.png`).
Groups: PR pricing, CI city, LC legal+checkout, CF contact+faq, ST start, CO consulting, WP work+process, HO home,
SV services, AB about+404.

**Order that avoids rework:** P1s (A1, A2, D1, E1) → promotions P-1 to P-18 (they delete page rules) → P2s → rebuild
the pages whose markup changes (`kws_page.py`) → `compare.js` prefold against now at 390, 820, 1280, 1440.
Phone-height margins are thin on /start/ (6,186 of 6,200) and /pricing/ (10,410 of 10,500): re-measure after B2, B7, P-2, P-15.

---

## 1. SHARED FIXES

### A. Header and top strip (`styles.css` §06, `tools/chrome/header*.inc`, `head-script.inc`)

**A1 · P1 · Header button wraps to two lines.** Groups: all ten.
- Where: `.site-header .header-cta` (block at L289), every page with the standard header, 1100–1149px and 1280–1299px,
  both themes, at the top and scrolled.
- Wrong: "Book a free call" is a 54px two-line button instead of 44px. At 1280 the hidden `.header-tel` (134px) starts
  taking room: brand 216 + menu 590 + tel 134 + theme 44 + button 139 + gaps = 1,203px in a 1,184px row.
- Fix, inside the `@media (min-width: 1100px)` block at L289:
  `.site-header .header-cta { white-space: nowrap; } .nav-links a { padding-inline: var(--s-2); } .nav-links a::after { inset-inline: var(--s-2); }`
- Confirmed: measured 54px at 1100–1140 and 1280–1290 on `/` and `/pricing/`, in Chromium and Firefox 155 (`p1`, `p4`).
  Fix injected at run time: one line at every 10px from 1100 to 1400, top and scrolled, nothing sticks out (`p7`).

**A2 · P1 · Header cuts off its buttons when text is spaced or enlarged (WCAG 1.4.12).** Groups: PR, CF, CO, SV, AB, WP, CI.
- Where: `.header-inner` (L245), `.header-actions`; all widths.
- Wrong: the row cannot wrap and `body` clips. With the 1.4.12 text-spacing overrides the booking button is cut by 66px
  at 1280 (up to 114px between 1100 and 1400). With a 125% default font the menu button is 9px off a 390px screen and
  the booking button 91px off at 1280. A1's `nowrap` alone makes it worse (149px).
- Fix: `.header-inner { flex-wrap: wrap; row-gap: var(--s-1); }`. The actions drop to a second row only when they do not fit.
- Confirmed: measured (`p1`). A1 plus this rule injected: no change at normal settings from 360 to 1400; with text
  spacing, 125% and 150% nothing sticks out at 320, 360, 390, 820, 1280 (header 92–109px tall); the phone menu still
  opens (`p7`, `p9`). Left over: at 200% on phones the brand and the top-strip number overflow by 20–65px (B11).

**A3 · P2 · The phone menu flashes when the window crosses below 1100px.** Group: LC.
- Where: `.nav` in the `max-width: 1099.98px` block (L275–279), `transition: var(--fade)`. A resize, or a large tablet turned to portrait.
- Wrong: the full-sheet menu is drawn at opacity 1 and fades out over 300ms.
- Fix: transition only once the menu has been used. CSS: move `transition: var(--fade)` to `.nav.nav-anim`.
  `main.js` `setNavOpen()`: `nav.classList.add('nav-anim')` as its first statement.
- Confirmed: `/pricing/` resized 1440 → 1000: `#nav` opacity 1.00, 0.41 at 60ms, 0.06 at 150ms, hidden at 300ms (`p3`).

**A4 · P2 · 404: the header stops being sticky after four seconds.** Group: AB.
- Where: `head-script.inc` adds `.js` and removes it after 4s when `main.js` has not started (always, on `404.html`);
  then L799 `html:not(.js) .site-header { position: static; }` applies. Below 1100px.
- Fix: one line in §34: `html:not(.js) [data-page="notfound"] .site-header { position: sticky; }` (the static rule is
  for the in-flow menu, which the bare header does not have).
- Confirmed: `404.html` at 390: `sticky` at 0.3s, `static` at 4.6s (`p3`).

**A5 · P2 · Forced-colours mode hides the menu icon and the FAQ plus.** Group: SV.
- Where: `.burger` (L263–271, `background: currentColor`), `.faq-item summary::after` (L687, gradients), `.chip :checked + span` (L711).
- Fix: `@media (forced-colors: active) { .burger, .burger::before, .burger::after, .faq-item summary::after { forced-color-adjust: none; } .burger, .burger::before, .burger::after { background: CanvasText; } [aria-expanded="true"] > .burger { background: none; } .faq-item summary::after { background: linear-gradient(CanvasText, CanvasText) 50% / 100% var(--bold) no-repeat, linear-gradient(CanvasText, CanvasText) 50% / var(--bold) 100% no-repeat; } .chip :checked + span { outline: var(--bold) solid Highlight; } }`
- Confirmed: Chromium `forcedColors: 'active'`: the burger's background equals the page's, the plus has no image, a
  checked chip looks unchecked (`p8`, `shots/forced-header-390.png`). The fix itself was not injected.

**A6 · P2 · Brick reading line on the two checkout pages.** Group: LC.
- Where: `#scroll-progress` (in `header.inc`) on `/checkout/` and `/checkout/success/`: two-screen pages where brick is the error colour.
- Fix: `[data-page^="checkout"] .scroll-progress { display: none; }`.
- Confirmed: `header.inc` and `PAGES` in `sync_chrome.py` read: both pages get the standard header.

**A7 · P3 · /start/ header has no booking button under 600px** (`.site-header .header-book { display: none }`, L301). Group: ST.
Leave: measured at 390, brand 216 + toggle 44 + button 139 do not fit 350px; the top strip above it has the tap-to-call
number, the head has both buttons, the sticky bar follows after the first screen.

**A8 · P3 · Top strip is outside every landmark** (axe "region", moderate). Groups: ST, SV. Leave: inside `<header>` it
would stick with the header, and a second banner is worse.

**A9 · P3 · Skip link target has no `tabindex="-1"`.** Group: WP. Leave: current browsers continue from `#main`; add it
to `<main>` only if every page is rebuilt anyway.

### B. Tokens, base, layout (`styles.css` §02–§05)

**B1 · P2 · At night a paper object on a sand band has no fill, and a well on a card has none.** Groups: PR, CI, ST, AB.
- Where: L34 `--paper-2` night `#1C2233` against L37 `--card` night `#1D2333`: 1.01:1 (day 1.21:1). `--well` is `--paper-2`.
  On sand today: home (ticket, business card, the mocks in three vignettes), /consulting/ (phone, calendar, list,
  notifications), /work/ (browser), /start/ (three prints, ticket), city (print).
- Fix: make the night sand darker than the paper, as it is by day: `--paper-2: var(--L, #EEE6D5) var(--D, #0F131D);`
  Then card on sand is 1.18:1, a well on a card 1.18:1, paper to sand 1.04:1 (the band keeps its hairlines) and text
  contrast on sand rises. Afterwards delete `--well: var(--paper-3)` from `[data-page="city"] .city-meet` (§27).
- Confirmed: token arithmetic; `shots/pair-start-ticket-390.png`, `pair-home-vig-1280.png`, `pair-consulting-cal-390.png`
  (today beside the change). It moves the whole night theme a little: look at every page at night and re-run `contrast.js`.

**B2 · P2 · `--measure: 34em` runs long.** Groups: CF, AB.
- Where: L79; `.lede`, `.prose`, `.section-sub`, `.note`, `.steps p`, `.pricelist p`, `.container > p`. From 600px.
- Wrong: at 1440 prose runs a median 71–74 characters, 90th percentile 77, longest 81–82 (/terms/, /privacy/, /about/,
  city prose). The brief asks for 45–75. FAQ answers at their local 31em: median 67, longest 73.
- Fix: `--measure: 31em`; drop `max-width: 31em` from `[data-page="faq"] .faq-body` (§25).
- Confirmed: characters counted per rendered line (`p5`). Injected: phones unchanged; 1440 heights +0 to +5%
  (/terms/ 3,650 → 3,840, /about/ +81, home +22, /pricing/ 0) (`p10`). Check `[data-page="about"] .opening` (a fraction of the token).

**B3 · P2 · Long words are cut off, not wrapped.** Groups: CI, ST, WP, SV, LC, AB.
- Where: `body` (L129–133): `overflow-x: clip`, no `overflow-wrap`. Any heading, button, row or paragraph.
- Fix: `body { overflow-wrap: break-word; }`. Then delete `overflow-wrap` from `[data-page="privacy"] .prose`,
  `[data-page="terms"] .prose`, `[data-page="checkout"] .till :is(.status, .till-side p)`, `[data-page="checkout-success"] .till-side p`.
  Keep the `anywhere` ones on flex and grid items (`[data-page="work"] .browser-bar span`, `.case-facts a`, `[data-page="about"] h1`).
- Confirmed: code read; the shared part sets `overflow-wrap` only on `.bizcard-lines` and footer links.

**B4 · P2 · One-column grids have an `auto` track.** Groups: LC, AB, HO, SV.
- Where: `.page-head-split` L197, `.section-head-split` L212, `.grid` L214, `.split` L216, `.fig-art` L586, `.cta-inner` L724.
- Wrong: below its column breakpoint one unbreakable string, or enlarged text, widens every child past the screen.
- Fix: `grid-template-columns: minmax(0, 1fr)` on each base rule (the `min-width` rules already replace it).
  Then delete: `[data-page="privacy"] .split > *`, `[data-page="terms"] .split > *`, `[data-page="checkout"] .till > *`,
  `[data-page="checkout-success"] .till>*` (all `min-width: 0`; `.till` is a `.split`), and `.fig-art` from
  `[data-page="services"] :is(.fig, .fig-art)` and `[data-page="consulting"] .auto :is(.fig, .fig-art)`.
- Confirmed: code read; those local rules exist for exactly this.

**B5 · P2 · On desktop a focus ring is cut by the bottom edge of the window.** Groups: LC, SV, AB.
- Where: `html` (L126–128): `scroll-padding-bottom` exists only below 1100px.
- Fix: `html { scroll-padding-bottom: var(--s-5); }` at every width (the phone rule keeps its larger value); then
  `scroll-margin-bottom` can come out of `[data-page="services"] .menu a`.
- Confirmed: 90 Tab presses at 1440×900; stops ending flush with the edge: /terms/ 20, /privacy/ 15, /about/ 11, /services/ 2 (`p3`).

**B6 · P2 · `.wide-only` loses to any component that sets `display` later.** Group: SV.
- Where: L223, same weight as `.fig` (L585) and `.stack` (L774), which come later.
- Fix: move `@media (max-width: 979.98px) { .wide-only { display: none; } }` to the end of the shared part (after `.space-above`, L777).
- Confirmed: code order. Latent only: on all 19 pages at 390 every `.wide-only` element is hidden (`p2`).

**B7 · P2 · A split section head leaves 32px between title and intro on phones; a plain head leaves 16px.** Group: ST.
- Where: `.section-head-split` (L212) row gap plus `.section-sub`'s own margin; home (2 heads), /consulting/ (3), /pricing/ (2).
- Fix: `.section-head-split { row-gap: 0; }`; delete `[data-page="start"] .section-head-split { row-gap: 0; }` (§33).
- Confirmed: measured 32px against 16px at 390 (`p2`). Injected: home −32px, /consulting/ −48px, /pricing/ −32px at 390 (`p10`).

**B8 · P3 · `h1` dips from 60px to 52px at 980px.** Group: ST. Leave: it is the documented scale (38–60 below 980,
52–76 from 980) and all 19 headlines were set to it.

**B9 · P3 · `--fs-h1` (10.6vw) is too big for a 17-character line on phones.** Group: ST. Leave: /start/ and /about/
carry their own size; a lower slope re-wraps every phone headline.

**B10 · P3 · Font fallbacks (`size-adjust: 101%`) are not width-matched.** Groups: PR, CI, ST, SV, AB, LC. Headings and
ledes can re-wrap, and the price-strip note can change rows, when the fonts arrive. Cannot be tuned on this machine
(no Georgia, Arial, Roboto or Noto Serif). See NOT TESTED.

**B11 · P3 · Text-only enlargement to 200%.** Groups: CI, CF, WP, AB, ST. Brand and top-strip number overflow a phone;
`.ticket-head`, the `.tier` name against its price, the four-across board at 1280. Not an AA failure (page zoom
reflows cleanly). If touched: `flex-wrap: wrap` on `.receipt-head, .appt-head, .ticket-head` (L525).

**B12 · P3 · `.stack { justify-items: start }` (L774) shrinks a `.btn-row`, `.ticks` or lone button to its content.**
Groups: PR, AB, CO. Leave: six pages each stretch a different child (pricing card, about notes, contact talk, checkout
side, 404, consulting bundle); a shared stretch rule would move stacks that rely on the shrink.

**B13 · P3 · Layout parts that single pages adjust:** `.section-head-split { align-items: end }` with buttons in the
right column and no margin for a `.btn-row` in a head (/pricing/); `.page-head-aside` centred under a left-aligned head
at 600–979 (/about/, /contact/, /pricing/ each set their own); no two-column `.split` below 980 (/about/);
`.page-head-split` at 980–1099 cannot hold two large buttons (/start/). Groups: PR, AB, ST. Leave: one page each, already handled there.

### C. Buttons and motion (`styles.css` §07, §14, §17; `main.js`)

**C1 · P2 · A button pressed with a mouse stays lifted.** Group: ST.
- Where: `.btn:active` (L320) comes before `.btn:hover` (L339) at the same weight.
- Fix: in the hover block add `.btn:hover:active, .icon-btn:hover:active { transform: translateY(var(--hair)); }`.
- Confirmed: mouse down on a hovered button: `translateY(-2px)` stays; with the rule injected `translateY(1px)` (`p3`, `p7`).

**C2 · P2 · Revealed prints never lift on hover.** Group: ST.
- Where: `.js .reveal.visible { transform: none }` (L781, weight 0,3,0) beats `.print:hover` (L679, 0,2,0). Home,
  /start/, city: every print is `.print.reveal`.
- Fix: lift with the `translate` property: `.print:hover { translate: 0 calc(-1 * var(--s-1)); }` and
  `.print { transition: translate var(--t) var(--ease); }`. Same for `[data-page="work"] a.browser:hover`.
  Tell the motion-kit team that `.reveal` owns `transform`.
- Confirmed: hover at 1440 on `/`, `/start/`, `/web-design-gonzales/`: `transform` stays `none`, only the shadow
  changes; with the rule injected `translate: 0 -4px` (`p3`, `p7`).

**C3 · P2 · On phones a reveal plays behind the sticky bar.** Group: WP.
- Where: `main.js` L216 `rootMargin: '0px 0px -24px 0px'`; the bar is 69px tall below 1100px.
- Fix: use `-96px` when `#mobile-cta` exists and `matchMedia('(max-width: 1099.98px)').matches`; then remove
  `transition-delay: var(--t-slow)` from `.js [data-page="process"] .stamp.reveal` (§23).
- Confirmed: code read; bar measured 69px (`p8`).

### D. `main.js`: form, captcha, links, phone bar

**D1 · P1 · "Please fix the highlighted fields." stays after the fields are fixed.** Group: CF.
- Where: `main.js` L381–386 (the required fields' `blur` and `input` handlers) and L419; `/contact/`, where it is a brick box under Send.
- Fix: remember that this message is showing (`fieldsFlagged = true` at L419) and, after `validateField` in both
  handlers, `if (fieldsFlagged && !form.querySelector('.invalid')) { setStatus(''); fieldsFlagged = false; }`.
- Confirmed: submitted empty at 390 (three field errors and the status), then filled all three: 0 `.invalid`, status still shown (`p3`).

**D2 · P2 · hCaptcha's script is requested with the page on phones.** Group: CF.
- Where: `main.js` L285 `rootMargin: '900px'`; the slot is at y=1,542 on a 390×844 screen.
- Fix: `'300px'` (first focus in the form and the 4s backstop stay).
- Confirmed: request to hcaptcha.com 49ms after navigation, before the load event, with no scroll or focus (`p3`).

**D3 · P2 · hCaptcha is a white box on the night ticket.** Group: CF.
- Where: `main.js` `loadCaptcha()` L269; `#hcaptcha-slot` carries only `data-sitekey`.
- Fix: before appending the script: `captchaSlot.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');`
- Confirmed: slot markup read. The real widget is blocked in every tool: see NOT TESTED.

**D4 · P2 · Field errors are generic.** Group: CF.
- Where: `main.js` `validateField()` L316: "This field is required." for all three.
- Fix: by field id: name "Add your name.", email "Add your email address so we can reply.", message "Tell us a little
  about what you need." Keep the server's reason in the fallback line (README says it is deliberate).
- Confirmed: three identical messages after an empty submit (`p3`).

**D5 · P2 · A link to a closed service row relies on the browser opening `<details>`.** Group: SV.
- Where: `/services/` menu: 9 links, 5 to rows closed by default; each id sits on `.faq-body` inside the `<details>`.
- Fix, `main.js`: `function openTarget() { var t = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1))); var d = t && t.closest('details'); if (d && !d.open) { d.open = true; t.scrollIntoView(); } } openTarget(); addEventListener('hashchange', openTarget);`
- Confirmed: no such hook in `main.js`. `/services/#seo` and a tap on the "Brand" menu row open the row in Chromium
  and in Firefox 155 (`p3`, `p4`). Safari is untested, which is why the hook is worth its five lines.

**D6 · P2 · The sticky phone bar sits under the closing band's own booking button.** Group: HO.
- Where: `main.js` L230 `avoid` (only `#contact` and `.site-footer`).
- Fix: add `document.querySelector('.cta-band')` to `avoid`. Tell the closing-band team the class is observed.
- Confirmed: `/pricing/` at 390: bar shown while "Book a discovery call" is on screen at 5 of 58 scroll stops, about
  100px of scroll (`p5`, `shots/bar-over-band-390.png`).

**D7 · P3 · After a click on Send, focus falls to `body`** (the button is disabled). Group: CF. Leave: the status is a live region and Tab continues from the button.
**D8 · P3 · The bar can cover the lower edge of an element focused before it slid in.** Group: ST. Leave: the text stays visible (2.4.11 passes).
**D9 · P3 · Booking buttons open a new tab unannounced.** Group: HO. Advisory.
**D10 · P3 · The mailto fallback shows the raw server reason and no visible address.** Group: CF. Leave: a documented choice in README.

### E. Price strip and price board (`styles.css` §05, §09; page markup)

**E1 · P1 · Price strip overflows its column and cannot wrap.** Groups: CI, ST, HO, SV.
- Where: `.price-strip-nums` (L201–203, L218), `a.price-strip` (L199, L206). Four-price strips: home, /services/, /start/,
  four city pages. 380–392px wide; any width once text is spaced or enlarged.
- Wrong: (1) the figures are 353px wide in a 340–350px column: 13px into the gutter at 380, 3px at 390. (2) With the
  1.4.12 overrides "$8,000" is cut by 58–68px at 380–393 (9px at 360). (3) The link is a full-width block: 1,184px at
  1280 on /services/ and /consulting/, so its focus ring and tap area span the page. (4) Markup: no space between the
  `<b>` prices on home, /start/, /consulting/ and the four city pages, so the link reads "$1,000$2,000$4,000$8,000".
- Fix, CSS: `.price-strip { width: fit-content; max-width: 100%; } .price-strip-nums { flex-wrap: wrap; row-gap: var(--s-1); } .price-strip-nums b:last-child { padding-right: 0; }`
  and widen L218's padding to all phones: `@media (max-width: 599.98px) { .price-strip-nums b { padding: 0 var(--s-2); } }`
  (the smaller font stays under 380). Markup: a space between the `<b>`s in those seven mains, as /services/ has.
- Confirmed: measured on five pages at eight widths (`p2`). Fix injected: nothing over from 360 to 1280 (33px to spare
  at 390), two rows instead of clipping under text spacing, link 602px at 1280 on home (`p7`).

**E2 · P2 · Monthly amounts split at the slash in Firefox ("$167/" then "mo").** Group: PR.
- Where: `.tier-plan` text on home, /start/, four city pages.
- Fix: wrap each amount in `<span class="nowrap">` in those six mains, as /pricing/ already does.
- Confirmed: Firefox 155: home and city at 1100–1170 (3 tiers), /start/ at 360 and 1210–1300 (`p8`).

**E3 · P3 · `.board-head > p` (L407) sits in an `auto` track and squeezes the title when the claim is a sentence.** Group: CI. Leave: no page has a long claim now.
**E4 · P3 · `.tier` 4px side padding insets the tier text from the board's rules.** Group: ST. Leave: the hover fill needs it.

### F. Closing band, footer, paper objects (`styles.css` §11–§16; `tools/chrome/footer.inc`)

**F1 · P2 · Closing band: the appointment card is 259px wide, not 21rem.** Group: HO.
- Where: `.cta-inner` (L727, `minmax(0, 1fr) auto`) with `.appt { width: min(100%, 21rem) }` (L565); from 980px, all 13 bands.
- Fix: L727 `grid-template-columns: minmax(0, 1fr) 21rem`. A real bug, not a redesign; hand it to the closing-band team if theirs lands first.
- Confirmed: 258–259px at 980–1920 on four pages; 336px with the rule injected (`p2`, `p10`).

**F2 · P2 · Footer: the email breaks in the middle of a word at 760–960px.** Groups: CI, LC, WP, HO, SV, AB.
- Where: `footer.inc` Contact column; `.footer-col a { overflow-wrap: anywhere }` (L739) in a 153–198px column.
- Fix: `knightwebstudio1@<wbr>gmail.com` as the link text in `tools/chrome/footer.inc`, then `python3 tools/sync_chrome.py`.
  A real bug; hand it to the footer team if theirs lands first.
- Confirmed: the link box is 48px (two lines) at 760, 800, 820, 900, 960 and 44px from 979 (`p2`).

**F3 · P3 · `.cta-copy p` (L726) styles every paragraph in the band as a lede**, so city (`.cta-copy .fine`) and /start/
(`.write`) override it. Groups: CI, ST. Leave to the closing-band team; tell them those two lines sit under the buttons.
**F4 · P3 · Notes for the footer team.** Groups: CI, CF, AB, LC, HO, SV, ST. 1,138px tall at 390; the slim footer has
about 112px of empty ink; Zachary, Central and Baker (`.footer-place`, `--ink-3`) read as disabled; four Services links
all go to `/services/` (they can deep-link once D5 is in).
**F5 · P3 · Closing band consistency.** Groups: PR, WP, HO, SV. All 13 bands carry `.appt.on-paper.wide-only`; `reveal`
is on `.cta-inner` on nine pages and on none of the four city pages (handbook: never on a section wrapper). Leave to the band and motion teams.
**F6 · P3 · Cosmetic in mocks.** Group: CO. `.tag::before` dot nearly invisible at night; `.cal-day .fig-n` overlaps the
corners of neighbouring slots; a marker on the first `.leads` row sits on the hairline. Seen in `shots/pair-consulting-cal-390.png`. Leave.
**F7 · P3 · `.receipt-total b` (L532) cannot shrink:** a seven-figure calculator result overflows by 12px. Group: CO. Leave; P-8's rule is the fix if wanted.
**F8 · P3 · `.payplan` month blocks are 1.5:1 against the blue panel.** Group: CO. Leave: non-text, amounts legible, the terms are also in text.
**F9 · P3 · `.faq-item[open] summary::after` spills 3px; `summary` is a flex box** (inline markup in a question becomes its own item). Groups: CF, CI. Leave; pages use `&nbsp;`.
**F10 · P3 · Job ticket.** Groups: ST, WP, CF. The printed tick (`.ticket .steps > li::after`, L559) is cancelled by /start/ (L1742)
and /process/ (L1274), so only home prints it; the hanging `.stamp` (L556) gets its room three different ways (§23, §28, §33). Leave.
**F11 · P3 · `.fig` side-by-side rule (L592) is replaced by both pages that have a figure** (/services/, /consulting/). Group: SV. Leave; delete it only with B4.

### G. Markup on every page (`$R/pages/*/main.html`, rebuilt with `kws_page.py`)

**G1 · P2 · `role="list"` is on six pages and missing on thirteen.** Groups: CI, LC, ST, CO, WP, HO, AB.
- Where: `ul`/`ol` with `list-style: none`: `.ticks`, `.steps`, `.pricelist`, `.points`, `.board-tiers`, `.pills`,
  `.toc ol`, `.fig-legend`, `.receipt-lines`, `.bizcard-lines`. Now: /start/ 6, /consulting/ 5, /about/ 3, /work/ 3,
  /checkout/success/ 2, /process/ 1, every other page 0.
- Wrong: Safari with VoiceOver drops list semantics; `.steps` numerals are `aria-hidden`, so the step number is not read.
- Fix: add `role="list"` to those lists in every main. `.steps` first.
- Confirmed: counted in the HTML. VoiceOver itself: NOT TESTED.

**G2 · P2 · "(opens in a new tab)" is on some project links only.** Group: ST.
- Where: present on /start/ (3), /work/ (6), /about/ (3); missing on the home prints (3) and the city print (4 pages).
- Fix: `<span class="sr-only"> (opens in a new tab)</span>` in those links. Confirmed: counted in the HTML.

**G3 · P2 · The /services/ figure is named by its whole caption.** Group: CO.
- Where: `<figure class="fig reveal">` on /services/; the four on /consulting/ carry a short `aria-label`.
- Fix: `aria-label="How missed-call text-back works, step by step"`. Confirmed: HTML read.

### H. Tools and docs in the repository

**H1 · P2 · `tools/sync_chrome.py` treats an unknown flag as "sync every page".** Groups: PR, CI, CO, WP, HO.
- Where: L119–124: anything starting `--` except `--check` is dropped, so `--help` runs a full write.
- Fix: `bad = [a for a in args if a.startswith('-') and a != '--check']`, then `sys.exit(__doc__)` if any.
- Confirmed: code read (not run with a bad flag: it writes).

**H2 · P2 · README.md is out of date, and it is published.** Groups: ST, HO.
- Where: L9 "A home page plus eight pages"; L15 home row; L20 pricing row ("Three project tiers", "three care tiers");
  L27 `.about-wrap`; L86–88 "copies of the first three service cards"; L115 "Home story | The workbench with a ringing
  phone"; L150 and L577 "homepage footer"; L274–281 `work-card`, `.mini-work-grid`; L476–478 /start/ ("starting price",
  "one next step"); L563 "all ten entries" (there are fourteen); "Browser support" does not name container queries or `translate`.
- Fix: rewrite those lines to the built site. Confirmed: grep.

**H3 · P2 · `scene-bench` is drawn and used nowhere.** Group: HO.
- Where: `tools/art/build.py` L14, L42; `emblems.py` `bench()`, `BENCH_LABEL`; `scenes.py`.
- Fix: retire it together with README L115. Confirmed: no page holds the marker (grep over 19 pages).

**H4 · P3 · Scene SVGs have no `width`/`height` attributes** (an `auto` track cannot size them; 404 sets a width). Group: AB. Leave.
**H5 · P3 · Scratch tools (`$R/tools`, not shipped).** Groups: PR, CF, HO, SV, CO, AB. `kws_page.py` hover lint needs the
space in `(hover: hover)` and splits a selector on a comma inside `:is(… :not())` (its page-sheet lint gates nothing
now); `check_site.py` keeps a trailing comma in "prices new to this page" ("$125,"); `contrast.js`, `smalltext.js`,
`widths.js` do not open `<details>`; `widths.js` starts at 360; `shoot.js` needs `--max 30` on long pages.
**H6 · P3 · DESIGN.md (`$R`, not shipped) no longer matches the site.** All groups. Reference page head and
contents-list position; spec and data-table snippets (their `aria-label`s fail 2.5.3 as written); bundle panel; 404
block; facts shelf on city pages; closing band (`wide-only`, `reveal`); contact aside; legal heads use `.container`;
`role="list"`; "put the space inside the following `.l` span"; `(scripting: none)` instead of `html:not(.js)`; `.mark` on the last line.

---

## 2. PROMOTIONS

40 `SHARED-CANDIDATE` markers in §19–§34 (38 distinct blocks: privacy and terms carry one twice, checkout-success points
at checkout's). "Promote" = write the rule once in §01–§18 and delete the page rules listed. Where only one page uses
a shared component and overrides it, the promotion is a merge into the shared rule: the override and the shared
declarations it replaces both go.

### Promote

**P-1 · A price-list row whose price does not fit** (dangling leader). Markers: home `.offer` (§19), pricing "a long
name wraps under itself" (§24), start "a price that is a phrase" (§33); services does the same unmarked (§20).
- Still broken: /consulting/ at 360, "Online booking & reminders … $750" drops with a 52px leader stub (`p2`).
- Unified rule, replacing L442–444:
  `.pl-row { display: flex; align-items: baseline; gap: 0 var(--s-3); }` (no wrap)
  `.pl-name { flex: 0 1 auto; min-width: 0; font-size: var(--fs-h4); }`
  `.pl-price { margin-left: auto; font-size: var(--fs-h3); color: var(--ink); text-align: right; white-space: nowrap; }`
  `.pl-long .pl-price { font-size: var(--fs-h4); }`
  `@media (max-width: 1279.98px) { .pl-long { flex-wrap: wrap; } .pl-long .dots { display: none; } .pl-long .pl-price { flex-basis: 100%; margin-left: 0; text-align: left; white-space: normal; } }`
  `pl-long` marks a row whose price is a phrase (/start/ already has it six times).
- Delete: §24 `[data-page="pricing"] .pl-row`; §33 the two `.pl-long` rules (keep `.price-strip-note`); §20 the two
  `.pl-terms` rules and the `max-width: 599.98px` `.dots`/`.pl-row`/`.pl-price` block, giving its three `pl-terms`
  rows `pl-long` instead; §19 `.offer .dots` and `.offer .pl-row` once home's three rows carry `pl-long` (its name and
  price sizes stay local).
- Checked: nowrap with `min-width: 0` injected on /consulting/ at 360 and 390: no dropped price, no row wider than its list (`p10`).

**P-2 · One-word last lines.** Markers: home "one-word last lines" and the facts-shelf `.points span` (§19), faq "a
question breaks evenly" (§25), pricing "the plan line breaks evenly" (§24); city's last rule is the same, unmarked (§27).
- Unified rule (§04): `.btn, .faq-item summary, .tier-plan, .board-head > p, .board-extras dd, .points span, .spec-price small { text-wrap: balance; }`
  `.lede, .section-sub, .cta-copy p, .faq-body, .prose p, .steps p { text-wrap: pretty; }`
- Delete: §19 the two rules under the marker and `[data-page="home"] .points span`; §25 `summary{text-wrap:balance}` and
  `text-wrap` in `.faq-body`; §24 `text-wrap` in `.spec-price small`; §27 the last rule except `.board-extras div` and
  `.cta-copy .fine`; `text-wrap: pretty` in `[data-page="process"] .steps p` and in `[data-page="about"] :is(.lede,.opening)` (keep `.opening`).
  Page rules that choose the other value (contact, start `.steps p`) come later and still win.

**P-3 · Spec table.** Five markers in §24: below 1100px, popular tab, one-line buttons, shared rows, the table.
Only /pricing/ uses `.spec`. Merge the five blocks into §10 (L455–483) without the page prefix and remove what they
override: the 6.5rem label column and dashed rows (L458) and the inset-band `.spec .is-popular` (L466, L481).
Needs `.spec tr { position: relative }` and the `spec-what` class (already on the four cells). Delete the five blocks.
Compare /pricing/ at 390, 820, 1100, 1280, 1440 in both themes before and after.

**P-4 · Stacked table.** Marker "a stacked table row reads like a package card" (§24). Only /pricing/ uses
`.table-stack`. Merge into §10 (L500–515): split `.table-stack` out of the `:is(.table-stack, .ledger)` lists where
the two now differ, drop the 7rem label column (L506), and bring `[data-page="pricing"] .table td:last-child` and
`.table .btn { white-space: nowrap }` (from 760px) with it. Delete the five rules and those two.

**P-5 · Payment plan: the deposit is half the bar.** Marker in §24.
- Unified rule, replacing `.payplan-dep { flex-basis: 0 }` at L544: `.payplan-dep { flex: 0 0 calc(var(--w) * 1% - var(--s-0)); }` (from 600px).
- Delete: §24 `[data-page="pricing"] .payplan-dep`.
- Why shared: /consulting/'s bundle bar has the defect now: deposit 46.4–47.9% of the bar, against 49.5–49.7% on
  /pricing/ (`p2`); 49.6% on /consulting/ with the rule injected (`p10`).

**P-6 · Contents list without prices.** Markers in §29 and §30, identical; faq's "short contents list" in §25.
- Unified rule (§08): `.toc-plain a { min-height: var(--tap); padding-block: var(--s-2); font-size: var(--fs-sm); }`
  `@media (min-width: 600px) and (max-width: 979.98px) { .toc-plain ol { columns: 2; column-gap: var(--gap); } .toc-plain li { break-inside: avoid; } }`
  Add `toc-plain` to the `<nav class="toc">` on /privacy/ and /terms/.
- Delete: the first three rules of §29 and of §30. FAQ keeps its own two-by-two and rail rules (L-15).

**P-7 · A pinned column, and a split that holds a long word.** Same markers, §29 and §30.
- Unified: B3 and B4, plus `@media (min-width: 980px) and (max-height: 620px) { .split-sticky > :first-child { position: static; } }`
  (on both pages the pinned child is the `nav.toc`; it also guards home, /consulting/, /faq/ and the city pages).
- Delete: in §29 and §30 the `max-height: 620px` rule, `.split > * { min-width: 0 }`, `.prose { overflow-wrap }`.

**P-8 · Order slip and till.** Marker in §31; §32 repeats it.
- Unified, one block for both pages: `[data-page^="checkout"] .till { gap: var(--s-6) var(--gap-lg); }`
  `[data-page^="checkout"] .receipt { max-width: none; margin-bottom: var(--s-2); animation: kws-slip var(--t-slow) var(--ease) both; }`
  `[data-page^="checkout"] .receipt-total { container-type: inline-size; }`
  `[data-page^="checkout"] .receipt-total b { max-width: 100%; font-size: calc(var(--fs-title) * 1.25); font-size: min(calc(var(--fs-title) * 1.25), 12cqi); text-align: right; overflow-wrap: anywhere; }`
  and `@keyframes kws-slip` once.
- Delete: those rules and the keyframes in §31 and in §32. The `min-width: 980px` grids differ and stay.

**P-9 · Form select and status line.** Markers "the longest option fits beside the arrow" and "what main.js says back"
(§28). /contact/ is the only form with either; merge into §14.
- `.field select` (L698): `padding-right: calc(var(--s-6) + var(--s-1)); text-overflow: ellipsis;` instead of `var(--s-7)`.
- `.form-status` (L715–717): the three §28 rules (boxed error, boxed success with its tick, the fade) replace `.form-status.ok`.
- Delete: §28 `.field select` (its under-380 line can stay there) and the three `.form-status` rules.

**P-10 · Browser frame on a sand band.** First half of the marker in §22.
- Shared: add `--well: var(--paper-2);` to `.browser` (L620). On sand `--well` is `--paper-3`, where the 12px address in
  `--ink-3` is 4.10:1; on paper-2 it is 4.62:1 (token arithmetic; `contrast.js` passes today only through the override).
- Delete: `--well` from `[data-page="work"] a.browser`. The link form of the frame stays local (L-16).

**P-11 · A flipped case row swaps its tracks.** Second marker in §22. Only /work/ uses `.case`.
- Shared (L676): `.case-flip { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); }` beside `.case-flip > :first-child { order: 2; }`.
- Delete: `[data-page="work"] .case-flip`.

**P-12 · Business card on a narrow phone.** Marker "a narrow card tightens its top row" (§26).
- Still broken: home's card tagline is two lines at 360, 375 and 390; /about/'s is one line everywhere (`p2`).
- Unified rule (§12): `@media (max-width: 599.98px) { .bizcard { --crest: 2rem; } .bizcard-top { gap: var(--s-2); } .bizcard-top span { letter-spacing: 0; word-spacing: -.1em; } }`
- Delete: nothing; /about/'s `@container` rule stays for its 356–403px aside at 980–1100 (L-7).
- Also add `on-paper` to home's card (`bizcard tilt reveal`) so it matches /about/ (`bizcard tilt on-paper`) after dark.
- Checked: rule injected on home: one line at 360, 375, 390 (`p10`).

**P-13 · A heading that opens a `.prose` block.** Marker in §26.
- Shared, after L387: `.prose > :first-child { margin-top: 0; }`. Delete `[data-page="about"] .prose>:first-child`.

**P-14 · Flat labels: fill on a card, balanced rows.** Marker in §27.
- Fill: fixed at the token by B1; delete `--well` from `[data-page="city"] .city-meet`.
- Rows, shared (in place of the flex row at L367): `.pills { list-style: none; display: block; margin-bottom: calc(-1 * var(--s-2)); text-wrap: balance; }`
  and on `.pills li` (L368): `display: inline-flex; align-items: center; gap: var(--s-1); margin: 0 var(--s-2) var(--s-2) 0; vertical-align: top;`
- Delete: `[data-page="city"] .pills` and `.pills li` (keep `.pills .ico`). Home's town row (3 + 3 + 1, "Baker" alone) gets the fix.

**P-15 · Steps: a tick list inside a step; numeral beside the title on a phone.** Marker in §27. The same idea,
unmarked, is in §23 (`.steps-no + div { display: contents }`), §21 (`.path`) and §22 (`.case .ticks`).
- Unified: `:is(.pricelist, .steps, .case) .ticks { margin-top: var(--s-3); color: var(--ink); font-size: var(--fs-sm); }` (in place of L446)
  `@media (max-width: 599.98px) { .steps > li > div { display: contents; } .steps > li > div > :not(:first-child) { grid-column: 1 / -1; } }`
- Delete: §27 `.steps .ticks` and its phone block; colour and size from `[data-page="work"] .case .ticks` and
  `[data-page="consulting"] .path .ticks`; the `display: contents` lines in §21 and §23 where they then repeat it.
- Check at 390 afterwards: injected on top of today's rules the phone part changes /start/ 6,186 → 6,134px, home +16px,
  /checkout/success/ +8px, /contact/ 0 (`p10`). Look at the home and /start/ tickets before keeping it.

**P-16 · The brush under a marked word.** Marker "a brush mark on a first line" (§26). Three pages define the same
paint-in keyframes (`about-sign`, `kws-city-brush`, `kws-start-brush`); city alone puts the stroke behind the letters.
- Shared (L177–181): `.mark { isolation: isolate; }`, `.mark::after { z-index: -1; transform-origin: 0 50%; }` and one
  `@keyframes kws-brush { from { transform: scaleX(0); } }`.
- Delete: the three keyframes; `isolation`, `z-index` and `transform-origin` from the page rules. Each page keeps its own
  `animation:` line (naming `kws-brush`) and offsets. Whether every page's mark paints in is the motion team's call.

**P-17 · Ledger total on a narrow phone.** Marker in §21. Only /consulting/ has a ledger; fix the shared rule.
- Shared, in the `max-width: 759.98px` block after L511: `.ledger tfoot tr { grid-template-columns: auto minmax(0, 1fr); } .ledger tfoot .num { white-space: normal; text-align: right; text-wrap: balance; }`. Delete the §21 block.

**P-18 · A figure marker on a thread note.** Marker in §21. Shared: `position: relative` on `.thread-note` (L606).
Delete `[data-page="consulting"] .thread-note`.

### Leave local (one page)

- **L-1** Facts shelf three and two at 980–1099 (§19): home is the only page with five facts (`.points span` goes to P-2).
- **L-2** Price-list row that opens (§20): /services/ only; it depends on D5.
- **L-3** Focus ring round a field and its unit (§21): the calculator only. Keep it with the calculator block.
- **L-4** `.appt-lines` as a terms list on the job ticket (§23).
- **L-5** `h1` capped for a 15-letter word at 320px (§26).
- **L-6** Brush offsets lifted clear of the next line (§26): about's headline only (after P-16).
- **L-7** About's `@container` card rule for its narrow aside at 980–1100 (§26, after P-12).
- **L-8** hCaptcha room held and scaled under 380px (§28).
- **L-9** `line-height: 1` for an inline `.display` figure (§30, /terms/).
- **L-10** `.status.error` as the page's main message (§31): /checkout/success/ never sets `.error` (it hides the line).
- **L-11** /start/ head set in fixed lines so nothing re-wraps when fonts arrive (§33).
- **L-12** Board extras as a gold price list and a sentence beside the board's button (§33): city uses a different, inline form.
- **L-13** 44px hit area for a link inside a sentence (§33): two links on /start/.
- **L-14** Footer at the bottom of a short page (§34): at 1440×1300, 820×1180 and 1920×1200 no other page is shorter than the window (`p3`).
- **L-15** FAQ's two-by-two contents list and desktop rail (§25).
- **L-16** `a.browser`, the frame as a link with hover and pressed states (§22).

---

## 3. PAGE-LEVEL OPEN ISSUES

### Fix during integration (cheap, clearly right)

| Page | Issue | Fix |
| --- | --- | --- |
| home, /start/ | Corbel Books print still says "Fintech SaaS · Product site & app UI"; /work/ and /about/ say "Bookkeeping software · Product site & app screens" | Use the /work/ wording on both (owner decision 6) |
| home | Business card turns navy at night; /about/'s stays cream | Add `on-paper` to the card (P-12) |
| home | Card tagline on two lines at 360–390 | P-12 |
| home | Town labels break 3 + 3 + 1 on phones | P-14 |
| home, /start/, city ×4 | "$167/mo" can split at the slash in Firefox | E2 |
| home, /start/, /consulting/, city ×4 | Price-strip figures run together in the link name | E1 markup |
| home, city ×4 | No "(opens in a new tab)" on project links | G2 |
| 13 pages | No `role="list"` on restyled lists | G1 |
| /services/ | Figure named by its whole caption | G3 |
| /services/ | Menu links to closed rows depend on the browser | D5 |
| /consulting/ | At 360 one price-list row drops its price and leaves a leader stub | P-1 |
| /consulting/ | Bundle bar: the deposit is 46–48% of the bar, not half | P-5 |
| home, /consulting/, /pricing/ | 32px between a split section title and its intro on phones | B7 |
| /contact/ | Error box stays after the fields are fixed | D1 |
| /contact/ | Captcha white on the night ticket; its script loads with the page | D3, D2 |
| /process/ | Stamp can land behind the phone bar | C3 |
| 404 | Header un-sticks after 4s | A4 |
| /checkout/, /checkout/success/ | Brick reading line | A6 |

### Leave

| Page | Issue | Reason |
| --- | --- | --- |
| /about/ 5,158px, city 7,210–7,416px, /faq/ 3,448px, /contact/ 3,702px, /services/ 5,675px at 390 | Over their length targets (4,300 / 6,500 / 3,200 / 3,600 / 5,500) | 1,138px of each is the phone footer, which is being rebuilt; both reviewers accepted these |
| home 12,585px at 360 | Over 12,500 at 360 only | 11,979px at 390 now |
| /consulting/ 14,556px at 360 | Over 14,000 at 360 only | 13,984px at 390 |
| /pricing/ | First price 77px under the fold on a 375×553 screen | The fix would print the prices a third time |
| /pricing/ | Add-ons list stops at 46rem at 900–979; 70px of sand under the Bundle button; care head bottom-aligned, consulting head top-aligned | Cosmetic; each is a layout choice, none a defect |
| /pricing/ | Commerce plan line breaks oddly at 1100–1104px | A 5px range |
| /services/ | Five services are closed rows by default, desktop included | Deliberate for length (owner decision 19) |
| /services/ | The board is fully in the first screen only from about 1920×1080 | Needs a fourth page-head form |
| /consulting/ | Right 40% of the head empty at 1280+; plans stacked at 980–1228; "Four steps" sub-heading is `wide-only` text; 80px under the no-script note | The handbook allows no aside here; reviewers accepted the rest |
| /consulting/ | The calculator's first `.calc-inputs` rule (L1090) is replaced by L1111 | Works; tidy only |
| city | "What we build for / Denham Springs / businesses" sets in three lines; head is one column at 1100–1279; "Send an enquiry" hidden in the head under 600px | The copy is fixed; the enquiry button is in the closing band |
| city | `--em` values must be re-measured if the display face, tracking or a town name changes | For whoever changes type (`$R/work/city/measure1.js`) |
| /work/ | Three bands share one structure; project names are full-size `h2` | Deliberate, accepted by both reviewers |
| /process/ | Focus ring on "what it costs" is 46px tall and overlaps the line above; ticket notches are painted with `--paper` (the ticket must stay on plain paper) | Cosmetic; a constraint to know |
| /contact/ | 78px empty slot above Send when hcaptcha.com is blocked | Only for blockers and test tools; it stops a jump for everyone else |
| /checkout/ | The 416px reserve while Stripe loads is a guess; a large cream card at night for up to a minute; with the 60–76px `h1` Stripe's Pay button may sit under the fold at 1280×800 | Needs the real form (NOT TESTED) |
| /checkout/success/ | `h1` at 85% under 980px differs from /checkout/; title sets in three lines at 600–650px; numerals drawn with a CSS counter | Forced by the frozen script strings and the checker's sentence rule |
| /about/ | Card left-aligned with empty paper beside it at 600–979; tilted card corners 6px outside the column; ten short lines in the opening at 980–1100 | Reviewer-marked optional |
| 404 | PAGE NOT FOUND sign unreadable at 184px on phones | The big 404 and the `h1` say it |
| /privacy/, /terms/ | Contents list does not mark the section being read | Needs new JavaScript |
| /start/ | Price figures 31px under the fold on an iPhone SE in Safari (375×548) | Both buttons and "Fixed prices" are on screen |

---

## 4. OWNER DECISIONS

1. Spelling "enquiry" site-wide (buttons, form, FAQ answers, structured data). Default: "enquiry", as on the live site.
2. Enquiry form has no phone field. Default: none (field names were frozen).
3. /contact/ has no business card and no owner name. Default: the large tap-to-call line; mock-up of the card version at `$R/work/contactfaq/look/try-card-1440.png`.
4. /contact/ package menu: four labels shortened (Starter website, Growth Audit, Booking & reminders, Custom automation). Default: short labels; values and prices unchanged.
5. /work/ pictures are not captures of the live sites (a photo collage, a hero card, a link-preview card) yet sit in browser frames. Default: the existing files; wanted: three captures about 1600×1000, under 120 KB, same file names.
6. Corbel Books label: "Bookkeeping software · Product site & app screens", "Card payments (Stripe)", "Bank sync (Plaid)" against the live "Fintech SaaS · Product site & app UI". Default: mixed today (new on /work/ and /about/, old on home and /start/).
7. /work/ headline and eyebrow ("Three recent projects", "Our work"); /process/ stamp "No surprises" and step 03 "private preview link (a staging link)". Default: the new wording.
8. /process/ lists terms for Starter, Business and Commerce only, as the live page does. Default: One-page rows not shown (ready: "One revision round", "14 days").
9. /pricing/ does not show the Launch bundle's payment plan ($1,500 down, then $500 a month for 3 months); /consulting/ does. Default: not on /pricing/.
10. /start/: the eyebrow names Christian on a page that says "we"; "Standard is" dropped from the payment terms; the care-plan sentence replaced by a priced row; two tap-to-call buttons added. Default: as built.
11. City pages: the ticks "Core Web Vitals tuning" and "Local SEO configuration" are the only jargon; the "Live" flag and "Questions" eyebrow were removed. Default: ticks kept, labels gone.
12. Home now states things that were only on the live consulting page: "on accounts in your name", per-automation setup prices, "Google" and "Facebook" as sources in the example list. Default: kept.
13. /consulting/ mock text that is new illustration (dates and a fourth row in the enquiry list, three notifications, "Example: one quote request"); the lede lost "like everything else we do". Default: kept.
14. New checkout microcopy ("Your order", "Payment details", "Back to pricing", the no-script sentence, "The payment terms are on the terms page."). Default: kept.
15. Frozen checkout scripts: Stripe's form is styled Stripe-blue (#0570de button, 4px corners, white fields), and "Payment confirmed — thank you" breaks before its dash on phones. Both need an edit to the byte-frozen scripts. Default: untouched.
16. "Waking up secure checkout" can last a minute with no sign of activity, because nothing on the site may loop. Default: a static line.
17. Price-board tiers (home, /start/, city) link straight to checkout for Starter, Business and Commerce, with no visible cue. Default: unchanged, the same targets as the live site.
18. Home services are two-column rows, not the three-column table. Default: rows.
19. /services/: five of nine services are closed rows until tapped. Default: closed (page 5,675px at 390 against a 5,500 target).
20. Closing band and footer are being rebuilt: should the appointment card show on phones, and does the band animate in? Default: card from 980px only; `reveal` on nine of thirteen bands.

---

## 5. NOT TESTED

- **Safari, iOS or macOS.** WebKit cannot launch on this machine. At risk: the subgrid spec table from 1100px; the `translate` and `rotate` properties; `text-wrap: balance`/`pretty` (17.5+); container queries and `cqi` (city headline, about card, checkout slip); `:has()` on the checkout pages; CSS columns with `break-before` (/work/ at 760–979); `display: contents` in steps; `summary` as a flex box with an `h3` inside; a link opening a closed `<details>` (D5); the home hero's percentage negative margin on a grid item; the masked brush.
- **Firefox.** Only spot checks in this pass (header wrap, links into closed rows, "/mo" splitting; Firefox 155 at `$R/work/pricing/fix/pw`). Earlier full passes covered /pricing/, /work/ and /process/ only.
- **A real phone or tablet.** "On the first screen" was measured at 390×844 (the whole screen), not 390×664 with Safari's bars or 360×640, except on /start/ and /pricing/.
- **Font swap.** The metric-matched fallbacks have never been used: no Georgia, Arial, Roboto or Noto Serif here. Layout shift with stand-in fallbacks measured 0.003 to 0.068; the city headline fit (`--em`) was calculated.
- **The real hCaptcha widget** (blocked in every tool): its size in the held slot, the dark theme (D3), the scale under 380px. **A real enquiry** through Web3Forms, and the mailto fallback.
- **The real Stripe form** in the new payment sheet: its height (the 416px reserve), white on cream, 310px inner width at 390, both themes; the server waking; /checkout/success/ with a real session.
- **Calendly and Plausible** (blocked in tools; only the wiring is checked).
- **Screen readers** (VoiceOver, TalkBack, NVDA): list roles (G1), the `h3` inside `summary`, the roles on stacked tables, figure labels.
- **Inside closed `<details>`**: `contrast.js`, `smalltext.js` and `widths.js` do not open the five service rows, thirteen FAQ answers or the city FAQs (the services group checked an all-open copy by hand).
- **Below 360px and above 1920px; phones in landscape; print.** Windows High Contrast beyond Chromium's emulation. Text-only zoom in a real browser (emulated here with the root font size).
- **Browsers without subgrid, `:has()` or container queries**: the fallback layouts were described, not looked at.
- **Speed.** No Lighthouse or real-network run; the CSS is one 130 KB render-blocking file.
- **Scripts off, after the fold**: checked per page by the reviewers before it, not since.
- **The fold itself.** The parallel step was comparing prefold with the folded site (`$R/integrate/cmp-fold*`); its result was not read for this list.
- **The fixes in this list.** A1, A2, B1, B2, B7, C1, C2, E1, F1, P-1, P-5, P-12 and the phone part of P-15 were tried by injecting CSS at run time. The rest are recommendations from reading the code.

---

## Appendix: reported, not listed above

Does not reproduce now:
- Typing dots finish before they are seen (HO): both typing bubbles (home, /services/) sit inside a `.reveal`, which holds them until seen.
- Dangling price-list leaders on home, /pricing/, /start/, /services/ (PR, ST, HO, SV): gone on those pages through local rules; one row left on /consulting/ at 360 (P-1).
- Brush cutting the "p" of "published" on /pricing/ (CI, PR): the mark is on "up front" now. On home ("hours back", third of four lines) the stroke clears the next line (`shots/mark-home-390.png`).
- "The page scrolls sideways" with enlarged text (several): `body` clips, so nothing scrolls by hand; the content is cut off instead. Kept as A2, E1, B3.
- Home-only header override (HO): already removed by the fix pass; home wraps like every page (A1).
- Footer floating on short pages other than 404 (AB): none is shorter than the window at the three sizes tried.
- Appointment card on phones on home (WP, HO): all 13 bands carry `wide-only`.
- `.case` and `.board-foot` overrides on city pages (CI): gone; city uses `.split.split-even`, and only /start/ restyles the board foot.
- `.payplan .fine` bottom margin in a carded plan, and a carded plan cramped under 440px (PR): no page has a carded plan.
- `.more-link` making a sentence's line taller (PR): no page has one inside a sentence.
- Ledger total overlapping at 347px and at 125% text (CO): fixed in the page rule (P-17 moves it).
- Extra-stylesheet warning and page-sheet byte budgets (HO, PR, CO, CF, WP, AB): gone with the fold.
- A link to a closed service row "does nothing" outside Chromium (SV): it opens in Firefox 155 too; Safari unknown (D5).

Merged into another entry: card `--well` (B1, P-14); `.split` and sticky workarounds (B3, B4, P-7); `.fig-art` (B4);
`.receipt` torn-edge margin and slip price (P-8); select padding and boxed status (P-9).

Not a defect, noted only: `.steps` typed numerals against the checker on /checkout/success/; `.vig` side padding on
phones (home sets its own); `.phone-label` wrapping at the 15rem default (both pages set a wider phone); figure mocks
other than the phone have no built-in "Example" line (/consulting/ writes its own); no white token for third-party
forms; `.seal` has no built-in turn; Playwright full-page screenshots replaying one-shot animations inside width
queries; `text-wrap: balance` breaking hyphenated names (pages use `.nowrap`).
