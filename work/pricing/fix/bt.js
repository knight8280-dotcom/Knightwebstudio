// Smoke test: can Firefox and WebKit launch from the scratch browser folder?
const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const name of ['firefox', 'webkit']) {
    try {
      const b = await pw[name].launch();
      const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
      await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
      console.log(name, 'ok', await p.evaluate(() => navigator.userAgent));
      await b.close();
    } catch (e) { console.log(name, 'FAILED', String(e).slice(0, 400)); }
  }
})();
