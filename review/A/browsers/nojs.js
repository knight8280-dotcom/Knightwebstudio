const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const eng of ['webkit', 'firefox']) { const b = await pw[eng].launch(); const o = { viewport: { width: 390, height: 844 }, hasTouch: true, javaScriptEnabled: false }; if (eng === 'webkit') o.isMobile = true;
    const ctx = await b.newContext(o); const out = [];
    for (const path of ['/', '/consulting/', '/pricing/', '/contact/', '/faq/', '/checkout/']) { const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.waitForTimeout(700);
      if (path === '/' && eng === 'webkit') await p.screenshot({ path: 'view/nojs_webkit_home.png' });
      const loc = p.locator('html'); // evaluate is unavailable with JS off in some engines; use element state via locators
      const navVisible = await p.locator('#nav a').first().isVisible(); const toggleVisible = await p.locator('#nav-toggle').isVisible().catch(() => false); const themeVisible = await p.locator('#theme-toggle').isVisible().catch(() => false);
      const ctaVisible = await p.locator('#mobile-cta').isVisible().catch(() => false); const h1 = await p.locator('h1').first().isVisible();
      out.push(`${path} nav links shown=${navVisible} burger=${toggleVisible} theme btn=${themeVisible} phone bar=${ctaVisible} h1=${h1}`); await p.close(); }
    console.log(eng, 'JS off:\n   ' + out.join('\n   ')); await b.close(); }
  // landscape phone
  const b = await pw.webkit.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/'); await p.waitForTimeout(500); await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 1400); }); await p.waitForTimeout(900);
  await p.screenshot({ path: 'view/landscape_pricing.png' });
  console.log('landscape 844x390:', JSON.stringify(await p.evaluate(() => { const h = document.getElementById('site-header').getBoundingClientRect(), c = document.getElementById('mobile-cta').getBoundingClientRect(); return { header: Math.round(h.height), bar: Math.round(c.height), barShown: document.getElementById('mobile-cta').classList.contains('show'), freeHeight: Math.round(c.top - h.bottom), viewport: innerHeight }; })));
  await b.close();
})();
