// Candidate fix for the focus jump: take the header offset off the scroller and put it on what gets scrolled to.
const pw = require('/opt/node-tools/node_modules/playwright'); const engine = process.env.ENGINE || 'webkit';
const FIX = 'html{scroll-padding-top:0} main [id], main :is(a,button,input,select,textarea,summary){scroll-margin-top:calc(var(--header-h) + var(--s-5))} [data-page="services"] .faq-body{scroll-margin-top:calc(var(--header-h) + var(--s-5) + var(--s-9))}';
(async () => {
  const b = await pw[engine].launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/'); await p.addStyleTag({ content: FIX }); await p.waitForTimeout(500);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('main a, main button').focus({ preventScroll: true }); scrollTo(0, 2500); }); await p.waitForTimeout(200);
  await p.keyboard.press(engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'); await p.waitForTimeout(500);
  const jump = await p.evaluate(() => Math.round(scrollY) - 2500 + ' (focus in header: ' + !!document.activeElement.closest('.site-header') + ')');
  const res = [];
  for (const h of ['#packages', '#payment', '#addons', '#consulting', '#care']) { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150); await p.evaluate(h => document.querySelector('main a[href="' + h + '"]').click(), h); await p.waitForTimeout(400);
    res.push(await p.evaluate(h => { const t = document.getElementById(h.slice(1)); const hb = document.getElementById('site-header').getBoundingClientRect().bottom; return h + ':' + Math.round(t.getBoundingClientRect().top - hb); }, h)); }
  // keyboard focus on a field that sits under the header: Tab forward from above
  await p.goto('http://localhost:8720/contact/'); await p.addStyleTag({ content: FIX }); await p.waitForTimeout(400);
  await p.click('#submit-btn'); await p.waitForTimeout(600);
  const field = await p.evaluate(() => { const hb = document.getElementById('site-header').getBoundingClientRect().bottom; const r = document.activeElement.getBoundingClientRect(); return document.activeElement.id + ' top minus header bottom: ' + Math.round(r.top - hb); });
  await p.goto('http://localhost:8720/services/#seo'); await p.addStyleTag({ content: FIX }); await p.waitForTimeout(300); await p.evaluate(() => { location.hash = ''; location.hash = '#seo'; }); await p.waitForTimeout(900);
  const seo = await p.evaluate(() => Math.round(document.getElementById('seo').getBoundingClientRect().top - document.getElementById('site-header').getBoundingClientRect().bottom));
  console.log(engine, '| page moved on Shift+Tab into header:', jump, '| anchors (px under header):', res.join(' '), '| first invalid field after empty submit:', field, '| /services/#seo:', seo);
  await b.close();
})();
