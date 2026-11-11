// 2. Reduced motion, data-motion="off", the pause control in the footer; does anything move by itself.
const { launch, open, end } = require('./common');
const nameState = p => p.evaluate(() => [...document.querySelectorAll('.kws-skyline-name')].map(m => { const a = m.getAnimations()[0]; return { n: m.getAnimations().length, y: +new DOMMatrix(getComputedStyle(m).transform).m42.toFixed(2), prog: a ? +(a.effect.getComputedTiming().progress || 0).toFixed(3) : null, tl: a && a.timeline ? a.timeline.constructor.name : '', state: a && a.playState }; }));
const INS = () => { window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { window.__raf++; return r.call(window, f); }; window.__draws = 0; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap; ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); }; };
(async () => {
  const b = await launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    // A. normal: is the name still when nobody scrolls? sample at 8 scroll offsets through its entry
    {
      const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: h } }, init: INS });
      await p.waitForTimeout(1500);
      const H = await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; return document.documentElement.scrollHeight; });
      const sky = await p.evaluate(() => { const s = document.querySelector('.kws-skyline').getBoundingClientRect(); return { top: s.top + scrollY, h: s.height }; });
      const rows = [];
      for (let k = 0; k <= 6; k++) {
        const y = Math.round(sky.top - h + (sky.h * k) / 6);
        await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(150);
        const a = (await nameState(p))[0]; await p.waitForTimeout(700); const a2 = (await nameState(p))[0];
        rows.push(`${k}/6: y=${a.y}px prog=${a.prog} drift=${(a2.y - a.y).toFixed(2)}`);
      }
      console.log(`[${w}] name vs scroll (timeline ${(await nameState(p))[0].tl}): ${rows.join(' | ')}`);
      // moving by itself for >5s? count shader draws while the band + footer sit on screen untouched, and whether a pause control is on the page
      await p.evaluate(() => { const c = document.querySelector('.kws-close'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 40); });
      await p.waitForTimeout(800);
      const d0 = await p.evaluate(() => window.__draws); await p.waitForTimeout(6000); const d1 = await p.evaluate(() => window.__draws);
      const btn = await p.evaluate(() => { const bs = [...document.querySelectorAll('.kws-motion')].filter(b => !b.hidden); const q = bs[0] && bs[0].getBoundingClientRect(); const c = document.querySelector('.kws-close').getBoundingClientRect(); return { n: bs.length, label: bs[0] && bs[0].getAttribute('aria-label'), pressed: bs[0] && bs[0].getAttribute('aria-pressed'), title: bs[0] && bs[0].title, size: q && Math.round(q.width) + 'x' + Math.round(q.height), below: q && Math.round(q.top - c.bottom), inFoot: bs[0] && !!bs[0].closest('.kws-foot') }; });
      console.log(`[${w}] band on screen 6s untouched: shader drew ${d1 - d0} frames (moves by itself, >5s). Pause control: ${JSON.stringify(btn)}  (px below the band's bottom edge: ${btn.below})`);
      // B. the pause button: click, state, persistence, label, draws stop
      await p.evaluate(() => document.querySelector('.kws-foot .kws-motion').scrollIntoView({ block: 'center' }));
      await p.waitForTimeout(300);
      await p.click('.kws-foot .kws-motion');
      await p.waitForTimeout(400);
      const s1 = await p.evaluate(() => ({ motion: document.documentElement.getAttribute('data-motion'), ls: localStorage.getItem('kws-motion'), label: document.querySelector('.kws-foot .kws-motion').getAttribute('aria-label'), focusStays: document.activeElement === document.querySelector('.kws-foot .kws-motion'), live: [...document.querySelectorAll('[aria-live]')].map(e => e.getAttribute('aria-live') + ':' + e.textContent.trim()).join('|') }));
      await p.evaluate(() => { const c = document.querySelector('.kws-skyline'); scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight + 30); }); await p.waitForTimeout(300);
      const nm = (await nameState(p))[0];
      const e0 = await p.evaluate(() => window.__draws); await p.waitForTimeout(3000); const e1 = await p.evaluate(() => [window.__draws, window.__raf]);
      const r0 = e1[1]; await p.waitForTimeout(2000); const r1 = await p.evaluate(() => window.__raf);
      console.log(`[${w}] after clicking pause: ${JSON.stringify(s1)}; name anims ${nm.n}, y=${nm.y}; shader draws in next 3s: ${e1[0] - e0}; rAF calls in 2s: ${r1 - r0}`);
      await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
      const s2 = await p.evaluate(() => ({ motion: document.documentElement.getAttribute('data-motion'), label: document.querySelector('.kws-foot .kws-motion').getAttribute('aria-label'), hidden: document.querySelector('.kws-foot .kws-motion').hidden }));
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const c = document.querySelector('.kws-skyline'); scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight + 30); }); await p.waitForTimeout(600);
      const nm2 = (await nameState(p))[0]; const f0 = await p.evaluate(() => window.__draws); await p.waitForTimeout(2500); const f1 = await p.evaluate(() => window.__draws);
      console.log(`[${w}] after reload (persisted?): ${JSON.stringify(s2)}; name anims ${nm2.n}, y=${nm2.y}; draws in 2.5s at the footer: ${f1 - f0}`);
      await p.keyboard.press('Tab'); // keyboard operable?
      await p.focus('.kws-foot .kws-motion'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
      const s3 = await p.evaluate(() => ({ motion: document.documentElement.getAttribute('data-motion'), label: document.querySelector('.kws-foot .kws-motion').getAttribute('aria-label'), ls: localStorage.getItem('kws-motion') }));
      await p.keyboard.press('Space'); await p.waitForTimeout(300);
      const s4 = await p.evaluate(() => document.documentElement.getAttribute('data-motion'));
      console.log(`[${w}] keyboard: Enter -> ${JSON.stringify(s3)}; Space -> data-motion=${s4}; console: ${p.errs.join(' | ') || 'clean'}`);
      await p.context().close();
    }
    // C. prefers-reduced-motion
    for (const url of ['test/pricing-with-kit.html', 'portable.html', 'demo.html']) {
      const p = await open(b, url, { ctx: { viewport: { width: w, height: h }, reducedMotion: 'reduce' }, init: INS });
      await p.waitForTimeout(1200);
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const c = document.querySelector('.kws-skyline-name').parentElement; scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight + 30); }); await p.waitForTimeout(500);
      const nm = await nameState(p);
      const d0 = await p.evaluate(() => window.__draws); await p.waitForTimeout(2500); const d1 = await p.evaluate(() => window.__draws);
      const tr = await p.evaluate(() => { const o = {}; for (const s of ['.kws-close-btn', '.kws-appt-btn', '.kws-foot-go', '.kws-motion']) { const e = document.querySelector(s); if (e) o[s] = getComputedStyle(e).transitionDuration + '/' + getComputedStyle(e).transitionProperty; } o.anims = document.getAnimations().length; o.motion = document.documentElement.getAttribute('data-motion'); o.btnHidden = [...document.querySelectorAll('.kws-motion')].map(b => b.hidden); return o; });
      console.log(`[${w}] reduced motion ${url}: name ${JSON.stringify(nm.map(n => [n.n, n.y]))}; shader draws in 2.5s ${d1 - d0}; ${JSON.stringify(tr)}`);
      // hover lift still animated?
      await p.context().close();
    }
    // D. data-motion=off set before load (no JS toggling), script off too
    for (const js of [true, false]) {
      const p = await open(b, 'portable.html', { ctx: { viewport: { width: w, height: h }, javaScriptEnabled: js } });
      await p.evaluate(() => { document.documentElement.setAttribute('data-motion', 'off'); document.documentElement.style.scrollBehavior = 'auto'; const c = document.querySelector('.kws-skyline'); scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight + 30); });
      await p.waitForTimeout(300);
      console.log(`[${w}] portable.html data-motion=off (js ${js}): name ${JSON.stringify((await nameState(p)).map(n => [n.n, n.y]))}`);
      await p.context().close();
    }
  }
  await b.close();
})();
