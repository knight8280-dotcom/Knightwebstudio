const { chromium } = require('playwright');
const BASE = 'http://localhost:8720', OUT = __dirname + '/misc/';
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[390, 844], [390, 664], [375, 667], [375, 553], [360, 740], [360, 640], [360, 560], [820, 1100], [1024, 600]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', isMobile: w < 800, hasTouch: w < 800 });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|calendly\.com|js\.stripe\.com|onrender\.com|hcaptcha/, r => r.abort());
    const page = await ctx.newPage(); await page.goto(BASE + '/work/'); await page.waitForTimeout(300);
    await page.click('#nav-toggle'); await page.waitForTimeout(600);
    await page.screenshot({ path: OUT + `menu-${w}x${h}.png` });
    const r = await page.evaluate(() => { const n = document.getElementById('nav'); const cs = getComputedStyle(n); const items = [...n.querySelectorAll('a, button')].filter(a => a.getBoundingClientRect().height > 0).map(a => [a.textContent.trim().slice(0, 26), Math.round(a.getBoundingClientRect().top), Math.round(a.getBoundingClientRect().bottom)]); const beyond = items.filter(i => i[2] > innerHeight); return { navBox: [Math.round(n.getBoundingClientRect().top), Math.round(n.getBoundingClientRect().bottom)], overflowY: cs.overflowY, position: cs.position, scrollH: n.scrollHeight, clientH: n.clientHeight, vh: innerHeight, last: items[items.length - 1], beyond }; });
    // can we scroll the nav to reach the last item?
    const reach = await page.evaluate(() => { const n = document.getElementById('nav'); n.scrollTop = 99999; const items = [...n.querySelectorAll('a, button')].filter(a => a.getBoundingClientRect().height > 0); const l = items[items.length - 1].getBoundingClientRect(); return { scrollTop: n.scrollTop, lastBottomAfterScroll: Math.round(l.bottom), vh: innerHeight }; });
    console.log(`${w}x${h}`, JSON.stringify(r), JSON.stringify(reach));
    await ctx.close();
  }
  await browser.close();
})();
