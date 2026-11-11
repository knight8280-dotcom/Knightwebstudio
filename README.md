# KnightWebstudio — business website

The marketing website of KnightWebstudio, a one-person web design, automation
and small-business consulting studio in Baton Rouge, Louisiana. Plain HTML, CSS
and JavaScript — **no build step, no dependencies, no npm install**. Serve the
folder and it works (see [Run it locally](#run-it-locally)).

## The design in two sentences

**The well-run shop.** Every page is built from things you would find in a good
local business — the painted sign, the price board, the job ticket, the receipt,
the appointment card, the business card — drawn on warm paper in ink,
sign-painter's blue and Red Stick brick, so that a roofer on a phone reads it as
local, plain-spoken and carefully made. Light is "open for business"; the dark
theme is the same street after closing.

Most visitors are owners of local service businesses on a phone, so the phone
view is the design and the desktop view is the same thing with more room.

## Pages

Nineteen pages, each with its own title. Sixteen of them also carry a
description, a canonical URL and Open Graph tags. The other three are kept out
of search results (`noindex`): the two checkout pages have a description and a
canonical URL but no Open Graph tags, and the not-found page has a title only.
The menu reaches eight pages; privacy, terms and the four city pages are
linked from the footer; `/start/`, the two checkout pages and the not-found
page are reached by link only.

| URL | Contents |
| --- | --- |
| `/` | Home: the hero (shop front, an example text-back, the four prices), three services with their prices and one line each, one missed call and the automations that follow it (short), three projects, the four steps in brief (job ticket), the price board, who you work with |
| `/services/` | All nine services, each with its price: a service menu, then the six website services plus growth consulting, Google profile & reviews, and automation. Three are set out in full and six are rows that open |
| `/consulting/` | Consulting & automation: where the week goes (worked example table), the four automations (one line and a picture each) and the Launch bundle, the revenue & time calculator, the four steps in brief with setup prices, Advisor/Partner monthly plans |
| `/work/` | Three live projects as full case rows, the local one first |
| `/process/` | Four-step "no surprises" explainer |
| `/pricing/` | Four website packages as one comparison table, how you pay (the payment plan drawn to scale), add-ons, consulting and automation prices with the Launch bundle, four care plans |
| `/faq/` | Fourteen answers, with FAQPage schema |
| `/contact/` | Enquiry form, spam honeypot, saved drafts, "what happens next" |
| `/privacy/` | Plain-English privacy notice — see [Privacy page](#7-privacy-page) |
| `/terms/` | Plain-English terms: 50/50 payments, the payment plan, 7-day invoices, card/ACH via Stripe or check, late interest, revision rounds per package, who writes the copy, care plan cancellation. The signed project agreement controls the details (cancellation fees are deliberately not listed here) |
| `/checkout/`, `/checkout/success/` | Stripe embedded checkout for deposits and care plans, and the confirmation page it returns to. See `STRIPE_INTEGRATION_TODO.md` |
| `/start/` | Landing page for ads, emails and posts: every service with its price, pricing tiers, selected work, the four steps, one call to action. No menu. See [Landing page](#8-landing-page-start) |
| `/about/` | First-person About page for Christian Knight: background, how he works, selected work and contact details. The founder photo is intentionally left out for now — add one later beside the business card in the page head if wanted |
| `/web-design-baton-rouge/`, `/web-design-gonzales/`, `/web-design-prairieville/`, `/web-design-denham-springs/` | Local service-area pages: unique copy per city, Smilys Softwash as local work, published prices, a short city FAQ, contact + booking CTAs. Linked from the footer's "Areas we serve" column |

**Keep the copy short.** The pages were trimmed on purpose (November 2026): each
page says what you get and what it costs, and leaves the how-exactly for the
free call or the Growth Audit. Every price stays on its page. Before adding a
paragraph, check whether it gives a visitor less reason to get in touch.

Every page also carries the top strip (city and tap-to-call number), a
header, a footer and (except `/contact/`, `/privacy/`, `/terms/`, the
checkout pages and `404.html`) the sticky phone bar with a Call button and the
booking button. Below 1100px the menu is a full-screen sheet and the standard
header's "Book a free call" button is hidden; `/start/`, which has no menu,
keeps that button in its header from 600px, and the not-found page's header
is the brand alone. The phone number is always in the top strip; from 1280px
the standard header shows it too, once that strip has scrolled away.

Also built in: light/dark theme toggle (light is the default; a saved choice
wins, otherwise a device set to dark gets the night theme; an inline script
applies it before first paint so there is no flash), sticky
header, mobile menu, scroll reveal
animations, `prefers-reduced-motion` support, keyboard accessibility, skip
link, Open Graph tags for link previews, and JSON-LD structured data for
Google.

## File layout

```
index.html              Home
services/index.html     One directory per page, so URLs are /services/ etc.
consulting/  work/  process/  pricing/  faq/  contact/  about/  start/
privacy/  terms/  checkout/  checkout/success/
web-design-baton-rouge/  web-design-gonzales/  web-design-prairieville/  web-design-denham-springs/
404.html                Not-found page
site.webmanifest        Installable-app metadata and icons
assets/css/styles.css   The one stylesheet: the shared design system (tokens at the top, contents list in its header),
                        then the page-only rules, one block per page, each rule scoped with [data-page="…"]
assets/fonts/           Fraunces (soft) and Figtree, self-hosted variable WOFF2
assets/js/main.js       Settings, theme, menu, scroll reveals, phone bar, booking buttons, the contact form, analytics
assets/js/calculator.js The consulting page's calculator (loaded on that page only)
assets/img/             Project images (work-*.jpg), logo.svg, PNG app icons, the link-preview image
tools/chrome/           The one true copy of the header, footer, phone bar and first-paint snippet (*.inc)
tools/sync_chrome.py    Copies that chrome into every page; --check reports drift
tools/art/              The crest, the seal and the street scene, as code
server/                 The small Stripe checkout server (hosted on Render, not on GitHub Pages)
STRIPE_INTEGRATION_TODO.md  How payments are set up, and what is done by hand
favicon.ico             16/32/48px icon for browsers and Google results
robots.txt              Search engine directives
sitemap.xml             Sitemap for search engines
CNAME                   The custom domain, read by GitHub Pages
.nojekyll               Tells GitHub Pages to serve the files as-is
```

GitHub Pages publishes the whole folder, `tools/` and this README included.
Nothing in there is secret; keep it that way.

## Editing across pages

There is **no build step**: every page is plain HTML that you can open and
edit. The trade-off is that the header, footer, phone bar and the small
first-paint script are duplicated in every page. Never edit them in a page:
edit the partial in `tools/chrome/` and copy it out, or the pages will drift.

```bash
python3 tools/sync_chrome.py                  # write the chrome into every page
python3 tools/sync_chrome.py faq/index.html   # or only the pages named
python3 tools/sync_chrome.py --check          # change nothing; exit 1 if any page has drifted
```

Run it after you change anything in `tools/chrome/`, after you add a page, and
with `--check` before you publish. It touches only what it owns: the
first-paint `<script>` in the `<head>`, `<body data-page="…">`, everything
between `<body>` and `<main>`, the phone bar and the footer. It never touches a
page's title, description, Open Graph tags, JSON-LD or `<main>`.

| Partial | What it is |
| --- | --- |
| `topbar.inc` | Skip link and the top strip: the city and the tap-to-call number |
| `header.inc` | The standard header: crest and name, the menu, the theme button, "Book a free call" |
| `header-start.inc` | `/start/`: no menu on purpose, one booking button |
| `header-bare.inc` | `404.html`: the brand only (that page loads no script) |
| `footer.inc`, `footer-start.inc`, `footer-bare.inc` | The full footer, and the slim one on `/start/` and the 404 page |
| `skyline.inc` | The Baton Rouge skyline that tops every footer |
| `phone-bar.inc` | The sticky "Call" and "Free 30-min call" bar for phones and tablets |
| `head-script.inc` | The first-paint snippet: sets the theme before anything is drawn and marks the page as script-enabled |

`PAGES` at the top of `tools/sync_chrome.py` says which header and footer each
page gets, its `data-page` name, and whether it carries the phone bar (the
contact, legal and checkout pages do not: the form or the text is the point).
The script also keeps `aria-current="page"` on the right menu link.

Asset and link paths are **root-absolute** (`/assets/…`, `/pricing/`) so the
same markup works from any directory depth. That relies on the site living at
the domain root, which it does.

The home page repeats, in short form, three services with their prices, the
three projects, the four process steps and the four package prices (the price
board). `/start/` and the four city pages repeat prices and projects too.
Update the full page and its copies together.

**Heading levels.** One `<h1>` a page. On the home page, section titles are
`h2` and the titles inside them `h3`. Where a small title sits directly under
the `h1`, it is `<h2 class="h3">` — an `h2` for the document outline, sized like
an `h3` (the classes `h2`, `h3`, `h4` and `title` only set a size). Keep that
pattern, or Lighthouse will flag skipped heading levels.

## How a page is put together

```html
<body data-page="pricing">
  … top strip and header (from tools/chrome/) …
  <main id="main">
    <section class="page-head">  <div class="container"> eyebrow, h1, lede, buttons, price strip </div> </section>
    <section class="section section-first" id="…"> <div class="container"> … </div> </section>
    <section class="section section-sand" id="…">  <div class="container"> … </div> </section>
    <section class="cta-band on-blue"> … </section>
  </main>
  … phone bar and footer (from tools/chrome/) …
  <script src="/assets/js/main.js?v=3" defer></script>
</body>
```

- **Asset versions.** Every page links the stylesheet as
  `/assets/css/styles.css?v=3` and the script as `/assets/js/main.js?v=3`
  (the 404 page has no script). GitHub Pages lets browsers keep both files for
  ten minutes, so a visitor who had the old files would otherwise get new HTML
  with an old stylesheet or script. Whenever you change `styles.css` or
  `main.js`, raise the number by one in all 19 pages in the same commit
  (for example `grep -rl 'styles.css?v=3' --include=*.html .` lists them),
  and keep every page on the same number. `calculator.js` (used only by
  /consulting/) carries the same number; raise it with the others. Fonts and
  images are not versioned: give a changed one a new file name instead.

- **`data-page`** names the page for the stylesheet: `home`, `services`,
  `consulting`, `work`, `process`, `pricing`, `faq`, `contact`, `about`,
  `start`, `city` (all four city pages), `privacy`, `terms`, `checkout`,
  `checkout-success`, `notfound`.
- **Bands.** Every band is a `.section` holding one `.container`. Plain paper
  and `.section-sand` alternate; `.section-tight` is a shorter band and
  `.section-first` the one under the page head. A page ends in the blue closing
  band (`.cta-band`), or on plain paper (legal, checkout, contact, 404).
- **Page head.** Three forms: commercial (eyebrow, `h1`, lede, one button row,
  the price strip), reading (eyebrow, `h1`, lede: FAQ, legal, checkout) and
  split (`.page-head-split` with one object beside the head from 980px:
  pricing, contact, about, `/start/`). The home hero is its own.
- **Shared parts** are written once in sections 01 to 18 of `styles.css` and
  used by class name: buttons (`.btn`, `.btn-primary`, `.btn-lg`, `.btn-quiet`,
  `.btn-row`), the price strip, the "On this page" list (`.toc`), the price
  board (`.board`), dot-leader price lists (`.pricelist`), the package table
  (`.spec`), the care-plan table (`.table.table-stack`), the time sheet and
  ledger (`.sheet`, `.ledger`, `.bigfig`), the receipt and the payment plan
  drawn to scale (`.receipt`, `.payplan`), numbered steps and the job ticket
  (`.steps`, `.ticket`), the appointment and business cards (`.appt`,
  `.bizcard`), the phone, calendar, enquiry list and notification mocks
  (`.fig`, `.phone`, `.cal`, `.leads`, `.notice`, `.vig`), project prints and
  case rows (`.print`, `.case`, `.browser`), the FAQ list (`.faq`), form
  fields, tick lists, flat town labels (`.pills`), notes (`.note`), the stamp
  and the seal. To see how one is written, copy it from a page that uses it,
  and check that page's block of the stylesheet for a rule that touches it:
  every page adds a few rules of its own. `/pricing/` shows the most shared
  parts in one place; its block (section 24) adds the head's contents card,
  the price groups and the bundle.
- **Page blocks.** Rules that only one page needs live in that page's block of
  `styles.css` (sections 19 to 34, in the order of `PAGES`). Every selector
  there is scoped with `[data-page="<name>"]`, so a page rule cannot reach
  another page: the selector starts with it, or with `.js ` or
  `html:not(.js) ` in front of it where the rule depends on scripts running.
  The two checkout pages share a few rules through `[data-page^="checkout"]`.
  Reuse a shared part before writing a page rule.
- **Tone scopes.** `.on-blue` (the price board, the bundle, the closing band)
  and `.on-ink` (top strip, footer) re-point the colour tokens for everything
  inside them, so the same classes work there. A paper object that sits on blue
  (a receipt, the appointment card) carries `.on-paper` and stays cream.
- **Motion.** Add `reveal` to a block that should rise in as it scrolls into
  view (never to anything on the first screen, and never to a wrapper that
  holds a whole section). It only applies when scripts run; without them, and
  with reduced motion, everything is simply there. A reveal owns `transform`,
  so a revealed thing that also moves under the pointer uses the `translate`
  property. Nothing loops for ever.
- **Scripts off.** Every page reads in full without JavaScript: the menu shows
  as plain links, FAQ answers are `<details>`, the calculator shows its default
  results, booking buttons fall back to `/contact/`.

### Adding or editing a page

To **edit** a page, open its `index.html` and change what is inside `<main>`.
Leave the `<head>` alone unless the page's title or description really is
changing (and then change the Open Graph tags and JSON-LD with it), and never
edit between `<!-- art:NAME -->` markers or in the header and footer.

To **add** a page:

1. Copy the folder of the page most like it (`faq/` for a reading page,
   `services/` for a commercial one) and rename it. The folder name is the URL.
2. In the copy's `<head>`, set the title, description, canonical URL, Open
   Graph tags and the JSON-LD breadcrumb.
3. Replace what is inside `<main>`, building from the shared parts above.
4. Add the page to `PAGES` in `tools/sync_chrome.py` (its `data-page` name,
   which header and footer, phone bar or not) and to `PAGES` in
   `tools/art/build.py`, then run `python3 tools/sync_chrome.py`.
5. If it needs rules of its own, add a block at the end of `styles.css` with
   every selector scoped `[data-page="<name>"]`: tokens only (no colour codes),
   the six breakpoints only, hover rules inside `@media (hover: hover)`.
6. Add the URL to `sitemap.xml`, link to it from somewhere, and check it at
   360px and 1440px wide in both themes.

No inline `style=""` attributes, except a custom property that carries data
(`style="--w:50"` for a bar's share). No second stylesheet, no web-font or
script CDN, no framework.

## Make it yours

The notes below say where each thing lives. Two blocks are marked `EDIT ME` in
the source: the site settings at the top of `assets/js/main.js` and the
testimonials block in `index.html`.

### 1. Business name, crest and artwork

The wordmark reads **KnightWebstudio** in full, in the header and footer —
search for `brand-name` in `tools/chrome/`, edit every partial that has it,
and run `python3 tools/sync_chrome.py`.

The mark is the **Charger shield**: a chess knight's head cut into facets in
shades of the sign-painter's blue, inside a riveted blue shield with a navy
field and a gold-leaf inner line.

| Where | What |
| --- | --- |
| Header, every page | Charger shield; builds itself on a visit's first page, then again on hover |
| Footer, business card (home, About) | Charger shield |
| Home hero | The street scene: a brick shop front signed YOUR BUSINESS, on a Baton Rouge street. It turns to night with the dark theme |
| `/start/` head, 404 page | The same street scene, small; on the 404 page its sign reads PAGE NOT FOUND |
| Pricing head | The round "Fixed prices" seal |
| Every footer | The Baton Rouge skyline (inline SVG in `tools/chrome/skyline.inc`); after dark its windows and bridge lamps are lit |
| `assets/img/logo.svg` | The standalone mark: the SVG favicon, the JSON-LD logo and the app-icon source |
| `favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png`, `og-image.png` | Rendered from the same artwork |

The chess pieces and drifting "shards" of the earlier design were retired in
the November 2026 redesign, and so was the workbench drawing.

`assets/img/crest.svg` (the full crest: the shield with crossed swords and a
name ribbon) is kept at its old address on purpose. No page uses it, but an
email signature or a profile outside the site may link to it, so do not
delete it. `build.py` no longer rewrites it; it is still drawn by
`full_crest()` in `tools/art/emblems.py` if it ever needs redrawing.

**All of it is drawn in code, in `tools/art/`.**

| File | What it does |
| --- | --- |
| `emblems.py` | Draws the crest (`charger`), the small favicon mark, the seal and the street scene's frame, and holds both palettes |
| `scenes.py` | The street scene's shapes (long, so kept apart). Its fills come from `SCENE_PALETTE` in `emblems.py`, except two that are the same by day and at night and are written in place: the street lamp's glow (`#F3C66B`) and the glare on the shop window (`#fff`) |
| `build.py` | Writes the drawings into the pages between `<!-- art:NAME -->` markers, and writes `assets/img/logo.svg` |
| `render.js` | Renders `favicon.ico`, the three PNG app icons and `assets/img/og-image.png` from the same drawings |

The pages carry the art inline between `<!-- art:NAME -->` markers (`crest-header`,
`crest-footer`, `crest-card`, `seal`, `scene-street`, `scene-notfound`), which
are overwritten on every build — never edit between them. To change any artwork,
edit `emblems.py` or `scenes.py`, then:

```bash
python3 tools/art/build.py              # rewrites the inline art in every page, and logo.svg
python3 tools/art/build.py index.html   # or only the pages named (logo.svg is then left alone)
node tools/art/render.js                # re-renders favicon, app icons and the link-preview image (needs Playwright)
```

Run `render.js` only when the crest, its palette or the street scene changed:
the icons and the link-preview image are pictures of them. If nothing changed,
`build.py` reports "0 page(s) updated" and leaves every file as it was.

The crest keeps fixed colours (the `PALETTE` in `emblems.py`), so it looks the
same by day and at night, like a painted sign. The street scene is themed: it
carries its own day and night palette (`SCENE_PALETTE`). The crest's build
animation lives under "Motion" in `assets/css/styles.css`; every drawing rests
in its finished state, so a visitor with reduced motion, or a crawler, sees the
complete artwork.

### 2. Contact details

The contact address is `knightwebstudio1@gmail.com`. It appears in every
page's phone menu, footer and JSON-LD (the first two come from
`tools/chrome/`; in every footer the address sits in a `<span>` with a
`<wbr>` after the `@`, so it breaks there when it has to), on the business card, in `contact/index.html`, `privacy/index.html`
and the checkout pages, and in `assets/js/main.js` (the form's mailto
fallback) — a project-wide search-and-replace is the safe way to change it.

The phone number is `(225) 255-0837`. It appears as a `tel:+12252550837` link
in every page's top strip, header, phone menu, sticky phone bar and footer
(all in `tools/chrome/`), on the business card, the contact page, the About
page, `/start/`, the checkout pages and the 404 page, and as
`"telephone": "+1-225-255-0837"` in every page's JSON-LD block.

The footer previously held three social icons pointing at `href="#"`. Once the
site became seven pages that was twenty-one dead links, so they were removed.
Send me real profile URLs and they go back in.

### 3. The contact form

The form lives in `contact/index.html` and posts to
[Web3Forms](https://web3forms.com), which relays submissions to the inbox
its access key was issued to (see the note below). Three hidden inputs
configure it:

```html
<input type="hidden" name="access_key" value="…">
<input type="hidden" name="subject"    value="New enquiry from knightwebstudio.com">
<input type="hidden" name="from_name"  value="KnightWebstudio website">
```

The access key is **public by design** — it sits in the page source, which is
how a static site receives mail without a server. It is not a credential.

> **The key decides where mail goes, not the address shown on the site.**
> Web3Forms issues each key to one inbox. The current key was issued to
> `knightwebstudio1@gmail.com` in September 2026, replacing one tied to the old
> `knightwebsitesllc@gmail.com` inbox. If the address ever changes again,
> create a key for the new inbox at [web3forms.com](https://web3forms.com),
> paste it into the `access_key` input in `contact/index.html`, switch hCaptcha
> on for it in the Web3Forms dashboard, and send one test enquiry from the
> live site.

**Spam protection**, in three layers:

1. A `botcheck` honeypot checkbox — hidden from people, and Web3Forms discards
   any submission where it is set.
2. Web3Forms' own server-side spam checks, on by default.
3. **hCaptcha**, using Web3Forms' shared zero-config sitekey
   (`50b2fe65-b00b-4b9e-ad62-3ba471098be2`) — no account or keys needed.
   It is loaded **after the page**, not with it: when the captcha's place in
   the form comes into view, on first focus in the form, or four seconds after
   `main.js` starts, whichever comes first. A captcha iframe present at
   load can take focus and drag the scroll position down the page, and it also
   put a third-party request on the critical path for every visitor.
   The script URL **must** keep `?recaptchacompat=off`. Without it hCaptcha
   also adds a `g-recaptcha-response` field, Web3Forms' free plan rejects the
   submission as reCAPTCHA (a paid feature), and every visitor lands on the
   mailto fallback. Web3Forms' docs require this ("make sure reCaptchaCompat
   is false").

> **hCaptcha must also be switched on in the Web3Forms dashboard.** The widget
> on the page stops casual bots, but only the dashboard setting makes the
> server *reject* submissions without a valid token. Without it, a bot posting
> straight to the API still gets through.

**How the widget and the guard interact** — this combination bit us once:

- If the widget is on screen and unsolved, submission is blocked with an inline
  message and the page scrolls to it.
- If the widget never rendered at all, the form still submits, rather than
  trapping a real prospect behind a broken third-party script.

That second case is only safe when the dashboard setting is **off**. With it
**on**, a submission carrying no token is rejected server-side, and the visitor
falls through to the mailto fallback — which looks to them like the form
"opened my email app instead of sending". If that happens, the widget is not
rendering; check the browser console on the live page for an hCaptcha error.

When a send fails, the status line now names the server's reason, e.g.
"Couldn't send that (Captcha verification failed)", so the cause is visible
without opening devtools.

**Drafts are saved as you type.** Name, email, business, the chosen package,
selected services and the message go to `localStorage` (debounced, ~400ms) so a half-
written enquiry survives a tab switch or an accidental back button. Cleared on
a successful send. Nothing is transmitted; every read and write is wrapped in
try/catch so private mode or a full quota can never break the form.

**If the POST fails for any reason** — bad key, network drop, service outage —
`assets/js/main.js` opens the visitor's email client with the enquiry
pre-filled and *deliberately does not clear the form*, so nothing they typed is
lost.

Note that Web3Forms only accepts submissions from a browser. Testing with curl
returns HTTP 403 ("use our API in client side"); that is expected, not a
misconfiguration. Test from the live site instead.

To switch providers, change the `action` URL and remove the three hidden
inputs. Basin and Formspree work with the existing JavaScript unchanged.

### 4. Colours, type and breakpoints

**Tokens.** Every colour, type size, space, radius, shadow and duration is a
custom property at the top of `assets/css/styles.css` (section 02), and the
rest of the stylesheet uses those and nothing else. Each colour is one line
holding both themes, day first and night second:

```css
--paper: var(--L, #F6F0E4) var(--D, #131722);   /* the page */
--ink:   var(--L, #1A2238) var(--D, #F3ECDD);   /* headings */
--blue:  var(--L, #2C46C4) var(--D, #9DB0FF);   /* pressable: buttons, links */
--brick: var(--L, #A83C26) var(--D, #F0907A);   /* notice this */
--gold:  #F0C369;                               /* only on blue or on the footer */
```

| Tokens | What they are |
| --- | --- |
| `--paper`, `--paper-2`, `--paper-3`, `--card` | The page, sand bands, wells and raised paper (cards, tickets, fields) |
| `--ink`, `--ink-2`, `--ink-3` | Headings, body copy, captions |
| `--line`, `--line-2`, `--ctl` | Hairlines, stronger rules and dashes, form-field outlines |
| `--blue`, `--blue-deep`, `--blue-tint`, `--on-blue` | Pressable things, their hover, the tick's circle, text on a blue button |
| `--brick`, `--brick-tint` | "Notice this": eyebrows, numerals, bars, the stamp, errors |
| `--board`, `--footer`, `--gold`, `--cream` | The painted-sign blue, the footer's ink, gold leaf and cream text on both |
| `--fs-h1` … `--fs-cap`, `--measure` | The type scale (17px body, nothing under 12px) and the reading width, about 65 characters |
| `--s-0` … `--s-9`, `--gutter`, `--gap`, `--pad`, `--stack`, `--sec` | The 4px spacing scale and the fluid layout spaces |
| `--r-xs` … `--r-pill`, `--shadow-1` … `--shadow-3` | Corner radii and shadows |
| `--t-fast`, `--t`, `--t-slow`, `--ease` | Durations and the one easing curve |

The colour rule: **blue means pressable**, **brick means "notice this"**, and
**gold only ever sits on blue or on the dark footer**. Nothing inside an
illustration is blue, so that nothing blue is ever unpressable. Light is the
default theme; night is the same street after closing, and each is a finished
design. `site.webmanifest` and each page's `theme-color` carry the day paper,
`#F6F0E4`; `tools/art/render.js` repeats four day colours for the icons.

If you change a colour, re-check contrast in both themes: text needs 4.5:1,
large text and control outlines 3:1.

**Two typefaces, two files.** Headings, every price and numerals are set in
**Fraunces** (soft, weight 600; `assets/fonts/fraunces-soft.woff2`); text and
labels in **Figtree** (`assets/fonts/figtree.woff2`). Both are open-licensed
(SIL OFL), self-hosted variable fonts, preloaded in each page's `<head>`. No
italic is loaded, so emphasis is `<strong>`, never `<em>`.

**Six breakpoints**, and only six, written phone first:

| Width | What changes |
| --- | --- |
| 380px | Below it is a small phone: the top strip reads "Baton Rouge", the brand shrinks, the phone bar's label shortens |
| 600px | Button rows sit side by side; headline lines break where they are meant to; leaders appear in the contents list |
| 760px | Two and three columns; stacked tables become tables; the footer is four columns |
| 980px | Split layouts and the page head's aside sit side by side; the headline steps up |
| 1100px | The desktop menu; the package table becomes one table; the price board is four across. Below it: the full-sheet menu and the sticky phone bar |
| 1280px | The phone number shows in the header once the top strip has scrolled away |

### 5. Your work

The Work page holds three live projects, the local one first, each with an
image taken from the site itself and a link out. GamersPulseHQ, an
in-progress prototype, was removed from the site in October 2026:

| Project | What it is | Image source |
| --- | --- | --- |
| Risen Health | Online store for a family-owned peptide supplier (added September 2026) | its own Open Graph card |
| Corbel Books | Bookkeeping software: product site and app screens | its own Open Graph card |
| Smilys Softwash | Local exterior-cleaning business (quotes live; card payments being set up) | its own before/after roof photo |

Images live in `assets/img/work-*.jpg`, all 1200px wide and under 90 KB. To add
a project, copy one `<section>` holding an `<article class="case">` in
`work/index.html` (every second one takes `case-flip`, and the bands alternate
paper and `section-sand`), drop a matching image in `assets/img/`, and update
the text. The first row is the one on screen at load, so nothing in it has a
`reveal` class and its image uses `fetchpriority="high"`; in every other row
the write-up fades in and the image lazy-loads. The project also belongs in
the home page's projects row and on `/start/` (three `.print` links in a
`.grid.grid-3`, which is three across from 760px) and in the About page's
list; with a fourth project, give those rows `.grid-4` instead. In those
rows the caption under a name is written in two halves, the kind and what was
built, around `<span class="sep"> · </span>`: where the print is too narrow for
the longest caption on one line, the halves stand on two lines.

All descriptions are factual — taken from each site's own copy — with no
invented metrics. Keep it that way: a result line you can't defend is worse than
no result line.

### 5a. Consulting page and calculator

`/consulting/` sells the work beyond the website: a free online check, the
Growth Audit, setup projects and monthly plans. Two rules keep it honest:

- **The time table is a worked example, labelled as one.** Every row shows its
  arithmetic (e.g. "10 bookings × 8 minutes"), and the note under the table
  says the numbers are not a measurement of the visitor's business. The two
  survey figures quoted above it are named in the small print under the table.
- **The calculator is the visitor's own numbers.** `assets/js/calculator.js`
  runs only on that page, stores and sends nothing, and the HTML ships with
  the default results already written in, so the page reads correctly without
  JavaScript. If you change a default input value, recalculate and update the
  result figures in the HTML to match. The disclaimer under the result, the
  FAQ answer and the terms all say it is an estimate, not a guarantee. Never
  turn it into a promised result anywhere on the site.

### 5b. Pricing

**Every price is fixed. Never write a range, "from", "starting at" or
"ballpark"** anywhere on the site: a range invites the buyer to pick their
own number. A package's price covers exactly what its column in the package
table lists; anything beyond that is agreed in writing before work starts.

**One way to write a price.** Always with the dollar sign and a comma
(`$1,000`, never `$1000`). In a price list, a table or any other compact price
line a monthly amount is `/mo` (`$500 or $1,000/mo`); in a sentence it is
"a month" ("Care plans are $125, $300, $600 or $1,000 a month"). FAQ answers
keep their own wording, because they must match the structured data.

Current published prices:

| Item | Price |
| --- | --- |
| One-page | $1,000 |
| Starter | $2,000 |
| Business | $4,000 |
| Commerce | $8,000 |
| Automation add-ons | $750 each |
| Brand identity | $1,500 |
| Care — Basic | $125/month |
| Care — Essential | $300/month |
| Care — Growth | $600/month |
| Care — Commerce | $1,000/month |
| Growth Audit & action plan | $350 (comes off a project booked within 30 days) |
| Strategy session | $150 |
| Google profile & reviews setup | $500 |
| Missed-call text-back setup | $750 |
| Online booking & reminders setup | $750 (same as the booking add-on) |
| Lead follow-up system | $1,500 |
| Custom automation workflow | $1,500 each |
| Advisor plan | $500/month |
| Partner plan | $1,000/month |
| Launch bundle (Starter + Google profile & reviews + text-back) | $3,000 ($1,500 down, then $500/mo for 3 months) |

This README is served on GitHub Pages (the site uses `.nojekyll`, so files
are copied as-is). Keep competitor price bands and market-research notes
out of it.

**One-page** ($1,000, added October 2026) is a single page with a contact
form, 1 revision round, client-supplied text, 14 days of support, live in as
little as 7 days. It exists so price-sensitive prospects have a yes; its
button goes to `/contact/?package=onepage` because there is no Stripe deposit
price for it yet. **Basic care** ($125/month, added October 2026) suits
one-page and Starter sites: 1 small change a month within 5 business days,
client keeps domain and hosting renewals current; its button goes to
`/contact/?package=care` for the same reason. Add `onepage-deposit` and
`basic-care` to Stripe, `STRIPE_PLANS_JSON` and `checkout/index.html`'s
`PLAN_DETAILS` to sell them through checkout.

Every package also shows the payment plan from the terms: 50% down,
then about a third of the rest each month for 3 months (Starter: $1,000
down, then about $333/mo). The pricing page draws it to scale.

Starter is an **information website** (up to 5 pages: who the business is,
what it offers, how to reach it). It was raised from
$1,500. Each price appears in `pricing/index.html`, the four project prices
again on the home page's price board, the project prices plus three care tiers
(Essential, Growth, Commerce) in every page's JSON-LD `OfferCatalog`, and
the Basic $125/month, Essential $300/month, Growth $600/month and Commerce
$1,000/month care figures in the FAQ answer about care plans and the services
page. The project tiers are also on `/start/` and the four city pages. Search
for the old figure before changing one.

The services page puts a price beside each service, in its menu and again on the
service itself, taken from the same tiers: design
and build "$1,000, $2,000 or $4,000", e-commerce $8,000, care "$125, $300, $600 or $1,000/mo",
brand identity $1,500, redesigns "priced as a new site" (a redesign is one of
the same packages), and SEO "in every build", because every tier includes SEO
basics.

Consulting and automation prices appear on `/consulting/`, the pricing page's
"Consulting & automation" section, the services page, the home page, `/start/`, the four
city pages, the FAQ, the About page, the terms and every page's JSON-LD
`OfferCatalog`. Search for the old figure before changing one. None of them
has a Stripe price yet, so their buttons go to `/contact/?package=…` with
`check`, `audit`, `strategy`, `gbp`, `textback`, `booking`, `followup`,
`automation`, `advisor`, `partner` or `bundle`.

The contact form asks for a **package**, not a budget: its dropdown lists the
fixed prices. A link to `/contact/?package=starter` (or any other option
value) opens the form with that package chosen; the "send an enquiry first"
links under the pricing page's deposit buttons work this way. The website
option values are `onepage`, `starter`, `business`, `commerce`, `brand` and
`care`; the consulting ones are listed above.

**Why $1,500 for brand identity** (set September 2026): logo, colours, fonts,
a guidelines document and social templates. $1,500 stays under the $2,000
Starter site; raise it to $2,000 once there are two or three branding
projects to show. The price appears on the services page, the pricing
page's add-ons, `/start/` and every page's JSON-LD `OfferCatalog`.

**Keep delivery and support promises in step.** Delivery: as little as 7 days for a
one-page site, 7–10 days for a Starter site, 2–4 weeks for Business, 4–6 weeks for Commerce (FAQ, the pricing
table, the price boards, `/start/`, the About page, home meta description). Free support after launch: 14
days on One-page, 30 days on Starter, 90 on Business, six months on Commerce (the pricing table,
process page, `/start/`). Buyers rank speed first, so a page
that says something different costs trust.

### 6. Social preview image

`assets/img/og-image.png` (1200×630) is what appears when someone shares your
link on LinkedIn, WhatsApp or Slack. It carries the crest, the name, one line
about what we do, the city and the domain, beside the street scene. It is
drawn by `tools/art/render.js`; edit the text there and run
`node tools/art/render.js` to regenerate it.

### 6b. Booking link and analytics

Both are set in one settings block at the top of `assets/js/main.js`. Both
are on; an empty string switches either off:

```js
var SITE_CONFIG = {
  bookingUrl: 'https://calendly.com/knightwebstudio1/30min',
  analyticsScript: 'https://plausible.io/js/pa-M8H39gIN2J-TgmR4OOcVA.js'
};
```

- **bookingUrl** — every booking button (they carry `data-booking`: "Book a
  free 30-minute call" in page heads and closing bands, "Book a free call" in
  the header, the sticky phone bar's button) opens this link in a new tab, and
  the contact page shows its own booking button under the phone number. Empty,
  the buttons go to `/contact/` and that one stays hidden. (The comment above
  the setting in `main.js` still calls them "Book a discovery call" buttons,
  the label they had before November 2026.)
- **analyticsScript** — the script URL from Plausible's install snippet
  (Site settings → Site installation). `main.js` runs that snippet for you on
  every page, so there is nothing to paste into the HTML. It counts visits
  without cookies (no consent banner needed) and fires two goals: `Enquiry`
  when the form sends and `Book call` when someone clicks a booking button.
  **Add both as custom-event goals in the Plausible dashboard**, or they won't
  show. The 404 page doesn't load `main.js`, so it isn't counted.

`/privacy/` names both Calendly and Plausible. If you switch either off, edit
its section there too; the wording to go back to sits in a comment beside it.
Tag every link you post elsewhere with `?utm_source=facebook` (or `linkedin`,
`email`, …) so Plausible shows which channel each enquiry came from.

### 6c. Location

The site says **Based in Baton Rouge, Louisiana**, which lets it appear in
local search and matches the address in the JSON-LD. It appears in every
page's footer, the contact page's contact list, and every page's JSON-LD
`address`. If that ever changes, search for `Baton Rouge` across the project.

### 6d. Testimonials

The landing page has a testimonials section written and styled but commented
out, directly under the work section in `index.html`. It stays off until
there are real quotes: an invented or placeholder quote costs more trust than
no section at all. To switch it on, delete the two lines
`<!-- TESTIMONIALS-START` and `TESTIMONIALS-END -->`, then fill in each quote,
name and role.

A message that works for asking a client, and gets you a Google review in
the same ask:

> Hi [name], hope the site's treating you well. Could I ask a small favour?
> I'm collecting a couple of sentences from clients for my own site. What
> was it like working together, and has anything changed since launch?
> If you're happy to, I'd also be grateful for a Google review here: [link].
> Totally fine if not.

Paste their reply in their words. Ask before shortening it.

### 7. Privacy page

`/privacy/` is a plain-English notice written to match what the site actually
does today: form data relayed by Web3Forms, hCaptcha on the contact page,
theme and draft in local storage, Plausible analytics, Calendly booking,
Stripe payments with Resend confirmation emails, and GitHub Pages hosting.
It is not legal advice. Read it once, and update it if you add analytics, a
newsletter, or any other tool that touches visitor data — the analytics
section promises the page will name the tool.

### 8. Landing page (`/start/`)

`/start/` is the page to send people to from outside the site: Facebook
posts, cold emails, ads, your email signature. It gives the whole offer on
one page, every service with its fixed price, and has one main next step:
book the free call (a tap-to-call button and an enquiry link sit beside it).
It deliberately has **no menu**, so visitors aren't pulled away from that
step; a "Full website" link sits in its footer.

Tag each link so Plausible shows which channel sends enquiries:

```
https://knightwebstudio.com/start/?utm_source=facebook
https://knightwebstudio.com/start/?utm_source=email&utm_campaign=softwash
```

Its service list and prices are copies of the Services and Pricing pages.
Change a price there and change it here too.

## The rules that protect the business

These matter more than any design detail. A change that breaks one of them
should not be published.

1. **Fixed prices, written in full.** Never a range, "from", "starting at",
   "as low as" or "ballpark". Every price on the site is in the table under
   [Pricing](#5b-pricing); change one there and everywhere it is repeated.
2. **No invented proof.** No made-up testimonials, reviews, star ratings,
   client logos, client counts, awards or results. The work shown is the three
   real projects (Smilys Softwash, Risen Health, Corbel Books), described by
   what was built, with no result claimed. The testimonials block on the home
   page stays commented out until there are real quotes.
3. **Illustrations read as illustrations.** A mock of a phone, a calendar or an
   enquiry list always says "[your business]" or "Your Business", never a
   made-up company, person or review, and carries an "Example" flag or a
   caption ending "An illustration, not a real conversation." The only numbers
   in them are the example week and the calculator's defaults.
4. **Estimates are labelled as estimates.** The time table is "an example
   week", the calculator's result is "an estimate, not a guarantee", and that
   label sits right beside the number, never in a footnote. Do not turn either
   into a promised result anywhere.
5. **Words the site never uses.** Automation is described by what it does ("a
   text goes out on its own", "the quote follows up for you"), never by naming
   the technology. The buzzwords for software that "thinks" or "learns" — the
   two-letter abbreviation and its spelled-out form, the word for an automated
   chat assistant, the three-letter name of the best-known one, and the phrase
   about machines that learn — stay off the site entirely: copy, alt text,
   class names, comments and file names. The owner's customers react badly to
   them, which is also why they are not spelled out here.
6. **The props rule.** The shop objects are the point of the design, and too
   many turn it cute. A page has at most one tilted object (`.tilt`) and one
   stamp (the round seal counts). The street scene belongs to the home page,
   small on `/start/` and the 404 page, and nowhere else. The FAQ, legal and
   checkout pages get no props at all. Nothing decorative may look pressable.
7. **Facts stay in step.** Timelines (7 days, 7–10 days, 2–4 weeks, 4–6
   weeks), support periods (14, 30 and 90 days, six months), payment terms,
   the phone number, the email address and "Based in Baton Rouge, Louisiana"
   are repeated on several pages and in the JSON-LD. Search before changing one.
8. **FAQ answers mirror the structured data word for word**, and the privacy
   and terms pages say what the site and the business actually do. Edit them
   only when the facts change.

## Run it locally

The pages use root-absolute paths (`/assets/…`), so opening `index.html`
straight from the disk shows it unstyled. Serve the folder instead:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages + knightwebstudio.com

**This is already done and live at https://knightwebstudio.com** with a
Let's Encrypt certificate. The steps below are recorded for reference, or for
setting the same thing up on another domain.

### Step 1 — turn Pages on

Repo **Settings → Pages → Source: "Deploy from a branch"** → branch `main`,
folder `/ (root)` → **Save**.

Because `CNAME` is committed, GitHub reads `knightwebstudio.com` from it and
fills in the Custom domain field automatically. Nothing to type.

### Step 2 — add the DNS records at IONOS

In IONOS: **Domains & SSL → knightwebstudio.com → DNS**. Delete any existing
A records or IONOS parking records for `@` first, then add:

**Four A records**, host `@`:

| Type | Host | Points to |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

**One CNAME record**, host `www`:

| Type | Host | Points to |
| --- | --- | --- |
| CNAME | `www` | `knight8280-dotcom.github.io` |

The CNAME target is the *user* domain — no repository name, no `https://`, no
trailing slash. That is the single most common mistake.

Optionally add four AAAA records on `@` for IPv6: `2606:50c0:8000::153`,
`2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.

### Step 3 — enforce HTTPS

Once DNS propagates (30 minutes to a few hours), return to Settings → Pages and
tick **Enforce HTTPS**. The certificate is issued automatically and free.

**Do not use IONOS "Domain Forwarding"/redirect.** It appears to be the simpler
option and it breaks both HTTPS and search rankings. Use the DNS records above.

### Other hosts

Netlify, Cloudflare Pages and Vercel all work too — connect the repo with an
empty build command and publish directory `.`, then follow that host's own DNS
instructions instead of the records above.

## Search visibility

Every page carries a JSON-LD `@graph` with two nodes:

- **Organization / ProfessionalService** — name, logo, email, and an
  `OfferCatalog` listing the four prices, so Google can show them
- **WebSite**

Each sub-page adds a **BreadcrumbList**, and `faq/index.html` adds a
**FAQPage** with all fourteen entries.

> The FAQ markup mirrors the visible accordion **verbatim**. Google penalises
> structured data that does not match on-page content, so if you edit an FAQ
> answer, edit it in both places.

`sitemap.xml` carries a `lastmod` per URL. Bump the date on a page when you
change it materially; Google ignores `changefreq` and `priority` but does
read `lastmod`.

Validate changes with the [Rich Results Test](https://search.google.com/test/rich-results).

## Before you launch — checklist

- [x] Add a phone number — `(225) 255-0837` is in every page's top strip, header and footer, the contact and About pages, and JSON-LD
- [ ] Form endpoint configured and a test enquiry received
- [x] Domain wired through `CNAME`, `index.html`, `sitemap.xml`, `robots.txt`
- [ ] GitHub Pages enabled and IONOS DNS records added
- [x] Social preview image added
- [ ] Checked on a real phone
- [ ] Google Search Console set up and sitemap submitted
- [ ] Analytics added (Plausible or Fathom if you'd rather skip a cookie banner) — then update `/privacy/`
- [ ] Read `/privacy/` once and confirm it describes what you actually do

## Browser support

Current Chrome, Edge, Firefox and Safari. The newer features each have a plain
fallback or simply do nothing where they are missing: `subgrid` for the
package table (cards instead), CSS masks for the brush underline (a plain
underline), container queries for the town headline, the About card, the
checkout slip, the project captions and the price-list leaders (a leader too
short to read is then still drawn), `:has()` on the checkout pages, the
`translate` and `rotate` properties (a hover lift, the one tilted card, the stamp) and
`text-wrap: balance` / `pretty`. On older browsers the layout and content stay
fully intact and only some visual polish falls away.
