# Motion kit: build digest

Christian sent a screenshot of a social post (`../ref/inspiration-post.png`) listing five design
resource sites and showing six component previews, and asked two things:

1. "Implement these designs into our website too. I know some of it is paid; just implement
   everything we can that is free."
2. "Use all these new design elements in our new website builds going forwards for clients too."

So the kit has two homes: knightwebstudio.com now, and every client site built from the
KnightWebstudio template (React + Tailwind, Vite) afterwards. Build it once, portable.

## 1. Licence conclusion (strict)

| Site | What it is | Free | Paid | What we may do |
| --- | --- | --- | --- | --- |
| scrolltide.co | Library of prompts and coded components for 3D and scroll-based sites | 7 free templates; terms do not say whether they may go on client sites | $39/mo, $144/yr or $299 lifetime | Use nothing from it. Take the *kinds* of component as a brief and write our own. |
| scrollshaders.com | Library of looping WebGL shaders | Nothing we can ship | $29/mo, $129/yr or $239 lifetime | Use nothing from it. Write our own shaders. |
| footer.design | Gallery of other sites' footers, tagged by style | Free to browse | None | Inspiration only. No licence is stated, so copy no artwork or code. |
| cta.gallery | Gallery of other sites' call-to-action sections | Free to browse | None | Inspiration only. |
| styles.refero.design | Style references taken from real products (beta) | Free to browse | None found | Inspiration only; its licence for client work is not stated. |

Therefore: every line of code, every shader and every drawing in the kit is ours. No code,
shader source or artwork is copied from those sites or from any paid library. A small, well-known
MIT or public-domain snippet (for example a simplex noise function) is fine with its licence
noted in a comment, as `../ref/shader-pr51.js` already does. Generic interface patterns (a
carousel on an arc, a card shaped like a folder) are ideas, not anyone's property; the look,
proportions, content and code of ours must be our own.

We already own one piece: `../ref/shader-pr51.js`, a hand-written WebGL grain gradient made for
this site in another session (draft PR #51, against the old dark design). It has a per-pixel
contrast guard, a 30fps cap, off-screen and background-tab pause, a still frame under reduced
motion, and a CSS fallback with no WebGL or with Save-Data. It is the starting point for the
animated backgrounds.

## 2. The eight things

Our art direction is "Main Street premium": warm paper, ink, sign-painter's blue, Red Stick
brick, gold leaf only on blue; Fraunces for headings and prices, Figtree for text; objects from
a well-run local shop. Each reference below becomes one of those objects. On client sites the
same components take the client's palette and fonts (section 5).

### 2.1 Animated shader backgrounds

- Reference: slow, seamless, looping colour fields, ribbons and waves with fine grain, used
  behind heroes and inside cards (the dark cards in the screenshot carry blue, red and purple
  ribbons).
- Ours, three presets chosen by attribute (`data-shader="wash" | "band" | "ribbon"`):
  - **wash**: behind a page's first screen. By day, slow morning light drifting across warm
    paper with fine grain, barely there. At night, the blue hour: a soft glow like a lit shop
    window. It never competes with the headline.
  - **band**: for the deep-blue closing band and blue panels. Slow, rich movement in blues with
    restrained gold-leaf glints.
  - **ribbon**: silk-like ribbons or waves as the art inside a card, in two or three colourways
    so neighbouring cards differ.
- Colours come from CSS custom properties at run time and follow the theme toggle.
- Still state: a handsome CSS gradient that is the fallback, the reduced-motion state and the
  paused state. The page is complete without the script.
- Never: text over it below 4.5:1; more live canvases than are on screen; motion with no pause.

### 2.2 Folder cards

- Reference: three cards with a folder tab at the top-left, a large number (01, 02, 03), a small
  arrow in the corner, a title and a line at the bottom, each in a different gradient.
- Ours: manila job folders from the shop's filing drawer. A real tab with the number in
  Fraunces, paper tones, an ink or brick label, a hairline shadow where the tab overlaps. One
  folder in a set may carry the "ribbon" art; the rest stay paper. The arrow shows only when the
  card is a link.
- Two arrangements: a row (the four process steps: discovery call, proposal & design, build &
  review, launch & support) and a stack where choosing a tab brings that folder to the front
  (the four packages on a phone: One-page $1,000, Starter $2,000, Business $4,000, Commerce
  $8,000). The stack is a proper tabs pattern, or details/summary, and shows everything with
  script off.

### 2.3 Bookmark cards

- Reference: tall dark cards with a notched corner and a small label, shader art in the middle,
  a big statement at the bottom ("Let's Talk.", "+190%", "One Call."), dots beneath.
- Ours: tall cards with a ribbon-bookmark notch and a small label, the "ribbon" art in the
  middle, the family name large in Fraunces at the bottom with the fixed prices beneath exactly
  as the site states them. Each card is one link. Three across on desktop; a swipeable row or a
  stack on a phone.
- Carries: the three service families (websites; automation; growth consulting).
- Never: a statistic (no "+190%"), a price range, "from".

### 2.4 Arc focus carousel

- Reference: seven rounded tiles along an arc like the top of a wheel, the centre one largest;
  beneath it a caption for the focused item, previous and next arrows, a small button, dots.
- Ours: the service wheel. Nine enamel shop-sign tiles (or price tags) on an arc, each a simple
  honest pictogram and a short name; the caption carries the service's name, its fixed price
  wording exactly as on the site, one line, and a link to its section. Drag, swipe, arrows, dots
  and arrow keys turn it; it settles with a soft snap; it never turns by itself.
- With script off: a plain, good-looking list of nine with prices.

### 2.5 Cylinder slider

- Reference: cards on the surface of a wide shallow cylinder; the centre card faces you, the
  ones to each side curve away.
- Ours: the story of a missed call becoming a booked job, five or six plain cards, each a moment
  with a small CSS-drawn illustration marked "Example". Everyday trade wording, "[your
  business]" where a name would go, nothing blue inside a mock.
