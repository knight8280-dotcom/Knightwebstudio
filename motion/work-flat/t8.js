const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const name of ['webkit', 'firefox']) {
    const b = await pw[name].launch();
    for (const w of [390, 1280]) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
      for (const sel of ['#services .kws-arc', '#work .kws-spot']) {
        await p.locator(sel).scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
        const r = await p.evaluate(s => new Promise(done => { const el = document.querySelector(s); let n = 0; const t0 = performance.now();
          el.querySelector('[aria-label^="Next"]').click();
          const loop = () => { n++; if (!el.classList.contains('is-moving')) return done({ ms: Math.round(performance.now() - t0), frames: n, said: el.querySelector('output').textContent }); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), sel);
        console.log(name, w, sel, JSON.stringify(r));
      }
      await p.close();
    }
    await b.close();
  }
})();
