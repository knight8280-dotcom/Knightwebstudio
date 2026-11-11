const { chromium } = require('playwright');
const OUT = __dirname + '/wshots'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch();
  for (const [w, h] of [[600, 900], [700, 900], [980, 800], [1024, 768], [1100, 800], [1280, 800]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/about-${w}-top.png` });
    await p.evaluate(() => { document.querySelector('#about').scrollIntoView(); scrollBy(0, -80); }); await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/about-${w}-letter.png` });
    await p.evaluate(() => { document.querySelector('.notes').scrollIntoView(); scrollBy(0, -90); }); await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/about-${w}-notes.png` });
    await p.evaluate(() => { document.querySelector('.section-sand').scrollIntoView(); scrollBy(0, -60); }); await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/about-${w}-how.png` });
    const hdr = await p.evaluate(() => { const c = document.querySelector('.header-cta'); if (!c) return null; const r = c.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width), disp: getComputedStyle(c).display }; });
    console.log(w, 'header button', JSON.stringify(hdr));
    await ctx.close(); }
  for (const [w, h, name] of [[600, 800, '600'], [700, 800, '700'], [760, 800, '760'], [844, 390, 'landscape'], [1280, 620, 'short'], [1920, 1080, '1920']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/404.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/404-${name}.png` }); await ctx.close(); }
  await b.close(); })();
