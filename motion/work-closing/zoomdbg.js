const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [url, w] of [['test/pricing-with-kit.html', 390], ['test/pricing-with-kit.html', 760], ['portable.html', 390], ['portable.html', 760], ['test/start-with-kit.html', 390]]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await p.goto('http://localhost:8730/kit/closing/' + url, { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: 'html{font-size:200%}' }); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const out = []; for (const e of document.querySelectorAll('body *')) { const q = e.getBoundingClientRect(); if (q.right > innerWidth + 1 && q.width > 0 && getComputedStyle(e).position !== 'fixed') out.push((e.closest('.kws-close,.kws-appt,.kws-foot') ? 'KIT ' : 'site ') + e.tagName + '.' + String(e.className.baseVal ?? e.className).slice(0, 40) + ' right ' + Math.round(q.right)); } return { over: document.documentElement.scrollWidth - innerWidth, out: out.slice(0, 14) }; });
    console.log(url, w, JSON.stringify(r, null, 0));
    await p.close();
  }
  await b.close();
})();
