// The contract, tested with scripts: node test/contract.js
const chromium = require('/opt/node-tools/node_modules/playwright')[process.env.BROWSER || 'chromium'];
const URL = 'http://localhost:8730/kit/flat/demo.html';
const results = []; let failed = 0;
const check = (name, ok, detail = '') => { results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); if (!ok) failed++; };
const state = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); const lis = [...el.querySelectorAll(':scope > ul > li')];
  return { on: lis.findIndex(li => li.classList.contains('is-on')), moving: el.classList.contains('is-moving'), live: el.classList.contains('is-live'), said: (el.querySelector('output') || {}).textContent }; }, sel);
const open = async (b, o = {}) => { const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, o)); const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(300); return { ctx, p, errs }; };
const A = '#services .kws-arc', S = '#work .kws-spot';
// wait for a move to finish (a slow machine stretches the spring, which never takes a step longer than 34ms a frame)
const rest = async (p, sel) => { await p.waitForTimeout(80); await p.waitForFunction(s => !document.querySelector(s).classList.contains('is-moving'), sel, { timeout: 6000 }).catch(() => {}); await p.waitForTimeout(80); };

(async () => {
  const b = await chromium.launch();

  // 1. Loads clean, upgrades every instance
  { const { ctx, p, errs } = await open(b);
    const n = await p.evaluate(() => [document.querySelectorAll('.kws-arc.is-live').length, document.querySelectorAll('.kws-spot.is-live').length, !!(window.KWS && KWS.arc && KWS.arc.mount && KWS.spotlight && KWS.spotlight.mount)]);
    check('no console errors on load', errs.length === 0, errs.join(' | '));
    check('two wheels and two spotlights mounted on one page; KWS.arc.mount and KWS.spotlight.mount exposed', n[0] === 2 && n[1] === 2 && n[2], n.join(','));
    const globals = await p.evaluate(() => Object.keys(window).filter(k => /kws/i.test(k)));
    check('only one global (window.KWS)', globals.join() === 'KWS' || globals.join() === 'KWS,kwsReady' || globals.join() === 'kwsReady,KWS', globals.join());
    await ctx.close(); }

  // 2. Arrows, dots, keys
  for (const [name, sel, n] of [['arc', A, 9], ['spotlight', S, 3]]) {
    const { ctx, p, errs } = await open(b);
    await p.locator(sel).scrollIntoViewIfNeeded();
    const cls = name === 'arc' ? 'kws-arc' : 'kws-spot';
    await p.click(`${sel} .${cls}-nav:last-child`); await rest(p, sel);
    let s = await state(p, sel); check(`${name}: next arrow moves to item 2 and says so`, s.on === 1 && /2 of/.test(s.said) && !s.moving, JSON.stringify(s));
    await p.click(`${sel} .${cls}-nav:first-child`); await p.click(`${sel} .${cls}-nav:first-child`); await rest(p, sel);
    s = await state(p, sel); check(`${name}: previous arrow twice wraps to the last item`, s.on === n - 1, JSON.stringify(s));
    await p.click(`${sel} .${cls}-dot >> nth=1`); await rest(p, sel);
    s = await state(p, sel); check(`${name}: second dot goes to item 2`, s.on === 1 && (await p.getAttribute(`${sel} .${cls}-dot >> nth=1`, 'aria-current')) === 'true', JSON.stringify(s));
    await p.keyboard.press('ArrowRight'); await rest(p, sel);
    s = await state(p, sel); check(`${name}: ArrowRight with focus inside moves on`, s.on === 2, JSON.stringify(s));
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await rest(p, sel);
    s = await state(p, sel); check(`${name}: ArrowLeft twice moves back two`, s.on === 0, JSON.stringify(s));
    const sizes = await p.evaluate(s => [...document.querySelectorAll(s + ' button')].map(x => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), x.getAttribute('aria-label'), x.type]; }), sel);
    check(`${name}: arrows and dots are real buttons, at least 44px each way, named`, sizes.every(z => z[1] >= 44 && z[0] >= 44 && z[2] && z[3] === 'button'), JSON.stringify(sizes.slice(0, 3)));
    const aria = await p.evaluate(s => { const el = document.querySelector(s); const lis = [...el.querySelectorAll(':scope > ul > li')];
      return { rd: el.getAttribute('aria-roledescription'), label: !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')), tag: el.tagName, list: el.querySelector(':scope > ul') !== null,
        slides: lis.map(li => li.getAttribute('aria-roledescription') + ':' + li.getAttribute('aria-label')), live: el.querySelector(':scope > output') ? 'polite' : 'none', group: el.querySelector('[role=group]').getAttribute('aria-label') }; }, sel);
    check(`${name}: labelled region with a list, carousel and slide roledescriptions, "n of N" labels, a status region (output) for announcements`, aria.rd === 'carousel' && aria.label && aria.list && aria.slides[2] === `slide:3 of ${n}` && aria.live === 'polite' && !!aria.group, JSON.stringify(aria).slice(0, 220));
    check(`${name}: no console errors during use`, errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  // 3. Tabbing: every link is reachable; tabbing to an item off to the side brings it to the centre; focus is on something visible
  for (const [name, sel, n] of [['arc', A, 9], ['spotlight', S, 3]]) {
    const { ctx, p } = await open(b);
    await p.evaluate(s => { const el = document.querySelector(s); const a = document.createElement('a'); a.href = '#'; a.id = 'before-kit'; a.textContent = 'before'; el.before(a); a.focus(); }, sel);
    const seen = [];
    for (let i = 0; i < n + 14; i++) {
      await p.keyboard.press('Tab'); await rest(p, sel); await p.waitForTimeout(250);
      const f = await p.evaluate(s => { const el = document.querySelector(s), a = document.activeElement; if (!el.contains(a)) return null;
        const li = a.closest('li'); const lis = [...el.querySelectorAll(':scope > ul > li')]; const cap = a.closest('[class$="-cap"]'); const r = a.getBoundingClientRect();
        return { tag: a.tagName, item: lis.indexOf(li), on: lis.findIndex(x => x.classList.contains('is-on')), capOpacity: cap ? +getComputedStyle(cap).opacity : 1, inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, outline: getComputedStyle(a).outlineStyle + ' ' + getComputedStyle(a).outlineWidth }; }, sel);
      if (!f) break; seen.push(f);
    }
    const links = seen.filter(f => f.tag === 'A');
    check(`${name}: Tab reaches all ${n} links, each one centred and fully visible when focused`, links.length === n && links.every((f, i) => f.item === i && f.on === i && f.capOpacity >= .95 && f.inView), JSON.stringify(links.map(f => [f.item, f.on, f.capOpacity])));
    check(`${name}: then previous, the dots as one stop, next (3 buttons), then focus leaves: no trap`, seen.filter(f => f.tag === 'BUTTON').length === 3 && seen.length === n + 3, 'stops: ' + seen.length);
    check(`${name}: focus ring visible on links and buttons`, seen.every(f => /solid/.test(f.outline) && parseFloat(f.outline.split(' ')[1]) >= 2), seen[0] && seen[0].outline);
    // arrow key while a link has focus: focus follows what is showing
    await p.focus(`${sel} li >> nth=0 >> a`); await p.waitForTimeout(700); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(800);
    const f2 = await p.evaluate(s => { const el = document.querySelector(s), a = document.activeElement; const lis = [...el.querySelectorAll(':scope > ul > li')]; return [lis.indexOf(a.closest('li')), lis.findIndex(x => x.classList.contains('is-on'))]; }, sel);
    check(`${name}: an arrow key moves focus with the item, so focus is never on a hidden link`, f2[0] === f2[1] && f2[1] === 1, f2.join());
    const cls = name === 'arc' ? 'kws-arc' : 'kws-spot';
    await p.focus(`${sel} .${cls}-dot[aria-current=true]`); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(900);
    const f3 = await p.evaluate(s => { const el = document.querySelector(s), a = document.activeElement; return [a.getAttribute('aria-current'), a.tabIndex, [...el.querySelectorAll('button')].filter(x => x.tabIndex === 0).length, a.getAttribute('aria-label')]; }, sel);
    check(`${name}: arrow keys on the dots move the wheel and keep focus on the current dot`, f3[0] === 'true' && f3[1] === 0 && f3[2] === 3 && new RegExp(', ' + ((1 + 2) % n + 1) + ' of').test(f3[3]), f3.join());
    await ctx.close();
  }

  // 4. Script off: everything is there, in order, nothing clipped
  { const { ctx, p } = await open(b, { javaScriptEnabled: false });
    const r = await p.evaluate(() => [...document.querySelectorAll('#services .kws-arc, #work .kws-spot')].map(el => { const lis = [...el.querySelectorAll(':scope > ul > li')];
      const vis = x => { const r = x.getBoundingClientRect(), cs = getComputedStyle(x); return r.width > 0 && r.height > 0 && cs.visibility === 'visible' && +cs.opacity === 1; };
      return { n: lis.length, allVisible: lis.every(li => [...li.querySelectorAll('h2,h3,p,a,img,svg')].every(vis)), distinctTops: new Set(lis.map(li => Math.round(li.getBoundingClientRect().top) + ':' + Math.round(li.getBoundingClientRect().left))).size, clipped: getComputedStyle(el).overflow, ctl: el.querySelectorAll('button').length }; }));
    check('script off: nine services and three projects all visible as a plain list, each in its own place, no dead controls', r[0].n === 9 && r[1].n === 3 && r.every(x => x.allVisible && x.distinctTops === x.n && x.clipped === 'visible' && x.ctl === 0), JSON.stringify(r));
    const prices = await p.evaluate(() => [...document.querySelectorAll('#services .kws-arc-price')].map(x => x.textContent));
    check('script off: nine fixed prices as the site words them, in the order of /services/', prices.join('|') === '$1,000, $2,000 or $4,000|priced as a new site|$8,000|$1,500|in every build|$125, $300, $600 or $1,000/mo|$750 or $1,500 per setup|$350 audit · $500 or $1,000/mo|$500', prices.join('|'));
    await ctx.close(); }

  // 5. Reduced motion, and motion paused: instant, no animation frames spent
  for (const mode of ['reduced', 'paused']) {
    const { ctx, p } = await open(b, mode === 'reduced' ? { reducedMotion: 'reduce' } : {});
    if (mode === 'paused') await p.evaluate(() => document.documentElement.setAttribute('data-motion', 'off'));
    for (const [name, sel] of [['arc', A], ['spotlight', S]]) {
      await p.locator(sel).scrollIntoViewIfNeeded();
      const r = await p.evaluate(s => { const el = document.querySelector(s); let frames = 0; const raf = window.requestAnimationFrame; window.requestAnimationFrame = f => { frames++; return raf(f); };
        el.querySelector('button:last-of-type').click(); const lis = [...el.querySelectorAll(':scope > ul > li')];
        const out = { on: lis.findIndex(li => li.classList.contains('is-on')), moving: el.classList.contains('is-moving'), frames, t: (lis[1].querySelector('[class$="-tile"],[class$="-frame"]').style.transform), cap: lis[1].querySelector('[class$="-cap"]').style.opacity };
        window.requestAnimationFrame = raf; return out; }, sel);
      check(`${mode} motion, ${name}: next is instant (same task), no animation frame requested`, r.on === 1 && !r.moving && r.frames === 0 && +r.cap === 1 && /translate\(0px/.test(r.t), JSON.stringify(r));
      // drag: nothing follows the pointer; on release it steps at once
      const box = await p.locator(sel + ' ul').boundingBox(); const cx = box.x + box.width / 2, cy = box.y + 60;
      await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(cx - i * 12, cy);
      const mid = await state(p, sel); await p.mouse.up(); const end = await state(p, sel);
      check(`${mode} motion, ${name}: a drag does not animate; it steps once on release`, mid.on === 1 && end.on === 2 && !end.moving, JSON.stringify([mid.on, end.on]));
    }
    await ctx.close();
  }

  // 6. The mouse wheel is never taken; nothing moves by itself
  { const { ctx, p } = await open(b);
    for (const [name, sel] of [['arc', A], ['spotlight', S]]) {
      await p.locator(sel).scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
      const box = await p.locator(sel + ' ul').boundingBox(); await p.mouse.move(box.x + box.width / 2, box.y + 80);
      const y0 = await p.evaluate(() => scrollY); await p.mouse.wheel(0, 240); await p.waitForTimeout(300); const y1 = await p.evaluate(() => scrollY);
      await p.mouse.wheel(300, 0); await p.waitForTimeout(300); const s = await state(p, sel);
      check(`${name}: wheel over it scrolls the page (${y1 - y0}px) and never turns it`, y1 - y0 === 240 && s.on === 0, JSON.stringify(s));
      await p.mouse.wheel(0, -240); await p.waitForTimeout(200);
    }
    const before = await p.evaluate(() => [...document.querySelectorAll('[data-kws] [style]')].map(x => x.getAttribute('style')).join('|'));
    await p.waitForTimeout(6500);
    const after = await p.evaluate(() => [...document.querySelectorAll('[data-kws] [style]')].map(x => x.getAttribute('style')).join('|'));
    check('left alone for 6.5 seconds, nothing moves (no auto-advance)', before === after);
    await ctx.close(); }

  // 7. A click after a drag does not follow a link; a plain click does
  for (const [name, sel, linkSel] of [['arc', A, '.kws-arc-link'], ['spotlight', S, '.kws-spot-link']]) {
    const { ctx, p } = await open(b);
    await p.locator(sel).scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
    const lb = await p.locator(`${sel} li.is-on ${linkSel}`).boundingBox(); const x = lb.x + lb.width / 2, y = lb.y + lb.height / 2;
    await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(x - i * 5, y); await p.waitForTimeout(16); } for (let i = 5; i >= 0; i--) { await p.mouse.move(x - i * 5, y); await p.waitForTimeout(40); }
    await p.waitForTimeout(150); await p.mouse.up(); await p.waitForTimeout(500);
    const stayed = /demo\.html$/.test(p.url());
    const s = await state(p, sel);
    await p.waitForTimeout(600); await p.mouse.click(x, y); await p.waitForTimeout(600);
    check(`${name}: releasing a drag over the link does not follow it; a plain click on the same link does`, stayed && s.on === 0 && !/demo\.html$/.test(p.url()), p.url());
    await ctx.close();
  }

  // 7b. Clicking a side sign or card brings it to the centre; clicking the one in the centre opens its link
  for (const [name, sel, part] of [['arc', A, '.kws-arc-tile'], ['spotlight', S, '.kws-spot-frame']]) {
    const { ctx, p } = await open(b);
    await p.locator(sel).scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
    const side = await p.locator(`${sel} li >> nth=1 >> ${part}`).boundingBox();
    await p.mouse.click(side.x + side.width - 12, side.y + side.height / 2); await p.waitForTimeout(900);
    const s = await state(p, sel); const still = /demo\.html$/.test(p.url());
    const mid = await p.locator(`${sel} li.is-on ${part}`).boundingBox();
    await p.mouse.click(mid.x + mid.width / 2, mid.y + mid.height / 2); await p.waitForTimeout(600);
    check(`${name}: a click on the side one centres it (no navigation); a click on the centred one opens its link`, s.on === 1 && still && !/demo\.html$/.test(p.url()), p.url());
    await ctx.close();
  }

  // 8. Mount after load, unmount restores the markup exactly, element removal leaves nothing behind
  { const { ctx, p } = await open(b);
    const r = await p.evaluate(async () => {
      const out = {};
      for (const [name, sel] of [['arc', '#client .kws-arc'], ['spotlight', '#client .kws-spot']]) {
        const el = document.querySelector(sel); const off0 = KWS[name].mount(el);   // already mounted: the same remover comes back
        off0(); const bare = el.outerHTML;
        const clone = el.cloneNode(true); el.after(clone);
        const off = KWS[name].mount(clone); const live = clone.classList.contains('is-live') && clone.querySelectorAll('button').length > 2;
        const again = KWS[name].mount(clone) === off;
        clone.querySelector('button:last-of-type').click(); await new Promise(r => setTimeout(r, 120));   // unmount mid-animation
        off(); await new Promise(r => setTimeout(r, 400));
        out[name] = { live, again, restored: clone.outerHTML === bare && !/style=|is-on|aria-roledescription|is-live|button/.test(bare), original: el.outerHTML === bare };
        clone.remove();
        const off2 = KWS[name].mount(el); out[name].remount = el.classList.contains('is-live'); void off2;
      }
      return out; });
    for (const k of Object.keys(r)) check(`${k}: mounts after load; mount() twice returns the same remover; remover restores the markup byte for byte, even mid-animation; remounts`, r[k].live && r[k].again && r[k].restored && r[k].original && r[k].remount, JSON.stringify(r[k]));
    await ctx.close(); }

  await b.close();
  console.log(results.join('\n')); console.log(failed ? `\n${failed} FAILED` : '\nall passed'); process.exit(failed ? 1 : 0);
})();
