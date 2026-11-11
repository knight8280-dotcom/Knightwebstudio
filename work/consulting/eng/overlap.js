const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
const widths = process.argv[2] ? process.argv[2].split(',').map(Number) : [360, 390, 430, 600, 768, 820, 980, 1024, 1100, 1280, 1440, 1920];
(async () => {
  const b = await chromium.launch();
  for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const out = { clipped: [], overlaps: [], outside: [], pageH: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth };
      const main = document.querySelector('main');
      const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && el.className.toString) s += '.' + el.className.toString().trim().split(/\s+/).slice(0, 2).join('.'); return s; };
      // text runs
      const runs = []; const w = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.sr-only, [hidden], svg, details:not([open]) .faq-body, h1')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const rg = document.createRange(); rg.selectNodeContents(n); const rects = [...rg.getClientRects()].filter(q => q.width > 1 && q.height > 1); if (!rects.length) continue;
        const l = Math.min(...rects.map(q => q.left)), t = Math.min(...rects.map(q => q.top)), rr = Math.max(...rects.map(q => q.right)), bb = Math.max(...rects.map(q => q.bottom));
        runs.push({ el, n, rects, l, t, r: rr, b: bb, text: n.textContent.trim().slice(0, 40) });
        // clipped by an overflow-hidden ancestor, or outside viewport
        for (let a = el; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(hidden|clip)/.test(s.overflowX + s.overflowY)) { const ar = a.getBoundingClientRect(); if (rr > ar.right + 1 || l < ar.left - 1 || bb > ar.bottom + 1 || t < ar.top - 1) out.clipped.push(`${name(el)} "${n.textContent.trim().slice(0, 30)}" clipped by ${name(a)} (${Math.round(rr - ar.right)}px right, ${Math.round(bb - ar.bottom)}px bottom)`); break; } }
        if (rr > innerWidth + 1 || l < -1) out.outside.push(`${name(el)} "${n.textContent.trim().slice(0, 30)}" ${Math.round(l)}..${Math.round(rr)}`);
        // text outside its own block container
        const blk = el.closest('li, p, td, th, h1, h2, h3, h4, a, label, legend, figcaption, span.pill, .tag') || el; const br = blk.getBoundingClientRect(); if (rr > br.right + 2 || l < br.left - 2) out.outside.push(`${name(el)} "${n.textContent.trim().slice(0, 30)}" pokes out of ${name(blk)} by ${Math.round(Math.max(rr - br.right, br.left - l))}px`);
      }
      // overlaps between text runs of different elements
      const inter = (a, c) => { for (const x of a.rects) for (const y of c.rects) { const ow = Math.min(x.right, y.right) - Math.max(x.left, y.left), oh = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top); if (ow > 2 && oh > 3) return [Math.round(ow), Math.round(oh)]; } return null; };
      for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length && j < i + 60; j++) { const a = runs[i], c = runs[j]; if (a.el === c.el || a.el.contains(c.el) || c.el.contains(a.el)) continue; if (c.t > a.b + 5) continue; const o = inter(a, c); if (o) out.overlaps.push(`"${a.text}" (${name(a.el)}) x "${c.text}" (${name(c.el)}) by ${o[0]}x${o[1]}`); }
      // boxes: fig-n markers overlapping text of neighbours
      for (const m of main.querySelectorAll('.fig-n')) { const mr = m.getBoundingClientRect(); if (!mr.width) continue; for (const ru of runs) { if (ru.el === m) continue; for (const x of ru.rects) { const ow = Math.min(x.right, mr.right) - Math.max(x.left, mr.left), oh = Math.min(x.bottom, mr.bottom) - Math.max(x.top, mr.top); if (ow > 1.5 && oh > 1.5) { out.overlaps.push(`marker ${m.textContent} in ${name(m.parentElement)} covers text "${ru.text}" by ${Math.round(ow)}x${Math.round(oh)}`); break; } } } }
      return out;
    });
    console.log(`\n== ${w}px  height ${r.pageH}  overflowX ${r.over}`);
    for (const k of ['clipped', 'outside', 'overlaps']) [...new Set(r[k])].forEach(x => console.log(`  ${k}: ${x}`));
    await ctx.close();
  }
  await b.close();
})();
