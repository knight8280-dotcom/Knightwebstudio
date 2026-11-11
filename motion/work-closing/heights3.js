const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const out = {};
  for (const [w, h] of [[360, 740], [390, 844], [820, 1180], [1280, 720], [1440, 900], [1920, 1080]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.route('**/shader.js', r => r.abort());
    await p.goto('http://localhost:8730/kit/closing/demo.html', { waitUntil: 'networkidle' });
    const d = await p.evaluate(() => { const H = s => Math.round(document.querySelector(s).getBoundingClientRect().height); return { strip: H('.kws-close--strip'), card: H('.kws-close--card'), statement: H('#close-sign') && Math.round(document.querySelector('#close-sign').closest('section').getBoundingClientRect().height), slimStart: Math.round(document.querySelectorAll('.demo-frame')[0].getBoundingClientRect().height), slimBare: Math.round(document.querySelectorAll('.demo-frame')[1].getBoundingClientRect().height), foot: H('footer.kws-foot'), scene: H('footer .kws-skyline') }; });
    await p.goto('http://localhost:8730/kit/closing/test/pricing-with-kit.html', { waitUntil: 'networkidle' });
    const q = await p.evaluate(() => ({ cardPricing: Math.round(document.querySelector('.kws-close').getBoundingClientRect().height), page: document.documentElement.scrollHeight }));
    await p.goto('http://localhost:8730/pricing/', { waitUntil: 'networkidle' });
    const t = await p.evaluate(() => ({ oldBand: Math.round(document.querySelector('.cta-band').getBoundingClientRect().height), oldFoot: Math.round(document.querySelector('.site-footer').getBoundingClientRect().height), oldPage: document.documentElement.scrollHeight }));
    out[w] = Object.assign(d, q, t);
    await ctx.close();
  }
  require('fs').writeFileSync(__dirname + '/heights.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out));
  await b.close();
})();
