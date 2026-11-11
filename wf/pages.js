export const meta = {
  name: 'kws-refresh-pages',
  description: 'Redesign a set of KnightWebstudio pages on the shared system: build, two independent critiques, then a fix pass, per page group',
  phases: [
    { title: 'Build', detail: 'one designer-engineer per page group' },
    { title: 'Critique', detail: 'a design critic and an engineering/integrity critic per page group' },
    { title: 'Fix', detail: 'apply the verified critique' },
  ],
}

const R = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
const REPO = '/home/user/Knightwebstudio'
const SERVER = 'http://localhost:8720'
const A = args || {}
const WANT = A.groups || []
const ONE_CRITIC = A.critics === 'one'
const BUILD_CMD = A.buildCommand || ('python3 ' + R + '/tools/kws_page.py PAGE --main FILE   (see ' + R + '/DESIGN.md)')
const ARCH_NOTES = A.archNotes || ''

const GROUPS = {
  home: {
    pages: ['index.html'], paths: ['/'], slugs: ['home'], css: ['home'],
    brief: `
THE HOME PAGE (/). The winning prototype's home page is already in the repository, built on the shared system by the architect; its page-only rules are in assets/css/pages/home.css. Your job is to take it from "the judges' favourite draft" to finished. This is the page every other page is measured against, and the first thing the owner will open.

Must-fix items from the judges (ROLLOUT.md numbers):
 1. Desktop hero: the phone, the "EXAMPLE" caption pill, the shop sign and the stamp collide. Recompose so nothing overlaps awkwardly. At 1280x800 the headline, both buttons AND the price strip under the buttons are visible without scrolling.
 2. Phone hero: the "Fixed prices" stamp crowds the phone mock. At 390x844 the headline, the lede and the primary button are visible without scrolling, and the hero still shows what the business does.
 3. Phone "Website design & build" card: the phone mock cuts through the browser mock's title, leaving a stray "usiness". Fix the composition, not just the clipping.
 4. Length: the page is about 15,400px tall at 390px wide. Bring it to 12,500px or less without dropping a fact. Automation is told twice (the timeline "What happens when a customer calls and you can't pick up", then the time sheet "About 4 hours a week, back"): merge them into one strong section or shorten both. Tighten wherever a section repeats what another says.
 5. Props: at most ONE tilted object and ONE stamp on the page; straighten the rest.
 6. Between 900px and 1040px wide the time-sheet table overflows its card and the page scrolls sideways; between 980px and 1040px the hero phone covers the secondary button. Test every 20px from 360 to 1920.
 8/9/10/14. Typing dots and ringing animations are capped; job-ticket ticks are plainly decorative; reveal stagger is short; every vignette with example messages is marked "Example" and uses everyday trade wording only (no business names, no people's names, no star ratings).
Note: the build tool currently REFUSES to build the home page because it carries both a stamp and a seal and more than one tilted object (the props rule): fixing must-fix 5 is the first thing you do. The handbook says the home page is not yet a model; /pricing/ is the reference build for how shared components are used. Also: the ring animation still runs about six seconds against the handbook's motion rule; bring it in line.
Decisions already made: keep the short first-person "Who you work with" note and the business card; order the projects with Smilys Softwash first; nothing may be claimed about any project's results. The live page has a commented-out testimonials block (an HTML comment between "From our clients" markers, with instructions for the owner): keep that comment exactly as it is, in a sensible place, and never publish placeholder quotes.
Signature moments this page must land: (a) a hero that shows, in one glance, a local shop that answers every call; (b) the missed call that turns into a booked job, shown not described; (c) the price board: fixed prices, published. A roofer on an iPhone should understand within five seconds what this person does, that they are local and real, and what it costs.`,
  },
  pricing: {
    pages: ['pricing/index.html'], paths: ['/pricing/'], slugs: ['pricing'], css: ['pricing'],
    brief: `
THE PRICING PAGE (/pricing/). The system architect has already rebuilt this page from shared components as the site's REFERENCE page (its main file is ${R}/pages/pricing/main.html , screenshots in ${R}/shots/reference/): price strip and stamp in the page head, an "On this page" contents list with prices, the four packages as a ruled spec table whose rows line up (cards on phones), how you pay with the payment plan drawn to scale, add-ons, consulting and automation prices, care plans as a table. It is correct and consistent, but it was built as a demonstration of the system, not designed as a page. Your job is to take it from "reference build" to the best pricing page a local business owner has ever used, without breaking its role as the reference: keep using the shared components exactly as the handbook defines them, and change the page's composition, order, pacing and copy.
What is wrong with it today (look at the screenshots yourself and find more):
 - It is 12,600px tall on a phone; the live page is 9,700px. Target 10,500px or less at 390px wide. On a phone the four packages are four very tall cards, each repeating nine labelled rows: design the phone comparison deliberately so a visitor can compare the four without scrolling through 5,000px (for example tighter rows, the long "included" list folded with details/summary per package, or a compact comparison strip above the cards). Table semantics must survive.
 - On desktop the page head leaves the right half empty except for a stamp, and there is a large dead gap between the spec table and the next band. Compose the head properly (the price board idea belongs here if anywhere) and fix the rhythm between sections.
 - The contents list, the price strip and the spec table say the four prices three times in the first two screens. Decide what earns its place.
 - "Most popular" stays on Business. The Business column should be the natural place for the eye to land.
Hard requirements: keep every price figure, every package inclusion, every timeline and support period, every payment term, and every call-to-action destination the live page has (links to /contact/ with ?package=..., to /checkout/ with their query strings, to /consulting/ and so on): same hrefs, same number of ways to buy. Compare against ${R}/baseline/pricing/index.html link by link. Add-ons and consulting prices are dot-leader price lists; care plans are a real table on desktop.
Signature moment: the comparison. It should feel like a well-made printed price list from a shop that has nothing to hide.`,
  },
  consulting: {
    pages: ['consulting/index.html'], paths: ['/consulting/'], slugs: ['consulting'], css: ['consulting'],
    brief: `
THE CONSULTING AND AUTOMATION PAGE (/consulting/). The longest and most important commercial page: it sells the newer half of the business (time back, missed calls answered, bookings, follow-up). Today it is about 16,600px tall on a phone and explains everything in words. Redesign it so it SHOWS. Target 14,000px or less at 390px wide without dropping a fact.
Sections on the live page, all of which stay (you may reorder and restructure): the example week ("The hours that disappear every week"), how each automation works step by step (missed-call text-back $750, online booking & reminders $750, lead follow-up system $1,500, custom automation $1,500 per workflow), the revenue and time calculator, consulting and setup at fixed prices (free online check, Growth Audit $350, Google profile & reviews $500, the setups), the monthly plans (Advisor $500/mo, Partner $1,000/mo) and the Launch bundle ($3,000), four steps, four questions ("Before you start"), the closing call to action.
 - The example week as a LEDGER: a real <table> with single-hue bars, the arithmetic per row, and a very large "200" (hours a year, in this example) beside it with the "not a measurement" note right there. Keep every "example", "estimate" and "not a guarantee" qualifier the live page has, right next to the numbers.
 - Each automation shown with the FIGURE-PLUS-LEGEND pattern: a phone or calendar mock with numbered markers tied to an ordered list in the figcaption, and the honest caption format ("Missed-call text-back, $750 to set up. An illustration, not a real conversation."). Example messages use everyday trade wording only: no business names, no people's names, no star ratings; use "[your business]".
 - The calculator restyled as a considered worksheet: eight inputs (ids c-job c-rate c-calls c-callwin c-quotes c-quotewin c-hours c-auto), eight results (ids r-month r-year r-jobs r-calls r-quotes r-hours r-timeval r-payback), form id growth-calc, script /assets/js/calculator.js unchanged. The results printed in the HTML must equal what the default inputs compute (the checker verifies this), and the estimate wording stays next to the results. Inputs must be comfortable on a phone (44px, right keyboard via inputmode, no overflow at 360px).
 - Setup prices as a dot-leader price list; the Launch bundle as an ITEMISED RECEIPT ($2,000 + $500 + $750, $3,250 struck through, $3,000) with its payment plan DRAWN TO SCALE (a $1,500 deposit block and three $500 months, exactly as the live page states the terms); the monthly plans side by side.
 - Keep the anchor ids other pages link to (for example #calculator) and every call-to-action destination the live page has.
Note: assets/css/pages/consulting.css already holds the canonical calculator styles written by the system architect (see the handbook's calculator component): keep them, use the canonical calculator markup with every id, and add your rules below.
Signature moments: the ledger with its big number; the missed call turning into a booked job; the receipt. A contractor should finish this page knowing exactly what each thing does, what it costs, and that nobody is promising him a miracle.`,
  },
  services: {
    pages: ['services/index.html'], paths: ['/services/'], slugs: ['services'], css: ['services'],
    brief: `
THE SERVICES PAGE (/services/). Nine services, today nine identical cards: website design & build ($1,000, $2,000 or $4,000), e-commerce stores ($8,000), SEO & performance (in every build), care & maintenance ($125, $300, $600 or $1,000/mo), redesigns & rescues (priced as a new site), brand & identity ($1,500), growth consulting ($350 audit, $500 or $1,000/mo), Google profile & reviews ($500), automation ($750 or $1,500 per setup).
Do NOT ship nine identical cards. Think of the service menu on the wall of a good shop: grouped, scannable, priced. For example a short contents list with prices at the top, then two or three families (building the website; keeping it running; winning customers and time back), each family with its own layout and density, the lead service in each given room and one honest illustration at most on the whole page (a browser mock or a phone mock marked as an example), the smaller services as tight ruled entries with dot-leader prices. Each service keeps its description, its price wording exactly as today, its link to the next step, and its anchor id (other pages link to these anchors).
Target about 5,500px or less at 390px wide. Signature moment: the menu itself: a visitor sees all nine services and all the prices in one screen on a desktop and two thumb-scrolls on a phone.`,
  },
  workprocess: {
    pages: ['work/index.html', 'process/index.html'], paths: ['/work/', '/process/'], slugs: ['work', 'process'], css: ['work', 'process'],
    brief: `
TWO PAGES: RECENT PROJECTS (/work/) AND THE PROCESS (/process/).
/work/: three real projects: Smilys Softwash (the local one; it may go first), Risen Health, Corbel Books, with their real screenshots (assets/img/work-*.jpg; keep width, height, alt; lazy-load below the fold). Nothing may be claimed about results, and nothing invented: no testimonials, no metrics, no client logos. Three projects is the truth, so design for three: large, confident case rows that alternate, each screenshot in a browser frame, what was built, the kind of business, the link to the live site if the page has one today. Do not pad the page to look like a bigger portfolio. One line of honest framing ("three recent builds" energy) is better than filler.
/process/: four steps (discovery call, proposal & design, build & review, launch & support) with every timeline and term the live page states. Show it as the job moving through the shop: for example the job ticket travelling through four stations, or a ruled timeline with what the customer does and what we do at each step. One prop only. It is a short page; make it a sharp one.
Both pages end with the shared call-to-action band. Targets at 390px wide: /work/ about 4,500px or less, /process/ about 3,400px or less.`,
  },
  contactfaq: {
    pages: ['contact/index.html', 'faq/index.html'], paths: ['/contact/', '/faq/'], slugs: ['contact', 'faq'], css: ['contact', 'faq'],
    brief: `
TWO PAGES: CONTACT (/contact/) AND QUESTIONS (/faq/).
/contact/: the enquiry form, the contact details ((225) 255-0837, knightwebstudio1@gmail.com, Based in Baton Rouge, Louisiana), the booking box, "What happens next". This is where the money is made, so the form must be the best-made thing on the site: clear labels above fields, generous 50px fields, the right keyboard and autocomplete on each, obvious required/optional marking, helpful error messages in place (assets/js/main.js adds them: read how it marks invalid fields, shows status and saves drafts, and style every state it produces: error, sending, success, the fallback message), a visible 2 to 3px focus ring, a submit button that cannot be missed. KEEP EXACTLY: the form's action, every hidden input, every field name, every select option value, every checkbox value, every id main.js uses (including #hcaptcha-slot), and the ?package= preselect. On a phone the form comes before the side details; the sticky phone bar must never cover the submit button. The booking box may be the appointment card. Calling is as welcome as writing: make the phone number a real, large, tap-to-call line.
/faq/: fourteen questions. Every answer keeps its wording EXACTLY (the checker compares them to the structured data). Group them under three or four plain headings (for example: prices and payment; the build; after launch; consulting and automation), with a short contents list at the top. Use details/summary so it works without JavaScript, with 44px targets, visible focus and a clear open/closed marker; the first question in each group may start open. Comfortable reading measure. No props on this page.
Targets at 390px wide: /contact/ about 3,600px or less; /faq/ about 3,200px or less when closed.`,
  },
  about404: {
    pages: ['about/index.html', '404.html'], paths: ['/about/', '/404.html'], slugs: ['about', 'notfound'], css: ['about', 'notfound'],
    brief: `
TWO PAGES: ABOUT (/about/) AND NOT FOUND (/404.html).
/about/: the first-person page ("I", not "we"): Hi, I'm Christian; more than websites; how I work; work I've built; local first; let's talk. A local owner reads this to decide whether there is a real, competent person behind the site. There is no photograph of Christian and you must not invent one or use a stand-in portrait: let typography do it. Set it like a well-made letter from the owner of the shop: a large first-person opening line, a comfortable reading measure (45 to 75 characters), the business card as the one prop, the three real projects as a compact ruled list linking to /work/, the towns served as a plain list. Keep every fact and do not add any (no years in business, no client counts, no credentials that are not on the live page).
/404.html: "This page has moved on". Short, kind, useful: the small shop-front scene is allowed here (see DESIGN.md), a line of plain words, then the four or five most useful links and the phone number. It uses the chrome variant the handbook assigns to it. Check that root-absolute links work, because this page is served for any missing URL.
Note: the system architect already rewrote the 404 main to the canonical 404 block and assets/css/pages/notfound.css holds its styles: keep them, refine the page, and remember this page loads no script (no reveal or seq classes).
Targets at 390px wide: /about/ about 4,300px or less; /404.html fits in about one and a half screens.`,
  },
  start: {
    pages: ['start/index.html'], paths: ['/start/'], slugs: ['start'], css: ['start'],
    brief: `
THE LANDING PAGE (/start/). This is where cold emails and ads send people; it has NO site menu on purpose (the handbook gives it its own chrome variant) so the only ways forward are: call, book the free 30-minute call, or send the enquiry. Most visitors arrive on a phone having never heard of the business. Sections on the live page, all of which stay: the hero, nine services, fixed prices, recent projects, four steps, the enquiry ("Tell us about your business.").
Design it as the home page's tighter, more direct sibling: one screen that says who this is and what it costs, a compact service menu with prices (not nine cards), the price board, the three real projects small, the four steps in one compact strip, then the form. The small shop-front scene may be reused here once. If the page carries the enquiry form, KEEP EXACTLY its action, hidden inputs, field names, option values, checkbox values and the ids assets/js/main.js uses, and style every state main.js produces (error, sending, success, fallback). Keep every price figure and every fact.
Target 6,200px or less at 390px wide. Signature moment: within one phone screen a stranger knows this is a real local person with fixed prices, and can call with one thumb.`,
  },
  city: {
    pages: ['web-design-baton-rouge/index.html', 'web-design-denham-springs/index.html', 'web-design-gonzales/index.html', 'web-design-prairieville/index.html'],
    paths: ['/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/'], slugs: ['city'], css: ['city'],
    brief: `
THE FOUR LOCAL LANDING PAGES (/web-design-baton-rouge/, /web-design-denham-springs/, /web-design-gonzales/, /web-design-prairieville/). They share one template (all four use data-page="city" and one page stylesheet) and differ in their words. These pages exist to be found in local searches, so on THESE pages keep every heading and every sentence of body copy exactly as the live page has it (do not rewrite, do not move text between pages); you are redesigning presentation and structure only. Their question-and-answer sections must stay word for word (the checker compares them to the structured data).
Sections (see each live page): a local hero, meeting in person / the area served, three things a local site needs to do, a local project (Smilys Softwash) or local work, fixed prices, local questions, the closing call to action. Make the place itself the art direction: the town's name set large in the display face, the top strip and skyline already carry Baton Rouge; a plain, honest "areas we serve" list or simple map-free locator line; the three needs as a ruled numbered list rather than three cards; prices as the compact price board or a dot-leader list linking to /pricing/; questions as details/summary with 44px targets. No per-town illustrated scenes, no stock imagery, at most one prop per page.
Build the template once, then apply it to all four pages carefully; all four must pass the checker and look equally finished. Target about 6,500px or less at 390px wide each.`,
  },
  legalcheckout: {
    pages: ['privacy/index.html', 'terms/index.html', 'checkout/index.html', 'checkout/success/index.html'],
    paths: ['/privacy/', '/terms/', '/checkout/', '/checkout/success/'], slugs: ['privacy', 'terms', 'checkout', 'checkout-success'], css: ['privacy', 'terms', 'checkout', 'checkout-success'],
    brief: `
FOUR QUIET PAGES: PRIVACY (/privacy/), TERMS (/terms/), CHECKOUT (/checkout/) AND CHECKOUT SUCCESS (/checkout/success/). No props, no illustrations, no stamps on any of them: these are the pages where restraint proves the craft.
/privacy/ and /terms/: plain-English legal pages. Every word inside <main> stays EXACTLY as it is (the checker compares them sentence by sentence). Set them beautifully as documents: the shared prose component at a 45 to 75 character measure, a contents list of the section headings (as links to anchors), clear heading hierarchy, a "last updated" line only if the live page has one, generous line height, good link and list styling, a quiet side column on desktop for the contents if it helps. /terms/ states the payment terms; you may set the figures it already contains in the display face, but add nothing.
/checkout/ and /checkout/success/: Stripe checkout. Their inline scripts and every id those scripts use stay byte for byte (the build tool carries the scripts over and refuses a main that drops an id): restyle around them only. Read the inline scripts first so you know every state they produce (loading, the order summary filled in from the query string, errors, the fallback when the payment server is unreachable, the success details) and style EVERY state; test them by loading the pages with the same query strings the pricing page links to, and by blocking the payment server's host so the error path shows. A customer about to pay a deposit must feel safe: calm layout, clear summary of what they are paying for, the phone number in plain sight, no surprises. They use the chrome variants the handbook assigns to them.
Page stylesheets: one per slug as the handbook says (privacy.css and terms.css have 1 KB each: the shared prose, contents list and reading page head should carry those two pages almost entirely; checkout.css 3 KB; checkout-success.css 2 KB).`,
  },
}

