const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const mobile of [false, true]) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile && w < 800, hasTouch: mobile }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    for (const [from, to] of [['#seo', '#google-reviews'], ['#website-design', '#google-reviews'], ['#care', '#google-reviews'], ['#seo', '#growth-consulting'], ['', '#google-reviews']]) {
      await p.goto('about:blank'); await p.goto('http://localhost:8720/services/' + from); await p.waitForTimeout(1500);
      await p.evaluate(t => { location.hash = t; }, to);
      const log = [];
      for (const t of [300, 700, 1500, 3000]) { await p.waitForTimeout(t === 300 ? 300 : t - (log.length ? [300, 700, 1500][log.length - 1] : 0)); log.push(await p.evaluate(tt => { const el = document.querySelector(tt); const f = el.closest('.reveal'); return `${getComputedStyle(f).opacity}${f.classList.contains('visible') ? 'v' : '-'}@y${Math.round(scrollY)} top${Math.round(f.getBoundingClientRect().top)}`; }, to)); }
      const last = log[log.length - 1];
      console.log(`${mobile ? 'mobile ' : 'desktop'} ${w} ${from || '(top)'} -> ${to}: ${log.join('  ')}${last.startsWith('1') ? '' : '   <<<<< STILL INVISIBLE after 3s'}`);
      if (!last.startsWith('1')) await p.screenshot({ path: `revealbug2-${w}-${mobile}-${from.slice(1)}.png` });
    }
    await ctx.close();
  }
  await b.close();
})();
