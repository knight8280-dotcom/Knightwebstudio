#!/usr/bin/env python3
"""Write kit/closing/NOTES.md from NOTES.draft.md, notes_parts.py and the numbers measured in the last run."""
import pathlib, re, sys
sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
KIT = HERE.parent / 'kit' / 'closing'
sys.path.insert(0, str(HERE))
import notes_parts as P
size = lambda f: f'{(KIT / f).stat().st_size:,}'
css = ['btn.css', 'closing.css', 'appt.css', 'footer.css', 'skyline.css']
total = sum((KIT / f).stat().st_size for f in css)

MEASUREMENTS = f"""All from `test/results.txt` (`sh test/run-all.sh`): 77 PASS lines, no FAIL. Chromium unless a row says otherwise.

| What | How | Result |
| --- | --- | --- |
| Sizes | `wc -c` | `btn.css` {size('btn.css')}, `closing.css` {size('closing.css')}, `appt.css` {size('appt.css')}, `footer.css` {size('footer.css')}, `skyline.css` {size('skyline.css')} bytes ({total:,} together). No script |
| House rules | `grep` | No hex colour, no `!important`, no site token used bare in any of the five. Media queries: 600, 760, 980 and 1100 only (and 600 from the other side), `hover: hover`, `prefers-reduced-motion`; one container query, at 600 |
| Sideways scroll | the site's `tools/widths.js`, every 20px from 360 to 1920, on the demo, the bare page and the three real-page copies | None at any width, and nothing pokes past the right edge |
| Type and targets | `tools/smalltext.js` at 390; `test/checks.js` at 360 | Smallest text 12px (capital labels only); every link and button at least 44 by 44px on touch |
| Console and requests | five pages, both themes, scrolled to the end | No errors, no failed requests |
| Script off | demo and two real pages at 390 | Everything present; booking links go to `/contact/`; no dead button |
| The name's rise | 390 and 1440 | Driven by a view timeline; 26.8px (phone) and 73.0px (desktop) from rest while entering, unchanged after 1.2s without scrolling; at rest at the end of the page (progress 1.000 and 0.998) |
| The sky's glow | pricing copy, not-found copy, bare page | Runs with the pause button showing (12.3px, then 31.6px a second later); pressed, it holds (33.5px twice) and the button reads "Play motion"; pressed again it runs. Not-found page (no button), reduced motion, bare client page: no animation |
| Paused, and reduced motion | `data-motion="off"`; Playwright `reducedMotion` | Name: no animation, at 0px. Shader layer: one still frame |
| Keyboard | Tab from the band to the end of the pricing page | 25 stops in reading order, each with a 3px ring and scrolled into view, the pause button last; nothing focusable in the scene |
| Structure | pricing copy; 390, 820, 1440 | Band named by its `h2`; footer without headings, four labelled navs (4, 5, 5 and 7 items), 21 links; crest link named; blocks laid out in source order at all three widths |
| The site's own behaviour | `main.js` with the one line of section 6, pricing copy at 390 | `#year` filled; the card's booking button points at the calendar in a new tab with `rel="noopener"`; the phone bar shows mid-page, is hidden with the band 15%, 50% and 100% of the way up the screen, and over the footer; the theme button re-colours band and footer; the open phone menu still makes the footer inert |
| Layout shift | `layout-shift` entries, demo and pricing copy, 390 and 1440, load to page end | 0 from any kit element; page score 0.0000 |
| Taken out of the page | every band and footer removed from the demo | 0 animation frames asked for in 2s afterwards, 0 errors |
| Put in late, twice | a band cloned twice into the bare page after load | Three copies, identical heights |
| No base layer needed | the bare page with its `box-sizing` and margin reset taken out, 390 and 1440 | Card band, strip, card and footer measure exactly the same (713/371/317/944px and 575/266/317/734px) |
| The pause button | demo, page end | Round (demo header): icon 0.5px from the button's centre. Pill (three footers): 44px tall, icon on the centre line, 12.5px before the icon and 17px after the words, last in its row |
| Button states, bare page | hover, mouse down while hovering, keyboard focus | All four: lift 2px, sink 1px under the pointer, 3px solid ring; the two filled ones also deepen. The band's number: underline moves from 4.5px to 7.6px on hover, 3px ring. Reduced motion: transition 0s on all seven |
| Long words | 320, 360, 390: a 30-letter word in each title, a 34-letter word on each button and in a card value, two long marked phrases, a 38-letter footer link and a 53-letter email | 27 cases, none wider than the screen |
| The full stop after the marked words | 320 to 620px every 10px, a short and a long phrase | 62 widths: never on a line of its own, brush always drawn. Same sweep in Firefox and WebKit: never |
| A logo that is only a name | crest removed, name added, 390 and 1440 | One line, 185 by 28px |
| Forced colours | emulated | Card, its button, the band's second button and "Start a project" each have a solid border to draw |
| Text at 200% | root font size doubled; 390, 760, 1280 | No kit element runs off the screen; the bare page does not scroll sideways (the site's own header and tables do, on the real-page copies: not this folder's) |
| Heights | pricing copy | Footer 701px at 1440 by 900 (828px under the sticky header), 678px at 1280 by 720 (648px), 1,099px at 390, 1,096px at 360. Card band 772px at 390, 798px at 360, 503px at 820 in two columns; no empty block right of the card from 600 to 979px |
| Alignment | 360, 390, 820; strip at 1440 | Services and Company row centres within 0.5px; strip: buttons and number centred against the copy to the pixel |
| Gold details | computed | Line under the band's number 2px in the gilt colour; hairline at the band's foot 2px; no kicker in the card layout |
| The scene on a phone | 360, 390, 430, page end | 90px tall; Capitol tower 69px in from the left; a bridge tower 50, 80 and 120px in from the right; 95% of the letters' height clear of the usual roofline (74 to 78% at the tallest building). At 1440: 203px tall, name at 173px |
| Touch | 390, real touch events on the pricing copy | A swipe that starts on the title, the card's button, the band's button, the footer number, a footer link or the pause button scrolls the page (245 to 339px for a 260px swipe with its fling); a sideways swipe moves the page 0px; a tap follows its link |
| Contrast | `test/contrast.js`: text hidden, the page screenshotted, every line of text compared with the worst 4px block behind it; both themes, 390 and 1440 | Still: lowest 6.14:1 ("Free", brick on the card). Shader live, 6 frames each: lowest 4.77:1 (the small "Or call" on the band, light theme; that floor is `shader.js`'s guard, 4.6). All 77 to 79 texts pass AA. Bare page, brick-red brand: lowest 5.26:1 |
| Firefox 155 | `test/other-browsers.js`: pricing copy, bare page, demo; 390 and 1440 | Pass. No scroll-linked animation there, so the name rests in place; no WebGL on this machine, so the stills show |
| WebKit 26.6 (Safari's engine) | the same | Pass: gold line under the number, brush, masks, name sized from container units and clipped to its gradient, two-up list, scallops, folds; the name's rise runs and ends at rest |

**Frame times.** A finger scrolls the last 2,600px of the pricing page to its very end at 390 by 844, three
passes each, the three pages taken in turn (the page as it stands today is the yardstick). Times in ms.

| 4x CPU throttle | Frames | Median | p95 | p99 | Over 34ms | Worst, each pass |
| --- | --- | --- | --- | --- | --- | --- |
| Today (old band and footer) | 1,837 | 16.7 | 16.7 | 16.8 | 1 (0.05%) | 50/17/33 |
| Kit, CSS only | 1,850 | 16.7 | 16.7 | 16.8 | 0 | 33/33/33 |
| Kit with the shader live in the band | 1,885 | 16.7 | 16.7 | 16.8 | 0 | 33/33/33 |

| No throttle | Frames | Median | p95 | p99 | Over 34ms | Worst, each pass |
| --- | --- | --- | --- | --- | --- | --- |
| Today | 1,835 | 16.7 | 16.7 | 16.8 | 2 (0.11%) | 67/17/83 |
| Kit, CSS only | 1,843 | 16.7 | 16.7 | 16.8 | 0 | 17/17/33 |
| Kit with the shader live in the band | 1,865 | 16.7 | 16.8 | 16.8 | 0 | 33/17/17 |

Nothing in this folder asks for an animation frame: 0 in 6s of idling on each page. The sky's glow is a CSS
animation of transform and opacity on one layer. An earlier run the same day, on a busier machine, had 2 frames
of 1,857 over 34ms with the kit's CSS and none of 1,851 on today's page: the differences are noise.

**Page length.** The pricing page at 390 wide goes from 10,378px to 10,608px with the card layout and the new
footer (band +269px, footer -39px). With the strip instead it would be 87px shorter than today."""

