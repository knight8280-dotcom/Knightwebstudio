const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const path of ['/work/', '/process/']) for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.waitForTimeout(400);
    const res = await p.evaluate(() => {
      const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
      const bgOf = el => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
      const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
      const rows = new Map();
      const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('svg,.sr-only,[hidden]') || !el.offsetParent) continue; const cs = getComputedStyle(el); const bg = bgOf(el); const fg = over(parse(cs.color), bg); const r = ratio(fg, bg); const size = parseFloat(cs.fontSize); const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700); const key = (el.tagName.toLowerCase() + '.' + (el.className || '') + '<' + (el.parentElement.className || el.parentElement.tagName).toString().slice(0, 18)) + ' ' + cs.color + ' on rgb(' + [bg.r, bg.g, bg.b].map(Math.round) + ')'; if (!rows.has(key)) rows.set(key, { r: +r.toFixed(2), size, need: large ? 3 : 4.5, txt: n.textContent.trim().slice(0, 22) }); }
      const nontext = [];
      for (const el of document.querySelectorAll('main .browser-bar .ico, main .browser, main .btn, main .ticket, main .stamp, main .steps > li, main .case-facts div, main .appt-lines div')) {
        const cs = getComputedStyle(el); const bgParent = bgOf(el.parentElement); const own = bgOf(el);
        if (el.matches('.ico')) nontext.push(['icon stroke ' + (el.closest('section').className.split(' ').pop()), +ratio(over(parse(cs.color), own), own).toFixed(2)]);
        else if (el.matches('.btn')) { const bc = parse(cs.borderTopColor); nontext.push(['btn "' + el.textContent.trim().slice(0, 14) + '" fill vs band', +ratio(own, bgParent).toFixed(2), 'border vs band', +ratio(over(bc, bgParent), bgParent).toFixed(2)]); }
        else if (el.matches('.browser, .ticket, .stamp')) { const bc = parse(cs.borderTopColor); nontext.push([el.className.split(' ')[0] + ' border vs outside', +ratio(over(bc, bgParent), bgParent).toFixed(2), 'fill vs outside', +ratio(own, bgParent).toFixed(2)]); }
      }
      return { text: [...rows.entries()].map(([k, v]) => ({ k, ...v })), nontext };
    });
    const fails = res.text.filter(x => x.r < x.need);
    const low = res.text.filter(x => x.r < x.need + 0.6).map(x => `${x.r} (${x.size}px, need ${x.need}) ${x.k} "${x.txt}"`);
    console.log(`${theme} ${path} ${w}: ${res.text.length} pairs, fails: ${fails.length}`, low.length ? '\n   near/under: ' + low.join('\n   ') : '');
    if (w === 1440) console.log('   non-text:', JSON.stringify([...new Set(res.nontext.map(x => x.join(' ')))]));
    await ctx.close();
  }
  await b.close();
})();
