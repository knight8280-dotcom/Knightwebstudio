export const meta = {
  name: 'kws-refresh-review',
  description: 'Independent review of the integrated KnightWebstudio redesign: read-only finders by dimension, then a skeptical verifier per finder',
  phases: [
    { title: 'Find', detail: 'one read-only reviewer per dimension' },
    { title: 'Verify', detail: 'a skeptic re-checks each reviewer\'s findings and drops what does not hold' },
  ],
}

const R = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
const REPO = '/home/user/Knightwebstudio'
const SERVER = 'http://localhost:8720'
const WANT = (args && args.dims) || []
const STAGE = (args && args.stage) || 'A'
const EXTRA = (args && args.extra) || ''
const ALL_PATHS = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'

const CONTEXT = `
THE SITE: knightwebstudio.com, a one-person web studio and small-business consultancy in Baton Rouge, Louisiana. Its customers are owners of local service businesses (plumbers, roofers, HVAC, salons, restaurants), mostly on phones, often iPhones, arriving from a cold email or a Google search; they distrust jargon and decide in seconds whether this is a real, local, competent person. The owner asked for "a full refresh: a top-notch $100,000 website". All 19 pages have been redesigned ("Main Street premium": warm paper, ink, sign-painter's blue, brick, gold only on blue; Fraunces and Figtree; light first with a night theme), built by many hands, integrated into one stylesheet and checked several times. It is about to replace the live site. You are one of the last independent reviewers before that happens. You did not build any of it.
READ FIRST: ${R}/BRIEF.md (the business, the audience, the quality bar and the HARD RULES), ${R}/ROLLOUT.md (the direction and its rules), ${R}/DESIGN.md section 0 and the table of contents (the handbook), ${REPO}/README.md.
WHERE THINGS ARE: the redesigned site is the repository ${REPO} served at ${SERVER} (if down: (nohup python3 -m http.server 8720 --directory ${REPO} >/dev/null 2>&1 &)). The untouched live site is ${R}/baseline/ served at http://localhost:8700 . The 19 pages: ${ALL_PATHS}
TOOLS in ${R}/tools/: shoot.js (scrolling screenshots + report.json; it blocks third-party hosts), compare.js, widths.js, contrast.js, smalltext.js, behaviour.js, check_site.py (python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline [--pages a,b] [--show-missing] [--show-new-numbers]). Playwright with Chromium is installed (require('playwright')); do not reinstall or upgrade Playwright.
RULES FOR YOU: You are READ-ONLY. Do not change anything in ${REPO}. Never run a git command that changes anything. Your scripts, screenshots and notes go in ${R}/review/${STAGE}/<your dimension>/ . Never write the words "AI", "artificial intelligence", "chatbot", "GPT" or "machine learning" in anything that could ship. Do not ask questions.
WHAT ALREADY PASSES (do not spend your time re-proving these; look for what they miss): check_site.py 0 FAIL; no horizontal overflow 360 to 1920 in Chromium; contrast.js AA on every page in both themes; nothing under 12px, no target under 44px; behaviour.js 66 checks pass; no console errors in Chromium.
KNOWN AND ACCEPTED (do not report): the first-paint theme script differs from the baseline on purpose (light is now the default); desktop pages are up to 5% taller after the measure was narrowed; city pages are about 7,300px on a phone because their copy is frozen; a new footer and closing band and animated components are being added in a later step.
${EXTRA}
`

const HOW_TO_REPORT = `
REPORT findings only for real defects a customer, the owner or a search engine would be affected by, each with evidence you produced (a measurement, a screenshot path, a quoted line, a command and its output). No style opinions without a concrete harm. For each: a short id; severity (blocker = must not go live like this: something is broken, a fact is wrong, lost or invented, a hard rule from BRIEF.md is violated, or a whole class of visitors cannot use a page; major = clearly visible defect or accessibility failure on a main page; minor = polish); the page(s); exactly where; what is wrong; the evidence; the concrete fix (file, selector, change). Also say what you checked that was fine, in one paragraph, so the next person does not repeat it. If you find nothing, say so; do not pad.
`

