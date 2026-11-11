// Tab through main and check, after scrolling settles, that each focused element and its ring are on screen and not under the sticky header.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [url, w, h] of [['/terms/', 1440, 900], ['/terms/', 1093, 520], ['/privacy/', 1093, 520], ['/privacy/', 1440, 900], ['/terms/', 390, 844], ['/checkout/?plan=starter-deposit', 390, 844], ['/checkout/success/?plan=starter-deposit', 390, 844], ['/checkout/?plan=starter-deposit', 1024, 768], ['/checkout/success/?plan=starter-deposit', 1024, 768]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + url); await p.waitForTimeout(500);
    let n = 0; const bad = [];
    for (let i = 0; i < 90; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(120);
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const r = e.getBoundingClientRect(); const hd = document.getElementById('site-header').getBoundingClientRect(); const cs = getComputedStyle(e);
        const ring = parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset);
        return { main: !!e.closest('main'), footer: !!e.closest('footer'), t: (e.textContent || '').trim().slice(0, 28), top: Math.round(r.top), bottom: Math.round(r.bottom), hb: Math.round(hd.bottom), vh: innerHeight, ring, ow: cs.outlineWidth }; });
      if (!s || s.footer) break; if (!s.main) continue; n++;
      if (s.ow !== '3px') bad.push(s.t + ': ring ' + s.ow);
      if (s.top - s.ring < s.hb) bad.push(s.t + ': under the header (top ' + s.top + ', header ' + s.hb + ')');
      if (s.bottom + s.ring > s.vh) bad.push(s.t + ': ring cut at the bottom (bottom ' + s.bottom + ' of ' + s.vh + ')'); }
    console.log(url, w + 'x' + h, n + ' stops', bad.length ? '\n   ' + bad.join('\n   ') : 'all rings fully on screen');
    await ctx.close(); }
  await b.close(); })();
