// Touch at 390px: a vertical swipe that starts on a carousel scrolls the page; only a clearly sideways swipe turns it.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(400);
  const cdp = await ctx.newCDPSession(p);
  const swipe = async (x0, y0, x1, y1, steps = 12, gap = 16) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
    for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps, id: 1 }] }); await p.waitForTimeout(gap); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const on = sel => p.evaluate(s => [...document.querySelectorAll(s + ' > ul > li')].findIndex(li => li.classList.contains('is-on')), sel);
  let bad = 0; const say = (name, ok, d) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + name + '  (' + d + ')'); if (!ok) bad++; };
  for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['arc caption', '#services .kws-arc', '.kws-arc-cap'], ['spotlight', '#work .kws-spot', '.kws-spot-frame'], ['spotlight caption', '#work .kws-spot', '.kws-spot-cap']]) {
    await p.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 160); }, sel); await p.waitForTimeout(300);
    const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const x = box.x + box.width / 2, y = box.y + Math.min(box.height / 2, 40);
    const i0 = await on(sel);
    // straight up
    let y0 = await p.evaluate(() => scrollY); await swipe(x, y, x + 4, y - 220); await p.waitForTimeout(700);
    let y1 = await p.evaluate(() => scrollY); say(`${name}: vertical swipe starting on it scrolls the page and does not turn it`, y1 - y0 > 150 && await on(sel) === i0, `page moved ${Math.round(y1 - y0)}px, item ${await on(sel)}`);
    await p.evaluate(v => scrollTo(0, v), y0); await p.waitForTimeout(250);
    // 30 degrees off vertical: still the page's
    y0 = await p.evaluate(() => scrollY); await swipe(x, y, x + 110, y - 200); await p.waitForTimeout(700);
    y1 = await p.evaluate(() => scrollY); say(`${name}: a slanted, mostly vertical swipe still scrolls the page`, y1 - y0 > 120 && await on(sel) === i0, `page moved ${Math.round(y1 - y0)}px, item ${await on(sel)}`);
    await p.evaluate(v => scrollTo(0, v), y0); await p.waitForTimeout(250);
    // sideways
    y0 = await p.evaluate(() => scrollY); await swipe(x + 60, y, x - 120, y + 10); await p.waitForTimeout(1000);
    y1 = await p.evaluate(() => scrollY); const i1 = await on(sel);
    say(`${name}: a 180px sideways swipe turns it (the item follows the finger) and the page stays put`, Math.abs(y1 - y0) < 2 && i1 > i0, `page moved ${Math.round(y1 - y0)}px, item ${i0} to ${i1}`);
    await swipe(x - 60, y, x + 120, y + 6); await p.waitForTimeout(1000);
    say(`${name}: swipe the other way goes back`, await on(sel) === i0, `item ${await on(sel)}`);
  }
  // a quick flick on the wheel carries on past one item
  { const sel = '#services .kws-arc'; await p.evaluate(s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 160); }, sel); await p.waitForTimeout(300);
    const box = await p.locator(`${sel} li.is-on .kws-arc-tile`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 30;
    await swipe(x + 100, y, x - 150, y, 5, 10); await p.waitForTimeout(1200); const i = await on(sel);
    say('arc: a fast flick has a little inertia (more than one item) and still lands exactly on one', i >= 2 && i <= 4, 'item ' + i);
    const t = await p.evaluate(s => document.querySelector(s + ' li.is-on .kws-arc-tile').style.transform, sel);
    say('arc: settled exactly on the item', /translate\(0px, 0px\) rotate\(0deg\) scale\(1\)/.test(t), t); }
  say('no page errors', errs.length === 0, errs.join('|'));
  await b.close(); process.exit(bad ? 1 : 0);
})();
