// node measure.js URL [width] [selectors...] : prints heights of blocks
const { chromium } = require('playwright');
(async () => {
  const [url, w = '390', ...sels] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: 844 }, isMobile: +w < 700, hasTouch: +w < 700 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const r = await p.evaluate((sels) => {
    const out = { page: document.documentElement.scrollHeight };
    const list = sels.length ? sels : ['.topbar', '.site-header', 'main > *', '.site-footer'];
    for (const s of list) document.querySelectorAll(s).forEach((e, i) => { const r = e.getBoundingClientRect(); out[s + '#' + i + (e.id ? ' ' + e.id : '') + ' ' + (e.className || '').toString().slice(0, 40)] = Math.round(r.top + scrollY) + ' +' + Math.round(r.height); });
    return out;
  }, sels);
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
