#!/usr/bin/env python3
"""Generate the four city pages' <main> files from the live (baseline) wording.

Every heading and sentence is lifted from the baseline HTML by this script, so the
words cannot drift; only the structure around them is new. Writes
$R/pages/city/web-design-<town>.main.html, then (unless --no-build) runs kws_page.py
for each page.

    python3 gen.py [--no-build] [--only gonzales]
"""
import pathlib, re, subprocess, sys

R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
TOWNS = {
    # slug: (town name, measured width of the name in em at the display face plus 3% air, the stamp on the in-person card)
    # Baton Rouge's card heading already begins "Meet in person", so its stamp says what the first paragraph says: home base.
    'baton-rouge': ('Baton Rouge', 6.05, 'Home<br>base'),
    'denham-springs': ('Denham Springs', 7.9, 'Meet in<br>person'),
    'gonzales': ('Gonzales', 4.3, 'Meet in<br>person'),
    'prairieville': ('Prairieville', 5.25, 'Meet in<br>person'),
}
# Never broken across two lines in a heading or a short line: the two-word town names, and one hyphenated word in a step title
TWO_WORD = r'(Baton Rouge|Denham Springs)'
HYPHENATED = r'(service-area)'
# The towns in the site footer's "Areas we serve" column, in its order
AREAS = ['Baton Rouge', 'Gonzales', 'Prairieville', 'Denham Springs', 'Zachary', 'Central', 'Baker']
PIN = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>'
EXT = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>'


def one(rx, text, flags=re.S):
    m = re.search(rx, text, flags)
    if not m:
        raise SystemExit(f'pattern not found: {rx[:80]}')
    return m.group(1) if m.groups() else m.group(0)


def tidy(s):
    return re.sub(r'\s+', ' ', s).strip()


def keep(s):
    """In a heading, a question or a short line: a two-word place name stays on one line.
    A non-breaking space, not a .nowrap span: a span would be its own flex item inside <summary>,
    and Chromium balances a heading badly around one ("Built for a / Baton Rouge service business")."""
    s = re.sub(TWO_WORD, lambda m: m.group(1).replace(' ', '&nbsp;'), s)
    return re.sub(HYPHENATED, r'<span class="nowrap">\1</span>', s)


def kicker(eyebrow, title, indent=8):
    """An eyebrow is kept only when it says something its title does not (handbook, section header).
    "Pricing" sits over "Fixed prices…" and "Questions" over "… questions, answered" on every page."""
    e, t = eyebrow.lower(), re.sub(r'<[^>]+>', '', title).lower()
    if e in t or e in ('pricing', 'questions'):
        return ''
    return f'<p class="eyebrow">{eyebrow}</p>\n' + ' ' * indent


