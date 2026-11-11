// Usage: node measure.js URL [URL...]  -> page and block heights at 390 wide
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const urls = process.argv.slice(2);
  for (const w of [390]) {
    const p = await b.newPage({ viewport: { width: w, height: 844 } });
    for (const u of urls) {
      await p.goto(u, { waitUntil: 'networkidle' });
      const r = await p.evaluate(() => {
        const q = s => document.querySelector(s);
        const h = e => e ? Math.round(e.getBoundingClientRect().height) : null;
        const secs = [...document.querySelectorAll('main > *')].map(e => (e.id || e.className.split(' ')[0]) + ':' + h(e));
        return { total: document.documentElement.scrollHeight, header: h(q('.site-header')), topbar: h(q('.topbar')), main: h(q('main')), footer: h(q('.site-footer')), secs };
      });
      console.log(w, u, JSON.stringify(r));
    }
    await p.close();
  }
  await b.close();
})();
