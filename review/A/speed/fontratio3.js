const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, FONTCONFIG_FILE: __dirname + '/simfonts/fonts.conf' } });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const all = [];
  for (const p of ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/privacy/', '/terms/', '/checkout/', '/404.html']) {
    const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
    all.push(...await page.evaluate(() => { const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;left:-9999px;white-space:nowrap;font-size:100px;letter-spacing:0;font-synthesis:none'; document.body.appendChild(probe); const w = (t, fam, wt, fvs) => { probe.style.fontFamily = fam; probe.style.fontWeight = wt; probe.style.fontVariationSettings = fvs; probe.textContent = t; return probe.getBoundingClientRect().width; }; const out = []; const seen = new Set(); document.querySelectorAll('main h1, main h2, main h3').forEach(el => { const t = el.textContent.trim().replace(/\s+/g, ' '); if (t.length < 8 || seen.has(t)) return; seen.add(t); const cs = getComputedStyle(el); if (!/Fraunces/.test(cs.fontFamily)) return; out.push([w(t, 'Fraunces', cs.fontWeight, cs.fontVariationSettings) / w(t, 'Georgia', '700', 'normal'), w(t, 'Fraunces', cs.fontWeight, cs.fontVariationSettings) / w(t, 'Georgia', '400', 'normal')]); }); return out; }));
    await page.close();
  }
  const stat = v => { v = v.slice().sort((a, b) => a - b); const q = f => v[Math.floor((v.length - 1) * f)]; return `n=${v.length} min=${q(0).toFixed(3)} p10=${q(.1).toFixed(3)} median=${q(.5).toFixed(3)} p90=${q(.9).toFixed(3)} max=${q(1).toFixed(3)}`; };
  console.log('headings: Fraunces as styled / Georgia Bold   ', stat(all.map(a => a[0])));
  console.log('headings: Fraunces as styled / Georgia Regular', stat(all.map(a => a[1])));
  await browser.close();
})();
