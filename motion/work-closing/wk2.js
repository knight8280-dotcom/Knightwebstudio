// Same scroll positions of the light kit's demo in WebKit and Chromium, side by side: are several live layers on one screen right in WebKit?
const path = require('path');
(async () => {
  for (const eng of [process.argv[2]]) {
    if (eng === 'webkit') process.env.PLAYWRIGHT_BROWSERS_PATH = __dirname + '/../.browsers-flat';
    const pw = require('playwright');
    const b = await pw[eng].launch(eng === 'chromium' ? { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] } : {});
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto('http://localhost:8730/kit/light/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    let i = 0;
    for (const f of [0, .18, .36, .55, .75]) { await p.evaluate(y => scrollTo(0, y), Math.round(H * f)); await p.waitForTimeout(1600); await p.screenshot({ path: `ob/l-${eng}-${i++}.png` }); }
    await b.close();
  }
})();
