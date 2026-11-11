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
  const r = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const host = document.querySelector('#services .kws-mark-art');
    const out = [];
    for (const kind of ['ribbon', 'wash', 'band']) {
      const el = document.createElement('span'); el.className = 'kws-shader'; el.setAttribute('data-shader', kind);
      host.appendChild(el);
      const off = KWS.shader.mount(el, { seed: 3 });
      for (let i = 0; i < 4; i++) { await wait(100); out.push(kind + ' ' + el.classList.contains('is-live') + ':' + (el.querySelector('canvas') ? el.querySelector('canvas').width : 'none') + ' ' + JSON.stringify(el.getBoundingClientRect().toJSON()).slice(0, 60)); }
      off(); el.remove();
    }
    return out;
  });
  console.log(r.join('\n'));
  await b.close();
})();
