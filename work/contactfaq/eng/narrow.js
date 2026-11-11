const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/', '/pricing/']) { const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); const out = [];
    for (let w = 350; w >= 250; w -= 10) { await p.setViewportSize({ width: w, height: 700 }); await p.waitForTimeout(60); const r = await p.evaluate(() => { let worst = 0, who = ''; for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || el.closest('.sr-only,.hp') || el.ownerSVGElement) continue; const rc = el.getBoundingClientRect(); if (rc.width && rc.right - innerWidth > worst) { worst = rc.right - innerWidth; who = el.tagName.toLowerCase() + '.' + el.className.toString().slice(0, 24); } } return { over: document.documentElement.scrollWidth - innerWidth, worst: Math.round(worst), who }; }); out.push(`${w}:${r.over}/${r.worst}${r.who ? '(' + r.who + ')' : ''}`); }
    console.log(path, out.join('  ')); await ctx.close(); }
  await b.close();
})();
