export const meta = {
  name: 'kws-motion-place',
  description: 'Assemble the hand-built motion kit, install it in the site (scripts, styles, new footer and closing band), place the components on the pages, then fold and verify',
  phases: [
    { title: 'Assemble', detail: 'merge the four kit groups into one portable kit and write the placement plan' },
    { title: 'Install', detail: 'kit files, new footer and closing band, pause control, shared wiring' },
    { title: 'Place', detail: 'one designer-engineer per page group puts the components on the pages' },
    { title: 'Finish', detail: 'fold temporary page styles, full check battery' },
  ],
}

const R = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
const REPO = '/home/user/Knightwebstudio'
const SERVER = 'http://localhost:8720'
const KIT = R + '/motion/kit'
const DIST = R + '/motion/dist'
const ALL_PATHS = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'

const WHO = `You are on the team finishing the full redesign of knightwebstudio.com ("a top-notch $100,000 website" for a one-person web studio and small-business consultancy in Baton Rouge whose customers are local tradespeople, mostly on phones). All 19 pages have been redesigned in the "Main Street premium" art direction and integrated into one stylesheet. The owner then sent a screenshot of the kind of animated components he wants on the site (folder cards, bookmark cards with flowing shader art, an arc carousel, a cylinder slider, a spotlight carousel, a ring of cards, animated shader backgrounds, better footers and calls to action), asked for everything that can be had for free, and asked that the same components be reusable on client websites. Four designer-engineers hand-built ORIGINAL versions of all of them (no copied code, no paid assets) as a portable kit; each was reviewed by a creative director and a performance-and-accessibility engineer and fixed.`

const GROUND = `
GROUND RULES
- The real site is the git repository at ${REPO} (branch claude/site-refresh, plain HTML/CSS/JS, no build step), served at ${SERVER} (if it is down: (nohup python3 -m http.server 8720 --directory ${REPO} >/dev/null 2>&1 &) ). The kit is served at http://localhost:8730/kit/ with the repository behind it (if down: (nohup python3 ${R}/motion/serve.py >/dev/null 2>&1 &) ).
- Never run a git command that changes anything (add, commit, checkout, switch, stash, reset, restore, clean, merge, rebase, pull, push). Read-only git (status, diff, log, show) is fine.
- Scratch files, screenshots, notes and test copies go under ${R}/motion/ , never inside the repository (everything in the repository ships to the live site).
- Never write the words "AI", "artificial intelligence", "chatbot", "GPT" or "machine learning" anywhere, including comments, class names and file names.
- ORIGINAL WORK ONLY: no code, shader code or artwork copied from scrolltide.co, scrollshaders.com or any other site or library. Small MIT or public-domain snippets keep their licence note.
- Do not ask questions; decide, and record the decision in your final report.
- Never delete files outside the repository and ${R}/motion/ .
`

const READING = `
READ FIRST
1. ${R}/BRIEF.md   the business, the audience, the quality bar, the HARD RULES (honesty, fixed prices, facts, SEO, behaviour that must keep working, engineering)
2. ${R}/ROLLOUT.md and ${R}/DESIGN.md   the art direction and the design system handbook (tokens, breakpoints, components, colour rule)
3. ${R}/motion/research/DIGEST.md   what the owner asked for, the licence conclusion, the guardrails, portability for client sites, and the proposed placement plan
4. ${REPO}/README.md and ${REPO}/assets/css/styles.css (its table of contents first)
Test tools in ${R}/tools/: shoot.js (scrolling screenshots; note it does not enable WebGL, so write your own Playwright launch with args ['--enable-unsafe-swiftshader','--use-angle=swiftshader'] when you need to see a shader), compare.js (pixel comparison of two copies of the site), widths.js, contrast.js, smalltext.js, behaviour.js, check_site.py (python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline [--pages a,b] [--show-missing] [--show-new-numbers]).
`

