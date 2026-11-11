// A finger that starts on any part of the band, the card, the footer or the skyline scrolls the page; nothing takes the
// gesture, nothing scrolls sideways, and a tap still follows the link.   node touch.js
const { chromium } = require('playwright');
const url = 'http://localhost:8730/kit/closing/test/pricing-with-kit.html';
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  let fails = 0;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(p);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const swipe = async (x0, y0, x1, y1, steps = 12, gap = 16) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
    for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps, id: 1 }] }); await p.waitForTimeout(gap); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  for (const [name, sel] of [['band title', '.kws-close-title'], ['card booking button', '.kws-appt .kws-btn'], ['band enquiry button', '.kws-close-acts .kws-btn'], ['footer phone number', '.kws-foot-tel'], ['footer link', '.kws-foot nav[aria-label="Services"] li a'], ['pause button', '.kws-foot .kws-motion']]) {
    await p.evaluate(s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 560); }, sel);
    await p.waitForTimeout(200);
    const box = await p.locator(sel).first().boundingBox(), x = box.x + Math.min(box.width / 2, 120), y = box.y + box.height / 2;
    const y0 = await p.evaluate(() => scrollY);
    // at the very end of the page there is nothing left to scroll to: swipe the other way there
    const room = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY), dir = room < 300 ? 1 : -1;
    await swipe(x, y, x + 6, y + dir * 260);
    await p.waitForTimeout(700);
    const dy = Math.abs((await p.evaluate(() => scrollY)) - y0);
    const b2 = await p.locator(sel).first().boundingBox();
    if (b2 && b2.y > 60 && b2.y < 780) await swipe(b2.x + Math.min(b2.width / 2, 120) + 60, b2.y + b2.height / 2, b2.x + Math.min(b2.width / 2, 120) - 110, b2.y + b2.height / 2 + 6);
    await p.waitForTimeout(500);
    const sx = await p.evaluate(() => scrollX), href = await p.evaluate(() => location.pathname);
    const ok = dy > 180 && sx === 0 && /pricing-with-kit/.test(href);
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  swipe ${dir < 0 ? 'up' : 'down'} from the ${name}: page scrolled ${Math.round(dy)}px of 260; sideways swipe moved the page ${sx}px; still on the page`);
  }
  // the scene at the very end: swipe down from it scrolls back up
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(200);
  const y1 = await p.evaluate(() => scrollY);
  await swipe(195, 560, 199, 800); await p.waitForTimeout(700);
  const up = y1 - await p.evaluate(() => scrollY);
  console.log(`${up > 180 ? 'PASS' : (fails++, 'FAIL')}  swipe down from the skyline scene: page scrolled back ${Math.round(up)}px of 240`);
  // a tap is still a tap
  await p.evaluate(() => { const e = document.querySelector('.kws-close-acts .kws-btn'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 400); }); await p.waitForTimeout(150);
  await p.tap('.kws-close-acts .kws-btn'); await p.waitForURL('**/contact/', { timeout: 8000 }).catch(() => {});
  const went = new URL(p.url()).pathname;
  console.log(`${went === '/contact/' ? 'PASS' : (fails++, 'FAIL')}  tap on "Send an enquiry" follows the link: ${went}`);
  await b.close();
  process.exit(fails ? 1 : 0);
})();
