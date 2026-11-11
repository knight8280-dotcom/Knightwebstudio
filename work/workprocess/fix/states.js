// node states.js : scripts off, reduced motion, and the stamp's landing
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  fs.mkdirSync('nojs', { recursive: true }); fs.mkdirSync('stamp', { recursive: true });
  const b = await chromium.launch();
  const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  // 1. scripts off
  for (const path of ['/work/', '/process/']) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(300);
    await p.screenshot({ path: `nojs/${path.replace(/\//g, '')}_${w}.png`, fullPage: true });
    await ctx.close();
    // computed-style probe needs evaluate, which works with JS disabled in Playwright
    const ctx2 = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false }); await block(ctx2);
    const p2 = await ctx2.newPage(); await p2.goto('http://localhost:8720' + path, { waitUntil: 'load' });
    const bad = await p2.evaluate(() => [...document.querySelectorAll('main *')].filter(e => { const cs = getComputedStyle(e); return !e.closest('.sr-only,[hidden],svg') && e.getClientRects().length && (parseFloat(cs.opacity) < 1 || cs.visibility === 'hidden'); }).map(e => e.tagName + '.' + e.className).slice(0, 8));
    const dead = await p2.evaluate(() => ({ js: document.documentElement.classList.contains('js'), toggles: [...document.querySelectorAll('#theme-toggle, .nav-toggle')].filter(e => e.getClientRects().length).length, links: [...document.querySelectorAll('main a')].map(a => a.getAttribute('href')).join(' ') }));
    console.log('no-js', path, w, 'faded/hidden in main:', JSON.stringify(bad), JSON.stringify(dead));
    await ctx2.close();
  }
  // 2. reduced motion
  for (const path of ['/work/', '/process/']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    console.log('reduced motion', path, JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('main .reveal')].map(e => [e.className, getComputedStyle(e).opacity, getComputedStyle(e).transform, getComputedStyle(e).transitionDuration]))));
    await ctx.close();
  }
  // 3. the stamp's landing, phone and desktop, with motion
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/process/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const y0 = await p.evaluate(() => document.querySelector('.stamp').getBoundingClientRect().top + scrollY);
    // a steady scroll, about 600px a second, until the stamp is in the middle of the screen
    const frames = [];
    let y = Math.max(0, y0 - h - 200); await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(300);
    const t0 = Date.now(); let seen = null, n = 0;
    while (y < y0 - h / 2) {
      y += 30; await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(50);
      const s = await p.evaluate(() => { const st = document.querySelector('.stamp'), cs = getComputedStyle(st), r = st.getBoundingClientRect(), bar = document.getElementById('mobile-cta'); const bt = bar && bar.classList.contains('show') && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight; return { vis: st.classList.contains('visible'), op: +(+cs.opacity).toFixed(2), tf: cs.transform, top: Math.round(r.top), bottom: Math.round(r.bottom), clear: Math.round(bt - r.bottom) }; });
      if (s.vis && seen === null) seen = Date.now();
      if (s.vis) frames.push(`${Date.now() - seen}ms op ${s.op} clearOfBar ${s.clear}`);
      if (s.vis && n < 12 && (n++ % 2 === 0)) await p.screenshot({ path: `stamp/land_${w}_${String(n).padStart(2, '0')}.png`, clip: { x: Math.max(0, w - 390), y: Math.max(0, s.top - 160), width: 390, height: 300 } });
    }
    await p.waitForTimeout(1200);
    const end = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.stamp')); return [cs.opacity, cs.transform, cs.rotate]; });
    console.log('stamp', w, frames.slice(0, 14).join(' | '), ' END', JSON.stringify(end));
    await ctx.close();
  }
  await b.close();
})();
