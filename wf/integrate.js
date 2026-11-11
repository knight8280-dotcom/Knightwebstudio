export const meta = {
  name: 'kws-refresh-integrate',
  description: 'Fold the page stylesheets into the single stylesheet, resolve shared issues, finish assets and README, then verify the integration independently',
  phases: [
    { title: 'Fold', detail: 'page stylesheets into one, proven pixel-identical; reported issues triaged into one worklist' },
    { title: 'Shared fixes', detail: 'fix the shared layer once, promote repeated workarounds' },
    { title: 'One site', detail: 'cross-page consistency, assets, README, full check battery' },
    { title: 'Verify', detail: 'independent regression and rules check' },
    { title: 'Fix', detail: 'second pass on what verification found' },
  ],
}

const R = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
const REPO = '/home/user/Knightwebstudio'
const SERVER = 'http://localhost:8720'
const PREFOLD = 'http://localhost:8722'
const A = args || {}
const ALL_PATHS = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'

const GROUND = `
GROUND RULES FOR THIS RUN
- The real site is the git repository at ${REPO} (branch claude/site-refresh, plain HTML/CSS/JS, no build step), served at ${SERVER} (if it is down: (nohup python3 -m http.server 8720 --directory ${REPO} >/dev/null 2>&1 &) ). You are the only agent working in it now.
- A frozen copy of the site as it was before this integration is in ${R}/prefold/ and served at ${PREFOLD} (if it is down: (nohup python3 -m http.server 8722 --directory ${R}/prefold >/dev/null 2>&1 &) ). Never edit it: it is what you compare against.
- Never run a git command that changes anything (add, commit, checkout, switch, stash, reset, restore, clean, merge, rebase, pull, push). Read-only git (status, diff, log, show) is fine.
- Scratch files, screenshots, notes and test copies go under ${R}/integrate/ , never inside the repository (everything in the repository ships to the live site).
- Never write the words "AI", "artificial intelligence", "chatbot", "GPT" or "machine learning" anywhere, including comments, class names and file names.
- Do not ask questions; decide, and record the decision in your final report.
- Never delete files outside the repository and ${R}/integrate/ .
`

const READING = `
READ FIRST, COMPLETELY, IN THIS ORDER
1. ${R}/BRIEF.md      the business, the audience, the quality bar, the HARD RULES, the tools
2. ${R}/ROLLOUT.md    the chosen direction, the must-fix list, decisions already made
3. ${R}/DESIGN.md     the handbook: tokens, breakpoints, components, the page build tool (${R}/tools/kws_page.py), page-stylesheet rules
4. ${REPO}/README.md  the repository's conventions as currently written
Then read ${REPO}/assets/css/styles.css , every file in ${REPO}/assets/css/pages/ , ${REPO}/tools/sync_chrome.py , ${REPO}/tools/chrome/ , ${R}/tools/kws_page.py and ${R}/tools/check_site.py .
Test tools in ${R}/tools/: shoot.js (scrolling screenshots + report.json), compare.js (pixel comparison of two copies of the site: node ${R}/tools/compare.js --a ${PREFOLD} --b ${SERVER} --out DIR [--paths ...] [--widths 390,1440] [--themes light,dark]), widths.js, contrast.js, smalltext.js, behaviour.js, check_site.py.
`

const INT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    cssBytes: { type: 'string' },
    checkerResult: { type: 'string', description: 'last lines of check_site.py over all pages' },
    foldComparison: { type: 'string', description: 'result of the pixel comparison right after the fold, before any other change' },
    sharedFixed: { type: 'array', items: { type: 'string' } },
    sharedSkipped: { type: 'array', items: { type: 'string' }, description: 'each with the reason' },
    decisions: { type: 'array', items: { type: 'string' } },
    openIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'cssBytes', 'checkerResult', 'openIssues'],
}

const ISSUES_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ready', 'needs-fixes'] },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          where: { type: 'string' },
          what: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'where', 'what', 'fix'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['verdict', 'issues'],
}

const WHO = `You are on the integration team for the full redesign of knightwebstudio.com ("a top-notch $100,000 website" for a one-person web studio in Baton Rouge whose customers are local tradespeople on phones). A system architect built the shared design system; ten designer-engineers then redesigned all 19 pages in parallel, each writing page-only rules into its own file under assets/css/pages/ and reporting problems in shared files instead of fixing them (the shared stylesheet was frozen at a size cap during that phase; the cap is lifted now). The job now is to make it ONE coherent, shippable site.`

