export const meta = {
  name: 'kws-motion-kit',
  description: 'Hand-build original interactive components for KnightWebstudio (animated backgrounds, folder and bookmark cards, carousels, footer and call-to-action) in a scratch kit: build, two critiques, fix',
  phases: [
    { title: 'Build', detail: 'one designer-engineer per component group' },
    { title: 'Critique', detail: 'a design critic and an engineering critic per group' },
    { title: 'Fix', detail: 'apply the verified critique' },
  ],
}

const R = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
const REPO = '/home/user/Knightwebstudio'
const KIT = R + '/motion/kit'
const KITURL = 'http://localhost:8730/kit'
const WANT = (args && args.groups) || []
const ONE_CRITIC = (args && args.critics) === 'one'

const GROUPS = {
  light: {
    title: 'Animated backgrounds, folder cards and bookmark cards',
    files: 'shader.js, shader.css, cards.css (and cards.js only if a card truly needs script)',
    brief: `
THREE THINGS, ONE OWNER (they share the animated backgrounds):
1. ANIMATED BACKGROUNDS (shader.js). Start from our own existing code, ${R}/motion/ref/shader-pr51.js (a hand-written WebGL grain gradient with a per-pixel contrast guard, a 30fps cap, off-screen and background-tab pause, a still frame under reduced motion, and a CSS fallback without WebGL or with Save-Data). It was written for the old dark design. Rework it for the new system and extend it to named presets chosen with an attribute, for example data-shader="wash", "band", "ribbon":
   - "wash": behind a page's first screen, on paper. By day: slow morning light drifting across warm paper, with fine grain, barely there; at night: the blue hour, a soft glow as if from a shop window. It must never compete with the headline.
   - "band": for the deep-blue closing call-to-action band and blue panels: slow, rich movement in blues with restrained gold-leaf glints (gold only on blue is the brand's rule).
   - "ribbon": flowing silk-like ribbons or waves as the art inside a card (see the bookmark cards in the owner's screenshot), in the brand's colours, with two or three colourways so three cards side by side differ.
   Colours are read from the site's CSS custom properties at run time and follow the theme toggle (watch the data-theme attribute on <html> and the prefers-color-scheme media query). Keep and re-prove the contrast guard against the NEW text colours in both themes. One WebGL context per canvas is expensive: share one context or strictly limit live canvases, and never run more than the canvases on screen.
   Add the site-wide MOTION PAUSE CONTROL the accessibility rules need: a small, quiet, 44px button (markup + styles + behaviour) that pauses and resumes all ambient motion, remembers the choice in localStorage under "kws-motion", and sets data-motion="off" on <html>; every animated thing in the kit honours html[data-motion="off"]. Under prefers-reduced-motion the default is off.
2. FOLDER CARDS. Cards shaped like tabbed manila job folders, numbered 01, 02, 03 and so on (see the owner's screenshot), in OUR art direction: a real folder tab with the number set in Fraunces, paper tones, an ink or brick label, at most a restrained gradient or the "ribbon" art on one of them; a small arrow in the corner when the card is a link. Uses: the four process steps (discovery call, proposal & design, build & review, launch & support) and, as a second arrangement, a stack of folders where choosing a tab brings that folder to the front (for the four website packages on a phone: One-page $1,000, Starter $2,000, Business $4,000, Commerce $8,000). The stack must be a proper tabs pattern for keyboards and screen readers (or a set of details/summary) and show everything with script off.
3. BOOKMARK CARDS. Tall cards with a notched "bookmark" corner and a small label, art in the middle (the "ribbon" preset, with a still CSS fallback), and a large statement at the bottom, each card a single link. Use them for the three service families with honest words only, for example "Websites. $1,000 to $8,000, fixed." is NOT allowed (never a range): say instead what is true and fixed, such as the family name large and the fixed prices listed beneath as on the site ("$1,000, $2,000 or $4,000"). Never a statistic. Three cards across on desktop, a swipeable row or a stack on a phone.`,
  },
  flat: {
    title: 'Arc focus carousel and spotlight carousel',
    files: 'arc.css, arc.js, spotlight.css, spotlight.js',
    brief: `
TWO CAROUSELS THAT MOVE IN THE PLANE:
1. ARC FOCUS CAROUSEL. Tiles sit along an arc like the top of a wheel; the centre tile is largest and in focus, its neighbours step down in size and turn with the arc; below it a caption for the focused item (name, one line, a button), previous/next arrows and position dots (see "Slow Mornings" in the owner's screenshot). Dragging, swiping, the arrows, the dots and the arrow keys all turn the wheel; it settles on an item with a soft snap. OUR version: the nine services as enamel shop-sign tiles or price tags on a wheel (each tile drawn in CSS/SVG with a simple, honest pictogram and the service's short name; the caption carries the service's name, its fixed price wording exactly as the site states it, one line, and a link to that service's section). The nine services and their price wording: website design & build ($1,000, $2,000 or $4,000); e-commerce stores ($8,000); SEO & performance (in every build); care & maintenance ($125, $300, $600 or $1,000/mo); redesigns & rescues (priced as a new site); brand & identity ($1,500); growth consulting ($350 audit · $500 or $1,000/mo); Google profile & reviews ($500); automation ($750 or $1,500 per setup). With script off it is a plain, good-looking list of the nine with prices.
2. SPOTLIGHT CAROUSEL. A row of cards where the centre card is larger, sharp and lit, with its title and a button over or under it, and the neighbours are smaller and dimmed; it advances by drag, swipe, arrows, dots and keys, and NEVER by itself. OUR version: the three real projects (Smilys Softwash, Risen Health, Corbel Books) with their real screenshots (/assets/img/work-smilyssoftwash.jpg, work-risenhealthco.jpg, work-corbelbooks.jpg; read their width, height and alt from ${REPO}/work/index.html), each in a browser-window frame, with the kind of business and what was built as the site states it, and a link to /work/. Three is the truth: design it to look complete with exactly three (no clones, no padding, no fake fourth); it must also work with more items later. Nothing may be claimed about results.
Both must leave vertical page scrolling completely alone on touch screens (only clearly horizontal drags are taken), never hijack the mouse wheel, and never auto-rotate.`,
  },
  depth: {
    title: 'Cylinder slider and carousel ring',
    files: 'cylinder.css, cylinder.js, ring.css, ring.js',
    brief: `
TWO CAROUSELS WITH DEPTH (CSS 3D transforms, no WebGL):
1. CYLINDER SLIDER. Cards stand on the surface of a wide, shallow cylinder seen from slightly outside, so the centre card faces the viewer and the cards to each side curve away and dim (see "Circular UI Slider" in the owner's screenshot). Drag, swipe, arrows, dots and keys turn it; it settles with a soft snap; it never turns by itself. OUR version: the story of a missed call becoming a booked job, as five or six plain cards, each a moment (You can't pick up. / Within a minute, they get a text. / They pick a time. It's on your calendar. / The quote went quiet? It follows up for you. / Job done. The review request sends itself.), each with a small CSS-drawn illustration marked "Example" (a phone notification, a message, a calendar slot, an enquiry list, a review request), using everyday trade wording only: no business names, no people's names, no star ratings, "[your business]" where a name would go. Read the home page's current version of this story in ${R}/pages/home/main.html for the exact wording and the shared mock components (.notice, .cal, .leads, phone bubbles in the handbook). Nothing inside a mock is blue.
2. CAROUSEL RING. Many small cards arranged around a large tilted ring, like a card file or a rotary index seen from above at an angle, turning slowly as the page scrolls past it and by drag (see "Image Carousel Ring" in the owner's screenshot). OUR version: a rotary card file of "everything a build includes": twenty or more small index cards, each naming one real inclusion from the site's packages, drawn as paper cards with a ruled line and a small tab. Take the inclusions from ${R}/pages/pricing/main.html (for example: Custom design; Copy editing and polish; Contact form; Mobile & SEO basics; Copywriting; Blog or news section; Analytics & tracking setup; Local SEO configuration; Payments, shipping & tax; Product import; Email & abandoned cart flows; Team training session; and the rest that are really there) and use their wording exactly. It is decoration that tells the truth: beside or under it, the same items are an ordinary readable list (that list is what a screen reader and a no-script visitor get; the ring itself is aria-hidden). Scroll-linked turning must be smooth and cheap (one passive scroll listener or an IntersectionObserver plus requestAnimationFrame; transform only) and stop when off screen; under reduced motion or with motion paused it is a still ring.
Both: 3D must degrade to a tidy flat row or grid where 3D transforms are unsupported or the screen is very small; no text may become unreadable on the turned cards that a visitor needs to read (the centre card is always flat-on and sharp).`,
  },
  closing: {
    title: 'A better footer and a stronger closing call-to-action',
    files: 'closing.css (and closing.js only if truly needed), plus proposed replacements for the chrome partials as kit files',
    brief: `
THE END OF EVERY PAGE: the closing call-to-action band and the footer. Read the digest's sections on footer and call-to-action patterns, and study the current ones: the closing band and footer on http://localhost:8720/pricing/ , the partials in ${REPO}/tools/chrome/ (footer.inc, footer-start.inc, footer-bare.inc, skyline.inc, phone-bar.inc) and their rules in ${REPO}/assets/css/styles.css . Do not edit those files; build your proposals in the kit.
1. THE CLOSING CALL-TO-ACTION. On the deep-blue band (the .on-blue tone scope), with the animated "band" background behind it (another engineer is writing shader.js; you mark the band with data-shader="band" and give it a handsome STILL CSS background that is the fallback and the reduced-motion state, so your work is complete without the script). Two actions: "Book a free 30-minute call" (primary, a booking button: copy the exact attributes the site's booking buttons use from the current pages) and "Send an enquiry" (to /contact/), plus the tap-to-call number (225) 255-0837. Make it a moment: a large Fraunces line, one honest supporting line (free, 30 minutes, no pitch, fixed prices: only what the site already says), gold-leaf detail used sparingly (gold only on blue), the scalloped awning edge the system already uses if it helps. Design two or three distinct variants (for example: centred statement; split with an appointment card; compact strip for short pages) so pages are not all identical, each with the same two actions.
2. THE FOOTER. It must carry: four link columns (Services, Company, Areas we serve, Contact) with exactly the links the current footer has, the phone and email, "Based in Baton Rouge, Louisiana", the skyline drawing, the crest, the legal row with the year (#year) and the privacy and terms links. Make it one of the best-made parts of the site, in the manner of the footers people collect: for example an oversized "KnightWebstudio" wordmark in Fraunces set across the full width and cropped by the bottom edge or sitting behind the skyline; the skyline at night with lit windows and a slow "band"-style glow in the sky; a clear contact block with large tap targets; the columns on a strong grid; a last line that sounds like a local shop. Keep column titles as non-heading text as now. It must be excellent at 360px (columns as two-up or collapsible groups with 44px targets, nothing cramped) and at 1920px.
   The slim footers for /start/ and 404 get the same care at their smaller scale.
Deliver your proposed partials as files in your kit folder with the same names as the originals (footer.inc and so on), so they can be dropped into tools/chrome/ later, and say exactly which shared CSS rules they replace.`,
  },
}