const GROUND = `
GROUND RULES FOR THIS RUN
- The real site is the git repository at ${REPO} (branch claude/site-refresh, plain HTML/CSS/JS, no build step). It is served at ${SERVER} (if it is down: (nohup python3 -m http.server 8720 --directory ${REPO} >/dev/null 2>&1 &) ).
- SEVERAL OTHER AGENTS ARE WORKING IN THE SAME FOLDER RIGHT NOW, each on other pages. Touch ONLY the files this task names. Never edit assets/css/styles.css, assets/js/main.js, assets/js/calculator.js, tools/, the chrome partials, ${R}/DESIGN.md or any page that is not yours. Never run a command that rewrites other pages: no tools/sync_chrome.py or tools/art/build.py without naming only your own pages, never tools/art/render.js.
- Never run a git command that changes anything (add, commit, checkout, switch, stash, reset, restore, clean, merge, rebase, pull, push). Read-only git (status, diff, log, show) is fine.
- Scratch files, screenshots, notes and test copies go under ${R}/work/ in your own folder (named below), never inside the repository (everything in the repository ships to the live site).
- Never write the words "AI", "artificial intelligence", "chatbot", "GPT" or "machine learning" anywhere, including comments, class names and file names.
- No new JavaScript. Motion is CSS only, one-shot, transform/opacity, off under prefers-reduced-motion.
- Do not ask questions; decide, and record the decision in your final report.
- Everything a visitor reads is plain language: short sentences, no jargon, no invented facts, no hype.
`

