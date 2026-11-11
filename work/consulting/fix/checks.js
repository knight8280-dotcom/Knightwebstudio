// Page-specific checks: no-JS, keyboard order and rings, anchors, calculator, target sizes, overlap at 320.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/consulting/';
const block = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/;
(async () => {
  const b = await chromium.launch();
  const out = [];
  const ok = (name, pass, extra) => out.push((pass ? 'PASS  ' : 'FAIL  ') + name + (extra ? '  ' + extra : ''));

  // 1. No JavaScript: nothing hidden, nothing transparent, note visible
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, javaScriptEnabled: false });
    await ctx.route(block, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const bad = [];
      for (const e of document.querySelectorAll('main *')) {
        const cs = getComputedStyle(e);
        if (e.closest('.sr-only, [hidden], .wide-only')) continue;
        if (+cs.opacity < 1 && !e.closest('.bubble-typing')) bad.push('opacity ' + e.className);
        if (cs.visibility === 'hidden') bad.push('hidden ' + e.className);
        if (e.matches('.ledger-bar span') && cs.transform !== 'none') bad.push('bar transform');
      }
      const note = document.querySelector('.calc-nojs');
      return { bad: bad.slice(0, 8), note: note && getComputedStyle(note).display !== 'none', sw: document.documentElement.scrollWidth };
    });
    ok('no-JS ' + w + ': nothing faded or hidden', r.bad.length === 0, r.bad.join(', '));
    ok('no-JS ' + w + ': the worksheet note shows', r.note);
    ok('no-JS ' + w + ': no sideways scroll', r.sw <= w, 'scrollWidth ' + r.sw);
    await p.screenshot({ path: __dirname + '/sec/nojs-' + w + '-calc.png', clip: await p.evaluate(() => { const r = document.querySelector('#growth-calc').getBoundingClientRect(); return { x: 0, y: r.top + scrollY - 20, width: innerWidth, height: Math.min(r.height + 40, 1400) }; }), fullPage: true });
    await ctx.close();
  }

  // 2. Keyboard: order and a visible ring on every stop (main only)
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(block, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    const stops = [];
    for (let i = 0; i < 90; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body) return null;
        const cs = getComputedStyle(e);
        const host = e.closest('.field-unit');
        const hs = host ? getComputedStyle(host) : null;
        const ringOn = (parseFloat(cs.outlineWidth) >= 2 && cs.outlineStyle !== 'none') || (hs && parseFloat(hs.outlineWidth) >= 2 && hs.outlineStyle !== 'none');
        const r = e.getBoundingClientRect();
        return { inMain: !!e.closest('main'), inFooter: !!e.closest('footer'), tag: e.tagName, id: e.id, text: (e.textContent || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 40), ring: !!ringOn, y: Math.round(r.top + scrollY), vis: r.top >= 0 && r.bottom <= innerHeight };
      });
      if (!s) continue;
      if (s.inFooter) break;
      if (s.inMain) stops.push(s);
    }
    const noRing = stops.filter(s => !s.ring), offscreen = stops.filter(s => !s.vis);
    let ordered = true; for (let i = 1; i < stops.length; i++) if (stops[i].y < stops[i - 1].y - 700) ordered = false;
    ok('keyboard: ' + stops.length + ' stops in main, every one shows a ring', noRing.length === 0, noRing.map(s => s.text).join(' | '));
    ok('keyboard: focus is always on screen', offscreen.length === 0, offscreen.map(s => s.text).join(' | '));
    ok('keyboard: order follows the page', ordered);
    console.log('  stops: ' + stops.map(s => (s.id || s.text)).join(' > '));
    await ctx.close();
  }

  // 3. Anchors land on their headings (header is sticky)
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
    await ctx.route(block, r => r.abort());
    const p = await ctx.newPage();
    for (const id of ['time', 'how', 'calculator', 'process', 'services', 'plans', 'bundle', 'consulting-faq']) {
      await p.goto(URL + '#' + id); await p.waitForTimeout(350);
      const r = await p.evaluate((id) => {
        const e = document.getElementById(id); if (!e) return null;
        const hdr = document.querySelector('.site-header').getBoundingClientRect().bottom;
        const first = e.querySelector('h2, h3, .eyebrow') || e;
        return { top: Math.round(e.getBoundingClientRect().top), hdr: Math.round(hdr), headTop: Math.round(first.getBoundingClientRect().top), head: first.textContent.trim().slice(0, 30) };
      }, id);
      ok('anchor #' + id + ' at ' + w, !!r && r.headTop >= r.hdr && r.headTop < r.hdr + 260, r ? ('heading "' + r.head + '" ' + (r.headTop - r.hdr) + 'px under the header') : 'missing');
    }
    await ctx.close();
  }

  // 4. Calculator: defaults equal the printed results; typing changes them; ids present
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(block, r => r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
    const raw = await (await ctx.request.get(URL)).text();
    const printed = id => (raw.match(new RegExp('id="' + id + '">([^<]*)<')) || [])[1];
    await p.goto(URL); await p.waitForTimeout(500);
    const ids = ['r-month', 'r-year', 'r-jobs', 'r-calls', 'r-quotes', 'r-hours', 'r-timeval', 'r-payback'];
    const live = await p.evaluate(ids => ids.map(i => document.getElementById(i) && document.getElementById(i).textContent), ids);
    const same = ids.every((i, k) => printed(i) === live[k]);
    ok('calculator: printed results equal what the script computes from the defaults', same, ids.map((i, k) => printed(i) + '=' + live[k]).join(' ; '));
    const inputs = ['c-job', 'c-rate', 'c-calls', 'c-callwin', 'c-quotes', 'c-quotewin', 'c-hours', 'c-auto'];
    const meta = await p.evaluate(ids => ids.map(i => { const e = document.getElementById(i); if (!e) return null; const r = e.getBoundingClientRect(); const l = document.querySelector('label[for=' + i + ']'); return { h: Math.round(r.height), w: Math.round(r.width), im: e.inputMode, label: !!l, fs: parseFloat(getComputedStyle(e).fontSize) }; }), inputs);
    ok('calculator: eight inputs, each labelled, 44px or taller, decimal keypad, 16px+ text', meta.every(m => m && m.label && m.h >= 44 && m.im === 'decimal' && m.fs >= 16), JSON.stringify(meta.map(m => m && [m.w, m.h])));
    await p.fill('#c-job', '250000'); await p.fill('#c-calls', '40'); await p.waitForTimeout(200);
    const after = await p.evaluate(() => ({ t: document.getElementById('r-month').textContent, sw: document.documentElement.scrollWidth, clip: (() => { const i = document.getElementById('c-job'); return i.scrollWidth > i.clientWidth + 1; })() }));
    ok('calculator: results follow the inputs', after.t !== live[0], after.t);
    ok('calculator: a six-figure value fits its box and the page does not scroll sideways', !after.clip && after.sw <= 390, 'scrollWidth ' + after.sw);
    ok('calculator: no console errors', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  // 5. 320px reflow and overlap; 44px targets at 390
  for (const w of [320, 336, 360, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(block, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const th = document.querySelector('.ledger tfoot th'), td = document.querySelector('.ledger tfoot td');
      const range = n => { const g = document.createRange(); g.selectNodeContents(n); return g.getBoundingClientRect(); };
      const a = range(th), c = range(td);
      const small = [...document.querySelectorAll('main a, main button, main input, main summary')].filter(e => { const r = e.getBoundingClientRect(); const inline = getComputedStyle(e).display === 'inline' && e.closest('p'); return r.width && !inline && (r.height < 44); }).map(e => e.textContent.trim().slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().height));
      return { gap: Math.round(c.left - a.right), sw: document.documentElement.scrollWidth, small };
    });
    ok(w + 'px: "Total" and its value do not touch', r.gap >= 8, 'gap ' + r.gap + 'px');
    ok(w + 'px: main content does not scroll sideways', r.sw <= w, 'scrollWidth ' + r.sw);
    if (w === 390) ok('390px: every control in main is 44px or taller', r.small.length === 0, r.small.join(' | '));
    await ctx.close();
  }
  console.log(out.join('\n'));
  console.log(out.filter(l => l.startsWith('FAIL')).length + ' FAIL of ' + out.length);
  await b.close();
})();
