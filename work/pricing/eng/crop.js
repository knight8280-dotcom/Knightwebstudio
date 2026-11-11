const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  const box = async (sel, pad = 12) => p.evaluate(([sel, pad]) => { const e = [...document.querySelectorAll(sel)].pop(); const r = e.getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top + scrollY - pad), width: innerWidth, height: r.height + 2 * pad }; }, [sel, pad]);
  await p.screenshot({ path: 'shots/crop-custom.png', fullPage: true, clip: await p.evaluate(() => { const e = [...document.querySelectorAll('.pl-name')].find(x => /Custom automation/.test(x.textContent)).closest('li'); const r = e.getBoundingClientRect(); return { x: 0, y: r.top + scrollY - 10, width: innerWidth, height: r.height + 20 }; }) });
  await p.screenshot({ path: 'shots/crop-cons-head.png', fullPage: true, clip: await p.evaluate(() => { const e = document.querySelector('#consulting .section-head'); const r = e.getBoundingClientRect(); return { x: 0, y: r.top + scrollY - 10, width: innerWidth, height: r.height + 20 }; }) });
  await p.screenshot({ path: 'shots/crop-business.png', fullPage: true, clip: await p.evaluate(() => { const e = document.querySelector('.is-popular'); const r = e.getBoundingClientRect(); return { x: 0, y: r.top + scrollY - 30, width: innerWidth, height: 260 }; }) });
  await p.screenshot({ path: 'shots/crop-care.png', fullPage: true, clip: await p.evaluate(() => { const e = document.querySelector('.table'); const r = e.getBoundingClientRect(); return { x: 0, y: r.top + scrollY - 10, width: innerWidth, height: 520 }; }) });
  await b.close();
})();
