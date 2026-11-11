# KnightWebstudio site refresh: handoff (stopped Nov 11, 2026, about 01:35 UTC)

Everything was stopped at Christian's request so the work can restart in a new chat.
Nothing is running. Nothing below is waiting on a background job.

## 1. What is live

- The "Main Street" redesign of all 19 pages is live on knightwebstudio.com.
  Pull request #50 was merged Nov 10; `main` is at `49c8969`.
- Checked on the live site after the merge: the new home page loads, 10 pages return 200,
  an unknown path returns the 404 page, stylesheet, script and fonts load, no console errors.
- Not tested by anyone yet: a real iPhone, a completed card payment, a real enquiry sent
  through the contact form.

## 2. Follow-up fixes: saved, NOT live

Branch `claude/site-refresh-fixes`, draft pull request #52, one commit `f5221e3`.

An independent review of the redesign confirmed 42 issues: no blockers, 6 major, 36 minor.
None of them breaks the site.

In the branch (the fixer tested each one; nobody has independently re-checked them):

- All 6 majors:
  - OB-01: on older iPhones (Safari 16.4 to about 18.1) the "What do you need?" heading on the
    contact form and the calculator group headings collapse. Fixed in the stylesheet.
  - CUST-02: the four price rows on the home page opened checkout without saying so. They now
    go to /pricing/#packages. (Owner choice: the alternative is to keep checkout and label each
    row "Pay 50% deposit".)
  - CUST-03: on /pricing/ the care plans intro now opens "Optional. The site, the domain and
    the hosting account are yours with or without a plan, and there is no long-term contract."
  - A11Y-01: blocks could stay hidden at 400% zoom in a short window. Scroll-reveal fixed.
  - A11Y-02: sticky header and phone bar covered the page in windows under 300px tall.
  - font-swap-georgia: headings re-wrapped when the web font arrived. Fallback fonts retuned.
- 3 minors: A11Y-06, VA-03, stale-assets-at-switch.
- A few edits from a second pass on the minors that was interrupted after about 7 minutes.
  Treat these as unreviewed.

State of the branch: site checker 0 FAIL, header/footer partials in step on all 19 pages.

Left to do before merging #52:

1. Re-check the edits in `f5221e3` against the hard rules (section 6), especially
   `checkout/index.html`: the Stripe script tag was moved from the head to just before the
   inline script, which fixes "checkout-stripe-blocks-paint" but touches a protected page.
2. Fix the remaining minors (about 33). Full list with evidence and suggested fixes:
   `review/A/confirmed.json` and `review/A/notes.json` on the working-files branch.
   Leave CUST-08 ("enquiry" spelling) and F2 (support period wording) alone: owner decisions.
3. Change `?v=2` to `?v=3` on the stylesheet and script URLs on all 19 pages (the branch
   changes the CSS and JS but still says `?v=2`).
4. Run the checker and the behaviour checks, mark #52 ready, merge, check the live site.

Remaining minor ids: F1-label-glued-to-sentence, checkout-error-skeleton,
captcha-320-pokes-out, mailto-fallback-drops-needs, PV-H2-HYPHEN, EYEBROW-SEP, SUCCESS-H1,
OB-02, OB-03, OB-05, VA-01, VA-06, VA-07, VA-09, VA-10, CUST-01, CUST-04, CUST-05, CUST-06,
CUST-07, A11Y-03, A11Y-04, A11Y-05, A11Y-07, A11Y-09, A11Y-10, failsafe-timer-misfires,
bfcache-stale-theme, thumbnails-oversized, print-pale-text-no-letterhead,
checkout-stripe-blocks-paint (possibly already done, see step 1).

## 3. Animated components ("motion kit"): built in scratch, NOT in the site

These are the hand-made versions of the designs in Christian's screenshot (folder cards,
bookmark cards with shader art, arc carousel, circular slider, spotlight carousel, image ring,
new footer and closing band). All original work; nothing copied from the paid libraries.

Source: `motion/kit/<group>/` on the working-files branch. Each group has a demo page, the
component files and a long NOTES.md.

