const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
const ALL = Object.assign({ privacy: { url: '/privacy/' }, terms: { url: '/terms/' } }, S);
(async () => {
  const browser = await chromium.launch();
  for (const name of ['privacy', 'terms', 'co-loaded', 'co-serverdown', 'co-noplan', 'ok-plan', 'ok-paid', 'ok-unpaid']) for (const view of ['m-light', 'd-light']) {
    const s = ALL[name];
    const { ctx, page } = await open(browser, s, view);
    // slow the fonts down so a swap is visible, and delay the payment server
    await ctx.route(/\.woff2/, async r => { await new Promise(z => setTimeout(z, 500)); r.continue(); });
    await page.addInitScript(() => { window.__cls = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map(x => x.node && x.node.nodeType === 1 ? x.node.tagName.toLowerCase() + '.' + (x.node.className || '').toString().split(' ').slice(0, 2).join('.') : '').slice(0, 3).join(',') }); }).observe({ type: 'layout-shift', buffered: true }); });
    await page.goto(base + s.url, { waitUntil: 'load' }); await page.waitForTimeout(2200);
    const cls = await page.evaluate(() => window.__cls);
    const anim = await page.evaluate(() => document.getAnimations().map(a => (a.animationName || a.transitionProperty || '?') + ':' + a.playState + ':' + (a.effect.getComputedTiming().iterations)));
    console.log(name, view, 'CLS total', cls.reduce((a, b) => a + b.v, 0).toFixed(4), JSON.stringify(cls).slice(0, 420), '| running animations after 2.2s:', JSON.stringify(anim));
    await ctx.close();
  }
  // reduced motion + animation properties of the slip
  for (const rm of ['no-preference', 'reduce']) {
    const { ctx, page } = await open(browser, ALL['ok-plan'], 'm-light', { rm });
    await page.goto(base + ALL['ok-plan'].url, { waitUntil: 'domcontentloaded' });
    const a = await page.evaluate(() => { const el = document.querySelector('.receipt'); const cs = getComputedStyle(el); return [cs.animationName, cs.animationDuration, cs.animationIterationCount, cs.animationFillMode, cs.animationTimingFunction].join(' | '); });
    console.log('slip animation (' + rm + '):', a);
    await page.waitForTimeout(900);
    const end = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('.receipt')); return cs.opacity + ' ' + cs.transform; });
    console.log('   resting state:', end);
    await ctx.close();
  }
  await browser.close();
})();
