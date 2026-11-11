// Reduced motion and html[data-motion=off]: nothing animates, everything complete, still operable by every input.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const log = (ok, name, extra = '') => console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'}  ${name}  ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`);
(async () => {
  const b = await chromium.launch();
  for (const mode of ['prefers-reduced-motion', 'data-motion=off']) for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spot', '#work .kws-spot', '.kws-spot-frame']]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, reducedMotion: mode === 'prefers-reduced-motion' ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(() => { window.__raf = 0; window.__rafOther = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { if (/arc\.js|spotlight\.js/.test(new Error().stack)) window.__raf++; else window.__rafOther++; return r.call(window, f); }; window.__tf = 0; });
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500); if (mode !== 'prefers-reduced-motion') await p.click('#demo-motion');
    await scrollToSel(p, sel, 180); await p.waitForTimeout(300); const cdp = await ctx.newCDPSession(p); const n = await p.locator(`${sel} li`).count();
    // count style mutations (any inline style write) and transitions/animations running
    await p.evaluate(s => { const el = document.querySelector(s); window.__mut = []; new MutationObserver(m => window.__mut.push([Math.round(performance.now()), m.length])).observe(el, { subtree: true, attributes: true, attributeFilter: ['style'] }); }, sel);
    const raf0 = await p.evaluate(() => window.__raf);
    const steps = [];
    const rec = async label => { const s = await state(p, sel); const anim = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length); steps.push([label, s.on, s.moving, anim]); return s; };
    // same-task check for Next
    const same = await p.evaluate(s => { const el = document.querySelector(s); el.querySelector('button[aria-label^="Next"]').click(); return { on: [...el.querySelectorAll('li')].findIndex(l => l.classList.contains('is-on')), moving: el.classList.contains('is-moving'), said: el.querySelector('[aria-live]').textContent }; }, sel);
    steps.push(['next (read in the same task)', same.on, same.moving, 0]);
    await p.locator(`${sel} [class$=-dot]`).nth(n - 1).click(); await rec('last dot');
    await p.keyboard.press('ArrowLeft'); await rec('ArrowLeft');
    await p.locator(`${sel} li`).nth(0).locator('a').focus(); await rec('focus item 1 link');
    // touch swipe left 120px
    const bx = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const x = bx.x + bx.width / 2, y = bx.y + 30; const tfBefore = (await state(p, sel)).tf.join();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); let followed = false;
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 12, y, id: 1 }] }); await p.waitForTimeout(16); if ((await state(p, sel)).tf.join() !== tfBefore) followed = true; }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(80); const sw = await rec('touch swipe 120px left');
    // vertical swipe still scrolls
    const y0 = await p.evaluate(() => scrollY); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 2 }] }); for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 20, id: 2 }] }); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500); const dy = (await p.evaluate(() => scrollY)) - y0;
    const raf = (await p.evaluate(() => window.__raf)) - raf0; const wc = await p.evaluate(s => getComputedStyle(document.querySelector(s + ' .kws-arc-tile,' + s + ' .kws-spot-frame')).willChange, sel);
    const ok = steps[0][1] === 1 && !steps.some(s => s[2]) && steps[1][1] === n - 1 && steps[2][1] === n - 2 && steps[3][1] === 0 && sw.on === 1 && !followed && raf === 0 && dy > 100;
    log(ok, `${mode} ${name}: next/dot/key/focus/swipe all change item instantly; drag does not follow the finger; 0 animation frames; vertical swipe still scrolls`, { steps, dragFollowedFinger: followed, rafRequested: raf, pageScrolledBy: dy, willChangeAfter: wc });
    await ctx.close();
  }
  await b.close();
})();
