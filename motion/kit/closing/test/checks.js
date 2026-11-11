// Contract checks for the closing band, the appointment card, the footer and the skyline scene. One PASS or FAIL line each.
//   node checks.js
// Needs the kit server on :8730. Pages: ../demo.html, ../portable.html and the three "with-kit" copies of real pages.
const { chromium } = require('playwright');
const B = 'http://localhost:8730/kit/closing/';
const ROOTS = '.kws-close, .kws-appt, .kws-foot';
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/;
let fails = 0;
const say = (ok, name, detail) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ': ' + detail : ''}`); };

(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const open = async (url, o = {}) => {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, o.ctx));
    if (o.theme) await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, o.theme);
    await ctx.route(BLOCK, r => r.abort());
    const p = await ctx.newPage(); p.errs = [];
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) p.errs.push(m.text()); });
    p.on('pageerror', e => p.errs.push(String(e)));
    p.on('response', r => { if (r.status() >= 400) p.errs.push(r.status() + ' ' + r.url()); });
    await p.goto(B + url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts && document.fonts.ready);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    return p;
  };
  const end = p => p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });
  const over = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);

  /* 1. Console errors and failed requests, every page, both themes */
  for (const url of ['demo.html', 'portable.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html', 'test/notfound-with-kit.html']) {
    const errs = [];
    for (const theme of ['light', 'dark']) { const p = await open(url, { theme }); await end(p); await p.waitForTimeout(700); errs.push(...p.errs); await p.context().close(); }
    say(!errs.length, `no console errors or failed requests: ${url}`, errs.join(' | '));
  }

  /* 2. Script off: everything is there, nothing is a dead control */
  for (const url of ['demo.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html']) {
    const p = await open(url, { ctx: { viewport: { width: 390, height: 844 }, javaScriptEnabled: false } });
    const r = await p.evaluate(ROOTS => {
      const hidden = [], vis = el => { const cs = getComputedStyle(el), q = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > .99 && q.width > 1 && q.height > 1; };
      // the one sentence the phone layout leaves out on purpose is not counted
      for (const el of document.querySelectorAll(':is(' + ROOTS + ') :is(a, p, h2, li, dt, dd)')) if (!el.closest('[aria-hidden="true"]') && !el.matches('.kws-foot-what') && !vis(el)) hidden.push(el.className || el.tagName);
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
    await p.evaluate(() => { const s = document.querySelector('.kws-skyline'); scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight + 20); });
    await p.waitForTimeout(250); const a = await st();
    await p.waitForTimeout(1200); const a2 = await st();   // it must not move by itself
    await end(p); await p.waitForTimeout(250); const z = await st();
    say(a.tl === 'ViewTimeline' && a.y > 5 && Math.abs(a.y - a2.y) < .01 && z.y < 1 && z.prog > .98, `name rises with the scroll only, ${w}px`,
      `entering: ${a.y.toFixed(1)}px down and unchanged after 1.2s; at the page end: ${z.y.toFixed(2)}px, progress ${z.prog && z.prog.toFixed(3)}`);
    // motion paused with the kit's control
    await p.evaluate(() => document.documentElement.setAttribute('data-motion', 'off'));
    await p.evaluate(() => { const s = document.querySelector('.kws-skyline'); scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight + 20); });
    await p.waitForTimeout(200); const off = await st();
    say(off.n === 0 && off.y === 0, `motion paused (data-motion="off"), ${w}px`, `${off.n} animation(s), name at ${off.y}px`);
    await p.context().close();
    const q = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: h }, reducedMotion: 'reduce' } });
    await q.evaluate(() => { const s = document.querySelector('.kws-skyline'); scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight + 20); });
    await q.waitForTimeout(600);
    const red = await q.evaluate(() => { const m = document.querySelector('.kws-skyline-name'); return { n: m.getAnimations().length, y: new DOMMatrix(getComputedStyle(m).transform).m42, off: document.documentElement.getAttribute('data-motion') }; });
    say(red.n === 0 && red.y === 0, `reduced motion, ${w}px`, `${red.n} animation(s), name at ${red.y}px, html data-motion="${red.off}" (set by the kit's motion.js)`);
    await q.context().close();
  }

  /* 4. Keyboard: order, visible focus, nothing focusable in the decorative scene */
  {
    const p = await open('test/pricing-with-kit.html');
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
    say(seen.length === 25 && !weak.length && /Pause motion/.test(seen[24]), 'keyboard walk, pricing page', `${seen.length} stops in reading order, each with a 3px outline and scrolled into view: ${seen.join(' > ')}${weak.length ? ' WEAK ' + weak : ''}`);
    const foc = await p.evaluate(() => document.querySelectorAll('.kws-skyline :is(a, button, [tabindex])').length);
    say(foc === 0, 'the skyline scene holds nothing focusable and is aria-hidden', String(await p.evaluate(() => document.querySelector('.kws-skyline').getAttribute('aria-hidden'))));
    await p.context().close();
  }

  /* 5. Screen-reader structure */
  {
    const p = await open('test/pricing-with-kit.html');
    const r = await p.evaluate(() => {
      const band = document.querySelector('.kws-close'), foot = document.querySelector('footer.kws-foot');
      return { bandLabel: band.getAttribute('aria-labelledby') && document.getElementById(band.getAttribute('aria-labelledby')).textContent, h2s: band.querySelectorAll('h2').length, hInFoot: foot.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
        navs: [...foot.querySelectorAll('nav')].map(n => n.getAttribute('aria-label') + ' (' + n.querySelectorAll('li').length + ')'), shaderHidden: [...document.querySelectorAll('.kws-shader')].every(s => s.closest('[aria-hidden="true"]')),
        year: document.getElementById('year').textContent, dl: document.querySelectorAll('.kws-appt dl div').length, tel: [...document.querySelectorAll('.kws-close a[href^="tel:"], .kws-foot a[href^="tel:"]')].map(a => a.getAttribute('href')).join(),
        logo: foot.querySelector('.kws-foot-logo').getAttribute('aria-label'), links: foot.querySelectorAll('a').length,
        order: [...foot.querySelectorAll('.kws-foot-grid > *')].map(e => e.getBoundingClientRect().top) };
    });
    say(r.bandLabel && r.h2s === 1 && r.hInFoot === 0 && r.navs.length === 4 && r.shaderHidden && r.dl === 4 && r.logo === 'KnightWebstudio home', 'structure',
      `band is a section named by its h2 ("${r.bandLabel}"); footer has no headings and four labelled navs: ${r.navs.join(', ')}; ${r.links} links; the crest link is named "${r.logo}"; canvases hidden from assistive tech; card is a 4-row description list; tel links ${r.tel}`);
    say(r.year === String(new Date().getFullYear()), 'main.js still fills #year', r.year);
    await p.context().close();
    // the footer's reading order is its source order at every layout
    const bad = [];
    for (const w of [390, 820, 1440]) {
      const q = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: 900 } } });
      const o = await q.evaluate(() => [...document.querySelectorAll('footer .kws-foot-grid > *')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.left)]; }));
      for (let i = 1; i < o.length; i++) if (o[i][0] < o[i - 1][0] - 1 && o[i][1] <= o[i - 1][1]) bad.push(w + 'px item ' + i);
      await q.context().close();
    }
    say(!bad.length, 'footer blocks are laid out in source order (390, 820, 1440)', bad.join(', ') || 'who, contact, services, company, areas, sign-off');
  }

  /* 6. The site's own behaviour with the new partials: main.js with the one line NOTES.md section 6 asks for */
  {
    const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } });
    const book = await p.evaluate(() => [...document.querySelectorAll('.kws-close [data-booking]')].map(a => [a.getAttribute('href'), a.target, a.rel].join(' ')));
    say(book.length === 1 && /^https?:\/\/\S+ _blank noopener$/.test(book[0]), 'booking button on the card is wired by main.js', book.join(' | '));
    const shown = () => p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show'));
    await p.evaluate(() => scrollTo(0, 2400)); await p.waitForTimeout(500);
    const mid = await shown();
    // the band 15%, 50% and 100% of the way up the screen: the bar must be out of the way at each
    const at = [];
    for (const f of [.15, .5, 1]) { await p.evaluate(f => { const s = document.querySelector('.kws-close'); scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * (1 - f)); }, f); await p.waitForTimeout(450); at.push(await shown()); }
    await end(p); await p.waitForTimeout(600);
    const atEnd = await shown();
    say(mid && !at.some(Boolean) && !atEnd, 'phone bar shows mid-page, hides while the band is on screen and over the footer', `mid-page ${mid}; band 15%, 50%, 100% up the screen ${at.join(', ')}; at the footer ${atEnd}`);
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
  for (const url of ['demo.html', 'portable.html', 'test/start-with-kit.html']) {
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
    await ctx.route(BLOCK, r => r.abort());
    await ctx.addInitScript(() => { window.__cls = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls.push({ v: e.value, who: (e.sources || []).map(s => s.node && (s.node.className || s.node.nodeName)).join(',') }); }).observe({ type: 'layout-shift', buffered: true }); });
    const p = await ctx.newPage(); await p.goto(B + url, { waitUntil: 'networkidle' });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); }); await p.waitForTimeout(1500);
    const cls = await p.evaluate(() => window.__cls.filter(e => /kws-/.test(e.who)));
    const all = await p.evaluate(() => window.__cls.reduce((a, e) => a + e.v, 0));
    say(!cls.length, `no layout shift from the kit: ${url} at ${w}px`, `kit elements shifted ${cls.length} time(s); whole page score ${all.toFixed(4)}${cls.length ? ' ' + JSON.stringify(cls) : ''}`);
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
    say(!errs.length && r1 - r0 === 0, 'bands and footers removed from the page', `${liveBefore} canvases before; after removal ${r1 - r0} animation frames asked for in 2s, ${errs.length} errors (this folder's files hold no script, listeners or observers)`);
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

  /* 11. The pause button: centred, labelled, last in its row */
  {
    const p = await open('demo.html'); await end(p); await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const c = q => { const r = q.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r]; };
      const out = [];
      for (const btn of document.querySelectorAll('.kws-motion:not([hidden])')) {
        const ico = [...btn.querySelectorAll('svg')].find(s => getComputedStyle(s).display !== 'none'), label = btn.querySelector('.kws-motion-label');
        const [bx, by, br] = c(btn), [ix, iy, ir] = c(ico), row = btn.closest('.kws-foot-links');
        out.push({ where: btn.closest('.kws-foot') ? 'footer' : 'header', label: label ? label.textContent : '', name: btn.getAttribute('aria-label') || btn.textContent.trim(), dx: +(ix - bx).toFixed(1), dy: +(iy - by).toFixed(1),
          padL: +(ir.left - br.left).toFixed(1), padR: +(br.right - (label ? label.getBoundingClientRect().right : ir.right)).toFixed(1), h: Math.round(br.height),
          last: row ? row.lastElementChild === btn : null, first: row ? row.firstElementChild.textContent.trim() : null });
      }
      return out;
    });
    const round = r.filter(x => !x.label), pills = r.filter(x => x.label);
    say(round.length >= 1 && round.every(x => Math.abs(x.dx) <= 1 && Math.abs(x.dy) <= 1), 'pause button, round: the icon is within 1px of the button centre', round.map(x => `${x.where} dx ${x.dx} dy ${x.dy}`).join('; '));
    say(pills.length >= 2 && pills.every(x => Math.abs(x.dy) <= 1 && Math.abs(x.padL - x.padR) <= 4.5 && x.h >= 44 && x.label === 'Pause motion' && x.last),
      'pause button in the footers: labelled, icon and words centred as one, last in the row', pills.map(x => `"${x.label}" ${x.h}px tall, icon dy ${x.dy}, ${x.padL}px before the icon and ${x.padR}px after the words, last in a row that starts with "${x.first}"`).join('; '));
    await p.context().close();
  }

  /* 12. Buttons on a page with no site stylesheet: hover tone, a press that sinks under the pointer, a 3px ring, still under reduced motion */
  {
    const p = await open('portable.html');
    await p.addStyleTag({ content: 'html{scroll-behavior:auto}' });
    const res = [];
    for (const [name, sel] of [['band main', '.kws-close .kws-close-acts .kws-btn--main'], ['band second', '.kws-close-acts .kws-btn:not(.kws-btn--main)'], ['card', '.kws-appt .kws-btn'], ['footer', '.kws-foot .kws-btn']]) {
      const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const bb = await el.boundingBox();
      const cs = () => el.evaluate(e => { const c = getComputedStyle(e); return { bg: c.backgroundColor, y: new DOMMatrix(c.transform).m42, ring: c.outlineStyle + ' ' + c.outlineWidth }; });
      await p.mouse.move(2, 2); await p.waitForTimeout(260); const rest = await cs();
      await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(260); const hov = await cs();
      await p.mouse.down(); await p.waitForTimeout(260); const act = await cs(); await p.mouse.move(2, 2); await p.mouse.up();
      await el.focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); const foc = await cs();
      res.push({ name, lift: hov.y, tone: hov.bg !== rest.bg, sink: act.y, ring: foc.ring });
    }
    const tel = p.locator('.kws-close-tel a').first(); await tel.scrollIntoViewIfNeeded();
    const t0 = await tel.evaluate(e => getComputedStyle(e).textUnderlineOffset); await tel.hover(); await p.waitForTimeout(100);
    const t1 = await tel.evaluate(e => getComputedStyle(e).textUnderlineOffset);
    await tel.focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    const tr = await tel.evaluate(e => { const c = getComputedStyle(e); return c.outlineStyle + ' ' + c.outlineWidth; });
    say(res.every(x => x.lift === -2 && x.sink === 1 && x.ring === 'solid 3px') && res.filter(x => /main|card/.test(x.name)).every(x => x.tone) && t0 !== t1 && tr === 'solid 3px', 'button states on a bare page',
      res.map(x => `${x.name}: hover ${x.lift}px${x.tone ? ' and a deeper fill' : ''}, pressed ${x.sink}px, focus ring ${x.ring}`).join('; ') + `; the band's number: underline moves ${t0} to ${t1} on hover, focus ring ${tr}`);
    await p.context().close();
    const q = await open('portable.html', { ctx: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' } });
    const d = await q.evaluate(() => [...document.querySelectorAll('.kws-btn')].map(e => getComputedStyle(e).transitionDuration));
    say(d.every(x => x === '0s'), 'reduced motion on a bare page: no button animates', `${d.length} buttons, transition-duration ${[...new Set(d)].join(', ')}`);
    await q.context().close();
  }

  /* 13. Long words and long marked phrases never widen the page */
  {
    const cases = [];
    for (const w of [320, 360, 390]) {
      const p = await open('portable.html', { ctx: { viewport: { width: w, height: 740 } } });
      const base = await over(p);
      const tryIt = async (label, fn) => { await p.evaluate(fn); const o = await over(p); cases.push({ w, label, o }); await p.reload({ waitUntil: 'networkidle' }); };
      await tryIt('statement title, a 30-letter word', () => { document.querySelector('#close-c').textContent = 'Donaudampfschifffahrtsgesellschaft now'; });
      await tryIt('strip title, a 30-letter word', () => { document.querySelector('#close-s').textContent = 'Rindfleischetikettierungsaufgaben'; });
      await tryIt('card-layout title, a 30-letter word', () => { document.querySelector('#close-h').textContent = 'Rindfleischetikettierungsaufgaben'; });
      await tryIt('band button, a 34-letter word', () => { document.querySelector('.kws-close-acts .kws-btn').textContent = 'Terminvereinbarungsbestaetigungsmail'; });
      await tryIt('card button, a 34-letter word', () => { document.querySelector('.kws-appt .kws-btn').textContent = 'Terminvereinbarungsbestaetigungsmail'; });
      await tryIt('card value, a 34-letter word', () => { document.querySelector('.kws-appt dd').textContent = 'Terminvereinbarungsbestaetigungsmail'; });
      await tryIt('marked phrase "a free thirty-minute call"', () => { document.querySelector('.kws-close-mark > span').textContent = 'a free thirty-minute call'; });
      await tryIt('marked phrase "your free estimate"', () => { document.querySelector('.kws-close-mark > span').textContent = 'your free estimate'; });
      await tryIt('footer link and email, 40 letters', () => { document.querySelector('.kws-foot nav:not(.kws-foot-call) a').textContent = 'Kraftfahrzeughaftpflichtversicherungen'; document.querySelector('.kws-foot-mail').textContent = 'a-very-long-address-for-a-business@example-domain.com'; });
      say(base <= 0, `${w}px: the bare page as delivered`, `${base}px wider than the screen`);
      await p.context().close();
    }
    const bad = cases.filter(c => c.o > 0);
    say(!bad.length, 'long words and long marked phrases at 320, 360 and 390px', bad.length ? bad.map(c => `${c.w}px ${c.label}: +${c.o}px`).join('; ') : `${cases.length} cases, none wider than the screen`);
  }

  /* 13b. The full stop after the marked words never drops to a line of its own (it is inside the mark), 320 to 620px */
  {
    const p = await open('demo.html', { ctx: { viewport: { width: 390, height: 800 } } });
    const bad = [];
    for (const title of ['Still deciding? Book the <span class="kws-close-mark"><span>free call</span>.</span>', 'Ready when you are: get <span class="kws-close-mark"><span>your free estimate</span>.</span>']) {
      await p.evaluate(t => { document.querySelector('#close-sign').innerHTML = t; }, title);
      for (let w = 320; w <= 620; w += 10) {
        await p.setViewportSize({ width: w, height: 800 });
        const r = await p.evaluate(() => { const m = document.querySelector('#close-sign .kws-close-mark > span'), rg = document.createRange(); rg.setStart(m.nextSibling, 0); rg.setEnd(m.nextSibling, 1);
          const dot = rg.getBoundingClientRect(), rs = m.getClientRects(), last = rs[rs.length - 1], st = getComputedStyle(m, '::after'); return { alone: dot.top >= last.bottom - 4, over: document.documentElement.scrollWidth - innerWidth, brush: /url|gradient/.test(st.maskImage || st.webkitMaskImage) }; });
        if (r.alone || r.over > 0 || !r.brush) bad.push(w + 'px ' + JSON.stringify(r));
      }
    }
    say(!bad.length, 'the full stop stays with the marked words, and the brush is drawn (320 to 620px, a short and a long phrase)', bad.slice(0, 4).join('; ') || '62 widths, none orphaned, none wider than the screen');
    await p.context().close();
  }

  /* 14. A text-only logo, and the partial before the art build has filled the crest */
  {
    const out = [];
    for (const w of [390, 1440]) {
      const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: 900 } } });
      out.push(await p.evaluate(() => { const l = document.querySelector('footer .kws-foot-logo'); l.querySelector('svg').remove(); const s = document.createElement('span'); s.textContent = 'KnightWebstudio'; l.append(s);
        const r = document.createRange(); r.selectNodeContents(s); const q = r.getBoundingClientRect(); return { w: Math.round(q.width), h: Math.round(q.height), lines: r.getClientRects().length, over: document.documentElement.scrollWidth - innerWidth }; }));
      await p.context().close();
    }
    say(out.every(o => o.lines === 1 && o.w > 120 && o.over <= 0), 'a logo that is only a name is set on one line (390, 1440)', out.map(o => `${o.w}x${o.h}px, ${o.lines} line`).join('; '));
  }

  /* 15. Forced colours (Windows High Contrast): the card and every button keep an edge */
  {
    const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: 1440, height: 900 }, forcedColors: 'active' } });
    const r = await p.evaluate(() => [...document.querySelectorAll('.kws-appt, .kws-btn')].map(e => { const c = getComputedStyle(e); return { n: e.className.split(' ')[0] + (e.closest('.kws-appt') && e !== e.closest('.kws-appt') ? ' (card)' : e.closest('.kws-foot') ? ' (footer)' : ''), w: parseFloat(c.borderTopWidth), s: c.borderTopStyle }; }));
    say(r.every(x => x.w >= 1 && x.s === 'solid'), 'forced colours: card and buttons have a border to draw', r.map(x => `${x.n} ${x.w}px ${x.s}`).join('; '));
    await p.context().close();
  }

  /* 16. Text at 200% (text-only zoom, or a large default size): nothing of the kit's runs off the screen */
  {
    const out = [];
    for (const [url, w] of [['test/pricing-with-kit.html', 390], ['test/pricing-with-kit.html', 760], ['test/pricing-with-kit.html', 1280], ['test/start-with-kit.html', 390], ['portable.html', 390], ['portable.html', 760]]) {
      const p = await open(url, { ctx: { viewport: { width: w, height: 900 } } });
      await p.addStyleTag({ content: 'html{font-size:200%}' }); await p.waitForTimeout(150);
      // the page's own chrome is not ours to judge: count kit elements past the right edge (the scene clips its drawing)
      const bad = await p.evaluate(ROOTS => [...document.querySelectorAll(':is(' + ROOTS + '), :is(' + ROOTS + ') *')].filter(e => !e.closest('.kws-skyline') && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().right > innerWidth + 1).map(e => e.className || e.tagName).slice(0, 4), ROOTS);
      out.push({ url, w, bad, page: await over(p) });
      await p.context().close();
    }
    say(out.every(o => !o.bad.length) && out.filter(o => /portable/.test(o.url)).every(o => o.page <= 0), 'text at 200%: no kit element runs off the screen', out.map(o => `${o.url.replace('test/', '')} ${o.w}px: ${o.bad.length ? o.bad.join(',') : 'none'}`).join('; ') + '; the bare page does not scroll sideways');
  }

  /* 17. How tall it all is */
  {
    const H = {};
    for (const [w, h] of [[1440, 900], [1280, 720], [390, 844], [360, 740], [820, 1180]]) {
      const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: h } } });
      H[w] = await p.evaluate(() => { const r = s => Math.round(document.querySelector(s).getBoundingClientRect().height); const band = document.querySelector('.kws-close-in'), card = document.querySelector('.kws-appt');
        return { foot: r('footer.kws-foot'), band: r('.kws-close'), head: Math.round((document.querySelector('.site-header') || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height), page: document.documentElement.scrollHeight,
          void: Math.round(band.getBoundingClientRect().right - card.getBoundingClientRect().right), cols: getComputedStyle(band).gridTemplateColumns.split(' ').length }; });
      await p.context().close();
    }
    say(H[1440].foot <= 800 && H[1440].foot <= 900 - H[1440].head, 'footer fits one screen at 1440x900', `${H[1440].foot}px, with ${900 - H[1440].head}px under the sticky header; ${H[1280].foot}px at 1280x720 (${720 - H[1280].head}px under the header)`);
    say(H[390].foot <= 1150 && H[360].foot <= 1150, 'footer on a phone is no taller than 1,150px', `${H[390].foot}px at 390, ${H[360].foot}px at 360`);
    say(H[390].band <= 780 && H[360].band <= 800, 'card band on a phone', `${H[390].band}px at 390, ${H[360].band}px at 360; whole pricing page ${H[390].page}px at 390`);
    say(H[820].cols === 2 && H[820].band <= 520 && H[820].void <= 1, 'card band on a tablet: card beside the copy', `${H[820].band}px at 820, ${H[820].cols} columns, ${H[820].void}px of empty block right of the card`);
    const voids = [];
    for (const w of [600, 680, 759, 760, 900, 979]) {
      const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: 900 } } });
      voids.push(w + ': ' + await p.evaluate(() => Math.round(document.querySelector('.kws-close-in').getBoundingClientRect().right - document.querySelector('.kws-appt').getBoundingClientRect().right)));
      await p.context().close();
    }
    say(voids.every(v => +v.split(': ')[1] <= 1), 'card band, 600 to 979: no empty block right of the card', voids.join('px, ') + 'px');
  }

  /* 18. Alignment: footer rows, the strip's right-hand block */
  {
    const out = [];
    for (const w of [360, 390, 820]) {
      const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: 900 }, hasTouch: true } });
      out.push(w + ': ' + await p.evaluate(() => { const c = l => [...document.querySelectorAll(`footer nav[aria-label="${l}"] li`)].map(e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; });
        const a = c('Services'), b = c('Company'); return Math.max(...a.map((y, i) => Math.abs(y - b[i]))).toFixed(1); }));
      await p.context().close();
    }
    say(out.every(o => +o.split(': ')[1] <= 1), 'Services and Company rows line up (360, 390, 820)', 'largest difference between row centres ' + out.join('px, ') + 'px');
    const p = await open('demo.html');
    const s = await p.evaluate(() => { const sec = document.querySelector('.kws-close--strip'), m = e => { const r = e.getBoundingClientRect(); return [r.top, r.bottom]; };
      const copy = m(sec.querySelector('.kws-close-copy')), a = m(sec.querySelector('.kws-close-acts')), t = m(sec.querySelector('.kws-close-tel a')); return { copy: (copy[0] + copy[1]) / 2, right: (a[0] + t[1]) / 2 }; });
    say(Math.abs(s.copy - s.right) <= 6, 'strip at 1440: buttons and number are centred against the copy as one block', `centres ${s.copy.toFixed(1)} and ${s.right.toFixed(1)}`);
    await p.context().close();
  }

  /* 19. Gold details and the slim footers */
  {
    const p = await open('test/start-with-kit.html', { ctx: { viewport: { width: 390, height: 844 } } });
    const r = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('.kws-close-tel a')), band = getComputedStyle(document.querySelector('.kws-close')), f = document.querySelector('footer.kws-foot');
      const lead = f.querySelector('.kws-foot-bye'), tel = f.querySelector('a[href^="tel:"]');
      return { line: c.textDecorationLine, col: c.textDecorationColor, thick: c.textDecorationThickness, hair: band.borderBottomWidth + ' ' + band.borderBottomColor, kicker: document.querySelectorAll('.kws-close--card .kws-close-kicker').length,
        lead: lead.textContent, leadFont: getComputedStyle(lead).fontFamily.split(',')[0], telSize: getComputedStyle(tel).fontSize, year: f.querySelector('#year').parentElement.textContent.replace(/ /g, ' ') }; });
    say(r.line === 'underline' && r.col === 'rgb(240, 195, 105)' && r.thick === '2px' && /^2px rgb\(240, 195, 105\)/.test(r.hair), "gold details: the line under the band's number and the hairline at the band's foot", `underline ${r.thick} ${r.col}; hairline ${r.hair}; kickers in the card layout: ${r.kicker}`);
    say(/^KnightWebstudio · Based in Baton Rouge, Louisiana$/.test(r.lead) && /Fraunces/i.test(r.leadFont) && parseFloat(r.telSize) <= 17.5, 'slim footer leads with the name and place; the number is body size', `"${r.lead}" in ${r.leadFont}; number at ${r.telSize}; "${r.year}"`);
    await p.context().close();
  }

  /* 20. The scene on a phone: the tower and one whole bridge tower inside the frame, the name clear of the roofs */
  {
    const out = [];
    for (const w of [360, 390, 430, 1440]) {
      const p = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: 844 } } });
      await end(p); await p.waitForTimeout(300);
      out.push(await p.evaluate(w => {
        const scene = document.querySelector('footer .kws-skyline'), f = scene.getBoundingClientRect(), svg = scene.querySelector('.kws-skyline-art'), m = svg.querySelector('g').getScreenCTM(), ms = svg.querySelector('.kws-skyline-span').getScreenCTM(), sr = svg.getBoundingClientRect();
        const cap = [314 * m.a + m.e, 346 * m.a + m.e], towers = [1040, 1240].map(x => x * ms.a + ms.e);
        const name = scene.querySelector('.kws-skyline-name'), probe = document.createElement('span'); probe.style.cssText = 'display:inline-block;width:0;height:0'; name.append(probe);
        const base = probe.getBoundingClientRect().bottom; probe.remove();
        const cs = getComputedStyle(name), cv = document.createElement('canvas').getContext('2d'); cv.font = `600 ${cs.fontSize} ${cs.fontFamily}`; const capH = cv.measureText('K').actualBoundingBoxAscent;
        const roof = y => y * m.d + m.f, clear = y => Math.min(1, (roof(y) - (base - capH)) / capH);   // user y of a roof line in the drawing
        return { w, artOver: Math.round(sr.right - f.right), h: Math.round(f.height), capL: Math.round(cap[0] - f.left), capR: Math.round(f.right - cap[1]), towers: towers.map(x => Math.round(f.right - x)), font: Math.round(parseFloat(cs.fontSize)), typical: +clear(62).toFixed(2), tallest: +clear(48).toFixed(2) };
      }, w));
      await p.context().close();
    }
    const phones = out.filter(o => o.w < 600);
    say(out.every(o => o.artOver <= 0) && phones.every(o => o.capL >= 16 && o.towers.some(t => t >= 16) && o.typical >= .66), 'scene on a phone', phones.map(o => `${o.w}px: ${o.h}px tall, Capitol tower ${o.capL}px in from the left, bridge towers ${o.towers.join(' and ')}px in from the right, ${Math.round(o.typical * 100)}% of the letters' height clear of the usual roofline (${Math.round(o.tallest * 100)}% at the tallest building)`).join('; '));
    const d = out.find(o => o.w === 1440);
    say(d.h <= 215 && d.capL > 16 && d.towers.every(t => t > 16), 'scene at 1440', `${d.h}px tall, name at ${d.font}px, ${Math.round(d.typical * 100)}% of the letters' height clear of the usual roofline`);
  }

  /* 21. The sky's slow glow: only on a page that shows a pause button, held by that button, never under reduced motion */
  {
    const st = p => p.evaluate(() => { const s = document.querySelector('footer .kws-skyline-sky'), a = s.getAnimations({ subtree: true }).filter(x => x.animationName === 'kws-skyline-glow'), c = getComputedStyle(s, '::after');
      return { n: a.length, state: a[0] ? a[0].playState : 'none', x: new DOMMatrix(c.transform).m41, btn: !!document.querySelector('.kws-motion:not([hidden])') }; });
    const p = await open('test/pricing-with-kit.html'); await end(p); await p.waitForTimeout(1500);
    const run = await st(p); await p.waitForTimeout(1200); const run2 = await st(p);
    await p.click('footer .kws-motion'); await p.waitForTimeout(200); const held = await st(p); await p.waitForTimeout(1200); const held2 = await st(p);
    const label = await p.evaluate(() => document.querySelector('footer .kws-motion').textContent.trim());
    await p.click('footer .kws-motion'); await p.waitForTimeout(600); const again = await st(p);
    await p.context().close();
    const q = await open('test/notfound-with-kit.html'); await end(q); await q.waitForTimeout(600); const bare = await st(q); await q.context().close();
    const r = await open('test/pricing-with-kit.html', { ctx: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' } }); await end(r); await r.waitForTimeout(600); const red = await st(r); await r.context().close();
    const s = await open('portable.html'); await end(s); await s.waitForTimeout(600); const port = await st(s); await s.context().close();
    say(run.state === 'running' && run.x !== run2.x && held.state === 'paused' && held.x === held2.x && label === 'Play motion' && again.state === 'running' && bare.n === 0 && !bare.btn && red.n === 0 && port.n === 0, "the sky's glow",
      `with the pause button showing it drifts (${run.x.toFixed(1)}px, then ${run2.x.toFixed(1)}px); pressed, it holds (${held.x.toFixed(1)}px twice, button says "${label}"); pressed again it runs; not-found page (no button): ${bare.n} animations; reduced motion: ${red.n}; bare client page (no button): ${port.n}`);
  }

  /* 22. No base layer assumed: the bare page with its small reset taken out measures the same */
  {
    const H = async (strip, w) => {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage();
      if (strip) await p.route('**/portable.html', async r => { const res = await r.fetch(); let s = await res.text(); s = s.replace('*, *::before, *::after { box-sizing: border-box; }', '').replace('h1, h2, p, ul, dl, dd { margin: 0; }', ''); await r.fulfill({ response: res, body: s }); });
      await p.goto(B + 'portable.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
      const r = await p.evaluate(() => ({ h: ['.kws-close--card', '.kws-close--strip', '.kws-appt', '.kws-foot'].map(s => Math.round(document.querySelector(s).getBoundingClientRect().height)).join('/'), over: document.documentElement.scrollWidth - innerWidth, box: getComputedStyle(document.querySelector('.kws-close-in')).boxSizing }));
      await ctx.close(); return r;
    };
    const out = [];
    for (const w of [390, 1440]) { const a = await H(false, w), c = await H(true, w); out.push({ w, same: a.h === c.h && c.over <= 0 && c.box === 'content-box', a: a.h, c: c.h }); }
    say(out.every(o => o.same), 'no reset needed: card band, strip, card and footer measure the same without the page\'s box-sizing and margin reset', out.map(o => `${o.w}px: ${o.a} with, ${o.c} without`).join('; '));
  }

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})();
