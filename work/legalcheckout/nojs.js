const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const url of ['/privacy/', '/terms/', '/checkout/?plan=starter-deposit', '/checkout/success/?plan=starter-deposit']) {
    for (const [w, h, tag] of [[390, 844, 'm'], [1440, 900, 'd']]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false });
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + url);
      const r = await p.evaluate(() => { const bad = [];
        for (const e of document.querySelectorAll('main *')) { if (e.closest('[hidden], noscript, svg')) continue; const cs = getComputedStyle(e);
          if (+cs.opacity < 1 || cs.visibility === 'hidden') bad.push(e.tagName + '.' + e.className); }
        const st = document.querySelector('#checkout-status'); const ns = document.querySelector('noscript p');
        return { bad, status: st ? getComputedStyle(st).display : null, noscript: ns ? ns.textContent.slice(0, 50) + '… ' + getComputedStyle(ns).display : null,
                 over: document.documentElement.scrollWidth - innerWidth, text: document.querySelector('main').innerText.replace(/\s+/g, ' ').length }; });
      console.log(url.padEnd(42), tag, JSON.stringify(r));
      if (tag === 'm') await p.screenshot({ path: `${process.argv[2]}/nojs-${url.replace(/[^a-z]+/g, '-')}.png`, fullPage: false });
      await ctx.close();
    }
  }
  await b.close();
})();
