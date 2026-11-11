// Capture every settled state (each item centred) of all four carousels, both themes, 390 and 1440, with rects of every visible text.
const { chromium, URL, settle } = require('./lib');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const index = [];
  for (const [W, H] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(600);
    const roots = await p.evaluate(() => [...document.querySelectorAll('.kws-arc,.kws-spot')].map((e, i) => { e.dataset.eng = i; return [i, e.className.split(' ')[0], !!e.closest('.demo-client'), e.querySelectorAll('li').length]; }));
    for (const [ri, cls, client, n] of roots) for (let it = 0; it < n; it++) {
      await p.evaluate(([ri, it]) => { const el = document.querySelector(`[data-eng="${ri}"]`); el.querySelectorAll('[class$=-dot]')[it].click(); document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, el.getBoundingClientRect().top + scrollY - 90); document.activeElement && document.activeElement.blur(); }, [ri, it]);
      await p.waitForTimeout(120); await p.mouse.move(2, 2);
      const rects = await p.evaluate(ri => { const el = document.querySelector(`[data-eng="${ri}"]`); const out = [];
        const eff = e => { let op = 1, sc = 1; for (let x = e; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); op *= parseFloat(cs.opacity); if (cs.transform && cs.transform !== 'none') { const m = new DOMMatrix(cs.transform); sc *= Math.hypot(m.a, m.b); } } return [op, sc]; };
        const push = (e, kind, inner) => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden') return; const [op, sc] = eff(e); if (op < 0.05) return; let r = e.getBoundingClientRect(); if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) return;
          if (inner) { // text node range for tight box
            const rg = document.createRange(); const tn = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).pop(); if (tn) { rg.selectNodeContents(tn); r = rg.getBoundingClientRect(); } }
          out.push({ kind, text: e.textContent.trim().slice(0, 28), x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(cs.fontSize), fw: cs.fontWeight, op: +op.toFixed(2), sc: +sc.toFixed(3), effPx: +(parseFloat(cs.fontSize) * sc).toFixed(1) }); };
        el.querySelectorAll('.kws-arc-tile').forEach(e => push(e, 'tile-label', true));
        el.querySelectorAll('.kws-spot-bar span').forEach(e => push(e, 'bar-url', false));
        el.querySelectorAll('li.is-on :is(.kws-arc-name,.kws-arc-price,.kws-arc-line,.kws-arc-link,.kws-spot-kind,.kws-spot-name,.kws-spot-text,.kws-spot-link)').forEach(e => push(e, e.className.split(' ')[0], false));
        el.querySelectorAll('[class$=-nav]').forEach(e => push(e, 'nav-glyph', false));
        el.querySelectorAll('[class$=-dot]').forEach(e => { const r = e.getBoundingClientRect(); out.push({ kind: e.getAttribute('aria-current') === 'true' ? 'dot-current' : 'dot', text: '', x: r.left + r.width / 2 - 12, y: r.top + r.height / 2 - 8, w: 24, h: 16, fs: 0, op: 1, sc: 1, effPx: 0 }); });
        return out; }, ri);
      const name = `contrast/${W}-${theme}-${ri}-${cls}${client ? '-client' : ''}-${it}`;
      await p.screenshot({ path: name + '.png' }); index.push({ file: name + '.png', W, theme, cls, client, it, rects });
    }
    await ctx.close();
  }
  fs.writeFileSync('contrast/index.json', JSON.stringify(index)); console.log('frames', index.length);
  await b.close();
})();
