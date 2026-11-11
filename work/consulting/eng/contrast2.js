const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    const res = await p.evaluate(() => {
      const parse = c => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
      const ratio = (a, c) => (Math.max(lum(a), lum(c)) + .05) / (Math.min(lum(a), lum(c)) + .05);
      const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
      const bgOf = el => { const stack = []; let img = false; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') img = img || e.tagName + '.' + (e.className || '').toString().split(' ')[0]; const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return { c: base, img }; };
      const opac = el => { let o = 1; for (let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
      const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && el.className.toString) s += '.' + el.className.toString().trim().split(/\s+/).slice(0, 2).join('.'); return s; };
      const text = new Map(), ui = [], all = new Map();
      const tw = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('svg, .sr-only, [hidden], thead')) continue; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width < 2 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        let fg = parse(cs.color); if (!fg) continue; const bg = bgOf(el); const o = opac(el); fg = over({ ...fg, a: fg.a * o }, bg.c); const rt = ratio(fg, bg.c); const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
        const key = `${name(el)} in ${name(el.parentElement)} ${hex(fg)} on ${hex(bg.c)}`; if (!all.has(key)) all.set(key, { rt: +rt.toFixed(2), size, bold, o: +o.toFixed(2), img: bg.img, sample: n.textContent.trim().slice(0, 28) });
        if (rt < (large ? 3 : 4.5)) text.set(key, { rt: +rt.toFixed(2), size, o, sample: n.textContent.trim().slice(0, 28) }); }
      // UI components: borders/fills that carry meaning
      const check = (sel, prop, label, min = 3) => { for (const el of document.querySelectorAll(sel)) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width) continue; const c = parse(cs[prop]); if (!c || c.a === 0) { ui.push(`${label}: ${name(el)} ${prop} transparent`); break; } const bg = bgOf(el.parentElement).c; const eff = over({ ...c, a: c.a * opac(el) }, bg); const rt = ratio(eff, bg); ui.push(`${rt < min ? 'FAIL' : 'ok  '} ${label}: ${name(el)} ${prop} ${hex(eff)} on ${hex(bg)} = ${rt.toFixed(2)}`); break; } };
      check('#growth-calc input', 'borderTopColor', 'input outline');
      check('.field-unit span', 'borderTopColor', 'unit box outline');
      check('.ledger-bar span', 'backgroundColor', 'ledger bar');
      check('.fig-legend li', 'color', 'legend text', 4.5);
      check('.cal-day i.busy', 'backgroundColor', 'calendar busy slot (decorative)');
      check('.cal-day i.new', 'backgroundColor', 'calendar new booking');
      check('.payplan-seg:not(.payplan-dep)', 'backgroundColor', 'payplan month block vs panel');
      check('.payplan-dep', 'backgroundColor', 'payplan deposit block vs panel');
      check('.btn-primary', 'backgroundColor', 'primary button vs page');
      check('.page-head .btn:not(.btn-primary)', 'borderTopColor', 'secondary button outline');
      check('.cta-band .btn:not(.btn-primary)', 'borderTopColor', 'secondary button outline on blue');
      check('.tag', 'borderTopColor', 'price tag outline');
      check('.faq-item summary', 'color', 'faq summary', 4.5);
      // legend marker numbers
      for (const el of [document.querySelector('.fig-n'), document.querySelector('.fig-legend li')]) { if (!el) continue; const cs = getComputedStyle(el, el.matches('li') ? '::before' : null); const fg = parse(cs.color), bg = parse(cs.backgroundColor); if (fg && bg && bg.a) ui.push(`${ratio(fg, bg) < 4.5 ? 'FAIL' : 'ok  '} marker digit ${name(el)}: ${hex(fg)} on ${hex(bg)} = ${ratio(fg, bg).toFixed(2)} @${cs.fontSize}`); }
      return { fails: [...text.entries()], ui, low: [...all.entries()].filter(([k, v]) => v.rt < 5.2 || v.img || v.o < 1).sort((a, c) => a[1].rt - c[1].rt).slice(0, 26) };
    });
    console.log(`\n=== ${theme} ${w}: ${res.fails.length} text failures`); res.fails.forEach(([k, v]) => console.log('  FAIL', k, JSON.stringify(v)));
    if (w === 390) { console.log('  -- lowest text ratios / over images / with opacity:'); res.low.forEach(([k, v]) => console.log('   ', v.rt, v.size + 'px', v.o < 1 ? 'opacity ' + v.o : '', v.img ? 'bg-image:' + v.img : '', '|', k, '|', v.sample)); }
    res.ui.forEach(x => console.log('  ' + x));
    await ctx.close();
  }
  await b.close();
})();
