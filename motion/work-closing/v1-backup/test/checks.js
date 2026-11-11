// Contract checks for the closing band, the appointment card, the footer and the skyline scene. One PASS or FAIL line each.
//   node checks.js
// Needs the kit server on :8730. Pages: ../demo.html, ../portable.html and the three "with-kit" copies of real pages.
const { chromium } = require('playwright');
const B = 'http://localhost:8730/kit/closing/';
const ROOTS = '.kws-close, .kws-appt, .kws-foot';
let fails = 0;
const say = (ok, name, detail) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ': ' + detail : ''}`); };

(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const open = async (url, o = {}) => {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, o.ctx));
    if (o.theme) await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, o.theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); p.errs = [];
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) p.errs.push(m.text()); });
    p.on('pageerror', e => p.errs.push(String(e)));
    await p.goto(B + url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts && document.fonts.ready);
    return p;
  };
  const end = p => p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });

  /* 1. Console errors, every page, both themes */
  for (const url of ['demo.html', 'portable.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html', 'test/notfound-with-kit.html']) {
    const errs = [];
    for (const theme of ['light', 'dark']) { const p = await open(url, { theme }); await end(p); await p.waitForTimeout(700); errs.push(...p.errs); await p.context().close(); }
    say(!errs.length, `no console errors: ${url}`, errs.join(' | '));
  }

  /* 2. Script off: everything is there, nothing is a dead control */
  for (const url of ['demo.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html']) {
    const p = await open(url, { ctx: { viewport: { width: 390, height: 844 }, javaScriptEnabled: false } });
    const r = await p.evaluate(ROOTS => {
      const hidden = [], vis = el => { const cs = getComputedStyle(el), q = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > .99 && q.width > 1 && q.height > 1; };
      for (const el of document.querySelectorAll(':is(' + ROOTS + ') :is(a, p, h2, li, dt, dd)')) if (!el.closest('[aria-hidden="true"]') && !vis(el)) hidden.push(el.className || el.tagName);
      const booking = [...document.querySelectorAll(':is(' + ROOTS + ') [data-booking]')].map(a => a.getAttribute('href'));
      const dead = [...document.querySelectorAll(':is(' + ROOTS + ') button')].filter(vis).length;
      return { hidden, booking, dead, scene: !!document.querySelector('.kws-skyline-art') && document.querySelector('.kws-skyline-art').getBoundingClientRect().height };
    }, ROOTS);
    say(!r.hidden.length && !r.dead && r.booking.every(h => h === '/contact/') && r.scene >= 54, `script off: ${url}`,
      `${r.booking.length} booking link(s) go to /contact/, ${r.dead} dead button(s) showing, nothing hidden${r.hidden.length ? ' EXCEPT ' + r.hidden : ''}, skyline ${Math.round(r.scene)}px`);
    await p.context().close();
  }

  /* 3. The name behind the skyline: scroll-linked only, complete at the page end, still when asked */
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: h } } });
    const st = () => p.evaluate(() => { const m = document.querySelector('.kws-skyline-name'), a = m.getAnimations()[0]; return { n: m.getAnimations().length, y: new DOMMatrix(getComputedStyle(m).transform).m42, prog: a ? a.effect.getComputedTiming().progress : null, tl: a && a.timeline ? a.timeline.constructor.name : '' }; });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const s = document.querySelector('.kws-skyline'); scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight + 20); });
    await p.waitForTimeout(250); const a = await st();
    await p.waitForTimeout(1200); const a2 = await st();   // it must not move by itself
    await end(p); await p.waitForTimeout(250); const z = await st();
    say(a.tl === 'ViewTimeline' && a.y > 5 && Math.abs(a.y - a2.y) < .01 && z.y < 1 && z.prog > .98, `name rises with the scroll only, ${w}px`,
      `entering: ${a.y.toFixed(1)}px down and unchanged after 1.2s; at the page end: ${z.y.toFixed(2)}px, progress ${z.prog && z.prog.toFixed(3)}`);
    // motion paused with the site's control
    await p.evaluate(() => document.documentElement.setAttribute('data-motion', 'off'));
    await p.evaluate(() => { const s = document.querySelector('.kws-skyline'); scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight + 20); });
    await p.waitForTimeout(200); const off = await st();
    say(off.n === 0 && off.y === 0, `motion paused (data-motion="off"), ${w}px`, `${off.n} animation(s), name at ${off.y}px`);
    await p.context().close();
    const q = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: h }, reducedMotion: 'reduce' } });
    await q.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const s = document.querySelector('.kws-skyline'); scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight + 20); });
    await q.waitForTimeout(600);
    const red = await q.evaluate(() => { const m = document.querySelector('.kws-skyline-name'); return { n: m.getAnimations().length, y: new DOMMatrix(getComputedStyle(m).transform).m42, off: document.documentElement.getAttribute('data-motion'), live: document.querySelectorAll('.kws-shader.is-live').length }; });
    say(red.n === 0 && red.y === 0, `reduced motion, ${w}px`, `${red.n} animation(s), name at ${red.y}px, html data-motion="${red.off}" (set by shader.js), ${red.live} shader layer(s) showing a still frame`);
    await q.context().close();
  }

  /* 4. Keyboard: order, visible focus, nothing focusable in the decorative scene */
  {
    const p = await open('test/pricing-with-kit.html');
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    await p.focus('.kws-close a');
    const seen = [], weak = [];
    for (let i = 0; i < 40; i++) {
      const r = await p.evaluate(ROOTS => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el), q = el.getBoundingClientRect();
        return { t: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 32), kit: !!el.closest(ROOTS), hid: !!el.closest('[aria-hidden="true"]'),
          ow: parseFloat(cs.outlineWidth), os: cs.outlineStyle, oc: cs.outlineColor, inView: q.top >= -1 && q.bottom <= innerHeight + 1, h: Math.round(q.height), w: Math.round(q.width) };
      }, ROOTS);
      if (!r || !r.kit) break;
      seen.push(r.t); if (r.hid || r.os === 'none' || r.ow < 2 || !r.inView) weak.push(r.t + JSON.stringify(r));
      await p.keyboard.press('Tab');
    }
    say(seen.length === 25 && !weak.length, 'keyboard walk, pricing page', `${seen.length} stops in reading order, each with a ${'3px'} outline and scrolled into view: ${seen.join(' > ')}${weak.length ? ' WEAK ' + weak : ''}`);
    const foc = await p.evaluate(() => document.querySelectorAll('.kws-skyline :is(a, button, [tabindex])').length);
    say(foc === 0, 'the skyline scene holds nothing focusable and is aria-hidden', String(await p.evaluate(() => document.querySelector('.kws-skyline').getAttribute('aria-hidden'))));
    // focus ring contrast against what is behind it
    const ring = await p.evaluate(() => {
      const out = {}; for (const [k, s] of [['band button', '.kws-close-btn'], ['card button', '.kws-appt-btn'], ['footer link', '.kws-foot-go']]) { const el = document.querySelector(s); el.focus(); out[k] = getComputedStyle(el).outlineColor; } return out; });
    say(true, 'focus ring colours', JSON.stringify(ring));
    await p.context().close();
  }

  /* 5. Screen-reader structure */
  {
    const p = await open('test/pricing-with-kit.html');
    const r = await p.evaluate(() => {
      const band = document.querySelector('.kws-close'), foot = document.querySelector('footer.kws-foot');
      return { bandLabel: band.getAttribute('aria-labelledby') && document.getElementById(band.getAttribute('aria-labelledby')).textContent, h2s: band.querySelectorAll('h2').length, hInFoot: foot.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
        navs: [...foot.querySelectorAll('nav')].map(n => n.getAttribute('aria-label') + ' (' + n.querySelectorAll('li').length + ')'), shaderHidden: [...document.querySelectorAll('.kws-shader')].every(s => s.closest('[aria-hidden="true"]')),
        year: document.getElementById('year').textContent, dl: document.querySelectorAll('.kws-appt dl div').length, tel: [...document.querySelectorAll('.kws-close a[href^="tel:"], .kws-foot a[href^="tel:"]')].map(a => a.getAttribute('href')).join() };
    });
    say(r.bandLabel && r.h2s === 1 && r.hInFoot === 0 && r.navs.length === 4 && r.shaderHidden && r.dl === 4, 'structure',
      `band is a section named by its h2 ("${r.bandLabel}"); footer has no headings and four labelled navs: ${r.navs.join(', ')}; canvases hidden from assistive tech; card is a 4-row description list; tel links ${r.tel}`);
    say(r.year === String(new Date().getFullYear()), 'main.js still fills #year', r.year);
    await p.context().close();
  }

  /* 6. The site's own behaviour with the new partials (main.js untouched) */
  {
    const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } });
    const book = await p.evaluate(() => [...document.querySelectorAll('.kws-close [data-booking]')].map(a => [a.getAttribute('href'), a.target, a.rel].join(' ')));
    say(book.length === 1 && /^https?:\/\/\S+ _blank noopener$/.test(book[0]), 'booking button on the card is wired by main.js', book.join(' | '));
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 2400); }); await p.waitForTimeout(500);
    const mid = await p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show'));
    await end(p); await p.waitForTimeout(600);
    const atEnd = await p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show'));
    say(mid && !atEnd, 'phone bar shows mid-page and gets out of the way over the footer', `mid-page ${mid}, at the footer ${atEnd}`);
    const before = await p.evaluate(() => [getComputedStyle(document.querySelector('.kws-close')).backgroundColor, getComputedStyle(document.querySelector('.kws-foot')).backgroundColor].join(' / '));
    await p.evaluate(() => { scrollTo(0, 0); }); await p.click('#theme-toggle'); await p.waitForTimeout(200);
    const after = await p.evaluate(() => [getComputedStyle(document.querySelector('.kws-close')).backgroundColor, getComputedStyle(document.querySelector('.kws-foot')).backgroundColor].join(' / '));
    say(before !== after, 'theme button re-colours band and footer', `${before}  ->  ${after}`);
    await p.click('#nav-toggle'); await p.waitForTimeout(350);
    const inert = await p.evaluate(() => { const f = document.querySelector('.site-footer'); return f.inert || f.hasAttribute('inert') || f.getAttribute('aria-hidden'); });
    say(!!inert, 'open phone menu still takes the footer out of reach (main.js finds .site-footer)', String(inert));
    await p.context().close();
  }

  /* 7. Targets and type on the smallest phone */
  for (const url of ['demo.html', 'portable.html']) {
    const p = await open(url, { ctx: { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true } });
    const r = await p.evaluate(ROOTS => {
      const small = [], tiny = [];
      for (const el of document.querySelectorAll(':is(' + ROOTS + ') :is(a, button)')) { const cs = getComputedStyle(el), q = el.getBoundingClientRect(); if (cs.display === 'none' || el.closest('[hidden], [aria-hidden="true"]') || !q.width) continue; if (q.height < 43.5 || q.width < 43.5) small.push(el.textContent.trim().slice(0, 20) + ' ' + Math.round(q.width) + 'x' + Math.round(q.height)); }
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let min = 99;
      while (tw.nextNode()) { const el = tw.currentNode.parentElement; if (!tw.currentNode.data.trim() || !el.closest(ROOTS) || el.closest('[aria-hidden="true"], svg')) continue; const fs = parseFloat(getComputedStyle(el).fontSize); min = Math.min(min, fs); if (fs < 12) tiny.push(el.className + ' ' + fs); }
      return { small, tiny, min, over: document.documentElement.scrollWidth - innerWidth };
    }, ROOTS);
    say(!r.small.length && !r.tiny.length && r.over <= 0, `360px: targets and type, ${url}`, `every link and button at least 44x44, smallest text ${r.min}px, page ${r.over}px wider than the screen${r.small.length ? ' SMALL ' + r.small.join('; ') : ''}`);
    await p.context().close();
  }

  /* 8. Layout shift: fonts, the shader arriving, main.js */
  for (const [url, w, h] of [['demo.html', 390, 844], ['demo.html', 1440, 900], ['test/pricing-with-kit.html', 390, 844], ['test/pricing-with-kit.html', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.addInitScript(() => { window.__cls = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls.push({ v: e.value, who: (e.sources || []).map(s => s.node && (s.node.className || s.node.nodeName)).join(',') }); }).observe({ type: 'layout-shift', buffered: true }); });
    const p = await ctx.newPage(); await p.goto(B + url, { waitUntil: 'networkidle' });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); }); await p.waitForTimeout(1500);
    const cls = await p.evaluate(ROOTS => window.__cls.filter(e => /kws-/.test(e.who)), ROOTS);
    const all = await p.evaluate(() => window.__cls.reduce((a, e) => a + e.v, 0));
    say(!cls.length, `no layout shift from the kit: ${url} at ${w}px`, `kit elements shifted ${cls.length} time(s); whole page score ${all.toFixed(4)}`);
    await ctx.close();
  }

  /* 9. Taken out of the page: nothing left behind */
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => { window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { window.__raf++; return r.call(window, f); }; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(B + 'demo.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const liveBefore = await p.evaluate(() => document.querySelectorAll('.kws-shader canvas').length);
    await p.evaluate(() => document.querySelectorAll('.kws-close, .kws-foot, .demo-frame').forEach(e => e.remove()));
    await p.waitForTimeout(1500);
    const r0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(2000); const r1 = await p.evaluate(() => window.__raf);
    say(!errs.length && r1 - r0 === 0, 'bands and footers removed from the page', `${liveBefore} canvases before; after removal ${r1 - r0} animation frames asked for in 2s, ${errs.length} errors (the kit's own files hold no script, listeners or observers)`);
    await ctx.close();
  }

  /* 10. Mounted late and twice (as a framework would): the CSS needs nothing run */
  {
    const p = await open('portable.html');
    const r = await p.evaluate(() => {
      const src = document.querySelector('.kws-close--strip'), a = src.cloneNode(true), c = src.cloneNode(true);
      a.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      document.querySelector('main').append(a, c);
      const h = [src, a, c].map(e => Math.round(e.getBoundingClientRect().height));
      return { h, same: h[0] === h[1] && h[1] === h[2] };
    });
    say(r.same, 'inserted after load, twice on a page', `three copies, heights ${r.h.join(', ')}px`);
    await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})();