const GUARD = `
GUARDRAILS (every component, on every page)
- Phone first: at 390px it is at least as easy as a plain list, and the page is not slower or more confusing for a roofer on an iPhone. Nothing auto-advances. Vertical page scrolling is never blocked; the wheel is never hijacked.
- HTML first: the content is ordinary semantic HTML that reads well with JavaScript off; scripts only enhance. No layout shift when a script upgrades a component.
- prefers-reduced-motion and html[data-motion="off"] give a still, complete page. Anything that moves for more than five seconds can be paused with the visible site-wide control.
- Pointer, touch and keyboard all work; focus is visible, never trapped, never hidden under the sticky bars; screen readers get a labelled list, not a canvas; touch targets are at least 44px.
- Animated backgrounds never take text below 4.5:1, render at a capped resolution and frame rate, stop off screen and in background tabs, and fall back to a still CSS background with no WebGL or with Save-Data. At most one live canvas in view at a time.
- No libraries, no CDNs. Each script file under 60 KB. Scripts load with defer, only on pages that use them, and never block first paint.
- Honest content only: facts already on the site. No invented statistics, testimonials, logos, ratings or stock photos; no price ranges or "from"; examples in mocks are marked "Example"; nothing blue inside a mock; gold only on blue.
- One showpiece per screen. A component replaces or upgrades an existing section; it never makes a page tell the same thing twice, and it never makes a page longer on a phone than it is now by more than about one screen.
- SEO and facts: <title>, meta tags and structured data untouched; no fact lost or added; FAQ, privacy and terms wording untouched; city pages' headings and body copy untouched; contact form, calculator and checkout behaviour untouched (checkout inline scripts and ids byte for byte).
`

const ASSEMBLE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    sizes: { type: 'string' },
    placement: {
      type: 'array',
      description: 'the placement plan: one entry per page group',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'short id for the group, letters only' },
          pages: { type: 'array', items: { type: 'string' }, description: 'site-relative page files, e.g. index.html, services/index.html' },
          paths: { type: 'array', items: { type: 'string' }, description: 'URL paths, e.g. /, /services/' },
          plan: { type: 'string', description: 'exactly which component goes in which existing section of which page, what it replaces, what content it carries, and what must not change' },
        },
        required: ['key', 'pages', 'paths', 'plan'],
      },
    },
    notPlaced: { type: 'array', items: { type: 'string' }, description: 'components deliberately left off the site (still in the kit for client builds), each with the reason' },
    openIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'files', 'sizes', 'placement', 'openIssues'],
}

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    sizes: { type: 'string' },
    checkerResult: { type: 'string' },
    measurements: { type: 'string' },
    decisions: { type: 'array', items: { type: 'string' } },
    sharedIssues: { type: 'array', items: { type: 'string' } },
    openIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'openIssues'],
}

const ASSEMBLE_PROMPT = `
${WHO}
YOUR PART: ASSEMBLE THE KIT AND WRITE THE PLACEMENT PLAN. You change nothing in the repository in this pass.
${READING}
${GROUND}
THE FOUR KIT GROUPS are in ${KIT}/light/ (animated backgrounds "wash", "band", "ribbon"; the site-wide motion pause control; folder cards; bookmark cards), ${KIT}/flat/ (arc focus carousel; spotlight carousel), ${KIT}/depth/ (cylinder slider; carousel ring) and ${KIT}/closing/ (closing call-to-action band variants; the new footer and its slim variants, as replacement chrome partials). Read every NOTES.md and every source file, open every demo.html (http://localhost:8730/kit/<group>/demo.html) at 390x844 and 1440x900 in both themes, interact with each component, and look at screenshots at several moments.

PART 1. ONE PORTABLE KIT in ${DIST}/ :
 - shader.js (animated backgrounds + the pause control's behaviour), motion.js (everything else that needs script: carousels, folder stack, ring), motion.css (all component styles). Merge the groups' files; remove duplicated helpers (pointer drag with inertia and snap, visibility observer, reduced-motion and data-motion checks, live-region announcer) into one shared core inside motion.js; keep every behaviour the groups' NOTES promise. Each script under 60 KB, shader.js ideally under 18 KB, motion.js under 32 KB, motion.css under 22 KB. Each script auto-starts on [data-kws] / [data-shader] elements at DOMContentLoaded and exposes window.KWS.<name>.mount(element, options) returning a remover. Kit class names start with "kws-". The theme contract from the digest's section 5 holds (kit variables with fallbacks to this site's tokens; no site-specific selectors).
 - demo/index.html : every component on one page, with the site's stylesheet, in realistic sections with real site content, plus a "client re-skin" toggle that sets the kit variables to a completely different brand to prove portability.
 - README.md : the kit handbook. For each component: what it is for and which businesses it suits; the canonical markup; attributes and options; what happens with script off, reduced motion and motion paused; keyboard and screen-reader behaviour; how to place it on a static page; how to mount it from a React component (a short example with useEffect and cleanup); the theme variables. Then a section "Using the kit on a client site" (copy three files, set thirteen variables, include the scripts with defer) and the guardrails. Plain language. This file will be handed to people building client sites.
 - Re-run the groups' checks on the assembled kit (script off, reduced motion, motion paused, keyboard, touch drag not blocking vertical scroll, contrast over animated backgrounds across at least 20 frames, frame times under 4x CPU throttle at 390px, no console errors, mount and remove ten times without leaks, 360 to 1920 without sideways scroll) and fix what the merge broke.

PART 2. THE PLACEMENT PLAN, written to ${R}/motion/PLACEMENT.md and returned in your structured output.
 Walk the site as it is now (${SERVER}, all 19 pages, phone and desktop) and decide, page by page, which component goes where. Start from the digest's proposal (section 6) and change it wherever the real pages say otherwise. For each placement say: the page and the exact existing section it replaces or upgrades (quote its heading); the component; the content it carries (taken from that section, word for word where the hard rules require); what the phone view becomes; what must not change (ids, anchors, links, form fields, facts). Rules for the plan:
 - Every one of the eight things the owner asked for appears somewhere on the site where it genuinely helps: animated backgrounds, folder cards, bookmark cards, arc carousel, cylinder slider, spotlight carousel, ring, and the new footer and closing band. If one truly cannot be placed without hurting a page, say so under notPlaced with the reason; it stays in the kit for client sites.
 - One showpiece per screen; at most two interactive showpieces per page besides backgrounds; contact, FAQ, privacy, terms, checkout and 404 get no showpiece (only the new footer and the pause control; the legal and checkout pages get no animated background at all).
 - The four city pages: presentation only; their headings and body copy stay word for word.
 - Group the pages into four to six placement groups that can be worked on at the same time by different people without touching the same files (each page in exactly one group). Suggested: home; services; work and process; pricing and consulting; start, about and the four city pages. Pages that receive nothing but the shared footer need no group.
Return the kit's files and sizes, the placement groups, what is not placed and why, and open issues.
`

