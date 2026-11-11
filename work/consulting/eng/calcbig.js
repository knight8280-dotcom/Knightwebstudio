const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 600, 820, 1000, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(300);
    for (const job of [400, 5000, 15000, 40000, 250000]) {
      await p.fill('#c-job', String(job)); await p.fill('#c-calls', '10'); await p.fill('#c-callwin', '30'); await p.fill('#c-rate', '150'); await p.fill('#c-hours', '20');
      await p.waitForTimeout(60);
      const r = await p.evaluate(() => { const rc = document.querySelector('#growth-calc .receipt'); const R = rc.getBoundingClientRect(); const cs = getComputedStyle(rc); const padR = parseFloat(cs.paddingRight), padL = parseFloat(cs.paddingLeft); const out = []; for (const el of rc.querySelectorAll('*')) { const e = el.getBoundingClientRect(); if (e.width && (e.right > R.right - padR + 1 || e.left < R.left + padL - 1)) out.push((el.tagName + '.' + el.className + '#' + el.id).toLowerCase() + ' right+' + Math.round(e.right - (R.right - padR)) + ' "' + el.textContent.trim().slice(0, 28) + '"'); }
        const tot = rc.querySelector('.receipt-total'); const tl = tot.querySelector('span').getBoundingClientRect(), tb = tot.querySelector('b').getBoundingClientRect();
        const lines = [...rc.querySelectorAll('.receipt-lines li')].map(li => { const s = li.children[0].getBoundingClientRect(), bb = li.querySelector('b').getBoundingClientRect(); return Math.round(bb.left - s.right); });
        return { receiptW: Math.round(R.width), vw: innerWidth, receiptRight: Math.round(R.right), pageOver: document.documentElement.scrollWidth - innerWidth, month: document.getElementById('r-month').textContent, year: document.getElementById('r-year').textContent, totalWraps: tb.top > tl.bottom - 2, totalH: Math.round(tot.getBoundingClientRect().height), gapNameToValue: lines, out }; });
      console.log(w, 'job=' + job, JSON.stringify(r));
      if (job === 40000 || job === 250000) { const el = await p.$('#growth-calc .receipt'); await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: `calcbig-${w}-${job}.png` }); }
    }
    await ctx.close();
  }
  await b.close();
})();