const DIMS = {
  crossbrowser: `
YOUR DIMENSION: OTHER BROWSERS. Everything so far was tested in headless Chromium only, and most visitors use Safari on an iPhone.
1. Get WebKit and Firefox running under the Playwright version already installed. A Firefox build may already be in ${R}/motion/.browsers-flat/ (set PLAYWRIGHT_BROWSERS_PATH to it). For WebKit: install the browser binary for the installed Playwright version into ${R}/review/browsers (PLAYWRIGHT_BROWSERS_PATH=${R}/review/browsers npx playwright install webkit) and, if it will not launch for missing system libraries, install exactly the libraries its error names with apt-get (you are root; try "npx playwright install-deps webkit" too). Spend real effort on this: it is the most valuable thing you can do. If WebKit truly cannot run, say exactly why, and do the feature audit in step 3 twice as carefully.
2. In each engine you have, load all 19 pages at 390x844 and 1280x800 in both themes (set localStorage "theme" to "light" or "dark" before load), take full-page screenshots, and compare with Chromium's: layout breaks, overlaps, missing art, fonts not applied, wrong colours, broken tables, controls that do not work (theme toggle, phone menu, FAQ details, contact form validation, calculator, carousels if any). Look at the images.
3. Feature audit of ${REPO}/assets/css/styles.css and ${REPO}/assets/js/*.js against Safari 15.4, 16.0, 16.4, 17.0, 17.5 and Firefox ESR: list every use of subgrid, container queries and units (cqw, cqi), :has(), :where()/:is(), text-wrap, individual transform properties (translate, rotate, scale), color-mix(), nesting, @layer, inset, aspect-ratio, gap in flex, dvh/svh units, scroll-margin, accent-color, details/summary styling, focus-visible, inert, structuredClone, optional chaining, IntersectionObserver options, and say for each whether older Safari degrades gracefully (a plain fallback is in place) or breaks (and what the visitor would see). Read the code; do not guess from memory where a quick test in WebKit can settle it.
4. iOS specifics: 100vh and the sticky phone bar with Safari's toolbars; safe-area insets (the bar must clear the home indicator: env(safe-area-inset-bottom)); tap highlight; input zoom on focus (inputs under 16px zoom the page on iOS); tel: links; position: sticky inside overflow containers; smooth scrolling and anchor offsets under the sticky header.`,
  facts: `
YOUR DIMENSION: FACTS AND WORDS. The redesign may rewrite headlines, intros and microcopy, and reorder sections, but may not lose, change or add a fact. FAQ answers, the privacy page, the terms page and the four city pages' headings and body copy must be word for word.
For each of the 19 pages, compare the live page (${R}/baseline/...) with the new one (${REPO}/...) as a careful proofreader, not only with scripts:
1. Every price, every package inclusion, every timeline (7 days, 7 to 10 days, 2 to 4 weeks, 4 to 6 weeks), every support period (14 days, 30 days, 90 days, six months), every payment term (50% to start, payment plans, the bundle's $1,500 down then $500 a month for 3 months, credits such as the Growth Audit being credited within 30 days), every qualifier ("example", "estimate", "not a guarantee", "about"), phone (225) 255-0837, email knightwebstudio1@gmail.com, "Based in Baton Rouge, Louisiana", the towns served: is each still on the page it was on, saying the same thing? Is any price now hedged ("from", "starting at", a range)? Is anything new claimed that the live site does not say (results, counts, years, credentials, guarantees, response times, names)? Run python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline --show-missing --show-new-numbers and read every "missing" sentence against the new page.
2. Internal consistency across the new site: the same price or term stated differently on two pages; a package that includes something on one page and not on another; labels for the same thing that differ in a way a customer could read as two different things.
3. The three real projects (Smilys Softwash, Risen Health, Corbel Books): nothing claimed about results; descriptions true to the live site's; links to the live sites work in form (do not judge the external sites).
4. Mock-ups and examples: every illustrative conversation, calendar, list or number is marked as an example right there; no business names, people's names, ratings or invented statistics; the calculator's printed defaults equal what its script computes; the example-week arithmetic adds up.
5. Every link and button: destination exists; query strings (?package=..., ?plan=...) match values the contact form and checkout script accept (read assets/js/main.js and the checkout inline script for the accepted values); every baseline call-to-action destination is still reachable from the same page; anchors resolve.
6. <title>, meta description, canonical, Open Graph and JSON-LD blocks are byte-identical to the baseline on every page (diff them); the visible FAQ text still matches the FAQ JSON-LD word for word.
7. Spelling, grammar, stray characters, leftover placeholder text, double spaces, inconsistent capitalisation of product names, American vs British spelling drift within a page ("enquiry" is the site's established spelling; do not report it).`,
  integrations: `
YOUR DIMENSION: THE REAL SERVICES. Every earlier test blocked third-party hosts, so nobody has seen the real payment form, captcha, booking link or analytics inside the new design. Use Playwright WITHOUT blocking anything (and note any host this machine's network refuses, with the exact error).
1. Read ${REPO}/assets/js/main.js (the SITE_CONFIG block and the booking, form, captcha and analytics code) and the inline scripts in ${REPO}/checkout/index.html and ${REPO}/checkout/success/index.html, so you know every host, every state and every accepted parameter.
2. Checkout: load ${SERVER}/checkout/ with each plan value the pricing page links to (list them from ${REPO}/pricing/index.html), at 390x844 and 1280x800 in both themes. Does the payment server answer from this origin (it may only allow the live site's origin: report the exact response)? Does the real Stripe form mount inside the new layout, at a sensible height, without overflow, readable in the night theme? Screenshot every state you can reach (loading, form mounted, error, the "not completed" state via its query string). Do NOT submit a payment or enter card details. If the server refuses this origin, say what could and could not be verified, and verify by reading the code that every element id the scripts use exists exactly once in the new pages and that nothing in the new CSS could hide or clip the mounted iframe (overflow, fixed heights, display rules).
3. Contact and /start/ forms: load the page and let the real hCaptcha script load: does the widget render, fit at 360px, look right in the night theme, and does the page shift when it appears? Fill the form with obviously fake test data but DO NOT SUBMIT it (do not send a real enquiry). Exercise validation, draft saving, the ?package= preselect for every value used anywhere on the site, and the mailto fallback path by blocking only the form endpoint.
4. Booking: every [data-booking] button and .booking-only element: what does a click do with the real Calendly link from SITE_CONFIG (new tab? same tab? is the href correct on every page, with rel and target sensible)? Does the booking URL itself answer (HTTP status only; do not book anything)?
5. Analytics: the Plausible script URL from SITE_CONFIG loads on every page that had it on the live site and on no page that did not; any custom events the live site sent are still sent (compare main.js with the baseline's).
6. External links on all pages (the three project sites, social links if any, tel:, mailto:): well-formed, rel="noopener" where target="_blank", and HTTP status of each external URL.
7. GitHub Pages specifics: 404.html works when served for an unknown deep path (root-absolute links, no dependency on its own URL); CNAME, robots.txt and sitemap.xml unchanged and every sitemap URL exists; no file the pages reference is missing; nothing under tools/ would be mistaken for a page.`,
  a11y: `
YOUR DIMENSION: ACCESSIBILITY, to WCAG 2.2 AA, as an auditor who assumes the automated checks were gamed.
For all 19 pages (prioritise home, pricing, consulting, services, contact, start, checkout):
1. Structure from the accessibility tree (dump it with Playwright): one h1; heading order makes sense when read as an outline; landmarks (one main, labelled navs, header, footer); lists are lists; tables that are restyled as cards on phones still expose rows, column headers and row headers correctly at 390px AND at 1280px (check the spec table on pricing, the care table, the ledger on consulting, the stacked tables); decorative mock-ups are hidden or sensibly labelled, not read out as real conversations; images have useful alt text; SVG art has a title or is hidden.
2. Keyboard: tab through every page at 390px and 1280px: order follows the visual order; every control reachable and operable (phone menu open/close/Escape and focus return, theme toggle state announced, FAQ details, form fields, calculator, any tabs); focus always visible with at least 3:1 against its background in BOTH themes on EVERY background (paper, sand, blue, ink, cards); focus never hidden under the sticky header or the sticky phone bar (2.4.11); skip link works and lands sensibly; no keyboard trap.
3. Names, roles, states: every button and link has an accessible name that includes its visible text (2.5.3); repeated "Send an enquiry" style links are distinguishable in context; aria-current in the menu; aria-expanded on toggles; form fields have labels, required state, autocomplete tokens, and errors that are announced and tied to their fields (aria-describedby, aria-invalid, a live region for the form status).
4. Visual: reflow at 320px wide (1.4.10) with no two-dimensional scrolling and no clipped content; text resized to 200% by browser zoom; text spacing overrides (1.4.12: line height 1.5, paragraph spacing 2x, letter spacing .12em, word spacing .16em) with no clipped or overlapping text on any page; non-text contrast of controls, form borders, icons and chart bars (1.4.11) in both themes; nothing conveyed by colour alone (the "Most popular" marker, errors, the bars in the ledger, the payment plan blocks); target sizes 24px minimum everywhere and 44px for primary actions.
5. Motion and timing: prefers-reduced-motion stops every animation and transition that moves; nothing flashes; nothing auto-updates; reveal effects never leave content invisible (test with JavaScript on but IntersectionObserver delayed, and with reduced motion).
6. Forced colours (Windows high contrast, emulate with forcedColors: 'active'): controls, focus rings, the phone bar and the price tables stay usable.
7. Language and reading: lang attribute; abbreviations a screen reader would mangle ("/mo", "$1,000", "7–10 days", phone number formatting); link text that makes sense out of context.`,
  perf: `
YOUR DIMENSION: SPEED, ROBUSTNESS AND THE NO-JAVASCRIPT PAGE.
1. Weight per page: HTML bytes (the inline SVG art is large: how large on each page, and is any drawing repeated in a page that could be reused with <use>?), CSS, JS, fonts, images; total transfer for a first visit to the home page and to /start/ (the page cold emails link to). Compare with the live site (baseline). Are both fonts preloaded with crossorigin, font-display set, fallback metrics tuned so text does not jump? Measure Cumulative Layout Shift on every page at 390x844 and 1280x800 with fonts delayed by 1.5s and with images delayed (PerformanceObserver layout-shift); name the shifting elements.
2. Largest Contentful Paint element on the main pages on a throttled connection and 4x CPU throttle (Chrome DevTools Protocol): is it text (good) or an image or SVG; is anything render-blocking beyond the one stylesheet; are scripts deferred; is anything below the fold loaded eagerly; do images have width, height, loading="lazy" (and the first image on /work/ not lazy if it is in the first screen), decoding, sensible file sizes and dimensions for their display size (the three work-*.jpg files: displayed size vs natural size at 390 and 1440, at 2x)?
3. Run Lighthouse if you can get it without adding anything to the repository (npx lighthouse into your scratch folder, using the installed Chromium at /opt/pw-browsers/chromium, flags --headless --no-sandbox): performance, accessibility, best practices and SEO for home, /start/, /pricing/, /consulting/, /contact/ on mobile; report the scores and every failed audit that is real.
4. The CSS file: unused rules per page are expected (one sheet for 19 pages), but find selectors that match nothing on ANY page, duplicated declarations, and anything expensive (huge box-shadows on scroll, filters, fixed backgrounds, will-change left on).
5. JavaScript off (javaScriptEnabled: false) on all 19 pages at 390 and 1280: everything readable; nothing invisible, faded, clipped or looking like a dead control; the phone menu's links are available; forms post to their action; the calculator shows its printed results; checkout shows its no-script message.
6. Failure modes: main.js blocked or slow (does anything stay hidden? the head snippet has a four-second fail-safe: test it); fonts blocked; images blocked (alt text and layout); a very slow connection (is the first screen usable before the art arrives?); bfcache back/forward (state of the menu, theme, form drafts); localStorage unavailable (private mode: does anything throw?); the theme toggle before main.js loads; print stylesheet (print home and pricing to PDF and look: is it usable, are prices legible, is the phone number there?).
7. Scroll performance at 390px with 4x CPU throttle on home and consulting: long frames while scrolling, and what causes them.`,
  dale: `
YOUR DIMENSION: THE CUSTOMER. You are Dale, 54, owner of a roofing company in Baton Rouge, on an iPhone 13 with reading glasses pushed up on your head, between jobs. You got a cold email from a web guy with a link. You have been burned by a web company before: they charged monthly, vanished, and you never owned your site. You have about a minute. You do not know or care what "automation", "SEO", "lead follow-up" or "Growth Audit" mean unless the page tells you in your own words.
Go through the site at 390x844 (take a screenshot at every scroll stop with ${R}/tools/shoot.js in mobile-light, then mobile-dark for the home page, and open every image), in the order a real visitor would: /start/ (where the email link lands), then the home page, /pricing/, /consulting/, /work/, /about/, /contact/. Then do the same once on a laptop (1280x800) for /, /pricing/ and /consulting/.
For each page write what you understood in the first screen (in Dale's words), what you tapped, where you got confused, bored or suspicious, what you could not find (What does it cost? Who is this guy? Is he local? Will I own it? What happens after I call? How long does it take? What is the catch with the monthly plans?), and whether you would call. Then, as the reviewer behind Dale, turn each real stumble into a finding: wording that is jargon or salesy or too clever; a price or term that is hard to find; a section that says nothing; a mock-up Dale would mistake for a real customer conversation or would not understand at all; an order of sections that makes him scroll past what he came for; a button that does not say what happens next; anything that feels like the last web company; anything too long. Also list the three things on the site that would most make Dale trust it, so they are protected.
Do not invent requirements: the hard rules in BRIEF.md stand (no testimonials can be added, prices are fixed, facts cannot change). A finding's fix must be something the site can truthfully do: reword, reorder, shorten, relabel, move a fact up.`,
  visualA: `
YOUR DIMENSION: VISUAL QUALITY, PAGES A: / , /start/ , /pricing/ , /consulting/ , /services/ . You are an exacting creative director signing off the pages before they go live.
Take your own screenshots with ${R}/tools/shoot.js for those pages in ALL of: small-light (360), mobile-light and mobile-dark (390), tablet-light (820), laptop-light (1280), desktop-light and desktop-dark (1440), wide-light (1920), with --max 40, and OPEN EVERY IMAGE. Also check the in-between widths where layouts switch (600, 760, 980, 1100, 1280: shoot at each breakpoint and 20px either side for the first screen and for any table or multi-column section).
Report concrete visual defects only: elements that overlap, touch or are clipped; a headline or price that wraps badly (one word alone on a line, a broken phrase, a price split from its unit); misaligned edges or baselines within a row; uneven or doubled spacing between sections (a band of dead space, two sections jammed together); a column that leaves an obvious hole; inconsistent treatment of the same component between these pages (section headers, buttons, price formatting, card radii, shadows); a first screen that does not show what it should (at 390x664 and 1280x800: headline, primary action, and a price or the page's subject); images soft, stretched or cropped oddly; the night theme where something is unfinished (a light box on dark, an invisible border, art that vanishes, a band that does not read); the sticky phone bar or header covering content it should not; anything that looks like a template or a mistake. For each, give the page, width, theme, the section's heading, and the screenshot file.
Also give each of the five pages a score out of 100 against BRIEF.md section 3 and say in one line what would lift it most.`,
  visualB: `
YOUR DIMENSION: VISUAL QUALITY, PAGES B: /work/ , /process/ , /contact/ , /faq/ , /about/ , /404.html , /web-design-baton-rouge/ , /web-design-denham-springs/ , /web-design-gonzales/ , /web-design-prairieville/ , /privacy/ , /terms/ , /checkout/ , /checkout/success/ . You are an exacting creative director signing off the pages before they go live.
Take your own screenshots with ${R}/tools/shoot.js for those pages in ALL of: small-light (360), mobile-light and mobile-dark (390), tablet-light (820), laptop-light (1280), desktop-light and desktop-dark (1440), wide-light (1920), with --max 40, and OPEN EVERY IMAGE (the four city pages share a template: study one fully and check the other three for differences caused by their different text lengths). For checkout, also load /checkout/?plan=<a value the pricing page uses> so the order summary is filled in. Also check the in-between widths where layouts switch (600, 760, 980, 1100, 1280).
Report concrete visual defects only: elements that overlap, touch or are clipped; a headline or price that wraps badly (one word alone on a line, a broken phrase); misaligned edges or baselines within a row; uneven or doubled spacing between sections; a column that leaves an obvious hole; inconsistent treatment of the same component between pages (section headers, buttons, price formatting, card radii, shadows, the page head); a first screen that does not show what it should; images soft, stretched or cropped oddly; the night theme where something is unfinished; the sticky phone bar or header covering content it should not; form states that look wrong (focus, error, success, disabled); anything that looks like a template or a mistake. For each, give the page, width, theme, the section's heading, and the screenshot file.
Also give each page a score out of 100 against BRIEF.md section 3 and say in one line what would lift it most.`,
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    checkedAndFine: { type: 'string' },
    couldNotCheck: { type: 'array', items: { type: 'string' } },
    scores: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          pages: { type: 'string' },
          where: { type: 'string' },
          what: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['id', 'severity', 'pages', 'where', 'what', 'evidence', 'fix'],
      },
    },
  },
  required: ['checkedAndFine', 'findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          holds: { type: 'boolean', description: 'true only if you reproduced it yourself' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'], description: 'your own judgement of severity if it holds' },
          note: { type: 'string', description: 'how you reproduced it, or why it does not hold; corrections to the proposed fix' },
        },
        required: ['id', 'holds', 'note'],
      },
    },
    missed: { type: 'array', items: { type: 'string' }, description: 'anything serious you noticed that the reviewer missed (rare)' },
  },
  required: ['verdicts'],
}

