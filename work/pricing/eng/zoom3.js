const { chromium } = require('playwright');
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  for (const [w, z] of [[320,100],[330,100],[340,100],[350,100],[360,100],[390,100],[390,110],[390,115],[360,110],[360,120]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(z => { document.documentElement.style.fontSize = z + '%'; }, z); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const out = [];
      const rectOfText = el => { const rg = document.createRange(); rg.selectNodeContents(el); return [...rg.getClientRects()].filter(r => r.width > 1); };
      document.querySelectorAll('.spec tbody tr').forEach(tr => { const nm = tr.querySelector('.spec-name'), pr = tr.querySelector('.spec-price'); const nr = nm.firstChild ? (() => { const rg = document.createRange(); rg.selectNode(nm.firstChild); return rg.getBoundingClientRect(); })() : nm.getBoundingClientRect();
        const prg = document.createRange(); prg.selectNode(pr.firstChild); const prr = prg.getBoundingClientRect();
        const x = Math.min(nr.right, prr.right) - Math.max(nr.left, prr.left), y = Math.min(nr.bottom, prr.bottom) - Math.max(nr.top, prr.top);
        const trr = tr.getBoundingClientRect(); if (x > 0 && y > 0) out.push(`NAME/PRICE OVERLAP ${nm.firstChild.textContent.trim()} by ${Math.round(x)}px`); if (prr.left < trr.left || prr.right > trr.right + 1) out.push(`PRICE outside card ${nm.firstChild.textContent.trim()} left ${Math.round(prr.left - trr.left)}`);
        const pop = tr.querySelector('.popular'); if (pop) { const pp = pop.getBoundingClientRect(); const xx = Math.min(pp.right, prr.right) - Math.max(pp.left, prr.left), yy = Math.min(pp.bottom, prr.bottom) - Math.max(pp.top, prr.top); if (xx > 0 && yy > 0) out.push('POPULAR TAB over price'); if (pp.right > trr.right) out.push('POPULAR TAB wider than card by ' + Math.round(pp.right - trr.right)); } });
      const seal = document.querySelector('.toc-seal'); if (seal && getComputedStyle(seal).display !== 'none') { const s = seal.getBoundingClientRect(); for (const el of document.querySelectorAll('.toc .label, .toc-name, .toc-price')) for (const rc of rectOfText(el)) { const x = Math.min(s.right, rc.right) - Math.max(s.left, rc.left), y = Math.min(s.bottom, rc.bottom) - Math.max(s.top, rc.top); if (x > 4 && y > 4) out.push(`SEAL over toc text "${el.textContent.slice(0, 18)}" ${Math.round(x)}x${Math.round(y)}`); } }
      return { out, over: document.documentElement.scrollWidth - innerWidth }; });
    console.log(w, z + '%', 'page overflow', r.over, r.out.join(' | '));
    if (w === 320 || (w===360 && z===120)) { const y = await p.evaluate(() => document.querySelector('.spec').getBoundingClientRect().top + scrollY - 20); await p.screenshot({ path: `shots/zoomspec-${w}-${z}.png`, fullPage: true, clip: { x: 0, y, width: w, height: w === 390 ? 1500 : 1400 } }); }
    await ctx.close();
  }
  await b.close();
})();
