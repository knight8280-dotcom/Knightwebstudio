// Motion tests: reduced motion, pause, only-on-screen, hidden tab, leaks, touch scroll, frame times under 4x CPU throttle.
const { chromium } = require('playwright');
const URL = 'http://localhost:8730/kit/light/demo.html';
const ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'];
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
const counter = () => {   // counts the kit's copies to its canvases, and every animation frame asked for
  window.__draws = 0; window.__raf = 0; window.__lastDraw = new Map();
  const d = ImageBitmapRenderingContext.prototype.transferFromImageBitmap;
  ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function () { window.__draws++; window.__lastDraw.set(this.canvas, performance.now()); return d.apply(this, arguments); };
  const r = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { window.__raf++; return r.call(window, f); };
};
const rate = async (p, ms = 2000) => { const a = await p.evaluate(() => [window.__draws, window.__raf]); await p.waitForTimeout(ms); const b = await p.evaluate(() => [window.__draws, window.__raf]); return { draws: (b[0] - a[0]) / ms * 1000, raf: (b[1] - a[1]) / ms * 1000 }; };
const scrollTo = async (p, sel) => { await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 120, behavior: 'instant' }); }, sel); await p.waitForTimeout(700); };
(async () => {
  const b = await chromium.launch({ args: ARGS });

  // ---------- Reduced motion: off by default, one still frame, nothing running ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await block(ctx); await ctx.addInitScript(counter);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(2000);
    const s = await p.evaluate(() => ({ attr: document.documentElement.getAttribute('data-motion'), live: document.querySelectorAll('.kws-shader.is-live').length, label: document.querySelector('.footer-links .kws-motion').getAttribute('aria-label') }));
    ok(s.attr === 'off' && /^Play/.test(s.label), 'reduced motion: starts with data-motion="off"; the button offers "' + s.label + '"');
    const r1 = await rate(p);
    ok(r1.draws === 0 && s.live >= 1, 'reduced motion: ' + s.live + ' layer(s) on screen drew one still frame, then ' + r1.draws + ' draws/s and ' + r1.raf.toFixed(1) + ' animation frames/s asked for');
    await scrollTo(p, '#services .kws-marks');
    const r2 = await rate(p, 1500);
    const live2 = await p.evaluate(() => document.querySelectorAll('.kws-shader.is-live').length);
    ok(r2.draws === 0 && live2 >= 4, 'reduced motion: cards scrolled into view get their still frame (' + live2 + ' layers live) and nothing keeps running (' + r2.draws + ' draws/s)');
    await p.screenshot({ path: 'reduced-cards.png' });
    // tabs switch instantly
    await scrollTo(p, '#pricing .kws-folders');
    await p.click('#pricing [role=tab]:nth-child(3)');
    const an = await p.evaluate(() => { const e = document.querySelector('#pricing .is-front .kws-folder-body > *'); const cs = getComputedStyle(e); return cs.animationName + ' ' + cs.opacity; });
    ok(/^none 1/.test(an), 'reduced motion: choosing a tab swaps the folder at once (animation: ' + an + ')');
    // an explicit press on Play overrides the default
    await p.evaluate(() => document.querySelector('.footer-links .kws-motion').click());
    await scrollTo(p, '#services .kws-marks');
    const r3 = await rate(p, 1500);
    ok(r3.draws > 40, 'reduced motion: pressing Play is an explicit choice and starts the motion (' + r3.draws.toFixed(0) + ' draws/s)');
    await ctx.close();
  }

  // ---------- Running: only layers on screen, 30 a second, pause, hidden tab ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await block(ctx); await ctx.addInitScript(counter);
    const p = await ctx.newPage(); const warns = [];
    p.on('console', m => { if (/WebGL|context/i.test(m.text())) warns.push(m.text()); });
    await p.goto(URL); await p.waitForTimeout(2500);
    const total = await p.evaluate(() => document.querySelectorAll('[data-kws="shader"]').length);
    let r = await rate(p);
    let live = await p.evaluate(() => document.querySelectorAll('.kws-shader.is-live').length);
    ok(r.draws > 24 && r.draws < 36, 'top of page: ' + total + ' layers on the page, 1 on screen: ' + r.draws.toFixed(1) + ' draws/s (one layer at about 30 a second); ' + live + ' live so far');
    await scrollTo(p, '#services .kws-marks');
    r = await rate(p);
    const onScreen = await p.evaluate(() => [...document.querySelectorAll('.kws-shader')].filter(e => { const b = e.getBoundingClientRect(); return b.bottom > -40 && b.top < innerHeight + 40; }).length);
    const drawn = await p.evaluate(() => { const now = performance.now(); return [...window.__lastDraw.entries()].filter(([c, t]) => now - t < 500).length; });
    ok(r.draws > 50 && r.draws < 66 && drawn === onScreen, 'three ribbon cards on screen: ' + r.draws.toFixed(1) + ' draws/s shared by turns between the ' + onScreen + ' layers on screen (' + drawn + ' drawn in the last half second, of ' + total + ' on the page)');
    // pause
    await p.evaluate(() => document.querySelector('.footer-links .kws-motion').click()); await p.waitForTimeout(300);
    r = await rate(p, 1500);
    ok(r.draws === 0 && r.raf < 1, 'paused: ' + r.draws + ' draws/s, ' + r.raf.toFixed(1) + ' animation frames/s asked for');
    const h1 = await p.evaluate(() => document.querySelector('#services canvas').toDataURL().length + ':' + document.querySelector('#services canvas').toDataURL().slice(-60));
    await p.waitForTimeout(800);
    const h2 = await p.evaluate(() => document.querySelector('#services canvas').toDataURL().length + ':' + document.querySelector('#services canvas').toDataURL().slice(-60));
    ok(h1 === h2, 'paused: the canvas holds its last frame, unchanged');
    // theme change while paused repaints once
    const before = await p.evaluate(() => window.__draws);
    await p.evaluate(() => document.getElementById('theme-toggle').click()); await p.waitForTimeout(600);
    const after = await p.evaluate(() => [window.__draws, document.documentElement.getAttribute('data-theme')]);
    ok(after[0] - before >= onScreen && after[0] - before <= onScreen + 1, 'paused: switching theme to ' + after[1] + ' repaints each on-screen layer once (' + (after[0] - before) + ' draws)');
    await p.evaluate(() => document.getElementById('theme-toggle').click());
    await p.evaluate(() => document.querySelector('.footer-links .kws-motion').click());
    r = await rate(p, 1500);
    ok(r.draws > 28, 'resumed: ' + r.draws.toFixed(1) + ' draws/s');
    // hidden tab
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(200);
    r = await rate(p, 1200);
    ok(r.draws === 0, 'background tab: ' + r.draws + ' draws/s');
    await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    r = await rate(p, 1200);
    ok(r.draws > 28, 'tab shown again: ' + r.draws.toFixed(1) + ' draws/s');

    // ---------- mount twice, mount after load, unmount, remove from the page ----------
    const cyc = await p.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const host = document.querySelector('#services .kws-mark-art');
      const out = { canv0: document.querySelectorAll('canvas').length };
      for (let i = 0; i < 40; i++) {
        const el = document.createElement('span'); el.className = 'kws-shader'; el.setAttribute('data-shader', ['ribbon', 'wash', 'band'][i % 3]); el.setAttribute('aria-hidden', 'true');
        host.appendChild(el);
        const off = KWS.shader.mount(el, { seed: i }); const again = KWS.shader.mount(el);
        if (again !== off) out.twice = 'second mount on the same element made a second instance';
        await wait(320);
        if (i === 5) out.liveMid = el.classList.contains('is-live') && !!el.querySelector('canvas');
        off(); off();
        if (el.querySelector('canvas') || el.classList.contains('is-live')) out.left = 'canvas or class left behind';
        el.remove();
      }
      out.canv1 = document.querySelectorAll('canvas').length;
      return out;
    });
    ok(cyc.canv0 === cyc.canv1 && cyc.liveMid && !cyc.left && !cyc.twice, JSON.stringify(cyc) + ' 40 mounts and unmounts after load: canvases before ' + cyc.canv0 + ', after ' + cyc.canv1 + '; nothing left behind; a second mount on one element is the same instance');
    // remove every layer without calling its remover
    const gone = await p.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      document.querySelectorAll('[data-kws="shader"]').forEach(el => el.parentElement.removeChild(el));
      await wait(400); const d0 = window.__draws, r0 = window.__raf; await wait(1500);
      return { draws: window.__draws - d0, raf: window.__raf - r0 };
    });
    ok(gone.draws === 0 && gone.raf <= 2, 'all layers removed from the page without cleanup: the loop notices and stops (' + gone.draws + ' draws, ' + gone.raf + ' animation frames asked for in 1.5s)');
    // all gone: the shared context was released; make new ones many times to prove nothing piles up
    const many = await p.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const host = document.querySelector('#services .kws-mark-art'); let live = 0;
      for (let i = 0; i < 24; i++) { const el = document.createElement('span'); el.className = 'kws-shader'; el.setAttribute('data-shader', 'ribbon'); host.appendChild(el); const off = KWS.shader.mount(el); await wait(300); if (el.classList.contains('is-live')) live++; off(); el.remove(); }
      return live;
    });
    ok(many === 24 && !warns.length, many + ' drew; 24 full start-and-stop cycles (a new WebGL context each time): all drew, no "too many contexts" warning' + (warns.length ? ' WARNINGS: ' + warns.join(' | ') : ''));
    await ctx.close();
  }

  // ---------- Touch: a swipe that starts on a card or the stack scrolls the page ----------
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(1500);
    const cdp = await ctx.newCDPSession(p);
    for (const sel of ['#services .kws-mark-art', '#process .kws-folder-body', '#pricing .kws-folders-tabs', '#pricing .is-front .kws-folder-body', '.cta-band h2']) {
      await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 420, behavior: 'instant' }); }, sel); await p.waitForTimeout(300);
      const y0 = await p.evaluate(() => scrollY);
      const pt = await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + Math.min(r.height / 2, 40)), top: Math.round(r.top) }; }, sel);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y }] });
      for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pt.x + (i % 2), y: pt.y - 300 * i / 12 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await p.waitForTimeout(800);
      const y1 = await p.evaluate(() => scrollY);
      ok(y1 - y0 > 250, 'touch: a 300px swipe up starting on ' + sel + ' scrolls the page ' + (y1 - y0) + 'px');
    }
    // a tap on a tab still selects it
    await p.evaluate(() => { const r = document.querySelector('#pricing .kws-folders-tabs').getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 300, behavior: 'instant' }); }); await p.waitForTimeout(300);
    await p.tap('#pricing [role=tab]:nth-child(4)');
    const fr = await p.evaluate(() => document.querySelector('#pricing .is-front').id);
    ok(fr === 'pkg-commerce', 'touch: a tap on the Commerce tab opens it');
    await ctx.close();
  }
  await b.close();
})();
