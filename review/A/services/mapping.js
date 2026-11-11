// For every checkout and ?package= link: the words around it, so a wrong plan behind a button would show.
const { launch } = require('./lib');
(async () => {
  const b = await launch();
  for (const [tag, base] of [['new', 'http://localhost:8720'], ['baseline', 'http://localhost:8700']]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route(/onrender\.com|plausible\.io/, r => r.abort());
    console.log('=====', tag);
    for (const p of ['/', '/pricing/', '/consulting/', '/services/', '/privacy/']) {
      const page = await ctx.newPage(); await page.goto(base + p, { waitUntil: 'load' });
      const rows = await page.evaluate(() => [...document.querySelectorAll('a[href*="/checkout/"], a[href*="?package="]')].map(a => {
        // nearest ancestor that also holds a heading or a price
        let e = a.parentElement, ctxText = '';
        for (let i = 0; i < 8 && e; i++, e = e.parentElement) { const t = e.innerText.replace(/\s+/g, ' ').trim(); if (/\$[\d,]+|Free/.test(t) && t.length > a.innerText.length + 8) { ctxText = t; break; } }
        // table cell: use the column header
        const td = a.closest('td,th'); let col = '';
        if (td) { const tr = td.parentElement, idx = [...tr.children].indexOf(td), table = td.closest('table'); const head = table.querySelector('thead tr') || table.querySelector('tr'); col = head && head.children[idx] ? head.children[idx].innerText.replace(/\s+/g, ' ').trim() : ''; }
        return { href: a.getAttribute('href'), text: a.innerText.replace(/\s+/g, ' ').trim(), col, ctx: ctxText.slice(0, 150), vis: a.getBoundingClientRect().height > 0 };
      }));
      for (const r of rows) console.log(p.padEnd(13), r.href.padEnd(36), JSON.stringify(r.text).padEnd(34), r.vis ? '' : '(hidden) ', r.col ? 'COL: ' + r.col.slice(0, 60) : 'CTX: ' + r.ctx);
      await page.close();
    }
    await ctx.close();
  }
  await b.close();
})();
