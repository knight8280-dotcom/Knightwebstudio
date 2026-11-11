const { chromium } = require('playwright');
const BASE = 'http://localhost:8720', OUT = __dirname + '/misc/';
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[390, 664], [375, 553], [360, 640], [360, 740], [1024, 600]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', isMobile: w < 800, hasTouch: w < 800 });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|calendly\.com|js\.stripe\.com|onrender\.com|hcaptcha/, r => r.abort());
    const page = await ctx.newPage(); await page.goto(BASE + '/work/'); await page.waitForTimeout(300);
    await page.click('#nav-toggle'); await page.waitForTimeout(600);
    const r = await page.evaluate(() => { const n = document.querySelector('.nav-inner'); const cs = getComputedStyle(n); const before = { box: [Math.round(n.getBoundingClientRect().top), Math.round(n.getBoundingClientRect().bottom)], overflowY: cs.overflowY, scrollH: n.scrollHeight, clientH: n.clientHeight }; n.scrollTop = 99999; const items = [...n.querySelectorAll('a, button')].filter(a => a.getBoundingClientRect().height > 0); const l = items[items.length - 1].getBoundingClientRect(); return { ...before, scrollTopAfter: n.scrollTop, lastBottomAfterScroll: Math.round(l.bottom), vh: innerHeight }; });
    await page.screenshot({ path: OUT + `menu-scrolled-${w}x${h}.png` });
    console.log(`${w}x${h}`, JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();
