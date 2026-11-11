const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/privacy/','/terms/','/checkout/','/checkout/?plan=starter-deposit','/checkout/success/','/checkout/success/?plan=essential-care','/404.html'];
(async () => {
  const b = await chromium.launch();
  for (const js of [true, false]) for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, javaScriptEnabled: js });
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
    const p = await ctx.newPage();
    for (const path of PAGES) {
      await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
      await p.waitForTimeout(js ? 400 : 50);
      const res = await p.evaluate(() => [...document.querySelectorAll('[hidden]')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.tagName + '#' + e.id + '.' + e.className + ' => ' + getComputedStyle(e).display + ' :: ' + e.textContent.trim().replace(/\s+/g,' ').slice(0, 80)));
      if (res.length) console.log((js ? 'js ' : 'nojs ') + w + ' ' + path + '\n   ' + res.join('\n   '));
    }
    await ctx.close();
  }
  await b.close(); console.log('done');
})();
