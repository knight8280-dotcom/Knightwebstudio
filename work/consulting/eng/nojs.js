const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(400);
    // evaluate still works with JS disabled in Playwright (runs in isolated world)
    const r = await p.evaluate(() => {
      const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && el.className.toString) s += '.' + el.className.toString().trim().split(/\s+/).slice(0, 2).join('.'); return s; };
      const out = { htmlClass: document.documentElement.className, theme: document.documentElement.getAttribute('data-theme'), bodyBg: getComputedStyle(document.body).backgroundColor, hidden: [], dead: [], h: document.documentElement.scrollHeight };
      for (const el of document.querySelectorAll('main *, header *, footer *, #mobile-cta, #mobile-cta *')) { if (el.closest('svg, .sr-only, thead, details:not([open]) > :not(summary)')) continue; const cs = getComputedStyle(el); const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!hasText && !el.matches('.ledger-bar span, .btn, input, .phone, .cal, .leads, .notice, .receipt')) continue; let op = 1, vis = cs.visibility, tr = ''; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); op *= +s.opacity; if (s.transform !== 'none' && /matrix\(0,|scale/.test(s.transform)) tr = s.transform; if (s.display === 'none') vis = 'display:none'; }
        const r0 = el.getBoundingClientRect(); const m = cs.transform; const zeroScale = /^matrix\(0, /.test(m);
        if (op < 0.99 || vis !== 'visible' || zeroScale || r0.width === 0) out.hidden.push(`${name(el)} op=${op} vis=${vis} ${zeroScale ? 'scale0' : ''} w=${Math.round(r0.width)} "${el.textContent.trim().slice(0, 30)}"`); }
      for (const el of document.querySelectorAll('button, [data-booking], #theme-toggle, #nav-toggle')) { const cs = getComputedStyle(el); const r0 = el.getBoundingClientRect(); out.dead.push(`${name(el)} display=${cs.display} vis=${cs.visibility} ${Math.round(r0.width)}x${Math.round(r0.height)} href=${el.getAttribute('href') || ''} "${el.textContent.trim().slice(0, 24)}"`); }
      const nav = document.getElementById('nav'); out.nav = nav ? { display: getComputedStyle(nav).display, vis: getComputedStyle(nav).visibility, pos: getComputedStyle(nav).position, h: Math.round(nav.getBoundingClientRect().height), links: nav.querySelectorAll('a').length } : null;
      const note = document.querySelector('.calc-nojs'); out.calcNote = note ? { display: getComputedStyle(note).display, text: note.textContent.trim().slice(0, 80), h: Math.round(note.getBoundingClientRect().height) } : null;
      out.bar = (() => { const m = document.getElementById('mobile-cta'); if (!m) return null; const cs = getComputedStyle(m); return { hiddenAttr: m.hidden, display: cs.display, vis: cs.visibility }; })();
      out.bars = [...document.querySelectorAll('.ledger-bar span')].map(s => Math.round(s.getBoundingClientRect().width));
      out.over = document.documentElement.scrollWidth - innerWidth;
      return out; });
    console.log(`\n== no-JS ${w}`); console.log(JSON.stringify(r, null, 1));
    await p.screenshot({ path: `nojs-${w}-top.png` });
    const calc = p.locator('#growth-calc'); await calc.scrollIntoViewIfNeeded(); await p.screenshot({ path: `nojs-${w}-calc.png` });
    await ctx.close();
  }
  await b.close();
})();
