const { launch } = require('./lib');
(async () => {
  const b = await launch();
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/onrender\.com|plausible\.io/, r => r.abort());
    const page = await ctx.newPage(); await page.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    const rows = await page.evaluate(() => [...document.querySelectorAll('main a[href*="/checkout/?plan="], main a[href*="package=care"], main a[href*="package=onepage"], main a[href*="package=starter"], main a[href*="package=business"], main a[href*="package=commerce"]')].map(a => {
      const cell = a.closest('td,th,[role=cell],li,article,div.tier,section'); const tr = a.closest('tr,[role=row]'); const table = a.closest('table,[role=table]');
      let colHead = '', rowText = '';
      if (cell && tr && table) { const cells = [...tr.children]; const idx = cells.indexOf(a.closest('td,th,[role=cell]')); const rowsAll = [...table.querySelectorAll('tr,[role=row]')];
        // tier names: find, in any other row, the cell at the same index that holds a .tier-name / .spec-name / heading
        for (const r of rowsAll) { const c = r.children[idx]; if (c && c !== cells[idx]) { const n = c.querySelector('.tier-name,.spec-name,h2,h3,h4,b,strong'); if (n) { colHead = n.innerText.replace(/\s+/g, ' ').trim(); break; } } }
        rowText = tr.innerText.replace(/\s+/g, ' ').trim().slice(0, 110); }
      const r = a.getBoundingClientRect();
      // what is visually above this button in the same column: nearest price text above
      return { href: a.getAttribute('href'), text: a.innerText.replace(/\s+/g, ' ').trim().slice(0, 44), colHead, rowIsOwn: rowText, x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), aria: a.getAttribute('aria-label') || '' }; }));
    console.log('--- width', w); for (const r of rows) console.log(r.href.padEnd(34), JSON.stringify(r.text).padEnd(48), '| col:', JSON.stringify(r.colHead), '| aria:', r.aria, '| row:', r.rowIsOwn.slice(0, 90), `| @${r.x},${r.y} ${r.w}x${r.h}`);
    await ctx.close();
  }
  await b.close();
})();