const COMING = `
KNOW THIS: a separate team is building a new footer, a new closing call-to-action band and animated components (a "motion kit") that will be placed on the pages right after this integration. So do NOT redesign the footer or the closing band, and do not spend effort shortening them; fix only real bugs in them. Everything else in the shared layer is yours.`

const TRIAGE_PROMPT = `
${WHO}
YOUR PART: TRIAGE. You change nothing in the repository. You turn several hundred raw notes into one worklist the next engineer can act on without re-reading them.
${READING}
${GROUND}
${COMING}
THE RAW MATERIAL: ${R}/rollout-results.json holds, per page group, the builder's report ("built"), the two reviewers' reports ("reviews", each with issues and sharedIssues), the fix pass's report ("fixed", with sharedIssues and openIssues) and "shared" (the reviewers' and builder's shared issues gathered). Read every sharedIssues and openIssues entry in it (use a script to list them; there are several hundred, with heavy duplication between groups). Also grep ${REPO}/assets/css/pages/*.css for comments starting "SHARED-CANDIDATE:" and read each block they mark.
WHAT TO PRODUCE: ${R}/integrate/WORKLIST.md , with:
 1. SHARED FIXES: one entry per distinct real problem in the shared layer (styles.css, tools/chrome partials, assets/js/main.js, tools/). Merge duplicates. For each: a short name; which groups reported it; exactly where (file, selector, viewport, theme); what is wrong; the fix you recommend; priority P1 (visible defect, accessibility failure, broken behaviour, or a hard rule), P2 (clear improvement, cheap) or P3 (leave, with the reason). VERIFY before you list: reproduce each P1 and P2 yourself against ${SERVER} (measure, screenshot, or read the code) and say how you confirmed it; drop what does not reproduce and say so in an appendix. Group entries by file/component so related ones are fixed together.
 2. PROMOTIONS: every SHARED-CANDIDATE block, grouped by what it works around; for each group say "promote to one shared rule" (when two or more pages carry the same workaround or it is really a missing shared component: give the unified rule and list the page rules to delete) or "leave local" (one page only).
 3. PAGE-LEVEL OPEN ISSUES worth fixing during integration (cheap and clearly right), per page, with the fix; and those to leave, with the reason.
 4. OWNER DECISIONS: things only the owner can decide (for example wording choices the builders flagged), each in one line with the default that is in place now.
 5. NOT TESTED: what nobody has verified (other browsers, real devices, the real captcha, and so on).
Be exact and terse. Return the path and counts.
`

const FOLD_PROMPT = `
${WHO}
YOUR PART: THE FOLD. A pure refactor; nothing may change on screen. Do not fix or improve anything else in this pass, however tempting: another engineer does that next, from a clean base.
${READING}
${GROUND}
STEPS
 a. The site must ship with ONE stylesheet, assets/css/styles.css . Append every assets/css/pages/<slug>.css to it under a clearly marked "Pages" part of the file, one titled block per page in a sensible fixed order, keeping the [data-page="<slug>"] scoping exactly as written, and extend the table of contents at the top. Do not change, merge or reorder rules inside a block.
 b. Remove the <link> to each page stylesheet from every page, and delete the assets/css/pages/ folder. Each page's <head> must then differ from the baseline head only in the theme-color, the first-paint snippet and the font preloads. (Rebuilding with ${R}/tools/kws_page.py from the main files in ${R}/pages/ does this once the folder is gone; make sure the rebuilt pages are otherwise byte-identical to what is in the repository now, apart from the removed link. If a rebuilt page differs in any other way, stop and find out why before going on: the repository's page is the truth, the main file may be stale.)
 c. Prove the fold changed nothing: node ${R}/tools/compare.js --a ${PREFOLD} --b ${SERVER} --out ${R}/integrate/cmp-fold   must report 0 of 76 combinations differing (19 pages, 390 and 1440 wide, light and dark). If any differ, the cause is cascade order or a lost rule: find it and fix it until the comparison is clean. Also run it at --widths 820,1280 .
 d. python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline : zero FAIL, and no WARN about an extra stylesheet.
Report: what you did, the comparison results, the size of styles.css, the checker's last lines, anything odd you noticed and left alone.
`