const GROUND = `
GROUND RULES
- You work ONLY in the scratch kit: ${KIT}/<your group>/ . Do NOT edit anything in the repository ${REPO} (other agents are rebuilding its pages right now); read it freely.
- The kit is served at ${KITURL}/ with the repository's site behind it on the same origin, so a demo page can load the real stylesheet and fonts with <link rel="stylesheet" href="/assets/css/styles.css"> and the real script with <script src="/assets/js/main.js" defer></script>. If the server is down: (nohup python3 ${R}/motion/serve.py >/dev/null 2>&1 &)
- Never run a git command that changes anything. Scratch files stay under ${R}/motion/ .
- Never write the words "AI", "artificial intelligence", "chatbot", "GPT" or "machine learning" anywhere, including comments, class names and file names.
- ORIGINAL WORK ONLY. Do not copy code, shader code or artwork from scrolltide.co, scrollshaders.com or any other site or library. The reference is the owner's screenshot and the digest's description of behaviour; the design and every line of code are ours. Small, well-known public-domain or MIT snippets (for example a noise function) may be used only with their licence noted in a comment, as the existing shader file does.
- No libraries, no CDNs, no build step. Vanilla JavaScript in an IIFE with 'use strict'; no globals except one shared namespace if you need it (window.KWS).
- Do not ask questions; decide, and record the decision in your notes and final report.
`

