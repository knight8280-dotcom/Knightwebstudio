const { webkit, firefox, chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const [name, eng] of [['webkit', webkit], ['firefox', firefox]]) {
    try {
      const b = await eng.launch();
      const p = await b.newPage();
      await p.goto('http://localhost:8720/');
      const ua = await p.evaluate(() => navigator.userAgent);
      console.log(name, 'OK', b.version(), ua, await p.title());
      await b.close();
    } catch (e) {
      console.log(name, 'FAIL', String(e.message).slice(0, 3000));
    }
  }
})();