const reading = () => `
READ FIRST, COMPLETELY, IN THIS ORDER
1. ${R}/BRIEF.md      the business, the audience, the quality bar, the HARD RULES (honesty, fixed prices, facts, SEO, behaviour, engineering), the tools
2. ${R}/ROLLOUT.md    the chosen direction ("Main Street premium" with the editorial direction's rigour), the must-fix list, decisions already made
3. ${R}/DESIGN.md     THE HANDBOOK: the system you build with: tokens, type scale, breakpoints, every shared component with its canonical markup, the props rule, the honest-mock rules, how to build a page, the page-stylesheet rules, which chrome variant each page uses. Follow it exactly. Where it is silent, match the home page and say what you decided.
Then look: the component gallery ${R}/gallery/index.html and its screenshots in ${R}/gallery/shots/ ; the winning prototype's screenshots in ${R}/design/mainstreet/shots/ ; the runner-up's in ${R}/design/editorial/shots/ (it is the source of several grafted components) ; the shared stylesheet ${REPO}/assets/css/styles.css (read it: you must know what already exists before writing a single rule).
`

const groupFacts = (key, g) => `
YOUR PAGES: ${g.pages.map(p => REPO + '/' + p).join(' , ')}
Their live (untouched) versions: ${g.pages.map(p => R + '/baseline/' + p).join(' , ')}  (served at http://localhost:8700 ; screenshots of the live site in ${R}/shots/baseline-all/ ). To read a page without the long inline art:  sed -E 's/(<!-- art:[a-z0-9-]+ -->).*(<!-- \\/art:[a-z0-9-]+ -->)/\\1\\2/' PAGE | sed -n '/<body/,$p'
data-page slug(s): ${g.slugs.join(', ')}. Each page's <main> content file already exists where the handbook's table in section 6 says (${R}/pages/<slug>/main.html ; the four city pages are ${R}/pages/city/web-design-<town>.main.html): today it holds what is currently in the repository. Edit those files and rebuild.
Your page stylesheet(s): ${g.css.map(c => REPO + '/assets/css/pages/' + c + '.css').join(' , ')} , one per slug, every selector starting with [data-page="<slug>"]. Budgets are in handbook section 7 and are firm (the build tool prints your size against your line): the whole site has to fit in one 140 KB stylesheet at the end, so reuse the shared components and write page CSS only for layout and for what is truly unique to the page.
Your scratch folder for screenshots, test scripts and notes: ${R}/work/${key}/ .
How a page is built (one command per page, touches only that page):
${BUILD_CMD}
The component gallery is also served at http://localhost:8721/ (restart: (nohup python3 ${R}/gallery/serve.py >/dev/null 2>&1 &) ).
${ARCH_NOTES ? 'Notes from the system architect:\n' + ARCH_NOTES : ''}
`

