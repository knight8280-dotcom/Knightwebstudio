#!/usr/bin/env python3
"""Write $R/DESIGN.md, the handbook for the page agents.

    python3 gallery/make_design.py

The token tables are read from the repository's stylesheet and the component
chapter from gallery/components.py (through gallery/build.py), so the handbook
cannot drift from the code that was tested.
"""
import pathlib, re, subprocess, sys
sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
R = HERE.parent
REPO = pathlib.Path('/home/user/Knightwebstudio')
css = (REPO / 'assets/css/styles.css').read_text()
subprocess.run([sys.executable, str(HERE / 'build.py')], check=True, capture_output=True)
components = (HERE / 'components.md').read_text()

pair = dict((n, (d, k)) for n, d, k in re.findall(r'--([a-z0-9-]+):\s*var\(--L,\s*(#[0-9A-Fa-f]{6})\)\s*var\(--D,\s*(#[0-9A-Fa-f]{6})\)', css))
def tok(name):
    m = re.search(r'--%s:\s*([^;]+);' % re.escape(name), css)
    return m.group(1).strip()
def row(name, use):
    d, n = pair[name]
    return f'| `--{name}` | `{d}` | `{n}` | {use} |'

COLOURS = [
    ('paper', 'The page'), ('paper-2', 'Sand bands (`.section-sand`)'), ('paper-3', 'Wells: the customer\'s text bubble, payment-plan months, the Example flag'),
    ('card', 'Raised paper: cards, tickets, receipts, form fields'), ('ink', 'Headings, strong lines, secondary button outline'), ('ink-2', 'Body copy'),
    ('ink-3', 'Captions, labels, help text'), ('line', 'Hairlines (`--seam`)'), ('line-2', 'Stronger hairlines and dashes (`--edge`, `--dash`)'),
    ('ctl', 'Form field outlines (3:1 or better)'), ('blue', 'Pressable: primary button, links, ticks'), ('blue-deep', 'Hover on blue'),
    ('blue-tint', 'Quiet blue fill: tick circles, `.pill-go`, the success message'), ('on-blue', 'Text on a blue button'),
    ('brick', 'Notice this: eyebrows, numerals, bars, stamps, errors'), ('brick-tint', '`.pill-new`, the flag inside a note'),
    ('board', 'Painted-sign blue behind `.on-blue` panels'), ('footer', 'Footer and top strip (`.on-ink`)'), ('focus', 'Focus ring'), ('bezel', 'Phone bezel'),
]
size_px = lambda v: v
TYPE = [
    ('fs-figure', 'The one very large number a page (`.bigfig`), the 404'),
    ('fs-price', 'A headline price: tier prices, receipt total'),
    ('fs-h1', 'Page headline. One a page'),
    ('fs-h2', 'Section titles'),
    ('fs-title', 'The name on a card or object: appointment card, business card, a feature card title'),
    ('fs-h3', 'Card titles, price-list prices, the phone menu'),
    ('fs-h4', 'Small headings: price-list names, FAQ questions, table totals, the brand name'),
    ('fs-lede', 'The intro paragraph under a heading (`.lede`, `.section-sub`)'),
    ('fs-body', 'Body copy, form field text. 17px'),
    ('fs-md', 'Buttons. 16px'),
    ('fs-sm', 'Card copy, table cells, notes, fine print, message bubbles. 15px: nothing a customer must read is smaller'),
    ('fs-label', 'Uppercase labels: eyebrows, table heads. 13px'),
    ('fs-cap', 'The floor, 12px: pills, flags, and labels inside mocks only'),
]
SPACE = [('s-0', 'hairline gaps'), ('s-1', ''), ('s-2', ''), ('s-3', ''), ('s-4', ''), ('s-5', ''), ('s-6', ''), ('s-7', ''), ('s-8', ''), ('s-9', ''),
         ('gutter', 'page side margin'), ('gap', 'between cards and columns'), ('gap-lg', 'between the two halves of a split'),
         ('pad', 'inside a card'), ('pad-lg', 'inside a big panel (board, bundle)'), ('stack', 'section heading to its content; top of a page head'),
         ('sec', 'top and bottom of every section')]

def space_table():
    out = ['| Token | Value | Use |', '| --- | --- | --- |']
    for n, use in SPACE:
        out.append(f'| `--{n}` | `{tok(n)}` | {use} |')
    return '\n'.join(out)

