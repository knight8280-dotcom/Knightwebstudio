// What a background-colour-only contrast audit cannot see: text under an ancestor with opacity < 1, text over gradients/images, text in SVG, disabled-looking states.
const { chromium, BASE, PAGES, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch();
  for (const theme of ['light', 'dark']) { const agg = new Map();
    for (const w of [390, 1280]) for (const path of PAGES) { const ctx = await ctxFor(b, { w, h: 800, theme, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
      const r = await p.evaluate(() => { const out = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('script,style,.sr-only,[hidden],option,noscript')) continue; if (!el.checkVisibility({ checkVisibilityCSS: true })) continue; if (el.getBoundingClientRect().width < 2) continue;
          let op = 1, img = null, filt = null; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); op *= +cs.opacity; if (!img && cs.backgroundImage !== 'none') img = e.tagName.toLowerCase() + '.' + String(e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(' ').slice(0, 2).join('.') + ' ' + cs.backgroundImage.slice(0, 50); if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && !img) { img = img || 'flat'; } if (cs.mixBlendMode !== 'normal' || cs.filter !== 'none') filt = cs.mixBlendMode + ' ' + cs.filter; }
          const hid = !!el.closest('[aria-hidden="true"]'); const insvg = !!el.closest('svg'); const cls = el.tagName.toLowerCase() + '.' + String(el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(' ').slice(0, 2).join('.');
          if (op < 0.99) out.push(`OPACITY ${op.toFixed(2)} ${cls} "${n.textContent.trim().slice(0, 30)}" color=${getComputedStyle(el).color}${hid ? ' (aria-hidden)' : ''}`);
          if (img && img !== 'flat') out.push(`OVER-IMAGE ${cls} "${n.textContent.trim().slice(0, 24)}" on ${img}${hid ? ' (aria-hidden)' : ''}`);
          if (insvg) out.push(`SVG-TEXT ${cls} "${n.textContent.trim().slice(0, 24)}" fill=${getComputedStyle(el).fill}`);
          if (filt) out.push(`FILTER ${cls} ${filt}`); }
        return out; });
      for (const x of r) { const k = x.replace(/"[^"]*"/, '""'); if (!agg.has(k)) agg.set(k, [x, path + '@' + w]); }
      await ctx.close(); }
    console.log(`\n=== ${theme}: ${agg.size} distinct cases`); for (const [k, v] of agg) console.log('   ' + v[0].slice(0, 230) + '   e.g. ' + v[1]);
  }
  await b.close(); })();