const INSTALL_PROMPT = asm => `
${WHO}
YOUR PART: INSTALL THE KIT IN THE SITE'S SHARED LAYER. You are the only person editing the repository in this pass.
${READING}
Then read ${DIST}/README.md (the kit handbook), ${R}/motion/PLACEMENT.md (the placement plan) and ${KIT}/closing/NOTES.md (the new footer and closing band).
${GROUND}
${GUARD}
THE ASSEMBLER REPORTED
${JSON.stringify({ summary: asm.summary, files: asm.files, sizes: asm.sizes, notPlaced: asm.notPlaced, openIssues: asm.openIssues }, null, 1)}

DO
 1. Copy the kit into the site: ${REPO}/assets/js/shader.js and ${REPO}/assets/js/motion.js ; append the kit's styles to ${REPO}/assets/css/styles.css as a clearly titled "Motion kit" part (the site ships ONE stylesheet), and extend the table of contents. Add the bridge, if any is needed, that maps the site's tokens onto the kit variables. Keep the stylesheet token-driven and within the six breakpoints.
 2. The new footer and its slim variants: replace the partials in ${REPO}/tools/chrome/ with the kit's versions (keeping exactly the links, phone, email, "Based in Baton Rouge, Louisiana", crest, legal row and #year the current footer has), move their styles into the shared stylesheet in place of the old footer rules, then run python3 tools/sync_chrome.py so every page gets them, and --check. The footer must be excellent at 360px and must not be taller on a phone than the current one (it is about 1,140px at 390px today; shorter is better).
 3. The site-wide motion pause control: put it where the kit's notes say (in the chrome, so every page with any motion has it), with its behaviour in shader.js or motion.js, remembered in localStorage, reflected as html[data-motion="off"]. Pages with no motion at all (privacy, terms, checkout, checkout success, 404) do not load the kit scripts and do not show the control.
 4. The closing call-to-action band: make the kit's variants available as shared components (styles in the shared stylesheet, canonical markup in ${R}/DESIGN.md), and switch the pages' existing closing bands to the right variant per the placement plan, keeping each page's existing wording, links and booking-button attributes. This is the one page-content change you make yourself; everything else on the pages belongs to the placement engineers who work after you.
 5. Script loading: decide once how pages load shader.js and motion.js (defer, after main.js, only on pages that use them) and document it in ${R}/DESIGN.md and in the README's page conventions. Add the script tags to exactly the pages the placement plan says will use them. The checker must still pass: main.js behaviours untouched, SITE_CONFIG identical to the baseline, checkout pages' inline scripts byte for byte.
 6. README.md: add a "Motion kit" section (what each file is, the components, how to place one, the pause control, the guardrails, how to re-skin for a client site), in the README's plain style.
VERIFY: python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline prints zero FAIL; sync_chrome.py --check passes; shoot.js over all 19 pages in mobile-light, mobile-dark, desktop-light, desktop-dark reports no console errors, failed requests or overflow, and you have looked at the footer and closing band on at least eight pages in both themes on a phone and a desktop (with WebGL enabled for at least one pass); widths.js, contrast.js, smalltext.js and behaviour.js clean on all pages; JavaScript off: footer and bands complete; reduced motion and motion paused: everything still.
Report: what you installed and where, the file sizes (styles.css total, shader.js, motion.js), the checker's last lines, the phone height of the footer before and after, decisions, and open issues.
`

