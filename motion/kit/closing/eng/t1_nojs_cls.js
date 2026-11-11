// 1. Script off: everything readable, reachable, nothing clipped.  CLS with script, with late fonts.
const { launch, open, end, BLOCK } = require('./common');
const ROOTS = '.kws-close, .kws-appt, .kws-foot';
const PAGES = ['demo.html', 'portable.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html', 'test/notfound-with-kit.html'];
(async () => {
  const b = await launch();
  console.log('== script off ==');
  for (const url of PAGES) for (const [w, h] of [[360, 740], [390, 844], [1440, 900]]) {
    const p = await open(b, url, { ctx: { viewport: { width: w, height: h }, javaScriptEnabled: false } });
    // javaScriptEnabled:false => evaluate still works in Playwright (isolated world)
    const r = await p.evaluate(ROOTS => {
      const out = { hidden: [], clipped: [], off: [], buttons: [], booking: [], kitEls: 0 };
      const vis = el => { const cs = getComputedStyle(el), q = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > .99 && q.width > 1 && q.height > 1; };
      const name = el => (el.className && el.className.baseVal === undefined ? '.' + String(el.className).split(' ')[0] : el.tagName) + ' "' + el.textContent.trim().slice(0, 24) + '"';
      for (const el of document.querySelectorAll(':is(' + ROOTS + ') :is(a, p, h2, li, dt, dd, span, strong, button)')) {
        if (el.closest('[aria-hidden="true"]')) continue;
        out.kitEls++;
        if (el.tagName === 'BUTTON') { if (vis(el)) out.buttons.push(name(el)); continue; }
        if (!vis(el)) { out.hidden.push(name(el)); continue; }
        const q = el.getBoundingClientRect();
        if (q.left < -0.5 || q.right > innerWidth + 0.5) out.off.push(name(el) + ' ' + Math.round(q.left) + '..' + Math.round(q.right));
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible') out.clipped.push(name(el));
        // an ancestor that clips it?
        for (let a = el.parentElement; a && !a.matches('body'); a = a.parentElement) { const cs = getComputedStyle(a); if (/hidden|clip/.test(cs.overflowX + cs.overflowY)) { const aq = a.getBoundingClientRect(); if (q.left < aq.left - 1 || q.right > aq.right + 1 || q.top < aq.top - 1 || q.bottom > aq.bottom + 1) out.clipped.push(name(el) + ' by ' + a.className); } }
      }
      out.booking = [...document.querySelectorAll(':is(' + ROOTS + ') [data-booking]')].map(a => a.getAttribute('href') + (a.target ? ' target=' + a.target : ''));
      out.over = document.documentElement.scrollWidth - innerWidth;
      out.skyH = [...document.querySelectorAll('.kws-skyline')].map(s => Math.round(s.getBoundingClientRect().height));
      out.nameAnim = [...document.querySelectorAll('.kws-skyline-name')].map(n => n.getAnimations().length + ':' + getComputedStyle(n).transform);
      out.hiddenAttr = document.querySelectorAll(':is(' + ROOTS + ') [hidden]').length;
      out.jsClass = document.documentElement.className;
      return out;
    }, ROOTS);
    console.log(`${url} ${w}: kit els ${r.kitEls}; hidden ${r.hidden.length ? r.hidden.join('; ') : 0}; clipped ${r.clipped.length ? r.clipped.join('; ') : 0}; off-screen ${r.off.length ? r.off.join('; ') : 0}; visible buttons ${r.buttons.length ? r.buttons.join(';') : 0} ([hidden] els ${r.hiddenAttr}); booking ${JSON.stringify(r.booking)}; overflow ${r.over}px; scene h ${r.skyH}; name anims ${r.nameAnim}; html class "${r.jsClass}"`);
    if (w !== 360) { await end(p); await p.waitForTimeout(200); await p.screenshot({ path: `nojs-${url.replace(/\W+/g, '-')}-${w}-end.png` }); }
    await p.context().close();
  }

  console.log('\n== layout shift (script on) ==');
  const CLS = () => {
    window.__cls = { total: 0, entries: [] };
    new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; window.__cls.total += e.value;
      window.__cls.entries.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime), src: (e.sources || []).map(s => { const n = s.node && (s.node.nodeType === 1 ? s.node : s.node.parentElement); return n ? (n.closest('.kws-close, .kws-appt, .kws-foot') ? 'KIT:' : '') + (n.className && typeof n.className === 'string' ? n.tagName + '.' + n.className.split(' ').slice(0, 2).join('.') : n.tagName) : '?'; }) }); } }).observe({ type: 'layout-shift', buffered: true });
  };
  for (const [label, o] of [['normal', {}], ['fonts 2.5s late', { lateFonts: 2500 }], ['shader.js 3s late', { lateShader: 3000 }], ['kit css 1.5s late', { lateCss: 1500 }]]) {
    for (const url of ['demo.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html']) for (const [w, h] of [[390, 844], [1440, 900]]) {
      const c = await b.newContext({ viewport: { width: w, height: h } });
      await c.route(BLOCK, r => r.abort());
      if (o.lateFonts) await c.route(/\.woff2/, async r => { await new Promise(s => setTimeout(s, o.lateFonts)); r.continue(); });
      if (o.lateShader) await c.route(/shader\.js/, async r => { await new Promise(s => setTimeout(s, o.lateShader)); r.continue(); });
      if (o.lateCss) await c.route(/closing\/(closing|appt|footer|skyline)\.css/, async r => { await new Promise(s => setTimeout(s, o.lateCss)); r.continue(); });
      await c.addInitScript(CLS);
      const p = await c.newPage();
      await p.goto('http://localhost:8730/kit/closing/' + url, { waitUntil: 'commit' });
      // go straight to the end as a returning visitor would (scroll restoration) and wait for late things there
      await p.waitForLoadState('domcontentloaded');
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      // programmatic scroll (no user input flag): step down the page
      for (let y = 0; y <= H; y += Math.round(h * .8)) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(90); }
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout((o.lateFonts || o.lateShader || o.lateCss || 0) + 1800);
      const r = await p.evaluate(() => window.__cls);
      const kit = r.entries.filter(e => e.src.some(s => /^KIT:/.test(s)));
      console.log(`${label} | ${url} ${w}: CLS ${r.total.toFixed(4)} in ${r.entries.length} shift(s); attributed to kit elements: ${kit.length}${kit.length ? ' ' + JSON.stringify(kit.slice(0, 6)) : ''}${r.entries.length && !kit.length ? ' other: ' + JSON.stringify(r.entries.slice(0, 3)) : ''}`);
      await c.close();
    }
  }
  await b.close();
})();
