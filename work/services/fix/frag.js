// Every menu link: does it land with its target visible under the header, and does a closed row open?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); console.log('chromium', b.version());
  for (const [w, h, js] of [[390, 844, true], [1440, 900, true], [820, 1100, true], [390, 844, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, javaScriptEnabled: js });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
    const ids = await p.$$eval('.menu a', as => as.map(a => a.getAttribute('href').slice(1)));
    for (const id of ids) {
      await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(250);
      await p.click(`.menu a[href="#${id}"]`); await p.waitForTimeout(1300);
      const r = await p.$eval('#' + id, (t, js) => {
        const d = t.closest('details'); const hdr = document.getElementById('site-header').getBoundingClientRect().bottom;
        const head = d ? d.querySelector('summary') : (t.querySelector('h3') || t);
        const hr = head.getBoundingClientRect();
        return { row: d ? (d.open ? 'OPEN' : 'CLOSED') : 'lead', headerBottom: Math.round(hdr), nameTop: Math.round(hr.top), nameBottom: Math.round(hr.bottom), targetTop: Math.round(t.getBoundingClientRect().top), vh: innerHeight };
      }, js);
      const ok = r.row !== 'CLOSED' && r.nameTop >= (js ? r.headerBottom : 0) && r.nameTop < r.vh * .5;
      console.log(w, js ? 'js' : 'nojs', ('#' + id).padEnd(20), ok ? 'ok  ' : 'BAD ', JSON.stringify(r));
    }
    // deep link from another page
    for (const id of ['ecommerce', 'seo', 'google-reviews', 'care']) {
      await p.goto('http://localhost:8720/pricing/'); await p.goto('http://localhost:8720/services/#' + id); await p.waitForTimeout(1200);
      const r = await p.$eval('#' + id, t => { const d = t.closest('details'); const s = d ? d.querySelector('summary') : t; return { row: d ? (d.open ? 'OPEN' : 'CLOSED') : 'lead', nameTop: Math.round(s.getBoundingClientRect().top), headerBottom: Math.round(document.getElementById('site-header').getBoundingClientRect().bottom) }; });
      console.log(w, js ? 'js' : 'nojs', 'deep link #' + id, JSON.stringify(r));
    }
    // a row closed by hand reopens from its menu link
    await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(250);
    await p.click('.menu a[href="#brand"]'); await p.waitForTimeout(900);
    await p.$eval('#brand', t => { t.closest('details').open = false; }); await p.evaluate(() => scrollTo(0, 500)); await p.waitForTimeout(300);
    await p.click('.menu a[href="#brand"]'); await p.waitForTimeout(900);
    console.log(w, js ? 'js' : 'nojs', 'closed by hand, tapped again:', await p.$eval('#brand', t => t.closest('details').open ? 'OPEN' : 'CLOSED'));
    if (w === 390 && js) { await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(250); await p.click('.menu a[href="#ecommerce"]'); await p.waitForTimeout(1300); await p.screenshot({ path: __dirname + '/land-390-ecommerce.png' }); }
    if (w === 1440) { await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(250); await p.click('.menu a[href="#seo"]'); await p.waitForTimeout(1300); await p.screenshot({ path: __dirname + '/land-1440-seo.png' }); }
    await ctx.close();
  }
  await b.close();
})();
