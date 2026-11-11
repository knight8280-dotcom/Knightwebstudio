const pw = require('playwright');
(async () => {
  for (const name of ['firefox', 'webkit']) {
    try { const b = await pw[name].launch(); const p = await b.newPage(); await p.goto('http://localhost:8720/work/'); console.log(name, 'OK', await p.title(), await b.version()); await b.close(); }
    catch (e) { console.log(name, 'FAILED', String(e).split('\n').slice(0, 6).join(' | ').slice(0, 600)); }
  }
})();