const placePrompt = (g, asm, inst) => `
${WHO}
YOUR PART: PLACE THE COMPONENTS ON YOUR PAGES. The kit is installed in the site's shared layer (scripts, styles, new footer, closing bands, pause control). Several other engineers are placing components on OTHER pages at the same time.
${READING}
Then read ${DIST}/README.md (the kit handbook: canonical markup, attributes, guardrails) and ${R}/motion/PLACEMENT.md (the whole placement plan).
${GROUND}
- OTHER ENGINEERS ARE EDITING OTHER PAGES RIGHT NOW. Touch ONLY your pages: ${g.pages.map(p => REPO + '/' + p).join(' , ')} . Edit their HTML directly in the repository (the repository is the truth now; do not use older content files). Do NOT edit assets/css/styles.css, assets/js/*, tools/ or any other page. If your pages need a few page-only rules, write them in ${REPO}/assets/css/pages/<data-page slug>-motion.css (every selector starting with [data-page="<slug>"], tokens only, the six breakpoints, hover inside @media (hover: hover), no !important) and link that file from your pages with <link rel="stylesheet" href="/assets/css/pages/<slug>-motion.css"> placed right after the main stylesheet link; a finisher folds these files into the one stylesheet afterwards. Keep such files tiny (under 2 KB): the kit's styles are already in the shared stylesheet.
- If something shared is wrong or missing (kit script, kit styles, footer, band, pause control), do not fix it: work around it only if your page is visibly broken without it, and report it under sharedIssues.
${GUARD}
YOUR PLACEMENT PLAN
${g.plan}

THE INSTALLER REPORTED
${JSON.stringify({ summary: inst.summary, decisions: inst.decisions, openIssues: inst.openIssues }, null, 1)}

HOW TO WORK
1. Read your pages as they are and the sections the plan names. List every fact, link, id and anchor in those sections: none may be lost; none may be added.
2. Place each component with the kit's canonical markup, carrying the section's own content. Make it belong: the same section headers, spacing rhythm and tone as the rest of the page. If, once you see it on the real page, a placement makes the page worse (slower to understand on a phone, repeats another section, pushes the call to action down), change the placement or leave that component off this page and say why. A component left off for a good reason is better than one that hurts the page.
3. LOOK: screenshots at 390x844, 820x1100, 1280x800 and 1440x900 in both themes, at rest and during interaction, with WebGL enabled when a background is involved. Open the images. Iterate until you would put your name on it.
4. VERIFY (run; fix; repeat): python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline --pages ${g.pages.join(',')} --show-missing --show-new-numbers : zero FAIL, no fact lost, no new figure (a WARN for your temporary page stylesheet link is expected); node ${R}/tools/shoot.js --base ${SERVER} --paths ${g.paths.join(',')} --out ${R}/motion/place/${g.key}/shots --modes mobile-light,mobile-dark,small-light,tablet-light,laptop-light,desktop-light,desktop-dark,wide-light --max 30 : no console errors, failed requests or overflow; no sideways scroll from 360 to 1920 in 20px steps; contrast AA in both themes, including text over animated backgrounds across many frames; touch targets 44px; JavaScript off: every section complete and tidy; reduced motion and html[data-motion="off"]: still and complete; keyboard walk-through of every placed component; touch drag does not block vertical scroll; the page's own behaviours still pass (node ${R}/tools/behaviour.js); phone page height before and after.
Your final report: what you placed where, what you left off and why, the phone heights before and after, the checker's last lines, shared issues, and anything not right yet.
`

