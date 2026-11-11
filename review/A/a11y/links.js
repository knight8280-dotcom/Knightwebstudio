// (1) links told apart from surrounding text by colour alone (1.4.1); (2) targets under 24px that are not inline in a sentence and have no 24px spacing (2.5.8)
const { chromium, BASE, PAGES, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const w of [390, 1280]) { const agg = new Map(); const tgt = new Map();
    for (const path of PAGES) { const ctx = await ctxFor(b, { w, h: 800, theme, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(250);
      await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
      const r = await p.evaluate(() => {
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2] }; };
        const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
        const cr = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
        const inline = a => { const par = a.parentElement; let t = ''; for (const n of par.childNodes) if (n !== a && (n.nodeType === 3 || (n.nodeType === 1 && !n.matches('a,svg,br')))) t += n.textContent; return t.trim().length > 3 && getComputedStyle(a).display.startsWith('inline'); };
        const col = [], small = []; const targets = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,label.chip')].filter(e => e.checkVisibility({ checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && !e.closest('.hp'));
        for (const a of targets) { const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
          if (a.tagName === 'A' && inline(a)) { const pc = getComputedStyle(a.parentElement); const und = cs.textDecorationLine.includes('underline') || parseFloat(cs.borderBottomWidth) > 0; const bold = parseInt(cs.fontWeight) - parseInt(pc.fontWeight) >= 200; if (!und) col.push(`"${a.textContent.trim().slice(0, 30)}" in <${a.parentElement.tagName.toLowerCase()}.${a.parentElement.className}> underline=${und} weight ${cs.fontWeight} vs ${pc.fontWeight} contrast-with-text=${cr(parse(cs.color), parse(pc.color)).toFixed(2)}`); }
          if (r.width < 24 || r.height < 24) { if (a.tagName === 'A' && inline(a)) continue; if (a.tagName === 'INPUT' && a.closest('label.chip')) continue;
            // spacing: 24px circle centred on the target must not hit another target
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2; let near = null; for (const o of targets) { if (o === a || o.contains(a) || a.contains(o)) continue; const q = o.getBoundingClientRect(); const dx = Math.max(q.left - cx, 0, cx - q.right), dy = Math.max(q.top - cy, 0, cy - q.bottom); if (Math.hypot(dx, dy) < 12) { near = o.textContent.trim().slice(0, 20); break; } }
            small.push(`"${(a.textContent || a.id).trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)} <${a.parentElement.tagName.toLowerCase()}.${a.parentElement.className}> ${near ? 'TOO CLOSE to "' + near + '"' : 'spaced ok'}`); } }
        return { col, small }; });
      for (const c of r.col) { if (!agg.has(c)) agg.set(c, []); agg.get(c).push(path); } for (const c of r.small) { if (!tgt.has(c)) tgt.set(c, []); tgt.get(c).push(path); }
      await ctx.close(); }
    console.log(`\n=== ${theme} @${w}: inline links with no underline: ${agg.size}`); for (const [k, v] of agg) console.log('   ' + k + '  <= ' + v.length + ' pages e.g. ' + v[0]);
    if (theme === 'light') { console.log(`    non-inline targets under 24px: ${tgt.size}`); for (const [k, v] of tgt) console.log('   ' + k + '  <= ' + v.length + ' pages e.g. ' + v[0]); }
  }
  await b.close();
})();