const CONTRACT = `
THE CONTRACT EVERY COMPONENT MEETS
- HTML first. The component is ordinary semantic HTML (a list of items with real headings, text and links) that reads well and looks tidy with JavaScript off. Script upgrades a root element marked with a data-kws="<name>" attribute and adds class "is-live" to it; every enhanced style hangs off .is-live (or html.js). Nothing is hidden, clipped or unreachable without script.
- No layout shift when the script upgrades it: reserve the space first (aspect-ratio or min-block-size).
- PORTABLE THEME CONTRACT (these components will also go into client websites with other palettes and fonts; read the digest's section 5). Component CSS never uses the site's tokens directly and never a hex colour: it reads a small set of kit variables, each with a fallback to this site's token, for example color: var(--kit-ink, var(--ink)). The set is: --kit-bg, --kit-surface, --kit-ink, --kit-muted, --kit-line, --kit-accent, --kit-accent-ink, --kit-notice, --kit-gilt, --kit-radius, --kit-font-display, --kit-font-body, --kit-shadow, and for animated backgrounds --kit-shader-1, --kit-shader-2, --kit-shader-3. Read ${R}/DESIGN.md section 3 to choose the right site token as each fallback (the handbook explains how the tokens switch between day and night and how the tone scopes .on-blue, .on-ink, .on-paper re-point them, so both themes come free). Spacing and type sizes may use the site's scale tokens with a plain fallback value, for example var(--sp-4, 1rem). Prove portability: your demo.html has a second section, or a toggle, that sets the kit variables to a completely different brand (for example a dark green and cream bakery with other fonts) and every component still looks deliberate.
- PORTABLE SCRIPT CONTRACT. Each script auto-starts on elements marked data-kws="<name>" at DOMContentLoaded, and also exposes window.KWS.<name>.mount(element, options) which returns a function that removes everything it added (listeners, observers, canvases, classes), so a React component can call it in an effect and clean up. It does not depend on the site's main.js or on any class the site defines, works when mounted after load, twice on one page, and when the element is removed. Kit class names start with "kws-". Kit CSS never targets [data-page], the site's chrome or the site's own component classes. Only the six breakpoints (380, 600, 760, 980, 1100, 1280); hover rules inside @media (hover: hover); no !important.
- The colour rule: blue means pressable, brick means "notice this", gold only on blue. Nothing inside mock content is blue.
- Motion: transform and opacity only (plus the WebGL canvas). Nothing moves by itself except the ambient backgrounds and the scroll-linked ring. Under prefers-reduced-motion, and when html[data-motion="off"], everything is still and complete, and carousels move instantly without animation.
- Input: pointer events for mouse, touch and pen, with drag, a little inertia and a soft snap; touch-action: pan-y so vertical page scrolling is never blocked and only clearly horizontal drags are taken; the mouse wheel is never hijacked; a click after a drag does not follow a link. Previous/next buttons and position dots are real buttons, at least 44px, with accessible names. Arrow keys work when focus is inside. Tabbing to an item that is off to the side brings it to the centre. Focus is always visible and never trapped.
- Screen readers: a sensible structure (a labelled region with a list; aria-roledescription="carousel" and "slide" where it is one; "3 of 9" style labels; a polite live region naming the item in focus). Purely decorative canvases and duplicates are aria-hidden.
- Performance: requestAnimationFrame only while something is moving and on screen (IntersectionObserver); no forced layout in the frame loop (measure once, on resize); passive listeners; will-change only while active; smooth with the CPU throttled 4x at 390px wide (measure with Chrome DevTools Protocol Emulation.setCPUThrottlingRate and report frame times). For WebGL tests launch Chromium with args ['--enable-unsafe-swiftshader','--use-angle=swiftshader'].
- Size budgets: shader.js at most 16 KB; any other script at most 8 KB; each component's CSS at most 3.5 KB. Comment the top of each file briefly: what it is, how to use it.
- Honest content only: facts already on the site (the digest and your brief list them). No invented statistics, testimonials, client logos, star ratings or stock photos; no price ranges or "from"; examples inside mocks are marked "Example".
- Works from 360px to 1920px wide with no sideways page scroll. On a phone it is at least as easy to use as a plain list.
`

