#!/usr/bin/env python3
"""Integration proof: copies of three real pages with the kit's partials and bands swapped in, written to
kit/closing/test/ (never into the repository). They load the real stylesheet and a copy of the real main.js with one line changed
(the phone bar also hides over .kws-close; see patch_main), so the year, the booking buttons, the phone bar and the theme button are the site's own.

  pricing-with-kit.html   closing band (appointment card) + footer.inc
  start-with-kit.html     closing band (appointment card) + footer-start.inc
  notfound-with-kit.html  footer-bare.inc, no script at all
"""
import pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
KIT = HERE.parent / 'kit' / 'closing'
REPO = pathlib.Path('/home/user/Knightwebstudio')
OUT = KIT / 'test'
OUT.mkdir(exist_ok=True)

def partial(name):
    t = (KIT / f'{name}.inc').read_text()
    return t.replace('{{skyline}}\n', (KIT / 'skyline.inc').read_text()).rstrip('\n')

LINKS = '''<link rel="stylesheet" href="/kit/light/motion.css">
<link rel="stylesheet" href="/kit/light/shader.css">
<link rel="stylesheet" href="/kit/closing/btn.css">
<link rel="stylesheet" href="/kit/closing/closing.css">
<link rel="stylesheet" href="/kit/closing/appt.css">
<link rel="stylesheet" href="/kit/closing/footer.css">
<link rel="stylesheet" href="/kit/closing/skyline.css">
<style>/* stands in for removing the two shared rules the kit retires (NOTES.md) */ main { padding-bottom: 0; }</style>
<meta name="robots" content="noindex">
</head>'''

BAND = '''<section class="kws-close kws-close--card on-blue kws-shader-host" aria-labelledby="close-title">
    <div class="kws-shader" data-kws="shader" data-shader="band" aria-hidden="true"></div>
    <div class="kws-close-in reveal">
      <div class="kws-close-copy">
        <h2 class="kws-close-title" id="close-title">%(title)s</h2>
        <p class="kws-close-text">%(text)s</p>
      </div>
      <div class="kws-appt on-paper">
        <p class="kws-appt-head"><span>Appointment card</span><span>No. 01</span></p>
        <p class="kws-appt-title">Discovery call</p>
        <dl>
          <div><dt>Cost</dt><dd>Free</dd></div>
          <div><dt>Length</dt><dd>30 minutes</dd></div>
          <div><dt>Sales pitch</dt><dd>None</dd></div>
          <div><dt>Where</dt><dd>A call, or in person</dd></div>
        </dl>
        <a class="kws-btn kws-btn--main" href="/contact/" data-booking>Book a free 30-minute call</a>
      </div>
      <div class="kws-close-acts">
        <a class="kws-btn" href="/contact/">Send an enquiry</a>
      </div>
      <p class="kws-close-tel">Or call <a href="tel:+12252550837">(225) 255-0837</a></p>
    </div>
  </section>'''

MAIN = '<script src="/assets/js/main.js" defer></script>'

def patch_main():
    """A copy of the repository's main.js with the phone bar taught about the new band: the one change integration needs."""
    js = (REPO / 'assets/js/main.js').read_text()
    a, b = "document.querySelector('.cta-band')", "document.querySelector('.cta-band, .kws-close')"
    assert js.count(a) == 1, 'main.js: the phone bar hook has moved'
    (OUT / 'main.patched.js').write_text(js.replace(a, b))
    print('built test/main.patched.js from the repository main.js (1 line changed)')

def build(src, dest, footer, band=None, shader=True):
    t = (REPO / src).read_text()
    crest = re.search(r'<!-- art:crest-footer -->.*?<!-- /art:crest-footer -->', t, re.S)
    f = partial(footer)
    if crest:
        f = f.replace('<!-- art:crest-footer --><!-- /art:crest-footer -->', crest.group(0))
    t, n = re.subn(r'<!-- =+ FOOTER =+ -->\s*<footer class="site-footer.*?</footer>', lambda m: f, t, flags=re.S)
    assert n == 1, (src, 'footer', n)
    if band:
        t, n = re.subn(r'<section class="cta-band.*?</section>', lambda m: BAND % band, t, flags=re.S)
        assert n == 1, (src, 'band', n)
    t = t.replace('</head>', LINKS, 1)
    if shader and MAIN in t:
        # the page runs the real main.js with the one-line change NOTES.md section 6 asks for (see patch_main below)
        t = t.replace(MAIN, '<script src="/kit/closing/test/main.patched.js" defer></script>\n<script src="/kit/light/motion.js" defer></script>\n<script src="/kit/light/shader.js" defer></script>')
    (OUT / dest).write_text(t)
    print('built test/' + dest, len(t.encode()), 'bytes')

patch_main()
build('pricing/index.html', 'pricing-with-kit.html', 'footer',
      dict(title='Still deciding? Book the free call.', text="You'll get a clear view of what your website and your systems need, and what it should cost — even if you do it yourself."))
build('start/index.html', 'start-with-kit.html', 'footer-start',
      dict(title='Tell us about your business.', text='You leave with a plan for your website and your systems, and the fixed price for it, whether or not you hire us.'))
build('404.html', 'notfound-with-kit.html', 'footer-bare', shader=False)