- The centre card is always flat-on and sharp. It never turns by itself.

### 2.6 Spotlight carousel

- Reference: a row of image cards; the centre one is larger and lit with a title and a button,
  the neighbours smaller and dimmed.
- Ours: the three real projects (Smilys Softwash, Risen Health, Corbel Books) with their real
  screenshots in browser-window frames, the kind of business and what was built, a link to
  /work/. Three is the truth: it looks complete with exactly three. No clones, no fake fourth.
- Never: a claim about results; auto-advance.

### 2.7 Carousel ring

- Reference: dozens of small image cards around a large tilted ring.
- Ours: a rotary card file seen from above at an angle: twenty or more small paper index cards,
  each naming one real inclusion from the packages, turning slowly as the page scrolls past and
  by drag. It is decoration that tells the truth: the same items sit beside it as an ordinary
  list, and the ring itself is hidden from screen readers.
- Still under reduced motion or when motion is paused.

### 2.8 A better footer and a stronger closing call to action

Patterns that recur in the footers and call-to-action sections people collect (general design
knowledge; the galleries were not readable in detail):

Footers
- An oversized wordmark set across the full width, sometimes cropped by the bottom edge.
- The contact block treated as the main event: large phone and email, big tap targets.
- Link columns on a strict grid with quiet titles; a thin legal row last.
- One piece of place: an address, a local line, a drawing of the town.
- A last line with some voice, like a shop sign.

Calls to action
- One large statement, one supporting line, one primary button and one quiet alternative.
- A strong colour block or slow gradient behind it; nothing else competing.
- A reassurance beside the button (free, how long it takes, no obligation).
- Sometimes a small object beside the words (a card, a calendar slot) that shows what you get.

Ours
- Closing band on deep blue with the "band" background: a large Fraunces line, one honest
  supporting line (free, 30 minutes, no pitch, fixed prices), "Book a free 30-minute call" and
  "Send an enquiry", the tap-to-call number, gold-leaf detail used sparingly. Two or three
  variants (centred statement; split with an appointment card; compact strip) so pages differ.
- Footer: the "KnightWebstudio" wordmark very large in Fraunces, the skyline with lit windows
  at night and a slow glow in the sky, a clear contact block, four link columns on a strong
  grid (Services, Company, Areas we serve, Contact), "Based in Baton Rouge, Louisiana", the
  crest, the legal row with the year and the privacy and terms links. Excellent at 360px.

## 3. Polish recipes from real product styles

