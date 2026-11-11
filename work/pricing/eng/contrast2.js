const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const w of [390, 820, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/'); await p.waitForTimeout(500);
    const res = await p.evaluate(() => {
      const parse = c => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
      const ratio = (a, c) => (Math.max(lum(a), lum(c)) + 0.05) / (Math.min(lum(a), lum(c)) + 0.05);
      const bgOf = el => { const stack = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); let c = parse(cs.backgroundColor);
          if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; }
          // a pseudo sheet behind the content (z-index -1, absolutely positioned)
          for (const ps of ['::before']) { const pc = getComputedStyle(e, ps); if (pc.content !== 'none' && pc.position === 'absolute' && pc.zIndex === '-1') { const c2 = parse(pc.backgroundColor); if (c2 && c2.a > 0) { stack.push(c2); if (c2.a === 1) { e = null; break; } } } }
          if (!e) break; }
        let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
      const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
      const pairs = new Map(); const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('svg, .sr-only, [hidden]')) continue; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width < 2 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (el.closest('thead') && getComputedStyle(el.closest('thead')).position === 'absolute') continue;
        let fg = parse(cs.color); const bg = bgOf(el); fg = over(fg, bg); const size = parseFloat(cs.fontSize), wt = parseInt(cs.fontWeight); const large = size >= 24 || (size >= 18.66 && wt >= 700); const rt = ratio(fg, bg);
        const k = `${hex(fg)} on ${hex(bg)} ${size}px/${wt}`; if (!pairs.has(k)) pairs.set(k, { rt: +rt.toFixed(2), need: large ? 3 : 4.5, eg: n.textContent.trim().slice(0, 28), cls: (el.className || el.tagName).toString().slice(0, 24) }); }
      // controls: border / fill against surroundings
      const ctl = []; for (const el of document.querySelectorAll('main .btn')) { const cs = getComputedStyle(el); const par = bgOf(el.parentElement); const own = parse(cs.backgroundColor); const fill = own && own.a > 0 ? over(own, par) : par; const bd = parse(cs.borderTopColor); const bdc = bd && bd.a > 0 ? over(bd, par) : null;
        const best = Math.max(ratio(fill, par), bdc ? ratio(bdc, par) : 1); const isQuiet = el.classList.contains('btn-quiet'); if (!isQuiet) ctl.push({ t: el.textContent.trim().slice(0, 22), edge: +best.toFixed(2) }); }
      // decorative-but-informative marks
      const marks = []; const tk = document.querySelector('.ticks li'); if (tk) { const a = getComputedStyle(tk, '::after'), bf = getComputedStyle(tk, '::before'); marks.push({ what: 'tick on its circle', r: +ratio(parse(a.borderBottomColor), over(parse(bf.backgroundColor), bgOf(tk))).toFixed(2) }); }
      const s = document.querySelector('.receipt s'); if (s) marks.push({ what: 'struck price', r: +ratio(parse(getComputedStyle(s).color), bgOf(s)).toFixed(2) });
      const tocn = document.querySelector('.toc-name'); marks.push({ what: 'toc underline (blue) vs card', r: +ratio(parse(getComputedStyle(tocn).textDecorationColor), bgOf(tocn)).toFixed(2) });
      const pop = document.querySelector('tr.is-popular'); if (pop) { const pc = getComputedStyle(pop, '::before'); const st = getComputedStyle(pop); marks.push({ what: 'popular sheet frame vs page', frame: pc.content !== 'none' ? pc.borderTopColor : st.borderTopColor, r: +ratio(parse(pc.content !== 'none' && pc.position === 'absolute' ? pc.borderTopColor : st.borderTopColor), bgOf(pop.parentElement)).toFixed(2) }); }
      return { pairs: [...pairs.entries()].map(([k, v]) => ({ k, ...v })).sort((a, c) => a.rt / a.need - c.rt / c.need), ctl, marks };
    });
    const fails = res.pairs.filter(x => x.rt < x.need);
    console.log(`\n${theme} ${w}: ${res.pairs.length} distinct pairs, ${fails.length} fail`);
    for (const x of res.pairs.slice(0, 7)) console.log(`  ${x.rt < x.need ? 'FAIL' : 'ok  '} ${String(x.rt).padEnd(6)} need ${x.need}  ${x.k.padEnd(34)} .${x.cls} "${x.eg}"`);
    console.log('  control edges under 3:1:', JSON.stringify(res.ctl.filter(c => c.edge < 3)), '| marks:', JSON.stringify(res.marks));
    await ctx.close();
  }
  await b.close();
})();
