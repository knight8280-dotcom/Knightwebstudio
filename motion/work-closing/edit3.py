"""Opening hours in the footer contact block; the appointment card by itself in the demo."""
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

sub(K / 'footer.inc', [(
    '          <li><a class="kws-foot-tel" href="tel:+12252550837">(225) 255-0837</a></li>\n',
    '          <li><a class="kws-foot-tel" href="tel:+12252550837">(225) 255-0837</a></li>\n          <li><span>Mon–Fri, 9am–6pm Central Time</span></li>\n')])
sub(W / 'portable.src.html', [(
    '          <li><a class="kws-foot-tel" href="#close-h">[your number]</a></li>\n',
    '          <li><a class="kws-foot-tel" href="#close-h">[your number]</a></li>\n          <li><span>[Opening hours]</span></li>\n')])

alone = '''  <!-- ===================== 2b. THE CARD BY ITSELF ===================== -->
  <section class="section">
    <div class="container split split-even">
      <div class="stack">
        <p class="demo-tag"><b>The appointment card by itself</b> It is its own small file, so it can sit on paper too: beside the contact form, say.</p>
        <h2>Rather talk it through first?</h2>
        <p class="lede">Skip the form and pick a time, or call <a href="tel:+12252550837">(225) 255-0837</a>. Mon–Fri, 9am–6pm Central Time.</p>
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
        <a class="kws-appt-btn" href="/contact/" data-booking>Book a free 30-minute call</a>
      </div>
    </div>
  </section>

  <!-- ===================== 3. THE SLIM FOOTERS ===================== -->
  <section class="section section-sand">'''
sub(W / 'demo.src.html', [
    ('  <!-- ===================== 3. THE SLIM FOOTERS ===================== -->\n  <section class="section">', alone),
    ('  <!-- ===================== 4. ANOTHER BRAND ===================== -->\n  <section class="section section-sand">', '  <!-- ===================== 4. ANOTHER BRAND ===================== -->\n  <section class="section">'),
    ('  <!-- ===================== 5. THE STATEMENT, as it would close the home page, then the footer itself ===================== -->\n  <section class="section">',
     '  <!-- ===================== 5. THE STATEMENT, as it would close the home page, then the footer itself ===================== -->\n  <section class="section section-sand">'),
])
print('done')
