All in headless Chromium with software WebGL (`--enable-unsafe-swiftshader --use-angle=swiftshader`).
The machine was shared with other jobs throughout (load average between 3 and 24 on 4 cores),
which shows in the frame figures and nowhere else. The scripts and their output are in
`motion/work-light/fix/`: `t_behave.js` (104 checks), `t_gl.js` (5), `t_contrast.js` with
`t_contrast.py`, `t_wash.js` with `t_wash.py`, `t_focus.js`, `t_perf.js`, `t_perf_band.js`,
`sizes.py`, `final_shots.js`; results in the `res-*.txt` files beside them. The engineer
reviewer's own `eng/t5c_ab.js` was also run unchanged.

**Sizes** (bytes on disk, 1 KB = 1,000). Scripts: `shader.js` {{shader.js}} of 16,000; `motion.js`
{{motion.js}} and `cards.js` {{cards.js}} of 8,000. CSS, per component against the 3.5 KB line:
pause button {{motion.css}}; folder cards {{c.folders}}; folder stack {{c.stack}}; bookmark cards
{{c.marks}}; the base the three card components share {{c.shared}} (counted once);
**backgrounds {{shader.css}}, which is over** (section 9).

**No sideways scroll**: `tools/widths.js` on `demo.html` and on `portable.html` in both themes,
every 20px from 360 to 1920: no overflow, nothing past the right edge, no sideways scroller.
Long words, a 50-letter price and seven long tab names on the bare page at 360px: still none.

**Contrast, computed** (`tools/contrast.js`, 390 and 1440, both themes): `demo.html` all text
passes AA; `portable.html` passes in the dark theme and in the light theme everywhere except
three lines the tool cannot judge, the text on the gradient block (it reads `background-color`
only). Photographed, that block's lowest pixel is 5.39:1.