const DELIVER = (key, g) => `
WHAT YOU DELIVER, in ${KIT}/${key}/ :
- The component files: ${g.files}.
- demo.html : a page that loads the site's real stylesheet and shows each of your components in realistic sections with real site content, the way they would sit on a page (not a bare test bench), with the site's theme toggle working (include the site's first-paint snippet from ${REPO}/tools/chrome/head-script.inc and a theme button, or a simple pair of buttons that set data-theme on <html>).
- NOTES.md : for each component: what it is for, which kinds of business it suits, how to mount it from a React component (a short example), the canonical markup to copy, every attribute and option, what happens with script off / reduced motion / motion paused, keyboard and screen-reader behaviour, file sizes, the measurements you took, and known limits. This is what the person placing it on real pages will follow.
- shots/ : screenshots you took and looked at.

HOW TO WORK
1. Read ${R}/BRIEF.md (the business, the audience, the hard rules), ${R}/ROLLOUT.md, ${R}/DESIGN.md (the design system handbook: tokens, components, colour rule), then ${R}/motion/research/DIGEST.md (what the owner's references are and how each becomes ours), and open the owner's screenshot ${R}/motion/ref/inspiration-post.png . Look at the site as it stands: http://localhost:8720/pricing/ (the most finished page) and the component gallery http://localhost:8721/ .
2. Design before you code: sketch in words what each component is as an object from a well-run local shop, its states, its phone view. The bar is a top studio's work: these are the moments a visitor remembers. They must look like they belong to THIS site, not like a demo dropped in from a component library.
3. Build, then LOOK: screenshot with Playwright at 390x844 and 1440x900 in both themes (set data-theme, or localStorage "theme"), and at several moments of an interaction (before, mid-drag, settled; several animation times for backgrounds). Open the PNGs with the Read tool. Expect several rounds.
4. Test what the contract says with scripts, not by eye: no sideways scroll from 360 to 1920 in 20px steps; keyboard walk-through; script off; reduced motion (Playwright reducedMotion: 'reduce'); motion paused; touch drag does not block vertical scroll (emulate touch); contrast of text over any background you made in both themes (${R}/tools/contrast.js may help; for animated backgrounds sample many frames); frame times under 4x CPU throttle; no console errors; no leaks when a component is removed from the page.
`

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    sizes: { type: 'string' },
    measurements: { type: 'string', description: 'frame times, contrast, widths sweep, what was tested and the result' },
    decisions: { type: 'array', items: { type: 'string' } },
    openIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'files', 'sizes', 'openIssues'],
}

