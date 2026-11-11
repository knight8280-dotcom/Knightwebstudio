const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const [w, pct] of [[390, 125], [390, 150], [390, 200], [1280, 200], [640, 100], [320, 100]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    if (pct !== 100) await p.addStyleTag({ content: `html{font-size:${pct}% !important}` });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && el.className.toString) s += '.' + el.className.toString().trim().split(/\s+/).slice(0, 2).join('.'); return s; };
      const out = { over: document.documentElement.scrollWidth - innerWidth, h: document.documentElement.scrollHeight, bad: [] };
      const runs = []; const tw = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.sr-only, [hidden], svg, details:not([open]) .faq-body, h1, thead')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue; const rg = document.createRange(); rg.selectNodeContents(n); const rects = [...rg.getClientRects()].filter(q => q.width > 1 && q.height > 1); if (!rects.length) continue; const l = Math.min(...rects.map(q => q.left)), rr = Math.max(...rects.map(q => q.right)), t = Math.min(...rects.map(q => q.top)), bb = Math.max(...rects.map(q => q.bottom));
        runs.push({ el, rects, t, b: bb, text: n.textContent.trim().slice(0, 32) });
        if (rr > innerWidth + 1 || l < -1) out.bad.push(`off-screen: ${name(el)} "${n.textContent.trim().slice(0, 30)}" ${Math.round(l)}..${Math.round(rr)}`);
        for (let a = el; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(hidden|clip)/.test(s.overflowX + s.overflowY)) { const ar = a.getBoundingClientRect(); if (rr > ar.right + 1 || bb > ar.bottom + 1) out.bad.push(`clipped: ${name(el)} "${n.textContent.trim().slice(0, 30)}" by ${name(a)} (${Math.round(rr - ar.right)} right, ${Math.round(bb - ar.bottom)} bottom)`); break; } }
        const box = el.closest('.bubble, .pill, .tag, .btn, .payplan-seg, .cal-day i, .flag, .notice, .thread-note, input, .field-unit span, .receipt, .sheet, .cal, .leads, .phone-frame'); if (box) { const br = box.getBoundingClientRect(); if (rr > br.right + 1 || l < br.left - 1 || bb > br.bottom + 2 || t < br.top - 2) out.bad.push(`out of its box: ${name(el)} "${n.textContent.trim().slice(0, 30)}" vs ${name(box)} (${Math.round(rr - br.right)} right, ${Math.round(bb - br.bottom)} bottom)`); } }
      const inter = (a, c) => { for (const x of a.rects) for (const y of c.rects) { const ow = Math.min(x.right, y.right) - Math.max(x.left, y.left), oh = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top); if (ow > 2 && oh > 4) return [Math.round(ow), Math.round(oh)]; } return null; };
      for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length && j < i + 40; j++) { const a = runs[i], c = runs[j]; if (a.el === c.el || a.el.contains(c.el) || c.el.contains(a.el) || a.el.classList.contains('fig-n') || c.el.classList.contains('fig-n')) continue; const o = inter(a, c); if (o) out.bad.push(`overlap: "${a.text}" (${name(a.el)}) x "${c.text}" (${name(c.el)}) ${o[0]}x${o[1]}`); }
      return out; });
    console.log(`\n== viewport ${w}px, text ${pct}%: height ${r.h}, overflowX ${r.over}`); [...new Set(r.bad)].forEach(x => console.log('  ' + x));
    if (pct === 200 || w === 320) await p.screenshot({ path: `zoom-${w}-${pct}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
