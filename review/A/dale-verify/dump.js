// Print every visible text block of a page with its y position, at one viewport.
// node dump.js <path> <w> <h> [old] [yFrom] [yTo]
const { chromium } = require('playwright');
(async () => {
  const [p, w, h, old, y0, y1] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, colorScheme: 'light', isMobile: +w < 800, hasTouch: +w < 800 });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  await page.goto((old === 'old' ? 'http://localhost:8700' : 'http://localhost:8720') + p, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const rows = await page.evaluate(() => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; const seen = new Set();
    while ((n = w.nextNode())) {
      const el = n.parentElement; if (!el || !n.nodeValue.trim()) continue;
      const blk = el.closest('p,li,h1,h2,h3,h4,a,button,dt,dd,th,td,summary,label,figcaption,caption,span.tier-name,span.tier-amt') || el;
      if (seen.has(blk)) continue; seen.add(blk);
      const cs = getComputedStyle(blk); const r = blk.getBoundingClientRect();
      if (cs.visibility === 'hidden' || cs.display === 'none' || r.width < 2 || r.height < 2) continue;
      if (blk.closest('.sr-only, [hidden]')) continue;
      out.push({ y: Math.round(r.top + scrollY), tag: blk.tagName.toLowerCase(), fs: Math.round(parseFloat(cs.fontSize)), t: (blk.innerText || blk.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 170), href: blk.tagName === 'A' ? blk.getAttribute('href') : '' });
    }
    return out.sort((a, b) => a.y - b.y);
  });
  for (const r of rows) if ((!y0 || r.y >= +y0) && (!y1 || r.y <= +y1)) console.log(String(r.y).padStart(6), r.tag.padEnd(8), String(r.fs).padStart(2), r.t, r.href ? `-> ${r.href}` : '');
  await browser.close();
})();
