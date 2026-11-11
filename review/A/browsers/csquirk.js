const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await pw.webkit.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (let i = 0; i < 4; i++) { const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 675) { await p.evaluate(yy => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, yy); }, y); await p.waitForTimeout(150); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(900);
    const r = await p.evaluate(() => ['body', 'main', '#contact-form', '#package', '#name'].map(s => { const cs = getComputedStyle(document.querySelector(s)); return s + ' ' + cs.backgroundColor + ' ' + cs.fontFamily.split(',')[0] + ' ' + cs.color; }));
    const odd = r.some(x => /-webkit-standard|rgba\(0, 0, 0, 0\) -webkit/.test(x));
    if (odd) { await p.screenshot({ path: `view/csquirk_${i}.png` }); }
    console.log('run', i, odd ? 'ODD computed style -> screenshot saved' : 'normal', r.join(' | ').slice(0, 330));
    await p.close(); }
  await b.close();
})();
