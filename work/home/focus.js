// Tab through the page: log order, check every stop shows an outline, and snapshot a few.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, theme] of [[1280, 800, 'light'], [390, 844, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/', { waitUntil: 'load' });
    await p.waitForTimeout(600);
    const seen = []; let shots = 0;
    for (let i = 0; i < 80; i++) {
      await p.keyboard.press('Tab');
      await p.waitForTimeout(60);
      const info = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        let ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
        // chips etc. may draw the ring on a sibling
        return { tag: el.tagName, cls: el.className.toString().slice(0, 30), text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 44), ring, oc: cs.outlineColor, inMain: !!el.closest('main'),
                 top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, covered: (() => { const bar = document.querySelector('.mobile-cta.show'); if (!bar) return false; const br = bar.getBoundingClientRect(); return br.height > 0 && getComputedStyle(bar).visibility !== 'hidden' && r.bottom > br.top + 1 && !bar.contains(el); })() };
      });
      if (!info) break;
      seen.push(info);
      if (info.inMain && shots < 60 && /price-strip|tier|print|more-link|btn-primary/.test(info.cls) && (shots++ % 3 === 0)) {
        await p.screenshot({ path: `c3/focus-${w}-${String(seen.length).padStart(2, '0')}.png` });
      }
      if (info.text.startsWith('Back to top')) break;
    }
    console.log('==', w, theme, seen.length, 'stops');
    for (const s of seen) console.log((s.ring ? 'ring ' : 'NO RING ') + (s.covered ? 'COVERED ' : '') + (s.inMain ? 'main ' : 'chrome ') + s.tag + '.' + s.cls + ' | ' + s.text + ' | ' + s.oc);
    await ctx.close();
  }
  await b.close();
})();
