// Tab through the page: every stop must show a ring; print the order. Then Enter on a row's summary.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, theme] of [[1440, 900, 'light'], [390, 844, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
    const stops = []; let bad = 0;
    for (let i = 0; i < 80; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
        const inMain = !!e.closest('main'); const lab = (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        return { tag: e.tagName.toLowerCase(), lab, inMain, ring: parseFloat(cs.outlineWidth) >= 2 && cs.outlineStyle !== 'none', ringCol: cs.outlineColor, inView: r.top >= 0 && r.bottom <= innerHeight, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
      if (!s) break; if (s.inMain) { stops.push(s); if (!s.ring || !s.inView) { bad++; console.log('  BAD', JSON.stringify(s)); } }
      if (s.lab === 'Send an enquiry' && s.inMain) break;
    }
    console.log(w, theme, 'stops in main:', stops.length, 'bad:', bad); console.log('  ' + stops.map(s => s.lab).join(' > '));
    // Enter opens a row, Enter again closes it
    await p.focus('#build summary'); await p.keyboard.press('Enter'); const o1 = await p.$eval('#build details', d => d.open); await p.keyboard.press('Enter'); const o2 = await p.$eval('#build details', d => d.open);
    console.log('  Enter opens:', o1, ' Enter again closes:', !o2);
    await p.focus('#build summary'); await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(200);
    await p.screenshot({ path: __dirname + '/focus-summary-' + w + '-' + theme + '.png' });
    await p.focus('.menu a[href="#care"]'); await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(200);
    await p.screenshot({ path: __dirname + '/focus-menu-' + w + '-' + theme + '.png' });
    await ctx.close();
  }
  await b.close();
})();
