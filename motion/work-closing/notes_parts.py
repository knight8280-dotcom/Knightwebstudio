"""The long sections of NOTES.md that do not carry measured numbers (fill_notes2.py splices them into NOTES.draft.md)."""

NOTRIGHT = """- **`shader.js` is wrong in WebKit when two layers share the screen** (the light group's file; nothing here can
  fix it). Each layer shows another layer's picture. Seen in Playwright's WebKit 26.6 on the light kit's own
  demo (a ribbon in the wash panel, the green client band painted blue and the blue band green:
  `shots/webkit-shader-fault-light-demo.png`, Chromium above, WebKit below) and on the first version of this
  footer (`shots/webkit-shader-fault-this-kit.png`: left still, right live). One layer alone on screen is right.
  What was done here: the footer sky has no layer any more, so the end of a page shows the band's layer only.
  What is left: any page where the closing band shares a screen with another layer (a "band" panel, ribbon
  cards or a wash just above it) will show the fault in Safari, if Safari on a phone behaves as this build of
  WebKit does. Until `shader.js` is fixed and seen on an iPhone, the safe placement is one live layer per
  screen; leaving the layer out of a band costs nothing (its still is this folder's CSS).
- **Not run on a real iPhone, or in a Safari older than 26.** WebKit 26.6 (Playwright's build of Safari's
  engine, on Linux) passes at 390 and 1440 on the pricing copy, the demo and the bare page. Older Safari lacks
  some things, each with a plain result: the name's rise (Safari 26: the name rests in place), the sky's glow
  (`:has()`, 15.4), the phone composition of the skyline (container queries, 16: the drawing keeps its desktop
  composition, cropped from the right), the folds and the dusk (`color-mix()`, 16.2: flat block, plain sky),
  balanced lines (17.5). The gold line under the number is written as longhands, which every Safari takes.
- **No screen reader was run.** Roles, names, order and states were checked by script.
- **At 1280 by 720 the footer is {over1280}px taller than the screen under the sticky header** ({foot1280}px against 648px).
  At 1440 by 900 it fits with {spare1440}px to spare.
- **The card layout is still the long band on a phone**: {card390}px at 390 (today's band: {old390}px). The pricing page
  is {longer}px longer than today's there ({page390}px against {oldpage390}px); with the strip it would be {shorter}px shorter.
- **Frame times were taken on a shared machine with software rendering, never on a phone.** At 4x throttle no
  frame of 1,850 ran over 34ms on the kit's page in the last run, and 2 of 1,857 in the run before (today's
  page: 1 of 1,837, and 0 of 1,851). Medians and p95 are 16.7 to 16.8ms throughout (section 7).
- **Over the live shader the lowest text is 4.77:1** (the small "Or call" in the band's grey-blue, light
  theme). It passes AA, and the floor is `shader.js`'s guard (4.6), which holds whatever colours the text has.
- **The kit's button is drawn to match `.btn`**, not built from it. If `.btn` changes, `btn.css` needs the same
  change. Its hover tone on the blue band is a shade of cream; the site's own primary button turns gold there.
- **Descenders cross the brush.** With "free call" nothing does. With "your quote" the tails of y and q pass
  in front of the gold stroke.
- **The pause button is far from the band's moving background on its own** (the band is the last section, the
  button is in the legal row under the footer's columns). The light group's notes ask the chrome owner to put
  the same pill in the top strip and the phone menu; that is not part of these partials.
- **Integration is not done.** Every page's `.cta-band` section must be rewritten to the new markup, the shared
  rules in section 6 removed, the one line of `main.js` changed, and a check added to `tools/behaviour.js`.
  `tools/sync_chrome.py` itself was not run; its footer pattern takes each partial whole.
- **Where the CSS lives is undecided** (section 6): folded into `styles.css` it fits the 140 KB limit only
  until anything else is added.
- Nothing in the repository was changed."""