- Type scale on one ratio; headings tight (line-height near 1.05, slight negative tracking),
  text loose (1.5 to 1.65).
- Spacing on one scale; section gaps two or three steps above component gaps.
- Borders as hairlines in a tone of the surface, never grey on colour; shadows in two layers
  (a tight contact shadow plus a soft ambient one), tinted with the ink colour.
- One radius family: small for inputs and tags, medium for cards, large for panels.
- Every interactive thing has hover, focus-visible, pressed and disabled states; focus rings
  are 2 to 3px with an offset.
- Motion is short (150 to 300ms) with one easing curve for entrances and one for exits.

## 4. Guardrails every component meets

1. Phone first. On a phone it is at least as easy as a plain list.
2. HTML first: ordinary semantic content, upgraded by script. Nothing hidden without script.
3. No layout shift when the script upgrades it.
4. `prefers-reduced-motion` gives a still, complete layout; carousels move instantly.
5. Anything that moves for more than five seconds can be paused with a visible control
   (WCAG 2.2.2). One site-wide control, remembered, `html[data-motion="off"]`.
6. Pointer, touch and keyboard all work. Vertical page scroll is never blocked. The wheel is
   never hijacked. Nothing auto-advances.
7. Focus is visible and never trapped. Screen readers get a labelled list, not a canvas.
8. Animated backgrounds never take text below 4.5:1 (keep the contrast guard), render at a
   capped resolution and frame rate, stop off screen and in background tabs, and fall back to a
   still CSS background with no WebGL or with Save-Data.
9. No libraries, no CDNs, no build step. Each script small (see the contract).
10. Honest content: facts already on the site. No invented statistics, testimonials, logos,
    ratings or stock photos. No price ranges or "from". Mock content marked "Example".
11. On knightwebstudio.com: blue means pressable, brick means "notice this", gold only on
    blue, nothing blue inside a mock.

## 5. Portable by design (client builds)

The same files must drop into a client site with a different palette and different fonts.

- **Theme contract.** Component CSS reads a small set of kit variables, each with a fallback to
  this site's tokens, for example `var(--kit-ink, var(--ink))`. The set: `--kit-bg`,
  `--kit-surface`, `--kit-ink`, `--kit-muted`, `--kit-line`, `--kit-accent`,
  `--kit-accent-ink`, `--kit-notice`, `--kit-gilt`, `--kit-radius`, `--kit-font-display`,
  `--kit-font-body`, `--kit-shadow`. On knightwebstudio.com nothing needs setting. On a client
  site, setting those thirteen variables once re-skins every component. Shaders read
  `--kit-shader-1`, `--kit-shader-2`, `--kit-shader-3` (falling back to accent, gilt and
  surface) so they follow the same switch.
- **Script contract.** Each script auto-starts on elements marked `data-kws="name"` when the
  page loads, and also exposes `window.KWS.<name>.mount(element, options)` returning a function
  that removes it, so a React component can call it in an effect and clean up. No dependency on
  this site's `main.js`. Works when mounted after load and when mounted twice on a page.
- **No site-specific selectors.** Kit CSS never targets `[data-page]`, the site's chrome or the
  site's component classes. Kit class names are prefixed `kws-`.
- **Notes.** Each component's NOTES.md says how to place it on a static page and how to mount
  it from React, and which kinds of business it suits.

## 6. Placement plan for knightwebstudio.com (proposal; one showpiece per screen)

| Page | What goes where |
| --- | --- |
| Home | "wash" behind the first screen; bookmark cards for the three service families; spotlight carousel for the three projects; folder cards for the four steps; closing band with "band" |
| Services | arc focus carousel as the opening service wheel, the full list beneath it |
| Work | spotlight carousel above the three case rows |
| Process | folder cards as the page's main sequence |
| Pricing | folder stack for the four packages on phones if it beats the current phone view; "band" behind the bundle panel |
| Consulting | cylinder slider for the step-by-step story; "band" behind the Launch bundle |
| Start | "wash" behind the first screen; compact bookmark cards or the arc |
| Home or Start | the ring of inclusions, once, near "what a build includes" |
| City pages, About | "wash" behind the first screen only |
| Contact, FAQ, privacy, terms, checkout, 404 | no showpiece; the new footer and the pause control only |
| Every page | the new footer; a closing band variant where the page has one |
