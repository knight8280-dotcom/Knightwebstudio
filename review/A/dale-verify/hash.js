// CUST-06 fix check: does /contact/?package=audit#contact-form land with the chosen package in view?
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[390, 844], [360, 740], [1280, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', isMobile: w < 800, hasTouch: w < 800 });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const page = await ctx.newPage();
    for (const frag of ['', '#contact-form', '#contact']) {
      await page.goto('about:blank');
      await page.goto('http://localhost:8720/contact/?package=audit' + frag, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      const r = await page.evaluate(() => { const s = document.querySelector('#package'); const b = s.getBoundingClientRect(); return { scrollY: Math.round(scrollY), pkgTop: Math.round(b.top), pkgBottom: Math.round(b.bottom), inView: b.top >= 0 && b.bottom <= innerHeight, value: s.selectedOptions[0].text }; });
      console.log(`${w}x${h} ${frag || '(no fragment)'}:`, JSON.stringify(r));
      if (w === 390 && frag === '#contact-form') await page.screenshot({ path: __dirname + '/arrive_audit_with_fragment.png' });
    }
    await ctx.close();
  }
  await browser.close();
})();
