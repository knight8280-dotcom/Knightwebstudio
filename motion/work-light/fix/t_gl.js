// Context loss and leaks. node t_gl.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = 'http://localhost:8730/kit/light/'; let fails = 0;
const ok = (n, c, i) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (i !== undefined ? '  [' + JSON.stringify(i) + ']' : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const motion of ['on', 'off']) {
    const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await c.addInitScript(m => { try { localStorage.setItem('kws-motion', m); } catch (e) {} window.__gl = []; const g = OffscreenCanvas.prototype.getContext; OffscreenCanvas.prototype.getContext = function (t) { const x = g.apply(this, arguments); if (x && /webgl/.test(t)) window.__gl.push(x); return x; }; }, motion);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
    await p.goto(BASE + 'demo.html'); await p.waitForFunction(() => document.querySelectorAll('.kws-shader.is-live').length === 11, null, { timeout: 20000 });
    const r = await p.evaluate(async () => {
      const live = () => [...document.querySelectorAll('.kws-shader')].filter(e => e.classList.contains('is-live')).length, n0 = live(), ctx0 = window.__gl.length;
      window.__gl[window.__gl.length - 1].getExtension('WEBGL_lose_context').loseContext();
      await new Promise(r => setTimeout(r, 120)); const mid = live();
      for (let i = 0; i < 80 && live() < n0; i++) await new Promise(r => setTimeout(r, 100));
      return { n0, mid, after: live(), contexts: window.__gl.length - ctx0, lost: window.__gl[ctx0 - 1].isContextLost() };
    });
    ok(`context lost with motion ${motion}: the stills show at once, then every layer is redrawn on a new context`, r.n0 === 11 && r.mid < r.n0 && r.after === r.n0 && r.contexts === 1 && errs.length === 0, { ...r, errs });
    // a second loss where no new context can be made: stills, and the loop ends
    const r2 = await p.evaluate(async () => {
      const g = OffscreenCanvas.prototype.getContext; OffscreenCanvas.prototype.getContext = function () { return null; };
      let rafs = 0; const ra = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { rafs++; return ra.call(window, f); };
      window.__gl[window.__gl.length - 1].getExtension('WEBGL_lose_context').loseContext();
      await new Promise(r => setTimeout(r, 900)); const a = rafs; await new Promise(r => setTimeout(r, 900));
      return { live: document.querySelectorAll('.kws-shader.is-live').length, spinning: rafs - a };
    });
    ok(`context lost for good, motion ${motion}: every layer back to its still, and no frames are asked for`, r2.live === 0 && r2.spinning === 0 && errs.length === 0, { ...r2, errs });
    await c.close();
  }
  {   // leaks: stacks, buttons and layers removed from the page without their removers
    const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await c.newPage(); const cdp = await c.newCDPSession(p); await cdp.send('Performance.enable');
    await p.goto(BASE + 'portable.html?theme=light'); await p.waitForTimeout(1800);
    const metrics = async () => { await cdp.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(150); await cdp.send('HeapProfiler.collectGarbage'); const m = (await cdp.send('Performance.getMetrics')).metrics; const g = k => m.find(x => x.name === k).value; return { nodes: g('Nodes'), listeners: g('JSEventListeners') }; };
    const cycle = () => p.evaluate(async () => {
      const wrap = document.createElement('section'); wrap.className = 'kws-shader-host';
      wrap.innerHTML = '<div class="kws-shader" data-shader="band"></div><button class="kws-motion" type="button" hidden><span class="kws-motion-label"></span></button><div class="kws-folders kws-folders--stack kws-folders--phone">' + [1, 2, 3, 4].map(i => `<article class="kws-folder"><h3 class="kws-folder-tab">[T${i}] <b>[P]</b></h3><div class="kws-folder-body"><p>[x] <a href="#x${i}">[link]</a></p><div class="kws-mark-art" style="position:relative;height:60px"><span class="kws-shader" data-shader="ribbon"></span></div></div></article>`).join('') + '</div>';
      document.body.appendChild(wrap);
      KWS.folders.mount(wrap.querySelector('.kws-folders')); KWS.motion.mount(wrap.querySelector('.kws-motion')); wrap.querySelectorAll('.kws-shader').forEach(e => KWS.shader.mount(e));
      await new Promise(r => setTimeout(r, 250)); wrap.remove(); await new Promise(r => setTimeout(r, 250));
    });
    await cycle(); await cycle(); await p.evaluate(() => KWS.motion.set(KWS.motion.off()));   // warm up; a set() lets motion.js forget buttons that have left
    const a = await metrics();
    for (let i = 0; i < 12; i++) await cycle();
    await p.evaluate(() => { KWS.motion.set(KWS.motion.off()); window.dispatchEvent(new HashChangeEvent('hashchange')); });
    const z = await metrics();
    ok('12 cycles of a stack, a pause button, a band and four ribbons added, mounted and removed from the page without their removers: nodes and listeners do not grow', z.nodes - a.nodes <= 20 && z.listeners - a.listeners <= 2, { before: a, after: z });
    await c.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
