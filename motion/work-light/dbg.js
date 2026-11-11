const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  p.on('console', m => console.log('console:', m.type(), m.text().slice(0, 200)));
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('http://localhost:8730/kit/light/demo.html'); await p.waitForTimeout(2000);
  const r = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const host = document.querySelector('#top');
    const el = document.createElement('div'); el.className = 'kws-shader'; el.setAttribute('data-shader', 'ribbon'); el.style.cssText = 'left:auto;top:120px;right:40px;bottom:auto;width:300px;height:200px;z-index:5';
    host.appendChild(el);
    const off = KWS.shader.mount(el, { seed: 3 });
    const out = [];
    for (let i = 0; i < 6; i++) { await wait(100); out.push(el.classList.contains('is-live') + ':' + (el.querySelector('canvas') ? el.querySelector('canvas').width : 'none')); }
    return out;
  });
  console.log(r);
  await p.screenshot({ path: 'dbg.png' });
  // touch debugging
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await ctx2.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p2 = await ctx2.newPage(); await p2.goto('http://localhost:8730/kit/light/demo.html'); await p2.waitForTimeout(1500);
  const cdp = await ctx2.newCDPSession(p2);
  for (const type of ['touch', 'mouse']) {
    const y0 = await p2.evaluate(() => scrollY);
    await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 500, yDistance: -300, speed: 800, gestureSourceType: type });
    await p2.waitForTimeout(800);
    console.log(type, 'scrolled', (await p2.evaluate(() => scrollY)) - y0);
  }
  await b.close();
})();
