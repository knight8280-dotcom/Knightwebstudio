---
name: kws-site-rules
description: "How to change knightwebstudio.com (this repository) without breaking the rules that protect the business: fixed prices repeated in many places and the structured data, banned words, honest proof, labelled estimates, facts in step, the shared chrome, asset versions and the FAQ structured data. Runs tools/check_rules.py before every commit. Use for any edit to this site: a price change, new copy, a new service or page, a new portfolio project or testimonial, a city page, the FAQ, the terms or privacy page, the header or footer, styles or scripts, or when Christian asks to check the site, check the rules, or is it OK to publish."
---

# kws-site-rules

This site is plain HTML with no build step, so every fact that appears on several pages is
typed several times: prices on up to a dozen pages plus every page's JSON-LD, the phone number
in every header and footer, delivery times on six pages. Most "follow-up fix" commits in this
repo's history are one of those copies left behind. The README's section "The rules that protect
the business" is the law here; this skill is how to keep it while editing, and
`tools/check_rules.py` is the inspector.

## Before you edit

Read the README sections for the kind of change (`Editing across pages`, `How a page is put
together`, `5b. Pricing`, `Make it yours`). They say where each thing lives. Two kinds of text
are never edited in place:
- anything between `<!-- art:NAME -->` markers (`tools/art/build.py` owns it);
- the header, footer, phone bar and first-paint script (edit `tools/chrome/*.inc`, then run
  `python3 tools/sync_chrome.py`).

## The common changes

**A price.** The README's "Current published prices" table is the source of truth: change it
there first. Then search the whole repo for the old figure (with and without a comma, and in
`"price": "…"` form) and change every copy the README lists: the page itself, the home page price
board, `/start/`, the four city pages, `/services/`, `/pricing/` (both the package table and the
phone folders: `tools/check_pricing.py` compares them), the FAQ and its JSON-LD, the terms, and
every page's JSON-LD `OfferCatalog`. A package price also lives in `server/plans*.json` and in
Stripe, so a price change there is two jobs: say so, and don't touch Stripe from here. Delivery
times and support periods follow the same "search, then change every copy" rule.

**Copy.** Keep it short: each page says what you get and what it costs, and leaves the how for
the call. Before adding a paragraph, ask whether it gives a visitor less reason to get in touch.
Automation is described by what it does, never by naming the technology; the checker knows the
words rule 5 bans. Fixed prices only, written `$1,000`, `/mo` in lists, "a month" in sentences.

**Proof.** Only real projects and real quotes, described by what was built, with no results
claimed. A testimonial goes in only verbatim, with the client's OK, by uncommenting the
`TESTIMONIALS-START` block in `index.html` (kws-proof prepares the quote). A new project follows
README › "5. Your work" (case row on `/work/`, the home and `/start/` print rows, the About list,
a 1200px image under 90 KB).

**Estimates.** The consulting time table is "an example week" and the calculator result is "an
estimate, not a guarantee", labelled right beside the number. If you change a calculator default,
recalculate and update the result figures written into the HTML.

**FAQ.** Every visible answer must match the FAQPage JSON-LD word for word. Edit both.

**A new page.** Follow README › "Adding or editing a page" (six steps, including `PAGES` in
`tools/sync_chrome.py` and `tools/art/build.py`, and `sitemap.xml`).

**CSS or JS.** Tokens only, the six breakpoints only, page rules scoped `[data-page="…"]`, hover
inside `@media (hover: hover)`, no inline `style=""` except a custom property. If you change any
stylesheet or script, raise `?v=` by one on every link in every page in the same commit.

## Check before every commit

```bash
python3 tools/check_rules.py
```

It runs `sync_chrome.py --check` and `check_pricing.py` too. Fix every FAIL before committing.
Look at every WARN: an amount it doesn't recognise is usually a stale price, sometimes a new
legitimate figure (then add it to the README's price table if it's a price). Then look at changed
pages at 360px and 1440px in both themes (README › "Run it locally").

## Never

- Publish client details, unpublished prices, competitor research or anything secret: GitHub
  Pages publishes this whole repository, README and tools included.
- Write a banned word anywhere (copy, alt text, class names, comments, file names), including in
  this skill or in commit messages.
- Invent a testimonial, a rating, a client count or a result.
- Commit with check_rules.py failing.