const VERIFY = (key, g) => `
VERIFY BEFORE YOU REPORT (run these; fix what they show; repeat until clean)
- python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline --pages ${g.pages.join(',')} --show-missing --show-new-numbers   : zero FAIL lines. Read the "missing" list line by line and confirm that every sentence no longer on the page was a deliberate rewrite of a headline, intro or microcopy and that no fact, price, timeline, term or qualifier was lost; read the "new numbers" list and confirm every figure was already on the live page. Explain any WARN you leave (a WARN for the extra page stylesheet link is expected).
- node ${R}/tools/shoot.js --base ${SERVER} --paths ${g.paths.join(',')} --out ${R}/work/${key}/shots --modes mobile-light,mobile-dark,small-light,tablet-light,laptop-light,desktop-light,desktop-dark,wide-light --max 30   : no console errors, no failed requests, no horizontal overflow. Then OPEN THE IMAGES with the Read tool and look at every one, top to bottom, as the roofer on the iPhone and as a picky creative director. Iterate until you would put your name on it. Expect at least three rounds of look-and-fix.
- node ${R}/tools/widths.js --urls ${g.paths.map(p => SERVER + p).join(',')}   : no horizontal scroll at any width from 360 to 1920 in 20px steps (check the tool's usage line if it wants one URL at a time).
- node ${R}/tools/contrast.js --base ${SERVER} --paths ${g.paths.join(',')}   and   node ${R}/tools/smalltext.js --urls ${g.paths.map(p => SERVER + p).join(',')}   : measured AA contrast in both themes; nothing under 12px, no target under 44px, and every text under 15px on a phone is a label, not something a customer must read.
- node ${R}/tools/behaviour.js   : the site's scripted behaviours still pass (theme toggle, menu, phone bar, contact form, calculator, checkout wiring).
- With JavaScript off (Playwright javaScriptEnabled:false) everything is readable and nothing is invisible or dead-looking.
- Keyboard: tab through the page; every interactive element shows a clear focus ring; order is sensible. Touch: at 390px every target is at least 44px; nothing a customer must read is under 15px; labels at least 12px.
- Both themes are finished: check contrast of anything you coloured yourself (4.5:1 text, 3:1 large text and controls).
- The page stylesheet: every rule scoped to your slug(s); only tokens from the system (no raw colours, sizes or durations); only the system's breakpoints; no !important; no inline style="" in the HTML except custom properties that carry data; enhancements have fallbacks. Report its size in bytes.
`

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'what you built and the design decisions that matter' },
    phoneHeights: { type: 'string', description: 'page height in px at 390 wide, per page' },
    cssBytes: { type: 'string' },
    checkerResult: { type: 'string', description: 'the last lines of check_site.py for your pages' },
    decisions: { type: 'array', items: { type: 'string' } },
    sharedIssues: { type: 'array', items: { type: 'string' }, description: 'problems or gaps in the shared stylesheet, chrome, main.js, tools or handbook that you could not fix because they are not your files; say exactly what and where, and what you did locally meanwhile' },
    openIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'checkerResult', 'sharedIssues', 'openIssues'],
}

