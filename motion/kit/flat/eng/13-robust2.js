// Images missing, fonts late, theme toggled mid-move, zoom/reflow/text-spacing, bfcache, mount/unmount details, forced colours.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const log = (ok, name, extra = '') => console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'}  ${name}  ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`);
const cls = () => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(e.value.toFixed(4) + '@' + Math.round(e.startTime) + ' ' + e.sources.map(s => s.node ? (s.node.className || s.node.nodeName) : '?').slice(0, 2).join(',')); } }).observe({ type: 'layout-shift', buffered: true }); };
(async () => {
  const b = await chromium.launch();
  // ---- images missing
  for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: 844 } }); await ctx.route(/work-.*\.jpg/, r => r.abort()); await ctx.addInitScript(cls); const p = await ctx.newPage(); await p.goto(URL + '#work', { waitUntil: 'load' }); await p.waitForTimeout(900);
    const g = await p.evaluate(() => { const el = document.querySelector('#work .kws-spot'); return { frames: [...el.querySelectorAll('.kws-spot-frame')].map(f => { const i = f.querySelector('img'); const r = i.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), i.complete, i.naturalWidth]; }), h: Math.round(el.getBoundingClientRect().height), cls: window.__cls, sx: document.documentElement.scrollWidth - innerWidth }; });
    await scrollToSel(p, '#work .kws-spot', 90); await p.waitForTimeout(200); await p.screenshot({ path: `img-missing-${W}.png` });
    const ctxOk = await b.newContext({ viewport: { width: W, height: 844 } }); const q = await ctxOk.newPage(); await q.goto(URL + '#work', { waitUntil: 'load' }); await q.waitForTimeout(900); const hOk = await q.evaluate(() => Math.round(document.querySelector('#work .kws-spot').getBoundingClientRect().height)); await ctxOk.close();
    log(g.h === hOk && g.sx <= 0, `${W}: screenshots fail to load -> same height as with images (${g.h} vs ${hOk}), frames keep 40:21`, g); await ctx.close(); }
  // ---- fonts late (2.5s): layout shift and held height
  for (const W of [390, 1280]) { const ctx = await b.newContext({ viewport: { width: W, height: 844 } }); await ctx.route(/\.woff2/, async r => { await new Promise(x => setTimeout(x, 2500)); r.continue(); }); await ctx.addInitScript(cls); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'commit' }); await p.waitForTimeout(1500);
    const h0 = await p.evaluate(() => [...document.querySelectorAll('.kws-arc,.kws-spot')].map(e => Math.round(e.getBoundingClientRect().height))); await p.waitForTimeout(3000);
    const r = await p.evaluate(() => ({ h: [...document.querySelectorAll('.kws-arc,.kws-spot')].map(e => Math.round(e.getBoundingClientRect().height)), cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 6) }));
    log(JSON.stringify(h0) === JSON.stringify(r.h), `${W}: fonts arrive 2.5s late -> carousel heights unchanged (${h0} -> ${r.h}); page CLS ${r.cls}`, r.shifts); await ctx.close(); }
  // ---- theme toggled mid-move; motion paused mid-move; reduced-motion flipped at runtime
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const sel = '#services .kws-arc'; await scrollToSel(p, sel); const col = () => p.evaluate(s => { const el = document.querySelector(s); return [getComputedStyle(el.querySelector('li.is-on .kws-arc-tile')).backgroundColor, getComputedStyle(el.querySelector('li.is-on .kws-arc-name')).color, getComputedStyle(document.body).backgroundColor].join(' '); }, sel);
    const c0 = await col(); await p.evaluate(s => { const nx = document.querySelector(s + ' button[aria-label^="Next"]'); nx.click(); nx.click(); nx.click(); }, sel); await p.waitForTimeout(80); await p.click('#theme-toggle'); await p.waitForTimeout(60); const mid = await state(p, sel); await settle(p, sel); const c1 = await col(); const s = await state(p, sel);
    log(c0 !== c1 && s.on === 3 && !s.moving, `theme toggled mid-move: colours switch (${c0} -> ${c1}) and the move finishes on item 4`, { midMoving: mid.moving, on: s.on });
    // pause mid-move
    await p.evaluate(s => { const nx = document.querySelector(s + ' button[aria-label^="Next"]'); for (let i = 0; i < 5; i++) nx.click(); }, sel); await p.waitForTimeout(60); await p.click('#demo-motion'); const t0 = Date.now(); await p.waitForTimeout(50); const st1 = await state(p, sel); const ok = await settle(p, sel, 3000); const took = Date.now() - t0;
    log(null, `motion paused mid-move: the spring in flight ${st1.moving ? 'KEEPS ANIMATING after data-motion=off is set (finishes after ~' + took + 'ms)' : 'stops at once'}`, { movingAfter50ms: st1.moving, pressed: await p.evaluate(() => document.querySelector('#demo-motion').getAttribute('aria-pressed')) });
    await p.click('#demo-motion');
    // reduced motion flipped at runtime mid-move
    await p.evaluate(s => { const nx = document.querySelector(s + ' button[aria-label^="Next"]'); for (let i = 0; i < 5; i++) nx.click(); }, sel); await p.waitForTimeout(60); await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(50); const st2 = await state(p, sel); await settle(p, sel, 3000);
    log(null, `OS reduced-motion switched on mid-move: the spring in flight ${st2.moving ? 'keeps animating until it settles' : 'stops at once'}`);
    log(errs.length === 0, 'no console errors', errs.join(';')); await ctx.close(); }
  // ---- zoom 200% (1280 -> 640 CSS px), reflow 320, text spacing (WCAG 1.4.12), text-only 200%
  for (const [label, W, H, css] of [['200% zoom of a 1280 window (640px)', 640, 400, ''], ['400% zoom / reflow (320px)', 320, 256, ''], ['WCAG text spacing at 390', 390, 844, '*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}'], ['text-only 200% at 390 (root font 32px)', 390, 844, 'html{font-size:200% !important}'], ['text-only 200% at 1280', 1280, 800, 'html{font-size:200% !important}']]) {
    const ctx = await b.newContext({ viewport: { width: W, height: H } }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); if (css) await p.addStyleTag({ content: css }); await p.waitForTimeout(600);
    const res = []; for (const sel of ['#services .kws-arc', '#work .kws-spot']) { for (const it of [0, 1, 5]) { await p.evaluate(([s, it]) => { const d = document.querySelectorAll(s + ' [class$=-dot]'); d[it % d.length].click(); }, [sel, it]); await settle(p, sel);
      res.push(await p.evaluate(s => { const el = document.querySelector(s); const vw = document.documentElement.clientWidth; const on = el.querySelector('li.is-on'); const ctl = el.querySelector('[role=group]').getBoundingClientRect(); const cap = on.querySelector('[class$=-cap]'); const kids = [...cap.children].map(k => k.getBoundingClientRect()); const pic = on.querySelector('.kws-arc-tile,.kws-spot-frame').getBoundingClientRect();
        let overlapKids = 0; for (let i = 1; i < kids.length; i++) if (kids[i].top < kids[i - 1].bottom - 1) overlapKids++;
        const over = [...el.querySelectorAll('*')].filter(e => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || /-sr$/.test(e.className)) return false; let op = 1; for (let x = e; x && x !== document.body; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity); if (op < .02) return false; const r = e.getBoundingClientRect(); return r.width && (r.right > vw + .5 || r.left < -.5); }).length;
        const tile = on.querySelector('.kws-arc-tile'); let labelSpill = 0; if (tile) { const rg = document.createRange(); rg.selectNodeContents(tile.lastChild); labelSpill = Math.round(rg.getBoundingClientRect().width - tile.getBoundingClientRect().width); }
        return { sx: document.documentElement.scrollWidth - vw, capToCtl: Math.round(ctl.top - kids[kids.length - 1].bottom), picToCap: Math.round(kids[0].top - pic.bottom), overlapKids, over, labelSpill, h: Math.round(el.getBoundingClientRect().height) }; }, sel)); } }
    const bad = res.filter(r => r.sx > 0 || r.capToCtl < 0 || r.picToCap < 0 || r.overlapKids || r.over || r.labelSpill > 0);
    await scrollToSel(p, '#services .kws-arc', 20); await p.waitForTimeout(150); await p.screenshot({ path: `zoom-${label.replace(/[^a-z0-9]+/gi, '-').slice(0, 30)}-arc.png` }); await scrollToSel(p, '#work .kws-spot', 20); await p.waitForTimeout(150); await p.screenshot({ path: `zoom-${label.replace(/[^a-z0-9]+/gi, '-').slice(0, 30)}-spot.png` });
    log(bad.length === 0, `${label}: no sideways scroll, no overlap, nothing cut off`, bad.length ? bad.slice(0, 3) : { heights: res.map(r => r.h) }); await ctx.close(); }
  // ---- bfcache / back navigation
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.evaluate(() => { window.__mark = 'kept'; addEventListener('pageshow', e => { sessionStorage.setItem('persisted', String(e.persisted)); }); });
    const sel = '#services .kws-arc'; await p.evaluate(s => { const nx = document.querySelector(s + ' button[aria-label^="Next"]'); nx.click(); nx.click(); }, sel); await settle(p, sel);
    await p.goto('http://localhost:8730/work/', { waitUntil: 'load' }); await p.goBack({ waitUntil: 'load' }); await p.waitForTimeout(600);
    const r = await p.evaluate(s => ({ mark: window.__mark || null, persisted: sessionStorage.getItem('persisted'), live: document.querySelectorAll('.is-live').length, ctl: document.querySelectorAll(s + ' [role=group]').length, on: [...document.querySelectorAll(s + ' li')].findIndex(l => l.classList.contains('is-on')) }), sel);
    await p.evaluate(s => document.querySelector(s + ' button[aria-label^="Next"]').click(), sel); await settle(p, sel); const s2 = await state(p, sel);
    log(r.live === 4 && r.ctl === 1 && s2.nOn === 1, `back navigation (${r.mark ? 'restored from bfcache' : 'page reloaded, not bfcache in this harness'}): four live carousels, one control row, still works`, { ...r, afterNext: s2.on, errs }); await ctx.close(); }
  // ---- mount / unmount details
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(400);
    const r = await p.evaluate(async () => { const out = {}; const el = document.querySelector('#work .kws-spot'); const off = KWS.spotlight.mount(el);
      const frame = el.querySelector('.kws-spot-frame'); off(); out.restoredNoStyle = !frame.hasAttribute('style') && !el.classList.contains('is-live') && !el.querySelector('[role=group]');
      frame.setAttribute('style', 'outline: 2px solid red'); el.querySelector('li').classList.add('is-on'); const off2 = KWS.spotlight.mount(el); off2(); out.authorInlineStyleSurvives = frame.getAttribute('style'); out.authorIsOnSurvives = el.querySelector('li').classList.contains('is-on');
      // after unmount on a .js page: does the hold rule hide items again?
      await new Promise(r => setTimeout(r, 100)); out.afterUnmountVisibleItems = [...el.querySelectorAll('li')].filter(li => li.getBoundingClientRect().height > 10).length; out.htmlJs = document.documentElement.classList.contains('js');
      await new Promise(r => setTimeout(r, 4200)); out.afterUnmount4sVisibleItems = [...el.querySelectorAll('li')].filter(li => li.getBoundingClientRect().height > 10).length;
      // mount on an element with no list / empty list
      const d = document.createElement('section'); d.className = 'kws-arc'; document.body.append(d); out.emptyMount = typeof KWS.arc.mount(d); out.emptyLive = d.classList.contains('is-live');
      const d2 = document.createElement('section'); d2.className = 'kws-arc'; d2.innerHTML = '<ul class="kws-arc-list"><li class="kws-arc-item"><h3>No tile, no cap</h3></li></ul>'; document.body.append(d2); try { KWS.arc.mount(d2); out.malformed = 'mounted'; } catch (e) { out.malformed = 'THROWS ' + e.message; }
      // mount while display:none (zero size), then show
      const c = document.querySelector('.demo-client .kws-arc'); KWS.arc.mount(c)(); c.style.display = 'none'; KWS.arc.mount(c); c.style.display = ''; await new Promise(r => setTimeout(r, 300)); const ts = [...c.querySelectorAll('.kws-arc-tile')].filter(t => getComputedStyle(t).visibility !== 'hidden').map(t => Math.round(t.getBoundingClientRect().left)); out.hiddenThenShown = { distinctLefts: new Set(ts).size, n: ts.length };
      return out; });
    log(r.restoredNoStyle, 'unmount removes controls, classes and inline styles', r);
    log(r.authorInlineStyleSurvives !== null, `an inline style the author had before mount ${r.authorInlineStyleSurvives === null ? 'is DELETED by unmount (documented: the script owns the style attribute)' : 'survives unmount'}`);
    log(null, `after unmount on a page with html.js: ${r.afterUnmountVisibleItems} of 3 items visible at once, ${r.afterUnmount4sVisibleItems} after 4s (the CSS hold re-arms on unmount)`);
    log(!/THROWS/.test(r.malformed), 'malformed item (no tile/caption) does not throw', r.malformed);
    log(r.hiddenThenShown.distinctLefts > 1, 'mounted while display:none, then shown: re-measures and spreads the signs', r.hiddenThenShown);
    log(errs.length === 0, 'no page errors', errs.join(';')); await ctx.close(); }
  // ---- forced colours
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, forcedColors: 'active' }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500); await scrollToSel(p, '#services .kws-arc', 20); await p.waitForTimeout(200); await p.screenshot({ path: 'forced-colors-arc-390.png' }); await scrollToSel(p, '#work .kws-spot', 20); await p.waitForTimeout(200); await p.screenshot({ path: 'forced-colors-spot-390.png' }); await ctx.close(); }
  await b.close();
})();
