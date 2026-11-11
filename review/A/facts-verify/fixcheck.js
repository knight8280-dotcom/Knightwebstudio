// Compare live repo (8720) with the scratch copy that has the one-space fix (8731),
// with and without trimming the pill's right margin, at several widths.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const measure = async (page) => page.evaluate(() => [...document.querySelectorAll('.note')].filter(n => n.querySelector('.flag')).map(par => {
    const f = par.querySelector('.flag'), next = f.nextSibling, fr = f.getBoundingClientRect();
    if (!fr.width) return { hidden: true };
    const rr = document.createRange(); const off = next.textContent.search(/\S/);
    rr.setStart(next, off); rr.setEnd(next, off + 1); const g = rr.getBoundingClientRect();
    const same = Math.abs((g.top + g.bottom) / 2 - (fr.top + fr.bottom) / 2) < fr.height;
    return { gap: same ? +(g.left - fr.right).toFixed(1) : 'wrapped', h: Math.round(par.getBoundingClientRect().height), inner: par.innerText.slice(0, 22) };
  }));
  for (const w of [360, 390, 430, 768, 1024, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.route('**/*', r => { const u = new URL(r.request().url()); return u.hostname === 'localhost' ? r.continue() : r.abort(); });
    for (const p of ['/', '/consulting/']) {
      await page.goto('http://localhost:8720' + p); const a = await measure(page);
      await page.goto('http://localhost:8731' + p); const s = await measure(page);
      await page.addStyleTag({ content: '.note .flag{margin-right:var(--s-1)}' }); const t = await measure(page);
      console.log(w, p, '\n  now      ', JSON.stringify(a), '\n  +space   ', JSON.stringify(s), '\n  +space,s1', JSON.stringify(t));
    }
    await ctx.close();
  }
  // no-JS: the calc-nojs note
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8720/consulting/');
  const loc = page.locator('p.note.calc-nojs');
  console.log('nojs visible:', await loc.isVisible(), JSON.stringify(await loc.innerText()).slice(0, 80));
  await loc.screenshot({ path: 'nojs-note-now.png' });
  await page.goto('http://localhost:8720/'); await page.locator('.stop-sum .note').screenshot({ path: 'home-note-now.png' });
  await page.goto('http://localhost:8731/'); await page.locator('.stop-sum .note').screenshot({ path: 'home-note-space.png' });
  await page.addStyleTag({ content: '.note .flag{margin-right:var(--s-1)}' }); await page.locator('.stop-sum .note').screenshot({ path: 'home-note-space-s1.png' });
  await b.close();
})();
