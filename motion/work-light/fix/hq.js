const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const mob of [false, true]) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: mob, hasTouch: mob });
    await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await c.newPage(); await p.goto('http://localhost:8730/kit/light/demo.html'); await p.waitForTimeout(2500);
    const r = await p.evaluate(() => ({ H: document.documentElement.scrollHeight, iw: innerWidth, secs: [...document.querySelectorAll('main > section')].map(e => (e.id || e.className.split(' ')[0]) + ':' + Math.round(e.offsetHeight)), foot: document.querySelector('footer').offsetHeight }));
    console.log(mob ? 'mobile' : 'plain', JSON.stringify(r));
    await c.close();
  }
  await b.close();
})();
