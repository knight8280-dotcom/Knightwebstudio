// Second-column left edges down the page, and page heights.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [980, 1100, 1280, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.waitForTimeout(700);
    const r = await p.evaluate(() => { const x = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().left) : null; };
      return { heroArt: x('.hero-art'), servicesIntro: x('#services .section-sub'), ticks: x('.offer .ticks'), storyArt: x('.stop-art'), sumText: x('.stop-sum > p:not(.bigfig-num)'), workIntro: x('#work .section-sub'), ticket: x('.ticket'), card: x('.bizcard') }; });
    console.log(w, JSON.stringify(r)); await ctx.close();
  }
  for (const w of [360, 375, 390, 412, 430, 600, 768, 820, 1024, 1280, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, isMobile: w < 700 }); const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.waitForTimeout(500);
    process.stdout.write(w + ': ' + await p.evaluate(() => document.documentElement.scrollHeight) + '   '); await ctx.close();
  }
  console.log(); await b.close();
})();
