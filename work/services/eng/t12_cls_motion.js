const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    // CLS with fonts delayed 1.5s
    const ctx = await b.newContext({ viewport: vp });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.woff2/, async r => { await new Promise(s => setTimeout(s, 1500)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([+e.value.toFixed(4), Math.round(e.startTime), (e.sources || []).slice(0, 3).map(s => s.node && (s.node.className || s.node.nodeName))]); } } }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(3500);
    const before = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts, H: document.documentElement.scrollHeight, fonts: [...document.fonts].map(f => f.family + ':' + f.status) }));
    console.log(`\n== ${vp.width} CLS with fonts delayed 1.5s:`, JSON.stringify(before));
    // scroll through the page to trigger reveals and measure shifts
    for (let y = 0; y < before.H; y += 400) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(120); }
    await p.waitForTimeout(800);
    console.log('   after scrolling whole page: CLS', await p.evaluate(() => +window.__cls.toFixed(4)), 'shifts', JSON.stringify(await p.evaluate(() => window.__shifts.slice(-4))));
    // animations: list running/infinite ones
    const anim = await p.evaluate(() => document.getAnimations().map(a => ({ name: a.animationName || a.transitionProperty, it: a.effect.getTiming().iterations, state: a.playState, el: a.effect.target && (a.effect.target.className.baseVal ?? a.effect.target.className) })));
    console.log('   animations still alive after load+scroll:', JSON.stringify(anim.filter(a => a.state === 'running')), 'infinite:', JSON.stringify(anim.filter(a => a.it === Infinity)));
    const rev = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => [e.className, e.classList.contains('visible'), getComputedStyle(e).opacity]));
    console.log('   reveal blocks:', JSON.stringify(rev));
    await ctx.close();
    // reduced motion
    const c2 = await b.newContext({ viewport: vp, reducedMotion: 'reduce' }); await c2.route(/plausible\.io|calendly\.com/, r => r.abort());
    const q = await c2.newPage(); await q.goto('http://localhost:8720/services/'); await q.waitForTimeout(600);
    const rm = await q.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.animationName !== 'none' || (cs.transitionDuration !== '0s' && cs.transitionProperty !== 'none' && cs.transitionDuration.split(',').some(d => parseFloat(d) > 0))) bad.push((el.className.baseVal ?? el.className) + ' anim:' + cs.animationName + ' tr:' + cs.transitionDuration); for (const ps of ['::before', '::after']) { const c = getComputedStyle(el, ps); if (c.content !== 'none' && (c.animationName !== 'none' || c.transitionDuration.split(',').some(d => parseFloat(d) > 0))) bad.push(el.className + ps); } } const op = [...document.querySelectorAll('.reveal, .seq')].filter(e => getComputedStyle(e).opacity !== '1').length; return { bad: bad.slice(0, 8), hiddenReveals: op, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior }; });
    console.log('   reduced motion:', JSON.stringify(rm));
    await c2.close();
  }
  await b.close();
})();
