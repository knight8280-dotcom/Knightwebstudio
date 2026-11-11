// Tab through the whole page: every stop shows a ring, sits clear of the sticky header and the phone bar, and the order follows the page.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.waitForTimeout(800);
    const stops = []; let problems = 0, lastY = -1e9, backwards = 0;
    for (let i = 0; i < 90; i++) {
      await p.keyboard.press('Tab');
      // wait until smooth scrolling has settled
      let prev = -1; for (let k = 0; k < 25; k++) { const y = await p.evaluate(() => scrollY); if (y === prev) break; prev = y; await p.waitForTimeout(80); }
      const s = await p.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return null; const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        const bar = document.querySelector('.mobile-cta'), br = bar && bar.getBoundingClientRect(); const barUp = bar && bar.classList.contains('show') && getComputedStyle(bar).display !== 'none';
        const hd = document.querySelector('.site-header').getBoundingClientRect();
        // a chip-style control may draw its ring on a sibling; here every stop is a link or button
        const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
        return { t: (el.getAttribute('aria-label') || el.innerText || el.id || el.className).trim().replace(/\s+/g, ' ').slice(0, 34), top: Math.round(r.top), bottom: Math.round(r.bottom), pageY: Math.round(r.top + scrollY), ring, w: cs.outlineWidth, c: cs.outlineColor,
          inBar: !!(bar && bar.contains(el)), inHead: !!el.closest('.site-header, .topbar, .skip-link'), underBar: !!(barUp && !bar.contains(el) && r.bottom > br.top + 1), underHead: !el.closest('.site-header, .topbar, .skip-link') && r.top < hd.bottom - 1 && r.bottom > hd.top, offscreen: r.bottom < 0 || r.top > innerHeight };
      });
      if (!s) break;
      stops.push(s.t);
      const issue = [!s.ring && 'NO RING', s.underBar && 'UNDER PHONE BAR', s.underHead && 'UNDER HEADER', s.offscreen && 'OFF SCREEN'].filter(Boolean);
      if (!s.inBar && !s.inHead) { if (s.pageY < lastY - 80) { backwards++; issue.push('ORDER JUMPS BACK ' + (lastY - s.pageY)); } lastY = s.pageY; }
      if (issue.length) { problems++; console.log('  ', w, JSON.stringify(s.t), issue.join(', '), JSON.stringify({ top: s.top, bottom: s.bottom })); }
      if (/Back to top/.test(s.t)) break;
    }
    console.log(`${w}x${h}: ${stops.length} tab stops, ${problems} with a problem. Order:`, stops.join(' > '));
    await ctx.close();
  }
  await b.close();
})();
