const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const w of [360, 390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
    await p.addStyleTag({ content: '*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}' }); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const poke = []; for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || el.closest('.sr-only,.hp') || el.ownerSVGElement) continue; const rc = el.getBoundingClientRect(); if (rc.width && rc.right > innerWidth + 1) poke.push(el.tagName.toLowerCase() + '.' + el.className.toString().slice(0, 20) + ' +' + Math.round(rc.right - innerWidth)); 
        }
      const chromePoke = []; for (const el of document.querySelectorAll('.topbar *, .site-header *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.sr-only,#nav') || el.ownerSVGElement) continue; const rc = el.getBoundingClientRect(); if (rc.width && rc.right > innerWidth + 1) chromePoke.push(el.tagName.toLowerCase() + '.' + el.className.toString().slice(0, 20) + ' +' + Math.round(rc.right - innerWidth)); }
      return { over: document.documentElement.scrollWidth - innerWidth, poke: poke.slice(0, 4), chromePoke: chromePoke.slice(0, 3) }; });
    console.log(path, w, JSON.stringify(r));
    if (r.poke.length) await p.screenshot({ path: `${__dirname}/misc/spacing-${path.replace(/\//g, '')}-${w}.png` });
    await ctx.close(); }
  await b.close();
})();
