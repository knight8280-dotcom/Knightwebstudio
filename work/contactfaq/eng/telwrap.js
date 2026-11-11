const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 980, height: 800 }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/faq/', { waitUntil: 'load' }); const out = [];
  for (let w = 980; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(40); const n = await p.evaluate(() => document.querySelector('.faq-rail .fine a[href^="tel"]').getClientRects().length); if (n > 1) out.push(w); }
  console.log('FAQ rail: phone number link breaks across two lines at widths:', out.length ? out[0] + '..' + out[out.length - 1] + ' (' + out.length + ' steps of 10)' : 'never', out.join(','));
  // toc wrap at any width
  const wrap = []; for (let w = 360; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(30); const r = await p.evaluate(() => [...document.querySelectorAll('.toc .toc-name')].some(s => s.getClientRects().length > 1)); if (r) wrap.push(w); }
  console.log('toc names wrapping at:', wrap.join(',') || 'never');
  await b.close();
})();
