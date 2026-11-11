const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.route(/\/(arc|spotlight)\.js/, r => r.abort());
  await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' });
  const before = await p.evaluate(() => document.querySelector('.kws-arc').outerHTML);
  await p.unroute(/\/(arc|spotlight)\.js/);
  await p.addScriptTag({ url: 'http://localhost:8730/kit/flat/arc.js' }); await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const el = document.querySelector('.kws-arc'); const off = KWS.arc.mount(el); off(); return el.outerHTML; });
  for (let i = 0; i < before.length; i++) if (before[i] !== r[i]) { console.log(i, JSON.stringify(before.slice(i - 80, i + 80)), '\n', JSON.stringify(r.slice(i - 80, i + 80))); break; }
  console.log(before.length, r.length, before === r);
  await b.close();
})();
