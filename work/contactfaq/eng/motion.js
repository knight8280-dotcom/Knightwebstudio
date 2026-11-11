const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const before = await p.evaluate(() => { const s = document.querySelector('main .stamp'); const cs = getComputedStyle(s); return { cls: s.className, op: cs.opacity, tr: cs.transform, rot: cs.rotate, anim: cs.animationName }; });
    await p.evaluate(() => document.querySelector('main .stamp').scrollIntoView({ block: 'center', behavior: 'instant' }));
    const frames = [];
    for (const t of [60, 200, 320, 450, 700, 1200]) { await p.waitForTimeout(t - (frames.length ? [60, 200, 320, 450, 700, 1200][frames.length - 1] : 0)); frames.push(await p.evaluate(() => { const s = document.querySelector('main .stamp'); const cs = getComputedStyle(s); return [s.classList.contains('visible'), (+cs.opacity).toFixed(2), cs.transform, cs.animationName, cs.animationDuration, cs.animationDelay, cs.animationIterationCount, cs.animationFillMode]; })); }
    console.log(w, 'before', JSON.stringify(before)); frames.forEach((f, i) => console.log('   t', [60, 200, 320, 450, 700, 1200][i], JSON.stringify(f)));
    // infinite animations anywhere
    for (const path of ['/contact/', '/faq/']) { await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(300); const inf = await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('*')) { for (const pseudo of [null, '::before', '::after']) { const cs = getComputedStyle(el, pseudo); if (cs.animationName !== 'none' && /infinite/.test(cs.animationIterationCount)) out.push(el.tagName + '.' + el.className + (pseudo || '')); } } return out; }); console.log('   infinite animations on', path, inf.length ? inf : 'none');
      const anims = await p.evaluate(() => { const out = new Set(); for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (cs.animationName !== 'none') out.add(el.tagName.toLowerCase() + '.' + el.className.toString().split(' ')[0] + ': ' + cs.animationName + ' ' + cs.animationDuration + ' x' + cs.animationIterationCount); if (cs.transitionDuration !== '0s') { /* skip */ } } return [...out]; }); console.log('   animations in main', path, anims); }
    // reduced motion
    const ctx2 = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx2.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p2 = await ctx2.newPage(); await p2.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await p2.waitForTimeout(300);
    console.log('   reduced motion: stamp', await p2.evaluate(() => { const cs = getComputedStyle(document.querySelector('main .stamp')); return [cs.opacity, cs.animationName, cs.transform]; }));
    await p2.goto('http://localhost:8720/faq/', { waitUntil: 'load' }); await p2.locator('summary').nth(5).click();
    console.log('   reduced motion: faq answer anim', await p2.evaluate(() => getComputedStyle(document.querySelectorAll('.faq-body')[5]).animationName), 'cta reveal opacity', await p2.evaluate(() => getComputedStyle(document.querySelector('.cta-inner')).opacity));
    await ctx2.close(); await ctx.close();
  }
  await b.close();
})();
