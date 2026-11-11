// Scroll every page slowly at short viewports (zoomed desktops, landscape phones): which .reveal blocks never become visible?
const { chromium, BASE, PAGES, slug, ctxFor } = require('./lib');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const sizes = arg('sizes', '320x256,640x400,568x320,844x390,1280x500').split(',').map(s => s.split('x').map(Number));
const pages = arg('pages', PAGES.join(',')).split(',');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of sizes) for (const path of pages) {
    const ctx = await ctxFor(b, { w, h, mobile: process.argv.includes('--mobile') }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += Math.max(40, Math.round(h * 0.25))) { await p.evaluate(yy => scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(35); }
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const foot = document.getElementById('mobile-cta') && matchMedia('(max-width: 1099.98px)').matches ? 96 : 24; const rootH = innerHeight - foot; const out = [];
      for (const el of document.querySelectorAll('.reveal')) { if (!el.checkVisibility({ checkVisibilityCSS: true })) continue; const cs = getComputedStyle(el); const hh = el.getBoundingClientRect().height; if (+cs.opacity < 0.99) out.push({ el: el.tagName.toLowerCase() + '.' + el.className.replace(/\s+/g, '.'), h: Math.round(hh), maxRatio: +(Math.min(hh, rootH) / hh).toFixed(3), opacity: cs.opacity, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50), y: Math.round(el.getBoundingClientRect().top + scrollY), words: el.textContent.trim().split(/\s+/).length, links: el.querySelectorAll('a,button,input').length }); }
      return { rootH, total: document.querySelectorAll('.reveal').length, out }; });
    if (r.out.length) { console.log(`${w}x${h} ${path}: ${r.out.length} of ${r.total} reveal blocks NEVER shown (observer root height ${r.rootH}px)`); r.out.forEach(o => console.log('     ' + JSON.stringify(o))); }
    else console.log(`${w}x${h} ${path}: all ${r.total} shown`);
    if (r.out.length && process.argv.includes('--shot')) { await p.evaluate(yy => scrollTo({ top: yy, behavior: 'instant' }), r.out[0].y - 40); await p.waitForTimeout(700); await p.screenshot({ path: `shots/zoom/never_${w}x${h}_${slug(path)}.png` }); }
    await ctx.close();
  }
  await b.close();
})();
