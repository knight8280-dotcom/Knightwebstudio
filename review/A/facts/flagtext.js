const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
  for (const path of ['/', '/consulting/']) {
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
    const r = await p.evaluate(() => [...document.querySelectorAll('.flag')].map(f => { const par = f.parentElement; return par.tagName.toLowerCase() + '.' + par.className + ' | textContent: "' + par.textContent.trim().slice(0, 48) + '" | innerText: "' + par.innerText.trim().slice(0, 48).replace(/\n/g, '⏎') + '" | parent display: ' + getComputedStyle(par).display + ' | flag display: ' + getComputedStyle(f).display; }));
    console.log(path); r.forEach(x => console.log('   ' + x));
    try { const snap = await p.locator(path === '/' ? '.stop-sum .note' : '.bigfig .note').first().ariaSnapshot(); console.log('   aria snapshot: ' + snap.slice(0, 120)); } catch (e) { console.log('   (no ariaSnapshot: ' + e.message.slice(0, 60) + ')'); }
  }
  await b.close();
})();
