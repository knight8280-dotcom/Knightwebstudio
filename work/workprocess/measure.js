const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2]; const w = +(process.argv[3]||390);
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: w, height: 844 }, colorScheme: 'light' });
  const p = await c.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const out = { total: document.documentElement.scrollHeight };
    const q = s => [...document.querySelectorAll(s)].map(e => Math.round(e.getBoundingClientRect().height));
    out.topbar = q('.topbar'); out.header = q('.site-header'); out.main = q('main'); out.sections = [...document.querySelectorAll('main > *')].map(e => (e.className||e.tagName) + ':' + Math.round(e.getBoundingClientRect().height));
    out.footer = q('.site-footer');
    return out; });
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
