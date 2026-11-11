const { webkit } = require('playwright');
(async () => {
  try {
    const b = await webkit.launch();
    const p = await b.newPage();
    await p.goto('http://localhost:8730/kit/closing/portable.html');
    console.log('WEBKIT OK', await b.version(), await p.title());
    await b.close();
  } catch (e) { console.log('WEBKIT FAIL', String(e).slice(0, 1500)); }
})();
