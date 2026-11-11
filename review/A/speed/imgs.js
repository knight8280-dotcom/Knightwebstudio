// Displayed size vs natural size of every <img>, at 390 and 1440, and whether it is in the first screen.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  for (const [vw, vh, dpr] of [[390, 844, 3], [390, 844, 2], [1440, 900, 2], [1440, 900, 1]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, isMobile: vw < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of ['/', '/work/', '/start/', '/web-design-baton-rouge/']) {
      const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
      const r = await page.evaluate(() => [...document.images].map(i => { const b = i.getBoundingClientRect(); const cs = getComputedStyle(i); return { src: i.getAttribute('src').split('/').pop(), disp: Math.round(b.width) + 'x' + Math.round(b.height), nat: i.naturalWidth + 'x' + i.naturalHeight, attr: i.getAttribute('width') + 'x' + i.getAttribute('height'), top: Math.round(b.top + scrollY), loading: i.loading, fp: i.getAttribute('fetchpriority'), fit: cs.objectFit, ar: cs.aspectRatio, need: Math.round(b.width * devicePixelRatio) }; }));
      for (const i of r) console.log(`${vw}@${dpr}x ${p.padEnd(26)} ${i.src.padEnd(26)} shown ${i.disp} needs ${i.need}px wide; file ${i.nat} (attrs ${i.attr}) top=${i.top}${i.top < vh ? ' IN FIRST SCREEN' : ''} loading=${i.loading} fetchpriority=${i.fp} fit=${i.fit} ar=${i.ar}`);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