const ISSUES_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ship', 'needs-fixes'] },
    score: { type: 'number' },
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
    praise: { type: 'string' },
  },
  required: ['verdict', 'issues'],
}

const buildPrompt = (key, g) => `
You are a senior designer-engineer who specialises in interactive, animated interface work, on the redesign of knightwebstudio.com: a one-person web studio and small-business consultancy in Baton Rouge whose customers are local tradespeople, mostly on phones. The owner asked for "a top-notch $100,000 website", and has now sent a screenshot of a social post showing the kinds of animated components he wants on his site (folder cards, bookmark cards with flowing shader art, an arc carousel, a cylinder slider, a spotlight carousel, a ring of cards, animated shader backgrounds, better footers and calls to action), asking for everything that can be had for free. We are not buying or copying anything: you are hand-building ORIGINAL versions in this site's own art direction ("Main Street premium": warm paper, ink, sign-painter's blue, Red Stick brick, gold leaf only on blue; Fraunces and Figtree; objects from a well-run local shop).

YOUR GROUP: ${g.title}
${g.brief}
${GROUND}
${CONTRACT}
${DELIVER(key, g)}
Your final report: what you built, the files, their sizes, what you measured, your decisions, and anything not right yet.
`

const designCritic = (key, g, built) => `
You are an exacting creative director reviewing new interactive components for knightwebstudio.com before they go on the site. The owner asked for "a top-notch $100,000 website" and sent a screenshot of the kind of animated components he wants (${R}/motion/ref/inspiration-post.png : open it). Our team hand-built original versions in the site's own art direction. You did not build them. Do NOT change any files; you only report. (Your own screenshots and scripts go in ${KIT}/${key}/critique/ .)

READ: ${R}/BRIEF.md , ${R}/ROLLOUT.md , ${R}/DESIGN.md , ${R}/motion/research/DIGEST.md , then ${KIT}/${key}/NOTES.md . Look at the site the components must belong to: http://localhost:8720/pricing/ and the gallery http://localhost:8721/ .
THE GROUP: ${g.title}
THE BRIEF THE BUILDER HAD
${g.brief}
${CONTRACT}
THE BUILDER REPORTED
${JSON.stringify(built, null, 1)}

HOW TO REVIEW
Open ${KITURL}/${key}/demo.html with Playwright (for WebGL launch Chromium with args ['--enable-unsafe-swiftshader','--use-angle=swiftshader']) at 390x844, 820x1100 and 1440x900, in both themes; take screenshots at rest and at several moments of each interaction (drag part-way, settle, next, keyboard focus on each control, several animation times for backgrounds); open every image and study it. Then judge twice.
- As the owner comparing with his screenshot: does each one deliver the appeal of the thing he pointed at (the depth, the glow, the tactile snap), or is it a timid imitation?
- As the creative director: does it belong to THIS site (paper, ink, sign-painter's blue, brick, gold only on blue; Fraunces and Figtree; shop objects) or does it look like a demo from a component library dropped in? Proportions, type setting, spacing, shadows and radii from the system; the phone view designed, not shrunk; the night theme finished; states (hover, focus, pressed, dragging, disabled arrows at the ends); the resting state as a composition; the motion's character (weight, easing, snap) as far as stills at several moments can show; legibility of every word at every position; honesty of the content (no invented numbers, no ranges, mocks marked "Example", nothing blue inside a mock); whether a roofer on an iPhone would find it clear and quick or confusing and slow.
Give a score out of 100 and a verdict ("ship" only with no blocker and no major). Report each defect: severity (blocker = would embarrass the site or breaks a hard rule; major = clearly below a top studio's bar or off-brand; minor = polish), the exact place (component, viewport, theme, state), what is wrong, and the concrete fix. Say what is genuinely good and must survive.
`