SHOTS = """In `shots/` (all retaken after the fix pass; the first version's are gone).

- **The end of a real page on one screen**: `screen-end-1440x900-light` and `-dark`, `screen-end-1280x720-light`,
  `screen-end-390x844-light` and `-dark`.
- **Real pages with the kit in place**, band and footer whole: `pricing-end-` at 360, 390, 700, 820, 1100, 1440
  and 1920 (light, and dark at 390, 820, 1440), plus `-script-off` and `-reduced-motion`; `start-end-` (slim
  footer with script); `notfound-` (slim footer, no script).
- **The three bands by themselves**: `band-strip-`, `band-card-`, `band-statement-`, each `-still` (CSS only)
  and `-live`; `band-card-820-` and `band-card-700-` (the tablet layouts); `band-statement-360-`.
- `card-alone-`: the card on paper. `slim-start-`, `slim-bare-`: the slim footers. `client-brand-`: the green and
  cream palette inside the site; `portable-end-`: the brick-red brand on the bare page.
- **The scene**: `scene-1440-light`, `scene-1440-dark`, `scene-1440-dark-glow-far` (the glow at its far point),
  `scene-phone-360`, `-390`, `-430` (the phone composition), `rise-390-1` to `-3` (the name coming up behind
  the rooftops as the last 100px scroll in).
- **States**: `states-light.png` (rest, hover, pressed, focus for each pressable thing, one row each),
  `focus-` crops of the rings.
- **Other engines**: `other-webkit-` and `other-firefox-`, each `-pricing-`, `-bare-` and `-demo-` at 390 and
  1440 (`-band` and `-end`); `mark-three-engines.png` (the brush and the full stop at phone widths, a short
  phrase and two long ones; Chromium, WebKit, Firefox).
- **The fault found in the kit's shader**: `webkit-shader-fault-light-demo.png`, `webkit-shader-fault-this-kit.png`
  (section 9)."""

