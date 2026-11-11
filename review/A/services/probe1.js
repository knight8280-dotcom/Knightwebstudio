const { launch, watch } = require('./lib');
(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const log = []; watch(page, log);
  await page.goto('http://localhost:8720/checkout/?plan=starter-deposit', { waitUntil: 'load', timeout: 60000 });
  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(5000);
    const st = await page.evaluate(() => { const s = document.getElementById('checkout-status'); const f = document.getElementById('checkout-form'); return { status: s.textContent, hidden: s.hidden, cls: s.className, formH: f.getBoundingClientRect().height, iframes: f.querySelectorAll('iframe').length }; });
    console.log(i, JSON.stringify(st));
    if (st.hidden || /error/.test(st.cls)) break;
  }
  await page.screenshot({ path: 'probe1.png', fullPage: true });
  console.log(JSON.stringify(log.filter(l => l.t !== 'response' || !/\.(png|svg|woff2?|css)(\?|$)/.test(l.url)), null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
