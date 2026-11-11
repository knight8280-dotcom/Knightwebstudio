const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); await page.goto('http://localhost:8720/consulting/', { waitUntil: 'load' });
  const y = await page.evaluate(() => { const top = el => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; }; const c = document.getElementById('c-job'); const sec = c.closest('section'); return { cjob: top(c), sec: top(sec), secH: sec.offsetHeight, ledger: top(document.querySelector('.ledger')), note: sec.innerText.match(/[^.\n]*(JavaScript|script)[^.\n]*\./i) }; });
  console.log(JSON.stringify(y));
  await browser.close();
})();
