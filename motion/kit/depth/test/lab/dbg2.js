process.env.PLAYWRIGHT_BROWSERS_PATH = require('path').resolve(__dirname, '../../../../.browsers-flat');
const { webkit } = require('playwright');
(async () => {
  const b = await webkit.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://localhost:8730/kit/depth/demo.html'); await p.waitForTimeout(500);
  await p.evaluate(() => { const e = document.querySelector('#included .kws-ring'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 80); });
  console.log('raf per second', await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = t => { n++; if (t - t0 < 1000) requestAnimationFrame(f); else r(n); }; requestAnimationFrame(f); })));
  await p.waitForTimeout(3000);
  console.log(await p.evaluate(() => [...document.querySelectorAll('#included .kws-ring-read')].map(r => r.className + ' ' + r.style.transform.slice(-60))));
  await p.screenshot({ path: process.argv[2] });
  await b.close();
})();
