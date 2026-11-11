const pw = require('/opt/node-tools/node_modules/playwright'); const engine = process.env.ENGINE || 'webkit'; const base = process.env.BASE || 'http://localhost:8720';
(async () => {
  const b = await pw[engine].launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(base + '/pricing/'); await p.waitForTimeout(500);
  // Put focus on the first focusable thing in <main>, scroll the page well down, then Shift+Tab back into the header like a keyboard user
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const first = document.querySelector('main a, main button'); first.focus({ preventScroll: true }); scrollTo(0, 2500); });
  await p.waitForTimeout(200); const y0 = await p.evaluate(() => Math.round(scrollY));
  await p.keyboard.press(engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ y: Math.round(scrollY), active: document.activeElement.tagName + '.' + document.activeElement.className + ' "' + document.activeElement.textContent.trim().slice(0, 20) + '"', inHeader: !!document.activeElement.closest('.site-header'), sp: getComputedStyle(document.documentElement).scrollPaddingTop }));
  console.log(engine, base.slice(-4), 'scroll-padding-top', r.sp, '| scrolled to', y0, '| Shift+Tab ->', r.active, 'in header:', r.inHeader, '| scrollY now', r.y, '| page moved', r.y - y0, 'px');
  await b.close();
})();
