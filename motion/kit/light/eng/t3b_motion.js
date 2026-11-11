const { launch, ctx, URL, PORT, INSTRUMENT } = require('./common');
const INS2 = () => {
  window.__kraf = 0; const r = window.requestAnimationFrame;
  window.requestAnimationFrame = function (f) { if (/shader\.js/.test(new Error().stack)) window.__kraf++; return r.call(window, f); };
  window.__draws = 0; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap;
  ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); };
};
const rate = async (p, ms) => { const a = await p.evaluate(() => [window.__draws, window.__kraf, performance.now()]); await p.waitForTimeout(ms); const z = await p.evaluate(() => [window.__draws, window.__kraf, performance.now()]); const s = (z[2] - a[2]) / 1000; return `draws ${(z[0] - a[0])} (${((z[0] - a[0]) / s).toFixed(1)}/s) kit rAF ${(z[1] - a[1])} (${((z[1] - a[1]) / s).toFixed(1)}/s)`; };
(async () => {
  const b = await launch();
  // 1. portable under reduced motion: does the tab swap animate?
  for (const [nm, url, o, pre] of [['portable reduced-motion', PORT, { reducedMotion: 'reduce' }, null], ['portable data-motion=off (saved)', PORT, {}, 'off'], ['demo data-motion=off (saved)', URL, {}, 'off'], ['demo reduced-motion', URL, { reducedMotion: 'reduce' }, null], ['demo normal', URL, {}, null]]) {
    const c = await ctx(b, Object.assign({ viewport: { width: 390, height: 844 } }, o));
    const p = await c.newPage(); await p.addInitScript(INS2);
    if (pre) await p.addInitScript(v => { try { localStorage.setItem('kws-motion', v); } catch (e) {} }, pre);
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelector('.kws-folders--stack').scrollIntoView({ block: 'start' })); await p.waitForTimeout(700);
    await p.evaluate(() => { const t = document.querySelectorAll('.kws-folders--stack [role=tab]'); t[t.length - 1].click(); });
    const an = await p.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => { const el = document.querySelector('.kws-folders--stack .is-front .kws-folder-body > *'); const cs = getComputedStyle(el); res({ motion: document.documentElement.getAttribute('data-motion'), rm: matchMedia('(prefers-reduced-motion: reduce)').matches, animName: cs.animationName, dur: cs.animationDuration, running: document.getAnimations().filter(a => a.animationName === 'kws-front' && a.playState === 'running').length, opacityNow: cs.opacity, transformNow: cs.transform }); }))));
    console.log(nm, JSON.stringify(an));
    await c.close();
  }
  // 2. paused: scroll around, attribute rAFs to the kit
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 } });
    const p = await c.newPage(); await p.addInitScript(INS2); await p.addInitScript(() => { try { localStorage.setItem('kws-motion', 'off'); } catch (e) {} });
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    console.log('paused at top (steady):', await rate(p, 3000));
    await p.evaluate(() => document.querySelector('#services .kws-marks').scrollIntoView({ block: 'center', behavior: 'instant' }));
    console.log('paused, just scrolled to cards:', await rate(p, 2000));
    console.log('paused, steady at cards:', await rate(p, 3000));
    // theme toggle while paused
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    console.log('paused, theme toggled:', await rate(p, 2000));
    await c.close();
  }
  // 3. background tab emulated by overriding document.hidden + visibilitychange (script logic only)
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 } });
    const p = await c.newPage(); await p.addInitScript(INS2);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    console.log('visible:', await rate(p, 2000));
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(300);
    console.log('hidden (emulated; rAF still firing in this harness):', await rate(p, 3000));
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(300);
    console.log('visible again:', await rate(p, 2000));
    await c.close();
  }
  await b.close();
})();