const keys = WANT.filter(k => DIMS[k])
if (!keys.length) return { error: 'no known dimensions in args.dims', known: Object.keys(DIMS) }
log('Review ' + STAGE + ' dimensions: ' + keys.join(', '))

const results = await pipeline(
  keys,
  key => agent(CONTEXT + DIMS[key] + HOW_TO_REPORT, { label: 'find: ' + key, phase: 'Find', schema: FINDINGS_SCHEMA }),
  async (found, key) => {
    if (!found) return { key, found: null, verdicts: null, confirmed: [] }
    const list = found.findings || []
    if (!list.length) return { key, found, verdicts: null, confirmed: [] }
    const v = await agent(CONTEXT + `
YOUR JOB: BE THE SKEPTIC. Another reviewer examined the site for the dimension "${key}" and reported the findings below. Before anyone spends time fixing them, re-check each one yourself, independently, against the site as it is now. Reproduce it with your own measurement, screenshot or reading of the code; do not accept the reviewer's evidence at face value. A finding HOLDS only if you reproduced it and it is a real defect for a real visitor, the owner or a search engine, not a matter of taste, not something listed above as known and accepted, and not a misreading of the hard rules. Default to "does not hold" when you cannot reproduce it. Where it holds, give your own severity and correct the proposed fix if it is wrong or would break something else (name the exact file and selector). Your scripts and screenshots go in ${R}/review/${STAGE}/${key}-verify/ .
THE REVIEWER'S BRIEF WAS:
${DIMS[key]}
THE FINDINGS:
${JSON.stringify(list, null, 1)}
`, { label: 'verify: ' + key, phase: 'Verify', schema: VERDICT_SCHEMA })
    const byId = {}
    for (const x of ((v && v.verdicts) || [])) byId[x.id] = x
    const confirmed = list.filter(f => byId[f.id] && byId[f.id].holds).map(f => ({ ...f, severity: byId[f.id].severity || f.severity, verifierNote: byId[f.id].note, dimension: key }))
    const unverified = v ? [] : list.map(f => ({ ...f, dimension: key, verifierNote: 'NOT VERIFIED: the verifier did not return' }))
    log(key + ': ' + list.length + ' reported, ' + confirmed.length + ' confirmed' + (v ? '' : ' (verifier failed; passing all through unverified)'))
    return { key, found, verdicts: v, confirmed: confirmed.concat(unverified) }
  }
)

const all = results.filter(Boolean).flatMap(r => r.confirmed || [])
return {
  stage: STAGE,
  dims: keys,
  confirmedCount: all.length,
  bySeverity: { blocker: all.filter(f => f.severity === 'blocker').length, major: all.filter(f => f.severity === 'major').length, minor: all.filter(f => f.severity === 'minor').length },
  confirmed: all,
  notes: results.filter(Boolean).map(r => ({ key: r.key, checkedAndFine: r.found && r.found.checkedAndFine, couldNotCheck: r.found && r.found.couldNotCheck, scores: r.found && r.found.scores, missed: r.verdicts && r.verdicts.missed, reported: r.found ? (r.found.findings || []).length : null })),
}
