const { chromium } = require('playwright');
const measure = () => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const bgOf = el => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
  const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const all = [], bad = []; const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('svg, .sr-only, [hidden]')) continue;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none') continue;
    const dd = el.closest('details:not([open])'); if (dd && !el.closest('summary')) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    let fg = parse(cs.color); const bg = bgOf(el); fg = over({ ...fg, a: fg.a * op }, bg); const ratio = cr(fg, bg);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
    const rec = `${ratio.toFixed(2)} ${size}px${bold ? ' bold' : ''} ${(el.className.toString() || el.tagName).slice(0, 30)} | ${n.textContent.trim().slice(0, 28)}`;
    all.push([ratio, rec]); if (ratio < (large ? 3 : 4.5)) bad.push(rec); }
  // non-text: control boundaries and icons
  const nt = [];
  for (const [sel, prop] of [['main .btn', 'borderTopColor'], ['main .tag', 'borderTopColor'], ['main .faq', 'borderTopColor'], ['main summary', '::after'], ['main .more-link svg', 'stroke'], ['.menu-name', 'textDecorationColor'], ['.ticks li', '::after'], ['.faq .ticks', '::after'], ['main .faq-item', 'borderBottomColor'], ['.menu li', 'borderBottomColor']]) {
    for (const el of document.querySelectorAll(sel)) { const r = el.getBoundingClientRect(); if (!r.width) continue; let c; if (prop === '::after') { const a = getComputedStyle(el, '::after'); c = parse(a.borderBottomColor) ; if (sel.includes('summary')) { const m = a.backgroundImage.match(/rgba?\([^)]+\)/); c = m ? parse(m[0]) : null; } } else c = parse(getComputedStyle(el)[prop]);
      if (!c) continue; const own = parse(getComputedStyle(el).backgroundColor); const bg = /btn|tag/.test(sel) && prop.startsWith('border') ? bgOf(el.parentElement) : bgOf(el); const ratio = cr(over(c, bg), bg);
      nt.push(`${ratio.toFixed(2)} ${sel} ${prop}`); break; } }
  all.sort((a, b) => a[0] - b[0]);
  return { bad, lowest: all.slice(0, 6).map(x => x[1]), nt };
};
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const w of [1440, 820, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    const r = await p.evaluate(measure);
    console.log(`\n== ${theme} ${w} all rows open: ${r.bad.length ? 'FAIL ' + JSON.stringify(r.bad) : 'all text AA'}\n   lowest: ${r.lowest.join('\n           ')}\n   non-text: ${r.nt.join(' ; ')}`);
    if (w === 1440) {
      // hover states
      for (const sel of ['.menu a[href="#ecommerce"]', '.menu a[href="#care"]', '#ecommerce summary', '#redesigns summary', 'main .more-link', 'a.price-strip', 'main .btn:not(.btn-primary)', 'main .btn-primary', '.cta-band .btn-primary', '.cta-band .btn:not(.btn-primary)']) {
        await p.locator(sel).first().hover(); await p.waitForTimeout(350);
        const h = await p.evaluate(({ sel, fn }) => { const m = eval('(' + fn + ')'); const el = document.querySelector(sel);
          const parse = c => { const mm = c.match(/rgba?\(([^)]+)\)/); if (!mm) return null; const v = mm[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
          const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
          const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
          const bgOf = el => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
          const res = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const e = n.parentElement; const cs = getComputedStyle(e); const bg = bgOf(e); const fg = over(parse(cs.color), bg); const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05); res.push(`${ratio.toFixed(2)} "${n.textContent.trim().slice(0, 18)}" ${cs.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`); }
          return res.join(' | ') + ' transform:' + getComputedStyle(el).transform; }, { sel, fn: '() => 0' });
        console.log(`   hover ${sel}: ${h}`);
      }
    }
    await ctx.close();
  }
  await b.close();
})();