const ISSUES_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ship', 'needs-fixes'] },
    score: { type: 'number', description: '0 to 100 against the brief quality bar' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          where: { type: 'string', description: 'page + viewport + theme + section, or file + selector/line' },
          what: { type: 'string' },
          fix: { type: 'string', description: 'the concrete change you recommend' },
        },
        required: ['severity', 'where', 'what', 'fix'],
      },
    },
    sharedIssues: { type: 'array', items: { type: 'string' }, description: 'problems that live in shared files (styles.css, chrome, main.js), not in this page' },
    praise: { type: 'string', description: 'what must NOT be lost in the fix pass' },
  },
  required: ['verdict', 'issues', 'sharedIssues'],
}

const buildPrompt = (key, g) => `
You are a senior designer-engineer on the full redesign of knightwebstudio.com. The owner asked for "a top-notch $100,000 website". The business is a one-person web studio and small-business consultancy in Baton Rouge; its customers are plumbers, roofers, HVAC contractors and salon owners, mostly on phones, who distrust jargon and decide in seconds whether this is a real, local, competent person. The design system, the site chrome and the build tools already exist. Your job is to design and build your page(s) on that system to the standard of a top studio: not a re-skin of the old layout, a considered page.
${reading()}
${GROUND}
${groupFacts(key, g)}
YOUR BRIEF
${g.brief}

HOW TO WORK
1. Read the live page(s) closely and list every fact on them (prices, inclusions, timelines, terms, qualifiers, links and their destinations, form fields, ids scripts use). Nothing on that list may be lost; nothing may be added.
2. Decide the page's structure on paper first: what the visitor needs in the first screen on a phone, the order of sections, which shared component carries each section, where the one signature moment is, where the page breathes. Sections must differ in structure and density; no wall of identical cards. You may rewrite headlines, intros and microcopy to be sharper (unless your brief says the wording is fixed), but keep each page's single h1 topic, and never touch <title>, meta tags or structured data (the build tool keeps the head).
3. Write the <main> content file(s) in your scratch folder using the handbook's canonical component markup, and your page stylesheet(s). Build with the build command. Phone first: design the 390px view deliberately, then 820, 1280, 1440, 1920.
4. Look, critique yourself hard, fix, repeat.
${VERIFY(key, g)}
If something you need belongs in the shared files (a missing component, a bug in the chrome, a token that does not exist), do NOT edit them: solve it inside your page stylesheet under a comment that starts with "SHARED-CANDIDATE:" and list it in sharedIssues so the integrator can promote it.
Your final report: what you built, the page heights at 390px, the stylesheet size, the last lines of the checker, your decisions, shared issues, and anything you know is still not right.
`

