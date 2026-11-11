const { open, done, close } = require('./lib');
const path = require('path');
(async () => {
  for (const w of [360, 390, 599, 600, 820]) {
    const page = await open('/services/', w);
    await page.addStyleTag({ content: '@media (max-width: 599.98px) { [data-page="services"] .svc-lead > .btn { width: 100%; } }' });
    const r = await page.evaluate(() => { const b = document.querySelector('.svc-lead > a.btn'); return { w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), colW: Math.round(b.parentElement.getBoundingClientRect().width), display: getComputedStyle(b).display, justify: getComputedStyle(b).justifyContent }; });
    console.log('VA-06 css width:100%', w, JSON.stringify(r));
    if (w === 390) { await page.evaluate(() => scrollTo(0, document.querySelector('#website-design').getBoundingClientRect().top + scrollY - 140)); await page.waitForTimeout(300); await page.screenshot({ path: path.join(__dirname, 'fix06_services_390_css.png') }); }
    await done(page);
  }
  await close();
})();