const FINISH_PROMPT = (asm, inst, placed) => `
${WHO}
YOUR PART: FINISH. The kit is installed and the components are placed on the pages by several engineers working in parallel, each of whom may have written a small temporary page stylesheet. You are the only person editing the repository now.
${READING}
Then read ${DIST}/README.md and ${R}/motion/PLACEMENT.md .
${GROUND}
${GUARD}
THE PLACEMENT REPORTS
${JSON.stringify(placed, null, 1)}

DO, IN ORDER
 1. Freeze a copy for comparison: copy the repository's working tree (without .git) to ${R}/motion/preplacefold/ and serve it on port 8723 ((nohup python3 -m http.server 8723 --directory ${R}/motion/preplacefold >/dev/null 2>&1 &)).
 2. Fold: append each assets/css/pages/*-motion.css to the matching page block in assets/css/styles.css (keeping the [data-page] scoping), remove their <link> tags from the pages, delete the assets/css/pages/ folder. Prove nothing changed: node ${R}/tools/compare.js --a http://localhost:8723 --b ${SERVER} --out ${R}/motion/cmp-fold reports 0 combinations differing (motion is reduced in that tool, so backgrounds are still frames).
 3. Shared issues the placement engineers reported: verify each, fix what is real in the shared layer (kit scripts, kit styles, chrome via tools/chrome + sync_chrome.py), and look at every page that uses what you changed. Keep ${DIST}/ (the portable kit for client sites) in step with any fix you make to the kit files in the repository, so the two never drift.
 4. Consistency: the same component placed on different pages uses the same markup and behaves the same; section headers around the components match the rest of the site; the pause control is present on exactly the pages that have motion.
 5. FULL BATTERY (fix what it shows; repeat until clean): python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline --show-missing --show-new-numbers : zero FAIL and no extra-stylesheet WARN; node ${R}/tools/shoot.js --base ${SERVER} --paths ${ALL_PATHS} --out ${R}/motion/final-shots --modes mobile-light,mobile-dark,desktop-light,desktop-dark,tablet-light,laptop-light,small-light,wide-light --max 30 : no console errors, failed requests or overflow on any combination, and you have looked at every page on a phone and a desktop; widths.js, contrast.js, smalltext.js, behaviour.js clean on all pages; JavaScript off over all pages; reduced motion and motion paused over all pages with components; with WebGL enabled: every animated background renders, keeps text at 4.5:1 or better across many frames, stops off screen, and only one canvas is live in view; frame times while scrolling the home page at 390px with 4x CPU throttle; total sizes (styles.css, main.js, shader.js, motion.js; each script under 60 KB); a Lighthouse-style sanity check of the home page if you can run one (no layout shift from the kit, scripts deferred).
 6. README.md and ${R}/DESIGN.md are true of the site as it now stands.
Report: the fold comparison, what you fixed, the battery's results, the file sizes, the phone height of every page before the kit and after, and every issue still open.
`

phase('Assemble')
const asm = await agent(ASSEMBLE_PROMPT, { model: 'opus', effort: 'xhigh', label: 'assemble kit + placement plan', phase: 'Assemble', schema: ASSEMBLE_SCHEMA })
if (!asm) return { error: 'the kit assembly did not finish' }
const groups = (asm.placement || []).filter(g => g && g.pages && g.pages.length)
log('Kit assembled: ' + (asm.sizes || '').slice(0, 200))
log('Placement groups: ' + groups.map(g => g.key + ' (' + g.pages.length + ')').join(', '))

if (args && args.stopAfter === 'assemble') return { asm, stopped: 'after assemble' }

phase('Install')
const inst = await agent(INSTALL_PROMPT(asm), { model: 'opus', effort: 'xhigh', label: 'install kit, footer, bands', phase: 'Install', schema: REPORT_SCHEMA })
if (!inst) return { error: 'the install did not finish', asm }

phase('Place')
const placed = (await parallel(groups.map(g => () => agent(placePrompt(g, asm, inst), { model: 'opus', effort: 'xhigh', label: 'place: ' + g.key, phase: 'Place', schema: REPORT_SCHEMA }).then(r => r ? { key: g.key, pages: g.pages, ...r } : null)))).filter(Boolean)
log('Placed on ' + placed.length + ' of ' + groups.length + ' groups')

phase('Finish')
const fin = await agent(FINISH_PROMPT(asm, inst, placed), { model: 'opus', effort: 'xhigh', label: 'fold and verify', phase: 'Finish', schema: REPORT_SCHEMA })
return { asm, inst, placed, fin }
