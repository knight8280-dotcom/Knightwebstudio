// Measure the wordmark's width in em for the site's display face (and a few fallbacks)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:8730/kit/closing/demo.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => {
    const out = {};
    for (const [name, css] of [['fraunces', '600 100px Fraunces'], ['georgia', '600 100px Georgia'], ['fallback', '600 100px "Fraunces Fallback"'], ['palatino', '600 100px "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif']]) {
      const s = document.createElement('span');
      s.textContent = 'KnightWebstudio';
      s.style.cssText = 'position:absolute;white-space:nowrap;font:' + css + ';font-variation-settings:"SOFT" 100;letter-spacing:-.03em';
      document.body.append(s);
      out[name] = s.getBoundingClientRect().width / 100;
      s.remove();
    }
    return out;
  });
  console.log(r);
  await b.close();
})();