def build(slug):
    town, em, stamp = TOWNS[slug]
    base = (R / 'baseline' / f'web-design-{slug}' / 'index.html').read_text()
    main = one(r'<main\b.*?</main>', base)

    eyebrow = tidy(one(r'<header class="page-head">\s*<p class="eyebrow">(.*?)</p>', main))
    h1 = tidy(one(r'<h1>(.*?)</h1>', main))
    lede = tidy(one(r'<h1>.*?</h1>\s*<p class="section-sub">(.*?)</p>', main))
    before, after = h1.split(town)
    assert eyebrow.endswith(f'{town}, LA'), eyebrow
    lead = eyebrow[:-len(town) - 4].rstrip()            # "Areas we serve ·"
    assert lead.endswith(' ·'), eyebrow
    # two phrases; if the line breaks, the second opens with the dot instead of the first trailing it
    eyebrow_html = f'<span><span class="nowrap">{lead[:-2]}</span> <span class="nowrap">· {town}, LA</span></span>'
    assert before.strip() and after.strip(), h1

    prose = [tidy(p) for p in re.findall(r'<p>(.*?)</p>', one(r'<div class="prose reveal">(.*?)</div>', main), re.S)]
    prose = [p.replace('<em>', '<strong>').replace('</em>', '</strong>') for p in prose]   # no italic face is loaded
    callout = one(r'<aside class="local-callout.*?</aside>', main)
    meet_label = one(r'aria-label="([^"]+)"', callout)
    meet_h = tidy(one(r'<h2 class="h3">(.*?)</h2>', callout))
    meet_p = tidy(one(r'</h2>\s*<p>(.*?)</p>', callout))

    needs_sec = one(r'<section class="section section-alt" id="what-we-build">.*?</section>', main)
    needs_eyebrow = tidy(one(r'<p class="eyebrow">(.*?)</p>', needs_sec))
    needs_h = tidy(one(r'<h2>(.*?)</h2>', needs_sec))
    needs = []
    for card in re.findall(r'<article class="card reveal">(.*?)</article>', needs_sec, re.S):
        needs.append((tidy(one(r'<h3>(.*?)</h3>', card)), tidy(one(r'</h3>\s*<p>(.*?)</p>', card)),
                      [tidy(x) for x in re.findall(r'<li>(.*?)</li>', card, re.S)]))
    assert len(needs) == 3

    work_sec = one(r'<section class="section" id="local-work">.*?</section>', main)
    work_eyebrow = tidy(one(r'<p class="eyebrow">(.*?)</p>', work_sec))
    work_h = tidy(one(r'<h2>(.*?)</h2>', work_sec))
    work_sub = tidy(one(r'<p class="section-sub">(.*?)</p>', work_sec))
    work_alt = tidy(one(r'alt="([^"]+)"', work_sec))
    work_tag = tidy(one(r'<p class="work-tag">(.*?)</p>', work_sec))
    work_name = tidy(one(r'<h3>(.*?)</h3>', work_sec))
    work_p = tidy(one(r'</h3>\s*<p>(.*?)</p>', work_sec))
    work_result = tidy(one(r'<p class="work-result">(.*?)</p>', work_sec))
    work_more = tidy(one(r'<a class="more-link" href="/work/">(.*?)<svg', work_sec))
    assert tidy(one(r'<a class="work-link"[^>]*>(.*?)<svg', work_sec)) == 'Visit smilyssoftwash.com'

    price_sec = one(r'<section class="section section-alt" id="pricing">.*?</section>', main)
    price_eyebrow = tidy(one(r'<p class="eyebrow">(.*?)</p>', price_sec))
    price_h = tidy(one(r'<h2>(.*?)</h2>', price_sec))
    price_sub = tidy(one(r'<p class="section-sub">(.*?)</p>', price_sec))
    care = 'Care plans keep it running afterwards for $125, $300, $600 or $1,000 a month.'
    assert price_sub.endswith(care), price_sub
    price_claim = price_sub[:-len(care)].strip()
    care_dt, care_dd = 'Care plans keep it running afterwards for', '$125, $300, $600 or $1,000 a month.'
    tiers = re.findall(r'<a class="mini-price reveal" href="(.*?)">\s*<span class="mini-price-name">(.*?)</span>\s*<span class="mini-price-amt">(.*?)</span>\s*'
                       r'<span class="mini-price-plan">(.*?)</span>\s*<span class="mini-price-note">(.*?)</span>', price_sec, re.S)
    assert len(tiers) == 4
    price_foot = tidy(one(r'<p class="pricing-foot reveal">(.*?)</p>', price_sec))
    price_more = tidy(one(r'<a class="more-link" href="/pricing/">(.*?)<svg', price_sec))

    q_sec = one(r'<section class="section" id="questions">.*?</section>', main)
    q_eyebrow = tidy(one(r'<p class="eyebrow">(.*?)</p>', q_sec))
    q_h = tidy(one(r'<h2>(.*?)</h2>', q_sec))
    faqs = re.findall(r'<summary>(.*?)</summary>\s*<div class="faq-body">(.*?)</div>', q_sec, re.S)
    assert len(faqs) == 3
    reply = tidy(one(r'<div class="local-cta reveal">\s*<p>(.*?)</p>', q_sec))
    assert 'Send an enquiry' in q_sec and 'Book a free 30-minute call' in q_sec

    band = one(r'<section class="cta-band">.*?</section>', main)
    band_h = tidy(one(r'<h2>(.*?)</h2>', band))
    band_p = tidy(one(r'</h2>\s*<p>(.*?)</p>', band))
    band_btn = tidy(one(r'<a class="btn btn-light"[^>]*>(.*?)</a>', band))

    def nb(s):   # keep "7–10 days", "I-10" and the like on one line
        return re.sub(r'(\d+–\d+ (?:days|weeks)|\bI-\d+)', r'<span class="nowrap">\1</span>', s)

    areas = ''.join(f'<li aria-current="location">{PIN}{a}</li>' if a == town else f'<li>{a}</li>' for a in AREAS)
    needs_html = '\n'.join(f'''        <li class="reveal">
          <span class="steps-no" aria-hidden="true">{i:02d}</span>
          <div>
            <h3>{keep(h)}</h3>
            <p>{nb(p)}</p>
            <ul class="ticks">
{chr(10).join(f"              <li>{nb(t)}</li>" for t in ticks)}
            </ul>
          </div>
        </li>''' for i, (h, p, ticks) in enumerate(needs, 1))
    tiers_html = '\n'.join(f'''          <li><a class="tier" href="{href}">
            <span class="tier-name">{name}</span>
            <span class="tier-amt">{amt}</span>
            <span class="tier-plan">{plan}</span>
            <span class="tier-note">{nb(tidy(note))}</span>
          </a></li>''' for href, name, amt, plan, note in tiers)
    faq_html = '\n'.join(f'''        <details class="faq-item">
          <summary>{keep(tidy(q))}</summary>
          <div class="faq-body">{nb(tidy(a))}</div>
        </details>''' for q, a in faqs)

    head_html = f'''  <!-- ===================== PAGE HEAD (commercial form): the town's name is the picture ===================== -->
  <section class="page-head">
    <div class="container">
      <p class="eyebrow">{eyebrow_html}</p>
      <h1 class="city-title" style="--em:{em}"><span>{before.strip()}</span> <span class="city-name"><span class="mark">{town}</span></span> <span>{after.strip()}</span></h1>
      <p class="lede">{nb(lede)}</p>
      <div class="btn-row">
        <a class="btn btn-primary btn-lg" href="/contact/" data-booking>Book a free 30-minute call</a>
        <a class="btn btn-lg" href="/contact/">Send an enquiry</a>
      </div>
      <a class="price-strip" href="#pricing">
        <span class="price-strip-label">Websites</span>
        <span class="price-strip-nums"><b>$1,000</b><b>$2,000</b><b>$4,000</b><b>$8,000</b></span>
        <span class="price-strip-note">Fixed, published prices</span>
      </a>
    </div>
  </section>'''

    intro_html = f'''  <!-- ===================== WHY LOCAL, AND MEETING IN PERSON ===================== -->
  <section class="section section-first" id="intro">
    <div class="container split split-even">
      <div class="prose">
        <p>{nb(prose[0])}</p>
        <p>{nb(prose[1])}</p>
      </div>
      <aside class="card stack city-meet" aria-label="{meet_label}">
        <h2 class="h3">{keep(meet_h)}</h2>
        <p>{meet_p}</p>
        <ul class="pills" aria-label="Towns where we meet in person">{areas}</ul>
        <p class="stamp" aria-hidden="true">{stamp}</p>
      </aside>
    </div>
  </section>'''

    pricing_html = f'''  <!-- ===================== FIXED PRICES, UP FRONT: the price board ===================== -->
  <section class="section section-sand" id="pricing">
    <div class="container">
      <div class="board on-blue">
        <header class="board-head">
          <div>
            {kicker(price_eyebrow, price_h, 12)}<h2>{keep(price_h)}</h2>
            <p class="section-sub">{keep(price_claim)}</p>
          </div>
        </header>
        <ul class="board-tiers">
{tiers_html}
        </ul>
        <dl class="board-extras">
          <div><dt>{care_dt}</dt> <dd>{care_dd}</dd></div>
        </dl>
        <div class="board-foot split split-even">
          <div class="prose"><p class="fine">{price_foot}</p></div>
          <div><a class="btn btn-primary" href="/pricing/">{price_more}</a></div>
        </div>
      </div>
    </div>
  </section>'''

    needs_sec_html = f'''  <!-- ===================== THREE THINGS A LOCAL SITE NEEDS TO DO: a ruled, numbered list ===================== -->
  <section class="section" id="what-we-build">
    <div class="container split split-even split-sticky">
      <header class="section-head">
        {kicker(needs_eyebrow, needs_h)}<h2>{keep(needs_h)}</h2>
      </header>
      <ol class="steps">
{needs_html}
      </ol>
    </div>
  </section>'''

    work_html = f'''  <!-- ===================== LOCAL WORK: the one local project, as a print beside its write-up ===================== -->
  <section class="section section-sand" id="local-work">
    <div class="container">
      <header class="section-head">
        {kicker(work_eyebrow, work_h)}<h2>{keep(work_h)}</h2>
        <p class="section-sub">{work_sub}</p>
      </header>
      <article class="split split-even">
        <a class="print reveal" href="https://smilyssoftwash.com" target="_blank" rel="noopener">
          <div class="print-img"><img src="/assets/img/work-smilyssoftwash.jpg" alt="{work_alt}" width="1200" height="600" loading="lazy" decoding="async"></div>
          <div class="print-cap">
            <div class="print-name"><h3>{work_name}</h3>{EXT}</div>
            <p class="print-kind">{work_tag}</p>
          </div>
        </a>
        <div class="case-copy reveal">
          <p>{work_p}</p>
          <dl class="case-facts">
            <div><dt>Status</dt><dd>{work_result}</dd></div>
            <div><dt>Visit</dt><dd><a href="https://smilyssoftwash.com" target="_blank" rel="noopener">smilyssoftwash.com</a></dd></div>
          </dl>
          <p><a class="more-link" href="/work/">{work_more}{ARROW}</a></p>
        </div>
      </article>
    </div>
  </section>'''

    questions_html = f'''  <!-- ===================== LOCAL QUESTIONS: a short band; its title is set at the title size, its list on the line the columns above share ===================== -->
  <section class="section section-tight" id="questions">
    <div class="container split split-even">
      <header class="section-head">
        {kicker(q_eyebrow, q_h)}<h2 class="title">{keep(q_h).replace(', answered', ',&nbsp;answered')}</h2>
      </header>
      <div class="faq">
{faq_html}
      </div>
    </div>
  </section>'''

    band_html = f'''  <!-- ===================== CLOSING BAND ===================== -->
  <section class="cta-band on-blue">
    <div class="container cta-inner">
      <div class="cta-copy">
        <h2>{keep(band_h)}</h2>
        <p>{band_p}</p>
        <div class="btn-row">
          <a class="btn btn-primary btn-lg" href="/contact/" data-booking>{band_btn}</a>
          <a class="btn btn-lg" href="/contact/">Send an enquiry</a>
        </div>
        <p class="fine">{keep(reply)}</p>
      </div>
      <div class="appt on-paper wide-only" aria-hidden="true">
        <p class="appt-head"><span>Appointment card</span><span>No. 01</span></p>
        <p class="appt-title">Discovery call</p>
        <dl class="appt-lines">
          <div><dt>Cost</dt><dd>Free</dd></div>
          <div><dt>Length</dt><dd>30 minutes</dd></div>
          <div><dt>Sales pitch</dt><dd>None</dd></div>
          <div><dt>Where</dt><dd>A call, or in person</dd></div>
        </dl>
      </div>
    </div>
  </section>'''

    order = [head_html, intro_html, pricing_html, needs_sec_html, work_html, questions_html, band_html]
    return '<main id="main">\n\n' + '\n\n'.join(order) + '\n\n</main>\n'


only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
rc = 0
for slug in TOWNS:
    if only and only != slug:
        continue
    dest = R / 'pages' / 'city' / f'web-design-{slug}.main.html'
    dest.write_text(build(slug))
    print('wrote', dest)
    if '--no-build' not in sys.argv:
        r = subprocess.run([sys.executable, str(R / 'tools' / 'kws_page.py'), f'web-design-{slug}/index.html', '--main', str(dest)], capture_output=True, text=True)
        print(r.stdout.rstrip()); print(r.stderr.rstrip()) if r.stderr.strip() else None
        rc = rc or r.returncode
sys.exit(rc)
