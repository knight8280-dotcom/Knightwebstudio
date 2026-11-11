// Duplicate ids, and SVG paint/clip/use references whose target sits in a display:none subtree (they then fail to paint).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
(async () => {
  const browser = await chromium.launch();
  for (const [vw, vh, js] of [[390, 844, true], [1280, 800, true], [390, 844, false]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, javaScriptEnabled: js });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    let problems = 0;
    for (const p of PAGES) {
      const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
      const r = await page.evaluate(() => {
        const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
        const dup = Object.entries(ids).filter(([k, v]) => v > 1).map(([k, v]) => k + '×' + v);
        const hiddenAnc = el => { for (let e = el; e && e.nodeType === 1; e = e.parentNode) { if (e instanceof SVGDefsElement) continue; if (getComputedStyle(e).display === 'none' && !(e.closest && e.closest('defs'))) return e; } return null; };
        const bad = []; let refs = 0;
        document.querySelectorAll('svg *').forEach(el => {
          const vals = []; for (const a of ['fill', 'stroke', 'clip-path', 'mask', 'filter', 'href', 'xlink:href', 'style']) { const v = el.getAttribute(a); if (v) vals.push(v); }
          for (const v of vals) for (const m of v.matchAll(/(?:url\(["']?#([^"')]+)["']?\)|^#([\w-]+)$)/g)) { const id = m[1] || m[2]; refs++; const t = document.getElementById(id); if (!t) { bad.push('missing #' + id); continue; } const svgT = t.closest('svg'); const h = svgT ? hiddenAnc(svgT) : null; const userVisible = el.closest('svg').getBoundingClientRect().width > 0; if (h && userVisible) bad.push('#' + id + ' lives in hidden ' + h.tagName + '.' + (h.className.baseVal || h.className)); }
        });
        return { dup, bad: [...new Set(bad)], refs };
      });
      if (r.dup.length || r.bad.length) { problems++; console.log(`${vw} js=${js} ${p}: dupIds=${r.dup.join(',')} badRefs=${r.bad.join(' | ')}`); }
      await page.close();
    }
    console.log(`-- ${vw} js=${js}: ${problems} pages with duplicate ids or broken SVG references`);
    await ctx.close();
  }
  await browser.close();
})();
