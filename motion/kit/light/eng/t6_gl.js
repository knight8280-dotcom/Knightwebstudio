const { launch, ctx, URL, PORT, chromium } = require('./common');
const INS = () => {
  window.__draws = 0; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap;
  ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); };
  window.__ctxs = []; const g = OffscreenCanvas.prototype.getContext;
  OffscreenCanvas.prototype.getContext = function (t, a) { const c = g.apply(this, arguments); if (c && /webgl/.test(t)) window.__ctxs.push(c); return c; };
};
const state = p => p.evaluate(() => ({ canvases: document.querySelectorAll('.kws-shader canvas').length, live: document.querySelectorAll('.kws-shader.is-live').length, ctxs: window.__ctxs ? window.__ctxs.length : null, lost: window.__ctxs ? window.__ctxs.filter(c => c.isContextLost()).length : null, draws: window.__draws }));
(async () => {
  const b = await launch();
  // 0. failIfMajorPerformanceCaveat here?
  { const c = await ctx(b); const p = await c.newPage(); await p.goto(PORT);
    console.log('renderer:', await p.evaluate(() => { const r = {}; for (const f of [false, true]) { const cv = new OffscreenCanvas(2, 2); const gl = cv.getContext('webgl', { failIfMajorPerformanceCaveat: f }); r['failIfMajorPerformanceCaveat=' + f] = gl ? (gl.getExtension('WEBGL_debug_renderer_info') ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL) : 'ctx ok') : null; } return r; }));
    await c.close(); }
  // 1. context loss while running, and while paused
  for (const paused of [false, true]) {
    const c = await ctx(b, { viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); await p.addInitScript(INS);
    if (paused) await p.addInitScript(() => { try { localStorage.setItem('kws-motion', 'off'); } catch (e) {} });
    const errs = []; p.on('console', m => { if (/error|warning/.test(m.type()) && !/ERR_FAILED/.test(m.text())) errs.push(m.text().slice(0, 160)); }); p.on('pageerror', e => errs.push('PE ' + e.message));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    await p.evaluate(() => document.querySelector('#services .kws-marks').scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(1200);
    const s0 = await state(p);
    await p.evaluate(() => { const gl = window.__ctxs[window.__ctxs.length - 1]; window.__ext = gl.getExtension('WEBGL_lose_context'); window.__ext.loseContext(); });
    await p.waitForTimeout(150);
    const s1 = await state(p);
    await p.waitForTimeout(2500);
    const s2 = await state(p);
    // nudge: scroll a little (IO) and toggle theme
    await p.evaluate(() => scrollBy(0, 30)); await p.waitForTimeout(800); const s3 = await state(p);
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')); await p.waitForTimeout(1200); const s4 = await state(p);
    await p.screenshot({ path: `ctxloss-${paused ? 'paused' : 'running'}.png` });
    console.log(`context loss (${paused ? 'paused' : 'running'}): before ${JSON.stringify(s0)} | +150ms ${JSON.stringify(s1)} | +2.6s ${JSON.stringify(s2)} | after 30px scroll ${JSON.stringify(s3)} | after theme toggle ${JSON.stringify(s4)} | console: ${errs.join(' || ') || 'clean'}`);
    await c.close();
  }
  // 2. mount / remove ten times: memory + contexts + canvases
  {
    const c = await ctx(b, { viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); await p.addInitScript(INS);
    const errs = []; p.on('console', m => { if (/error|warning/.test(m.type()) && !/ERR_FAILED/.test(m.text())) errs.push(m.text().slice(0, 200)); }); p.on('pageerror', e => errs.push('PE ' + e.message));
    const s = await c.newCDPSession(p); await s.send('Performance.enable');
    await p.goto(PORT, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    const mem = async () => { await s.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(200); const m = (await s.send('Performance.getMetrics')).metrics; const g = n => m.find(x => x.name === n).value; return { heapMB: +(g('JSHeapUsedSize') / 1048576).toFixed(2), nodes: g('Nodes'), listeners: g('JSEventListeners') }; };
    const m0 = await mem(); const st0 = await state(p);
    // (a) per-element mount/unmount x10 via API on all layers
    for (let i = 0; i < 10; i++) {
      await p.evaluate(() => { window.__ends = [...document.querySelectorAll('.kws-shader')].map(el => KWS.shader.mount(el)); });
      await p.waitForTimeout(350);
      await p.evaluate(() => { window.__ends.forEach(f => f()); });
      await p.waitForTimeout(120);
    }
    const st1 = await state(p); const m1 = await mem();
    // (b) remove from DOM without cleanup + re-add ×10 (React-less removal), including folders + motion button
    for (let i = 0; i < 10; i++) {
      await p.evaluate(() => { const sec = document.querySelector('.top'); const clone = sec.cloneNode(true); clone.querySelectorAll('canvas').forEach(c => c.remove()); clone.querySelectorAll('.is-live').forEach(c => c.classList.remove('is-live')); window.__old = sec; sec.replaceWith(clone); KWS.shader.mount(clone.querySelector('.kws-shader')); KWS.motion.mount(clone.querySelector('.kws-motion'));
        const st = document.querySelector('.kws-folders--stack'); const c2 = st.cloneNode(true); c2.querySelectorAll('.kws-folders-tabs').forEach(t => t.remove()); c2.classList.remove('is-live', 'is-moved'); c2.querySelectorAll('.kws-folder').forEach(f => { f.classList.remove('is-front'); f.removeAttribute('role'); f.removeAttribute('aria-labelledby'); f.removeAttribute('tabindex'); }); st.replaceWith(c2); KWS.folders.mount(c2); });
      await p.waitForTimeout(350);
    }
    await p.evaluate(() => { window.__old = null; window.__ends = null; });
    await p.waitForTimeout(600);
    const st2 = await state(p); const m2 = await mem();
    console.log('mount/unmount x10 via API: before', JSON.stringify(st0), JSON.stringify(m0), '| after', JSON.stringify(st1), JSON.stringify(m1));
    console.log('remove from DOM without cleanup x10: after', JSON.stringify(st2), JSON.stringify(m2), '| stack tabs lists', await p.evaluate(() => document.querySelectorAll('.kws-folders-tabs').length), '| console:', errs.join(' || ') || 'clean');
    // after API unmount of everything, re-auto-mount works?
    await p.evaluate(() => { document.querySelectorAll('.kws-shader').forEach(el => KWS.shader.mount(el)); scrollTo(0, 0); }); await p.waitForTimeout(1200);
    console.log('remount all:', JSON.stringify(await state(p)));
    // pause button after clone: do old+new stay in sync / does the new one work?
    console.log('pause buttons:', await p.evaluate(() => { const b = document.querySelector('.kws-motion'); const a0 = document.documentElement.getAttribute('data-motion'); b.click(); const a1 = document.documentElement.getAttribute('data-motion'); b.click(); return [a0, a1, document.documentElement.getAttribute('data-motion'), b.getAttribute('aria-label'), b.hidden]; }));
    // double mount of the same motion button
    console.log('motion button mounted twice then clicked once:', await p.evaluate(() => { const b = document.querySelector('.kws-motion'); const before = document.documentElement.getAttribute('data-motion'); const end = KWS.motion.mount(b); b.click(); const after = document.documentElement.getAttribute('data-motion'); end(); return { before, after, changed: before !== after, hiddenAfterOneCleanup: b.hidden }; }));
    await c.close();
  }
  await b.close();
  // 3. Save-Data and no-WebGL fallbacks
  for (const [name, args, init, hdr] of [['Save-Data', [], () => { Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) }); }, { 'Save-Data': 'on' }], ['no WebGL (getContext→null)', [], () => { const g = OffscreenCanvas.prototype.getContext; OffscreenCanvas.prototype.getContext = function (t) { return /webgl/.test(t) ? null : g.apply(this, arguments); }; }, {}], ['no OffscreenCanvas', [], () => { delete window.OffscreenCanvas; }, {}], ['--disable-gpu, no swiftshader flags', null, () => {}, {}]]) {
    const b2 = args === null ? await chromium.launch({ args: ['--disable-gpu', '--disable-software-rasterizer'] }) : await launch();
    const c = await b2.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: hdr }); await c.route(/plausible|hcaptcha|calendly|stripe|onrender/, r => r.abort());
    const p = await c.newPage(); await p.addInitScript(init); const errs = []; p.on('console', m => { if (/error|warning/.test(m.type()) && !/ERR_FAILED/.test(m.text())) errs.push(m.text().slice(0, 200)); }); p.on('pageerror', e => errs.push('PE ' + e.message));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    const r = await p.evaluate(() => ({ canvases: document.querySelectorAll('.kws-shader canvas').length, live: document.querySelectorAll('.kws-shader.is-live').length, btnHidden: [...document.querySelectorAll('.kws-motion')].map(b => b.hidden), stillOpacity: getComputedStyle(document.querySelector('.kws-shader'), '::before').opacity, tabs: document.querySelectorAll('[role=tab]').length }));
    await p.screenshot({ path: `fallback-${name.replace(/[^a-z]+/gi, '-')}.png` });
    console.log(`fallback ${name}:`, JSON.stringify(r), 'console:', errs.join(' || ') || 'clean');
    await b2.close();
  }
})();
