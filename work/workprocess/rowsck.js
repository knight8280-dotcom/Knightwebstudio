const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 360, height: 740 } }); const p = await c.newPage();
  await p.goto('http://localhost:8720/process/'); await p.waitForTimeout(300);
  for (let w = 320; w <= 1920; w += 20) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(40);
    const r = await p.evaluate(() => { const out = [];
      for (const d of document.querySelectorAll('.steps dl div')) if (d.getBoundingClientRect().height > 32) out.push('WRAP ' + d.textContent.trim().slice(0, 30));
      for (const li of document.querySelectorAll('.steps > li')) { const h2 = li.querySelector('h2'); if (h2.getBoundingClientRect().height > 40) out.push('TITLE2 ' + h2.textContent); }
      const t = document.querySelector('.ticket').getBoundingClientRect(); const s = document.querySelector('.stamp').getBoundingClientRect(); const cta = document.querySelector('.cta-band').getBoundingClientRect();
      if (s.bottom > cta.top - 16) out.push('STAMP near band ' + Math.round(cta.top - s.bottom));
      return out; });
    if (r.length) console.log(w, r.join(' | ')); }
  console.log('done'); await b.close(); })();
