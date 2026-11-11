// Behaviour checks for the light group after the fix pass. node t_behave.js  → PASS/FAIL lines, exit code 1 on any FAIL.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = 'http://localhost:8730/kit/light/', ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'];
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/;
let fails = 0; const errs = [];
const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  [' + (typeof info === 'string' ? info : JSON.stringify(info)) + ']' : '')); if (!cond) fails++; };
const open = async (b, o = {}) => {
  const c = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, colorScheme: o.theme || 'light', reducedMotion: o.reduce ? 'reduce' : 'no-preference', javaScriptEnabled: o.js !== false, hasTouch: !!o.touch, forcedColors: o.forced ? 'active' : 'none', deviceScaleFactor: o.dsf || 1 });
  await c.route(BLOCK, r => r.abort());
  if (o.block) await c.route(o.block, r => r.abort());
  await c.addInitScript(([t, m]) => { try { localStorage.setItem('theme', t); localStorage.setItem('bare-theme', t); if (m) localStorage.setItem('kws-motion', m); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, [o.theme || 'light', o.motion || '']);
  if (o.init) await c.addInitScript(o.init);
  const p = await c.newPage();
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_BLOCKED/.test(m.text())) errs.push((o.page || 'demo') + ': ' + m.text()); });
  p.on('pageerror', e => errs.push((o.page || 'demo') + ' pageerror: ' + e.message));
  await p.goto(BASE + (o.page || 'demo.html'), { waitUntil: 'load' }); await p.waitForTimeout(o.wait || 1200);
  return { c, p };
};
const INSTRUMENT = () => {
  window.__draws = 0; window.__rafs = 0;
  const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap;
  ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); };
  const r = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { window.__rafs++; return r.call(window, f); };
};
const go = (p, sel, off = 110) => p.evaluate(([s, o]) => { const r = document.querySelector(s).getBoundingClientRect(); scrollTo({ top: scrollY + r.top - o, behavior: 'instant' }); }, [sel, off]);

