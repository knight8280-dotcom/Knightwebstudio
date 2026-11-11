// Text overlap / clipping detector. node overlap.js "360x740,390x844,..." [zoom]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sizes = (process.argv[2] || '360x740,390x844,430x932,768x1024,820x1100,1024x768,1280x800,1440x900,1920x1080').split(',').map(s => s.split('x').map(Number));
const zoom = +(process.argv[3] || 1); const theme = process.argv[4] || 'light';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    if (zoom !== 1) await p.addStyleTag({ content: `html{font-size:${zoom * 100}% !important}` });
    await p.addStyleTag({ content: '.mobile-cta{display:none !important}.site-header{position:static !important}' });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      // text runs: each text node's client rects, tagged with owning element
      const runs = []; const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('svg, .sr-only')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const range = document.createRange(); range.selectNodeContents(n); for (const rc of range.getClientRects()) { if (rc.width < 2 || rc.height < 2) continue; runs.push({ el, n, t: n.textContent.trim().slice(0, 28), l: rc.left, r: rc.right, top: rc.top + scrollY, b: rc.bottom + scrollY }); } }
      const out = { overlaps: [], clipped: [], outside: [], over: document.documentElement.scrollWidth - innerWidth, height: document.documentElement.scrollHeight };
      // pairwise: runs from different text nodes that intersect by more than 2px in both axes
      runs.sort((a, b) => a.top - b.top);
      for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) { const a = runs[i], c = runs[j]; if (c.top > a.b) break; if (a.n === c.n) continue; const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l), oy = Math.min(a.b, c.b) - Math.max(a.top, c.top); if (ox > 2 && oy > 4 && oy > 0.3 * Math.min(a.b - a.top, c.b - c.top)) out.overlaps.push(`"${a.t}" x "${c.t}" (${Math.round(ox)}x${Math.round(oy)}) y=${Math.round(a.top)}`); }
      // text sticking out of its nearest clipping/boxed ancestor or the viewport
      for (const run of runs) { if (run.r > innerWidth + 1 || run.l < -1) out.outside.push(`"${run.t}" ${Math.round(run.l)}..${Math.round(run.r)}`);
        for (let e = run.el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); const boxed = /(hidden|clip|auto|scroll)/.test(cs.overflow) || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0; if (!boxed) continue; const rc = e.getBoundingClientRect(); if (cs.rotate !== 'none' || cs.transform !== 'none') break; if (run.r > rc.right + 1.5 || run.l < rc.left - 1.5 || run.b > rc.bottom + scrollY + 1.5 || run.top < rc.top + scrollY - 1.5) out.clipped.push(`"${run.t}" pokes out of ${e.tagName.toLowerCase()}.${e.className.toString().split(' ')[0]} by r${Math.round(run.r - rc.right)} l${Math.round(rc.left - run.l)} b${Math.round(run.b - rc.bottom - scrollY)} t${Math.round(rc.top + scrollY - run.top)}`); break; } }
      // objects over text: phone, stamp, flag, pins
      const objs = [...document.querySelectorAll('main .hero-phone, main .stamp, main .flag, main .stop-pin, main .bizcard, main .appt, main .notice, main .btn, main .pill')];
      out.objHits = [];
      for (const o of objs) { const rc = o.getBoundingClientRect(); const R = { l: rc.left, r: rc.right, top: rc.top + scrollY, b: rc.bottom + scrollY }; for (const run of runs) { if (o.contains(run.el) || run.el.contains(o)) continue; const ox = Math.min(R.r, run.r) - Math.max(R.l, run.l), oy = Math.min(R.b, run.b) - Math.max(R.top, run.top); if (ox > 2 && oy > 2) out.objHits.push(`${o.className.toString().split(' ').slice(0, 2).join('.')} over "${run.t}" (${Math.round(ox)}x${Math.round(oy)}) y=${Math.round(run.top)}`); } }
      return out;
    });
    console.log(`\n== ${w}x${h} zoom ${zoom} ${theme}: height ${r.height}, page overflow ${r.over}`);
    for (const k of ['overlaps', 'clipped', 'outside', 'objHits']) { const u = [...new Set(r[k])]; if (u.length) { console.log(` ${k}:`); u.slice(0, 14).forEach(x => console.log('   ' + x)); } }
    await ctx.close();
  }
  await b.close();
})();
