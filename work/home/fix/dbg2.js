const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.waitForTimeout(1500);
  const s = () => p.evaluate(() => { const e = document.querySelector('.hero-phone'); const a = e.getAnimations().map(a => a.animationName + ':' + a.playState + ':' + Math.round(a.currentTime)); return { op: getComputedStyle(e).opacity, a, mq: matchMedia('(min-width: 980px)').matches, iw: innerWidth, ih: innerHeight }; });
  console.log('loaded', JSON.stringify(await s()));
  await p.setViewportSize({ width: 1280, height: 3000 }); await p.waitForTimeout(100); console.log('taller', JSON.stringify(await s()));
  await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(100); console.log('back', JSON.stringify(await s()));
  await p.evaluate(() => { window.__mq = []; matchMedia('(min-width: 980px)').addEventListener('change', e => window.__mq.push([e.matches, innerWidth, performance.now() | 0])); window.addEventListener('resize', () => window.__mq.push(['resize', innerWidth, innerHeight])); });
  await p.screenshot({ path: 'dbg_full.png', fullPage: true });
  console.log('after fullPage', JSON.stringify(await s()), JSON.stringify(await p.evaluate(() => window.__mq)));
  await p.waitForTimeout(1200); console.log('1.2s later', JSON.stringify(await s()));
  await b.close();
})();
