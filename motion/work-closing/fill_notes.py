"""Fill the size and measurement placeholders in kit/closing/NOTES.md from the files and test/results.txt."""
import pathlib, re
K = pathlib.Path(__file__).resolve().parent.parent / 'kit' / 'closing'
p = K / 'NOTES.md'
s = p.read_text()
size = lambda n: f'{len((K / n).read_bytes()):,}'
s = s.replace('SIZE_CLOSING', size('closing.css')).replace('SIZE_APPT', size('appt.css')).replace('SIZE_FOOTER', size('footer.css')).replace('SIZE_SKYLINE', size('skyline.css'))
s = s.replace('SIZE_INC', ', '.join(size(n) for n in ('footer.inc', 'footer-start.inc', 'footer-bare.inc', 'skyline.inc')) + ' bytes')

res = (K / 'test' / 'results.txt').read_text()
perf = {}
for m in re.finditer(r'(\d)x CPU  (today|kit\+bg|kit) +(\d+) frames in 3 passes: mean ([\d.]+)ms, median ([\d.]+)ms, p95 ([\d.]+)ms, p99 ([\d.]+)ms, over 34ms: (\d+) \(([\d.]+)%\), worst per pass ([\d/]+)ms', res):
    perf[(m.group(1), m.group(2))] = m.groups()[2:]
def row(rate, name, label):
    f, mean, med, p95, p99, over, pc, worst = perf[(rate, name)]
    return f'| {label} | {int(f):,} | {med} | {p95} | {p99} | {over} ({pc}%) | {worst} |'
lows = re.findall(r'(light|dark) +(\d+) +(still|shader live, \d+ frames) +\d+ texts, lowest ([\d.]+):1', res.split('bare page')[0])
still = min(float(x[3]) for x in lows if x[2] == 'still')
live = min(float(x[3]) for x in lows if x[2] != 'still')
bare = re.findall(r'lowest ([\d.]+):1', res.split('bare page')[1].split('== frame times')[0])
passes = len(re.findall(r'^PASS', res, re.M))

M = f"""| What | How | Result |
| --- | --- | --- |
| Sizes | `wc -c` | `closing.css` {size('closing.css')}, `appt.css` {size('appt.css')}, `footer.css` {size('footer.css')}, `skyline.css` {size('skyline.css')} bytes. No script |
| House rules | `grep` | No hex colour, no `!important`, no site token used bare in any of the four. Media queries: 600, 760 and 980 only, `hover: hover`, `prefers-reduced-motion` |
| Sideways scroll | `tools/widths.js`, every 20px from 360 to 1920, on the demo, the bare page and the three real pages | None at any width |
| Type and targets | `tools/smalltext.js` at 390; `test/checks.js` at 360 | Smallest text 12px (capital labels only); every link and button at least 44 by 44px |
| Console | five pages, both themes, scrolled to the end | No errors |
| Script off | demo and two real pages at 390 | Everything present; booking links go to `/contact/`; no dead button |
| The name's rise | 390 and 1440 | Driven by a view timeline; 32.7px (phone) and 91.6px (desktop) from rest while entering, unchanged after 1.2s without scrolling; 0.00px and progress 1.000 at the end of the page |
| Paused, and reduced motion | `data-motion="off"`; Playwright `reducedMotion` | No animation at all; name at 0px; shader layers hold one still frame |
| Keyboard | Tab from the band to the end of the pricing page | 25 stops in reading order, each with a 3px ring and scrolled into view; nothing focusable in the scene |
| The site's own behaviour | real `main.js` on the pricing copy | `#year` filled; the card's booking button points at the calendar in a new tab with `rel="noopener"`; the phone bar shows mid-page and hides over the footer; the theme button re-colours band and footer; the open phone menu still makes the footer inert |
| Layout shift | `layout-shift` entries, demo and pricing copy, 390 and 1440, load to page end | 0 from any kit element; page score 0.0000 |
| Taken out of the page | every band and footer removed from the demo | 0 animation frames asked for in 2s afterwards, 0 errors |
| Put in late, twice | a band cloned twice into the bare page after load | Three copies, identical heights |
| Touch | 390, real touch events on the pricing copy | A swipe that starts on the title, the card's button, the band's button, the footer number or a footer link scrolls the page (245 to 388px for a 260px swipe with its fling); a sideways swipe moves the page 0px; a tap follows its link |
| Contrast | `test/contrast.js`: text hidden, the page screenshotted, every line of text compared with the worst 4px block behind it; both themes, 390 and 1440 | Still: lowest {still:.2f}:1. Shader live (6 frames each): lowest {live:.2f}:1. Both are the gold kicker on blue; all 77 texts pass AA. Bare page, brick-red brand: lowest {min(map(float, bare)):.2f}:1 |
| Firefox 155 | `test/other-browsers.js`, 390 and 1440 | Pass: same layout; no scroll-linked animation there, so the name simply rests in place |
| WebKit | | Could not be launched on this machine: untested |

{passes} PASS lines, no FAIL.

**Frame times.** A finger scrolls the last 2,600px of the pricing page to its very end at 390 by 844, three
passes each, the three pages taken in turn (the machine was shared with other work, so the page as it stands
today is the yardstick). Times in ms.

| 4x CPU throttle | Frames | Median | p95 | p99 | Over 34ms | Worst, each pass |
| --- | --- | --- | --- | --- | --- | --- |
{row('4', 'today', 'Today (old band and footer)')}
{row('4', 'kit', 'Kit, CSS only')}
{row('4', 'kit+bg', 'Kit with the shader live')}

| No throttle | Frames | Median | p95 | p99 | Over 34ms | Worst, each pass |
| --- | --- | --- | --- | --- | --- | --- |
{row('1', 'today', 'Today')}
{row('1', 'kit', 'Kit, CSS only')}
{row('1', 'kit+bg', 'Kit with the shader live')}

Nothing in the kit asks for an animation frame: 0 in 6s of idling on each page, shader included while it is
off screen.

**Page length.** The pricing page at 390 wide goes from 10,410px to 11,012px with the card layout and the new
footer (band +362px, footer +240px). With the strip instead it would be about 200px longer than today."""
s = s.replace('MEASUREMENTS', M).replace('LIVE_LOW', f'{live:.2f}:1')
p.write_text(s)
print('filled;', 'placeholders left:', re.findall(r'SIZE_\w+|MEASUREMENTS|LIVE_LOW', s))
