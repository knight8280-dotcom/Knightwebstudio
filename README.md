# KnightWebstudio — business website

A complete, production-ready marketing website for a web design & development
business. Plain HTML, CSS and JavaScript — **no build step, no dependencies, no
npm install**. Open `index.html` and it works.

## Pages

A home page plus eight pages, each with its own title, description, canonical
URL and Open Graph tags. The menu reaches the first six; privacy and terms are
linked from the footer.

| URL | Contents |
| --- | --- |
| `/` | Landing page: hero, three service cards, four projects, four process steps, three prices — each teasing the full page |
| `/services/` | All six services |
| `/work/` | Four projects as full case-study rows, newest first — three live, plus an in-progress GamersPulseHQ prototype |
| `/process/` | Four-step "no surprises" explainer |
| `/pricing/` | Three project tiers, add-ons (brand identity, automation), three care tiers |
| `/faq/` | Nine answers, with FAQPage schema |
| `/contact/` | Enquiry form, spam honeypot, saved drafts, "what happens next" |
| `/privacy/` | Plain-English privacy notice — see [Privacy page](#7-privacy-page) |
| `/terms/` | Plain-English terms: 50/50 payments, the payment plan, 7-day invoices, card/ACH via Stripe or check, late interest, revision rounds per package, who writes the copy, care plan cancellation. The signed project agreement controls the details (cancellation fees are deliberately not listed here) |
| `/checkout/`, `/checkout/success/` | Stripe embedded checkout for deposits and care plans, and the confirmation page it returns to. See `STRIPE_INTEGRATION_TODO.md` |
| `/start/` | Landing page for ads, emails and posts: every service with its price, pricing tiers, selected work, the four steps, one call to action. No menu. See [Landing page](#8-landing-page-start) |
| `/about/` | First-person About page for Christian Knight: background, how he works, selected work and contact details. The founder photo is intentionally left out for now — add one later with an `<img>` at the top of `.about-wrap` if wanted |
| `/web-design-baton-rouge/`, `/web-design-gonzales/`, `/web-design-prairieville/`, `/web-design-denham-springs/` | Local service-area pages: unique copy per city, Smilys Softwash as local work, published prices, a short city FAQ, contact + booking CTAs. Linked from the footer's "Areas we serve" column |

Every page also carries the header, footer and (except `/contact/`,
`/privacy/` and `/terms/`) the sticky mobile CTA — the header's "Get a quote" is hidden
below 980px.

Also built in: dark/light theme toggle (remembers the visitor's choice, and is
restored by an inline script before first paint so there is no flash), sticky
header with a sliding active-page marker, mobile menu, scroll reveal
animations, `prefers-reduced-motion` support, keyboard accessibility, skip
link, Open Graph tags for link previews, and JSON-LD structured data for
Google.

## File layout

```
index.html              Landing page
services/index.html     One directory per page, so URLs are /services/ etc.
work/  process/  pricing/  faq/  contact/  privacy/  terms/
404.html                Not-found page
site.webmanifest        Installable-app metadata and icons
assets/css/styles.css   All styling (design tokens at the top)
assets/js/main.js       Theme, nav, reveals, form handling
assets/img/             Project screenshots (work-*.jpg), logo, PNG app icons
favicon.ico             16/32/48px icon for browsers and Google results
robots.txt              Search engine directives
sitemap.xml             Sitemap for search engines
.nojekyll               Tells GitHub Pages to serve the files as-is
```

## Editing across pages

There is still **no build step** — every page is plain HTML you can open and
edit. The trade-off is that the header, footer and mobile CTA are duplicated in
all eight files. If you change one of those, change it in all eight, or they
will drift. A quick way to check they haven't:

```bash
for f in index.html */index.html; do grep -c 'id="mobile-cta"' $f; done   # 1 each, 0 on contact/privacy
```

Asset and link paths are **root-absolute** (`/assets/…`, `/pricing/`) so the
same markup works from any directory depth. That relies on the site living at
the domain root, which it does.

The landing page's teasers are copies of the first three service cards, the
four projects, the four process steps (shortened) and the three price tiers.
Update the full page and the landing page together.

**Heading levels.** On the landing page, section titles are `h2` and card
titles `h3`. On the sub-pages the page title is the `h1` and card titles sit
directly under it, so they are `<h2 class="h3">` — an `h2` for the document
outline, sized like an `h3`. Keep that pattern when adding cards, or Lighthouse
will flag skipped heading levels.

## Make it yours

Everything you need to change is marked `EDIT ME` in the source.

### 1. Business name, crest and artwork

The wordmark reads **KnightWebstudio** in full, in the header and footer —
search for `brand-name` and edit both occurrences.

The mark is the **Charger shield**: a chess knight's head cut into facets in
five shades of the brand blue, inside a riveted shield with a teal inner
border. The **full crest** adds crossed swords and a name ribbon for large
spots. Around them, the site uses a chess-set theme: every sub-page opens with
its own faceted piece, and loose facets ("shards") drift behind page headers.

| Where | What |
| --- | --- |
| Header, every page | Charger shield; builds itself on a visit's first page, then again on hover |
| Footer | Charger shield |
| Home, closing call to action | Full crest; builds when it scrolls into view |
| Services / Work / Process / Pricing / FAQ / Contact | Rook / Knight / Pawn / King / Bishop / Queen, stacked in on load; hover makes it hop (the knight makes a knight's move) |
| Hero and page headers | Drifting shards |
| 404 | The knight, toppled over |
| `assets/img/logo.svg`, `crest.svg` | Standalone copies (logo.svg is the JSON-LD logo) |
| `favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png`, `og-image.png` | Rendered from the same artwork |

**All of it is drawn in code, in `tools/art/`.** The drawings live in
`tools/art/emblems.py`. The pages carry them inline (so they can animate)
between `<!-- art:NAME -->` markers, which are overwritten on every build —
never edit between them. To change any artwork:

```bash
python3 tools/art/build.py   # rewrites the inline art in every page, logo.svg and crest.svg
node tools/art/render.js     # re-renders favicon, app icons and the link-preview image (needs Playwright)
```

The crest keeps fixed colours (the `PALETTE` in `emblems.py`), so it looks the
same on the dark and light themes, like a printed badge. The animations live at
the end of `assets/css/styles.css` under "Artwork"; every drawing rests in its
finished state, so a visitor with reduced motion, or a crawler, sees the
complete artwork.

### 2. Contact details

The contact address is `knightwebstudio1@gmail.com`. It appears in every
page's header menu, footer and JSON-LD, in `contact/index.html` (contact
list), `privacy/index.html`, and in `assets/js/main.js` (the form's mailto
fallback) — a project-wide search-and-replace is the safe way to change it.

The phone number is `(225) 255-0837`. It appears as a `tel:+12252550837` link
in the homepage footer, the contact page's contact list and the About page,
and as `"telephone": "+1-225-255-0837"` in every page's JSON-LD block.

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
   It is loaded **on demand** (when the contact section nears the viewport, or
   on first focus in the form), not with the page. A captcha iframe present at
   load can take focus and drag the scroll position down the page, and it also
   put a third-party request on the critical path for every visitor.

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

**Drafts are saved as you type.** Name, email, business, budget, selected
services and the message go to `localStorage` (debounced, ~400ms) so a half-
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

### 4. Colours

Open `assets/css/styles.css` and edit the four brand variables at the top:

```css
--brand:        #6d8bff;   /* primary */
--brand-strong: #2c46c4;   /* button hover, deep accents */
--brand-soft:   #a5b8ff;   /* eyebrow text, icons */
--accent:       #46e0c0;   /* ticks, prices, result lines */
```

The light theme has its own overrides in the `[data-theme="light"]` block just
below. Three tokens differ deliberately between themes and are easy to break:

- `--brand-soft` and `--accent` are *darker* in light theme — their dark-theme
  values fail contrast on a light background.
- `--on-brand` is the text colour used **on** brand-filled surfaces (buttons,
  the logo mark, the "Most popular" flag). It is dark ink in dark theme,
  because white on the dark theme's brand blue is only 3.1:1.
- `--band` is the CTA band's background, deep enough to carry white in both.

If you change the brand colour, re-check all three.

### 5. Your work

The Work section holds four projects, newest first, each with an
image taken from the site itself and a link out. Risen Health, Corbel Books
and Smilys Softwash are live; GamersPulseHQ is labelled as an in-progress
prototype (Steam/Twitch data is not live, and it is not presented as a
finished client site):

| Project | What it is | Image source |
| --- | --- | --- |
| Risen Health | Online store for a family-owned peptide supplier (added September 2026) | its own Open Graph card |
| Corbel Books | Fintech SaaS product site and app UI | its own Open Graph card |
| Smilys Softwash | Local exterior-cleaning business (quotes live; card payments being set up) | its own before/after roof photo |
| GamersPulseHQ | In-progress gaming-data concept demo | its own Open Graph card |

Images live in `assets/img/work-*.jpg`, all 1200px wide and under 90 KB. To add
a project, copy one `<article class="work-card">` block in `work/index.html`,
drop a matching image in `assets/img/`, and update the text. The first card is
the one on screen at load, so it has no `reveal` class and its image uses
`fetchpriority="high"`; every other card fades in and lazy-loads. The project
also belongs in the home page's hero panel and projects grid and on `/start/`;
those grids run four across on wide screens, so a fifth project should replace
one there rather than be added.

All descriptions are factual — taken from each site's own copy — with no
invented metrics. Keep it that way: a result line you can't defend is worse than
no result line.

### 5b. Pricing

**Every price is fixed. Never write a range, "from", "starting at" or
"ballpark"** anywhere on the site: a range invites the buyer to pick their
own number. A package's price covers exactly what its card lists; anything
beyond that is agreed in writing before work starts.

Current published prices:

| Item | Price |
| --- | --- |
| Starter | $2,000 |
| Business | $4,000 |
| Commerce | $8,000 |
| Automation add-ons | $750 each |
| Brand identity | $1,500 |
| Care — Essential | $300/mo |
| Care — Growth | $600/mo |
| Care — Commerce | $1,000/mo |

This README is served on GitHub Pages (the site uses `.nojekyll`, so files
are copied as-is). Keep competitor price bands and market-research notes
out of it.

Starter is an **information website** (up to 5 pages: who the business is,
what it offers, how to reach it), not a one-page site. It was raised from
$1,500. Each price appears in `pricing/index.html`, the three project tiers
again on the landing page, the project prices plus three care tiers
(Essential, Growth, Commerce) in every page's JSON-LD `OfferCatalog`, and
the $300 / $600 / $1,000 care figures in the FAQ answer about care plans
and the services page. Search for the old figure before changing one.

The service cards carry small price tags taken from the same tiers: design
and build "$2,000 or $4,000", e-commerce $8,000, care "$300, $600 or $1,000/mo",
brand identity $1,500, redesigns "priced as a new site" (a redesign is one of
the same packages), and SEO "in every build", because every tier includes SEO
basics.

The contact form asks for a **package**, not a budget: its dropdown lists the
fixed prices. Each tier's button on the pricing page links to
`/contact/?package=starter` (or `business`, `commerce`) and the form opens with
that package chosen. The option values are `starter`, `business`, `commerce`,
`brand` and `care`.

**Why $1,500 for brand identity** (set September 2026): logo, colours, fonts,
a guidelines document and social templates. $1,500 stays under the $2,000
Starter site; raise it to $2,000 once there are two or three branding
projects to show. The price appears on the services page, the pricing
page's add-ons, `/start/` and every page's JSON-LD `OfferCatalog`.

**Keep delivery and support promises in step.** Delivery: as little as 7–10 days for a
Starter site, 2–4 weeks for Business, 4–6 weeks for Commerce (FAQ, pricing
cards, landing hero, home meta description). Free support after launch: 30
days on Starter, 90 on Business, six months on Commerce (pricing cards,
process page, landing process teaser). Buyers rank speed first, so a page
that says something different costs trust.

### 6. Social preview image

`assets/img/og-image.png` (1200×630) is what appears when someone shares your
link on LinkedIn, WhatsApp or Slack. It carries the logo, the headline and the
domain. To regenerate it after a copy or brand change, rebuild it from the same
markup used to produce it and re-export at 1200×630.

### 6b. Booking link and analytics

Both are set in one settings block at the top of `assets/js/main.js`. Both
are on; an empty string switches either off:

```js
var SITE_CONFIG = {
  bookingUrl: 'https://calendly.com/knightwebstudio1/30min',
  analyticsScript: 'https://plausible.io/js/pa-M8H39gIN2J-TgmR4OOcVA.js'
};
```

- **bookingUrl** — every "Book a discovery call" button (they carry
  `data-booking`) opens this link in a new tab, and the contact page reveals a
  "Book a 30-minute call" box beside the form. Empty, the buttons go to
  `/contact/` and the box stays hidden.
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
one page, every service with its starting price, and has one next step:
book the free call. It deliberately has **no menu**, so visitors aren't
pulled away from that step; a "Full website" link sits in its footer.

Tag each link so Plausible shows which channel sends enquiries:

```
https://knightwebstudio.com/start/?utm_source=facebook
https://knightwebstudio.com/start/?utm_source=email&utm_campaign=softwash
```

Its service list and prices are copies of the Services and Pricing pages.
Change a price there and change it here too.

## Run it locally

Just open `index.html` in a browser. If you'd rather use a local server (which
matches production more closely):

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
**FAQPage** with all nine entries.

> The FAQ markup mirrors the visible accordion **verbatim**. Google penalises
> structured data that does not match on-page content, so if you edit an FAQ
> answer, edit it in both places.

`sitemap.xml` carries a `lastmod` per URL. Bump the date on a page when you
change it materially; Google ignores `changefreq` and `priority` but does
read `lastmod`.

Validate changes with the [Rich Results Test](https://search.google.com/test/rich-results).

## Before you launch — checklist

- [x] Add a phone number — `(225) 255-0837` is in the contact list, homepage footer, About page and JSON-LD
- [ ] Form endpoint configured and a test enquiry received
- [x] Domain wired through `CNAME`, `index.html`, `sitemap.xml`, `robots.txt`
- [ ] GitHub Pages enabled and IONOS DNS records added
- [x] Social preview image added
- [ ] Checked on a real phone
- [ ] Google Search Console set up and sitemap submitted
- [ ] Analytics added (Plausible or Fathom if you'd rather skip a cookie banner) — then update `/privacy/`
- [ ] Read `/privacy/` once and confirm it describes what you actually do

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses `color-mix()` and
`backdrop-filter`; on older browsers the layout and content stay fully intact,
only some visual polish falls away.