const SHARED_PROMPT = fold => `
${WHO}
YOUR PART: THE SHARED LAYER. The page stylesheets have just been folded into the one stylesheet (a pure refactor, proven pixel-identical). A triage engineer has turned several hundred reported issues into one verified worklist. You now fix the shared layer once, properly.
${READING}
Then read ${R}/integrate/WORKLIST.md completely.
${GROUND}
${COMING}
THE FOLD REPORTED
${JSON.stringify(fold, null, 1)}

DO
 1. SHARED FIXES from the worklist: every P1, then every P2. Fix each in the shared layer: styles.css (shared part), the chrome partials in tools/chrome/ (then run python3 tools/sync_chrome.py so every page gets them, and --check), assets/js/main.js (every behaviour in BRIEF.md section 4 must keep working; the SITE_CONFIG block stays identical to the baseline's; under 60 KB). Verify each entry before you change anything (it was confirmed by the triage, but look yourself), and after each fix look at EVERY page that uses the thing you changed, on a phone and a desktop, in both themes. A shared fix that helps one page and hurts another is not a fix.
 2. PROMOTIONS from the worklist: turn each repeated workaround into one shared rule and delete the page copies; remove the "SHARED-CANDIDATE:" marker comments everywhere (promoted or left local).
 3. The worklist's cheap page-level fixes.
 4. Dead and duplicate rules: find selectors that match nothing on any page and declarations repeated across page blocks that should be one shared rule; remove or merge them. Target for the whole stylesheet: 140 KB or less if that is reachable by removing duplication; never over 150 KB.
RULES: token-driven (no raw colours, sizes or durations outside the token block and geometry); six breakpoints (380, 600, 760, 980, 1100, 1280); no !important outside reduced-motion and utility resets; fallbacks before enhancements; hover inside (hover: hover); transform/opacity motion, one-shot, off under reduced motion; AA contrast in both themes; real focus rings. Every wording change respects the hard rules (no fact lost or added; FAQ, privacy and terms wording untouched; city pages' headings and body copy untouched).
WHEN DONE: check_site.py over all pages prints zero FAIL; sync_chrome.py --check passes; node ${R}/tools/compare.js --a ${PREFOLD} --b ${SERVER} --out ${R}/integrate/cmp-shared --widths 390,1440 and you have opened the diff image for every combination that differs and confirmed each difference is one you intended (list them); widths.js, contrast.js, smalltext.js and behaviour.js are clean on all 19 pages; no console errors.
Report: each worklist entry as fixed / skipped (why), the promotions made, the CSS size, the checker's last lines, the list of intended visual changes by page, and anything still open.
`

const ONE_PROMPT = (fold, shared) => `
${WHO}
YOUR PART: ONE SITE, NOT NINETEEN PAGES, then the finishing work. The page stylesheets have been folded into one, and the shared layer has just been fixed from a verified worklist.
${READING}
Then read ${R}/integrate/WORKLIST.md (especially its page-level and owner-decision sections).
${GROUND}
${COMING}
THE SHARED-LAYER ENGINEER REPORTED
${JSON.stringify(shared, null, 1)}

STEP 1. CONSISTENCY
 Walk all 19 pages side by side (phone and desktop, both themes; take the screenshots and look) and fix clear inconsistencies between pages that were built by different people: the same component used with different markup or spacing; section headers, eyebrows and ledes set differently; page heads of the same kind built differently; prices formatted differently within the same kind of list ("$1,000" vs "$1000", "/mo" vs "a month"); button labels for the same action; heading sizes for the same level of thing; inconsistent space under the header and above the closing band; a link style or list style that differs for no reason. Keep each page's own composition and signature moment: you are removing accidents, not redesigning. Every wording change respects the hard rules (no fact lost or added; FAQ, privacy and terms wording untouched; city pages' headings and body copy untouched). Write down each thing you unified.

STEP 2. ASSETS, TOOLS AND README
 - python3 tools/sync_chrome.py --check passes; python3 tools/art/build.py (all pages) leaves no page changed (if it changes something, find out why).
 - If the palette or crest changed since the favicon, app icons and link-preview image were rendered, run node tools/art/render.js again; open assets/img/og-image.png and the icons and check they are right and truthful. site.webmanifest colours match the tokens. No file in assets/ is unused (fonts: exactly fraunces-soft.woff2 and figtree.woff2); nothing references a missing file (crawl every href and src). sitemap.xml, robots.txt and CNAME are unchanged from the baseline.
 - The published tools folder: tools/chrome/*.inc are served by GitHub Pages as plain files. That is acceptable; make sure tools/ contains nothing that was only a scratch file.
 - README.md: rewrite the parts that describe the design, colours, fonts, artwork, page structure and conventions so they are true of the new site and useful to the owner and to the next person editing it: the idea in two sentences; the tokens and where they live; the two fonts; the six breakpoints; how a page is put together (data-page slugs, shared components, page blocks in styles.css); the header/footer partials and tools/sync_chrome.py (when to run it, the --check mode); tools/art (emblems.py, scenes.py, build.py with page arguments, render.js); the rules that protect the business (fixed prices, no invented proof, the never-use words, estimates labelled as estimates, the props rule); how to add or edit a page without a build step. Keep everything in the README that is still true and unrelated to the redesign (hosting, the contact form service, analytics, Stripe/server notes) exactly as accurate as it was. Plain language. Do not describe scratch tools that are not in the repository.

STEP 3. THE FULL CHECK BATTERY (fix what it shows; repeat until clean)
 - python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline --show-missing --show-new-numbers : zero FAIL and no WARN about an extra stylesheet. Explain every WARN that remains.
 - node ${R}/tools/shoot.js --base ${SERVER} --paths ${ALL_PATHS} --out ${R}/integrate/shots --modes mobile-light,mobile-dark,desktop-light,desktop-dark,tablet-light,laptop-light,small-light,wide-light --max 30   : no console errors, failed requests or horizontal overflow on any of the 152 combinations. Open a wide spread of the images (every page at least once on a phone and once on a desktop) and look.
 - No horizontal scroll on any page at any width from 360 to 1920 in 20px steps (widths.js). Measured AA contrast on every page in both themes (contrast.js). No text under 12px, no touch target under 44px, nothing a customer must read under 15px on a phone (smalltext.js). The scripted behaviours pass (behaviour.js). Every page is fully readable with JavaScript off (one pass with javaScriptEnabled:false over all pages; look at several).
 - CSS: one file; its size; token-driven; six breakpoints; no stray !important; no animation that loops forever. main.js under 60 KB. No inline style="" in any page except custom properties carrying data. Header and footer identical across the pages that share them.
Your final report: what you unified, what you did to assets and README, the battery's results, the CSS size, the checker's last lines, the owner decisions still open, and every issue still open.
`

