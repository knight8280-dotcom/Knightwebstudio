const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  for (const blocked of [true, false]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (blocked) await ctx.route(/\.(jpg|jpeg|png|webp)(\?|$)/, r => r.abort());
    for (const [p, sel] of [['/start/', 'img[src*="work-smilys"]'], ['/', 'img[src*="work-smilys"]']]) {
      const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
      await page.evaluate(s => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 160); }, sel); await page.waitForTimeout(1200);
      const info = await page.evaluate(() => [...document.images].map(i => { const b = i.getBoundingClientRect(), cs = getComputedStyle(i); const par = i.parentElement, pb = par.getBoundingClientRect(); return i.getAttribute('src').split('/').pop() + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + ' css(h=' + cs.height + ' ar=' + cs.aspectRatio + ' disp=' + cs.display + ' fit=' + cs.objectFit + ') parent ' + par.tagName + '.' + par.className + ' ' + Math.round(pb.width) + 'x' + Math.round(pb.height); }));
      console.log((blocked ? 'BLOCKED ' : 'normal  ') + p, info.join(' || '));
      await page.screenshot({ path: `${__dirname}/shots/prints-${p.replace(/\W/g, '') || 'home'}-390-${blocked ? 'imagesblocked' : 'normal'}.png` });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