LEDGER = """What each reviewer asked for, and what was done. "Fixed" means changed, looked at and measured (section 7).

| # | Issue | Outcome |
| --- | --- | --- |
| 1 | **Major.** The footer never fits one screen | **Fixed.** One row from 1100px, 32px rows with a mouse, 32px gaps, 48px top; the scene is 203px at 1440. 701px at 1440 by 900 (asked: 800 or less), 1,099px at 390 (asked: 1,150 or less). The hours have no target's height, the sentence is left out below 600px, Areas is one wrapping row on a phone, the name is gone from the lockup. Not taken: capping the name at 12rem (it does not bind at 1440, and at 1920 the full-width name is the point; the footer is 769px there) |
| 2 | **Major.** Card layout, 600 to 979px, not designed | **Fixed.** Card beside the copy from 760px (`minmax(0,1fr) 20rem`), filling the column from 600 to 759px with the second button full width under it. 503px tall at 820 |
| 3 | **Major.** Pause icon off centre; no visible word | **Fixed.** The button is the kit's labelled pill now ("Pause motion" / "Play motion"), last in the row after Back to top; the footer's 44px rule only matches links and spans. Checked: icon within 1px vertically, pill padding even, and the round one in the demo header within 1px both ways |
| 4 | **Major.** Nothing run in WebKit; thickness in the `text-decoration` shorthand | **Fixed, as far as this machine allows.** Longhands everywhere. WebKit 26.6 now launches here: band, card, footer, scene, masks, container units, the two-up list and the scallops pass at 390 and 1440. A real iPhone and older Safari remain to be looked at (section 9) |
| 5 | Minor. Kit buttons are not the site's: no tone on hover, no sink under the pointer, no focus rule | **Fixed.** `btn.css`: one button for band, card and footer, with a deeper fill on hover, `:active` after `:hover`, and a 3px ring |
| 6 | Minor. The name behind the skyline is timid; no warm horizon | **Fixed.** Gilt at the top edge running to cream, 68% at the top, fading at the rooftops; lifted on phones (95% of the letters' height clear of the usual roofline); a warm band low between the buildings |
| 7 | Minor. "Consulting & automation" pushes the Services rows off the Company rows | **Fixed.** Link line-height 1.3: two lines fit the 44px row. Largest difference between row centres 0.5px at 360, 390 and 820 |
| 8 | Minor. Number hover: none on the band, a 4px slab in the footer | **Fixed.** A 2px gold line at .2em on every footer link on hover; the band's line (always there) drops to .34em |
| 9 | Minor. The stroke should be the site's brush | **Fixed.** A gilt-coloured mask: `--kws-mark`, then the site's `--brush`, then a plain taper |
| 10 | Minor. Card band too long on a phone; says "discovery call" three times | **Fixed.** No kicker in the card layout; 772px at 390 (asked: 780 or less). The phone bar hides over the band once `main.js` has its one line (issue 13) |
| 11 | Minor. Slim footers repeat the big number | **Fixed.** They lead with the name and place in the display face; number and email at body size |
| 12 | Minor. Strip: right column pinned to the top | **Fixed.** Centred against the copy as one block |
| 13 | Minor. Phone crop of the skyline; the flat join between band and footer | **Fixed.** A phone composition of the drawing (Capitol 69px in, one whole bridge tower in frame); a 2px gilt hairline at the band's foot |
| 14 | **Major** (engineer). The phone bar no longer hides over the band | **Cannot be fixed in this folder; made exact.** It is one line of `main.js` (section 6). The test pages run a copy of `main.js` with that line, and a check proves the bar hidden at three band positions. `tools/behaviour.js` is outside this folder: the check to add is described there |
| 15 | Minor. No focus rule on band and card | **Fixed** (`btn.css`, and the band's number has its own gold ring) |
| 16 | Minor. Buttons animate under reduced motion on a client page | **Fixed.** The transition is inside `prefers-reduced-motion: no-preference`; 0s measured on the bare page |
| 17 | Minor. Long words and long marked phrases widen the page | **Fixed, differently.** `overflow-wrap: anywhere` (inside flex and grid items `break-word` does not let a word give way). For the mark, the reviewer's inline-block below 600px was tried and dropped the full stop onto its own line in Firefox at 350px; the mark now holds an inner span and its punctuation instead. 27 long-word cases at 320, 360 and 390 and 62 widths of full-stop checks pass, in three engines |
| 18 | Minor. A text-only logo is squeezed to 48px | **Fixed** (`.kws-foot-logo > :is(svg, img)`); a name alone is one line, 185px wide |
| 19 | Minor. Forced colours: card and its button lose their edges | **Fixed.** Transparent borders on both |
| 20 | Minor. Logo cannot wrap with text at 200% | **Fixed.** No kit element runs off the screen with text at 200% at 390, 760 and 1280 (the lockup has no name now; a client's name wraps) |
| 21 | Minor. Gold kicker passes AA by a hair over the live shader | **Fixed on this side.** The kicker's words are cream; only its rules are gold, so no small gold text sits on the band. The lowest text over the live band is now the small "Or call" at 4.77:1: that floor is the shader's guard, which this folder cannot move |
| 22 | Minor. Safari: the shorthand; the rise has no duration | **Fixed.** Longhands; `1ms` nominal duration. The rise runs in WebKit 26.6 |
| 23 | Minor. One pause control, far from the band | **Skipped here, on purpose.** A second button inside the band would sit beside the page's main button. The light group's placement (top strip and phone menu as well as the footer) answers it and belongs to the chrome owner. Hiding the button when nothing moves was declined by the light group (their notes) |
| 24 | Minor. "Shared rules replaced" stale; test copies log 404s | **Fixed.** Named by selector; `.cta-copy p`, the city rules and `main.js` added; test pages rebuilt from today's repository (no failed requests) |
| 25 | Minor. Kicker wraps and strands its rules | **Fixed.** `text-wrap: balance`, and the rules are inline, so they stay with the words |
| 26 | Minor. The whole kit does not fit the 140 KB stylesheet | **Not this folder's to decide; costed.** Section 6 gives the numbers and a recommendation |
| 27 | Minor. Raw values | **Partly.** The three durations are `var(--t-fast, .16s)` now (one, in `btn.css`). The black mixes and plain sizes stay, as the reviewer allows |"""