(async () => {
  const b = await chromium.launch({ args: ARGS });

  // ---------- 1. script off ----------
  for (const w of [390, 1440]) {
    const { c, p } = await open(b, { w, h: 900, js: false });
    const r = await p.evaluate(() => {
      const vis = e => { const s = getComputedStyle(e), q = e.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && q.width > 0 && q.height > 0; };
      const st = [...document.querySelectorAll('#pricing .kws-folder')];
      return { folders: st.filter(vis).length, tabs: st.filter(f => vis(f.querySelector('.kws-folder-tab'))).length, prices: st.map(f => f.querySelector('.kws-folder-tab').textContent.trim()), tabFont: parseFloat(getComputedStyle(st[0].querySelector('.kws-folder-tab')).fontSize),
        marks: [...document.querySelectorAll('#services .kws-mark')].filter(vis).length, steps: [...document.querySelectorAll('#process .kws-folder')].filter(vis).length, canvas: document.querySelectorAll('canvas').length,
        pause: [...document.querySelectorAll('.kws-motion')].filter(vis).length, sx: document.documentElement.scrollWidth - innerWidth };
    });
    ok(`script off ${w}: four package folders with their tabs, three cards, four steps, no canvas, no pause button, no sideways scroll`, r.folders === 4 && r.tabs === 4 && r.marks === 3 && r.steps === 4 && r.canvas === 0 && r.pause === 0 && r.sx <= 0, r);
    ok(`script off ${w}: folder headings are 15px or more`, r.tabFont >= 15, r.tabFont);
    await c.close();
  }

  // ---------- 2. upgrade: no layout shift; cards.js blocked or late → the plain list ----------
  for (const [w, h] of [[390, 844], [820, 1000], [1440, 900]]) {
    const { c, p } = await open(b, { w, h, init: () => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); }, wait: 2500 });
    for (let y = 0; y < 12000; y += 600) { await p.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(120); }
    const cls = await p.evaluate(() => window.__cls);
    ok(`layout shift on upgrade and through a scroll of the page, ${w}px`, cls < 0.0005, cls.toFixed(4));
    await c.close();
  }
  for (const w of [390, 820, 1440]) {   // the stack's height before and after cards.js builds the tabs
    const c = await b.newContext({ viewport: { width: w, height: 900 } }); await c.route(BLOCK, r => r.abort());
    let release; const held = new Promise(r => release = r);
    await c.route('**/cards.js', async route => { await held; route.continue(); });
    const p = await c.newPage(); p.goto(BASE + 'demo.html').catch(() => {});
    await p.waitForSelector('#pricing .kws-folders', { state: 'attached' }); await p.waitForTimeout(900);
    const before = await p.evaluate(() => { const r = document.querySelector('#pricing .kws-folders').getBoundingClientRect(), f = document.querySelector('#pricing .kws-folder-body').getBoundingClientRect(); return { h: r.height, body: f.top - r.top, live: document.querySelector('#pricing .kws-folders').classList.contains('is-live') }; });
    release(); await p.waitForFunction(() => document.querySelector('#pricing .kws-folders.is-live')); await p.waitForTimeout(200);
    const after = await p.evaluate(() => { const r = document.querySelector('#pricing .kws-folders').getBoundingClientRect(), f = document.querySelector('#pricing .is-front .kws-folder-body').getBoundingClientRect(); return { h: r.height, body: f.top - r.top }; });
    ok(`stack keeps its exact size when cards.js arrives, ${w}px`, !before.live && Math.abs(before.h - after.h) < 0.5 && Math.abs(before.body - after.body) < 0.5, { before, after });
    await c.close();
  }
  for (const page of ['demo.html', 'portable.html?theme=light']) for (const w of [390, 1440]) {
    const { c, p } = await open(b, { w, page, block: '**/cards.js', wait: 600 });
    const r = await p.evaluate(() => { const st = [...document.querySelectorAll('.kws-folders--stack .kws-folder')]; const vis = e => getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().height > 0; return { n: st.length, shown: st.filter(vis).length, tabs: st.filter(f => vis(f.querySelector('.kws-folder-tab'))).length, js: document.documentElement.classList.contains('kws-js'), links: st.map(f => { const a = f.querySelector('a'); if (!a) return true; const q = a.getBoundingClientRect(); return getComputedStyle(a).visibility !== 'hidden' && q.height > 0; }).every(Boolean) }; });
    ok(`cards.js blocked, ${page.split('?')[0]} ${w}px: every folder, its tab and its links show once the page has loaded`, r.shown === r.n && r.tabs === r.n && r.links && !r.js, r);
    await c.close();
  }
  {   // cards.js stalls (never answers): the four-second escape
    const c = await b.newContext({ viewport: { width: 390, height: 844 } }); await c.route(BLOCK, r => r.abort());
    await c.route('**/cards.js', () => {});   // never fulfilled
    const p = await c.newPage(); p.goto(BASE + 'demo.html').catch(() => {});
    await p.waitForSelector('#pricing .kws-folders', { state: 'attached' }); await p.waitForTimeout(4600);
    const r = await p.evaluate(() => [...document.querySelectorAll('#pricing .kws-folder')].filter(e => getComputedStyle(e).visibility !== 'hidden').length);
    ok('cards.js stalled: all four folders show after four seconds', r === 4, r);
    await c.close();
  }

  // ---------- 3. tabs: semantics, keys, sizes ----------
  for (const w of [360, 390, 1440]) {
    const { c, p } = await open(b, { w, h: 900 });
    await go(p, '#pricing .kws-folders');
    const r = await p.evaluate(() => {
      const root = document.querySelector('#pricing .kws-folders'), list = root.querySelector('[role=tablist]'), tabs = [...list.querySelectorAll('[role=tab]')], panels = [...root.querySelectorAll('[role=tabpanel]')];
      const fit = tabs.map(t => { const r = document.createRange(); r.selectNodeContents(t); const q = r.getBoundingClientRect(), tb = t.getBoundingClientRect(); return Math.round((tb.right - q.right) * 10) / 10; });
      return { label: list.getAttribute('aria-label'), n: tabs.length, button: tabs.every(t => t.tagName === 'BUTTON' && t.type === 'button'), wired: tabs.every((t, i) => t.getAttribute('aria-controls') === panels[i].id && panels[i].getAttribute('aria-labelledby') === t.id),
        selected: tabs.map(t => t.getAttribute('aria-selected')).join(), tabindex: tabs.map(t => t.tabIndex).join(), panelTab: panels.map(x => x.getAttribute('tabindex')).join(),
        nameFont: parseFloat(getComputedStyle(tabs[0]).fontSize), priceFont: parseFloat(getComputedStyle(tabs[0].querySelector('b')).fontSize), h: tabs.map(t => Math.round(t.getBoundingClientRect().height)), wmin: Math.min(...tabs.map(t => t.getBoundingClientRect().width)), spare: Math.min(...fit),
        lines: tabs.map(t => Math.round(t.getBoundingClientRect().height)), hidden: panels.filter(x => getComputedStyle(x).visibility === 'hidden').length, tap: getComputedStyle(tabs[1]).webkitTapHighlightColor,
        unselInk: getComputedStyle(tabs[1]).color === getComputedStyle(tabs[0]).color, ownTab: (() => { const t = root.querySelector('.is-front > .kws-folder-tab'); return getComputedStyle(t).display !== 'none' ? t.innerText.trim() : null; })() };
    });
    ok(`tabs ${w}: a named tab list of four real buttons wired to four panels`, r.label === 'Website packages' && r.n === 4 && r.button && r.wired && r.selected === 'true,false,false,false' && r.tabindex === '0,-1,-1,-1' && r.hidden === 3, r);
    ok(`tabs ${w}: names 15px or more, prices 19px, targets 44px or more, text inside its tab`, r.nameFont >= 15 && r.priceFont >= 19 && Math.min(...r.h) >= 44 && r.wmin >= 44 && r.spare >= 0, { name: r.nameFont, price: r.priceFont, h: r.h, wmin: Math.round(r.wmin), spare: r.spare });
    ok(`tabs ${w}: unselected tabs keep ink text; no tap flash`, r.unselInk && /rgba\(0, 0, 0, 0\)/.test(r.tap), r.tap);
    ok(`tabs ${w}: panels with links take no extra tab stop`, r.panelTab === ',,,', r.panelTab);
    ok(`tabs ${w}: ${w < 700 ? 'the front folder keeps its own tab with the name' : 'the tab row is joined to the panel (own heading hidden)'}`, w < 700 ? r.ownTab === 'One-page' : r.ownTab === null, r.ownTab);
    // keys
    await p.focus('#pricing [role=tab][aria-selected=true]');
    const sel = () => p.evaluate(() => [...document.querySelectorAll('#pricing [role=tab]')].findIndex(t => t.getAttribute('aria-selected') === 'true') + ':' + [...document.querySelectorAll('#pricing [role=tab]')].indexOf(document.activeElement));
    const seq = [];
    for (const k of ['ArrowRight', 'ArrowRight', 'End', 'ArrowRight', 'ArrowLeft', 'Home']) { await p.keyboard.press(k); seq.push(await sel()); }
    ok(`tabs ${w}: Right, Right, End, Right (wraps), Left (wraps), Home`, seq.join(' ') === '1:1 2:2 3:3 0:0 3:3 0:0', seq.join(' '));
    const mods = [];
    for (const k of ['Alt+ArrowRight', 'Control+ArrowRight', 'Shift+ArrowRight', 'Meta+ArrowRight']) { await p.keyboard.press(k); mods.push(await sel()); }
    ok(`tabs ${w}: arrows with Alt, Ctrl, Shift or Meta are left alone`, mods.every(x => x === '0:0'), mods.join(' '));
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('Tab');
    const after = await p.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, inFront: !!a.closest('.is-front'), text: a.textContent.trim().slice(0, 30) }; });
    ok(`tabs ${w}: Tab from the tab goes into the open folder's first link`, after.tag === 'A' && after.inFront, after);
    // focus ring on a tab
    await p.focus('#pricing [role=tab][aria-selected=true]'); await p.keyboard.press('ArrowRight');
    const ring = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor; });
    ok(`tabs ${w}: the kit's own 3px focus ring on a tab`, /solid 3px/.test(ring), ring);
    await c.close();
  }
  {   // fonts blocked: the fallback face must not split a name
    const { c, p } = await open(b, { w: 360, block: /\.woff2/ });
    await go(p, '#pricing .kws-folders');
    const r = await p.evaluate(() => [...document.querySelectorAll('#pricing [role=tab]')].map(t => { const n = t.firstChild, rg = document.createRange(); rg.selectNode(n); return rg.getClientRects().length; }));
    ok('tabs 360, web fonts blocked: every name on one line', r.every(n => n === 1), r);
    await c.close();
  }
  {   // text size 200%
    const { c, p } = await open(b, { w: 390 });
    await p.evaluate(() => { document.documentElement.style.fontSize = '200%'; }); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const t = document.querySelector('#pricing [role=tab]'); return { f: parseFloat(getComputedStyle(t).fontSize), sx: document.documentElement.scrollWidth - innerWidth }; });
    ok('tabs follow the reader\'s text size (root at 200%: 30px names)', r.f >= 29, r);
    await c.close();
  }
  {   // hash, and the phone-only variant across the breakpoint
    const { c, p } = await open(b, { w: 390, page: 'demo.html#pkg-business' });
    let r = await p.evaluate(() => document.querySelector('#pricing .is-front').id);
    ok('a #hash opens its folder on load', r === 'pkg-business', r);
    await p.evaluate(() => { location.hash = '#pkg-commerce'; }); await p.waitForTimeout(200);
    r = await p.evaluate(() => document.querySelector('#pricing .is-front').id);
    ok('a #hash opens its folder when it changes', r === 'pkg-commerce', r);
    const errs0 = errs.length;
    await p.setViewportSize({ width: 900, height: 800 }); await p.waitForTimeout(300);
    r = await p.evaluate(() => { const ph = document.querySelector('.kws-folders--phone'); return { live: ph.classList.contains('is-live'), list: !!ph.querySelector('[role=tablist]'), shown: [...ph.querySelectorAll('.kws-folder')].filter(e => getComputedStyle(e).visibility !== 'hidden').length }; });
    ok('phone-only stack: a plain row from 760px (no tabs, four folders)', !r.live && !r.list && r.shown === 4, r);
    await p.evaluate(() => { location.hash = '#other-brand'; }); await p.waitForTimeout(150);
    await p.evaluate(() => { const f = document.querySelector('.kws-folders--phone .kws-folder'); f.id = 'x-one'; location.hash = '#x-one'; }); await p.waitForTimeout(200);
    ok('phone-only stack torn down: a hash into a folder throws nothing', errs.length === errs0, errs.slice(errs0));
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    r = await p.evaluate(() => document.querySelector('.kws-folders--phone').classList.contains('is-live'));
    ok('phone-only stack: tabs again below 760px', r === true);
    await c.close();
  }
  {   // edge cases on the bare page
    const { c, p } = await open(b, { w: 800, page: 'portable.html?theme=light' });
    const r = await p.evaluate(() => {
      const out = {}, mk = (n, attrs) => { const d = document.createElement('div'); d.className = 'kws-folders kws-folders--stack'; for (const k in attrs) d.setAttribute(k, attrs[k]); for (let i = 0; i < n; i++) d.insertAdjacentHTML('beforeend', `<article class="kws-folder"><h3 class="kws-folder-tab">[T${i}] <b>[P]</b></h3><div class="kws-folder-body"><p>[x]</p></div></article>`); document.body.appendChild(d); return d; };
      let d = mk(3, { 'data-start': '9' }); let end = KWS.folders.mount(d);
      out.start9 = [...d.querySelectorAll('[role=tab]')].map(t => t.getAttribute('aria-selected')).join() + '|' + d.querySelectorAll('.is-front').length;
      out.panelTabindex = [...d.querySelectorAll('[role=tabpanel]')].map(x => x.getAttribute('tabindex')).join();
      out.same = KWS.folders.mount(d) === end; end();
      out.restored = !d.querySelector('[role=tablist]') && !d.classList.contains('is-live') && !d.querySelector('[role],[aria-labelledby],[tabindex]') && [...d.children].every(x => !x.id);
      end(); d.remove();
      d = mk(3, { 'data-start': 'abc' }); KWS.folders.mount(d); out.startAbc = d.querySelectorAll('.is-front').length + ':' + [...d.children].indexOf(d.querySelector('.is-front')); d.remove();
      d = mk(0, {}); KWS.folders.mount(d); out.zero = d.querySelectorAll('[role=tablist]').length; d.remove();
      d = mk(1, {}); KWS.folders.mount(d); out.one = d.querySelectorAll('[role=tab]').length + ':' + d.querySelectorAll('.is-front').length; d.remove();
      // auto-started stack can be removed through a second mount call
      const auto = document.querySelector('[data-kws="folders"]'); const e2 = KWS.folders.mount(auto); e2(); out.autoRemoved = !auto.classList.contains('is-live') && !auto.querySelector('[role=tablist]'); KWS.folders.mount(auto);
      return out;
    });
    ok('data-start="9" on three folders: the last one opens', r.start9 === 'false,false,true|1', r.start9);
    ok('a panel with nothing to focus inside takes tabindex 0', r.panelTabindex === '0,0,0', r.panelTabindex);
    ok('mounting twice returns the same remover; the remover puts the list back as it was', r.same && r.restored, r);
    ok('data-start="abc": the first folder opens', r.startAbc === '1:1', r.startAbc);
    ok('no folders: no tab list is built', r.zero === 0, r.zero);
    ok('one folder: one tab, selected', r.one === '1:1', r.one);
    ok('an auto-started stack can be removed through KWS.folders.mount(el)()', r.autoRemoved);
    await c.close();
  }

  // ---------- 4. motion: the pause button ----------
  {
    const { c, p } = await open(b, { w: 1440, h: 900, init: INSTRUMENT });
    let r = await p.evaluate(() => { const bs = [...document.querySelectorAll('.kws-motion')]; const vis = e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; return { n: bs.length, shown: bs.filter(vis).length, sizes: bs.filter(vis).map(e => { const q = e.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }), names: bs.map(e => e.getAttribute('aria-label') || e.textContent.trim()), labelFont: bs.filter(vis).map(e => parseFloat(getComputedStyle(e).fontSize)) }; });
    ok('pause button: unhidden by script, with a visible name', r.shown >= 2 && r.names.every(n => n === 'Pause motion'), r);
    ok('pause button in the footer: 44px tall or more, label 15px', await p.evaluate(() => { const e = document.querySelector('.footer-links .kws-motion'), q = e.getBoundingClientRect(); return q.height >= 44 && q.width >= 44 && parseFloat(getComputedStyle(e).fontSize) >= 15; }));
    await p.waitForTimeout(800);
    const d0 = await p.evaluate(() => window.__draws); await p.waitForTimeout(1000); const d1 = await p.evaluate(() => window.__draws);
    ok('first screen: the wash draws at its own pace (about ten a second), nothing else', d1 - d0 >= 6 && d1 - d0 <= 14, d1 - d0);
    await p.click('.topbar .kws-motion'); await p.waitForTimeout(300);
    r = await p.evaluate(() => ({ attr: document.documentElement.getAttribute('data-motion'), saved: localStorage.getItem('kws-motion'), names: [...document.querySelectorAll('.kws-motion')].map(e => e.getAttribute('aria-label') || e.textContent.trim()), status: (document.querySelector('.kws-sr[role=status]') || {}).textContent, off: KWS.motion.off() }));
    ok('pressed: data-motion="off", saved, every button says "Play motion", a status says "Motion paused"', r.attr === 'off' && r.saved === 'off' && r.names.every(n => n === 'Play motion') && r.status === 'Motion paused' && r.off, r);
    await p.waitForTimeout(400); const a0 = await p.evaluate(() => [window.__draws, window.__rafs]); await p.waitForTimeout(1000); const a1 = await p.evaluate(() => [window.__draws, window.__rafs]);
    ok('paused: no draws and no animation frames asked for', a1[0] === a0[0] && a1[1] === a0[1], { draws: a1[0] - a0[0], rafs: a1[1] - a0[1] });
    // glints at rest, tab swap instant
    await go(p, '.cta-band'); await p.waitForTimeout(600);
    r = await p.evaluate(() => { const g = [...document.querySelectorAll('.cta-band .kws-glints i')]; return { n: g.length, anim: g.filter(i => getComputedStyle(i).animationName !== 'none').length }; });
    ok('paused: the band\'s glints are there and still', r.n >= 6 && r.anim === 0, r);
    await go(p, '#pricing .kws-folders'); await p.click('#pricing [role=tab]:nth-child(3)');
    r = await p.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => { const f = document.querySelector('#pricing .is-front'), s = getComputedStyle(f); res({ id: f.id, anim: s.animationName, op: s.opacity, tf: s.transform, kids: [...f.querySelectorAll('.kws-folder-body > *')].filter(k => getComputedStyle(k).animationName !== 'none' || getComputedStyle(k).opacity !== '1').length }); }))));
    ok('paused: choosing a tab swaps the folder at once (no animation on the panel or its children)', r.id === 'pkg-business' && r.anim === 'none' && r.op === '1' && r.tf === 'none' && r.kids === 0, r);
    await p.reload(); await p.waitForTimeout(1200);
    r = await p.evaluate(() => ({ attr: document.documentElement.getAttribute('data-motion'), names: [...document.querySelectorAll('.kws-motion')].map(e => e.textContent.trim()) }));
    ok('the choice survives a reload', r.attr === 'off' && r.names.every(n => n === 'Play motion' || n === ''), r);
    // theme change while paused repaints each visible layer once
    await p.evaluate(() => { window.__draws = 0; document.getElementById('theme-toggle').click(); }); await p.waitForTimeout(900);
    r = await p.evaluate(() => ({ draws: window.__draws, theme: document.documentElement.getAttribute('data-theme'), live: document.querySelector('#top .kws-shader').classList.contains('is-live') }));
    ok('theme change while paused: layers repaint once, nothing loops', r.draws >= 1 && r.draws <= 12 && r.theme === 'dark' && r.live, r);
    // another tab changes the choice
    await p.evaluate(() => { localStorage.setItem('kws-motion', 'on'); window.dispatchEvent(new StorageEvent('storage', { key: 'kws-motion', newValue: 'on' })); }); await p.waitForTimeout(200);
    r = await p.evaluate(() => document.documentElement.getAttribute('data-motion'));
    ok('another tab\'s choice (storage event) is followed', r === null, r);
    // double mount, cleanup
    r = await p.evaluate(() => { const bt = document.querySelector('.footer-links .kws-motion'); const e1 = KWS.motion.mount(bt), e2 = KWS.motion.mount(bt); bt.click(); const off1 = document.documentElement.getAttribute('data-motion'); bt.click(); const same = e1 === e2; const nb = document.createElement('button'); nb.className = 'kws-motion'; nb.hidden = true; nb.setAttribute('data-pause', 'Pausa'); nb.setAttribute('data-play', 'Reproducir'); document.body.appendChild(nb); const en = KWS.motion.mount(nb); const lab = nb.getAttribute('aria-label'); en(); const hid = nb.hidden; nb.remove(); return { off1, same, lab, hid, shown: !bt.hidden }; });
    ok('a button mounted twice toggles once per press and has one remover; labels come from data attributes; the remover hides its button', r.off1 === 'off' && r.same && r.lab === 'Pausa' && r.hid && r.shown, r);
    await c.close();
  }
  // glints animate only on screen when motion is on
  {
    const { c, p } = await open(b, { w: 1440, h: 900 });
    let r = await p.evaluate(() => { const g = [...document.querySelectorAll('.cta-band .kws-glints i')]; return { n: g.length, anim: g.filter(i => getComputedStyle(i).animationName !== 'none').length }; });
    ok('glints off screen: placed, not animating', r.n >= 6 && r.anim === 0, r);
    await go(p, '.cta-band'); await p.waitForTimeout(700);
    r = await p.evaluate(() => { const host = document.querySelector('.cta-band'), hb = host.getBoundingClientRect(); const g = [...host.querySelectorAll('.kws-glints i')]; const tw = document.createTreeWalker(host, 4); let n, rects = []; while ((n = tw.nextNode())) if (/\S/.test(n.data)) { const rg = document.createRange(); rg.selectNodeContents(n); rects.push(...rg.getClientRects()); }
      let near = 1e9, edge = 1e9; g.forEach(i => { const q = i.getBoundingClientRect(); edge = Math.min(edge, q.left - hb.left, hb.right - q.right, hb.bottom - q.bottom); rects.forEach(t => { const dx = Math.max(t.left - q.right, q.left - t.right, 0), dy = Math.max(t.top - q.bottom, q.top - t.bottom, 0); near = Math.min(near, Math.hypot(dx, dy)); }); });
      return { n: g.length, anim: g.filter(i => getComputedStyle(i).animationName === 'kws-glint').length, near: Math.round(near), edge: Math.round(edge), sizes: g.map(i => Math.round(i.getBoundingClientRect().width)) }; });
    ok('glints on screen: twinkling, 22px or more from any text, 12px or more from the edges', r.anim === r.n && r.near >= 22 && r.edge >= 12, r);
    await c.close();
  }
  for (const w of [360, 390]) {
    const { c, p } = await open(b, { w });
    await go(p, '.cta-band'); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const host = document.querySelector('.cta-band'), hb = host.getBoundingClientRect(); const g = [...host.querySelectorAll('.kws-glints i')]; let edge = 1e9; g.forEach(i => { const q = i.getBoundingClientRect(); edge = Math.min(edge, q.left, innerWidth - q.right); }); return { n: g.length, edge: Math.round(edge) }; });
    ok(`glints ${w}: none, or at least three, each 12px or more from the screen edge`, r.n === 0 || (r.n >= 3 && r.edge >= 12), r);
    await c.close();
  }

  // ---------- 5. reduced motion ----------
  for (const page of ['demo.html', 'portable.html?theme=light']) {
    const { c, p } = await open(b, { w: 1440, h: 900, reduce: true, page, init: INSTRUMENT, wait: 1800 });
    let r = await p.evaluate(() => ({ attr: document.documentElement.getAttribute('data-motion'), name: document.querySelector('.kws-motion').textContent.trim() || document.querySelector('.kws-motion').getAttribute('aria-label') }));
    ok(`reduced motion, ${page.split('?')[0]}: starts paused, the button offers "Play motion"`, r.attr === 'off' && r.name === 'Play motion', r);
    const a0 = await p.evaluate(() => [window.__draws, window.__rafs]); await p.waitForTimeout(1000); const a1 = await p.evaluate(() => [window.__draws, window.__rafs]);
    r = await p.evaluate(() => [...document.querySelectorAll('.kws-shader')].map(e => e.classList.contains('is-live')));
    ok(`reduced motion, ${page.split('?')[0]}: every layer has its one still frame (also off screen), then nothing is drawn`, a0[0] >= 3 && a1[0] === a0[0] && a1[1] === a0[1], { stills: a0[0], live: r.filter(Boolean).length + '/' + r.length });
    const sel = page.startsWith('demo') ? '#pricing' : 'section';
    await p.evaluate(() => KWS.motion.set(false)); await p.waitForTimeout(200);   // Play pressed: the tab swap must still be instant under reduced motion
    await p.evaluate(() => document.querySelector('.kws-folders--stack [role=tab]:nth-child(3)').scrollIntoView({ block: 'center' }));
    await p.click('.kws-folders--stack [role=tab]:nth-child(3)');
    r = await p.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => { const f = document.querySelector('.kws-folders--stack .is-front'), s = getComputedStyle(f); res({ anim: s.animationName, op: s.opacity, tf: s.transform, moved: f.parentElement.classList.contains('is-moved') }); }))));
    ok(`reduced motion, ${page.split('?')[0]}: the tab swap is instant even after Play`, r.moved && r.anim === 'none' && r.op === '1' && r.tf === 'none', r);
    r = await p.evaluate(() => [...document.querySelectorAll('.kws-glints i')].filter(i => getComputedStyle(i).animationName !== 'none').length);
    ok(`reduced motion, ${page.split('?')[0]}: glints stay still`, r === 0, r);
    await c.close();
  }
  {   // normal motion: the panel animates as a whole on a choice
    const { c, p } = await open(b, { w: 390 });
    await go(p, '#pricing .kws-folders', 96); await p.click('#pricing [role=tab]:nth-child(2)');
    const r = await p.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => { const f = document.querySelector('#pricing .is-front'), s = getComputedStyle(f); res({ anim: s.animationName, dur: s.animationDuration, kids: [...f.querySelectorAll('.kws-folder-body > *')].filter(k => getComputedStyle(k).animationName !== 'none').length }); }))));
    ok('motion on: the whole front folder comes forward (one animation, 0.28s, not per child)', r.anim === 'kws-front' && r.dur === '0.28s' && r.kids === 0, r);
    await c.close();
  }

  // ---------- 6. shader engine ----------
  {
    const { c, p } = await open(b, { w: 1440, h: 900, init: INSTRUMENT, wait: 2500 });
    let r = await p.evaluate(() => { const L = [...document.querySelectorAll('.kws-shader')]; return { n: L.length, live: L.filter(e => e.classList.contains('is-live')).length, dead: L.filter(e => !e.classList.contains('is-live')).map(e => e.dataset.shader + ':' + (e.parentElement.className || '').slice(0, 30)) }; });
    ok('every layer on the page has drawn its first frame before it is scrolled to', r.live === r.n, r);
    await go(p, '#services .kws-marks'); await p.waitForTimeout(900);
    const d0 = await p.evaluate(() => window.__draws); await p.waitForTimeout(2000); const d1 = await p.evaluate(() => window.__draws);
    ok('three ribbon cards on screen share the frames (at most 95 draws a second in all; fewer when the machine is busy)', (d1 - d0) / 2 >= 6 && (d1 - d0) / 2 <= 95, (d1 - d0) / 2);
    // leaks: mount/unmount cycles, removal without cleanup
    r = await p.evaluate(async () => {
      const before = document.querySelectorAll('canvas').length, host = document.querySelector('#services .kws-mark-art');
      for (let i = 0; i < 40; i++) { const s = document.createElement('span'); s.className = 'kws-shader'; s.setAttribute('data-shader', 'ribbon'); host.appendChild(s); const end = KWS.shader.mount(s); const same = KWS.shader.mount(s) === end; await new Promise(r => setTimeout(r, i % 8 ? 0 : 60)); end(); s.remove(); if (!same) return { same }; }
      return { before, after: document.querySelectorAll('canvas').length };
    });
    ok('40 mounts and unmounts leave no canvas behind; a second mount returns the same remover', r.before === r.after, r);
    r = await p.evaluate(async () => { document.querySelectorAll('.kws-shader').forEach(e => e.remove()); await new Promise(r => setTimeout(r, 400)); const a = [window.__draws, window.__rafs]; await new Promise(r => setTimeout(r, 800)); return { draws: window.__draws - a[0], rafs: window.__rafs - a[1], canv: document.querySelectorAll('canvas').length }; });
    ok('layers removed from the page without their remover: the loop stops', r.draws === 0 && r.rafs === 0, r);
    await c.close();
  }
  {   // context loss, running and paused
    for (const motion of ['on', 'off']) {
      const { c, p } = await open(b, { w: 1440, h: 900, motion, wait: 2000 });
      const r = await p.evaluate(async () => {
        const live = () => [...document.querySelectorAll('.kws-shader')].filter(e => e.classList.contains('is-live')).length; const n0 = live();
        const g = OffscreenCanvas.prototype.getContext; let ctxs = 0; OffscreenCanvas.prototype.getContext = function () { ctxs++; return g.apply(this, arguments); };
        // lose the shared context through a second handle on the same canvas
        const probe = new OffscreenCanvas(1, 1).getContext('webgl'); return { n0, note: 'see t_gl' };
      });
      await c.close();
    }
  }
  {   // gradient host, Save-Data, no WebGL, unreadable text
    const { c, p } = await open(b, { w: 1280, h: 900, page: 'portable.html?theme=light', wait: 2200 });
    let r = await p.evaluate(() => { const g = document.querySelector('.block.gradient .kws-shader'), f = document.querySelector('.block:not(.gradient) .kws-shader'); return { gradLive: g.classList.contains('is-live'), gradGlints: g.querySelectorAll('.kws-glints i').length, flatLive: f.classList.contains('is-live'), flatGlints: f.querySelectorAll('.kws-glints i').length, gradBg: getComputedStyle(g.parentElement).backgroundImage.slice(0, 20) }; });
    ok('a block painted with a gradient: the band stays out (no canvas shown, no glints); the flat block beside it runs', !r.gradLive && r.gradGlints === 0 && r.flatLive && r.flatGlints >= 3, r);
    r = await p.evaluate(async () => { const g = document.querySelector('.block.gradient .kws-shader'); g.style.setProperty('--kit-shader-ground', '#523a0c'); KWS.shader.refresh(); await new Promise(r => setTimeout(r, 500)); const live = g.classList.contains('is-live'); g.style.removeProperty('--kit-shader-ground'); KWS.shader.refresh(); await new Promise(r => setTimeout(r, 500)); return { live, after: g.classList.contains('is-live') }; });
    ok('--kit-shader-ground tells the layer its ground, and taking it away puts the still back', r.live && !r.after, r);
    r = await p.evaluate(async () => { const host = document.querySelector('.block.gradient'), g = host.querySelector('.kws-shader'); host.style.backgroundColor = '#523a0c'; KWS.shader.refresh(); await new Promise(r => setTimeout(r, 600)); const live = g.classList.contains('is-live'), glints = g.querySelectorAll('.kws-glints i').length; host.style.backgroundColor = ''; KWS.shader.refresh(); await new Promise(r => setTimeout(r, 500)); return { live, glints, after: g.classList.contains('is-live') }; });
    ok('a band on a gradient laid over a solid background-colour runs (it is opaque and takes its tones from that colour)', r.live && r.glints >= 3 && !r.after, r);
    r = await p.evaluate(async () => { const host = document.querySelector('.top'), g = host.querySelector('.kws-shader'); host.style.background = 'linear-gradient(#F3EEE3, #E9E0CC), #F3EEE3'; KWS.shader.refresh(); await new Promise(r => setTimeout(r, 600)); const live = g.classList.contains('is-live'); host.style.background = ''; KWS.shader.refresh(); await new Promise(r => setTimeout(r, 500)); return { live, after: g.classList.contains('is-live') }; });
    ok('a wash never draws over a gradient, even one with a solid colour under it (it is translucent)', !r.live && r.after, r);
    r = await p.evaluate(async () => { const host = document.querySelector('.top'), layer = host.querySelector('.kws-shader'); const pp = host.querySelector('p:not(.kws-label)'); pp.style.color = '#b9a98a'; KWS.shader.refresh(); await new Promise(r => setTimeout(r, 500)); const dead = !layer.classList.contains('is-live'); pp.style.color = ''; KWS.shader.refresh(); await new Promise(r => setTimeout(r, 500)); return { dead, back: layer.classList.contains('is-live') }; });
    ok('text already too faint on the plain ground: the wash leaves the still; it returns when the text is fixed', r.dead && r.back, r);
    await c.close();
  }
  {
    const b2 = await chromium.launch({ args: ARGS });
    const c = await b2.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: {} }); await c.route(BLOCK, r => r.abort());
    await c.addInitScript(() => { Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }); });
    const p = await c.newPage(); await p.goto(BASE + 'demo.html'); await p.waitForTimeout(1800);
    const r = await p.evaluate(() => ({ canv: document.querySelectorAll('.kws-shader canvas').length, live: document.querySelectorAll('.kws-shader.is-live').length, btn: !document.querySelector('.kws-motion').hidden }));
    ok('Save-Data: no canvas, the CSS stills stay', r.canv === 0 && r.live === 0, r);
    await c.close(); await b2.close();
    const b3 = await chromium.launch({ args: ['--disable-gpu', '--disable-software-rasterizer'] });   // no explicit SwiftShader: WebGL is software or absent
    const c3 = await b3.newContext({ viewport: { width: 1280, height: 900 } }); await c3.route(BLOCK, r => r.abort());
    const p3 = await c3.newPage(); const e3 = []; p3.on('pageerror', e => e3.push(e.message)); await p3.goto(BASE + 'demo.html'); await p3.waitForTimeout(1800);
    const r3 = await p3.evaluate(() => ({ live: document.querySelectorAll('.kws-shader.is-live').length, plain: (() => { const cv = new OffscreenCanvas(2, 2); return !!cv.getContext('webgl'); })(), caveat: (() => { const cv = new OffscreenCanvas(2, 2); return !!cv.getContext('webgl', { failIfMajorPerformanceCaveat: true }); })() }));
    ok('no GPU (software WebGL at best): failIfMajorPerformanceCaveat keeps the stills, no error', r3.live === 0 && !r3.caveat && e3.length === 0, r3);
    await c3.close(); await b3.close();
  }

  // ---------- 7. cards ----------
  for (const w of [390, 820, 1000, 1440]) {
    const { c, p } = await open(b, { w, h: 1000 });
    await go(p, '#services .kws-marks');
    const r = await p.evaluate(() => { const m = [...document.querySelectorAll('#services .kws-mark')]; const top = m.map(e => Math.round(e.getBoundingClientRect().top)); const cols = new Set(m.map(e => Math.round(e.getBoundingClientRect().left))).size;
      const price = m.map(e => [...e.querySelectorAll('.kws-mark-price .kws-nw')].every(s => s.getClientRects().length === 1)); const go = m.map(e => { const g = e.querySelector('.kws-go').getBoundingClientRect(), q = e.getBoundingClientRect(), a = e.querySelector('.kws-mark-art').getBoundingClientRect(); return [Math.round(q.right - g.right), Math.round(q.bottom - g.bottom)]; });
      const a = m[0].querySelector('h3 a'); const link = m.map(e => e.querySelectorAll('a').length); return { cols, price, go, link, role: document.querySelector('#services .kws-marks').getAttribute('role'), h3: m.map(e => e.querySelector('h3').getClientRects().length) }; });
    ok(`bookmark cards ${w}: ${w >= 980 ? 'three across' : 'one column'}; each one link; prices break only between phrases; the arrow sits 20px in`, r.cols === (w >= 980 ? 3 : 1) && r.price.every(Boolean) && r.link.every(n => n === 1) && r.go.every(g => g[0] >= 19 && g[0] <= 21 && g[1] >= 19 && g[1] <= 21) && r.role === 'list', r);
    await c.close();
  }
  {
    const { c, p } = await open(b, { w: 1440, h: 900 });
    await go(p, '#services .kws-marks', 160);
    await p.keyboard.press('Tab');
    await p.focus('#services .kws-mark:nth-child(2) h3 a'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    let r = await p.evaluate(() => { const a = document.activeElement, li = a.closest('.kws-mark'), s = getComputedStyle(li); return { on: a.matches(':focus-visible'), ring: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineOffset, inner: getComputedStyle(a, '::after').outlineStyle }; });
    ok('bookmark card focus: a 3px ring round the whole card, 7px out so it clears the bookmark', r.on && r.ring === 'solid 3px 7px' && r.inner === 'none', r);
    await go(p, '#process .kws-folders', 160);
    await p.focus('#process .kws-folder h3 a'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    r = await p.evaluate(() => { const a = document.activeElement, li = a.closest('.kws-folder'), s = getComputedStyle(li), q = li.getBoundingClientRect(), t = li.querySelector('.kws-folder-tab').getBoundingClientRect(); return { ring: s.outlineStyle + ' ' + s.outlineWidth, enclosesTab: q.top <= t.top && q.left <= t.left, radius: s.borderTopLeftRadius + ' ' + s.borderTopRightRadius }; });
    ok('folder card focus: the ring goes round tab and body together', r.ring === 'solid 3px' && r.enclosesTab, r);
    r = await p.evaluate(() => { const f = [...document.querySelectorAll('#process .kws-folder')]; return { h3: f.map(e => Math.round(e.querySelector('h3').getBoundingClientRect().top)), label: f.map(e => Math.round(e.querySelector('.kws-label').getBoundingClientRect().top)), radius: getComputedStyle(f[1].querySelector('.kws-folder-body')).borderBottomLeftRadius, role: document.querySelector('#process .kws-folders').getAttribute('role') }; });
    ok('folder cards four across: labels and headings share a line; 14px corners (the paper-object radius); the list keeps its role', new Set(r.h3).size === 1 && new Set(r.label).size === 1 && r.radius === '14px' && r.role === 'list', r);
    // hover: lift with a deeper shadow; no flicker at the bottom edge
    await go(p, '#services .kws-marks', 160);
    const box = await p.evaluate(() => { const q = document.querySelector('#services .kws-mark').getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.bottom - 1 }; });
    await p.mouse.move(box.x, box.y); await p.waitForTimeout(500);
    r = await p.evaluate(() => { const m = document.querySelector('#services .kws-mark'); return { hover: m.matches(':hover'), tf: getComputedStyle(m).transform, sh: getComputedStyle(m, '::after').opacity }; });
    ok('pointer on the bottom pixel of a card: it stays lifted (no flicker), the deeper shadow is in', r.hover && /-3\)$/.test(r.tf) && r.sh === '1', r);
    await c.close();
  }
  {   // forced colours
    const { c, p } = await open(b, { w: 1440, h: 900, forced: true });
    const r = await p.evaluate(() => { const t = [...document.querySelectorAll('#pricing [role=tab]')].map(e => { const s = getComputedStyle(e); return s.borderTopWidth + ' ' + s.borderTopColor; }); return t; });
    ok('forced colours: the selected tab has a 3px top border in the highlight colour, the others 1px', r[0].startsWith('3px') && r[1].startsWith('1px') && r[0].split(' ').slice(1).join(' ') !== r[1].split(' ').slice(1).join(' '), r);
    await c.close();
  }
  {   // long content on the bare page at 360
    const { c, p } = await open(b, { w: 360, page: 'portable.html?theme=light' });
    const r = await p.evaluate(async () => {
      const W = 'Donaudampfschifffahrtsgesellschaftskapitaensmuetze';
      document.querySelector('.kws-folders:not(.kws-folders--stack) .kws-folder-body p:last-child').textContent = W + ' ' + W;
      const m = document.querySelector('.kws-mark'); m.querySelector('h3 a').firstChild.data = W; m.querySelector('.kws-mark-price').textContent = '[Price] ' + W;
      const st = document.querySelector('.kws-folders--stack'); const end = KWS.folders.mount(st); end(); st.querySelectorAll('.kws-folder-tab').forEach((t, i) => { t.firstChild.data = ['Internationalisation ', 'Electroencephalography ', 'Counterrevolutionaries '][i]; });
      for (let i = 0; i < 4; i++) st.insertAdjacentHTML('beforeend', `<article class="kws-folder"><h3 class="kws-folder-tab">[Plan ${i + 4}] <b>[Price]</b></h3><div class="kws-folder-body"><p>[x]</p></div></article>`);
      KWS.folders.mount(st); await new Promise(r => setTimeout(r, 300));
      const tabs = [...st.querySelectorAll('[role=tab]')]; const over = tabs.map(t => { const rg = document.createRange(); rg.selectNodeContents(t); const q = rg.getBoundingClientRect(), tb = t.getBoundingClientRect(); return Math.round(Math.max(q.right - tb.right, tb.left - q.left)); });
      const overlap = tabs.some((t, i) => tabs.some((u, j) => { if (i >= j) return false; const a = t.getBoundingClientRect(), bb = u.getBoundingClientRect(); return a.left < bb.right - 1 && bb.left < a.right - 1 && a.top < bb.bottom - 1 && bb.top < a.bottom - 1; }));
      return { sx: document.documentElement.scrollWidth - innerWidth, tabs: tabs.length, minW: Math.round(Math.min(...tabs.map(t => t.getBoundingClientRect().width))), minH: Math.round(Math.min(...tabs.map(t => t.getBoundingClientRect().height))), over: Math.max(...over), overlap };
    });
    ok('long words and seven long tabs at 360px on the bare page: no sideways scroll, tabs 44px or more, no text outside a tab, no overlap', r.sx <= 0 && r.minW >= 44 && r.minH >= 44 && r.over <= 0 && !r.overlap, r);
    await c.close();
  }
  {   // touch: vertical swipes scroll the page
    const { c, p } = await open(b, { w: 390, touch: true });
    const cdp = await c.newCDPSession(p); const res = {};
    for (const [name, sel] of [['ribbon art', '#services .kws-mark-art'], ['tab row', '#pricing [role=tablist]'], ['open folder', '#pricing .is-front .kws-folder-body'], ['band', '.cta-band h2'], ['step folder', '#process .kws-folder']]) {
      await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await p.waitForTimeout(250);
      const q = await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: Math.min(700, r.top + r.height / 2), sy: scrollY }; }, sel);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: q.x, y: q.y }] });
      for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: q.x + i, y: q.y - i * 30 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500);
      res[name] = Math.round(await p.evaluate(() => scrollY) - q.sy);
    }
    ok('touch: a 300px upward swipe that starts on the art, the tabs, the open folder, the band or a step folder scrolls the page', Object.values(res).every(v => v > 200), res);
    await p.evaluate(() => document.querySelector('#pricing [role=tablist]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.tap('#pricing [role=tab]:nth-child(4)'); await p.waitForTimeout(400);
    ok('touch: a tap on a tab opens it', await p.evaluate(() => document.querySelector('#pricing .is-front').id) === 'pkg-commerce');
    await c.close();
  }
  ok('no console errors or page errors in any run', errs.length === 0, errs.slice(0, 6));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
