// How does the "Or $X down, then about $Y/mo for 3 months" line break? Variants: span = nowrap span (as built), wj = word joiner after the slash, plain.
const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const engine = process.argv[2] || 'chromium';
  const b = await pw[engine].launch();
  for (const w of [360, 390, 820, 1024, 1100, 1160, 1280, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => {
      const lines = el => { const out = []; const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, last = null, cur = ''; const range = document.createRange(); while ((n = walker.nextNode())) { for (const m of n.textContent.matchAll(/\S+\s*/g)) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].trimEnd().length); const top = Math.round(range.getClientRects()[0].top); if (last !== null && Math.abs(top - last) > 4) { out.push(cur.trim()); cur = ''; } cur += m[0]; last = top; } } out.push(cur.trim()); return out; };
      const res = {};
      for (const v of ['span', 'wj', 'plain']) {
        res[v] = [...document.querySelectorAll('.spec-price small')].map(s => { const base = s.textContent; if (v === 'wj') s.innerHTML = base.replace('/mo', '/⁠mo'); if (v === 'plain') s.textContent = base.replace('⁠', ''); return lines(s).join(' | '); });
      }
      return res;
    });
    for (const v of Object.keys(r)) console.log(engine, w, v.padEnd(5), r[v].join('   ||   '));
    await p.close();
  }
  await b.close();
})();
