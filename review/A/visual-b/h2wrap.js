const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 980, height: 900 } });
  await ctx.route(/plausible|calendly/, r => r.abort());
  for (const c of ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville']) {
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-' + c + '/'); await p.waitForTimeout(300);
    const res = {};
    for (let w = 320; w <= 1920; w += 10) {
      await p.setViewportSize({ width: w, height: 900 });
      const all = await p.evaluate(() => [...document.querySelectorAll('main h2')].map(el => { const range = document.createRange(); const out = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const re = /[^\s ]+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const r = range.getClientRects()[0]; if (!r) continue; let L = out.find(l => Math.abs(l.top - r.top) < 8); if (!L) { L = { top: r.top, w: [] }; out.push(L); } L.w.push(m[0]); } } return out.map(l => l.w.join(' ')).join(' / '); }));
      all.forEach((s, i) => { const k = i + '|' + s; (res[k] = res[k] || []).push(w); });
    }
    console.log('==', c);
    for (const [k, v] of Object.entries(res)) { const lines = k.split('|')[1].split(' / '); const bad = lines.length >= 3 || lines.some(l => l.split(' ').length === 1 && lines.length > 1) || /-$/.test(lines[0]) || lines.slice(0, -1).some(l => /-$/.test(l)); if (bad) console.log('  ', k, '@', v[0] + '..' + v[v.length - 1], '(' + v.length + ')'); }
    await p.close();
  }
  await b.close();
})();
