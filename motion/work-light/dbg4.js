const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  p.on('console', m => { if (!/ERR_FAILED/.test(m.text())) console.log('console:', m.type(), m.text().slice(0, 300)); });
  p.on('pageerror', e => console.log('pageerror:', e.message, e.stack && e.stack.split('\n').slice(0, 4).join(' | ')));
  await p.goto('http://localhost:8730/kit/light/demo.html'); await p.waitForTimeout(2000);
  await p.evaluate(() => { const r = document.querySelector('#services .kws-marks').getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 120, behavior: 'instant' }); });
  await p.waitForTimeout(1000);
  const step = process.argv[2] || 'pause';
  if (step === 'pause') {
    await p.evaluate(() => document.querySelector('.footer-links .kws-motion').click()); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('.footer-links .kws-motion').click()); await p.waitForTimeout(500);
  }
  if (step === 'hidden') {
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(500);
    await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(500);
    console.log('hidden now', await p.evaluate(() => document.hidden));
  }
  if (step === 'theme') { await p.click('#theme-toggle'); await p.waitForTimeout(600); await p.click('#theme-toggle'); await p.waitForTimeout(300); console.log('scrollY', await p.evaluate(() => scrollY)); }
  if (step === 'remove') {
    await p.evaluate(() => document.querySelectorAll('[data-kws="shader"]').forEach(el => el.parentElement.removeChild(el)));
    await p.waitForTimeout(800);
  }
  const r = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const host = document.querySelector('#services .kws-mark-art');
    const out = [];
    for (const kind of ['ribbon', 'ribbon', 'band']) {
      const el = document.createElement('span'); el.className = 'kws-shader'; el.setAttribute('data-shader', kind);
      host.appendChild(el);
      const off = KWS.shader.mount(el, { seed: 3 });
      for (let i = 0; i < 5; i++) { await wait(100); out.push(kind + ' ' + el.classList.contains('is-live') + ':' + (el.querySelector('canvas') ? el.querySelector('canvas').width : 'none')); }
      off(); el.remove();
    }
    return out;
  });
  console.log(step, r.join(' | '));
  await b.close();
})();
