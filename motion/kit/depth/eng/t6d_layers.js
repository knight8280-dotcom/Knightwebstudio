const { chromium, ONE, log } = require('./lib');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const [vw, dpr] of [[390, 2], [390, 3], [820, 2], [1440, 1], [1440, 2]]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: 844 }, deviceScaleFactor: dpr, hasTouch: vw < 1000, isMobile: vw < 1000 });
    const p = await ctx.newPage(); await p.goto(ONE, { waitUntil: 'load' }); await p.waitForTimeout(600);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('LayerTree.enable'); let layers = []; cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) layers = e.layers; });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('.kws-ring-stage'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 150); }); await p.waitForTimeout(900);
    await p.evaluate(() => { document.querySelector('.kws-ring-stage').style.outline = '0px solid red'; }); await p.waitForTimeout(400);
    const withRing = layers.filter(l => l.drawsContent).map(l => ({ w: l.width, h: l.height }));
    await p.evaluate(() => { document.querySelector('.kws-ring-hub').style.display = 'none'; }); await p.waitForTimeout(600);
    const without = layers.filter(l => l.drawsContent).map(l => ({ w: l.width, h: l.height }));
    const area = a => a.reduce((s, l) => s + l.w * l.h, 0);
    const hist = {}; withRing.forEach(l => { const k = l.w + 'x' + l.h; hist[k] = (hist[k] || 0) + 1; });
    const d = area(withRing) - area(without);
    log(`${vw}px dpr ${dpr}: drawing layers with the ring ${withRing.length}, without ${without.length} (ring adds ${withRing.length - without.length}); ring layers' area ${Math.round(d / 1000)}k css px => ${(d * dpr * dpr * 4 / 1048576).toFixed(1)} MB at device resolution if rastered at layout size; sizes: ${Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' x' + v).join(', ')}`);
    await ctx.close();
  }
  await b.close();
})();
