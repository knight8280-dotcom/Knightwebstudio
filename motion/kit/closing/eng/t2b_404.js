const { launch, BLOCK } = require('./common');
(async () => {
  const b = await launch();
  for (const url of ['demo.html', 'portable.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html', 'test/notfound-with-kit.html']) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    await c.route(BLOCK, r => r.abort());
    const p = await c.newPage(); const bad = [], errs = [];
    p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
    p.on('requestfailed', r => { if (!BLOCK.test(r.url())) bad.push('FAILED ' + r.url()); });
    p.on('console', m => { if (/error|warning/.test(m.type())) errs.push(m.type() + ': ' + m.text().slice(0, 160)); });
    p.on('pageerror', e => errs.push('PE ' + e.message));
    await p.goto('http://localhost:8730/kit/closing/' + url, { waitUntil: 'load' });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });
    await p.waitForTimeout(1500);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    console.log(url, '| bad responses:', bad.join(' , ') || 'none', '| console:', errs.join(' | ') || 'clean');
    await c.close();
  }
  await b.close();
})();