const VERIFY_PROMPT = arch => `
You are a senior front-end engineer doing an independent, skeptical verification of the INTEGRATION of a website redesign: nineteen pages built by ten people were just folded into one stylesheet and reconciled by an integrator. You did not do the integration. Do NOT change anything in the repository; you only report. (Scratch files under ${R}/integrate/verify/ .)
${READING}
${GROUND}
THE INTEGRATOR REPORTED
${JSON.stringify(arch, null, 1)}

CHECK, WITH EVIDENCE (run things; do not trust the report)
1. Regression against the frozen pre-integration copy: node ${R}/tools/compare.js --a ${PREFOLD} --b ${SERVER} --out ${R}/integrate/verify/cmp --widths 390,820,1440 --themes light,dark . For EVERY combination that differs, open the diff image and decide: is this an intended shared fix or consistency change (name which), or a regression (something moved, vanished, lost its style, changed colour or size by accident)? Regressions are blockers.
2. python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline --show-missing --show-new-numbers : zero FAIL? No extra-stylesheet WARN? Did the integrator's consistency pass lose or add any fact, price, term or qualifier on any page (compare the "missing" and "new numbers" lists against the pre-integration copy with: python3 ${R}/tools/check_site.py --root ${R}/prefold --baseline ${R}/baseline --show-missing --show-new-numbers )? FAQ, privacy, terms wording and the city pages' headings and copy untouched?
3. The stylesheet: exactly one <link rel="stylesheet"> per page, pointing at /assets/css/styles.css; assets/css/pages/ gone; total size; every page block still scoped by [data-page]; cascade-order hazards introduced by the fold (a shared rule that now comes after a page rule it should not override, or the reverse); dead selectors (match nothing on any page); duplicate declarations across page blocks that should be one shared rule; token discipline, six breakpoints, no stray !important, fallbacks, hover guards, no infinite animations.
4. Behaviour (Playwright, 390 and 1440): theme toggle and persistence, light default, dark when the device prefers dark, phone menu, header scroll state, booking buttons, sticky phone bar (never covers a submit button or the page's last line), contact form (validation, drafts, ?package=, hCaptcha slot, fallback), the /start/ form if present, calculator (inputs update results; printed defaults equal computed defaults), checkout and checkout success (with the query strings the pricing page links to; with the payment host blocked), #year, no console errors on any page. SITE_CONFIG identical to ${R}/baseline/assets/js/main.js . Checkout body scripts byte for byte.
5. Chrome and assets: python3 ${REPO}/tools/sync_chrome.py --check ; python3 tools/art/build.py against a COPY of the repository leaves every page byte-identical; favicon, icons and og-image look right; manifest colours; only two font files, both preloaded and under 140 KB; no reference to a missing file (crawl every href/src on every page); sitemap.xml, robots.txt, CNAME unchanged.
6. README.md: is every statement true of the repository as it is now (file names, commands, colours, fonts, breakpoints, conventions)? Run each command it gives (against a copy where it writes). Anything stale from the old design? Anything describing files that are not in the repository?
7. Overflow at every width from 360 to 1920 in 20px steps on all 19 pages; no-JavaScript pass on all 19 pages (nothing invisible).
Report every problem as an issue: severity (blocker = a regression, a broken behaviour, a hard rule from BRIEF.md violated, or a false statement in the README that would mislead; major = a rule from ROLLOUT.md not met or a visible inconsistency left between pages; minor = polish), the exact place, the evidence, and the concrete fix. Verdict "ready" only with no blockers and no majors.
`

