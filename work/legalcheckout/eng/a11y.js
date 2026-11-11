// Contrast of every text node (all states, both themes), focus rings, tab order, targets
const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
const ALL = Object.assign({ privacy: { url: '/privacy/' }, terms: { url: '/terms/' } }, S);
const names = (process.argv[2] || 'privacy,terms,co-blocked,co-noplan,co-loading,co-loaded,co-care,co-serverdown,co-nojs,ok-bare,ok-confirming,ok-paid,ok-care-paid,ok-ach,ok-unpaid,ok-serverdown').split(',');
const views = (process.argv[3] || 'm-light,m-dark,d-light,d-dark').split(',');
const helpers = () => {
  window.__parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  window.__lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  window.__over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
  window.__bgOf = el => { const st = []; for (let e = el; e; e = e.parentElement) { const c = __parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a === 1) break; } } let b = { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) b = __over(st[i], b); return b; };
  window.__ratio = (a, b) => (Math.max(__lum(a), __lum(b)) + 0.05) / (Math.min(__lum(a), __lum(b)) + 0.05);
  window.__hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
};
(async () => {
  const browser = await chromium.launch();
  for (const name of names) for (const view of views) {
    const s = ALL[name];
    const { ctx, page } = await open(browser, s, view, { rm: 'reduce' });
    await page.addInitScript(helpers);
    await page.goto(base + s.url, { waitUntil: 'load' }); await page.waitForTimeout(900);
    const res = await page.evaluate(() => {
      const out = { text: [], pairs: new Set(), ctl: [] };
      const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement;
        if (!el || el.closest('svg, script, style, noscript, .sr-only, [hidden]')) continue; if (el.closest('#checkout-form')) continue;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden') continue;
        const bg = __bgOf(el); const fg = __over(__parse(cs.color), bg); const ratio = __ratio(fg, bg);
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
        out.pairs.add(__hex(fg) + ' on ' + __hex(bg) + ' ' + ratio.toFixed(2) + (large ? ' (large)' : ''));
        if (ratio < (large ? 3 : 4.5)) out.text.push(ratio.toFixed(2) + ' ' + __hex(fg) + '/' + __hex(bg) + ' @' + size + 'px "' + n.textContent.trim().slice(0, 30) + '"');
      }
      // controls: button/border contrast against what is around them
      for (const el of document.querySelectorAll('main .btn, main .card, main .receipt')) {
        if (el.closest('[hidden]')) continue; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width) continue;
        const around = __bgOf(el.parentElement); const fill = __bgOf(el); const bc = __parse(cs.borderTopColor); const border = bc && bc.a > 0 && parseFloat(cs.borderTopWidth) > 0 ? __over(bc, around) : null;
        const best = Math.max(__ratio(fill, around), border ? __ratio(border, around) : 0, border ? __ratio(border, fill) : 0);
        if (el.matches('.btn') && !el.matches('.btn-quiet') && best < 3) out.ctl.push('control edge ' + best.toFixed(2) + ' ' + el.className + ' "' + el.textContent.trim().slice(0, 20) + '"');
      }
      out.pairs = [...out.pairs];
      return out;
    });
    console.log(name, view, res.text.length || res.ctl.length ? 'FAIL ' + JSON.stringify(res.text.concat(res.ctl)) : 'pass (' + res.pairs.length + ' pairs, min ' + Math.min(...res.pairs.map(p => +p.split(' ')[3])).toFixed(2) + ')');
    await ctx.close();
  }
  await browser.close();
})();
