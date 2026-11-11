export const meta = {
  name: 'kws-refresh-fix',
  description: 'Fix the confirmed review findings on the KnightWebstudio redesign in two passes, then verify every finding and fix what is left',
  phases: [
    { title: 'Fix', detail: 'blockers and majors first, then minors' },
    { title: 'Verify', detail: 'independent check of every finding and of regressions' },
    { title: 'Finish', detail: 'what verification found' },
  ],
}

const R = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
const REPO = '/home/user/Knightwebstudio'
const SERVER = 'http://localhost:8720'
const STAGE = (args && args.stage) || 'A'
const FILE = (args && args.findingsFile) || (R + '/review/' + STAGE + '/confirmed.json')
const EXTRA = (args && args.extra) || ''
const ALL_PATHS = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'

const CONTEXT = `
THE SITE: knightwebstudio.com, a one-person web studio and small-business consultancy in Baton Rouge whose customers are local tradespeople, mostly on phones. The owner asked for "a full refresh: a top-notch $100,000 website". All 19 pages have been redesigned ("Main Street premium"), integrated into one stylesheet, and independently reviewed along eight dimensions (other browsers, facts and words, the real third-party services, accessibility, speed and robustness, a customer's-eye pass, and two visual sign-offs). Each finding was then re-checked by a skeptic; only the confirmed ones were kept.
READ FIRST: ${R}/BRIEF.md (the HARD RULES bind every fix), ${R}/ROLLOUT.md, ${R}/DESIGN.md section 0 and table of contents, ${REPO}/README.md (page conventions, the chrome partials and tools/sync_chrome.py, tools/art).
WHERE THINGS ARE: the site is the repository ${REPO} (branch claude/site-refresh), served at ${SERVER} (if down: (nohup python3 -m http.server 8720 --directory ${REPO} >/dev/null 2>&1 &)). The untouched live site is ${R}/baseline/ at http://localhost:8700 . The confirmed findings are in ${FILE} (a JSON list; each has id, dimension, severity, pages, where, what, evidence, fix and the verifier's note). The reviewers' scripts and screenshots are under ${R}/review/${STAGE}/ .
TOOLS in ${R}/tools/: shoot.js, compare.js, widths.js, contrast.js, smalltext.js, behaviour.js, check_site.py (python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline [--pages a,b] [--show-missing] [--show-new-numbers]). Other browsers: a Firefox build may be in ${R}/motion/.browsers-flat/ and whatever the cross-browser reviewer installed is in ${R}/review/browsers (set PLAYWRIGHT_BROWSERS_PATH); do not reinstall or upgrade Playwright itself.
GROUND RULES: Never run a git command that changes anything (add, commit, checkout, switch, stash, reset, restore, clean, merge, rebase, pull, push). Scratch files go under ${R}/review/${STAGE}/fix/ , never in the repository. Never write the words "AI", "artificial intelligence", "chatbot", "GPT" or "machine learning" anywhere. Pages are edited directly in the repository now. The header, footer and phone bar are edited only in tools/chrome/ and copied to the pages with python3 tools/sync_chrome.py (then --check). Inline art between <!-- art:NAME --> markers is never edited by hand (python3 tools/art/build.py). The stylesheet stays one file, token-driven, six width breakpoints (380, 600, 760, 980, 1100, 1280), no !important outside reduced-motion and utility resets, hover inside (hover: hover), fallbacks before enhancements. <title>, meta tags and JSON-LD stay byte-identical to the baseline. FAQ, privacy and terms wording and the city pages' headings and body copy stay word for word. Contact form fields, calculator ids and the checkout pages' inline scripts and ids stay exactly as they are. No fact lost, changed or added; prices stay fixed; nothing invented. Do not ask questions; decide and record the decision.
${EXTRA}
`

const REPORT = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    fixed: { type: 'array', items: { type: 'string' }, description: 'finding ids fixed, each with a few words on what changed' },
    notFixed: { type: 'array', items: { type: 'string' }, description: 'finding ids not fixed, each with the reason' },
    ownerDecisions: { type: 'array', items: { type: 'string' }, description: 'things only the owner can decide, each with the default now in place' },
    checkerResult: { type: 'string' },
    battery: { type: 'string' },
    openIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'fixed', 'notFixed', 'checkerResult', 'openIssues'],
}

const VERDICTS = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ready', 'needs-fixes'] },
    perFinding: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string', enum: ['fixed', 'not-fixed', 'partly', 'made-worse', 'left-on-purpose-ok', 'left-on-purpose-disagree'] },
          note: { type: 'string' },
        },
        required: ['id', 'status'],
      },
    },
    regressions: {
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
  },
  required: ['verdict', 'perFinding', 'regressions'],
}

