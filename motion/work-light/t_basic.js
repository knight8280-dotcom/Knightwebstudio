// Behaviour tests for the kit demo: script off, keyboard, tabs semantics, reduced motion, pause, layout shift, console.
const { chromium } = require('playwright');
const URL = 'http://localhost:8730/kit/light/demo.html';
const ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'];
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch({ args: ARGS });

  // ---------- 1. Script off ----------
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const vis = e => { const cs = getComputedStyle(e), r = e.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0; };
      const folders = [...document.querySelectorAll('#pricing .kws-folder')];
      return {
        js: document.documentElement.classList.contains('js'),
        foldersVisible: folders.filter(vis).length, tabsVisible: folders.filter(f => vis(f.querySelector('.kws-folder-tab'))).length,
        prices: folders.map(f => f.querySelector('.kws-folder-tab').textContent.replace(/\s+/g, ' ').trim()),
        buttons: [...document.querySelectorAll('.kws-motion')].filter(vis).length,
        canv: document.querySelectorAll('canvas').length, live: document.querySelectorAll('.is-live').length,
        stillBg: getComputedStyle(document.querySelector('.kws-mark-art .kws-shader'), '::before').backgroundImage.slice(0, 40),
        over: document.documentElement.scrollWidth - innerWidth,
        marks: [...document.querySelectorAll('#services .kws-mark')].filter(vis).length,
        steps: [...document.querySelectorAll('#process .kws-folder')].filter(vis).length,
      };
    });
    ok(!r.js && r.foldersVisible === 4 && r.tabsVisible === 4, 'script off: all four package folders and their tabs show ' + JSON.stringify(r.prices));
    ok(r.buttons === 0, 'script off: the pause button stays hidden (' + r.buttons + ' visible)');
    ok(r.canv === 0 && r.live === 0 && /gradient/.test(r.stillBg), 'script off: no canvas; the ribbon art is its CSS still (' + r.stillBg + '...)');
    ok(r.marks === 3 && r.steps === 4 && r.over <= 0, 'script off: 3 bookmark cards, 4 step folders, no sideways scroll');
    await p.screenshot({ path: 'nojs-390.png', fullPage: true });
    await ctx.close();
  }

  // ---------- 2. Keyboard and tabs semantics ----------
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await block(ctx);
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(1500);
    const sem = await p.evaluate(() => {
      const root = document.querySelector('#pricing .kws-folders'), list = root.querySelector('[role=tablist]');
      const tabs = [...list.querySelectorAll('[role=tab]')], panels = [...root.querySelectorAll('[role=tabpanel]')];
      return {
        label: list.getAttribute('aria-label'), tabs: tabs.length, panels: panels.length,
        selected: tabs.map(t => t.getAttribute('aria-selected')), tabindex: tabs.map(t => t.tabIndex),
        controls: tabs.every(t => document.getElementById(t.getAttribute('aria-controls'))),
        labelled: panels.every(pn => document.getElementById(pn.getAttribute('aria-labelledby'))),
        hiddenPanels: panels.filter(pn => getComputedStyle(pn).visibility === 'hidden').length,
        names: tabs.map(t => t.textContent.replace(/\s+/g, ' ').trim()), isButton: tabs.every(t => t.tagName === 'BUTTON' && t.type === 'button'),
        h: tabs.map(t => Math.round(t.getBoundingClientRect().height)),
      };
    });
    ok(sem.tabs === 4 && sem.panels === 4 && sem.controls && sem.labelled && sem.isButton && sem.label === 'Website packages', 'tabs: tablist "' + sem.label + '", 4 tabs (buttons) wired to 4 panels ' + JSON.stringify(sem.names));
    ok(sem.selected.join() === 'true,false,false,false' && sem.tabindex.join() === '0,-1,-1,-1' && sem.hiddenPanels === 3, 'tabs: first selected, roving tabindex, 3 panels hidden from everyone');
    ok(sem.h.every(x => x >= 44), 'tabs: every tab at least 44px tall ' + JSON.stringify(sem.h));
    // keyboard
    await p.focus('#pricing [role=tab][aria-selected=true]');
    await p.keyboard.press('ArrowRight');
    let st = await p.evaluate(() => ({ a: document.activeElement.textContent.replace(/\s+/g, ' ').trim(), front: document.querySelector('#pricing .is-front').id, ring: getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).outlineWidth }));
    ok(st.a.startsWith('Starter') && st.front === 'pkg-starter', 'keyboard: Right moves to and opens Starter; focus ring ' + st.ring);
    await p.keyboard.press('End');
    st = await p.evaluate(() => ({ a: document.activeElement.textContent.trim(), front: document.querySelector('#pricing .is-front').id }));
    ok(st.front === 'pkg-commerce', 'keyboard: End opens Commerce');
    await p.keyboard.press('ArrowRight');
    st = await p.evaluate(() => document.querySelector('#pricing .is-front').id);
    ok(st === 'pkg-onepage', 'keyboard: Right from the last wraps to the first');
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Home'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
    st = await p.evaluate(() => document.querySelector('#pricing .is-front').id);
    ok(st === 'pkg-business', 'keyboard: Left, Home, Right, Right lands on Business');
    await p.keyboard.press('Tab');
    st = await p.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id, role: document.activeElement.getAttribute('role') }));
    ok(st.role === 'tabpanel' && st.id === 'pkg-business', 'keyboard: Tab goes from the tab to its open panel (' + st.id + ')');
    await p.keyboard.press('Tab');
    st = await p.evaluate(() => ({ t: document.activeElement.textContent.trim(), inPanel: !!document.activeElement.closest('#pkg-business') }));
    ok(st.inPanel, 'keyboard: next Tab reaches the open panel\'s button "' + st.t + '"; hidden panels are skipped');
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
    st = await p.evaluate(() => !!document.activeElement.closest('#pricing .kws-folders'));
    ok(!st, 'keyboard: focus leaves the stack after its two links (not trapped)');
    // card links: focus ring on the whole card
    await p.focus('#services .kws-mark h3 a');
    await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    const ring = await p.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a, '::after'), card = a.closest('.kws-mark').getBoundingClientRect(), r = a.getBoundingClientRect(); return { on: a.matches(':focus-visible'), w: cs.outlineWidth, s: cs.outlineStyle, c: cs.outlineColor, cover: cs.position + ' ' + cs.inset, card: Math.round(card.width) + 'x' + Math.round(card.height) }; });
    ok(ring.on && ring.s === 'solid' && ring.w === '3px', 'keyboard: a bookmark card\'s link shows a 3px ring around the whole card (' + ring.card + ', ' + ring.c + ')');
    // hash opens a folder
    await p.evaluate(() => { location.hash = '#pkg-commerce'; }); await p.waitForTimeout(200);
    st = await p.evaluate(() => document.querySelector('#pricing .is-front').id);
    ok(st === 'pkg-commerce', 'a #hash that names a folder brings it to the front');
    // click
    await p.click('#pricing [role=tab]:nth-child(2)');
    st = await p.evaluate(() => ({ id: document.querySelector('#pricing .is-front').id, moved: document.querySelector('#pricing .kws-folders').classList.contains('is-moved') }));
    ok(st.id === 'pkg-starter' && st.moved, 'click on a tab opens it');
    // pause button
    const mb = await p.evaluate(() => { const b = [...document.querySelectorAll('.kws-motion')].filter(x => !x.hidden); const r = b[0].getBoundingClientRect(); return { n: b.length, label: b[0].getAttribute('aria-label'), w: r.width, h: r.height, attr: document.documentElement.getAttribute('data-motion') }; });
    ok(mb.n === 2 && mb.w >= 44 && mb.h >= 44 && /Pause/.test(mb.label) && mb.attr === null, 'pause button: shown by script, ' + mb.w + 'x' + mb.h + 'px, "' + mb.label + '"');
    await p.evaluate(() => document.querySelector('.footer-links .kws-motion').click());
    let m2 = await p.evaluate(() => ({ attr: document.documentElement.getAttribute('data-motion'), ls: localStorage.getItem('kws-motion'), labels: [...document.querySelectorAll('.kws-motion')].map(b => b.getAttribute('aria-label')) }));
    ok(m2.attr === 'off' && m2.ls === 'off' && m2.labels.every(l => /^Play/.test(l)), 'pause button: one press sets data-motion="off", saves "off", both buttons now read "' + m2.labels[0] + '"');
    await p.reload(); await p.waitForTimeout(800);
    m2 = await p.evaluate(() => document.documentElement.getAttribute('data-motion'));
    ok(m2 === 'off', 'pause button: the choice survives a reload');
    await p.evaluate(() => document.querySelector('.footer-links .kws-motion').click());
    m2 = await p.evaluate(() => ({ attr: document.documentElement.getAttribute('data-motion'), ls: localStorage.getItem('kws-motion') }));
    ok(m2.attr === null && m2.ls === 'on', 'pause button: pressing again resumes and saves "on"');
    ok(errs.length === 0, 'no console errors or page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
    await ctx.close();
  }

  // ---------- 3. Layout shift on upgrade ----------
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); await block(ctx);
    await ctx.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(e.sources.map(s => s.node && (s.node.className || s.node.nodeName)).join(',')); } }).observe({ type: 'layout-shift', buffered: true }); });
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(2500);
    // scroll through so that every layer mounts and draws
    for (let y = 0; y < 9000; y += 700) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(120); }
    const r = await p.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts.slice(0, 5) }));
    ok(r.cls < 0.005, 'layout shift at ' + w + 'px: cumulative ' + r.cls.toFixed(4) + ' ' + JSON.stringify(r.shifts));
    await ctx.close();
  }
  await b.close();
})();
