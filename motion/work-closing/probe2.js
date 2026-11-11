const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 844 } });
    await p.goto('http://localhost:8730/kit/closing/demo.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const m = document.querySelector('body > footer .kws-skyline-name'), cs = getComputedStyle(m), sc = m.parentElement.getBoundingClientRect(), mb = m.getBoundingClientRect();
      const sv = document.querySelector('body > footer .kws-skyline-art').getBoundingClientRect();
      const anims = m.getAnimations().map(a => ({ name: a.animationName, t: a.currentTime && a.currentTime.toString(), prog: a.effect.getComputedTiming().progress, tl: a.timeline && a.timeline.constructor.name }));
      return { fontSize: cs.fontSize, padB: cs.paddingBottom, transform: cs.transform, sceneH: sc.height, markTop: mb.top - sc.top, markBottom: sc.bottom - mb.bottom, svgH: sv.height, innerH: innerHeight, sceneBottomToViewport: innerHeight - sc.bottom, anims };
    });
    console.log(w, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
