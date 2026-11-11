const { launch, ctx, URL, PORT, INSTRUMENT } = require('./common');
const rate = async (p, ms) => { const a = await p.evaluate(() => [window.__draws, window.__rafs, performance.now()]); await p.waitForTimeout(ms); const z = await p.evaluate(() => [window.__draws, window.__rafs, performance.now()]); const s = (z[2] - a[2]) / 1000; return { draws: +((z[0] - a[0]) / s).toFixed(1), rafs: +((z[1] - a[1]) / s).toFixed(1) }; };
const layers = p => p.evaluate(() => [...document.querySelectorAll('.kws-shader')].map(s => { const c = s.querySelector('canvas'), r = s.getBoundingClientRect(); return { t: s.dataset.shader, live: s.classList.contains('is-live'), css: Math.round(r.width) + 'x' + Math.round(r.height), cv: c ? c.width + 'x' + c.height : null, tf: c ? c.style.transform : null, n: c ? (window.__drawBy.get(c) || 0) : 0, inView: r.bottom > 0 && r.top < innerHeight }; }));
(async () => {
  const b = await launch();
  const out = {};
  // A. normal motion, 390@3x
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
    const p = await c.newPage(); const errs = []; p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text() + ' @' + (m.location().url || '').split('/').pop()); }); p.on('pageerror', e => errs.push('PE ' + e.message));
    await p.addInitScript(INSTRUMENT);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    console.log('A top:', JSON.stringify(await rate(p, 3000)), 'ctx', await p.evaluate(() => [window.__ctx, window.__hctx]));
    console.log('A layers at top:', JSON.stringify(await layers(p)));
    console.log('A html attrs:', await p.evaluate(() => [document.documentElement.getAttribute('data-motion'), localStorage.getItem('kws-motion'), document.querySelectorAll('canvas').length]));
    // scroll to each section and count
    for (const sel of ['#services .kws-marks', '#process .kws-folders', '#pricing .kws-folders', '.demo-brand', '.cta-band', 'footer']) {
      await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(800);
      const r = await rate(p, 3000); const L = await layers(p);
      console.log('A', sel, JSON.stringify(r), 'inView', L.filter(l => l.inView).map(l => l.t + ' ' + l.css + ' cv ' + l.cv).join(' | '));
    }
    // pause via button in footer
    await p.evaluate(() => document.querySelector('.cta-band').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500);
    const btnInfo = await p.evaluate(() => [...document.querySelectorAll('.kws-motion')].map(b => ({ hidden: b.hidden, label: b.getAttribute('aria-label'), title: b.title, pressed: b.getAttribute('aria-pressed'), r: (r => [Math.round(r.width), Math.round(r.height)])(b.getBoundingClientRect()), type: b.type })));
    console.log('A buttons:', JSON.stringify(btnInfo));
    await p.evaluate(() => document.querySelectorAll('.kws-motion')[1].click()); await p.waitForTimeout(600);
    console.log('A after pause:', JSON.stringify(await rate(p, 3000)), await p.evaluate(() => [document.documentElement.getAttribute('data-motion'), localStorage.getItem('kws-motion'), [...document.querySelectorAll('.kws-motion')].map(b => b.getAttribute('aria-label'))]));
    // scroll while paused to new section: does it draw one frame for newly visible layers?
    await p.evaluate(() => document.querySelector('#services .kws-marks').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500);
    console.log('A paused, scrolled to cards:', JSON.stringify(await rate(p, 2000)));
    // reload: persists?
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
    console.log('A after reload:', await p.evaluate(() => [document.documentElement.getAttribute('data-motion'), localStorage.getItem('kws-motion'), [...document.querySelectorAll('.kws-motion')].map(b => b.getAttribute('aria-label'))]), JSON.stringify(await rate(p, 2000)), 'live layers', (await layers(p)).filter(l => l.live).length);
    // resume
    await p.evaluate(() => document.querySelectorAll('.kws-motion')[0].click()); await p.waitForTimeout(400);
    console.log('A resumed:', JSON.stringify(await rate(p, 2000)), await p.evaluate(() => [document.documentElement.getAttribute('data-motion'), localStorage.getItem('kws-motion')]));
    console.log('A console:', errs.join(' || ') || 'clean');
    await c.close();
  }
  // B. reduced motion
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const p = await c.newPage(); await p.addInitScript(INSTRUMENT);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    console.log('B reduced: attr', await p.evaluate(() => [document.documentElement.getAttribute('data-motion'), localStorage.getItem('kws-motion')]), JSON.stringify(await rate(p, 3000)), 'total draws', await p.evaluate(() => window.__draws));
    console.log('B layers:', JSON.stringify((await layers(p)).map(l => [l.t, l.live, l.n])));
    await p.evaluate(() => document.querySelector('#services .kws-marks').scrollIntoView({ block: 'center' })); await p.waitForTimeout(800);
    console.log('B at cards:', JSON.stringify(await rate(p, 2500)), JSON.stringify((await layers(p)).map(l => [l.t, l.live, l.n])));
    // tabs under reduced motion: animation?
    await p.evaluate(() => document.querySelector('#pricing .kws-folders').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
    await p.click('#pricing [role=tab]:nth-child(3)');
    const an = await p.evaluate(() => ({ anims: document.getAnimations().length, sel: [...document.querySelectorAll('#pricing [role=tab]')].map(t => t.getAttribute('aria-selected')), names: [...document.querySelectorAll('#pricing .is-front .kws-folder-body > *')].map(e => getComputedStyle(e).animationName) }));
    console.log('B tab click:', JSON.stringify(an));
    // running CSS animations/transitions anywhere in kit?
    await c.close();
  }
  // C. data-motion=off without reduced motion (saved choice)
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 } });
    const p = await c.newPage(); await p.addInitScript(INSTRUMENT); await p.addInitScript(() => { try { localStorage.setItem('kws-motion', 'off'); } catch (e) {} });
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    console.log('C saved off:', await p.evaluate(() => document.documentElement.getAttribute('data-motion')), JSON.stringify(await rate(p, 2500)));
    await p.evaluate(() => document.querySelector('#pricing .kws-folders').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
    await p.click('#pricing [role=tab]:nth-child(2)');
    console.log('C tab click anims:', await p.evaluate(() => document.getAnimations().map(a => a.animationName || a.transitionProperty)));
    await c.close();
  }
  // D. background tab: open another page in the same context, bring to front
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 } });
    const p = await c.newPage(); await p.addInitScript(INSTRUMENT);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    const before = await rate(p, 1500);
    // emulate hidden via CDP
    const s = await c.newCDPSession(p);
    const p2 = await c.newPage(); await p2.goto('about:blank'); await p2.bringToFront();
    await p.waitForTimeout(500);
    const vis = await p.evaluate(() => [document.hidden, document.visibilityState]);
    const during = await rate(p, 3000);
    await p.bringToFront(); await p.waitForTimeout(500);
    const after = await rate(p, 2000);
    console.log('D background tab: before', JSON.stringify(before), 'hidden?', vis, 'during', JSON.stringify(during), 'after', JSON.stringify(after));
    await c.close();
  }
  await b.close();
})();
