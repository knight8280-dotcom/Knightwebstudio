// Motion: (a) reduced motion: anything still animating or invisible; (b) normal: every animation that runs, its length and repeat count;
// (c) IntersectionObserver never firing: what stays invisible; (d) scripts off: what is invisible.
const { chromium, BASE, PAGES, slug, ctxFor } = require('./lib');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const pages = arg('pages', PAGES.join(',')).split(','); const widths = arg('widths', '390,1280').split(',').map(Number);
const invisible = () => { const out = []; for (const el of document.querySelectorAll('main *, footer *, header *')) { if (!el.checkVisibility({ checkVisibilityCSS: true })) continue; const cs = getComputedStyle(el); if (+cs.opacity < 0.99 && el.textContent.trim() && !el.closest('[aria-hidden="true"]')) { const r = el.getBoundingClientRect(); if (r.width > 2 && r.height > 2) out.push((el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 3).join('.') + ' op=' + cs.opacity + ' "' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) + '"')); } } return out; };
(async () => {
  const b = await chromium.launch();
  for (const w of widths) for (const path of pages) {
    const h = w === 390 ? 844 : 800; const lines = [];
    // (a) reduced
    { const ctx = await ctxFor(b, { w, h, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
      const seen = new Set(); const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += Math.round(h * 0.8)) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(80);
        const an = await p.evaluate(() => document.getAnimations().map(a => (a.animationName || a.transitionProperty || a.constructor.name) + ' on ' + (a.effect && a.effect.target ? a.effect.target.tagName + '.' + String(a.effect.target.className && a.effect.target.className.baseVal !== undefined ? a.effect.target.className.baseVal : a.effect.target.className).slice(0, 40) : '?') + (a.effect && a.effect.pseudoElement ? a.effect.pseudoElement : '')));
        an.forEach(x => seen.add(x)); }
      const inv = await p.evaluate(invisible);
      const tr = await p.evaluate(() => { const s = new Set(); for (const el of document.querySelectorAll('*')) { for (const ps of [null, '::before', '::after']) { const cs = getComputedStyle(el, ps); if (ps && cs.content === 'none') continue; const d = cs.transitionDuration.split(',').some(x => parseFloat(x) > 0); const a = cs.animationName !== 'none'; if (d || a) s.add(el.tagName + '.' + String(el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 30) + (ps || '') + (d ? ' transition ' + cs.transitionDuration : '') + (a ? ' animation ' + cs.animationName : '')); } } return [...s]; });
      const sb = await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
      lines.push(`  (a) reduced: running=${seen.size} ${[...seen].slice(0, 6).join(' | ')} ; computed transitions/animations=${tr.length} ${tr.slice(0, 5).join(' | ')} ; invisible=${inv.length} ${inv.slice(0, 4).join(' | ')} ; scroll-behavior=${sb}`);
      await ctx.close(); }
    // (b) normal
    { const ctx = await ctxFor(b, { w, h }); const p = await ctx.newPage(); await p.goto(BASE + path);
      const seen = new Map(); const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += Math.round(h * 0.5)) { await p.evaluate(yy => scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(120);
        const an = await p.evaluate(() => document.getAnimations().map(a => { const t = a.effect.getComputedTiming(); return [(a.animationName || 'transition:' + a.transitionProperty) , t.duration, t.iterations, t.delay, a.effect.target ? a.effect.target.tagName + '.' + String(a.effect.target.className.baseVal !== undefined ? a.effect.target.className.baseVal : a.effect.target.className).slice(0, 30) : '?']; }));
        for (const a of an) { const k = a[0] + '|' + a[4]; if (!seen.has(k)) seen.set(k, a); } }
      await p.waitForTimeout(1500);
      const inv = await p.evaluate(invisible);
      const long = [...seen.values()].filter(a => a[2] === Infinity || a[2] === null || (a[1] * (a[2] || 1) + a[3]) > 5000);
      const names = {}; for (const a of seen.values()) { const k = a[0] + ' ' + a[1] + 'ms x' + a[2]; names[k] = (names[k] || 0) + 1; }
      lines.push(`  (b) normal: animations seen: ${Object.entries(names).map(([k, v]) => k + ' (' + v + ')').join(' ; ')}`);
      if (long.length) lines.push(`      LONG/INFINITE: ${JSON.stringify(long)}`);
      lines.push(`      still invisible at page end after scrolling through: ${inv.length} ${inv.slice(0, 5).join(' | ')}`);
      await ctx.close(); }
    // (c) IO never fires
    { const ctx = await ctxFor(b, { w, h }); await ctx.addInitScript(() => { window.IntersectionObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }; });
      const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(6000);
      const inv = await p.evaluate(invisible); const mc = await p.evaluate(() => { const m = document.getElementById('mobile-cta'); return m ? m.className + ' hidden=' + m.hidden : 'none'; });
      lines.push(`  (c) IO never fires, after 6s: invisible=${inv.length} ${inv.slice(0, 3).join(' | ')} ; phone bar: ${mc}`);
      await ctx.close(); }
    // (d) scripts off
    { const ctx = await ctxFor(b, { w, h, extra: { javaScriptEnabled: false } }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
      const inv = await p.evaluate(invisible).catch(e => ['eval-failed ' + e.message.slice(0, 60)]);
      lines.push(`  (d) scripts off: invisible=${inv.length} ${inv.slice(0, 3).join(' | ')}`);
      await ctx.close(); }
    console.log(`=== ${path} @${w}\n` + lines.join('\n'));
  }
  await b.close();
})();
