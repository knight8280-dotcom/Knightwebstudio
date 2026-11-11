const { chromium, BASE, slug, ctxFor } = require('./lib');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const pages = arg('pages', '/,/pricing/,/consulting/,/contact/,/services/,/start/,/checkout/,/faq/').split(',');
(async () => {
  const b = await chromium.launch();
  for (const scheme of ['dark', 'light']) for (const w of [390, 1280]) for (const path of pages) {
    const ctx = await ctxFor(b, { w, h: w === 390 ? 844 : 800, theme: scheme, reduced: true, forced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(400);
    if (scheme === 'dark' || path === '/pricing/') await p.screenshot({ path: `shots/forced/${slug(path)}_${w}_${scheme}.png`, fullPage: true });
    // measure: controls that lose their boundary (no border, no outline, background forced)
    const r = await p.evaluate(() => { const out = {}; const canvas = getComputedStyle(document.body).backgroundColor;
      for (const el of document.querySelectorAll('a.btn, button, .chip span, input, select, textarea, .mobile-cta, .site-header, .payplan-seg, .popular, .bar, .ledger .bar, [class*="bar"] i, .pill, .flag, .toc a, .faq-item summary, .price-strip, .tier, .board a')) {
        if (!el.checkVisibility({ checkVisibilityCSS: true }) && !el.closest('.mobile-cta')) continue; const cs = getComputedStyle(el); const bw = ['Top', 'Right', 'Bottom', 'Left'].map(s => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none'); const key = el.tagName.toLowerCase() + '.' + String(el.className).trim().split(/\s+/).slice(0, 3).join('.');
        if (!out[key]) out[key] = { n: 0, bg: cs.backgroundColor, color: cs.color, borders: bw.map(x => x ? 1 : 0).join(''), bcol: cs.borderTopColor, outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow === 'none' ? 'none' : 'yes', fca: cs.forcedColorAdjust, bgImg: cs.backgroundImage.slice(0, 40) }; out[key].n++; }
      return { canvas, out }; });
    if (scheme === 'dark') { console.log(`\n=== ${path} @${w} forced-colors (canvas ${r.canvas})`); for (const [k, v] of Object.entries(r.out)) console.log(`   ${k} x${v.n} bg=${v.bg} color=${v.color} borders(TRBL)=${v.borders} ${v.bcol} outline=${v.outline} fca=${v.fca} bgimg=${v.bgImg}`); }
    await ctx.close();
  }
  await b.close();
})();
