const { launch, ctx, URL, PORT } = require('./common');
(async () => {
  const b = await launch();
  for (const pre of [null, 'off']) {
    const c = await ctx(b, { viewport: { width: 390, height: 844 } });
    const p = await c.newPage();
    if (pre) await p.addInitScript(v => { try { localStorage.setItem('kws-motion', v); } catch (e) {} }, pre);
    await p.addInitScript(() => { window.__draws = 0; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap; ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); }; });
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelector('#pricing .kws-folders--stack').scrollIntoView({ block: 'start' })); await p.waitForTimeout(700);
    const r = await p.evaluate(() => { document.querySelectorAll('#pricing [role=tab]')[2].click(); return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res([...document.querySelectorAll('#pricing .is-front .kws-folder-body > *')].map(el => { const cs = getComputedStyle(el); return el.tagName + '.' + el.className + ' anim=' + cs.animationName + ' op=' + (+cs.opacity).toFixed(2) + ' tf=' + cs.transform; }))))); });
    console.log('motion=' + pre, r);
    if (pre) {
      await p.evaluate(() => document.querySelector('#services .kws-marks').scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(1500);
      const d = await p.evaluate(() => new Promise(res => { const a = window.__draws; document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); setTimeout(() => res(window.__draws - a), 1500); }));
      console.log('paused, theme toggle with 3 ribbons on screen → draws:', d);
    }
    await c.close();
  }
  await b.close();
})();
