// 1.4.11: measured contrast of control boundaries, state indicators, icons and chart marks against what is painted next to them.
const { chromium, BASE, ctxFor } = require('./lib');
const fn = (sels) => {
  const parse = c => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
  const bgOf = el => { const st = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a === 1) break; } const b = e === el ? null : parse(getComputedStyle(e, '::before').backgroundColor); if (b && b.a === 1 && getComputedStyle(e, '::before').content !== 'none' && getComputedStyle(e, '::before').position === 'absolute' && e.classList.contains('site-header')) { st.push(b); break; } }
    let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) base = over(st[i], base); return base; };
  const cr = (a, b) => { const la = lum(a), lb = lum(b); return +((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)).toFixed(2); };
  const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  const out = [];
  for (const [sel, prop, pseudo, against] of sels) {
    const el = document.querySelector(sel); if (!el) { continue; }
    const cs = getComputedStyle(el, pseudo || null); let fgc = parse(cs[prop]); if (!fgc) { out.push(`${sel}${pseudo || ''} ${prop}: unparsable ${cs[prop]}`); continue; }
    const outer = bgOf(against === 'self' ? el : el.parentElement); const selfBg = bgOf(el);
    const adj = against === 'self' ? selfBg : outer; fgc = over(fgc, adj);
    out.push(`${(sel + (pseudo || '')).padEnd(46)} ${prop.padEnd(18)} ${hex(fgc)} vs ${against === 'self' ? 'own bg' : 'outside'} ${hex(adj)} = ${cr(fgc, adj)}${cr(fgc, adj) < 3 ? '   <3' : ''}`);
  }
  return out;
};
const PAGES = {
  '/contact/': [['#name', 'borderTopColor', '', 'parent'], ['#package', 'borderTopColor', '', 'parent'], ['#message', 'borderTopColor', '', 'parent'], ['.chip span', 'borderTopColor', '', 'parent'], ['#theme-toggle', 'borderTopColor', '', 'parent'], ['#theme-toggle svg', 'stroke', '', 'self'], ['#theme-toggle .icon-moon', 'color', '', 'self'], ['.talk-tel svg', 'stroke', '', 'self'], ['.req', 'color', '', 'self'], ['#submit-btn', 'backgroundColor', '', 'parent']],
  '/consulting/': [['.field-unit', 'borderTopColor', '', 'parent'], ['#c-calls', 'borderTopColor', '', 'parent'], ['.ledger .bar', 'backgroundColor', '', 'parent'], ['.ledger .bar i', 'backgroundColor', '', 'parent'], ['.ledger .bar b', 'backgroundColor', '', 'parent'], ['.ledger .bar span', 'backgroundColor', '', 'parent'], ['.ledger td .bar-fill', 'backgroundColor', '', 'parent'], ['.payplan-dep', 'backgroundColor', '', 'parent'], ['.payplan-seg:not(.payplan-dep)', 'backgroundColor', '', 'parent'], ['.faq-item summary', 'color', '::after', 'self'], ['.faq-item summary', 'backgroundColor', '::after', 'self'], ['.toc a', 'borderBottomColor', '', 'self']],
  '/pricing/': [['.payplan-dep', 'backgroundColor', '', 'parent'], ['.payplan-seg:not(.payplan-dep)', 'backgroundColor', '', 'parent'], ['.popular', 'backgroundColor', '', 'parent'], ['.is-popular', 'borderTopColor', '', 'parent'], ['.spec tbody tr', 'borderTopColor', '', 'parent'], ['.btn.btn-block:not(.btn-primary)', 'borderTopColor', '', 'parent'], ['.btn-quiet', 'borderTopColor', '', 'parent'], ['.ticks li', 'color', '::before', 'self'], ['.ticks li', 'backgroundColor', '::before', 'self'], ['.cta-band .btn:not(.btn-primary)', 'borderTopColor', '', 'parent'], ['.cta-band .btn-primary', 'backgroundColor', '', 'parent'], ['#nav-toggle .burger', 'backgroundColor', '', 'self'], ['.mobile-cta .btn', 'borderTopColor', '', 'parent']],
  '/faq/': [['.faq-item summary', 'backgroundColor', '::after', 'self'], ['.faq-item summary', 'color', '::after', 'self'], ['.faq-item', 'borderTopColor', '', 'self']],
  '/': [['.more-link svg', 'stroke', '', 'self'], ['.print svg', 'stroke', '', 'self'], ['.price-strip', 'borderTopColor', '', 'parent'], ['.tier', 'borderTopColor', '', 'self'], ['.site-footer a', 'color', '', 'self']],
};
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const w of [390, 1280]) for (const path in PAGES) {
    const ctx = await ctxFor(b, { w, h: 800, theme, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    const r = await p.evaluate(fn, PAGES[path]); console.log(`\n=== ${path} @${w} ${theme}`); r.forEach(l => console.log('   ' + l));
    await ctx.close();
  }
  await b.close();
})();
