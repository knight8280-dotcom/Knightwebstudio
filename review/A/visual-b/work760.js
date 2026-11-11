const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 760, height: 900 } });
  await ctx.route(/plausible|calendly/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/work/'); await p.waitForTimeout(400);
  const out = {};
  for (let w = 740; w <= 1000; w += 4) { await p.setViewportSize({ width: w, height: 900 }); const r = await p.evaluate(() => [...document.querySelectorAll('.case h2')].map(h => { const cs = getComputedStyle(h); return Math.round(h.getBoundingClientRect().height / parseFloat(cs.lineHeight)) + ':' + Math.round(h.getBoundingClientRect().width) + ':' + cs.fontSize; }).join(' | ')); (out[r.replace(/:\d+:/g, ':')] = out[r.replace(/:\d+:/g, ':')] || []).push(w + '(' + r.split(' | ')[0] + ')'); }
  for (const [k, v] of Object.entries(out)) console.log(k, '=>', v[0], '..', v[v.length - 1]);
  await p.setViewportSize({ width: 760, height: 900 });
  console.log(JSON.stringify(await p.evaluate(() => { const c = document.querySelector('.case'); const cc = c.querySelector('.case-copy'); const cs = getComputedStyle(cc); return { caseCols: getComputedStyle(c).gridTemplateColumns, copyDisplay: cs.display, copyCols: cs.gridTemplateColumns, copyW: cc.getBoundingClientRect().width }; })));
  await b.close();
})();
