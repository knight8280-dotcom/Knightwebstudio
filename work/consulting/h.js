const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const url of process.argv.slice(2)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(400);
    console.log(url, await p.evaluate(() => [document.documentElement.scrollHeight, Math.round(document.querySelector('main').getBoundingClientRect().height), Math.round((document.querySelector('.site-footer')||document.querySelector('footer')).getBoundingClientRect().height)]));
    await ctx.close();
  }
  await b.close();
})();