const designCritic = (key, g, built) => `
You are reviewing redesigned page(s) of knightwebstudio.com before they go to the owner, who asked for "a top-notch $100,000 website". Review them twice: first as Dale, a 54-year-old roofing contractor in Baton Rouge on an iPhone, who got a cold email, distrusts web people and jargon, and will give this ten seconds; then as an exacting creative director at a top studio who has seen every template and is not easily impressed. You did not build these pages. Do NOT change anything in the repository; you only report.
${reading()}
${GROUND}
${groupFacts(key, g)}
THE BRIEF THE BUILDER WAS GIVEN
${g.brief}

THE BUILDER REPORTED
${JSON.stringify(built, null, 1)}

HOW TO REVIEW
- Take your own screenshots into ${R}/work/${key}/critique/ :
  node ${R}/tools/shoot.js --base ${SERVER} --paths ${g.paths.join(',')} --out ${R}/work/${key}/critique --modes mobile-light,mobile-dark,small-light,tablet-light,laptop-light,desktop-light,desktop-dark,wide-light --max 30
  Open EVERY image and study it. Also compare with the live page (screenshots in ${R}/shots/baseline-all/ , live copy at http://localhost:8700) and with the home page at ${SERVER}/ for consistency.
- As Dale: in the first phone screen, do I know what this is, that it is local and real, what it costs, and what to tap? Is anything confusing, salesy, too clever, too small, too long? Would I call?
- As the creative director, against BRIEF.md section 3: art direction carried through; typography (scale, headline setting, measure, weights); layout rhythm (do sections differ, or is it a wall of similar blocks?); the signature moment the brief asked for (is it there, and is it memorable?); show-don't-tell; restraint (one tilted object and one stamp at most, no bespoke scene where not allowed); detail polish (alignment at every width, spacing consistency, widows/orphans in headlines, awkward wraps, collisions, cramped or empty areas, hover/focus states); the phone view is designed, not shrunk; the dark theme is finished; consistency with the home page and the handbook (same components used the same way).
- Honesty: do the mock-ups read as examples? Any invented proof, names, ratings, numbers? Are the "example / estimate / not a guarantee" qualifiers right next to the numbers?
- Length and pacing against the brief's target height.
Give a score out of 100 and a verdict ("ship" only if there is no blocker and no major issue). Report every defect as an issue: severity (blocker = embarrassing or breaks a hard rule; major = clearly below the bar; minor = polish), the exact place (page, viewport, theme, section), what is wrong, and the concrete fix. Be specific enough that someone can fix it without asking you. List separately anything that lives in shared files. Say what is genuinely good and must survive the fix pass.
`

