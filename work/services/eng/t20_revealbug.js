const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [360, 740], [390, 664], [412, 915], [430, 932], [375, 667], [820, 1180]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: true }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    for (const mode of ['deep link', 'menu tap']) {
      if (mode === 'deep link') await p.goto('http://localhost:8720/services/#google-reviews');
      else { await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400); await p.evaluate(() => document.querySelector('.menu a[href="#google-reviews"]').click()); }
      await p.waitForTimeout(3000);
      const r = await p.evaluate(() => { const t = document.getElementById('google-reviews'); const f = t.closest('.reveal'); const fr = f.getBoundingClientRect(); const tr = t.getBoundingClientRect(); return { faqClass: f.className, opacity: getComputedStyle(f).opacity, faqTop: Math.round(fr.top), faqBottom: Math.round(fr.bottom), faqH: Math.round(fr.height), rowTop: Math.round(tr.top), vh: innerHeight, scrollY: Math.round(scrollY), maxY: document.documentElement.scrollHeight - innerHeight, js: document.documentElement.className }; });
      console.log(`${w}x${h} ${mode}:`, JSON.stringify(r), r.opacity !== '1' ? '  <<<<< ROW INVISIBLE' : '');
      if (r.opacity !== '1') { await p.screenshot({ path: `revealbug-${w}-${mode.replace(' ', '')}.png` }); await p.waitForTimeout(3000); console.log('   3s later opacity', await p.evaluate(() => getComputedStyle(document.getElementById('google-reviews').closest('.reveal')).opacity)); }
    }
    await ctx.close();
  }
  await b.close();
})();
