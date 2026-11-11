const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const widths = []; for (let w = 320; w <= 1920; w += 20) widths.push(w); widths.push(375, 379, 390, 393, 412, 414, 430, 599, 759, 768, 979, 1024, 1099, 1279, 1366, 1536);
  for (const path of ['/contact/', '/faq/']) {
    const ctx = await b.newContext({ viewport: { width: 400, height: 900 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    let bad = 0;
    for (const w of widths.sort((a, b) => a - b)) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(60);
      const r = await p.evaluate(() => { const out = []; const vw = document.documentElement.clientWidth; document.querySelectorAll('main *, .topbar *, .site-header *').forEach(e => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return; if (e.closest('.hp, .sr-only, .nav')) return; const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return; if (r.right > vw + 0.5 || r.left < -0.5) out.push(e.tagName + '.' + (e.className.baseVal ?? e.className) + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); }); return { vw, sw: document.documentElement.scrollWidth, out: out.slice(0, 4) }; });
      if (r.out.length || r.sw > r.vw) { bad++; console.log(path, w, JSON.stringify(r)); }
    }
    console.log(path, 'widths checked', widths.length, 'with something outside the viewport:', bad);
    await ctx.close();
  }
  await b.close();
})();
