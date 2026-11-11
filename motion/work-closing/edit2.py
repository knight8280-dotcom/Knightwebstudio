"""Rename the scene to its own component (kws-skyline) and the card to kws-appt, in the partials and the demo source."""
import pathlib
W = pathlib.Path(__file__).resolve().parent
K = W.parent / 'kit' / 'closing'

def sub(path, pairs):
    s = path.read_text()
    for a, b in pairs:
        if a not in s:
            print('MISSING in', path.name, ':', a[:70])
        s = s.replace(a, b)
    path.write_text(s)

scene = [
    ('class="kws-foot-scene"', 'class="kws-skyline"'),
    ('class="kws-foot-sky kws-shader-host"', 'class="kws-skyline-sky kws-shader-host"'),
]
sub(K / 'footer.inc', scene + [('<p class="kws-foot-mark">', '<p class="kws-skyline-name">'),
    ('<!-- Styles: the kit\'s footer.css. It keeps class site-footer because main.js looks for it (the phone bar hides over the footer). -->',
     '<!-- Styles: the kit\'s footer.css and skyline.css. It keeps class site-footer because main.js looks for it (the phone bar hides over the footer). -->')])
sub(K / 'footer-start.inc', scene + [('Styles: the kit\'s footer.css.', 'Styles: the kit\'s footer.css and skyline.css.')])
sub(K / 'footer-bare.inc', [('class="kws-foot-scene"', 'class="kws-skyline"'), ('<div class="kws-foot-sky"></div>', '<div class="kws-skyline-sky"></div>'),
    ('Styles: the kit\'s footer.css.', 'Styles: the kit\'s footer.css and skyline.css.')])
sub(K / 'skyline.inc', [('(.kws-foot-lit)', '(.kws-skyline-lit)'), ('class="kws-foot-skyline"', 'class="kws-skyline-art"'), ('class="kws-foot-lit"', 'class="kws-skyline-lit"')])

old_card = '''      <div class="kws-close-card on-paper">
        <p><span>Appointment card</span><span>No. 01</span></p>
        <b>Discovery call</b>
        <dl>
          <div><dt>Cost</dt><dd>Free</dd></div>
          <div><dt>Length</dt><dd>30 minutes</dd></div>
          <div><dt>Sales pitch</dt><dd>None</dd></div>
          <div><dt>Where</dt><dd>A call, or in person</dd></div>
        </dl>
        <a class="kws-close-btn kws-close-btn--main" href="/contact/" data-booking>Book a free 30-minute call</a>
      </div>'''
new_card = '''      <div class="kws-appt on-paper">
        <p class="kws-appt-head"><span>Appointment card</span><span>No. 01</span></p>
        <p class="kws-appt-title">Discovery call</p>
        <dl>
          <div><dt>Cost</dt><dd>Free</dd></div>
          <div><dt>Length</dt><dd>30 minutes</dd></div>
          <div><dt>Sales pitch</dt><dd>None</dd></div>
          <div><dt>Where</dt><dd>A call, or in person</dd></div>
        </dl>
        <a class="kws-appt-btn" href="/contact/" data-booking>Book a free 30-minute call</a>
      </div>'''
sub(W / 'demo.src.html', [
    (old_card, new_card),
    ('<link rel="stylesheet" href="closing.css">\n<link rel="stylesheet" href="footer.css">',
     '<link rel="stylesheet" href="closing.css">\n<link rel="stylesheet" href="appt.css">\n<link rel="stylesheet" href="footer.css">\n<link rel="stylesheet" href="skyline.css">'),
    ('.demo-client .kws-close-card {', '.demo-client .kws-appt {'),
])
print('done')
