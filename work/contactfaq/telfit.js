const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 980, height: 900 } });
  await p.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
  await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' });
  for (const w of [360, 380, 600, 760, 980, 1000, 1040, 1100, 1180, 1280, 1440, 1920]) {
    await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const t = document.querySelector('.talk-tel'), a = document.querySelector('.talk'), c = document.querySelector('.page-head-split');
      const range = document.createRange(); range.selectNodeContents(t); const tr = range.getBoundingClientRect();
      return { telTextRight: Math.round(tr.right), asideRight: Math.round(a.getBoundingClientRect().right), asideW: Math.round(a.getBoundingClientRect().width), containerRight: Math.round(c.getBoundingClientRect().right), fs: getComputedStyle(t).fontSize };
    });
    console.log(w, JSON.stringify(r), r.telTextRight > r.containerRight ? 'OVERFLOWS' : 'ok');
  }
  await b.close();
})();