import json
Hh = json.loads((HERE / 'heights.json').read_text())
n = lambda v: f'{v:,}'
site = pathlib.Path('/home/user/Knightwebstudio/assets/css/styles.css').stat().st_size / 1000
h390, h1440, h1280 = Hh['390'], Hh['1440'], Hh['1280']
fmt = dict(card390=n(h390['cardPricing']), old390=n(h390['oldBand']), page390=n(h390['page']), oldpage390=n(h390['oldPage']), longer=n(h390['page'] - h390['oldPage']),
           shorter=n(h390['oldPage'] - (h390['page'] - h390['cardPricing'] + h390['strip'])), over1280=n(h1280['foot'] - 648), foot1280=n(h1280['foot']), spare1440=n(828 - h1440['foot']))
P.NOTRIGHT = P.NOTRIGHT.format(**fmt)
MEASUREMENTS = MEASUREMENTS.replace('goes from 10,378px to 10,608px with the card layout and the new\nfooter (band +269px, footer -39px). With the strip instead it would be 87px shorter than today.',
    f"goes from {n(h390['oldPage'])}px to {n(h390['page'])}px with the card layout and the new\nfooter (band {h390['cardPricing'] - h390['oldBand']:+}px, footer {h390['foot'] - h390['oldFoot']:+}px). With the strip instead it would be {fmt['shorter']}px shorter than today.")