| Group | Contents | State |
| --- | --- | --- |
| light | animated backgrounds (shader.js), folder cards, bookmark cards, pause control | built, reviewed twice, fixed. Done. |
| flat | arc service wheel, spotlight carousel | built, reviewed twice, fixed. Done. |
| depth | cylinder carousel, image ring | built and reviewed; the fix pass was stopped partway. Partly fixed. |
| closing | closing band, new footer, skyline, appointment card | built and reviewed; the fix pass was stopped partway. Partly fixed. |

Left to do:

1. Finish the fix pass on `depth` and `closing` (the reviewers' issue lists are in each
   group's NOTES.md).
2. Assemble the four groups into one kit folder with a README (`wf/place.js`, first stage).
3. On a fresh branch from `main`, install the kit and place the components into the pages
   (rest of `wf/place.js`), then a short review, pull request and merge.
   The placement proposal is section 6 of `motion/research/DIGEST.md`.

## 4. Client builds: not started

Christian asked for these components to be used in client sites from now on. Still to do:
package the assembled kit with React mounting notes and write an updated `coldforge-site`
skill for Christian to install. That skill is synced at account level, so it cannot be
edited from a session; it has to be delivered as a package.

## 5. Where everything is

- Site repo: `knight8280-dotcom/Knightwebstudio`
  - `main`: live site
  - `claude/site-refresh-fixes`: follow-up fixes, draft PR #52
  - `claude/site-refresh-workbench`: working files only. Own history. NEVER merge it.
- PR #51 (animated background from another chat, built on the old design): superseded and
  conflicting. Can be closed. It was not closed here.
- Working-files branch contents: BRIEF.md (hard rules), ROLLOUT.md, DESIGN.md (handbook),
  tools/ (checker, screenshots, contrast, behaviour tests, backup.sh), wf/ (workflow
  scripts), motion/ (kit and research), review/A/ (the 42 findings), integrate/WORKLIST.md,
  this file.
- A new chat starts on a new machine with no scratch folder. To restore:
  check out `claude/site-refresh-workbench` into a scratch folder, then update the old
  scratch path that is hardcoded in `tools/backup.sh`, `tools/kws_page.py` and the `wf/*.js`
  prompts.
- Not backed up (too large); recreate if needed:
  - the copy of the old site used as the checker's baseline: it is commit `9da1c13`
  - screenshots and reviewers' evidence
  - browser builds for testing (current WebKit and Firefox, and old WebKit builds for OB-01)

## 6. Standing rules to carry into the new chat

- The word "AI" (and "artificial intelligence", "chatbot", "GPT", "machine learning") never
  appears anywhere on the website.
- Every price is fixed. Never "from" or a range.
- No invented testimonials, reviews or statistics.
- Do not change: page titles, meta descriptions, canonical/OG tags, JSON-LD, FAQ / privacy /
  terms wording, city pages' headings and body text, contact form fields, calculator ids,
  checkout inline scripts and ids, SITE_CONFIG.
- Original work only: no code or artwork from paid component libraries.
- Push progress as each piece finishes. Merge when finished and verified.
- Helpers run on Opus 5.5 at extra effort; keep the work lean (credits).
- Commits and pull requests never name a model.

## 7. Other open items (not website code)

- Unanswered question to Christian: which extra consulting items to add (win-back campaigns,
  24/7 receptionist, job-software setup, ads management, dashboard, pricing/sales review,
  social media, higher monthly tier). Nothing done on this.
- The "Weekday follow-ups & tracker" scheduled task (10:47 AM Central, weekdays) is still
  switched on and still runs in the OLD chat. It was not touched. Next run Thu Nov 12
  (Nov 11 is Veterans Day). Due then: 12 Daily Prospects first follow-ups.
- Owner decisions left as they are on the live site: "enquiry" spelling; "30 days to six
  months, by plan" support wording; Corbel Books label "Bookkeeping software"; closing
  button "Book a free 30-minute call"; no business card on the contact page.
- Stray test files `/a.html` to `/ok.html` were left in the old machine's root folder by a
  test. They are not in the repository and vanish with that machine.
