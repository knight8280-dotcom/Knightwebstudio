const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  for (const t of ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville']) {
    await p.goto(`http://localhost:8720/web-design-${t}/`, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => ({
      booking: [...document.querySelectorAll('main [data-booking]')].map(a => a.textContent.trim() + ' -> ' + a.getAttribute('href') + ' ' + (a.target || '') + ' ' + (a.rel || '')),
      barBefore: document.getElementById('mobile-cta').classList.contains('show'),
      year: document.getElementById('year') && document.getElementById('year').textContent,
      h1: document.querySelector('h1').innerText.replace(/\n/g, ' | '),
      h1a11y: document.querySelector('h1').textContent,
      title: document.title,
    }));
    await p.locator('a.price-strip').tap(); await p.waitForTimeout(900);
    const after = await p.evaluate(() => ({ hash: location.hash, pricingTop: Math.round(document.getElementById('pricing').getBoundingClientRect().top), header: Math.round(document.getElementById('site-header').getBoundingClientRect().bottom), bar: document.getElementById('mobile-cta').classList.contains('show') }));
    // theme toggle
    await p.locator('#theme-toggle').tap(); await p.waitForTimeout(200);
    const theme = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await p.locator('#theme-toggle').tap();
    // open first FAQ by tap
    await p.locator('summary').first().scrollIntoViewIfNeeded(); await p.locator('summary').first().tap(); await p.waitForTimeout(300);
    const faq = await p.evaluate(() => { const d = document.querySelector('details'); return { open: d.open, body: Math.round(d.querySelector('.faq-body').getBoundingClientRect().height), sum: Math.round(d.querySelector('summary').getBoundingClientRect().height) }; });
    console.log(t, JSON.stringify(r), JSON.stringify(after), 'theme after toggle:', theme, JSON.stringify(faq));
  }
  console.log('errors:', errs);
  await b.close();
})();
