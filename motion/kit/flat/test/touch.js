// Touch at 390px, with real touch events: the page keeps every swipe that is more up-and-down than sideways, the carousel takes
// every other one (no dead band between the two), the thing under the finger follows it, and a flick cannot run away.
const { chromium, say, done, open, on, bring, swipe } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const { ctx, p, errs } = await open(b, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const cdp = await ctx.newCDPSession(p);
  const reset = (sel, i) => p.evaluate(([s, i]) => { const el = document.querySelector(s), name = s.includes('arc') ? 'arc' : 'spotlight'; document.documentElement.dataset.motion = 'off';
    const dots = el.querySelectorAll('[class$="-dot"]'); if (dots.length) dots[i].click(); else { KWS[name].mount(el)(); el.dataset.start = i; KWS[name].mount(el); } delete document.documentElement.dataset.motion; }, [sel, i]);
  for (const [name, sel, part] of [['wheel sign', '#services .kws-arc', '.kws-arc-tile'], ['wheel caption', '#services .kws-arc', '.kws-arc-cap'], ['spotlight card', '#work .kws-spot', '.kws-spot-frame'], ['spotlight caption', '#work .kws-spot', '.kws-spot-cap']]) {
    await bring(p, sel);
    const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const x = box.x + box.width / 2, y = box.y + Math.min(box.height / 2, 40);
    // straight up
    let y0 = await p.evaluate(() => scrollY); await swipe(p, cdp, x, y, x + 4, y - 220); await p.waitForTimeout(700);
    let y1 = await p.evaluate(() => scrollY); say(`${name}: a vertical swipe that starts on it scrolls the page and does not turn it`, y1 - y0 > 150 && await on(p, sel) === 0, `page moved ${Math.round(y1 - y0)}px, item ${await on(p, sel) + 1}`);
    await p.evaluate(v => scrollTo(0, v), y0); await p.waitForTimeout(250);
    // every angle from 20 to 70 degrees off horizontal: one of the two must happen, never neither
    const dead = [], log = [];
    for (const deg of [20, 30, 34, 37, 40, 42, 44, 47, 50, 60, 70]) {
      await reset(sel, 0); await p.evaluate(v => scrollTo(0, v), y0); await p.waitForTimeout(250);
      const rad = deg * Math.PI / 180; await swipe(p, cdp, x + 40, y, x + 40 - 170 * Math.cos(rad), y - 170 * Math.sin(rad), { steps: 14 }); await p.waitForTimeout(900);
      const moved = Math.round(await p.evaluate(() => scrollY) - y0), i = await on(p, sel);
      log.push(`${deg}°:${Math.abs(moved) > 20 ? 'page' : ''}${i !== 0 ? 'turn' : ''}`); if (Math.abs(moved) <= 20 && i === 0) dead.push(deg);
    }
    say(`${name}: slanted swipes from 20° to 70° off horizontal either turn the carousel or scroll the page, never nothing`, dead.length === 0, log.join(' '));
    await reset(sel, 0); await p.evaluate(v => scrollTo(0, v), y0); await p.waitForTimeout(250);
    // sideways
    await swipe(p, cdp, x + 60, y, x - 120, y + 10); await p.waitForTimeout(1000);
    y1 = await p.evaluate(() => scrollY); const i1 = await on(p, sel);
    say(`${name}: a 180px sideways swipe turns it and the page stays put`, Math.abs(y1 - y0) < 2 && i1 > 0, `page moved ${Math.round(y1 - y0)}px, item 1 to ${i1 + 1}`);
    await reset(sel, 0); await p.waitForTimeout(200);
    // a slow, deliberate swipe of 60px, well short of half a step, still moves one item on
    await swipe(p, cdp, x + 30, y, x - 30, y, { steps: 20, gap: 30, hold: 250 }); await p.waitForTimeout(1000);
    say(`${name}: a slow 60px swipe moves exactly one item on`, await on(p, sel) === 1, `item ${await on(p, sel) + 1}`);
    await swipe(p, cdp, x - 30, y, x + 30, y, { steps: 20, gap: 30, hold: 250 }); await p.waitForTimeout(1000);
    say(`${name}: and the same swipe the other way comes back`, await on(p, sel) === 0, `item ${await on(p, sel) + 1}`);
    // a 20px nudge is not a swipe
    await swipe(p, cdp, x + 10, y, x - 12, y, { steps: 8, gap: 30, hold: 200 }); await p.waitForTimeout(900);
    say(`${name}: a 22px nudge springs back`, await on(p, sel) === 0, `item ${await on(p, sel) + 1}`);
  }
  // The thing under the finger follows it: over the first 60px of a drag the card or sign moves with the finger
  for (const [name, sel, part, least] of [['wheel sign', '#services .kws-arc', '.kws-arc-tile', .9], ['spotlight card', '#work .kws-spot', '.kws-spot-frame', .85]]) {
    await reset(sel, 0); await bring(p, sel);
    const el = p.locator(`${sel} li.is-on ${part}`); const box = await el.boundingBox(); const x = box.x + box.width / 2, y = box.y + 40;
    const cx = async () => { const r = await p.locator(`${sel} li >> nth=0 >> ${part}`).boundingBox(); return r.x + r.width / 2; };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 4, y, id: 1 }] }); await p.waitForTimeout(20); }
    const c0 = await cx();   // the drag has been taken by now; measure from here
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 24 - i * 6, y, id: 1 }] }); await p.waitForTimeout(20); }
    await p.waitForTimeout(80); const c1 = await cx();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(1000);
    say(`${name}: follows the finger (it travels at least ${least * 100}% of the next 60px of finger travel)`, (c0 - c1) / 60 >= least && (c0 - c1) / 60 <= 1.1, `${(c0 - c1).toFixed(0)}px for 60px`);
  }
  // A fast flick on the wheel: three signs show on a phone, so it may not go more than two on
  { const sel = '#services .kws-arc'; await reset(sel, 3); await bring(p, sel);
    const box = await p.locator(`${sel} li.is-on .kws-arc-tile`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 30; const far = [];
    for (const [dist, steps, gap] of [[120, 4, 8], [200, 5, 8], [250, 5, 10]]) {
      await reset(sel, 3); await p.waitForTimeout(150);
      await swipe(p, cdp, x + dist / 2, y, x - dist / 2, y, { steps, gap }); await p.waitForTimeout(1300); far.push((await on(p, sel)) - 3);
    }
    say('wheel: fast flicks of 120, 200 and 250px carry on, but never more than two signs', far.every(d => d >= 1 && d <= 2), 'moved on by ' + far.join(', '));
    const t = await p.evaluate(s => document.querySelector(s + ' li.is-on .kws-arc-tile').style.transform, sel);
    say('wheel: and it settles exactly on a sign', /translate\(0(\.00)?px, ?0(\.00)?px\) rotate\(0(\.00)?deg\) scale\(1(\.00)?\)/.test(t), t); }
  { const sel = '#work .kws-spot'; await reset(sel, 0); await bring(p, sel);
    const box = await p.locator(`${sel} li.is-on .kws-spot-frame`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 40;
    await swipe(p, cdp, x + 100, y, x - 150, y, { steps: 5, gap: 8 }); await p.waitForTimeout(1300);
    say('spotlight: a fast 250px flick moves one card, not two', await on(p, sel) === 1, `item ${await on(p, sel) + 1}`); }
  say('no page errors', errs.length === 0, errs.join('|'));
  await done(b);
})();