const FIX_PROMPT = (arch, issues) => `
You are the integrator for the full redesign of knightwebstudio.com, on your SECOND PASS. The first pass folded the page stylesheets into one, resolved shared issues, reconciled the pages, finished the assets and rewrote the README. An independent engineer then verified it and found problems. After this pass the site goes to a full review, so leave the integration sound.
${READING}
${GROUND}
THE FIRST PASS REPORTED
${JSON.stringify(arch, null, 1)}

THE VERIFIER'S ISSUES (fix every blocker and every major; fix each minor unless it is wrong or costs more than it is worth, and say which you skipped and why). Verify each claim before acting.
${JSON.stringify(issues, null, 1)}

When you are done, run the full check battery again and report it: check_site.py over all pages (zero FAIL, no extra-stylesheet WARN); shoot.js over all 19 pages in mobile-light, mobile-dark, desktop-light, desktop-dark, tablet-light, laptop-light (no errors, no overflow), and look at the pages you touched; widths.js, contrast.js, smalltext.js and behaviour.js clean; sync_chrome.py --check passes; total CSS size; compare.js against ${PREFOLD} with every remaining difference explained as intended.
Your final report: what you fixed, what you skipped and why, the CSS size, the last lines of the checker, and every issue still open.
`

phase('Fold')
const [triage, fold] = await parallel([
  () => agent(TRIAGE_PROMPT, { label: 'triage reported issues', phase: 'Fold', schema: { type: 'object', properties: { worklistPath: { type: 'string' }, counts: { type: 'string' }, summary: { type: 'string' } }, required: ['worklistPath', 'summary'] } }),
  () => agent(FOLD_PROMPT, { label: 'fold page styles', phase: 'Fold', schema: INT_SCHEMA }),
])
if (!fold) return { error: 'the fold did not finish', triage }
log('Fold: ' + (fold.foldComparison || fold.summary || '').slice(0, 240))
log('Triage: ' + ((triage && (triage.counts || triage.summary)) || 'no result').slice(0, 240))

phase('Shared fixes')
const shared = await agent(SHARED_PROMPT(fold), { label: 'shared layer fixes', phase: 'Shared fixes', schema: INT_SCHEMA })
if (!shared) return { error: 'the shared-layer pass did not finish', triage, fold }

phase('One site')
const first = await agent(ONE_PROMPT(fold, shared), { label: 'consistency, assets, README', phase: 'One site', schema: INT_SCHEMA })
if (!first) return { error: 'the consistency pass did not finish', triage, fold, shared }
log('Consistency pass done: ' + (first.summary || '').slice(0, 300))

phase('Verify')
const review = await agent(VERIFY_PROMPT({ fold, shared, consistency: first }), { label: 'verify integration', phase: 'Verify', schema: ISSUES_SCHEMA })
const issues = (review && review.issues) || []
log('Verification: ' + (review ? review.verdict : 'no result') + ', ' + issues.length + ' issues (' + issues.filter(i => i.severity === 'blocker').length + ' blockers, ' + issues.filter(i => i.severity === 'major').length + ' major)')

phase('Fix')
let second = null
if (issues.length) second = await agent(FIX_PROMPT({ shared, consistency: first }, issues), { label: 'integrator second pass', phase: 'Fix', schema: INT_SCHEMA })
return { triage, fold, shared, first, review, second }
