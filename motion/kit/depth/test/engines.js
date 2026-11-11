// node test/engines.js <url> <selector> <outprefix> [w] [h] [scrollSel] [off]
// For Firefox and WebKit run it again with PLAYWRIGHT_BROWSERS_PATH=<motion>/.browsers-flat
// Screenshots one element in every engine that can be launched here (headless shell, full Chromium, Firefox, WebKit).
const pw = require('playwright');
const [url, sel, out, w = 390, h = 844, at = sel, off = -120] = process.argv.slice(2);
(async () => {
  const tries = [['shell', () => pw.chromium.launch()], ['chrome', () => pw.chromium.launch({ channel: 'chromium' })],
    ['firefox', () => pw.firefox.launch()], ['webkit', () => pw.webkit.launch()]];
  for (const [name, launch] of tries) {
    let b; try { b = await launch(); } catch (e) { console.log('SKIP', name, String(e).split('\n')[0].slice(0, 120)); continue; }
    try {
      const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 }); const errs = [];
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(400);
      await p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [at, +off]);
      await p.waitForTimeout(1200);
      await p.locator(sel).first().screenshot({ path: `${__dirname}/../shots/${out}-${name}.png` });
      console.log('OK', name, b.version(), errs.join('|'));
    } catch (e) { console.log('FAIL', name, String(e).split('\n')[0]); }
    await b.close();
  }
})();
