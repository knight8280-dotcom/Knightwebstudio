// Real taps on the menu button: does the page keep its place? Also FAQ rows open/close by tap.
const pw = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright'); const engine = process.env.ENGINE || 'webkit';
(async () => {
  const b = await pw[engine].launch(); const o = { viewport: { width: 390, height: 844 }, hasTouch: true }; if (engine !== 'firefox') o.isMobile = true;
  const ctx = await b.newContext(o); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/'); await p.waitForTimeout(500);
  const Y = () => p.evaluate(() => Math.round(scrollY)); const tapToggle = async () => { const r = await p.evaluate(() => { const r = document.getElementById('nav-toggle').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); await p.touchscreen.tap(r[0], r[1]); await p.waitForTimeout(450); };
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 3000); }); await p.waitForTimeout(300);
  const seq = ['start ' + await Y()];
  await tapToggle(); seq.push('opened ' + await Y() + ' open=' + await p.evaluate(() => document.getElementById('nav').classList.contains('open') + ' active=' + (document.activeElement && (document.activeElement.textContent || '').trim().slice(0, 12))));
  await tapToggle(); seq.push('closed by tap ' + await Y());
  await tapToggle(); await p.keyboard.press('Escape'); await p.waitForTimeout(400); seq.push('reopened, closed by Escape ' + await Y() + ' active=' + await p.evaluate(() => document.activeElement && document.activeElement.id));
  await tapToggle(); await p.keyboard.press('Escape'); await p.waitForTimeout(400); seq.push('again ' + await Y());
  console.log(engine, 'menu:', seq.join(' | '));
  // keyboard: Tab from mid-page into the header (Shift+Tab until focus is in header)
  await p.evaluate(() => scrollTo(0, 3000)); await p.waitForTimeout(200); const y0 = await Y();
  await p.evaluate(() => document.querySelector('.brand').focus()); await p.waitForTimeout(300); console.log(engine, 'focus on header link while scrolled: scrollY', y0, '->', await Y());
  // FAQ rows
  await p.goto('http://localhost:8720/faq/'); await p.waitForTimeout(500);
  const rows = await p.evaluate(() => [...document.querySelectorAll('details.faq-item')].map(d => d.open));
  const res = [];
  for (const i of [1, 5, 13]) { const h = await p.evaluateHandle(i => document.querySelectorAll('details.faq-item')[i].querySelector('summary'), i); await h.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; s.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200);
    const bb = await h.boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(350);
    const a = await h.evaluate(s => [s.parentElement.open, Math.round(s.parentElement.getBoundingClientRect().height), Math.round(s.nextElementSibling.getBoundingClientRect().height)]);
    await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(350); const c = await h.evaluate(s => s.parentElement.open);
    res.push(`row ${i}: tap -> open=${a[0]} (row ${a[1]}px, answer ${a[2]}px), tap again -> open=${c}`); }
  console.log(engine, 'faq initial open rows:', rows.filter(Boolean).length, 'of', rows.length, '|', res.join(' | '));
  await b.close();
})();