const engCritic = (key, g, built) => `
You are a senior front-end engineer specialising in animation performance and accessibility, doing an independent, skeptical review of new interactive components for knightwebstudio.com before they go on the site. You did not build them. Do NOT change any files; you only report. (Your scripts and evidence go in ${KIT}/${key}/eng/ .)

READ: ${R}/BRIEF.md (hard rules and engineering rules), ${R}/DESIGN.md (tokens, breakpoints, colour rule), ${R}/motion/research/DIGEST.md (the licence conclusion and guardrails), then ${KIT}/${key}/NOTES.md and every source file in ${KIT}/${key}/ .
THE GROUP: ${g.title}
THE BRIEF THE BUILDER HAD
${g.brief}
${CONTRACT}
THE BUILDER REPORTED
${JSON.stringify(built, null, 1)}

CHECK, WITH EVIDENCE (run things against ${KITURL}/${key}/demo.html ; for WebGL launch Chromium with args ['--enable-unsafe-swiftshader','--use-angle=swiftshader']; do not trust the report)
1. Script off (javaScriptEnabled:false): everything readable, tidy, reachable; nothing clipped or hidden. Layout shift when the script upgrades (measure CLS with a PerformanceObserver).
2. Reduced motion and html[data-motion="off"]: nothing moves; everything complete; carousels still operable. The pause control (if this group owns it) works, persists and is announced. Does anything run for more than five seconds with no way to pause it?
3. Input: mouse drag, touch drag (emulated), pen; vertical page scroll over the component on touch is not blocked; wheel not hijacked; click after drag does not navigate; arrows, dots, keys; ends behave sensibly; rapid input does not break state; resize and orientation change; right-to-left not required.
4. Accessibility (WCAG 2.2 AA): names, roles, states; the tab order and what happens when focus lands on an off-centre item; focus visible and not obscured; live region not chatty; decorative things hidden from the accessibility tree (dump the tree); 44px targets at 390px; text contrast in both themes for every state, including text over animated or gradient backgrounds (sample at least 20 frames; list the worst ratio); text under 15px on a phone; zoom to 200%.
5. Performance: frame times while dragging/animating at 390px with 4x CPU throttle (report median and worst); forced layouts in the frame loop (read the code and use a performance trace); listeners passive; work stops off screen and in a background tab (prove it: count frames); WebGL: context count, canvas resolution, behaviour on context loss, memory after mounting and removing ten times; Save-Data and no-WebGL fallbacks.
6. Robustness: 360 to 1920 in 20px steps with no sideways page scroll; long words and long item names; one item, two items, many items; images missing; fonts late; the theme toggled while it is running; two instances on one page; bfcache restore.
7. Code: original (no code copied from the paid libraries; third-party snippets carry their licence note); size budgets; tokens only (list raw colours and sizes); six breakpoints; no !important; hover guarded; no globals beyond the shared namespace; no errors in the console; strict mode; no eval or inline event handlers; comments accurate.
8. Content: every figure and claim is on the live site (compare with ${R}/baseline/ ); no ranges or "from"; no invented statistics, testimonials, logos or ratings; mocks marked "Example"; never-use words absent.
Give a verdict ("ship" only with no blocker and no major) and report each problem: severity (blocker = broken, inaccessible, or a hard rule violated; major = a contract item not met or a measurable performance problem; minor = polish), the exact place, the evidence, and the concrete fix.
`

