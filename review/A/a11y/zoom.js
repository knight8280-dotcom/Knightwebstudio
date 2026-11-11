// 400% zoom of a 1280x1024 window = 320x256 CSS px; 200% of 1280x800 = 640x400. How much of the window do the sticky bars take?
const { chromium, BASE, slug, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[320, 256], [640, 400], [640, 512]]) for (const path of ['/pricing/', '/consulting/', '/']) {
    const ctx = await ctxFor(b, { w, h, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    await p.evaluate(() => scrollTo(0, 2400)); await p.waitForTimeout(500);
    const m = await p.evaluate(() => { const hd = document.getElementById('site-header').getBoundingClientRect(); const mc = document.getElementById('mobile-cta'); const r = mc ? mc.getBoundingClientRect() : null; const shown = mc && mc.classList.contains('show') && getComputedStyle(mc).display !== 'none'; return { header: Math.round(hd.height), headerTop: Math.round(hd.top), bar: shown ? Math.round(r.height) : 0, vh: innerHeight, sp: getComputedStyle(document.documentElement).scrollPaddingTop + ' / ' + getComputedStyle(document.documentElement).scrollPaddingBottom }; });
    console.log(`${w}x${h} ${path}`, JSON.stringify(m), 'free=' + (m.vh - m.header - m.bar) + 'px (' + Math.round(100 * (m.vh - m.header - m.bar) / m.vh) + '%)');
    await p.screenshot({ path: `shots/zoom/${w}x${h}_${slug(path)}.png` });
    await ctx.close();
  }
  // menu open at 320x256: can every item be reached?
  { const ctx = await ctxFor(b, { w: 320, h: 256, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300);
    await p.click('#nav-toggle'); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/zoom/320x256_menu.png' });
    const r = await p.evaluate(() => { const ni = document.querySelector('.nav-inner'); const n = document.getElementById('nav'); const nr = n.getBoundingClientRect(); return { navTop: Math.round(nr.top), navH: Math.round(nr.height), innerScrollH: ni.scrollHeight, innerClientH: ni.clientHeight, overflowY: getComputedStyle(ni).overflowY }; });
    console.log('menu at 320x256', JSON.stringify(r));
    let last = null; for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(80); last = await p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return (e.textContent || e.getAttribute('aria-label')).trim().slice(0, 25) + ' top=' + Math.round(r.top) + ' bottom=' + Math.round(r.bottom) + ' hit=' + (t && (e.contains(t) || t.contains(e))); }); console.log('   tab', i, last); }
    await ctx.close(); }
  await b.close();
})();
