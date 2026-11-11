const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/work/', '/process/']) for (const w of [390, 820, 1024, 1280, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => [...document.querySelectorAll('main p:not(.eyebrow):not(.stamp):not(.ticket-head):not([class^="appt"]), main .ticks li')].filter(e => e.offsetParent && !e.closest('[aria-hidden=true]')).map(e => { const rg = document.createRange(); rg.selectNodeContents(e); const lines = new Set([...rg.getClientRects()].map(r => Math.round(r.top))).size; const chars = e.textContent.trim().length; return { t: e.textContent.trim().slice(0, 22), lines, cpl: Math.round(chars / Math.max(1, lines - .4)), w: Math.round(e.getBoundingClientRect().width) }; }).filter(x => x.lines >= 2));
    console.log(path, w, r.map(x => `${x.cpl}cpl/${x.lines}l/${x.w}px "${x.t}"`).join(' | ').slice(0, 900));
    await ctx.close();
  }
  await b.close();
})();