const fixPrompt = (key, g, built, issues) => `
You are a senior designer-engineer who specialises in interactive, animated interface work, on the redesign of knightwebstudio.com ("a top-notch $100,000 website" for a one-person web studio in Baton Rouge whose customers are local tradespeople on phones). A colleague hand-built original interactive components in the site's own art direction; a creative director and a performance-and-accessibility engineer then reviewed them. This is the FIX PASS: after it, the components are merged into the kit and placed on the real pages. Leave them finished.

YOUR GROUP: ${g.title}
${g.brief}
${GROUND}
${CONTRACT}
${DELIVER(key, g)}
THE BUILDER REPORTED
${JSON.stringify(built, null, 1)}

THE REVIEWERS' ISSUES
Fix every blocker and every major. Fix each minor unless it is wrong or costs more than it is worth; say which you skipped and why. Verify each claim before acting (look, measure): reviewers can be mistaken. Where the two pull in different directions, the hard rules and accessibility win, then the phone experience, then the showpiece effect. Do not lose what the reviewers said is good. If the creative director says a component is a timid imitation, be bolder: this is meant to be the part of the site people remember.
${JSON.stringify(issues, null, 1)}

Keep NOTES.md exactly in step with the code. Your final report: what you fixed, what you skipped and why, the files, their sizes, what you measured, and anything still not right.
`

const keys = WANT.filter(k => GROUPS[k])
if (!keys.length) return { error: 'no known groups in args.groups', known: Object.keys(GROUPS) }
log('Kit groups in this run: ' + keys.join(', '))

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
    log(key + ': ' + issues.length + ' issues (' + issues.filter(i => i.severity === 'blocker').length + ' blockers, ' + issues.filter(i => i.severity === 'major').length + ' major); scores ' + prev.reviews.map(r => r.score).join('/'))
    let fixed = null
    if (issues.length) fixed = await agent(fixPrompt(key, g, prev.built, issues), { model: 'opus', effort: 'xhigh', label: 'fix: ' + key, phase: 'Fix', schema: BUILD_SCHEMA })
    return { key, built: prev.built, reviews: prev.reviews, fixed }
  }
)

return { groups: keys, results }
