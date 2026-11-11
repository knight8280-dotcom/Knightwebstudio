// Text-only enlargement: node zoom.js WIDTH FONTPX  -> which elements in main stick out of the viewport
const { chromium } = require('playwright');
(async () => {
  const w = +(process.argv[2] || 390), f = +(process.argv[3] || 24);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(300);
  await p.addStyleTag({ content: 'html { font-size: ' + f + 'px; }' }); await p.waitForTimeout(300);
  const r = await p.evaluate((w) => {
    const out = [];
    for (const e of document.querySelectorAll('main *')) {
      const rc = e.getBoundingClientRect();
      if (rc.width && rc.right > w + 1 && !e.closest('.sr-only')) out.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ').join('.') + ' right=' + Math.round(rc.right));
    }
    return { scrollW: document.documentElement.scrollWidth, mainOver: out.slice(0, 25), n: out.length };
  }, w);
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