const engCritic = (key, g, built) => `
You are a senior front-end engineer and fact-checker doing an independent, skeptical review of redesigned page(s) of knightwebstudio.com. You did not build these pages. Do NOT change anything in the repository; you only report. (Test copies and scripts under ${R}/work/${key}/eng/ . The handbook's test tools in ${R}/tools/ are a starting point: widths.js, contrast.js, smalltext.js, behaviour.js; do not rely on them alone.)
${reading()}
${GROUND}
${groupFacts(key, g)}
THE BRIEF THE BUILDER WAS GIVEN
${g.brief}

THE BUILDER REPORTED
${JSON.stringify(built, null, 1)}

CHECK, WITH EVIDENCE (run things; do not trust the report)
1. python3 ${R}/tools/check_site.py --root ${REPO} --baseline ${R}/baseline --pages ${g.pages.join(',')} --show-missing --show-new-numbers . Zero FAIL? Go through the "missing" sentences one by one against the new page: was any FACT lost (a price, an inclusion, a timeline, a term, a support period, a qualifier such as "example", "estimate", "not a guarantee", a town, a contact detail)? Go through the "new numbers": is every figure one the live page already had? Was anything added that is not true or not on the live site (claims, counts, years, results)? Any hedged price wording ("from", "starting at", a range)? Any banned word?
2. Links and actions: list every link and button destination in the live page's <main> and in the new one. Is every destination still reachable from the new page (same href including query strings, especially /contact/?package=..., /checkout/?..., tel:, mailto:, anchors other pages link to)? Do in-page anchors resolve?
3. Behaviour (Playwright, 390px and 1440px): everything on this page that a script touches still works: booking buttons, theme toggle, phone menu, sticky phone bar (does it ever cover a submit button or the last line of the page?), and for the pages that have them: the contact form (validation messages on empty submit, error styling, draft save and restore, ?package= preselect, the hCaptcha slot present, the fallback path when the form endpoint is blocked), the calculator (change inputs, results update; printed defaults equal computed defaults), the checkout states (with the query strings the pricing page uses; with the payment host blocked). No console errors.
4. Layout robustness: horizontal overflow at every width from 360 to 1920 in 20px steps (report the offending element); text overlap or clipping at 360, 390, 430, 768, 820, 1024, 1280, 1440, 1920; long-word and 200% text-zoom behaviour; images have width, height, alt, and lazy-load only below the fold; no layout shift as fonts load.
5. Accessibility (WCAG 2.2 AA): exactly one h1, no skipped heading levels, landmarks, table semantics (including tables restyled on phones), list semantics, details/summary, labels on every field, aria on decorative mock-ups (hidden from or sensibly described to screen readers, not read out as real conversations), focus visible everywhere and not obscured by sticky bars, touch targets at least 44px at 390px (measure), computed contrast in BOTH themes for every text/background pair and control on the page (script it and list failures with ratios), nothing a customer must read under 15px on a phone, labels at least 12px, reduced-motion respected, no animation that loops forever.
6. Without JavaScript (javaScriptEnabled:false): everything readable, nothing invisible, no dead-looking controls.
7. Code quality: the page stylesheet(s): every rule scoped with the right [data-page]; only system tokens (list raw colours/sizes/durations); only the system's breakpoints; no !important; enhancements with fallbacks; hover inside (hover: hover); rules that duplicate a shared component instead of using it; dead rules; size against the budget in handbook section 7. The HTML: canonical component markup from the handbook, no inline style="" except custom properties carrying data, valid nesting (run a quick HTML sanity parse), no leftover placeholder text, header/footer untouched (python3 ${REPO}/tools/sync_chrome.py --check if it supports checking only).
Give a verdict ("ship" only if there is no blocker and no major issue) and report every problem as an issue: severity (blocker = a hard rule from BRIEF.md is broken, a fact is lost or invented, or something does not work; major = an accessibility failure, an overflow, a rule from ROLLOUT.md not met; minor = polish), the exact place, what is wrong with the evidence, and the concrete fix. List separately anything that lives in shared files.
`