const BATTERY = `
WHEN YOU ARE DONE, RUN THE BATTERY AND REPORT IT: python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline --show-new-numbers : zero FAIL; python3 ${REPO}/tools/sync_chrome.py --check ; node ${R}/tools/shoot.js --base ${SERVER} --paths ${ALL_PATHS} --out ${R}/review/${STAGE}/fix/shots --modes mobile-light,mobile-dark,desktop-light,desktop-dark,tablet-light,laptop-light : no console errors, failed requests or overflow, and you have looked at every page you touched on a phone and a desktop in both themes; widths.js, contrast.js, smalltext.js and behaviour.js clean on all 19 pages; JavaScript off on the pages you touched.
`

phase('Fix')
const first = await agent(CONTEXT + `
YOUR JOB: FIX THE BLOCKERS AND MAJORS. Read ${FILE} and take every finding whose severity is "blocker" or "major" (leave the minors for the next engineer, unless a minor is in the very same rule or element you are already changing). For each: reproduce it first (the reviewers were re-checked, but look yourself); fix the cause, in the shared layer when the cause is shared; then look at every page that uses what you changed, on a phone and a desktop, in both themes. A fix that helps one page and hurts another is not a fix. Where a finding conflicts with a hard rule, the hard rule wins: say so under notFixed. Where the right answer is the owner's to give (a wording choice that changes meaning, adding information the site does not have), put the safest truthful default in place and list it under ownerDecisions.
${BATTERY}
Report every blocker and major id as fixed or not fixed with the reason.
`, { model: 'opus', effort: 'xhigh', label: 'fix: blockers and majors', phase: 'Fix', schema: REPORT })

const second = await agent(CONTEXT + `
YOUR JOB: FIX THE MINORS. A colleague has just fixed the blockers and majors from ${FILE}; their report is below. Take every finding whose severity is "minor". For each: reproduce it; fix it unless the fix costs more than it buys or risks something that works (say which and why under notFixed); look at every page that uses what you changed. Do not undo your colleague's fixes; if one of them looks wrong, say so in openIssues. Group related minors (the same component, the same page) and fix them together.
THE FIRST ENGINEER REPORTED
${JSON.stringify(first, null, 1)}
${BATTERY}
Report every minor id as fixed or not fixed with the reason.
`, { model: 'opus', effort: 'xhigh', label: 'fix: minors', phase: 'Fix', schema: REPORT })

phase('Verify')
const review = await agent(CONTEXT + `
YOUR JOB: VERIFY THE FIXES, INDEPENDENTLY. You change nothing in the repository. Two engineers have worked through the confirmed findings in ${FILE}; their reports are below. For EVERY finding in the file, check the site as it is now and give a status: fixed (you reproduced the original check and it now passes), not-fixed, partly, made-worse, left-on-purpose-ok (not fixed, and you agree with the reason) or left-on-purpose-disagree. Then look for REGRESSIONS the fixes caused: run the full battery yourself (check_site.py with --show-missing --show-new-numbers, sync_chrome.py --check, shoot.js over all 19 pages in mobile-light, mobile-dark, desktop-light, desktop-dark, tablet-light, laptop-light, widths.js, contrast.js, smalltext.js, behaviour.js, JavaScript off), compare against the state before the fixes (git diff HEAD shows exactly what changed since the last commit: read all of it), and look at the pages that changed, on a phone and a desktop in both themes, and in another browser engine if one is installed. Your scripts and screenshots go in ${R}/review/${STAGE}/fix-verify/ . Verdict "ready" only if no blocker or major finding is not-fixed, partly, made-worse or left-on-purpose-disagree, and there is no blocker or major regression.
FIRST ENGINEER (blockers and majors)
${JSON.stringify(first, null, 1)}
SECOND ENGINEER (minors)
${JSON.stringify(second, null, 1)}
`, { model: 'opus', effort: 'xhigh', label: 'verify fixes', phase: 'Verify', schema: VERDICTS })

phase('Finish')
let last = null
const open = review ? (review.perFinding || []).filter(x => ['not-fixed', 'partly', 'made-worse', 'left-on-purpose-disagree'].includes(x.status)) : []
const regs = review ? (review.regressions || []) : []
log('Verification: ' + (review ? review.verdict : 'no result') + '; ' + open.length + ' findings still open, ' + regs.length + ' regressions')
if (open.length || regs.length) {
  last = await agent(CONTEXT + `
YOUR JOB: FINISH. Two engineers fixed the confirmed findings in ${FILE}; an independent verifier then found the items below still open, and these regressions. Fix every regression, and every open blocker and major; fix open minors unless the fix costs more than it buys (say which and why). Reproduce each first. Look at every page that uses what you change.
STILL OPEN
${JSON.stringify(open, null, 1)}
REGRESSIONS
${JSON.stringify(regs, null, 1)}
${BATTERY}
`, { model: 'opus', effort: 'xhigh', label: 'final fixes', phase: 'Finish', schema: REPORT })
}
return { first, second, review, last }
