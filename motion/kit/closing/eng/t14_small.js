// Small checks: kicker lines at phone widths; a two-line place name in the two-up list; composited layers the kit creates; site reveal on the band.
const { launch, open, end } = require('./common');
(async () => {
  const b = await launch();
  for (const w of [320, 344, 360, 375, 390]) {
    const p = await open(b, 'demo.html', { ctx: { viewport: { width: w, height: 800 } } });
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => [...document.querySelectorAll('.kws-close-kicker')].map(k => { const range = document.createRange(); range.selectNodeContents(k); const lines = new Set([...range.getClientRects()].map(q => Math.round(q.top))).size; return k.textContent.trim().slice(0, 12) + ': ' + lines + ' line(s)' + (k.closest('.demo-client') ? ' (client fonts)' : ''); }));
    console.log(`kicker at ${w}px: ${r.join(' | ')}`);
    if (w === 360) {
      const t = await p.evaluate(() => { const ul = document.querySelector('footer .kws-foot-two'); const keep = ul.innerHTML; ul.innerHTML = '<li><a href="#">Baton Rouge</a></li><li><a href="#">St. Francisville and West Feliciana Parish</a></li><li><a href="#">Denham Springs and Livingston Parish</a></li><li><span>Greenwell Springs and Central</span></li><li><span>Baker</span></li>'; const out = [...ul.children].map(li => { const range = document.createRange(); range.selectNodeContents(li); const rs = [...range.getClientRects()].filter(q => q.width > 1); const xs = new Set(rs.map(q => Math.round(q.left / 20))); return li.textContent.slice(0, 16) + ': ' + (xs.size > 1 ? 'SPLIT across columns' : 'whole'); }); ul.innerHTML = keep; return out; });
      console.log('two-up list with two-line names at 360:', t.join(' | '));
    }
    await p.context().close();
  }
  // layers
  for (const [w, h, dpr] of [[390, 844, 3], [1440, 900, 2]]) {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: h }, deviceScaleFactor: dpr } });
    await p.waitForTimeout(1200); await end(p); await p.waitForTimeout(800);
    const s = await p.context().newCDPSession(p);
    const layers = await new Promise(async res => { s.once('LayerTree.layerTreeDidChange', e => res(e.layers || [])); await s.send('LayerTree.enable'); setTimeout(() => res([]), 3000); });
    const big = layers.filter(l => l.drawsContent).map(l => ({ w: Math.round(l.width), h: Math.round(l.height), mb: +(l.width * l.height * 4 * dpr * dpr / 1048576).toFixed(1) })).sort((a, c) => c.mb - a.mb);
    const wc = await p.evaluate(() => [...document.querySelectorAll('.kws-close *, .kws-foot *')].filter(e => getComputedStyle(e).willChange !== 'auto').length);
    console.log(`layers at the page end ${w}px @${dpr}x: ${layers.length} layers, ${big.length} drawing; largest: ${big.slice(0, 5).map(l => l.w + 'x' + l.h + ' ~' + l.mb + 'MB').join(', ')}; elements with will-change in the kit: ${wc}`);
    await p.context().close();
  }
  // does any band on the test pages carry the site's reveal, and is it visible with JS on after scrolling?
  {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: 390, height: 844 } } });
    await p.waitForTimeout(800); await end(p); await p.waitForTimeout(1200);
    console.log('reveal on the band:', await p.evaluate(() => { const r = document.querySelector('.kws-close .reveal, .kws-close.reveal'); return r ? r.className + ' opacity ' + getComputedStyle(r).opacity : 'not used on this page'; }));
    await p.context().close();
  }
  await b.close();
})();