doc = f'''# KnightWebstudio design handbook

For everyone building a page of the redesigned site. Read BRIEF.md and ROLLOUT.md
first; this file tells you how to build. `$R` is
`/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh`.

- The shared stylesheet: `/home/user/Knightwebstudio/assets/css/styles.css`. **Do not edit it.**
- Your page stylesheet: `/home/user/Knightwebstudio/assets/css/pages/<slug>.css`.
- Your page content: `$R/pages/<slug>/main.html` (it holds the page's current `<main>`; replace it with yours).
- Every component, live, in both themes: <http://localhost:8721/> (source: `$R/gallery/`).
- The site: <http://localhost:8720/>.

## 1. The idea

**The well-run shop.** Everything on a page is an object you would find in a good
local business: the painted sign, the price board, the job ticket, the receipt, the
appointment card. It is drawn on warm paper in ink, sign-painter's blue and Red
Stick brick, so a roofer on a phone reads it as local, plain-spoken and carefully
made. Light is "open for business"; the dark theme is the same street after closing.

## 2. The colour rule

1. **Blue means pressable.** Buttons, links, ticks. Nothing blue that cannot be pressed
   (the price board and closing band are the two painted-sign panels, and what sits on them is pressable).
2. **Brick means "notice this".** Eyebrows, numerals, the bars in a ledger, stamps, errors, the missed call.
3. **Gold only on blue or on the footer.** It appears by itself when you use `.on-blue` or `.on-ink`. Never write gold on paper.

Never write a hex colour in a page stylesheet. Use the tokens. If a colour is missing, report it.

## 3. Tokens

All tokens are at the top of `styles.css`. Every spacing, type size, radius, shadow and
duration in your page stylesheet comes from one too.

### Colour

One line per colour holds both themes: `--paper: var(--L, #F6F0E4) var(--D, #131722);`.
`--L` and `--D` are switches set by the theme. You never write a rule per theme. If a
page-only value must differ at night, use the same form in your own rule:
`opacity: var(--L, 0) var(--D, 1);`.

| Token | Day | Night | Use |
| --- | --- | --- | --- |
{chr(10).join(row(n, u) for n, u in COLOURS)}
| `--gold` | `{tok('gold')}` | same | Gold leaf: eyebrows and prices on blue, footer headings |
| `--cream` | `{tok('cream')}` | same | Text on blue and on the footer; the appointment card |
| `--well` | `--paper-2` | `--paper-2` | The quiet fill behind a pill. Tone scopes re-point it |

Line tokens, built from the colours: `--edge` (card edge, strong hairline), `--dash` (dashed
divider), `--seam` (soft hairline), `--frame` (1.5px ink line). Write `border-top: var(--dash);`.

Shadows: `--shadow-1` a resting card, `--shadow-2` a lifted card, `--shadow-3` an object that
sits on top (phone, board, business card). `--press` is the edge under a button.

### Tone scopes

A class that re-points the colour tokens for everything inside it. The same components work
inside a scope with no extra rules, and each scope has its own focus-ring colour.

| Class | What it is | Inside it |
| --- | --- | --- |
| `.on-blue` | Painted-sign blue: price board, bundle, closing band | Text cream, eyebrows and prices gold, `.btn-primary` cream, plain `.btn` a cream outline, focus ring gold |
| `.on-ink` | Top strip and footer | Text cream, headings gold, focus ring gold |
| `.on-paper` | A printed card that stays cream paper at night (the appointment card) | The day palette, whatever the theme |

### Type

Two families, two files. **Fraunces** (soft, weight 600) for headings, every price and
numerals; **Figtree** for text and labels. No italic is loaded: do not use `<em>` or
`<i>` for emphasis; use `<strong>`.

| Token | Value | Use |
| --- | --- | --- |
{chr(10).join(f"| `--{n}` | `{tok(n)}` | {u} |" for n, u in TYPE)}
| `--measure` | `{tok('measure')}` | Line length for running text: about 65 characters |

- To set something in the display face, add class `display` (or use a heading). Do not write `font-family` yourself.
- To make a small uppercase label, add class `label` (grey) or `eyebrow` (brick, with a rule).
- `h1` 38 to 60px on phones and 52 to 76px from 980px; `h2` 30 to 50px; `h3` 21 to 25px; `h4` 19px.
- One `<h1>` a page. Do not skip levels. A card title directly under the `h1` is `<h2 class="h3">`.
- Body measure stays between 45 and 75 characters: `.lede`, `.section-sub`, `.prose`, `.note` and paragraphs
  inside components are already capped with `--measure`. A bare `<p>` in a full-width container is not: cap it.

### Space, size, shape

4px base. Use the scale for every margin, padding and gap; use the fluid tokens for layout.

{space_table()}

Sizes: `--tap` 44px (smallest target), `--btn-h` 52px, `--btn-h-lg` 56px, `--header-h` 64px (72px from 1100px),
`--maxw` 1240px (`.container`), `--maxw-text` 46rem (`.container-text`, FAQ, contents list).
Line weights: `--hair` 1px, `--rule` 1.5px, `--bold` 2px. Focus ring: `--focus-w` 3px, `--focus-off` 3px.
Radii: `--r-xs` 4, `--r-sm` 8, `--r-md` 14, `--r-lg` 22, `--r-xl` 32, `--r-pill`.
Layers: `--z-raised` 1, `--z-bar` 50, `--z-header` 60, `--z-skip` 200.

A drawn object in your page stylesheet may set its own geometry once, as custom properties at the
top of its rule (`.route {{ --pin: var(--tap); }}`), and build the rest from those.

### Motion

`--ease`, `--spring`; `--t-fast` .16s (press), `--t` .28s (hover, menu), `--t-slow` .5s (reveal),
`--t-step` 70ms (the gap between steps in a sequence), `--move` (the one transition: `transform var(--t) var(--ease)`).

## 4. Breakpoints

Six, and only six, in the whole site. Phone first: write the phone layout, then add `min-width` rules.

| Width | What changes |
| --- | --- |
| 380px | Below this is a small phone: the top strip and brand shrink, the phone bar drops " · no pitch" |
| 600px | Button rows sit side by side; headline lines (`.l`) break; leaders appear in the contents list |
| 760px | Two columns (`.grid-2`, `.grid-3`, the spec table's cards, the footer); stacked tables become tables |
| 980px | Split layouts sit side by side; the spec table becomes one table; `h1` steps up |
| 1100px | Desktop menu. Below it: the full-sheet phone menu and the sticky phone bar |
| 1280px | The phone number shows in the header |

```css
@media (min-width: 760px) {{ ... }}
@media (max-width: 759.98px) {{ ... }}   /* the same breakpoint, from the other side */
```

Use these numbers and no others. Between them, let `clamp()` tokens and `minmax(0, 1fr)` do the work.

## 5. Section rhythm

```html
<main id="main">
  <section class="page-head"> ... eyebrow, h1, lede ... </section>
  <section class="section section-first" id="..."> <div class="container"> ... </div> </section>
  <section class="section section-sand" id="..."> ... </section>
  <section class="section" id="..."> ... </section>
  <section class="cta-band on-blue"> ... </section>
</main>
```

- Every band is a `.section` (padding `--sec` top and bottom) holding one `.container`.
- Alternate plain paper and `.section-sand`. Never two sand bands in a row.
- At most one blue panel (board or bundle) and one closing band a page.
- No two neighbouring sections share a structure. If the last one was a grid of cards, this one is a
  split, a table, a ticket or a list. Prefer the shop objects to `.card`.
- A section heading is left aligned. Do not centre section heads.
- Add `reveal` to blocks that should rise in as they scroll into view. Never on anything in the first
  screen, and never on a wrapper that holds the whole section.

## 6. Building a page

```bash
python3 $R/tools/kws_page.py services/index.html --main $R/pages/services/main.html
```

You write only `<main id="main"> ... </main>`. The tool supplies everything else for that page and
touches no other file: the untouched baseline `<head>` with the new theme settings and font preloads,
the link to `/assets/css/pages/<slug>.css` when that file exists (`--css other` links one more),
`<body data-page="slug">`, the skip link, top strip, the right header with `aria-current`, the sticky
phone bar where the page has one, the right footer, the page's scripts exactly as the baseline has
them, and the art markers filled in. Then it runs the integrity check for the page and prints it.

It refuses to build, and writes nothing, when:
- the file has no `<main>...</main>`;
- a `style=""` attribute sets anything other than custom properties (`style="--w:50"` is fine);
- a banned word is in the markup;
- on `/checkout/` or `/checkout/success/`, an id the inline script uses is missing.

Page paths and the files that hold their content now:

| Page | `data-page` | Main file | Chrome |
| --- | --- | --- | --- |
| `index.html` | `home` | `$R/pages/home/main.html` | standard |
| `services/index.html` | `services` | `$R/pages/services/main.html` | standard |
| `consulting/index.html` | `consulting` | `$R/pages/consulting/main.html` | standard |
| `work/index.html` | `work` | `$R/pages/work/main.html` | standard |
| `process/index.html` | `process` | `$R/pages/process/main.html` | standard |
| `pricing/index.html` | `pricing` | `$R/pages/pricing/main.html` | standard |
| `faq/index.html` | `faq` | `$R/pages/faq/main.html` | standard |
| `about/index.html` | `about` | `$R/pages/about/main.html` | standard |
| `web-design-baton-rouge/index.html` and the three other city pages | `city` | `$R/pages/city/web-design-<town>.main.html` | standard |
| `contact/index.html` | `contact` | `$R/pages/contact/main.html` | standard, no phone bar |
| `privacy/index.html`, `terms/index.html` | `privacy`, `terms` | `$R/pages/privacy/main.html`, `$R/pages/terms/main.html` | standard, no phone bar |
| `checkout/index.html` | `checkout` | `$R/pages/checkout/main.html` | standard, no phone bar |
| `checkout/success/index.html` | `checkout-success` | `$R/pages/checkout-success/main.html` | standard, no phone bar |
| `start/index.html` | `start` | `$R/pages/start/main.html` | start: no menu, one booking button, slim footer, phone bar |
| `404.html` | `notfound` | `$R/pages/notfound/main.html` | bare: brand only, slim footer, no script |

The four city pages share one stylesheet, `pages/city.css`.

**The chrome is not yours.** The header, footer and phone bar live once in
`/home/user/Knightwebstudio/tools/chrome/` and are copied into pages by the build tool. Do not paste
them into your main file, do not restyle them from a page stylesheet, and do not run
`tools/sync_chrome.py` or `tools/art/build.py` without a page name (they would touch other agents' pages).

Check your work, for your page only:

```bash
node $R/tools/shoot.js --base http://localhost:8720 --paths /services/ --out $R/shots/services --modes desktop-light,desktop-dark,mobile-light,mobile-dark,small-light,tablet-light,laptop-light
node $R/tools/widths.js --urls http://localhost:8720/services/          # no sideways scroll, 360 to 1920 in 20px steps
node $R/tools/contrast.js --base http://localhost:8720 --paths /services/   # measured AA contrast, both themes
node $R/tools/smalltext.js --urls http://localhost:8720/services/       # nothing under 12px, no target under 44px, lists text under 15px
python3 $R/tools/check_site.py --root /home/user/Knightwebstudio --baseline $R/baseline --pages services/index.html --show-missing
```

Open the screenshots and look at them. `node $R/tools/behaviour.js` re-tests the theme toggle, menu,
phone bar, contact form, calculator and checkout wiring across the site.

## 7. Page stylesheets

- One file per page: `/home/user/Knightwebstudio/assets/css/pages/<slug>.css`. Create it only if you need it.
- **Every selector starts with `[data-page="<slug>"]`** (reveal rules start `.js [data-page="<slug>"]`).
  An integrator folds these files into the one stylesheet at the end; an unscoped rule would leak.
- Tokens only: no hex colours, no raw px for spacing, type, radius or duration, no `!important`,
  no `[data-theme]` selectors, no `color-mix()`, `backdrop-filter` or `:has()` without a plain
  declaration first or an `@supports` wrapper.
- The six breakpoints only. Hover rules inside `@media (hover: hover)`.
- Reuse before you write. Most pages need under 4 KB. Budgets (the whole site must end under 140 KB and
  the shared sheet is 62): home 15 KB, consulting 9, pricing 7, services 6, start 6, city 5, contact 5,
  about 5, work 4, process 4, faq 3, checkout 3, checkout-success 2, notfound 2, privacy 1, terms 1.
- Name page classes after the thing, not the look, and do not reuse a shared class name for something else.
- **Do not edit `styles.css`, `main.js`, the chrome partials, `tools/` or another page's files.** If a
  shared component is wrong or missing, work around it in your page file with a scoped rule and
  report it in your final message under "Shared problems".

## 8. Components

Canonical markup for every shared component. Copy it; change the words, not the structure.
Each one is drawn at <http://localhost:8721/> in both themes.

### Icons

An inline `<svg viewBox="0 0 24 24" aria-hidden="true">` with **no class** (or class `ico`) is a
line icon: 1.15em, drawn in the current text colour. Use these paths so icons match site-wide:

| Icon | Paths |
| --- | --- |
| phone | `<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>` |
| missed call | the phone path, then `<path d="m15 4 5 5m0-5-5 5"/>` |
| pin | `<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>` |
| mail | `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>` |
| clock | `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>` |
| tick | `<path d="m5 12.5 4.5 4.5L19 7.5"/>` |
| arrow | `<path d="M5 12h13M12 5l7 7-7 7"/>` |
| external | `<path d="M7 17 17 7M9 7h8v8"/>` |
| price tag | `<path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5Z"/><circle cx="8" cy="8" r="1.5"/>` |
| key | `<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16 7l2.5 2.5M13.5 9.5 15 11"/>` |
| loop | `<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M20 4v4.5h-4.5M4 20v-4.5h4.5"/>` |

No icon fonts, no emoji, no icon tiles.

### Utilities

| Class | What it does |
| --- | --- |
| `container`, `container-text` | Page column (1240px) and text column (46rem), with the gutter |
| `display` | Sets the element in Fraunces, soft, 600 |
| `h2`, `h3`, `h4` | Size an element like that heading level without changing the outline |
| `label`, `eyebrow`, `lede`, `fine` | Small grey caption; brick kicker with a rule; intro paragraph; 15px fine print |
| `stack`, `cluster`, `grid` + `grid-2/3/4`, `split` (+ `split-even`, `split-sticky`), `btn-row` | Layout primitives (see below) |
| `sr-only` | For screen readers only |
| `nowrap` | Keeps a phrase such as "7–10 days" on one line |
| `tilt` | The page's one tilted object |
| `reveal`, `seq` | Scroll reveal; one step of a sequence inside a reveal |
| `on-blue`, `on-ink`, `on-paper` | Tone scopes |

{components}
### Site chrome (for reference only)

Supplied by the build tool; do not copy it into your main file.
- **Top strip** (`.topbar.on-ink`): "Based in Baton Rouge, Louisiana" and the tap-to-call number, as real text.
- **Header** (`.site-header`): crest and name, the menu (eight links), the phone number from 1280px, the
  theme button, "Get a quote". Sticky, solid paper. Below 1100px the menu is a full sheet with
  "Start your project", "Call (225) 255-0837" and the email.
- **Sticky phone bar** (`#mobile-cta`): "Call" beside "Free 30-min call · no pitch". Shows after the first
  screen, hides over the footer. Not on contact, legal or checkout pages.
- **Footer** (`.site-footer.on-ink`): the Baton Rouge skyline, four link columns, the legal line.
- `/start/` has the top strip, crest, theme button and one "Book a free call" button: no menu, on purpose.
- `404.html` has the top strip and the crest only. It loads no script.

Because the phone bar covers the bottom 70px of a phone screen once it shows, never pin your own
element to the bottom of the viewport.

## 9. The props rule

Objects are the point of this design, and too many of them turn it cute. Per page:

- **At most one tilted object** (`.tilt` on one card, print or receipt). Everything else sits straight.
- **At most one stamp**, counting the round seal.
- **No illustrated scene.** The street scene belongs to the home page; it may be reused small on
  `/start/` and on the 404 page (`scene-notfound`). No page draws a new scene.
- FAQ, privacy, terms and both checkout pages get **no props at all**: no stamp, no tilt, no seal, no scene.
- One "object" per section at most. A ticket, a receipt and a business card in one section is two too many.
- Nothing decorative may look pressable. No empty checkboxes, no fake buttons inside mocks, no blue on things that do nothing.

Art markers (leave them empty; the build tool fills them): `<!-- art:seal --><!-- /art:seal -->`,
`crest-card`, `scene-street`, `scene-notfound`, `scene-bench`. The crest, seal and scenes are generated by
`tools/art/emblems.py`; the footer skyline is inline SVG in the footer partial. Retired: the chess
pieces, the full crest and the drifting shards. Do not bring them back.

## 10. Motion

- Transform and opacity only. No animated colour, shadow, width or height.
- Everything plays once. Nothing loops for ever: the typing dots hop three times, a ring rings four times.
- `reveal` rises 12px and fades in over half a second, with at most 120ms of stagger across a row.
  It only applies when scripts run (`html.js`); without them everything is simply there.
- `.seq` with `style="--n:1"`, `--n:2`... inside a `.reveal` makes the parts of a mock arrive in order, 70ms apart. Keep to four steps.
- Things you press move: buttons lift 2px on hover and sink 1px on press. Hover effects go inside `@media (hover: hover)`.
- A page-only animation is allowed if it is one-shot, under 0.6s, uses the duration and easing tokens,
  and its end state is the resting state (`animation-fill-mode: both` with only a `from` or mid keyframe).
  `prefers-reduced-motion` already turns every animation and transition off site-wide.

## 11. Honest mocks and honest numbers

A mock is a drawing of the product, and has to read as one.

- The business is always **[your business]** or **Your Business**. Never a made-up company, never a person's name.
- Every vignette carries a `.flag` reading **Example**. A figure's caption ends with the service, its fixed
  price and "An illustration, not a real conversation." For example:
  *Missed-call text-back, $750 to set up. An illustration, not a real conversation.*
- Messages use everyday trade wording ("The kitchen sink is leaking under the cabinet."). No star ratings,
  no reviews, no testimonials, no client logos, no counts of clients or results.
- The only numbers allowed in mocks and worked examples are the ones already on the site: the example
  week (5 calls × 6 minutes and so on; 235 minutes, about 4 hours; about 200 hours a year) and the
  calculator defaults. `--show-new-numbers` on the checker lists anything new.
- Every time or money estimate keeps its qualifier right beside it, in a `.note` or the sentence itself:
  "example", "estimate", "not a guarantee". Never move the qualifier to a footnote.
- Every price is fixed and written in full. Never "from", "starting at", "as low as", a range or
  "ballpark". Every price that is on a page today stays on that page.
- The three real projects are Smilys Softwash, Risen Health and Corbel Books. Say what was built. Claim no result.
- FAQ answers, the privacy page and the terms page keep their wording exactly.
- Never write the words listed in BRIEF.md section 4 (the owner's customers react badly to them), in
  copy, alt text, class names, comments or file names.

## 12. Phone rules

Most visitors are on a phone. Design the 360 to 430px view first; it is not the desktop page shrunk.

- Body text is 17px. Nothing a customer must read is under 15px. Uppercase labels are 12px at the smallest.
- Primary buttons are 52 to 56px tall and full width (`.btn-row` does this). Every target is at least 44px.
- No sideways scrolling, and no sideways scrollers: no chip rows that slide. Lists wrap or stack.
- The first screen of a commercial page shows what it is, a price and one button.
- Tables with more than three columns stack into labelled entries (`.table-stack`, `.spec`).
- Keep pages short: cut before you shrink. The home page target is 12,500px at 390px wide.
- Test at 360, 390 and 820, and run `widths.js` for every 20px from 360 to 1920.

## 13. Accessibility

- One `<h1>`, no skipped levels, landmarks (`main`, `nav` with `aria-label`, `footer`).
- Every image has `alt`, `width` and `height`; below the first screen add `loading="lazy" decoding="async"`.
- Decorative drawings and mocks are `aria-hidden="true"`, or `role="img"` with an `aria-label` that says
  what they show. If a mock repeats what the text says, hide it; if it adds something, label it.
- Anything a person reads is real text in the page, never CSS `content`.
- Focus rings are built in (3px, at least 3:1 everywhere, gold on blue and on the footer). Never remove an outline.
- Contrast is AA in both themes when you use the tokens as described. Run `contrast.js` anyway.
- A table that changes layout on a phone keeps its `role` attributes, exactly as in the snippets.
- Links that open a new tab carry `rel="noopener"`. Internal links are root-absolute (`/pricing/`).
- The page must read correctly with scripts off: `details` for disclosure, real links, nothing hidden until a script shows it.

## 14. Do and do not (from the judges)

Do:
- Put the city, a tap-to-call number, a plain headline, one booking button and a price on the first phone screen.
- Show automation with one mock and a numbered legend rather than describing it.
- Use the spec table for packages and a real table for care plans.
- Give every long commercial page an "On this page" list with prices.
- State terms as short lists ("Cost: Free. Length: 30 minutes. Sales pitch: None.").
- Keep each section to one idea and one object. Say a thing once.

Do not:
- Let objects overlap text or each other (the phone over a title, a stamp on a phone, a pill on a sign).
- Stack four rounded cards with tick lists where a table would line the facts up.
- Tell the same story twice on one page (a timeline, then a table of the same steps).
- Tilt more than one thing, or use more than one stamp.
- Draw anything that looks tappable and is not.
- Leave a late card still faded when the reader reaches it (do not add your own stagger).
- Use type under 15px for anything but a label, or labels under 12px.
- Clip a row of chips at the screen edge.
- Add a breakpoint, a hex colour, an inline style or `!important`.
- Write like software: no "solutions", "leverage", "seamless", "unlock". Short sentences. Plain words.
'''
(R / 'DESIGN.md').write_text(doc)
print('DESIGN.md', len(doc), 'bytes,', doc.count('\n'), 'lines')
