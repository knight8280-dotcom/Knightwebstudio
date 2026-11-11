const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  for (const [vw, vh, p] of [[1280, 600, '/'], [390, 844, '/'], [390, 844, '/start/'], [1920, 1080, '/']]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.waitForTimeout(300);
    await page.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += Math.round(innerHeight * 0.6)) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } window.scrollTo(0, H); await new Promise(r => setTimeout(r, 700)); });
    await page.waitForTimeout(3000);
    const left = await page.evaluate(() => [...document.querySelectorAll('.reveal .seq')].filter(e => getComputedStyle(e).opacity !== '1' && e.getBoundingClientRect().height > 0).map(e => { const cs = getComputedStyle(e); const rv = e.closest('.reveal'); return e.tagName.toLowerCase() + '.' + e.className + ' opacity=' + cs.opacity + ' anim=' + cs.animationName + ' parentReveal=' + rv.className + ' "' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) + '"'; }));
    console.log(`${vw}x${vh} ${p}: ${left.length} :: ${left.join(' || ')}`);
    await ctx.close();
  }
  await browser.close();
})();