t = (HERE / 'NOTES.draft.md').read_text()
vals = {
 'btn': size('btn.css'), 'closing': size('closing.css'), 'appt': size('appt.css'), 'footer': size('footer.css'), 'skyline': size('skyline.css'),
 'inc': ', '.join(size(f) for f in ('footer.inc', 'footer-start.inc', 'footer-bare.inc', 'skyline.inc')),
 'foot1440': n(Hh['1440']['foot']), 'foot390': n(h390['foot']), 'foot360': n(Hh['360']['foot']), 'foot820': n(Hh['820']['foot']), 'foot1280': n(h1280['foot']), 'foot1920': n(Hh['1920']['foot']), 'oldfoot390': n(h390['oldFoot']), 'oldfoot1440': n(h1440['oldFoot']), 'over1280': n(h1280['foot'] - 648),
 'slim390': n(h390['slimStart']), 'slim1440': n(h1440['slimStart']), 'old390': n(h390['oldBand']), 'old1440': n(h1440['oldBand']),
 'strip360': n(Hh['360']['strip']), 'strip390': n(h390['strip']), 'strip820': n(Hh['820']['strip']), 'strip1440': n(h1440['strip']),
 'state360': n(Hh['360']['statement']), 'state390': n(h390['statement']), 'state820': n(Hh['820']['statement']), 'state1440': n(h1440['statement']),
 'card360': n(Hh['360']['cardPricing']), 'card390': n(h390['cardPricing']), 'card820': n(Hh['820']['cardPricing']), 'card1440': n(h1440['cardPricing']),
 'tower390': '80', 'clear390': '95', 'total': f'{total / 1000:.1f}', 'folded': f'{site + total / 1000 - 3.4:.1f}', 'site': f'{site:.1f}',
 'MEASUREMENTS': MEASUREMENTS, 'NOTRIGHT': P.NOTRIGHT, 'SHOTS': P.SHOTS, 'LEDGER': P.LEDGER,
}
for k, v in vals.items():
    assert '@@' + k + '@@' in t, k
    t = t.replace('@@' + k + '@@', v)
left = re.findall(r'@@\w+@@', t)
assert not left, left
(KIT / 'NOTES.md').write_text(t)
print('NOTES.md', len(t.encode()), 'bytes')