const fixPrompt = (key, g, built, issues, shared) => `
You are a senior designer-engineer on the full redesign of knightwebstudio.com ("a top-notch $100,000 website" for a one-person web studio in Baton Rouge whose customers are local tradespeople on phones). Your page(s) were built by a colleague and then reviewed independently by a design critic (a local contractor's eyes plus a creative director's) and by an engineer and fact-checker. This is the FIX PASS: after it, the pages go into the integrated site. Leave them finished.
${reading()}
${GROUND}
${groupFacts(key, g)}
THE BRIEF FOR THESE PAGES
${g.brief}

THE BUILDER REPORTED
${JSON.stringify(built, null, 1)}

THE REVIEWERS' ISSUES
Fix every blocker and every major. Fix each minor unless it is wrong or costs more than it is worth; say which you skipped and why. Verify each claim before acting (look at the page, run the check): reviewers can be mistaken, and a wrong fix is worse than none. Where the two reviewers pull in different directions, the hard rules in BRIEF.md win, then Dale on his phone, then the creative director. Do not lose what the reviewers said is good.
${JSON.stringify(issues, null, 1)}

Issues the reviewers placed in SHARED files (not yours to edit; work around them inside your page stylesheet under a "SHARED-CANDIDATE:" comment only if the page is visibly wrong without it, and pass every one on in sharedIssues):
${JSON.stringify(shared, null, 1)}

The main content files are where the handbook's section 6 table says; the builder's screenshots and notes are in ${R}/work/${key}/ . Rebuild with the build command after each change.
${VERIFY(key, g)}
Your final report: what you fixed, what you skipped and why, the page heights at 390px, the stylesheet size, the last lines of the checker, shared issues (yours plus the reviewers'), and anything still not right.
`

const keys = WANT.filter(k => GROUPS[k])
if (!keys.length) return { error: 'no known groups in args.groups', known: Object.keys(GROUPS) }
log('Page groups in this run: ' + keys.join(', '))

const results = await pipeline(
  keys,
  key => agent(buildPrompt(key, GROUPS[key]), { model: 'opus', effort: 'xhigh', label: 'build: ' + key, phase: 'Build', schema: BUILD_SCHEMA }),
  async (built, key) => {
    if (!built) return null
    const g = GROUPS[key]
    const reviews = ONE_CRITIC
      ? [await agent(designCritic(key, g, built) + '\n\n=== WHEN THAT REVIEW IS DONE, PUT ON A SECOND HAT AND DO THIS ONE AS FULLY; REPORT THE ISSUES OF BOTH IN ONE LIST ===\n' + engCritic(key, g, built), { model: 'opus', effort: 'xhigh', label: 'critic: ' + key, phase: 'Critique', schema: ISSUES_SCHEMA })].filter(Boolean)
      : (await parallel([
        () => agent(designCritic(key, g, built), { model: 'opus', effort: 'xhigh', label: 'design critic: ' + key, phase: 'Critique', schema: ISSUES_SCHEMA }),
        () => agent(engCritic(key, g, built), { model: 'opus', effort: 'xhigh', label: 'engineering critic: ' + key, phase: 'Critique', schema: ISSUES_SCHEMA }),
      ])).filter(Boolean)
    return { built, reviews }
  },
  async (prev, key) => {
    if (!prev) return null
    const g = GROUPS[key]
    const issues = prev.reviews.flatMap(r => r.issues || [])
    const shared = [...new Set(prev.reviews.flatMap(r => r.sharedIssues || []).concat(prev.built.sharedIssues || []))]
    log(key + ': ' + issues.length + ' issues (' + issues.filter(i => i.severity === 'blocker').length + ' blockers, ' + issues.filter(i => i.severity === 'major').length + ' major); scores ' + prev.reviews.map(r => r.score).join('/'))
    let fixed = null
    if (issues.length) fixed = await agent(fixPrompt(key, g, prev.built, issues, shared), { model: 'opus', effort: 'xhigh', label: 'fix: ' + key, phase: 'Fix', schema: BUILD_SCHEMA })
    return { key, built: prev.built, reviews: prev.reviews, fixed, shared }
  }
)

return { groups: keys, results }