**Contrast, photographed over the moving backgrounds.** Shaders run 25 times faster; the words
are made invisible with text-fill only (so their computed colour, which the guard reads, is
untouched); the area behind every line of text is photographed 24 times, about ten seconds of
shader time apart, and each pixel is compared with that text's colour. 28 cases (this site, the
second brand and the bare page's third brand; wash and band; 390 and 1440; both themes), 672
frames, 99.7 million pixels behind text: **none below AA**. (Taken before the last change, to
the glints' timing; glints are DOM, hidden for this test and never over text.)

| Case | Lowest pixel seen (4.5 needed), day / night theme |
| --- | --- |
| This site, wash behind the first screen | 4.93:1 (the grey "Websites" label, 5.03:1 on plain paper) / 6.04:1 |
| This site, band behind the closing call to action, **with a gold eyebrow** | 4.58:1 / 4.59:1 (the gold eyebrow; it was 4.21:1 before the fix) |
| Second brand, wash | 4.60:1 / 5.25:1 |
| Second brand, band | 5.04:1 / 5.04:1 |
| Bare page, wash | 4.81:1 / 5.36:1 |
| Bare page, band | 4.58:1 / 4.58:1 |
| Bare page, gradient block (still only) | 5.39:1 / 5.39:1 |

The guard aims at 4.6:1; rounding to 8 bits and the stretch from a small canvas leave the
lowest pixel at 4.58:1.

**Is the day wash visible now?** (`t_wash.js`: the first screen with its words hidden, averaged
over 9px so the grain does not count.)

| | Lightness across the field | Within 22px of text | In the clear | Largest colour difference from plain paper | Change over 160 seconds of shader time |
| --- | --- | --- | --- | --- | --- |
| Day, 1440 | 7.3% of the range (was about 2%) | 3.2% | 8.0% | 20 of 255 in the clear, 9 near text | up to 27 of 255 (was 8) |
| Day, 390 | 4.6% | 4.6% | 3.8% | 12 to 13 of 255 | up to 14 |
| Night, 1440 | 9.4% | 6.1% | 9.4% | 47 to 50 of 255 | up to 32 |
| Night, 390 | 6.3% | 6.3% | 6.3% | 33 to 51 of 255 | up to 19 |

**Frame times with the CPU throttled 4x** (`Emulation.setCPUThrottlingRate`), gap between the
page's animation frames (16.7ms is a steady 60 a second), backgrounds running against paused,
passes alternated so that machine noise falls on both.

390x844 at 3x, the contract's measurement:

| Section on screen | Running: median / p95 / worst (frames over 50ms) | Paused | Kit's own frame callback p95 / worst |
| --- | --- | --- | --- |
| First screen (wash, 10 draws a second) | 16.7 / 16.8 / 16.8 (0 of 540) | 16.7 / 16.7 / 16.8 | 1.0 / 10.3ms |
| Bookmark cards (two ribbons, 30 each) | 16.7 / 16.8 / 16.8 (0 of 540) | 16.7 / 16.7 / 33.4 | 3.3 / 17.3ms |
| Step folders (one ribbon strip) | 16.7 / 16.8 / 33.4 (0 of 540) | 16.7 / 16.8 / 33.4 | 1.2 / 8.5ms |
| Folder stack (no canvas) | 16.7 / 16.7 / 16.8 (0 of 543) | 16.7 / 16.8 / 33.3 | none |
| Second brand (wash, ribbons and a band at once) | 16.7 / 16.8 / 66.7 (2 of 524) | 16.7 / 16.7 / 33.4 | 4.7 / 19.1ms |
| Closing band (band and glints) | 16.7 / 16.8 / 33.4 (0 of 538) | 16.7 / 16.8 / 16.8 | 1.9 / 14.6ms |

That pass was taken at load 6 to 8, before the last small change (the glints' shared beat).
Two more for honesty: the reviewer's `t5c_ab.js`, run earlier in the pass at load 3 to 5, gave
16.7 / 16.8 / 16.8 with no frame over 33ms in the second-brand, band and cards sections, running
and paused alike, and a scroll of the whole page at p95 16.8 (4 frames of 3,794 over 50ms on one
pass, none on the other; paused: none). A pass on the final files at load 8 to 14 was worse for
both sides (running: p95 16.8 everywhere except the second-brand block at 50.0, 32 frames of
about 3,000 over 50ms; paused: 6 of about 3,200). The figures move with the machine more than
with the kit; they want repeating on a quiet one.

1440x900, same throttle, software WebGL (load 7 to 10):

| Section on screen | Running: median / p95 / worst (frames over 50ms) | Paused |
| --- | --- | --- |
| First screen (wash) | 16.7 / 16.7 / 16.8 (0 of 541) | 16.7 / 16.8 / 33.3 |
| Three bookmark cards (three ribbons) | 16.7 / **33.4** / 116.7 (13 of 464) | 16.7 / 16.8 / 83.3 (1) |
| Step folders | 16.7 / 16.7 / 250.1 (3 of 508) | 16.7 / 16.8 / 33.3 |
| Folder stack | 16.7 / 16.7 / 16.8 | 16.7 / 16.7 / 33.3 |
| Second brand (five layers) | 16.7 / **49.9** / 283.4 (11 of 401) | 16.7 / 16.7 / 33.3 |
| Closing band | 16.7 / 16.8 / 33.4 (0 of 535) | 16.7 / 16.8 / 49.9 |

So at desktop size, under software rendering, three ribbons at once still cost frames, as the
engineer found. Nobody should meet that path now: without the test's command-line flags the same
build creates no context (`failIfMajorPerformanceCaveat`), and the stills stay. A real GPU has
not been measured (section 9).

**Only what is on screen moves**: every layer draws one still frame when the page is quiet
(11 of 11 on the demo, before any is scrolled to); after that only layers on screen are drawn.
Paused: 0 draws and 0 animation frames asked for. A theme change while paused repaints each
layer once. Layers removed from the page without their remover: the loop stops.

**Behaviour** (`t_behave.js`, 104 checks, all pass). Script off: four folders with their tabs,
headings 19px, three cards, four steps, no canvas, no button, no sideways scroll. Upgrade:
layout shift 0.0000 at 390, 820 and 1440 through a scroll of the whole page, and the stack's
height and its body's position are the same to the pixel before and after `cards.js` runs.
`cards.js` blocked: every folder, tab and link shows once the page has loaded (both pages, 390
and 1440); `cards.js` stalled: after four seconds. Tabs at 360, 390 and 1440: roles, names and
wiring; names 15px and prices 19px; 62px tall; 13px or more to spare beside the longest name at
360px; one line each with the web fonts blocked; they follow a 200% text size; Right, Left, Home
and End with wrapping; modifier keys left alone; Tab goes on into the folder's first link; the
kit's 3px ring; ink text on unselected tabs; no tap flash; forced colours. `#hash`, `data-start`
out of range and not a number, no folders, one folder, mounting twice, the remover, the
phone-only variant across 760px and a hash after it was torn down. The pause button: labels,
state, storage, reload, another tab, two mounts of one button, data-attribute labels. Paused and
reduced motion, on the site page and on the bare page: no animation on the folder swap, glints
still, one still frame a layer. Gradient host, gradient over a solid colour, `--kit-shader-ground`,
unreadable text, Save-Data, no GPU. Cards at 390, 820, 1000 and 1440: columns, one link each,
prices breaking only between phrases, the arrow 20px in, focus rings, the hover lift with the
pointer on the bottom pixel. Touch: a 300px swipe starting on the art, the tabs, the open folder,
the band or a step folder scrolls the page 285 to 446px; a tap on a tab opens it. No console
errors anywhere.

**Context loss and leaks** (`t_gl.js`, 5 checks, all pass): the shared context lost while
running and while paused: stills at once, then all eleven layers redrawn on a new context, no
error. Lost for good: stills, and no frames asked for. Twelve rounds of a stack, a pause button,
a band and four ribbons added, mounted and taken off the page without their removers: DOM nodes
473 before and after, listeners 13 before and after.

**Keyboard focus on a phone** (`t_focus.js`, 390x844): each of the seven whole-card links, when
it takes focus, has its card and ring 100% on screen between the sticky header and the phone bar
(the first build left a quarter to a third under the bar).

**Glints**: 18 on the desktop band, 8 or 9 on a phone; the nearest is 40px from text and 18px
from an edge; none inside a button.
